// src/services/socialFollowService.js
import { supabase } from '../lib/supabase'
import { getDownloadUrl } from './uploadService'

// ── Session key management ────────────────────────────────────────────────
// Same anonymous session key pattern as emailSubscribeService.
// Key format: adgate_social_[linkId]

const getSessionKey = (linkId) => {
  const storageKey = `adgate_social_${linkId}`
  let key = sessionStorage.getItem(storageKey)
  if (!key) {
    key = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    sessionStorage.setItem(storageKey, key)
  }
  return key
}

// ── Visited targets tracking ──────────────────────────────────────────────
// Tracks which follow targets have been visited in this browser session.
// Key format: adgate_follow_[linkId]_visited
// Value: JSON array of target IDs

export const getVisitedTargets = (linkId) => {
  const key = `adgate_follow_${linkId}_visited`
  try {
    const stored = sessionStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export const markTargetVisited = (linkId, targetId) => {
  const key = `adgate_follow_${linkId}_visited`
  const visited = getVisitedTargets(linkId)
  if (!visited.includes(targetId)) {
    visited.push(targetId)
    sessionStorage.setItem(key, JSON.stringify(visited))
  }
  return visited
}

export const areAllTargetsVisited = (linkId, totalTargets) => {
  const visited = getVisitedTargets(linkId)
  return visited.length >= totalTargets.length &&
    totalTargets.every(t => visited.includes(t.id))
}

// ── Check if unlock already completed in this session ─────────────────────

export const hasCompletedSocialUnlock = (linkId) => {
  return sessionStorage.getItem(`adgate_social_unlocked_${linkId}`) === 'true'
}

const markUnlockComplete = (linkId) => {
  sessionStorage.setItem(`adgate_social_unlocked_${linkId}`, 'true')
}

// ── Record social unlock ──────────────────────────────────────────────────
// Core function. Inserts social_unlocks row, returns download URL.
// Mirrors subscribeAndUnlock from emailSubscribeService.

export const recordSocialUnlock = async ({
  linkId,
  socialConfigId,
  viewerId = null,
  linkSlug,
  fileId,
  completedTargets = [],
}) => {
  const sessionKey = getSessionKey(linkId)

  // ── Check for existing unlock ───────────────────────────────────────
  // Build query to check if this viewer already completed
  let existingQuery = supabase
    .from('social_unlocks')
    .select('id, all_completed')
    .eq('link_id', linkId)
    .eq('all_completed', true)

  if (viewerId) {
    existingQuery = existingQuery.eq('viewer_id', viewerId)
  } else {
    existingQuery = existingQuery.eq('session_key', sessionKey)
  }

  const { data: existing } = await existingQuery.maybeSingle()

  if (existing) {
    // Already completed — still serve content
    markUnlockComplete(linkId)

    let downloadUrl = null
    if (fileId) {
      try {
        const result = await getDownloadUrl({
          fileId,
          linkSlug,
          unlockType: 'social_follow',
          sessionKey,
          forceDownload: false,
        })
        downloadUrl = result.downloadUrl
      } catch (err) {
        console.error('Failed to get download URL:', err)
      }
    }

    return {
      success: true,
      alreadyUnlocked: true,
      downloadUrl,
    }
  }

  // ── Insert new social_unlocks row ───────────────────────────────────
  const { error: insertError } = await supabase
    .from('social_unlocks')
    .insert({
      link_id:           linkId,
      social_config_id:  socialConfigId,
      viewer_id:         viewerId,
      session_key:       sessionKey,
      completed_targets: completedTargets.map(id => ({
        target_id: id,
        completed_at: new Date().toISOString(),
      })),
      all_completed:     true,
      completed_at:      new Date().toISOString(),
    })

  if (insertError) {
    // Handle race condition — duplicate insert
    if (insertError.code === '23505') {
      markUnlockComplete(linkId)

      let downloadUrl = null
      if (fileId) {
        try {
          const result = await getDownloadUrl({
            fileId,
            linkSlug,
            unlockType: 'social_follow',
            sessionKey,
            forceDownload: false,
          })
          downloadUrl = result.downloadUrl
        } catch (err) {
          console.error('Failed to get download URL on duplicate:', err)
        }
      }

      return {
        success: true,
        alreadyUnlocked: true,
        downloadUrl,
      }
    }
    console.error('Social unlock insert error:', insertError)
    throw new Error('Failed to record unlock. Please try again.')
  }

  // ── Increment unlock counter ──────────────────────────────────────
  // Only increment if this viewer hasn't unlocked before (avoid double counting)
  if (!viewerId) {
    // Anonymous viewer — always increment (we can't track them across sessions)
    await supabase.rpc('increment_link_unlocks', { p_link_id: linkId })
  } else {
    // Logged-in viewer — check for prior unlocks
    const { data: priorUnlocks } = await supabase
      .from('social_unlocks')
      .select('id')
      .eq('link_id', linkId)
      .eq('viewer_id', viewerId)
      .eq('all_completed', true)

    // Only increment if this is their first completed unlock
    if (!priorUnlocks || priorUnlocks.length <= 1) {
      await supabase.rpc('increment_link_unlocks', { p_link_id: linkId })
    }
  }

  // ── Mark session as complete ──────────────────────────────────────
  markUnlockComplete(linkId)

  // ── Get download URL from Edge Function ───────────────────────────
  let downloadUrl = null
  if (fileId) {
    try {
      const result = await getDownloadUrl({
        fileId,
        linkSlug,
        unlockType: 'social_follow',
        sessionKey,
        forceDownload: false,
      })
      downloadUrl = result.downloadUrl
    } catch (err) {
      console.error('Failed to get download URL:', err)
    }
  }

  return {
    success: true,
    alreadyUnlocked: false,
    downloadUrl,
  }
}

// ── Platform URL construction rules ───────────────────────────────────────
// The creator enters a handle; we construct the full profile URL.

const PLATFORM_URL_RULES = {
  instagram:  (handle) => `https://instagram.com/${handle}`,
  youtube:    (handle) => `https://youtube.com/${handle.startsWith('@') ? handle : '@' + handle}`,
  twitter:    (handle) => `https://twitter.com/${handle}`,
  linkedin:   (handle) => `https://linkedin.com/in/${handle}`,
  tiktok:     (handle) => `https://tiktok.com/${handle.startsWith('@') ? handle : '@' + handle}`,
  discord:    (handle) => handle, // full invite URL provided by creator
  telegram:   (handle) => `https://t.me/${handle}`,
  pinterest:  (handle) => `https://pinterest.com/${handle}`,
  spotify:    (handle) => handle, // full URL provided by creator
  github:     (handle) => `https://github.com/${handle}`,
  threads:    (handle) => `https://threads.net/@${handle}`,
  twitch:     (handle) => `https://twitch.tv/${handle}`,
  bluesky:    (handle) => `https://bsky.app/profile/${handle}`,
}

// Strip @ prefix from handle for URL construction
const cleanHandle = (handle) => {
  if (!handle) return ''
  return handle.trim().replace(/^@/, '')
}

export const constructProfileUrl = (platform, handle) => {
  const cleaned = cleanHandle(handle)
  const builder = PLATFORM_URL_RULES[platform]
  if (!builder) return handle // fallback
  return builder(cleaned)
}

// ── Get the URL for a follow target ───────────────────────────────────────
// Works for both platform and custom targets

export const getTargetUrl = (target) => {
  if (target.type === 'custom') {
    return target.custom_url || target.customUrl || '#'
  }
  // Use stored profile_url if available, otherwise construct it
  if (target.profile_url || target.profileUrl) {
    return target.profile_url || target.profileUrl
  }
  return constructProfileUrl(target.platform, target.handle)
}

// ── Get display label for a target ────────────────────────────────────────

export const getTargetLabel = (target) => {
  if (target.type === 'custom') {
    return target.custom_label || target.customLabel || 'Visit Link'
  }
  const platformName = target.platform
    ? target.platform.charAt(0).toUpperCase() + target.platform.slice(1)
    : 'Follow'
  const handle = target.handle || ''
  return handle ? `${platformName} · ${handle}` : `Follow on ${platformName}`
}

// ── Platform info for icons ───────────────────────────────────────────────

export const PLATFORM_INFO = {
  instagram:  { icon: '📸', label: 'Instagram', color: '#E4405F' },
  twitter:    { icon: '🐦', label: 'Twitter',   color: '#1DA1F2' },
  tiktok:     { icon: '📱', label: 'TikTok',    color: '#010101' },
  youtube:    { icon: '▶️', label: 'YouTube',   color: '#FF0000' },
  linkedin:   { icon: '💼', label: 'LinkedIn',  color: '#0077B5' },
  twitch:     { icon: '📺', label: 'Twitch',    color: '#9146FF' },
  discord:    { icon: '💬', label: 'Discord',   color: '#5865F2' },
  telegram:   { icon: '✈️', label: 'Telegram',  color: '#26A5E4' },
  threads:    { icon: '🧵', label: 'Threads',   color: '#000000' },
  bluesky:    { icon: '🦋', label: 'Bluesky',   color: '#0085FF' },
  pinterest:  { icon: '📌', label: 'Pinterest', color: '#E60023' },
  spotify:    { icon: '🎵', label: 'Spotify',   color: '#1DB954' },
  github:     { icon: '💻', label: 'GitHub',    color: '#333333' },
}

export const getTargetIcon = (target) => {
  if (target.type === 'custom') {
    return target.custom_icon || target.customIcon || '🔗'
  }
  return PLATFORM_INFO[target.platform]?.icon || '🔗'
}
