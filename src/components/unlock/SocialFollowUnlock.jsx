// src/components/unlock/SocialFollowUnlock.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, ExternalLink, Users, CheckCircle2 } from 'lucide-react'
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
import { socialIcons } from '../../assets/socialIcons'
import { getYoutubeEmbedUrl } from '../../lib/utils'

const SocialFollowUnlock = ({ link, currentUser, isLoggedIn, sessionKey, onUnlockSuccess }) => {
  const navigate = useNavigate()

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

  useEffect(() => {
    if (hasCompletedSocialUnlock(link.id)) {
      setScreen('already_unlocked')
      if (onUnlockSuccess) onUnlockSuccess()
    }
    const stored = getVisitedTargets(link.id)
    setVisitedIds(stored)
  }, [link.id])

  useEffect(() => {
    if (allVisited && screen === 'locked' && !isUnlocking) {
      handleUnlock()
    }
  }, [allVisited, screen])

  const handleTargetClick = (target) => {
    const url = getTargetUrl(target)
    window.open(url, '_blank', 'noopener,noreferrer')
    const updatedVisited = markTargetVisited(link.id, target.id)
    setVisitedIds([...updatedVisited])
  }

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
      if (onUnlockSuccess) onUnlockSuccess()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsUnlocking(false)
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

  if (screen === 'already_unlocked') {
    return (
      <div className="w-full flex flex-col items-center animate-fadeIn">
        <div className="w-12 h-12 bg-surfaceAlt rounded-full flex items-center justify-center text-text mb-6 border border-border">
          <CheckCircle2 size={24} strokeWidth={2.5} />
        </div>
        <h2 className="text-[24px] md:text-[28px] tracking-tight font-black text-text mb-2 text-center leading-tight">
          Already unlocked
        </h2>
        <p className="text-[15px] text-textMid text-center mb-8 max-w-[280px]">
          You already completed all steps earlier.
        </p>
        <button
          onClick={handleUnlock}
          disabled={isUnlocking}
          className="w-full h-10 bg-brand hover:bg-brandHover text-white rounded-md text-[14px] font-bold flex items-center justify-center gap-2 max-w-[340px] transition-transform active:scale-[0.98] shadow-sm disabled:opacity-50"
        >
          {isUnlocking ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            'Access Resource'
          )}
        </button>
      </div>
    )
  }

  if (screen === 'unlocked') {
    return (
      <div className="w-full flex flex-col items-center animate-fadeIn">
        <div className="w-12 h-12 bg-successBg text-success rounded-full flex items-center justify-center mb-6 border border-success/20">
          <CheckCircle2 size={24} strokeWidth={2.5} />
        </div>
        
        <h2 className="text-[24px] md:text-[28px] tracking-tight font-black text-text mb-2 text-center">
          Access Granted!
        </h2>
        
        <p className="text-[15px] font-medium text-textMid text-center mb-10">
          {alreadyUnlocked ? 'Here is your unlocked resource.' : 'Successfully completed all steps. Here is your resource.'}
        </p>

        <div className="w-full max-w-[400px] flex flex-col gap-8 text-left">
          {socialConfig?.unlock_text && (
            <div className="text-center w-full">
              <p className="text-[15px] font-[500] text-text leading-relaxed whitespace-pre-wrap">
                {socialConfig.unlock_text}
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

          {socialConfig?.unlock_url && (
            <div className="w-full flex flex-col gap-2 mt-2">
              <a
                href={socialConfig.unlock_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-10 bg-brand text-white rounded-md text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-brandHover transition-colors shadow-sm"
              >
                {socialConfig.unlock_url_label || 'Access Link'} <ExternalLink size={16} />
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
                        : (socialConfig?.unlock_url 
                            ? 'bg-white text-text border border-border hover:bg-surfaceAlt' 
                            : 'bg-brand text-white hover:bg-brandHover shadow-sm')
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
        <Users size={24} strokeWidth={2.5} />
      </div>
      
      <h2 className="text-[24px] md:text-[28px] tracking-tight font-black text-text mb-3 text-center leading-tight">
        {socialConfig?.custom_heading || 'Complete steps to unlock'}
      </h2>
      
      {socialConfig?.follow_description && (
        <p className="text-[15px] text-textMid text-center max-w-[320px] mb-8 leading-relaxed">
          {socialConfig.follow_description}
        </p>
      )}

      {!socialConfig?.follow_description && (
        <div className="mb-8 p-0" />
      )}

      <div className="w-full max-w-[340px]">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[12px] font-bold text-textMid uppercase tracking-wider">
            Progress: {visitedCount}/{totalTargets}
          </span>
          {allVisited && <span className="text-[12px] font-bold text-success uppercase tracking-wider">Complete ✓</span>}
        </div>
        
        <div className="h-[6px] bg-surfaceAlt rounded-full overflow-hidden mb-8 border border-border">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${allVisited ? 'bg-success' : 'bg-brand'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex flex-col gap-0 mb-8 border-t border-border">
          {followTargets.map((target) => (
            <FollowTargetCard
              key={target.id}
              target={target}
              isVisited={visitedIds.includes(target.id)}
              onClick={() => handleTargetClick(target)}
            />
          ))}
        </div>

        {allVisited && (
          <button
            onClick={handleUnlock}
            disabled={isUnlocking}
            className={`w-full h-10 rounded-md text-[14px] font-bold flex items-center justify-center gap-2 transition-transform shadow-sm bg-brand hover:bg-brandHover text-white active:scale-[0.98] animate-in slide-in-from-bottom-2 fade-in duration-300 disabled:opacity-50`}
          >
            {isUnlocking ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Unlocking...
              </>
            ) : (
              'Get Instant Access'
            )}
          </button>
        )}

        {error && <p className="text-[12px] font-bold text-error mt-4 text-center">{error}</p>}
      </div>
    </div>
  )
}

const FollowTargetCard = ({ target, isVisited, onClick }) => {
  const icon = getTargetIcon(target)
  const label = getTargetLabel(target)

  return (
    <button
      onClick={onClick}
      className={`w-full h-[64px] flex items-center gap-4 py-2 border-b border-border transition-colors text-left bg-white hover:bg-surfaceAlt group px-3 -mx-3 rounded-md ${isVisited ? 'opacity-70' : ''}`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
        isVisited ? 'bg-successBg text-success border border-success/20' : 'bg-surfaceAlt text-textMid group-hover:bg-white border border-border'
      }`}>
        {isVisited ? (
          <CheckCircle2 size={18} strokeWidth={3} />
        ) : (target.type === 'platform' && socialIcons[target.platform]) ? (
          <img 
            src={socialIcons[target.platform]} 
            alt={target.platform}
            className="w-5 h-5 object-contain"
          />
        ) : (
          <span className="text-lg">{icon}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className={`text-[15px] font-[800] truncate ${isVisited ? 'text-textMid line-through' : 'text-text'}`}>
          {label}
        </div>
        {target.instruction_text && !isVisited && (
          <div className="text-[13px] font-medium text-textLight truncate mt-0.5">
            {target.instruction_text}
          </div>
        )}
      </div>
      <div className="w-8 h-8 flex items-center justify-end text-textLight transition-colors shrink-0">
        {isVisited ? null : <span className="text-lg group-hover:text-text transition-colors">↗</span>}
      </div>
    </button>
  )
}

export default SocialFollowUnlock
