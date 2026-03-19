// src/services/chatUploadService.ts
// Upload service specifically for chat media sharing.
// Reuses the existing generate-upload-url / confirm-upload Edge Functions.

import { supabase } from '../lib/supabase'
import { compressImageForChat } from '../utils/imageCompressor'
import type { MediaCategory } from '../utils/chatMediaHelpers'
import { getMediaCategory, savePendingUpload, clearPendingUpload } from '../utils/chatMediaHelpers'

const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// ── Auth headers ──────────────────────────────────────────────────────────

const getAuthHeaders = async () => {
  const { data: { session: refreshed } } = await supabase.auth.refreshSession()
  if (refreshed?.access_token) {
    return {
      'Authorization': `Bearer ${refreshed.access_token}`,
      'Content-Type': 'application/json',
    }
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated.')
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface ChatUploadResult {
  mainR2Key: string
  thumbnailR2Key: string | null
  mainFileId: string
  thumbnailFileId: string | null
  originalName: string
  originalMimeType: string
  originalSizeBytes: number
  mediaCategory: MediaCategory
  isPro: boolean
}

export interface ChatUploadCallbacks {
  onProgress: (percent: number) => void
  onStageChange: (stage: 'compressing' | 'preparing' | 'uploading' | 'confirming' | 'complete') => void
  signal?: AbortSignal
}

// ── XHR upload with progress ──────────────────────────────────────────────

const uploadToR2 = (
  file: File,
  presignedUrl: string,
  onProgress: (pct: number) => void,
  signal?: AbortSignal
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200 || xhr.status === 204) {
        resolve()
      } else {
        reject(new Error(`Upload failed (HTTP ${xhr.status})`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Upload failed due to network error.')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled.')))

    signal?.addEventListener('abort', () => xhr.abort())

    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.send(file)
  })
}

// ── Image upload (with thumbnail, 2 Edge Function invocations) ────────────

const uploadChatImage = async (
  file: File,
  callbacks: ChatUploadCallbacks
): Promise<ChatUploadResult> => {
  const { onProgress, onStageChange, signal } = callbacks
  const originalName = file.name
  const originalMimeType = file.type
  const originalSizeBytes = file.size

  // Step 1: Compress
  onStageChange('compressing')
  onProgress(0)
  const { compressed, thumbnail } = await compressImageForChat(file)
  onProgress(5)

  // Step 2: Get presigned URLs (1 invocation)
  onStageChange('preparing')
  const headers = await getAuthHeaders()

  const urlRes = await fetch(`${EDGE_FUNCTION_BASE}/generate-upload-url`, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      purpose: 'chat_media_with_thumbnail',
      mainFile: {
        fileName: compressed.name,
        fileSize: compressed.size,
        contentType: compressed.type,
      },
      thumbnailFile: {
        fileName: thumbnail.name,
        fileSize: thumbnail.size,
        contentType: thumbnail.type,
      },
    }),
  })

  if (!urlRes.ok) {
    const err = await urlRes.json().catch(() => ({ error: 'Failed to prepare upload' }))
    throw new Error(err.error || 'Failed to prepare upload')
  }

  const urlData = await urlRes.json()
  onProgress(10)

  // Step 3: Upload both files in parallel
  onStageChange('uploading')

  const mainTotalBytes = compressed.size + thumbnail.size
  let mainUploaded = 0
  let thumbUploaded = 0

  await Promise.all([
    uploadToR2(compressed, urlData.mainPresignedUrl, (pct) => {
      mainUploaded = (pct / 100) * compressed.size
      const combinedPct = ((mainUploaded + thumbUploaded) / mainTotalBytes) * 100
      onProgress(10 + Math.floor(combinedPct * 0.8))
    }, signal),
    uploadToR2(thumbnail, urlData.thumbnailPresignedUrl, (pct) => {
      thumbUploaded = (pct / 100) * thumbnail.size
      const combinedPct = ((mainUploaded + thumbUploaded) / mainTotalBytes) * 100
      onProgress(10 + Math.floor(combinedPct * 0.8))
    }, signal),
  ])

  onProgress(90)

  // Step 4: Confirm (1 invocation)
  onStageChange('confirming')

  const confirmRes = await fetch(`${EDGE_FUNCTION_BASE}/confirm-upload`, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      mainFileId: urlData.mainFileId,
      thumbnailFileId: urlData.thumbnailFileId,
    }),
  })

  if (!confirmRes.ok) {
    const err = await confirmRes.json().catch(() => ({ error: 'Failed to confirm upload' }))
    throw new Error(err.error || 'Failed to confirm upload')
  }

  // Save pending for orphan cleanup
  savePendingUpload([urlData.mainFileId, urlData.thumbnailFileId])

  onProgress(100)
  onStageChange('complete')

  return {
    mainR2Key: urlData.mainR2Key,
    thumbnailR2Key: urlData.thumbnailR2Key,
    mainFileId: urlData.mainFileId,
    thumbnailFileId: urlData.thumbnailFileId,
    originalName,
    originalMimeType,
    originalSizeBytes,
    mediaCategory: 'image',
    isPro: urlData.isPro || false,
  }
}

// ── Non-image upload (no thumbnail, 2 Edge Function invocations) ──────────

const uploadChatFile = async (
  file: File,
  callbacks: ChatUploadCallbacks
): Promise<ChatUploadResult> => {
  const { onProgress, onStageChange, signal } = callbacks
  const originalName = file.name
  const originalMimeType = file.type
  const originalSizeBytes = file.size
  const category = getMediaCategory(file.type) || 'document'

  // Step 1: Get presigned URL
  onStageChange('preparing')
  onProgress(5)
  const headers = await getAuthHeaders()

  const urlRes = await fetch(`${EDGE_FUNCTION_BASE}/generate-upload-url`, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      purpose: 'chat_media',
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || 'application/octet-stream',
    }),
  })

  if (!urlRes.ok) {
    const err = await urlRes.json().catch(() => ({ error: 'Failed to prepare upload' }))
    throw new Error(err.error || 'Failed to prepare upload')
  }

  const urlData = await urlRes.json()
  onProgress(10)

  // Step 2: Upload
  onStageChange('uploading')

  await uploadToR2(file, urlData.presignedUrl, (pct) => {
    onProgress(10 + Math.floor(pct * 0.8))
  }, signal)

  onProgress(90)

  // Step 3: Confirm
  onStageChange('confirming')

  const confirmRes = await fetch(`${EDGE_FUNCTION_BASE}/confirm-upload`, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({ fileId: urlData.fileId }),
  })

  if (!confirmRes.ok) {
    const err = await confirmRes.json().catch(() => ({ error: 'Failed to confirm upload' }))
    throw new Error(err.error || 'Failed to confirm upload')
  }

  savePendingUpload([urlData.fileId])

  onProgress(100)
  onStageChange('complete')

  return {
    mainR2Key: urlData.r2Key,
    thumbnailR2Key: null,
    mainFileId: urlData.fileId,
    thumbnailFileId: null,
    originalName,
    originalMimeType,
    originalSizeBytes,
    mediaCategory: category,
    isPro: urlData.isPro || false,
  }
}

// ── Main entry point ──────────────────────────────────────────────────────

export const uploadChatMedia = async (
  file: File,
  callbacks: ChatUploadCallbacks
): Promise<ChatUploadResult> => {
  const isImage = file.type.startsWith('image/')

  if (isImage) {
    return uploadChatImage(file, callbacks)
  } else {
    return uploadChatFile(file, callbacks)
  }
}

// ── Delete uploaded files (cleanup) ───────────────────────────────────────

export const deleteChatUpload = async (fileIds: string[]): Promise<void> => {
  const headers = await getAuthHeaders()

  for (const fileId of fileIds) {
    try {
      await fetch(`${EDGE_FUNCTION_BASE}/delete-file`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileId }),
      })
    } catch (err) {
      console.error('Failed to delete file:', fileId, err)
    }
  }

  clearPendingUpload(fileIds)
}
