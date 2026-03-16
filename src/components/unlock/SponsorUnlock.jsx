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
      <div className="w-full text-center">
        <div className="bg-successBg border border-success/20 rounded-xl p-4 mb-4">
          <div className="text-xl mb-1">✅</div>
          <h3 className="text-success font-black mb-2">Already unlocked</h3>
          <button onClick={() => setScreen('locked')} className="w-full h-10 bg-success text-white rounded-xl text-sm font-black transition-all">
             Watch Again
          </button>
        </div>
      </div>
    )
  }

  if (screen === 'unlocked') {
    return (
      <div className="w-full animate-pop-in">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">🎉</div>
          <h2 className="text-lg font-black text-text mb-0.5">Content Ready!</h2>
          <p className="text-[12px] text-textMid">Thanks for your support.</p>
        </div>

        {file && (
          <div className="bg-white border border-border rounded-xl p-4 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-surfaceAlt flex items-center justify-center text-2xl">
                {getFileEmoji(file.original_name, file.mime_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-text truncate">{link.title}</div>
                <div className="text-[11px] text-textLight font-bold">
                  {file.original_name} · {formatFileSize(file.size_bytes)}
                </div>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className={`w-full h-12 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
                downloadStarted ? 'bg-success text-white' : 'bg-brand text-white'
              }`}
            >
              {downloadStarted ? '✅ Downloaded' : '⬇️ Download Now'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-warningBg border border-warning/20 rounded-xl p-3 mb-4 flex gap-3 items-center">
        <span className="text-lg">🎬</span>
        <div>
          <div className="text-[13px] font-black text-warning leading-tight">
            Sponsored by {sponsorConfig?.brand_name}
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-3 shadow-sm">
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
              className="w-full h-full"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
            />
            {!hasStarted && (
              <div onClick={handlePlay} className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer gap-2">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center pl-1 shadow-lg">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-text" />
                </div>
                <span className="text-white text-xs font-black uppercase tracking-widest">Play to unlock</span>
              </div>
            )}
            
            {hasStarted && !videoWatchComplete && (
               <div className="absolute top-3 right-3">
                  {canSkip ? (
                    <button onClick={handleSkip} className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-white/20">Skip →</button>
                  ) : (
                    <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg">Skip in {skipCountdown}s</div>
                  )}
               </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs">Video failed to load</div>
        )}
      </div>

      {sponsorConfig?.brand_website && (
        <button
          onClick={handleCtaClick}
          className={`w-full h-11 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all border ${
            ctaClicked ? 'bg-successBg border-success/20 text-success' : 'bg-white border-border text-text'
          }`}
        >
          {ctaClicked ? `✅ Visited ${sponsorConfig.brand_name}` : `${sponsorConfig.cta_button_label || 'Visit Sponsor'}`}
        </button>
      )}

      {error && <div className="text-error text-[10px] font-bold text-center mt-2 uppercase tracking-wider">{error}</div>}
      
      {!videoWatchComplete && (
        <p className="text-[9px] text-textLight text-center mt-3 font-bold uppercase tracking-wider">
           {requiresClick ? 'Watch video & visit sponsor' : 'Watch video to unlock'}
        </p>
      )}
    </div>
  )
}

export default SponsorUnlock
