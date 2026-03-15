// src/components/unlock/SponsorUnlock.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getSponsorVideoUrl,
  getSponsorProgress,
  saveSponsorProgress,
  hasCompletedSponsorUnlock,
  recordSponsorUnlock,
} from '../../services/sponsorService'
import { getFileEmoji, formatFileSize } from '../../services/uploadService'
import CreatorRow from '../shared/CreatorRow'

const SponsorUnlock = ({ link, currentUser, isLoggedIn, sessionKey }) => {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const progressInterval = useRef(null)

  // ── State ────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState('locked') // locked | unlocked | already_unlocked
  const [videoUrl, setVideoUrl] = useState(null)
  const [videoLoading, setVideoLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [skipCountdown, setSkipCountdown] = useState(-1) // -1 = not started
  const [canSkip, setCanSkip] = useState(false)
  const [videoWatchComplete, setVideoWatchComplete] = useState(false)
  const [ctaClicked, setCtaClicked] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [alreadyUnlocked, setAlreadyUnlocked] = useState(false)
  const [downloadStarted, setDownloadStarted] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [error, setError] = useState(null)

  const { sponsor_config, file, creator } = link
  const sponsorConfig = Array.isArray(sponsor_config) ? sponsor_config[0] : sponsor_config
  const videoFile = sponsorConfig?.video_file
  const skipAfterSeconds = sponsorConfig?.skip_after_seconds ?? 5
  const requiresClick = sponsorConfig?.requires_click ?? false

  const hasUnlockText = !!sponsorConfig?.unlock_text
  const hasUnlockUrl = !!sponsorConfig?.unlock_url
  const hasFile = !!file
  const hasYouTube = !!link.youtube_url

  // ── Restore session state ─────────────────────────────────────────────
  useEffect(() => {
    if (hasCompletedSponsorUnlock(link.id)) {
      setScreen('already_unlocked')
      return
    }
    const progress = getSponsorProgress(link.id)
    setVideoWatchComplete(progress.videoWatchComplete)
    setCtaClicked(progress.ctaClicked)
  }, [link.id])

  // ── Fetch sponsor video URL on mount ──────────────────────────────────
  useEffect(() => {
    if (!videoFile?.id) {
      setVideoLoading(false)
      return
    }
    const fetchUrl = async () => {
      try {
        const url = await getSponsorVideoUrl({
          fileId: videoFile.id,
          linkSlug: link.slug,
        })
        setVideoUrl(url)
      } catch (err) {
        console.error('Failed to get sponsor video URL:', err)
        setError('Failed to load sponsor video. Please refresh.')
      } finally {
        setVideoLoading(false)
      }
    }
    fetchUrl()
  }, [videoFile?.id, link.slug])

  // ── Auto-trigger unlock when conditions met ───────────────────────────
  const checkAndUnlock = useCallback(async (watchComplete, ctaDone) => {
    const conditionsMet = requiresClick
      ? (watchComplete && ctaDone)
      : watchComplete

    if (conditionsMet && !isUnlocking && screen === 'locked') {
      setIsUnlocking(true)
      setError(null)
      try {
        const result = await recordSponsorUnlock({
          linkId:           link.id,
          sponsorConfigId:  sponsorConfig?.id,
          viewerId:         currentUser?.id || null,
          linkSlug:         link.slug,
          fileId:           file?.id,
          ctaClicked:       ctaDone,
          watchDurationSeconds: Math.round(currentTime),
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
  }, [requiresClick, isUnlocking, screen, link.id, sponsorConfig?.id, currentUser?.id, link.slug, file?.id, currentTime])

  // ── Video event handlers ──────────────────────────────────────────────

  const handlePlay = () => {
    const video = videoRef.current
    if (!video) return
    video.play()
    setIsPlaying(true)
    if (!hasStarted) {
      setHasStarted(true)
      setSkipCountdown(skipAfterSeconds)
    }
  }

  const handlePause = () => {
    videoRef.current?.pause()
    setIsPlaying(false)
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
    setVideoWatchComplete(true)
    setCanSkip(true)
    const progress = getSponsorProgress(link.id)
    saveSponsorProgress(link.id, { ...progress, videoWatchComplete: true })
    checkAndUnlock(true, ctaClicked)
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)
    setDuration(video.duration || 0)
  }

  const handleSkip = () => {
    const video = videoRef.current
    if (video) {
      video.pause()
    }
    setIsPlaying(false)
    setVideoWatchComplete(true)
    const progress = getSponsorProgress(link.id)
    saveSponsorProgress(link.id, { ...progress, videoWatchComplete: true })
    checkAndUnlock(true, ctaClicked)
  }

  const handleCtaClick = () => {
    if (sponsorConfig?.brand_website) {
      window.open(sponsorConfig.brand_website, '_blank', 'noopener,noreferrer')
    }
    setCtaClicked(true)
    const progress = getSponsorProgress(link.id)
    saveSponsorProgress(link.id, { ...progress, ctaClicked: true })
    checkAndUnlock(videoWatchComplete, true)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(!isMuted)
  }

  // ── Skip countdown timer ──────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || canSkip || videoWatchComplete) return
    if (skipCountdown <= 0 && hasStarted) {
      setCanSkip(true)
      return
    }
    const timer = setInterval(() => {
      setSkipCountdown(prev => {
        if (prev <= 1) {
          setCanSkip(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isPlaying, canSkip, videoWatchComplete, skipCountdown, hasStarted])

  // ── Save playback position every 2 seconds ────────────────────────────
  useEffect(() => {
    if (!isPlaying) return
    progressInterval.current = setInterval(() => {
      const video = videoRef.current
      if (video) {
        const progress = getSponsorProgress(link.id)
        saveSponsorProgress(link.id, {
          ...progress,
          playbackPosition: video.currentTime,
        })
      }
    }, 2000)
    return () => clearInterval(progressInterval.current)
  }, [isPlaying, link.id])

  // ── Download handler ──────────────────────────────────────────────────
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

  const handleReAccess = async () => {
    setIsUnlocking(true)
    setError(null)
    try {
      const result = await recordSponsorUnlock({
        linkId:          link.id,
        sponsorConfigId: sponsorConfig?.id,
        viewerId:        currentUser?.id || null,
        linkSlug:        link.slug,
        fileId:          file?.id,
        ctaClicked:      true,
      })
      setDownloadUrl(result.downloadUrl)
      setAlreadyUnlocked(true)
      setScreen('unlocked')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setIsUnlocking(false)
    }
  }

  // ── Format time helper ────────────────────────────────────────────────
  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // ── Render: Already unlocked ──────────────────────────────────────────
  if (screen === 'already_unlocked') {
    return (
      <PageWrapper>
        <CreatorRow creator={creator} />
        <ContentPreviewCard link={link} sponsorConfig={sponsorConfig} />
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
            You already watched the sponsor video. Click below to re-access.
          </p>
          <button
            onClick={handleReAccess}
            disabled={isUnlocking}
            style={{
              width: '100%', height: '48px',
              background: isUnlocking ? '#F3F1EC' : '#417A55',
              color: isUnlocking ? '#AAA49C' : 'white',
              border: 'none', borderRadius: '12px',
              fontSize: '14px', fontWeight: 900, cursor: isUnlocking ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {isUnlocking ? 'Loading...' : 'Re-access content →'}
          </button>
        </div>
        {error && <ErrorBanner message={error} />}
      </PageWrapper>
    )
  }

  // ── Render: Unlocked ──────────────────────────────────────────────────
  if (screen === 'unlocked') {
    return (
      <PageWrapper>
        <CreatorRow creator={creator} />
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
              ? 'You already completed this sponsor challenge.'
              : 'Thanks for watching. Enjoy your content!'}
          </p>
        </div>

        {/* Content delivery: text → file → link → video */}

        {/* 1. Unlock text */}
        {hasUnlockText && (
          <div style={{
            background: 'white', border: '1px solid #E6E2D9',
            borderRadius: '16px', padding: '20px 16px', margin: '0 0 16px',
          }}>
            <div style={{
              fontSize: '12px', fontWeight: 800, color: '#6B6860',
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px',
            }}>📝 Your content</div>
            <div style={{
              fontSize: '14px', color: '#21201C', lineHeight: 1.7,
              fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {sponsorConfig.unlock_text}
            </div>
          </div>
        )}

        {/* 2. Download card */}
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
                }}>{link.title}</div>
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
              <p style={{ fontSize: '12px', color: '#6B6860', textAlign: 'center', margin: '10px 0 0' }}>
                Check your Downloads folder.{' '}
                <span onClick={handleDownload} style={{ color: '#D97757', fontWeight: 700, cursor: 'pointer' }}>Download again</span>
              </p>
            )}
          </div>
        )}

        {/* 3. External link */}
        {hasUnlockUrl && (
          <div style={{
            background: 'white', border: '1px solid #E6E2D9',
            borderRadius: '16px', padding: '20px 16px', margin: '0 0 16px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '12px', fontWeight: 800, color: '#6B6860',
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px',
            }}>🔗 Your resource</div>
            <a
              href={sponsorConfig.unlock_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', height: '48px',
                background: '#21201C', color: 'white', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 900, cursor: 'pointer', textDecoration: 'none',
              }}
            >Access Your Resource →</a>
            <p style={{ fontSize: '11px', color: '#AAA49C', marginTop: '8px', fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sponsorConfig.unlock_url}
            </p>
          </div>
        )}

        {/* 4. YouTube embed */}
        {hasYouTube && <YouTubeEmbed url={link.youtube_url} />}

        {/* Sponsor attribution */}
        <p style={{
          fontSize: '11px', color: '#AAA49C', textAlign: 'center',
          margin: '16px 0 0', fontWeight: 600,
        }}>
          Sponsored by {sponsorConfig?.brand_name}
        </p>

        {/* Creator profile CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', marginTop: '16px',
          border: '1px solid #E6E2D9', borderRadius: '12px',
        }}>
          <CreatorAvatar creator={creator} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#21201C' }}>{creator.name}</div>
            <div style={{ fontSize: '12px', color: '#6B6860', fontWeight: 600 }}>See more resources →</div>
          </div>
          <button
            onClick={() => navigate(`/@${creator.username}`)}
            style={{
              background: 'white', border: '1.5px solid #E6E2D9',
              borderRadius: '8px', padding: '8px 14px',
              fontSize: '12px', fontWeight: 800, color: '#21201C', cursor: 'pointer',
            }}
          >View profile</button>
        </div>

        <style>{`@keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
      </PageWrapper>
    )
  }

  // ── Render: Locked (default) ──────────────────────────────────────────
  return (
    <PageWrapper>
      <CreatorRow creator={creator} />
      <ContentPreviewCard link={link} sponsorConfig={sponsorConfig} />

      {/* Sponsor badge */}
      <div style={{
        background: '#FDF4EC', border: '1.5px solid #F5D0A9',
        borderRadius: '14px', padding: '14px 16px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '20px' }}>🎬</span>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#A0622A' }}>
            Sponsored by {sponsorConfig?.brand_name}
          </div>
          <div style={{ fontSize: '12px', color: '#A0622A', opacity: 0.8, fontWeight: 600 }}>
            Watch a short video to unlock this content
          </div>
        </div>
      </div>

      {/* Video player */}
      {videoLoading ? (
        <div style={{
          width: '100%', aspectRatio: '16/9', background: '#111',
          borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <div style={{
            width: '32px', height: '32px', border: '3px solid #333',
            borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : !videoUrl ? (
        <div style={{
          width: '100%', aspectRatio: '16/9', background: '#111',
          borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px', color: '#666', fontSize: '14px',
        }}>
          Failed to load video
        </div>
      ) : (
        <div
          style={{
            position: 'relative', width: '100%', borderRadius: '14px',
            overflow: 'hidden', background: '#111', marginBottom: '16px',
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration)
            }}
            style={{ width: '100%', display: 'block' }}
          />

          {/* Play button overlay (before playing) */}
          {!hasStarted && (
            <div
              onClick={handlePlay}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)', cursor: 'pointer', gap: '8px',
              }}
            >
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 0, height: 0,
                  borderTop: '14px solid transparent',
                  borderBottom: '14px solid transparent',
                  borderLeft: '22px solid #21201C',
                  marginLeft: '4px',
                }} />
              </div>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>
                Tap to play
              </span>
            </div>
          )}

          {/* Paused overlay (after started) */}
          {hasStarted && !isPlaying && !videoWatchComplete && (
            <div
              onClick={handlePlay}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.35)', cursor: 'pointer',
              }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 0, height: 0,
                  borderTop: '12px solid transparent',
                  borderBottom: '12px solid transparent',
                  borderLeft: '18px solid #21201C',
                  marginLeft: '3px',
                }} />
              </div>
            </div>
          )}

          {/* Video completed overlay */}
          {videoWatchComplete && !isPlaying && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
              <span style={{ color: 'white', fontSize: '14px', fontWeight: 800 }}>
                Video complete
              </span>
            </div>
          )}

          {/* Skip countdown / button */}
          {hasStarted && !videoWatchComplete && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
            }}>
              {canSkip ? (
                <button
                  onClick={handleSkip}
                  style={{
                    background: 'rgba(0,0,0,0.7)', color: 'white',
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px', padding: '6px 14px',
                    fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Skip →
                </button>
              ) : (
                <div style={{
                  background: 'rgba(0,0,0,0.7)', color: 'white',
                  borderRadius: '8px', padding: '6px 12px',
                  fontSize: '11px', fontWeight: 700,
                  backdropFilter: 'blur(8px)',
                }}>
                  Skip in {skipCountdown}s
                </div>
              )}
            </div>
          )}

          {/* Custom controls bar */}
          {hasStarted && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              padding: '20px 12px 10px',
            }}>
              {/* Progress bar */}
              <div
                onClick={(e) => {
                  if (videoWatchComplete) return // don't allow seeking after completion
                  const rect = e.currentTarget.getBoundingClientRect()
                  const ratio = (e.clientX - rect.left) / rect.width
                  const video = videoRef.current
                  if (video) video.currentTime = ratio * video.duration
                }}
                style={{
                  height: '4px', background: 'rgba(255,255,255,0.2)',
                  borderRadius: '2px', cursor: 'pointer', marginBottom: '8px',
                }}
              >
                <div style={{
                  height: '100%', width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                  background: '#D97757', borderRadius: '2px',
                  transition: 'width 100ms linear',
                }} />
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                {/* Play/Pause */}
                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  style={{
                    background: 'none', border: 'none', color: 'white',
                    fontSize: '18px', cursor: 'pointer', padding: '4px',
                  }}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>

                {/* Time */}
                <span style={{ color: 'white', fontSize: '11px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Mute */}
                <button
                  onClick={toggleMute}
                  style={{
                    background: 'none', border: 'none', color: 'white',
                    fontSize: '18px', cursor: 'pointer', padding: '4px',
                  }}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTA Button */}
      {sponsorConfig?.brand_website && (
        <button
          onClick={handleCtaClick}
          style={{
            width: '100%', height: '52px',
            background: ctaClicked ? '#EBF5EE' : (requiresClick ? '#D97757' : 'white'),
            color: ctaClicked ? '#417A55' : (requiresClick ? 'white' : '#21201C'),
            border: ctaClicked ? '1.5px solid #BBF7D0' : (requiresClick ? 'none' : '1.5px solid #E6E2D9'),
            borderRadius: '12px',
            fontSize: '15px', fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginBottom: '12px',
            transition: 'all 200ms ease',
            animation: (requiresClick && videoWatchComplete && !ctaClicked) ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          {ctaClicked ? (
            <>✅ Visited {sponsorConfig.brand_name}</>
          ) : (
            <>{sponsorConfig.cta_button_label || 'Visit Sponsor'} — {sponsorConfig.brand_name}</>
          )}
        </button>
      )}

      {/* Requires CTA hint */}
      {requiresClick && videoWatchComplete && !ctaClicked && (
        <div style={{
          background: '#FDF4EC', border: '1px solid #F5D0A9',
          borderRadius: '10px', padding: '10px 14px', marginBottom: '12px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: '#A0622A', margin: '0', fontWeight: 700 }}>
            👆 Tap the button above to complete the unlock
          </p>
        </div>
      )}

      {/* Unlocking spinner */}
      {isUnlocking && (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{
            display: 'inline-block', width: '28px', height: '28px',
            border: '3px solid #E6E2D9', borderTopColor: '#D97757',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '13px', color: '#6B6860', marginTop: '10px', fontWeight: 700 }}>
            Unlocking content...
          </p>
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {/* Trust line */}
      {!videoWatchComplete && (
        <p style={{
          fontSize: '11px', color: '#AAA49C', textAlign: 'center',
          margin: '8px 0 0', lineHeight: 1.6, fontWeight: 600,
        }}>
          {requiresClick
            ? 'Watch the video and visit the sponsor to unlock.'
            : 'Watch the video to unlock your content automatically.'}
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 87, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(217, 119, 87, 0); }
        }
      `}</style>
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

const ContentPreviewCard = ({ link, sponsorConfig }) => {
  const { file, title, description } = link
  const hasFile = !!file
  const hasYouTube = !!link.youtube_url

  return (
    <div style={{
      background: 'white', border: '1px solid #E6E2D9',
      borderRadius: '16px', overflow: 'hidden', marginBottom: '20px',
    }}>
      <div style={{
        height: '80px',
        background: 'linear-gradient(135deg, #FDF4EC 0%, #F5D0A9 100%)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px',
      }}>
        <span style={{ fontSize: '36px' }}>
          {hasFile ? getFileEmoji(file.original_name, file.mime_type) : '🎬'}
        </span>
        <div>
          <div style={{
            fontSize: '10px', fontWeight: 900, color: '#A0622A',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px',
          }}>
            🎬 Sponsor Unlock
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#A0622A', opacity: 0.8 }}>
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
      </div>
    </div>
  )
}

const ErrorBanner = ({ message }) => (
  <div style={{
    background: '#FDECEA', border: '1px solid #F5C6CB',
    borderRadius: '12px', padding: '12px 16px', marginTop: '12px',
  }}>
    <p style={{ fontSize: '13px', color: '#C0392B', margin: '0', fontWeight: 700 }}>
      {message}
    </p>
  </div>
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
      <iframe src={embedUrl} width="100%" height="220" frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen style={{ display: 'block' }} />
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

export default SponsorUnlock
