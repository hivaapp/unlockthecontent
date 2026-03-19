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
      <div className="w-full flex flex-col items-center">
        <div className="w-16 h-16 bg-successBg rounded-full flex items-center justify-center text-3xl mb-4 border border-success/20">
          ✅
        </div>
        <h2 className="text-2xl font-black text-text mb-2 text-center">
          Already unlocked
        </h2>
        <p className="text-[14px] text-textMid text-center mb-8 max-w-[280px]">
          You already followed all accounts.
        </p>
        <button
          onClick={handleUnlock}
          disabled={isUnlocking}
          className="w-full h-12 bg-success hover:bg-success/90 text-white rounded-xl text-[15px] font-black flex items-center justify-center gap-2 max-w-[340px] transition-all shadow-sm"
        >
          {isUnlocking ? 'Loading...' : 'Access Content →'}
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
          Content unlocked!
        </h2>
        
        <p className="text-[14px] text-textMid text-center mb-8">
          Enjoy your resource.
        </p>

        <div className="w-full max-w-[400px] flex flex-col gap-6">
          {socialConfig?.unlock_text && (
            <div className="text-center">
              <p className="text-[15px] font-[500] text-text leading-relaxed whitespace-pre-wrap">
                {socialConfig.unlock_text}
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

          {socialConfig?.unlock_url && (
            <a
              href={socialConfig.unlock_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 bg-white border border-border text-text rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-surfaceAlt transition-colors no-underline shadow-sm"
            >
              {socialConfig.unlock_url_label || 'Access Link'} →
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

      
      <h2 className="text-2xl font-black text-text mb-3 text-center leading-tight">
        {socialConfig?.custom_heading || 'Follow to unlock'}
      </h2>
      
      {socialConfig?.follow_description && (
        <p className="text-[14px] text-textMid text-center max-w-[320px] mb-8 leading-relaxed">
          {socialConfig.follow_description}
        </p>
      )}

      <div className="w-full max-w-[400px]">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[11px] font-black text-textMid uppercase tracking-wider">
            Progress: {visitedCount}/{totalTargets}
          </span>
          {allVisited && <span className="text-[11px] font-black text-success uppercase tracking-wider">Complete ✓</span>}
        </div>
        
        <div className="h-1.5 bg-surfaceAlt rounded-full overflow-hidden mb-6">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${allVisited ? 'bg-success' : 'bg-brand'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex flex-col gap-0 mb-6 border-t border-border">
          {followTargets.map((target) => (
            <FollowTargetCard
              key={target.id}
              target={target}
              isVisited={visitedIds.includes(target.id)}
              onClick={() => handleTargetClick(target)}
            />
          ))}
        </div>

        <button
          onClick={handleUnlock}
          disabled={!allVisited || isUnlocking}
          className={`w-full h-12 rounded-xl text-[15px] font-black flex items-center justify-center gap-2 transition-all shadow-sm ${
            allVisited 
              ? 'bg-brand hover:bg-brandHover text-white active:scale-[0.98]' 
              : 'bg-surfaceAlt text-textLight cursor-not-allowed hidden'
          }`}
        >
          {isUnlocking ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Unlocking...
            </>
          ) : (
            'Continue to Resource →'
          )}
        </button>

        {error && <p className="text-[12px] font-bold text-error mt-4 text-center">{error}</p>}
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
      className="w-full h-16 flex items-center gap-4 py-2 border-b border-border transition-colors text-left bg-transparent hover:bg-surfaceAlt group"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
        isVisited ? 'bg-success/10 text-success' : 'bg-surfaceAlt text-textMid group-hover:bg-white border border-border/50'
      }`}>
        {isVisited ? (
          <span className="text-lg">✓</span>
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
        <div className={`text-[14px] font-[700] truncate ${isVisited ? 'text-textMid line-through' : 'text-text'}`}>
          {label}
        </div>
        {target.instruction_text && !isVisited && (
          <div className="text-[12px] font-medium text-textLight truncate">
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
