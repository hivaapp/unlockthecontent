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
import { getYoutubeEmbedUrl } from '../../lib/utils'

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
      <div className="w-full flex flex-col items-center">
        <div className="w-16 h-16 bg-successBg rounded-full flex items-center justify-center text-3xl mb-4 border border-success/20">
          ✅
        </div>
        
        <h2 className="text-2xl font-black text-text mb-2 text-center">
          Already subscribed
        </h2>
        
        <p className="text-[14px] text-textMid text-center mb-8 max-w-[280px]">
          You subscribed to {email_config?.newsletter_name || 'the newsletter'} earlier. Re-enter your email to access the resource.
        </p>

        <div className="w-full max-w-[340px]">
          <EmailInputField
            email={email}
            onChange={(val) => {
              setEmail(val)
              if (emailError) setEmailError(null)
            }}
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
            label="Access Resource"
          />
        </div>
      </div>
    )
  }

  if (screen === 'unlocked') {
    return (
      <div className="w-full flex flex-col items-center animate-pop-in">
        <div className="w-16 h-16 bg-successBg rounded-full flex items-center justify-center text-3xl mb-4 border border-success/20">
          🎉
        </div>
        
        <h2 className="text-2xl font-black text-text mb-2 text-center">
          {alreadySubscribed ? 'Welcome back!' : 'You\'re in!'}
        </h2>
        
        <p className="text-[14px] text-textMid text-center mb-8">
          Subscribed to {email_config?.newsletter_name || 'the newsletter'}.
        </p>

        <div className="w-full max-w-[400px] flex flex-col gap-6">
          {email_config?.unlock_text && (
            <div className="text-center">
              <p className="text-[15px] font-[500] text-text leading-relaxed whitespace-pre-wrap">
                {email_config.unlock_text}
              </p>
            </div>
          )}

          {link.text_content && (
            <div className="w-full bg-surfaceAlt rounded-xl p-4 border border-border">
              <p className="text-[14px] font-medium text-text leading-relaxed whitespace-pre-wrap">
                {link.text_content}
              </p>
            </div>
          )}

          {link.content_links && link.content_links.length > 0 && (
            <div className="w-full flex flex-col gap-2">
              {link.content_links.map((cl, idx) => {
                const getDomainInitial = (url) => {
                  try { return new URL(url).hostname.replace(/^www\./, '').charAt(0).toUpperCase(); } catch { return '?'; }
                };
                const getDomainColor = (url) => {
                  const colors = ['#E8312A', '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
                  let hash = 0;
                  for (let i = 0; i < url.length; i++) hash = url.charCodeAt(i) + ((hash << 5) - hash);
                  return colors[Math.abs(hash) % colors.length];
                };
                const getDomainName = (url) => {
                  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
                };
                return (
                  <a
                    key={idx}
                    href={cl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-[52px] bg-white rounded-[12px] border border-border flex items-center px-3 gap-3 no-underline hover:bg-surfaceAlt transition-colors"
                  >
                    <div
                      className="w-[32px] h-[32px] rounded-[6px] flex items-center justify-center text-white font-[900] text-[14px] shrink-0"
                      style={{ backgroundColor: getDomainColor(cl.url) }}
                    >
                      {getDomainInitial(cl.url)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[13px] font-[800] text-text truncate leading-tight">{cl.title || getDomainName(cl.url)}</span>
                      <span className="text-[11px] text-textLight truncate leading-tight">{getDomainName(cl.url)}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {link.youtube_url && (
            <div className="w-full aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
              <iframe
                src={getYoutubeEmbedUrl(link.youtube_url)}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube video player"
              />
            </div>
          )}

          {email_config?.unlock_url && (
            <a
              href={email_config.unlock_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 bg-white border border-border text-text rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-surfaceAlt transition-colors no-underline shadow-sm"
            >
              {email_config.unlock_url_label || 'Access Link'} →
            </a>
          )}

          {file && (
            <div className="w-full flex items-center justify-between py-3 border-t border-border mt-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-2xl shrink-0">
                  {getFileEmoji(file.original_name, file.mime_type)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-black text-text truncate">
                    {link.title}
                  </span>
                  <span className="text-[12px] text-textLight font-medium">
                    {formatFileSize(file.size_bytes)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDownload}
                disabled={!downloadUrl}
                className={`h-10 px-4 rounded-lg text-[13px] font-bold transition-all shrink-0 ml-4 ${
                  downloadStarted ? 'bg-success text-white' : !downloadUrl ? 'bg-border text-textLight' : 'bg-brand text-white hover:bg-brandHover shadow-sm'
                }`}
              >
                {!downloadUrl ? 'Wait' : downloadStarted ? 'Got it' : 'Download'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center">

      
      {email_config?.newsletter_name && (
        <span className="text-[11px] font-bold text-brand uppercase tracking-wider mb-2">
          {email_config.newsletter_name}
        </span>
      )}
      
      <h2 className="text-2xl font-black text-text mb-3 text-center leading-tight">
        {email_config?.incentive_text || 'Subscribe to unlock this resource'}
      </h2>
      
      {email_config?.newsletter_description && (
        <p className="text-[14px] text-textMid text-center max-w-[320px] mb-8 leading-relaxed">
          {email_config.newsletter_description}
        </p>
      )}

      <div className="w-full max-w-[340px]">
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
          label="Subscribe to Unlock"
        />

        <p className="text-[11px] text-textLight text-center mt-4 font-bold uppercase tracking-wider">
          Free forever • No payment required
        </p>
      </div>
    </div>
  )
}

const EmailInputField = ({
  email, onChange, onBlur, onKeyDown,
  error, isLoading, isLoggedIn, inputRef, disabled,
}) => (
  <div className="mb-4 w-full">
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
        className={`w-full h-12 bg-white border ${error ? 'border-error' : 'border-border'} rounded-xl px-4 text-[15px] outline-none focus:border-brand transition-colors ${disabled ? 'bg-surfaceAlt' : ''}`}
      />
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-border border-t-brand rounded-full animate-spin" />
      )}
      {isLoggedIn && !isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">✅</div>
      )}
    </div>
    {error && <p className="text-[12px] font-bold text-error mt-2 ml-1 text-center">{error}</p>}
  </div>
)

const SubscribeButton = ({ onClick, isSubmitting, label }) => (
  <button
    onClick={onClick}
    disabled={isSubmitting}
    className="w-full h-12 bg-brand hover:bg-brandHover text-white rounded-xl text-[15px] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-sm"
  >
    {isSubmitting ? (
      <>
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        Please wait...
      </>
    ) : (
      label || `Subscribe to Unlock`
    )}
  </button>
)

export default EmailSubscribeUnlock
