// src/components/chats/ChatUploadPreview.tsx
// Preview card shown in the composer while uploading or ready to send.

import { formatFileSize, getMediaEmoji, truncateFileName } from '../../utils/chatMediaHelpers'
import type { MediaCategory } from '../../utils/chatMediaHelpers'

interface ChatUploadPreviewProps {
  fileName: string
  fileSize: number
  mediaCategory: MediaCategory
  thumbnailUrl?: string | null  // Local blob URL for image previews
  progress: number              // 0–100
  isComplete: boolean
  error?: string | null
  onCancel: () => void
}

export const ChatUploadPreview = ({
  fileName,
  fileSize,
  mediaCategory,
  thumbnailUrl,
  progress,
  isComplete,
  error,
  onCancel,
}: ChatUploadPreviewProps) => {
  const emoji = getMediaEmoji(mediaCategory)
  const isImage = mediaCategory === 'image'

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 bg-white relative"
      style={{
        borderTop: '1px solid #E6E2D9',
      }}
    >
      {/* Thumbnail / Icon */}
      {isImage && thumbnailUrl ? (
        <div
          className="w-12 h-12 rounded-lg overflow-hidden shrink-0"
          style={{ border: '1px solid #E6E2D9' }}
        >
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#F3F1EC', border: '1px solid #E6E2D9' }}
        >
          <span className="text-[20px]">{emoji}</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-[700] text-text truncate">
          {truncateFileName(fileName, 30)}
        </div>
        <div className="text-[11px] font-[600] text-textMid">
          {formatFileSize(fileSize)}
          {error && <span className="text-error ml-2">· {error}</span>}
        </div>

        {/* Progress bar */}
        {!isComplete && !error && (
          <div className="mt-1.5 w-full h-1.5 bg-[#F3F1EC] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: '#D97757',
              }}
            />
          </div>
        )}

        {/* Complete indicator */}
        {isComplete && !error && (
          <div className="flex items-center gap-1 mt-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#417A55">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span className="text-[11px] font-[700] text-success">Ready to send</span>
          </div>
        )}
      </div>

      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 hover:bg-[#F3F1EC] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6860" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
