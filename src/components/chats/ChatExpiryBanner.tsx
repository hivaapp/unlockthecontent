// src/components/chats/ChatExpiryBanner.tsx
// Informational banner about 30-day media expiry for free plan users.

import { useState, useEffect } from 'react'

interface ChatExpiryBannerProps {
  chatId: string
  hasFreePlanMedia: boolean
  isProUser: boolean
}

export const ChatExpiryBanner = ({ chatId, hasFreePlanMedia, isProUser }: ChatExpiryBannerProps) => {
  const [dismissed, setDismissed] = useState(false)

  const storageKey = `chat_media_banner_dismissed_${chatId}`

  useEffect(() => {
    const wasDismissed = localStorage.getItem(storageKey)
    if (wasDismissed) setDismissed(true)
  }, [storageKey])

  // Don't show for Pro users, text-only chats, or if dismissed
  if (isProUser || !hasFreePlanMedia || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(storageKey, 'true')
  }

  return (
    <div
      className="flex items-center justify-between gap-2 px-3 py-2 mx-4 mt-2 rounded-lg"
      style={{
        backgroundColor: '#FDF4EC',
        border: '1px solid #E6E2D9',
      }}
    >
      <p className="text-[11px] font-[600] text-[#A0622A] leading-snug flex-1">
        📎 Media is stored for 30 days on the free plan. Upgrade to Pro for permanent storage.
      </p>
      <button
        onClick={handleDismiss}
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-white/50 transition-colors"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#A0622A" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
