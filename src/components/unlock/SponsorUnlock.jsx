import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Play, VolumeX, Volume2, SkipForward } from 'lucide-react'
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
      <div className="w-full flex flex-col items-center animate-fadeIn pb-[48px]">
        <div className="w-16 h-16 bg-successBg rounded-full flex items-center justify-center text-success mb-6 border border-success/20">
          <CheckCircle2 size={32} strokeWidth={2.5} />
        </div>
        <h2 className="text-[20px] md:text-[24px] tracking-tight font-black text-text mb-3 text-center leading-tight">
          Already unlocked
        </h2>
        <p className="text-[14px] text-textMid text-center mb-8 max-w-[320px] leading-relaxed">
          You have already completed this sponsor requirement and unlocked the content.
        </p>
        <button onClick={() => setScreen('locked')} className="w-full h-10 bg-success hover:bg-success/90 text-white rounded-md text-[14px] font-bold max-w-[340px] transition-transform active:scale-[0.98] shadow-sm">
          Watch Again
        </button>
      </div>
    )
  }

  if (screen === 'unlocked') {
    return (
      <div className="w-full flex flex-col items-center animate-fadeIn pb-[48px]">
        <div className="w-16 h-16 bg-successBg rounded-full flex items-center justify-center text-success mb-6 border border-success/20">
          <CheckCircle2 size={32} strokeWidth={2.5} />
        </div>
        
        <h2 className="text-[20px] md:text-[24px] tracking-tight font-black text-text mb-3 text-center leading-tight">
          Access Granted!
        </h2>
        
        <p className="text-[14px] text-textMid text-center mb-8 max-w-[320px] leading-relaxed">
          Thanks for supporting the creator. Here is your resource.
        </p>

        <div className="w-full max-w-[400px] flex flex-col gap-6">
          {sponsorConfig?.unlock_text && (
            <div className="w-full flex justify-center">
              <p className="text-[14px] text-text leading-relaxed whitespace-pre-wrap">
                {sponsorConfig.unlock_text}
              </p>
            </div>
          )}

          {link.text_content && (
            <div className="w-full bg-surfaceAlt rounded-lg p-5 border border-border">
              <p className="text-[14px] text-text leading-relaxed whitespace-pre-wrap">
                {link.text_content}
              </p>
            </div>
          )}

          {link.content_links && link.content_links.length > 0 && (
            <div className="w-full flex flex-col gap-3">
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
                    className="w-full h-[64px] bg-white rounded-lg border border-border flex items-center px-4 gap-4 no-underline hover:bg-surfaceAlt transition-colors"
                  >
                     <div className="w-10 h-10 rounded-md flex items-center justify-center text-white font-[900] text-[15px] shrink-0"
                      style={{ backgroundColor: getDomainColor(cl.url) }}
                    >
                      {getDomainInitial(cl.url)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 justify-center">
                      <span className="text-[15px] font-[800] text-text truncate leading-tight">{cl.title || getDomainName(cl.url)}</span>
                      <span className="text-[13px] text-textLight font-medium truncate mt-0.5">{getDomainName(cl.url)}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {link.youtube_url && (
            <div className="w-full aspect-video rounded-lg overflow-hidden border border-border shadow-sm">
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
              className="w-full h-10 bg-brand text-white rounded-md text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-brandHover transition-colors no-underline shadow-sm"
            >
              {sponsorConfig.unlock_url_label || 'Access Link'} →
            </a>
          )}

          {file && (
             <div className="w-full flex items-center justify-between py-4 border-t border-border mt-2">
              <div className="flex items-center gap-4 min-w-0">
                <div className="text-[32px] shrink-0 leading-none">
                  {getFileEmoji(file.original_name, file.mime_type)}
                </div>
                <div className="flex flex-col min-w-0 justify-center">
                  <span className="text-[15px] font-[800] text-text truncate leading-tight">
                    {link.title}
                  </span>
                  <span className="text-[13px] text-textLight font-medium mt-0.5">
                    {formatFileSize(file.size_bytes)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDownload}
                disabled={!downloadUrl}
                className={`h-10 px-5 rounded-md text-[14px] font-bold transition-all shrink-0 ml-4 ${
                  downloadStarted ? 'bg-success text-white' : !downloadUrl ? 'bg-surfaceAlt text-textLight border border-border' : 'bg-brand text-white hover:bg-brandHover shadow-sm'
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
    <div className="w-full flex flex-col items-center animate-fadeIn pb-[48px]">
      {sponsorConfig?.brand_name && (
        <span className="text-[11px] font-[800] text-textLight uppercase tracking-widest mb-3">
          Brought to you by
        </span>
      )}
      
      <h2 className="text-[20px] md:text-[24px] tracking-tight font-black text-text mb-8 text-center leading-tight">
        {sponsorConfig?.brand_name || 'Our Premium Sponsor'}
      </h2>

      <div className="relative w-full max-w-[400px] aspect-[9/16] sm:aspect-[4/5] md:aspect-video bg-black rounded-lg overflow-hidden mb-8 shadow-sm border border-border flex items-center justify-center">
        {videoLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
            />
            {!hasStarted && (
              <div onClick={handlePlay} className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer gap-4 transition-all hover:bg-black/60 group">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center pl-1 shadow-md transform transition-transform group-hover:scale-105">
                   <Play size={24} className="text-text" fill="currentColor" />
                </div>
                <span className="text-white text-[12px] font-[800] uppercase tracking-wider drop-shadow-md">Play to unlock</span>
              </div>
            )}
            
            {hasStarted && !videoWatchComplete && (
               <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
                  <button onClick={toggleMute} className="w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-md text-white/90 rounded-md border border-white/10 hover:bg-black/80 transition-colors">
                     {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  {canSkip ? (
                    <button onClick={handleSkip} className="h-8 flex items-center justify-center gap-1.5 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-3 rounded-md border border-white/20 hover:bg-black/80 transition-colors shadow-sm animate-in fade-in slide-in-from-right-4">
                      Skip <SkipForward size={14} />
                    </button>
                  ) : (
                    <div className="h-8 flex items-center justify-center bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-bold uppercase tracking-wider px-3 rounded-md border border-white/10 opacity-80">
                      Skip in {skipCountdown}s
                    </div>
                  )}
               </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-[13px] font-medium">Video failed to load</div>
        )}
      </div>

      <div className="w-full max-w-[340px]">
        {sponsorConfig?.brand_website && (
          <button
             onClick={handleCtaClick}
             className={`w-full h-10 rounded-md text-[14px] font-bold flex items-center justify-center gap-2 transition-transform shadow-sm
                ${ctaClicked 
                   ? 'bg-success text-white' 
                   : 'bg-brand hover:bg-brandHover text-white hover:scale-[1.02] active:scale-[0.98]'
                }
             `}
          >
            {ctaClicked ? (
                <>
                    <CheckCircle2 size={16} strokeWidth={3} />
                    Visited {sponsorConfig.brand_name}
                </>
            ) : (
                sponsorConfig.cta_button_label || 'Visit Sponsor to Unlock'
            )}
          </button>
        )}

        {isUnlocking && (
          <div className="flex items-center justify-center gap-2 mt-6">
             <div className="w-4 h-4 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
             <p className="text-[13px] font-bold text-textMid">Unlocking resource...</p>
          </div>
        )}
        
        {error && (
            <div className="bg-errorBg text-error text-[13px] font-medium p-3 rounded-md text-center mt-6 border border-error/20">
                {error}
            </div>
        )}
        
        {!videoWatchComplete && !isUnlocking && (
          <p className="text-[12px] text-textLight text-center mt-6 font-bold uppercase tracking-wider">
             {requiresClick ? 'Watch video & visit sponsor' : 'Watch short video to unlock'}
          </p>
        )}
      </div>
    </div>
  )
}

export default SponsorUnlock
