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
import CreatorRow from '../shared/CreatorRow'

const EmailSubscribeUnlock = ({ link, currentUser, isLoggedIn, sessionKey }) => {
  const navigate = useNavigate()
  const emailInputRef = useRef(null)

  // ── Internal states ──────────────────────────────────────────────────
  // 'locked' → 'submitting' → 'unlocked'
  // 'already_unlocked' is a variant of 'unlocked'
  const [screen, setScreen] = useState('locked')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [emailError, setEmailError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [alreadySubscribed, setAlreadySubscribed] = useState(false)
  const [downloadStarted, setDownloadStarted] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(false)

  const { email_config, file, creator } = link

  // ── Restore unlocked state from sessionStorage ───────────────────────
  useEffect(() => {
    if (hasCompletedEmailUnlock(link.id)) {
      setScreen('already_unlocked')
    }
  }, [link.id])

  // ── Pre-fill email if logged in ──────────────────────────────────────
  useEffect(() => {
    if (currentUser?.email && !email) {
      setEmail(currentUser.email)
    }
  }, [currentUser?.email])

  // ── Validate email on blur ───────────────────────────────────────────
  const handleEmailBlur = async () => {
    if (!email) return
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    
    // Check if already subscribed (shows warning, not blocking)
    setCheckingExisting(true)
    const existing = await checkExistingSubscriber(link.id, email)
    setCheckingExisting(false)
    
    if (existing) {
      setEmailError(null) // Not an error — just informational below
    }
  }

  // ── Submit handler ───────────────────────────────────────────────────
  const handleSubscribe = async () => {
    // Validate
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

    } catch (err) {
      setEmailError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Trigger download ─────────────────────────────────────────────────
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

  // ── Handle Enter key ─────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubscribe()
    }
  }

  // ── Helper: Check if there's unlock content besides file ──────────────
  const hasUnlockText = !!email_config?.unlock_text
  const hasUnlockUrl = !!email_config?.unlock_url
  const hasYouTube = !!link.youtube_url
  const hasFile = !!file
  const hasAnyContent = hasFile || hasUnlockText || hasUnlockUrl || hasYouTube

  // ── Render: Already unlocked (session refresh) ───────────────────────
  if (screen === 'already_unlocked') {
    return (
      <PageWrapper>
        <CreatorRow creator={creator} />
        <ContentPreviewCard link={link} />
        
        <div style={{
          background: '#EBF5EE', border: '1.5px solid #BBF7D0',
          borderRadius: '14px', padding: '20px 16px',
          textAlign: 'center', marginTop: '20px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#417A55', margin: '0 0 6px' }}>
            You're already subscribed
          </h3>
          <p style={{ fontSize: '13px', color: '#417A55', margin: '0 0 16px', lineHeight: 1.6, opacity: 0.8 }}>
            You subscribed to {email_config?.newsletter_name} earlier. Enter your email again to re-download.
          </p>
        </div>

        {/* Show the email form again for re-download */}
        <div style={{ marginTop: '20px' }}>
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
      </PageWrapper>
    )
  }

  // ── Render: Unlocked ─────────────────────────────────────────────────
  if (screen === 'unlocked') {
    return (
      <PageWrapper>
        <CreatorRow creator={creator} />

        {/* Success celebration */}
        <div style={{
          textAlign: 'center', padding: '24px 16px 16px',
        }}>
          <div style={{
            fontSize: '52px', marginBottom: '8px',
            animation: 'popIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            🎉
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#21201C', margin: '0 0 6px' }}>
            {alreadySubscribed ? 'Welcome back!' : 'You\'re in!'}
          </h2>
          <p style={{ fontSize: '14px', color: '#6B6860', margin: '0', lineHeight: 1.65 }}>
            {alreadySubscribed
              ? `Already subscribed to ${email_config?.newsletter_name}.`
              : `Subscribed to ${email_config?.newsletter_name}.`
            }
          </p>
        </div>

        {/* ── Content Delivery (per blueprint: text → file → link → video) ── */}

        {/* 1. Unlock text (if provided by creator) */}
        {hasUnlockText && (
          <div style={{
            background: 'white', border: '1px solid #E6E2D9',
            borderRadius: '16px', padding: '20px 16px', margin: '0 0 16px',
          }}>
            <div style={{
              fontSize: '12px', fontWeight: 800, color: '#6B6860',
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px',
            }}>
              📝 Your content
            </div>
            <div style={{
              fontSize: '14px', color: '#21201C', lineHeight: 1.7,
              fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {email_config.unlock_text}
            </div>
          </div>
        )}

        {/* 2. Download card (if file attached) */}
        {hasFile && (
          <div style={{
            background: 'white', border: '1px solid #E6E2D9',
            borderRadius: '16px', padding: '20px 16px', margin: '0 0 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '12px',
                background: '#F3F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', flexShrink: 0,
              }}>
                {getFileEmoji(file.original_name, file.mime_type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '15px', fontWeight: 900, color: '#21201C',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {link.title}
                </div>
                <div style={{ fontSize: '12px', color: '#AAA49C', fontWeight: 600, marginTop: '3px' }}>
                  {file.original_name} · {formatFileSize(file.size_bytes)}
                </div>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={!downloadUrl}
              style={{
                width: '100%', height: '52px',
                background: downloadStarted ? '#417A55' : !downloadUrl ? '#E6E2D9' : '#D97757',
                color: 'white', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 900, cursor: downloadUrl ? 'pointer' : 'default',
                transition: 'background 300ms ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {!downloadUrl ? 'Preparing download...' :
                downloadStarted ? '✅ Download started' : `⬇️ Download ${file.original_name}`}
            </button>

            {downloadStarted && (
              <p style={{
                fontSize: '12px', color: '#6B6860', textAlign: 'center',
                margin: '10px 0 0', lineHeight: 1.5,
              }}>
                Check your Downloads folder. Having trouble?{' '}
                <span
                  onClick={handleDownload}
                  style={{ color: '#D97757', fontWeight: 700, cursor: 'pointer' }}
                >
                  Download again
                </span>
              </p>
            )}
          </div>
        )}

        {/* 3. External link button (if provided) */}
        {hasUnlockUrl && (
          <div style={{
            background: 'white', border: '1px solid #E6E2D9',
            borderRadius: '16px', padding: '20px 16px', margin: '0 0 16px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '12px', fontWeight: 800, color: '#6B6860',
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px',
            }}>
              🔗 Your resource
            </div>
            <a
              href={email_config.unlock_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', height: '48px',
                background: '#21201C', color: 'white', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 900, cursor: 'pointer', textDecoration: 'none',
              }}
            >
              Access Your Resource →
            </a>
            <p style={{
              fontSize: '11px', color: '#AAA49C', marginTop: '8px', fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {email_config.unlock_url}
            </p>
          </div>
        )}

        {/* 4. YouTube embed (if set) */}
        {hasYouTube && (
          <YouTubeEmbed url={link.youtube_url} />
        )}

        {/* Newsletter CTA */}
        <div style={{
          background: '#F3F1EC', borderRadius: '12px',
          padding: '16px', marginBottom: '16px',
        }}>
          <p style={{ fontSize: '13px', color: '#6B6860', margin: '0', lineHeight: 1.65, fontWeight: 600 }}>
            📧 You'll receive {email_config?.newsletter_name} emails at{' '}
            <strong style={{ color: '#21201C' }}>{email}</strong>.
            {email_config?.confirmation_message && (
              <> {email_config.confirmation_message}</>
            )}
          </p>
        </div>

        {/* Creator profile CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px',
          border: '1px solid #E6E2D9', borderRadius: '12px',
        }}>
          <CreatorAvatar creator={creator} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#21201C' }}>
              {creator.name}
            </div>
            <div style={{ fontSize: '12px', color: '#6B6860', fontWeight: 600 }}>
              See more resources →
            </div>
          </div>
          <button
            onClick={() => navigate(`/@${creator.username}`)}
            style={{
              background: 'white', border: '1.5px solid #E6E2D9',
              borderRadius: '8px', padding: '8px 14px',
              fontSize: '12px', fontWeight: 800, color: '#21201C', cursor: 'pointer',
            }}
          >
            View profile
          </button>
        </div>

        <style>{`
          @keyframes popIn {
            0%   { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1);   opacity: 1; }
          }
        `}</style>
      </PageWrapper>
    )
  }

  // ── Render: Locked (default) ─────────────────────────────────────────
  return (
    <PageWrapper>
      <CreatorRow creator={creator} />
      <ContentPreviewCard link={link} />

      {/* Newsletter info card */}
      <div style={{
        background: '#EBF5EE', border: '1.5px solid #BBF7D0',
        borderRadius: '14px', padding: '16px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>📧</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#417A55', marginBottom: '4px' }}>
              {email_config?.newsletter_name || 'Subscribe to unlock'}
            </div>
            {email_config?.newsletter_description && (
              <div style={{ fontSize: '13px', color: '#417A55', lineHeight: 1.6, opacity: 0.85 }}>
                {email_config.newsletter_description}
              </div>
            )}
            {email_config?.incentive_text && (
              <div style={{
                fontSize: '12px', fontWeight: 700, color: '#417A55',
                marginTop: '6px', opacity: 0.8,
              }}>
                ✓ {email_config.incentive_text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email input */}
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

      {/* Subscribe button */}
      <SubscribeButton
        onClick={handleSubscribe}
        isSubmitting={isSubmitting}
        emailConfig={email_config}
      />

      {/* Trust line */}
      <p style={{
        fontSize: '11px', color: '#AAA49C', textAlign: 'center',
        margin: '12px 0 0', lineHeight: 1.6, fontWeight: 600,
      }}>
        Free forever. No payment. Unsubscribe anytime.
      </p>
    </PageWrapper>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

const PageWrapper = ({ children }) => (
  <div style={{
    maxWidth: '560px', margin: '0 auto', padding: '24px 16px 80px',
    fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif', minHeight: '100vh',
  }}>
    {children}
  </div>
)

const ContentPreviewCard = ({ link }) => {
  const { file, title, description, email_config } = link
  
  // Determine content type indicators
  const hasFile = !!file
  const hasText = !!email_config?.unlock_text
  const hasUrl = !!email_config?.unlock_url
  const hasYouTube = !!link.youtube_url
  
  return (
    <div style={{
      background: 'white', border: '1px solid #E6E2D9',
      borderRadius: '16px', overflow: 'hidden', marginBottom: '20px',
    }}>
      {/* Gradient top zone */}
      <div style={{
        height: '80px',
        background: 'linear-gradient(135deg, #EBF5EE 0%, #D1FAE5 100%)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px',
      }}>
        <span style={{ fontSize: '36px' }}>
          {hasFile ? getFileEmoji(file.original_name, file.mime_type) : hasText ? '📝' : hasUrl ? '🔗' : '📄'}
        </span>
        <div>
          <div style={{
            fontSize: '10px', fontWeight: 900, color: '#417A55',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px',
          }}>
            📧 Email Subscribe
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#417A55', opacity: 0.8 }}>
            {hasFile ? `${file.file_type?.toUpperCase()} · ${formatFileSize(file.size_bytes)}` :
              hasText ? 'Text content' :
                hasUrl ? 'External resource' :
                  'Digital content'}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#21201C', margin: '0 0 6px', lineHeight: 1.3 }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: '13px', color: '#6B6860', margin: '0', lineHeight: 1.65 }}>
            {description}
          </p>
        )}
        
        {/* Content type indicators */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {hasFile && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#417A55', background: '#EBF5EE',
              padding: '3px 8px', borderRadius: '6px',
            }}>
              📎 {file.original_name}
            </span>
          )}
          {hasText && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#6366F1', background: '#EEF2FF',
              padding: '3px 8px', borderRadius: '6px',
            }}>
              📝 Text content
            </span>
          )}
          {hasUrl && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#D97757', background: '#FAF0EB',
              padding: '3px 8px', borderRadius: '6px',
            }}>
              🔗 External link
            </span>
          )}
          {hasYouTube && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#6B6860', background: '#F3F1EC',
              padding: '3px 8px', borderRadius: '6px',
            }}>
              ▶️ Video content
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const EmailInputField = ({
  email, onChange, onBlur, onKeyDown,
  error, isLoading, isLoggedIn, inputRef, disabled,
}) => (
  <div style={{ marginBottom: '12px' }}>
    <label style={{
      display: 'block', fontSize: '12px', fontWeight: 700, color: '#6B6860', marginBottom: '6px',
    }}>
      Your email address
    </label>
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="email"
        value={email}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder="you@example.com"
        disabled={disabled}
        autoComplete="email"
        inputMode="email"
        style={{
          width: '100%', height: '52px', boxSizing: 'border-box',
          border: `1.5px solid ${error ? '#C0392B' : '#E6E2D9'}`,
          borderRadius: '12px', padding: '0 44px 0 16px',
          fontSize: '15px', color: '#21201C', fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
          outline: 'none', transition: 'border-color 150ms ease',
          background: disabled ? '#F3F1EC' : 'white',
        }}
        onFocus={(e) => {
          if (!error) e.target.style.borderColor = '#D97757'
        }}
      />
      {isLoading && (
        <div style={{
          position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
          width: '18px', height: '18px', border: '2px solid #E6E2D9',
          borderTopColor: '#417A55', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      )}
      {isLoggedIn && !isLoading && (
        <div style={{
          position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
          fontSize: '16px',
        }}>
          ✅
        </div>
      )}
    </div>
    {error && (
      <p style={{
        fontSize: '11px', fontWeight: 700, color: '#C0392B',
        margin: '5px 0 0', lineHeight: 1.4,
      }}>
        {error}
      </p>
    )}
    {isLoggedIn && !error && (
      <p style={{ fontSize: '11px', color: '#6B6860', margin: '5px 0 0', fontWeight: 600 }}>
        Using your AdGate account email.
      </p>
    )}
    <style>{`@keyframes spin { to { transform: rotate(360deg) translateY(-50%); } }`}</style>
  </div>
)

const SubscribeButton = ({ onClick, isSubmitting, emailConfig, label }) => (
  <button
    onClick={onClick}
    disabled={isSubmitting}
    style={{
      width: '100%', height: '52px',
      background: isSubmitting ? '#F3F1EC' : '#417A55',
      color: isSubmitting ? '#AAA49C' : 'white',
      border: 'none', borderRadius: '12px',
      fontSize: '15px', fontWeight: 900, cursor: isSubmitting ? 'default' : 'pointer',
      transition: 'all 200ms ease',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    }}
  >
    {isSubmitting ? (
      <>
        <span style={{
          display: 'inline-block', width: '18px', height: '18px',
          border: '2px solid #E6E2D9', borderTopColor: '#AAA49C',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        Subscribing...
      </>
    ) : (
      label || `Subscribe to ${emailConfig?.newsletter_name || 'newsletter'} — Unlock free →`
    )}
  </button>
)

const YouTubeEmbed = ({ url }) => {
  const getEmbedUrl = (u) => {
    const match = u.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
  }
  const embedUrl = getEmbedUrl(url)
  if (!embedUrl) return null
  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
      <iframe
        src={embedUrl}
        width="100%"
        height="220"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ display: 'block' }}
      />
    </div>
  )
}

const CreatorAvatar = ({ creator, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: creator.avatar_color || '#D97757',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.4, fontWeight: 900, color: 'white', flexShrink: 0,
  }}>
    {creator.initial}
  </div>
)

export default EmailSubscribeUnlock
