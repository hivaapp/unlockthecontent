// src/components/chats/ChatMediaLightbox.tsx
// Full-screen lightbox for viewing images and videos from chat messages.

import { useState } from 'react'

interface ChatMediaLightboxProps {
  cdnUrl: string
  fileName: string
  type: 'image' | 'video'
  onClose: () => void
}

export const ChatMediaLightbox = ({ cdnUrl, fileName, type, onClose }: ChatMediaLightboxProps) => {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(cdnUrl)
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = fileName
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
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-[58px] shrink-0">
        <div className="flex-1 min-w-0 mr-3">
          <span className="text-[14px] font-[700] text-white truncate block">{fileName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            {downloading ? (
              <div className="w-4 h-4 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            )}
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {type === 'image' ? (
          <img
            src={cdnUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        ) : (
          <video
            src={cdnUrl}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="max-w-full max-h-full rounded-lg"
          />
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
