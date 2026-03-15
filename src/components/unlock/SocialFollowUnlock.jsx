// src/components/unlock/SocialFollowUnlock.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getVisitedTargets,
  markTargetVisited,
  hasCompletedSocialUnlock,
  recordSocialUnlock,
  getTargetUrl,
  getTargetLabel,
  getTargetIcon,
  PLATFORM_INFO,
} from '../../services/socialFollowService'
import { getFileEmoji, formatFileSize } from '../../services/uploadService'
import CreatorRow from '../shared/CreatorRow'

const SocialFollowUnlock = ({ link, currentUser, isLoggedIn, sessionKey }) => {
  const navigate = useNavigate()

  // ── Internal states ──────────────────────────────────────────────────
  // 'locked' → 'unlocking' → 'unlocked'
  const [screen, setScreen] = useState('locked')
  const [visitedIds, setVisitedIds] = useState([])
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [alreadyUnlocked, setAlreadyUnlocked] = useState(false)
  const [downloadStarted, setDownloadStarted] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [error, setError] = useState(null)

  const { social_config, file, creator } = link
  const socialConfig = Array.isArray(social_config) ? social_config[0] : social_config
  const followTargets = socialConfig?.follow_targets
    ? [...socialConfig.follow_targets].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : []

  const totalTargets = followTargets.length
  const visitedCount = visitedIds.filter(id => followTargets.some(t => t.id === id)).length
  const allVisited = visitedCount >= totalTargets && totalTargets > 0
  const progressPercent = totalTargets > 0 ? (visitedCount / totalTargets) * 100 : 0

  // ── Helpers for unlock content ────────────────────────────────────────
  // Social follow links store unlock_text and unlock_url on social_configs,
  // mirroring email_configs.unlock_text and email_configs.unlock_url.
  const hasUnlockText = !!socialConfig?.unlock_text
  const hasUnlockUrl = !!socialConfig?.unlock_url
  const hasFile = !!file
  const hasYouTube = !!link.youtube_url

  // ── Restore state from sessionStorage ─────────────────────────────────
  useEffect(() => {
    if (hasCompletedSocialUnlock(link.id)) {
      setScreen('already_unlocked')
    }
    const stored = getVisitedTargets(link.id)
    setVisitedIds(stored)
  }, [link.id])

  // ── Auto-trigger unlock when all targets visited ──────────────────────
  useEffect(() => {
    if (allVisited && screen === 'locked' && !isUnlocking) {
      handleUnlock()
    }
  }, [allVisited, screen])

  // ── Handle clicking a follow target ───────────────────────────────────
  const handleTargetClick = (target) => {
    const url = getTargetUrl(target)
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer')
    // Mark as visited immediately
    const updatedVisited = markTargetVisited(link.id, target.id)
    setVisitedIds([...updatedVisited])
  }

  // ── Handle unlock ────────────────────────────────────────────────────
  const handleUnlock = async () => {
    if (isUnlocking) return
    setIsUnlocking(true)
    setError(null)

    try {
      const result = await recordSocialUnlock({
        linkId:          link.id,
        socialConfigId:  socialConfig?.id,
        viewerId:        currentUser?.id || null,
        linkSlug:        link.slug,
        fileId:          file?.id,
        completedTargets: followTargets.map(t => t.id),
      })

      setDownloadUrl(result.downloadUrl)
      setAlreadyUnlocked(result.alreadyUnlocked)
      setScreen('unlocked')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsUnlocking(false)
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

  // ── Render: Already unlocked (session refresh) ───────────────────────
  if (screen === 'already_unlocked') {
    return (
      <PageWrapper>
        <CreatorRow creator={creator} />
        <ContentPreviewCard link={link} socialConfig={socialConfig} />

        <div style={{
          background: '#EBF5EE', border: '1.5px solid #BBF7D0',
          borderRadius: '14px', padding: '20px 16px',
          textAlign: 'center', marginTop: '20px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#417A55', margin: '0 0 6px' }}>
            Already unlocked
          </h3>
          <p style={{ fontSize: '13px', color: '#417A55', margin: '0 0 16px', lineHeight: 1.6, opacity: 0.8 }}>
            You already completed all follows. Click below to re-access the content.
          </p>
          <button
            onClick={handleUnlock}
            disabled={isUnlocking}
            style={{
              width: '100%', height: '48px',
              background: isUnlocking ? '#F3F1EC' : '#417A55',
              color: isUnlocking ? '#AAA49C' : 'white',
              border: 'none', borderRadius: '12px',
              fontSize: '14px', fontWeight: 900, cursor: isUnlocking ? 'default' : 'pointer',
              transition: 'all 200ms ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {isUnlocking ? (
              <>
                <span style={{
                  display: 'inline-block', width: '16px', height: '16px',
                  border: '2px solid #E6E2D9', borderTopColor: '#AAA49C',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                }} />
                Loading...
              </>
            ) : (
              'Re-access content →'
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </PageWrapper>
    )
  }

  // ── Render: Unlocked (success) ───────────────────────────────────────
  if (screen === 'unlocked') {
    return (
      <PageWrapper>
        <CreatorRow creator={creator} />

        {/* Success celebration */}
        <div style={{ textAlign: 'center', padding: '24px 16px 16px' }}>
          <div style={{
            fontSize: '52px', marginBottom: '8px',
            animation: 'popIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            🎉
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#21201C', margin: '0 0 6px' }}>
            {alreadyUnlocked ? 'Welcome back!' : 'Content unlocked!'}
          </h2>
          <p style={{ fontSize: '14px', color: '#6B6860', margin: '0', lineHeight: 1.65 }}>
            {alreadyUnlocked
              ? 'You already followed all accounts.'
              : `You followed ${totalTargets} account${totalTargets !== 1 ? 's' : ''}. Enjoy!`
            }
          </p>
        </div>

        {/* ── Content Delivery (same order as email: text → file → link → video) ── */}

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
              {socialConfig.unlock_text}
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
              href={socialConfig.unlock_url}
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
              {socialConfig.unlock_url}
            </p>
          </div>
        )}

        {/* 4. YouTube embed (if set) */}
        {hasYouTube && (
          <YouTubeEmbed url={link.youtube_url} />
        )}

        {/* Social CTA */}
        <div style={{
          background: '#EFF6FF', borderRadius: '12px',
          padding: '16px', marginBottom: '16px',
        }}>
          <p style={{ fontSize: '13px', color: '#2563EB', margin: '0', lineHeight: 1.65, fontWeight: 600 }}>
            👥 Thank you for following! Stay connected for great content.
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
      <ContentPreviewCard link={link} socialConfig={socialConfig} />

      {/* Follow instruction card */}
      <div style={{
        background: '#EFF6FF', border: '1.5px solid #93C5FD',
        borderRadius: '14px', padding: '16px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>👥</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#2563EB', marginBottom: '4px' }}>
              {socialConfig?.custom_heading || 'Follow to unlock'}
            </div>
            {socialConfig?.follow_description && (
              <div style={{ fontSize: '13px', color: '#2563EB', lineHeight: 1.6, opacity: 0.85 }}>
                {socialConfig.follow_description}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#21201C' }}>
            {visitedCount} of {totalTargets} followed
          </span>
          {allVisited && (
            <span style={{
              fontSize: '11px', fontWeight: 800, color: '#417A55',
              background: '#EBF5EE', padding: '2px 8px', borderRadius: '6px',
            }}>
              All done ✓
            </span>
          )}
        </div>
        <div style={{
          height: '6px', background: '#F3F1EC', borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: allVisited ? '#417A55' : '#2563EB',
            borderRadius: '3px',
            transition: 'width 400ms cubic-bezier(0.34, 1.56, 0.64, 1), background 300ms ease',
          }} />
        </div>
      </div>

      {/* Follow target cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {followTargets.map((target) => {
          const isVisited = visitedIds.includes(target.id)
          return (
            <FollowTargetCard
              key={target.id}
              target={target}
              isVisited={isVisited}
              onClick={() => handleTargetClick(target)}
            />
          )
        })}
      </div>

      {/* Unlocking spinner */}
      {isUnlocking && (
        <div style={{
          textAlign: 'center', padding: '20px',
        }}>
          <div style={{
            display: 'inline-block', width: '28px', height: '28px',
            border: '3px solid #E6E2D9', borderTopColor: '#2563EB',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '13px', color: '#6B6860', marginTop: '10px', fontWeight: 700 }}>
            Unlocking content...
          </p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{
          background: '#FDECEA', border: '1px solid #F5C6CB',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '16px',
        }}>
          <p style={{ fontSize: '13px', color: '#C0392B', margin: '0', fontWeight: 700 }}>
            {error}
          </p>
        </div>
      )}

      {/* Trust line */}
      <p style={{
        fontSize: '11px', color: '#AAA49C', textAlign: 'center',
        margin: '12px 0 0', lineHeight: 1.6, fontWeight: 600,
      }}>
        Tap each account above to visit. Content unlocks automatically when all are visited.
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

const ContentPreviewCard = ({ link, socialConfig }) => {
  const { file, title, description } = link
  const hasFile = !!file
  const hasYouTube = !!link.youtube_url

  return (
    <div style={{
      background: 'white', border: '1px solid #E6E2D9',
      borderRadius: '16px', overflow: 'hidden', marginBottom: '20px',
    }}>
      {/* Gradient top zone */}
      <div style={{
        height: '80px',
        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px',
      }}>
        <span style={{ fontSize: '36px' }}>
          {hasFile ? getFileEmoji(file.original_name, file.mime_type) : '👥'}
        </span>
        <div>
          <div style={{
            fontSize: '10px', fontWeight: 900, color: '#2563EB',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px',
          }}>
            👥 Social Follow
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', opacity: 0.8 }}>
            {hasFile ? `${file.file_type?.toUpperCase()} · ${formatFileSize(file.size_bytes)}` :
              hasYouTube ? 'Video content' : 'Digital content'}
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
              fontSize: '11px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF',
              padding: '3px 8px', borderRadius: '6px',
            }}>
              📎 {file.original_name}
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

const FollowTargetCard = ({ target, isVisited, onClick }) => {
  const icon = getTargetIcon(target)
  const label = getTargetLabel(target)
  const platformInfo = target.type === 'platform' ? PLATFORM_INFO[target.platform] : null

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: '64px',
        background: isVisited ? '#F0FDF4' : 'white',
        border: `1.5px solid ${isVisited ? '#BBF7D0' : '#E6E2D9'}`,
        borderRadius: '14px',
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'all 200ms ease',
        textAlign: 'left',
        fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* Icon */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: isVisited ? '#DCFCE7' : (platformInfo?.color ? `${platformInfo.color}12` : '#F3F1EC'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', flexShrink: 0,
        transition: 'background 200ms ease',
      }}>
        {isVisited ? '✅' : icon}
      </div>

      {/* Label and status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px', fontWeight: 800,
          color: isVisited ? '#417A55' : '#21201C',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 200ms ease',
        }}>
          {label}
        </div>
        {target.instruction_text && (
          <div style={{
            fontSize: '12px', color: isVisited ? '#417A55' : '#6B6860',
            fontWeight: 600, marginTop: '2px', opacity: 0.8,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {target.instruction_text}
          </div>
        )}
        {isVisited && (
          <div style={{
            fontSize: '11px', fontWeight: 700, color: '#417A55',
            marginTop: '3px',
          }}>
            Visited ✓
          </div>
        )}
      </div>

      {/* Arrow / Check indicator */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: isVisited ? '#417A55' : '#F3F1EC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', flexShrink: 0,
        color: isVisited ? 'white' : '#AAA49C',
        fontWeight: 900,
        transition: 'all 200ms ease',
      }}>
        {isVisited ? '✓' : '→'}
      </div>
    </button>
  )
}

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

export default SocialFollowUnlock
