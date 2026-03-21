// src/components/unlock/EmailSubscribeUnlock.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, MailCheck, Download, ExternalLink, Lock } from 'lucide-react'
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
      <div className="w-full flex flex-col items-center animate-fadeIn">
        <div className="w-12 h-12 bg-surfaceAlt rounded-full flex items-center justify-center text-text mb-6 border border-border">
          <Mail size={24} strokeWidth={2.5} />
        </div>
        
        <h2 className="text-[24px] md:text-[28px] tracking-tight font-black text-text mb-2 text-center">
          Already subscribed
        </h2>
        
        <p className="text-[15px] text-textMid text-center mb-8 max-w-[280px]">
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
      <div className="w-full flex flex-col items-center animate-fadeIn">
        <div className="w-12 h-12 bg-successBg text-success rounded-full flex items-center justify-center mb-6 border border-success/20">
          <MailCheck size={24} strokeWidth={2.5} />
        </div>
        
        <h2 className="text-[24px] md:text-[28px] tracking-tight font-black text-text mb-2 text-center">
          {alreadySubscribed ? 'Welcome back!' : 'Access Granted!'}
        </h2>
        
        <p className="text-[15px] font-medium text-textMid text-center mb-10">
          {alreadySubscribed ? 'Here is your unlocked resource.' : `Successfully subscribed to ${email_config?.newsletter_name || 'the newsletter'}. Here is your resource.`}
        </p>

        <div className="w-full max-w-[400px] flex flex-col gap-8 text-left">
          {email_config?.unlock_text && (
            <div className="text-center w-full">
              <p className="text-[15px] font-[500] text-text leading-relaxed whitespace-pre-wrap">
                {email_config.unlock_text}
              </p>
            </div>
          )}

          {link.text_content && (
            <div className="w-full">
              <h3 className="text-[12px] font-bold text-textLight uppercase tracking-wider mb-2">Message</h3>
              <p className="text-[15px] text-text leading-relaxed whitespace-pre-wrap">
                {link.text_content}
              </p>
            </div>
          )}

          {link.content_links && link.content_links.length > 0 && (
            <div className="w-full flex flex-col gap-4">
              <h3 className="text-[12px] font-bold text-textLight uppercase tracking-wider mb-[-8px]">Links</h3>
              {link.content_links.map((cl, idx) => {
                const getDomainName = (url) => {
                  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
                };
                return (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-surfaceAlt/50 transition-colors -mx-4 px-4 rounded-md">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-[15px] font-bold text-text truncate">{cl.title || getDomainName(cl.url)}</span>
                      <span className="text-[13px] text-textMid truncate">{getDomainName(cl.url)}</span>
                    </div>
                    <a
                      href={cl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-4 bg-white border border-border text-text rounded-md text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-surfaceAlt transition-colors shrink-0 whitespace-nowrap"
                    >
                      Visit <ExternalLink size={14} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {link.youtube_url && (
            <div className="w-full flex flex-col gap-2">
              <h3 className="text-[12px] font-bold text-textLight uppercase tracking-wider mb-1">Video</h3>
              <div className="w-full aspect-video rounded-md overflow-hidden border border-border">
                <iframe
                  src={getYoutubeEmbedUrl(link.youtube_url)}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video player"
                />
              </div>
            </div>
          )}

          {email_config?.unlock_url && (
            <div className="w-full flex flex-col gap-2 mt-2">
              <a
                href={email_config.unlock_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-10 bg-brand text-white rounded-md text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-brandHover transition-colors"
              >
                {email_config.unlock_url_label || 'Access Link'} <ExternalLink size={16} />
              </a>
            </div>
          )}

          {file && (
            <div className="w-full flex flex-col gap-2">
              <h3 className="text-[12px] font-bold text-textLight uppercase tracking-wider mb-1 mt-2">File</h3>
              <div className="w-full flex items-center justify-between py-4 border-y border-border">
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className="text-2xl shrink-0">
                    {getFileEmoji(file.original_name, file.mime_type)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[15px] font-bold text-text truncate">
                      {link.title || file.original_name}
                    </span>
                    <span className="text-[13px] text-textMid">
                      {formatFileSize(file.size_bytes)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={!downloadUrl}
                  className={`h-10 px-4 rounded-md text-[13px] font-bold transition-colors shrink-0 flex items-center gap-2 ${
                    downloadStarted 
                      ? 'bg-successBg text-success border border-success/20' 
                      : !downloadUrl 
                        ? 'bg-surfaceAlt text-textLight border border-border' 
                        : (email_config?.unlock_url 
                            ? 'bg-white text-text border border-border hover:bg-surfaceAlt' 
                            : 'bg-brand text-white hover:bg-brandHover')
                  }`}
                >
                  {!downloadUrl ? 'Wait' : downloadStarted ? 'Downloaded' : <><Download size={14} /> Download</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn">

      <div className="w-12 h-12 bg-surfaceAlt text-text rounded-full flex items-center justify-center mb-6 border border-border">
        <Mail size={24} strokeWidth={2.5} />
      </div>
      
      {email_config?.newsletter_name && (
        <span className="text-[12px] font-bold text-textMid uppercase tracking-wider mb-2">
          {email_config.newsletter_name}
        </span>
      )}
      
      <h2 className="text-[24px] md:text-[28px] tracking-tight font-black text-text mb-3 text-center leading-tight">
        {email_config?.incentive_text || 'Unlock this resource instantly'}
      </h2>
      
      {email_config?.newsletter_description && (
        <p className="text-[15px] text-textMid text-center max-w-[320px] mb-8 leading-relaxed">
          {email_config.newsletter_description}
        </p>
      )}

      {!email_config?.newsletter_description && (
        <div className="mb-8 p-0" />
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
          label="Get Instant Access"
        />

        <p className="text-[12px] font-medium text-textLight text-center mt-5 flex items-center justify-center gap-1.5">
          <Lock size={12} /> 100% free • Unsubscribe anytime
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
        placeholder="Enter your best email..."
        disabled={disabled}
        className={`w-full h-10 bg-white border ${error ? 'border-error' : 'border-border'} rounded-md px-4 text-[15px] outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-textLight ${disabled ? 'bg-surfaceAlt text-textLight' : 'text-text'}`}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-border border-t-brand rounded-full animate-spin" />
      )}
      {isLoggedIn && !isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px]">✅</div>
      )}
    </div>
    {error && <p className="text-[12px] font-bold text-error mt-1.5 ml-1 text-center">{error}</p>}
  </div>
)

const SubscribeButton = ({ onClick, isSubmitting, label }) => (
  <button
    onClick={onClick}
    disabled={isSubmitting}
    className="w-full h-10 bg-brand hover:bg-brandHover text-white rounded-md text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
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

