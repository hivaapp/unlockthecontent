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
      <div className="w-full">
        <div className="bg-successBg border border-success/20 rounded-xl p-4 mb-4 text-center">
          <div className="text-xl mb-1">✅</div>
          <h3 className="text-success font-black mb-1">Already unlocked</h3>
          <p className="text-[12px] text-success/80 mb-3 leading-relaxed">
            You already followed all accounts.
          </p>
          <button
            onClick={handleUnlock}
            disabled={isUnlocking}
            className="w-full h-10 bg-success text-white rounded-xl text-sm font-black flex items-center justify-center gap-2"
          >
            {isUnlocking ? 'Loading...' : 'Access Content →'}
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
          <h2 className="text-lg font-black text-text mb-0.5">Content unlocked!</h2>
          <p className="text-[12px] text-textMid">Enjoy your resource.</p>
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
              disabled={!downloadUrl}
              className={`w-full h-12 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
                downloadStarted ? 'bg-success text-white' : !downloadUrl ? 'bg-border text-textLight' : 'bg-brand text-white'
              }`}
            >
              {!downloadUrl ? 'Preparing...' : downloadStarted ? '✅ Downloaded' : '⬇️ Download Now'}
            </button>
          </div>
        )}

        {socialConfig?.unlock_url && (
            <a
              href={socialConfig.unlock_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 bg-text text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 no-underline"
            >
              Access Resource →
            </a>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex gap-3 items-start">
        <span className="text-xl">👥</span>
        <div>
          <div className="text-[13px] font-black text-blue-600 leading-tight mb-0.5">
            {socialConfig?.custom_heading || 'Follow to unlock'}
          </div>
          {socialConfig?.follow_description && (
            <p className="text-[11px] text-blue-600/80 leading-normal">
              {socialConfig.follow_description}
            </p>
          )}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1 px-1">
          <span className="text-[10px] font-black text-textMid uppercase tracking-wider">
            Progress: {visitedCount}/{totalTargets}
          </span>
          {allVisited && <span className="text-[9px] font-black text-success uppercase tracking-wider">Complete ✓</span>}
        </div>
        <div className="h-1.5 bg-surfaceAlt rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${allVisited ? 'bg-success' : 'bg-blue-500'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-2">
        {followTargets.map((target) => (
          <FollowTargetCard
            key={target.id}
            target={target}
            isVisited={visitedIds.includes(target.id)}
            onClick={() => handleTargetClick(target)}
          />
        ))}
      </div>

      {isUnlocking && (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-border border-t-blue-500 rounded-full animate-spin inline-block" />
          <p className="text-[11px] font-bold text-textMid mt-2">Unlocking...</p>
        </div>
      )}

      {error && <div className="bg-errorBg text-error text-[11px] font-bold p-3 rounded-lg mb-4 text-center">{error}</div>}
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
      className={`w-full h-14 flex items-center gap-3 px-3 rounded-xl border transition-all text-left ${
        isVisited ? 'bg-successBg border-success/20' : 'bg-white border-border hover:border-brand/50'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors overflow-hidden ${
        isVisited ? 'bg-success/10' : 'bg-surfaceAlt'
      }`}>
        {isVisited ? (
          <span className="text-lg">✅</span>
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
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] font-black truncate ${isVisited ? 'text-success' : 'text-text'}`}>
          {label}
        </div>
        {target.instruction_text && (
          <div className="text-[10px] font-bold text-textLight truncate opacity-80">
            {target.instruction_text}
          </div>
        )}
      </div>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
        isVisited ? 'bg-success text-white' : 'bg-surfaceAlt text-textLight'
      }`}>
        {isVisited ? '✓' : '→'}
      </div>
    </button>
  )
}

export default SocialFollowUnlock
