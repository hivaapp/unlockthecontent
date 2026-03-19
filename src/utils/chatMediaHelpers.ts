// src/utils/chatMediaHelpers.ts
// Shared helpers for chat media file sharing

// ── Supported MIME types ──────────────────────────────────────────────────

export const SUPPORTED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  document: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ],
  audio: ['audio/mpeg', 'audio/mp4', 'audio/wav'],
}

const ALL_SUPPORTED = [
  ...SUPPORTED_MIME_TYPES.image,
  ...SUPPORTED_MIME_TYPES.video,
  ...SUPPORTED_MIME_TYPES.document,
  ...SUPPORTED_MIME_TYPES.audio,
]

export const ACCEPT_STRING = ALL_SUPPORTED.join(',')

// ── File size limits ──────────────────────────────────────────────────────

export const FILE_SIZE_LIMITS = {
  free: 10 * 1024 * 1024,    // 10MB
  pro: 100 * 1024 * 1024,    // 100MB
}

// ── Category detection ────────────────────────────────────────────────────

export type MediaCategory = 'image' | 'video' | 'document' | 'audio'

export const getMediaCategory = (mimeType: string): MediaCategory | null => {
  if (SUPPORTED_MIME_TYPES.image.includes(mimeType)) return 'image'
  if (SUPPORTED_MIME_TYPES.video.includes(mimeType)) return 'video'
  if (SUPPORTED_MIME_TYPES.document.includes(mimeType)) return 'document'
  if (SUPPORTED_MIME_TYPES.audio.includes(mimeType)) return 'audio'
  return null
}

// ── Validation ────────────────────────────────────────────────────────────

export const validateChatFile = (file: File, isPro: boolean): { valid: boolean; error: string | null } => {
  if (!ALL_SUPPORTED.includes(file.type)) {
    return { valid: false, error: 'This file type is not supported.' }
  }

  const maxSize = isPro ? FILE_SIZE_LIMITS.pro : FILE_SIZE_LIMITS.free
  if (file.size > maxSize) {
    if (!isPro) {
      return { valid: false, error: 'Files over 10MB require Pro plan.' }
    }
    return { valid: false, error: 'File is too large. Maximum size is 100MB.' }
  }

  return { valid: true, error: null }
}

// ── CDN URL construction ──────────────────────────────────────────────────

export const getCdnUrl = (r2Key: string): string => {
  const base = import.meta.env.VITE_R2_PUBLIC_URL || ''
  return `${base}/${r2Key}`
}

// ── Expiry checking (pure client-side, no network requests) ───────────────

export const getMediaExpiry = (createdAt: string, isProStorage: boolean): {
  isExpired: boolean
  daysRemaining: number
} => {
  if (isProStorage) {
    return { isExpired: false, daysRemaining: Infinity }
  }

  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const isExpired = daysSinceCreated >= 30
  const daysRemaining = 30 - daysSinceCreated

  return { isExpired, daysRemaining }
}

// ── Format file size ──────────────────────────────────────────────────────

export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── File type emoji ───────────────────────────────────────────────────────

export const getMediaEmoji = (category: MediaCategory | null, mimeType?: string): string => {
  if (category === 'image') return '🖼️'
  if (category === 'video') return '🎬'
  if (category === 'audio') return '🎵'
  if (category === 'document') {
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType?.includes('wordprocessingml') || mimeType === 'text/plain') return '📝'
    if (mimeType?.includes('spreadsheetml')) return '📊'
    if (mimeType?.includes('presentationml')) return '📊'
    return '📄'
  }
  return '📎'
}

// ── Truncate filename ─────────────────────────────────────────────────────

export const truncateFileName = (name: string, maxLen: number = 24): string => {
  if (name.length <= maxLen) return name
  const ext = name.split('.').pop() || ''
  const base = name.slice(0, maxLen - ext.length - 4)
  return `${base}...${ext}`
}

// ── Orphan cleanup helpers ────────────────────────────────────────────────

const PENDING_KEY = 'pending_chat_uploads'

export interface PendingUpload {
  fileIds: string[]
  timestamp: number
}

export const savePendingUpload = (fileIds: string[]): void => {
  const existing = getPendingUploads()
  existing.push({ fileIds, timestamp: Date.now() })
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(existing))
}

export const getPendingUploads = (): PendingUpload[] => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const clearPendingUpload = (fileIds: string[]): void => {
  const existing = getPendingUploads()
  const filtered = existing.filter(
    p => !fileIds.every(id => p.fileIds.includes(id))
  )
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(filtered))
}

export const getStaleUploads = (maxAgeMs: number = 5 * 60 * 1000): PendingUpload[] => {
  const existing = getPendingUploads()
  return existing.filter(p => Date.now() - p.timestamp > maxAgeMs)
}
