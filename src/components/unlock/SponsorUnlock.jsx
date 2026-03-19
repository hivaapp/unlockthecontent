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
import { getYoutubeEmbedUrl } from '../../lib/utils'

const SponsorUnlock = ({ link, currentUser, isLoggedIn, sessionKey, onUnlockSuccess }) => {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const progressInterval = useRef(null)

  const [screen, setScreen] = useState('locked')
  const [videoUrl, setVideoUrl] = useState(null)
  const [videoLoading, setVideoLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [skipCountdown, setSkipCountdown] = useState(-1)
  const [canSkip, setCanSkip] = useState(false)
  const [videoWatchComplete, setVideoWatchComplete] = useState(false)
  const [ctaClicked, setCtaClicked] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [alreadyUnlocked, setAlreadyUnlocked] = useState(false)
  const [downloadStarted, setDownloadStarted] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [error, setError] = useState(null)

  const { sponsor_config, file } = link
  const sponsorConfig = Array.isArray(sponsor_config) ? sponsor_config[0] : sponsor_config
  const videoFile = sponsorConfig?.video_file
  const skipAfterSeconds = sponsorConfig?.skip_after_seconds ?? 5
  const requiresClick = sponsorConfig?.requires_click ?? false

  useEffect(() => {
    if (hasCompletedSponsorUnlock(link.id)) {
      setScreen('already_unlocked')
      if (onUnlockSuccess) onUnlockSuccess()
      return
    }
    const progress = getSponsorProgress(link.id)
    setVideoWatchComplete(progress.videoWatchComplete)
    setCtaClicked(progress.ctaClicked)
  }, [link.id])

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
        setError('Failed to load sponsor video.')
      } finally {
        setVideoLoading(false)
      }
    }
    fetchUrl()
  }, [videoFile?.id, link.slug])

  const checkAndUnlock = useCallback(async (watchComplete, ctaDone) => {
    const conditionsMet = requiresClick ? (watchComplete && ctaDone) : watchComplete
    if (conditionsMet && !isUnlocking && screen === 'locked') {
      setIsUnlocking(true)
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
        if (onUnlockSuccess) onUnlockSuccess()
      } catch (err) {
        setError(err.message || 'Unlock failed.')
      } finally {
        setIsUnlocking(false)
      }
    }
  }, [requiresClick, isUnlocking, screen, link.id, sponsorConfig?.id, currentUser?.id, link.slug, file?.id, currentTime])

  const handlePlay = () => {
    videoRef.current?.play()
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
    saveSponsorProgress(link.id, { ...getSponsorProgress(link.id), videoWatchComplete: true })
    checkAndUnlock(true, ctaClicked)
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      setDuration(videoRef.current.duration || 0)
    }
  }

  const handleSkip = () => {
    videoRef.current?.pause()
    setIsPlaying(false)
    setVideoWatchComplete(true)
    saveSponsorProgress(link.id, { ...getSponsorProgress(link.id), videoWatchComplete: true })
    checkAndUnlock(true, ctaClicked)
  }

  const handleCtaClick = () => {
    if (sponsorConfig?.brand_website) {
      window.open(sponsorConfig.brand_website, '_blank', 'noopener,noreferrer')
    }
    setCtaClicked(true)
    saveSponsorProgress(link.id, { ...getSponsorProgress(link.id), ctaClicked: true })
    checkAndUnlock(videoWatchComplete, true)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  useEffect(() => {
    if (!isPlaying || canSkip || videoWatchComplete) return
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
  }, [isPlaying, canSkip, videoWatchComplete, skipCountdown])

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

  if (screen === 'already_unlocked') {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="w-16 h-16 bg-successBg rounded-full flex items-center justify-center text-3xl mb-4 border border-success/20">
          ✅
        </div>
        <h2 className="text-2xl font-black text-text mb-2 text-center">
          Already unlocked
        </h2>
        <p className="text-[14px] text-textMid text-center mb-8 max-w-[280px]">
          You have already watched the sponsor video.
        </p>
        <button onClick={() => setScreen('locked')} className="w-full h-12 bg-success hover:bg-success/90 text-white rounded-xl text-[15px] font-black max-w-[340px] transition-all shadow-sm">
          Watch Again
        </button>
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
          Content Ready!
        </h2>
        
        <p className="text-[14px] text-textMid text-center mb-8">
          Thanks for your support.
        </p>

        <div className="w-full max-w-[400px] flex flex-col gap-6">
          {sponsorConfig?.unlock_text && (
            <div className="text-center">
              <p className="text-[15px] font-[500] text-text leading-relaxed whitespace-pre-wrap">
                {sponsorConfig.unlock_text}
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
                  <a key={idx} href={cl.url} target="_blank" rel="noopener noreferrer"
                    className="w-full h-[52px] bg-white rounded-[12px] border border-border flex items-center px-3 gap-3 no-underline hover:bg-surfaceAlt transition-colors"
                  >
                    <div className="w-[32px] h-[32px] rounded-[6px] flex items-center justify-center text-white font-[900] text-[14px] shrink-0"
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

          {sponsorConfig?.unlock_url && (
            <a
              href={sponsorConfig.unlock_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 bg-white border border-border text-text rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-surfaceAlt transition-colors no-underline shadow-sm"
            >
              {sponsorConfig.unlock_url_label || 'Access Link'} →
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
      {sponsorConfig?.brand_name && (
        <span className="text-[11px] font-bold text-textMid uppercase tracking-wider mb-2">
          Sponsored By
        </span>
      )}
      
      <h2 className="text-2xl font-black text-text mb-6 text-center leading-tight">
        {sponsorConfig?.brand_name || 'Our Sponsor'}
      </h2>

      <div className="relative w-full max-w-[400px] aspect-video bg-black rounded-2xl overflow-hidden mb-6 shadow-md border border-border/50">
        {videoLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              className="w-full h-full object-cover"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
            />
            {!hasStarted && (
              <div onClick={handlePlay} className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer gap-3 transition-all hover:bg-black/40">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center pl-1 shadow-xl transform transition-transform hover:scale-105">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[16px] border-l-brand" />
                </div>
                <span className="text-white text-[11px] font-black uppercase tracking-widest drop-shadow-md">Play to unlock</span>
              </div>
            )}
            
            {hasStarted && !videoWatchComplete && (
               <div className="absolute top-3 right-3 z-10">
                  {canSkip ? (
                    <button onClick={handleSkip} className="bg-black/70 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-lg border border-white/20 hover:bg-black/80 transition-colors shadow-sm">
                      Skip →
                    </button>
                  ) : (
                    <div className="bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg border border-white/10">
                      Skip in {skipCountdown}s
                    </div>
                  )}
               </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm font-medium">Video failed to load</div>
        )}
      </div>

      <div className="w-full max-w-[400px]">
        {sponsorConfig?.brand_website && (
          <button
            onClick={handleCtaClick}
            className={`w-full h-12 rounded-xl text-[15px] font-black flex items-center justify-center gap-2 transition-all shadow-sm ${
              ctaClicked ? 'bg-success text-white' : 'bg-brand hover:bg-brandHover text-white'
            }`}
          >
            {ctaClicked ? `✅ Visited ${sponsorConfig.brand_name}` : `${sponsorConfig.cta_button_label || 'Visit Sponsor'}`}
          </button>
        )}

        {isUnlocking && (
          <p className="text-[13px] font-bold text-textMid mt-4 text-center animate-pulse">Unlocking...</p>
        )}
        
        {error && <div className="text-error text-[12px] font-bold bg-errorBg p-3 rounded-lg text-center mt-4">{error}</div>}
        
        {!videoWatchComplete && !isUnlocking && (
          <p className="text-[11px] text-textMid text-center mt-4 font-bold uppercase tracking-wider">
             {requiresClick ? 'Watch video & visit sponsor' : 'Watch video to unlock'}
          </p>
        )}
      </div>
    </div>
  )
}

export default SponsorUnlock
