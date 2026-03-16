// src/components/unlock/EmailSubscribeUnlock.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  subscribeAndUnlock,
  hasCompletedEmailUnlock,
  isValidEmail,
  checkExistingSubscriber,
} from '../../services/emailSubscribeService'
import { getFileEmoji, formatFileSize } from '../../services/uploadService'

const EmailSubscribeUnlock = ({ link, currentUser, isLoggedIn, sessionKey, onUnlockSuccess }) => {
  const navigate = useNavigate()
  const emailInputRef = useRef(null)

  const [screen, setScreen] = useState('locked')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [emailError, setEmailError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [alreadySubscribed, setAlreadySubscribed] = useState(false)
  const [downloadStarted, setDownloadStarted] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(false)

  const { email_config, file, creator } = link

  useEffect(() => {
    if (hasCompletedEmailUnlock(link.id)) {
      setScreen('already_unlocked')
      if (onUnlockSuccess) onUnlockSuccess()
    }
  }, [link.id])

  useEffect(() => {
    if (currentUser?.email && !email) {
      setEmail(currentUser.email)
    }
  }, [currentUser?.email])

  const handleEmailBlur = async () => {
    if (!email) return
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setCheckingExisting(true)
    const existing = await checkExistingSubscriber(link.id, email)
    setCheckingExisting(false)
    if (existing) setEmailError(null)
  }

  const handleSubscribe = async () => {
    if (!email.trim()) {
      setEmailError('Please enter your email address.')
      emailInputRef.current?.focus()
      return
    }
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.')
      emailInputRef.current?.focus()
      return
    }

    setEmailError(null)
    setIsSubmitting(true)

    try {
      const result = await subscribeAndUnlock({
        linkId:    link.id,
        creatorId: creator.id,
        email:     email.trim(),
        viewerId:  currentUser?.id || null,
        linkSlug:  link.slug,
        fileId:    file?.id,
      })
      setDownloadUrl(result.downloadUrl)
      setAlreadySubscribed(result.alreadySubscribed)
      setScreen('unlocked')
      if (onUnlockSuccess) onUnlockSuccess()
    } catch (err) {
      setEmailError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = () => {
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = file?.original_name || 'download'
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setDownloadStarted(true)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubscribe()
    }
  }

  if (screen === 'already_unlocked') {
    return (
      <div className="w-full">
        <div className="bg-successBg border border-success/20 rounded-xl p-4 mb-4 text-center">
          <div className="text-xl mb-1">✅</div>
          <h3 className="text-success font-black mb-1">Already subscribed</h3>
          <p className="text-[12px] text-success/80 mb-3 leading-relaxed">
            You subscribed to {email_config?.newsletter_name} earlier.
          </p>
        </div>
        <EmailInputField
          email={email}
          onChange={setEmail}
          onBlur={handleEmailBlur}
          onKeyDown={handleKeyDown}
          error={emailError}
          isLoggedIn={isLoggedIn}
          inputRef={emailInputRef}
          disabled={isSubmitting}
        />
        <SubscribeButton
          onClick={handleSubscribe}
          isSubmitting={isSubmitting}
          label="Re-download"
          emailConfig={email_config}
        />
      </div>
    )
  }

  if (screen === 'unlocked') {
    return (
      <div className="w-full animate-pop-in">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🎉</div>
          <h2 className="text-lg font-black text-text mb-0.5">
            {alreadySubscribed ? 'Welcome back!' : 'You\'re in!'}
          </h2>
          <p className="text-[12px] text-textMid">
            Subscribed to {email_config?.newsletter_name}.
          </p>
        </div>

        {file && (
          <div className="bg-white border border-border rounded-xl p-4 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-surfaceAlt flex items-center justify-center text-2xl">
                {getFileEmoji(file.original_name, file.mime_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-text truncate">
                  {link.title}
                </div>
                <div className="text-[11px] text-textLight font-bold">
                  {file.original_name} · {formatFileSize(file.size_bytes)}
                </div>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={!downloadUrl}
              className={`w-full h-12 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
                downloadStarted ? 'bg-success text-white' : !downloadUrl ? 'bg-border text-textLight' : 'bg-brand text-white'
              }`}
            >
              {!downloadUrl ? 'Preparing...' : downloadStarted ? '✅ Downloaded' : '⬇️ Download Now'}
            </button>
          </div>
        )}

        {email_config?.unlock_url && (
            <a
              href={email_config.unlock_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 bg-text text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 no-underline mb-4"
            >
              Access Resource →
            </a>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-successBg border border-success/20 rounded-xl p-3 mb-4 flex gap-3 items-start">
        <span className="text-xl">📧</span>
        <div>
          <div className="text-[13px] font-black text-success leading-tight mb-0.5">
            {email_config?.newsletter_name || 'Subscribe to unlock'}
          </div>
          {email_config?.newsletter_description && (
            <p className="text-[11px] text-success/80 leading-normal">
              {email_config.newsletter_description}
            </p>
          )}
        </div>
      </div>

      <EmailInputField
        email={email}
        onChange={(val) => {
          setEmail(val)
          if (emailError) setEmailError(null)
        }}
        onBlur={handleEmailBlur}
        onKeyDown={handleKeyDown}
        error={emailError}
        isLoading={checkingExisting}
        isLoggedIn={isLoggedIn}
        inputRef={emailInputRef}
        disabled={isSubmitting}
      />

      <SubscribeButton
        onClick={handleSubscribe}
        isSubmitting={isSubmitting}
        emailConfig={email_config}
      />

      <p className="text-[9px] text-textLight text-center mt-2 font-bold uppercase tracking-wider">
        Free forever • No payment required
      </p>
    </div>
  )
}

const EmailInputField = ({
  email, onChange, onBlur, onKeyDown,
  error, isLoading, isLoggedIn, inputRef, disabled,
}) => (
  <div className="mb-3">
    <label className="block text-[11px] font-black text-textMid uppercase tracking-wider mb-1.5 ml-1">
      Your email address
    </label>
    <div className="relative">
      <input
        ref={inputRef}
        type="email"
        value={email}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder="you@example.com"
        disabled={disabled}
        className={`w-full h-12 bg-white border ${error ? 'border-error' : 'border-border'} rounded-xl px-4 text-sm outline-none focus:border-brand transition-colors ${disabled ? 'bg-surfaceAlt' : ''}`}
      />
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-border border-t-brand rounded-full animate-spin" />
      )}
      {isLoggedIn && !isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">✅</div>
      )}
    </div>
    {error && <p className="text-[11px] font-bold text-error mt-1.5 ml-1">{error}</p>}
  </div>
)

const SubscribeButton = ({ onClick, isSubmitting, emailConfig, label }) => (
  <button
    onClick={onClick}
    disabled={isSubmitting}
    className="w-full h-12 bg-brand text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
  >
    {isSubmitting ? (
      <>
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        Unlocking...
      </>
    ) : (
      label || `Unlock Resource →`
    )}
  </button>
)

export default EmailSubscribeUnlock
