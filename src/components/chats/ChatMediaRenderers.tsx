// src/components/chats/ChatMediaRenderers.tsx
// Shared media renderers used inside chat bubbles for both pairing and DM chats.

import { useState } from 'react'
import {
  getCdnUrl,
  getMediaExpiry,
  formatFileSize,
  getMediaEmoji,
  truncateFileName,
} from '../../utils/chatMediaHelpers'

// ── Expired Media Placeholder ─────────────────────────────────────────────

const ExpiredPlaceholder = ({
  originalName,
  category,
  mimeType,
}: {
  originalName: string
  category: string
  mimeType?: string
}) => (
  <div
    className="flex items-center gap-3 rounded-lg p-3"
    style={{
      width: '240px',
      backgroundColor: '#F3F1EC',
      border: '1px solid #E6E2D9',
    }}
  >
    <span className="text-[20px]">{getMediaEmoji(category as any, mimeType)}</span>
    <div className="flex-1 min-w-0">
      <div className="text-[13px] font-[600] text-textMid truncate">{originalName}</div>
      <div className="text-[12px] text-textLight">File no longer available</div>
    </div>
  </div>
)

// ── Error / Retry State ───────────────────────────────────────────────────

const MediaError = ({ onRetry }: { onRetry: () => void }) => (
  <button
    onClick={onRetry}
    className="text-[12px] font-[600] text-textMid hover:text-text transition-colors mt-1"
  >
    Failed to load — Tap to retry
  </button>
)

// ── Expiry Indicator ──────────────────────────────────────────────────────

const ExpiryIndicator = ({ daysRemaining }: { daysRemaining: number }) => {
  if (daysRemaining <= 0) return null
  const isUrgent = daysRemaining <= 7
  return (
    <div
      className="text-[11px] font-[600] mt-1"
      style={{ color: isUrgent ? '#A0622A' : '#AAA49C' }}
    >
      Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
    </div>
  )
}

// ── Image Renderer ────────────────────────────────────────────────────────

export const ChatImageRenderer = ({
  message,
  onOpenLightbox,
}: {
  message: {
    media_r2_key: string
    media_thumbnail_r2_key?: string | null
    media_original_name: string
    media_mime_type?: string
    media_size_bytes: number
    media_category: string
    is_pro_storage: boolean
    created_at: string
  }
  onOpenLightbox: (cdnUrl: string, fileName: string) => void
}) => {
  const [hasError, setHasError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const { isExpired, daysRemaining } = getMediaExpiry(message.created_at, message.is_pro_storage)

  if (isExpired) {
    return (
      <ExpiredPlaceholder
        originalName={message.media_original_name}
        category={message.media_category}
        mimeType={message.media_mime_type}
      />
    )
  }

  const isGif = message.media_mime_type === 'image/gif'
  const cdnUrl = getCdnUrl(message.media_r2_key)
  const thumbnailUrl = message.media_thumbnail_r2_key
    ? getCdnUrl(message.media_thumbnail_r2_key)
    : null

  // GIFs use full URL inline (to preserve animation), others use thumbnail
  const inlineSrc = isGif ? cdnUrl : (thumbnailUrl || cdnUrl)

  return (
    <div>
      <div
        className="rounded-lg overflow-hidden cursor-pointer"
        style={{ maxWidth: '240px', border: '1px solid #E6E2D9' }}
        onClick={() => onOpenLightbox(cdnUrl, message.media_original_name)}
      >
        {hasError ? (
          <div className="flex items-center justify-center p-4 bg-[#F3F1EC]" style={{ minHeight: '80px' }}>
            <MediaError onRetry={() => { setHasError(false); setRetryKey(k => k + 1) }} />
          </div>
        ) : (
          <img
            key={retryKey}
            src={inlineSrc}
            alt={message.media_original_name}
            loading="lazy"
            className="w-full object-contain"
            style={{ maxHeight: '320px' }}
            onError={() => setHasError(true)}
          />
        )}
      </div>
      {!message.is_pro_storage && (
        <ExpiryIndicator daysRemaining={daysRemaining} />
      )}
    </div>
  )
}

// ── Video Renderer ────────────────────────────────────────────────────────

export const ChatVideoRenderer = ({
  message,
  onOpenLightbox,
}: {
  message: {
    media_r2_key: string
    media_original_name: string
    media_mime_type?: string
    media_size_bytes: number
    media_category: string
    is_pro_storage: boolean
    created_at: string
  }
  onOpenLightbox: (cdnUrl: string, fileName: string) => void
}) => {
  const { isExpired, daysRemaining } = getMediaExpiry(message.created_at, message.is_pro_storage)

  if (isExpired) {
    return (
      <ExpiredPlaceholder
        originalName={message.media_original_name}
        category={message.media_category}
        mimeType={message.media_mime_type}
      />
    )
  }

  const cdnUrl = getCdnUrl(message.media_r2_key)

  return (
    <div>
      <div
        className="rounded-lg overflow-hidden cursor-pointer relative"
        style={{ width: '240px', height: '160px', backgroundColor: '#21201C', border: '1px solid #E6E2D9' }}
        onClick={() => onOpenLightbox(cdnUrl, message.media_original_name)}
      >
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#21201C">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      </div>
      <div className="mt-1">
        <div className="text-[12px] font-[600] text-textMid truncate" style={{ maxWidth: '240px' }}>
          {truncateFileName(message.media_original_name)}
        </div>
        <div className="text-[11px] text-textLight">{formatFileSize(message.media_size_bytes)}</div>
      </div>
      {!message.is_pro_storage && (
        <ExpiryIndicator daysRemaining={daysRemaining} />
      )}
    </div>
  )
}

// ── Document Renderer ─────────────────────────────────────────────────────

export const ChatDocumentRenderer = ({
  message,
}: {
  message: {
    media_r2_key: string
    media_original_name: string
    media_mime_type?: string
    media_size_bytes: number
    media_category: string
    is_pro_storage: boolean
    created_at: string
  }
}) => {
  const [downloading, setDownloading] = useState(false)

  const { isExpired, daysRemaining } = getMediaExpiry(message.created_at, message.is_pro_storage)

  if (isExpired) {
    return (
      <ExpiredPlaceholder
        originalName={message.media_original_name}
        category={message.media_category}
        mimeType={message.media_mime_type}
      />
    )
  }

  const cdnUrl = getCdnUrl(message.media_r2_key)
  const emoji = getMediaEmoji('document', message.media_mime_type)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(cdnUrl)
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = message.media_original_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objUrl)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <div
        className="flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-[#F3F1EC]/50 transition-colors"
        style={{
          width: '240px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E6E2D9',
        }}
        onClick={handleDownload}
      >
        <span className="text-[22px] shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-[700] text-text truncate">
            {truncateFileName(message.media_original_name)}
          </div>
          <div className="text-[11px] text-textLight">
            {formatFileSize(message.media_size_bytes)}
          </div>
        </div>
        <div className="shrink-0">
          {downloading ? (
            <div className="w-5 h-5 rounded-full" style={{ border: '2px solid #E6E2D9', borderTopColor: '#D97757', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B6860" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          )}
        </div>
      </div>
      {!message.is_pro_storage && (
        <ExpiryIndicator daysRemaining={daysRemaining} />
      )}
    </div>
  )
}

// ── Audio Renderer ────────────────────────────────────────────────────────

export const ChatAudioRenderer = ({
  message,
}: {
  message: {
    media_r2_key: string
    media_original_name: string
    media_mime_type?: string
    media_size_bytes: number
    media_category: string
    is_pro_storage: boolean
    created_at: string
  }
}) => {
  const [hasError, setHasError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const { isExpired, daysRemaining } = getMediaExpiry(message.created_at, message.is_pro_storage)

  if (isExpired) {
    return (
      <ExpiredPlaceholder
        originalName={message.media_original_name}
        category={message.media_category}
        mimeType={message.media_mime_type}
      />
    )
  }

  const cdnUrl = getCdnUrl(message.media_r2_key)

  return (
    <div>
      <div style={{ maxWidth: '240px' }}>
        <div className="text-[12px] font-[600] text-textMid truncate mb-1">
          🎵 {truncateFileName(message.media_original_name)}
        </div>
        {hasError ? (
          <MediaError onRetry={() => { setHasError(false); setRetryKey(k => k + 1) }} />
        ) : (
          <audio
            key={retryKey}
            controls
            preload="metadata"
            className="w-full"
            style={{ maxWidth: '240px', height: '36px' }}
            onError={() => setHasError(true)}
          >
            <source src={cdnUrl} type={message.media_mime_type || 'audio/mpeg'} />
          </audio>
        )}
      </div>
      {!message.is_pro_storage && (
        <ExpiryIndicator daysRemaining={daysRemaining} />
      )}
    </div>
  )
}

// ── Unified renderer — picks the right one based on media_category ────────

export const ChatMediaContent = ({
  message,
  onOpenLightbox,
}: {
  message: {
    media_r2_key: string
    media_thumbnail_r2_key?: string | null
    media_original_name: string
    media_mime_type?: string
    media_size_bytes: number
    media_category: string
    is_pro_storage: boolean
    created_at: string
  }
  onOpenLightbox: (cdnUrl: string, fileName: string) => void
}) => {
  switch (message.media_category) {
    case 'image':
      return <ChatImageRenderer message={message} onOpenLightbox={onOpenLightbox} />
    case 'video':
      return <ChatVideoRenderer message={message} onOpenLightbox={onOpenLightbox} />
    case 'document':
      return <ChatDocumentRenderer message={message} />
    case 'audio':
      return <ChatAudioRenderer message={message} />
    default:
      return <ChatDocumentRenderer message={message} />
  }
}
