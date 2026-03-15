// src/services/uploadService.js
import { supabase } from '../lib/supabase'

const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// ── File validation rules (mirrors server-side rules) ────────────────────

export const FILE_RULES = {
  content: {
    maxSizeBytes: 500 * 1024 * 1024,
    maxSizeMB: 500,
    allowedExtensions: [
      'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp',
      'mp4', 'mov', 'webm',
      'zip',
      'pptx', 'docx', 'xlsx',
      'txt', 'csv', 'json',
    ],
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/webm',
      'application/zip', 'application/x-zip-compressed',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv', 'application/json',
      'application/octet-stream',
    ],
  },
  sponsor: {
    maxSizeBytes: 20 * 1024 * 1024,
    maxSizeMB: 20,
    allowedExtensions: ['mp4', 'mov', 'webm', 'avi'],
    allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/avi'],
  },
  assets: {
    maxSizeBytes: 100 * 1024 * 1024,
    maxSizeMB: 100,
    allowedExtensions: [
      'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp',
      'mp4', 'mov', 'webm', 'zip',
      'pptx', 'docx', 'xlsx', 'txt',
    ],
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/webm',
      'application/zip',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
  },
}

// ── Client-side validation ────────────────────────────────────────────────

export const validateFile = (file, bucket = 'content') => {
  const rules = FILE_RULES[bucket]
  if (!rules) return { valid: false, error: 'Invalid bucket type.' }

  if (file.size > rules.maxSizeBytes) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${rules.maxSizeMB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
    }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!rules.allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File type .${ext} is not supported. Allowed types: ${rules.allowedExtensions.join(', ')}.`,
    }
  }

  return { valid: true, error: null }
}

// ── Format file size for display ─────────────────────────────────────────

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── Get file emoji for display ────────────────────────────────────────────

export const getFileEmoji = (fileName, mimeType = '') => {
  const ext = fileName?.split('.').pop()?.toLowerCase()
  if (ext === 'pdf' || mimeType === 'application/pdf') return '📄'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || mimeType.startsWith('image/')) return '🖼️'
  if (['mp4', 'mov', 'webm', 'avi'].includes(ext) || mimeType.startsWith('video/')) return '🎬'
  if (['zip', 'rar', '7z'].includes(ext)) return '📦'
  if (['pptx', 'ppt'].includes(ext)) return '📊'
  if (['docx', 'doc'].includes(ext)) return '📝'
  if (['xlsx', 'csv'].includes(ext)) return '📈'
  if (['txt', 'md'].includes(ext)) return '📋'
  if (['json', 'js', 'ts', 'py', 'css', 'html'].includes(ext)) return '💾'
  return '📎'
}

// ── Get auth headers ──────────────────────────────────────────────────────

const getAuthHeaders = async () => {
  // Try to get a fresh session first (handles expired tokens)
  const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
  
  if (refreshedSession?.access_token) {
    return {
      'Authorization': `Bearer ${refreshedSession.access_token}`,
      'Content-Type': 'application/json',
    }
  }
  
  // Fallback: try cached session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated. Please sign in and try again.')
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

// ── Main upload function ──────────────────────────────────────────────────
//
// Usage:
//   const result = await uploadFile(file, 'content', {
//     onProgress: (percent) => setProgress(percent),
//     onStageChange: (stage) => setStage(stage),
//   })
//   // result = { fileId, r2Key, originalName, mimeType, sizeBytes }

export const uploadFile = async (file, bucket = 'content', options = {}) => {
  const {
    onProgress = () => {},
    onStageChange = () => {},
    signal, // AbortController signal for cancellation
  } = options

  // ── Step 1: Client-side validation ──────────────────────────────────
  onStageChange('validating')
  const validation = validateFile(file, bucket)
  if (!validation.valid) throw new Error(validation.error)

  // ── Step 2: Get presigned URL from Edge Function ─────────────────────
  onStageChange('preparing')
  onProgress(5)

  const headers = await getAuthHeaders()

  const urlResponse = await fetch(`${EDGE_FUNCTION_BASE}/generate-upload-url`, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      bucket,
    }),
  })

  if (!urlResponse.ok) {
    const err = await urlResponse.json()
    throw new Error(err.error || 'Failed to prepare upload.')
  }

  const { fileId, r2Key, presignedUrl } = await urlResponse.json()
  onProgress(10)

  // ── Step 3: Upload directly to R2 ────────────────────────────────────
  onStageChange('uploading')

  await uploadWithProgress(file, presignedUrl, (percent) => {
    // Map 10% to 90% for the actual upload progress
    onProgress(10 + Math.floor(percent * 0.8))
  }, signal)

  onProgress(90)

  // ── Step 4: Confirm upload with Supabase ─────────────────────────────
  onStageChange('confirming')

  const confirmResponse = await fetch(`${EDGE_FUNCTION_BASE}/confirm-upload`, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({ fileId }),
  })

  if (!confirmResponse.ok) {
    const err = await confirmResponse.json()
    throw new Error(err.error || 'Failed to confirm upload.')
  }

  onProgress(100)
  onStageChange('complete')

  return {
    fileId,
    r2Key,
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  }
}

// ── XMLHttpRequest upload with real progress ──────────────────────────────
// fetch() does not support upload progress. XHR does.

const uploadWithProgress = (file, presignedUrl, onProgress, signal) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200 || xhr.status === 204) {
        console.log('[Upload] R2 PUT succeeded:', xhr.status)
        resolve()
      } else {
        console.error('[Upload] R2 PUT failed:', xhr.status, xhr.responseText)
        reject(new Error(`Upload to storage failed (HTTP ${xhr.status}). Please try again.`))
      }
    })

    xhr.addEventListener('error', (e) => {
      console.error('[Upload] XHR network error:', e)
      reject(new Error('Upload failed due to a network error. Check your connection and try again.'))
    })
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled.')))

    // Support AbortController for cancellation
    signal?.addEventListener('abort', () => xhr.abort())

    console.log('[Upload] Starting PUT to R2, file size:', file.size, 'type:', file.type)
    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.send(file)
  })
}

// ── Get download URL ──────────────────────────────────────────────────────

export const getDownloadUrl = async ({
  fileId,
  linkSlug,
  unlockType,
  sessionKey,
  forceDownload = true,
}) => {
  const headers = { 'Content-Type': 'application/json' }

  // Add auth header if user is logged in
  try {
    const authHeaders = await getAuthHeaders()
    Object.assign(headers, authHeaders)
  } catch {
    // Anonymous viewer — no auth header
  }

  const response = await fetch(`${EDGE_FUNCTION_BASE}/get-download-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileId, linkSlug, unlockType, sessionKey, forceDownload }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Could not get download URL.')
  }

  const { downloadUrl, expiresIn } = await response.json()
  return { downloadUrl, expiresIn }
}

// ── Delete a file ─────────────────────────────────────────────────────────

export const deleteFile = async (fileId) => {
  const headers = await getAuthHeaders()

  const response = await fetch(`${EDGE_FUNCTION_BASE}/delete-file`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileId }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to delete file.')
  }

  return true
}
