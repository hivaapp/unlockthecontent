// src/components/chats/ChatMediaButton.tsx
// Paperclip button that opens the native file picker for chat media sharing.

import { useRef } from 'react'
import { ACCEPT_STRING } from '../../utils/chatMediaHelpers'

interface ChatMediaButtonProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

export const ChatMediaButton = ({ onFileSelected, disabled = false }: ChatMediaButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelected(file)
    }
    // Reset so same file can be selected again
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
        style={{
          backgroundColor: disabled ? '#F3F1EC' : '#FAF9F7',
          border: '1px solid #E6E2D9',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        aria-label="Attach file"
      >
        {/* Paperclip icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B6860" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        multiple={false}
        className="hidden"
        onChange={handleChange}
      />
    </>
  )
}
