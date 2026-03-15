// src/services/sponsorService.js
import { supabase } from '../lib/supabase'
import { getDownloadUrl } from './uploadService'

// ── Session key management ────────────────────────────────────────────────
// Same anonymous session key pattern as emailSubscribeService / socialFollowService.

const getSessionKey = (linkId) => {
  const storageKey = `adgate_sponsor_${linkId}`
  let key = sessionStorage.getItem(storageKey)
  if (!key) {
    key = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    sessionStorage.setItem(storageKey, key)
  }
  return key
}

// ── Session state helpers ─────────────────────────────────────────────────
// Tracks: videoWatchComplete, ctaClicked, playbackPosition

const SESSION_PROGRESS_KEY = (linkId) => `adgate_sponsor_${linkId}_progress`
const SESSION_UNLOCKED_KEY = (linkId) => `adgate_sponsor_unlocked_${linkId}`

export const getSponsorProgress = (linkId) => {
  try {
    const stored = sessionStorage.getItem(SESSION_PROGRESS_KEY(linkId))
    return stored ? JSON.parse(stored) : {
      videoWatchComplete: false,
      ctaClicked: false,
      playbackPosition: 0,
    }
  } catch {
    return { videoWatchComplete: false, ctaClicked: false, playbackPosition: 0 }
  }
}

export const saveSponsorProgress = (linkId, progress) => {
  sessionStorage.setItem(SESSION_PROGRESS_KEY(linkId), JSON.stringify(progress))
}

export const hasCompletedSponsorUnlock = (linkId) => {
  return sessionStorage.getItem(SESSION_UNLOCKED_KEY(linkId)) === 'true'
}

const markUnlockComplete = (linkId) => {
  sessionStorage.setItem(SESSION_UNLOCKED_KEY(linkId), 'true')
}

// ── Get sponsor video stream URL ──────────────────────────────────────────
// Fetches a presigned GET URL for the sponsor video.
// Uses unlockType: 'sponsor_video' which bypasses unlock verification.

export const getSponsorVideoUrl = async ({ fileId, linkSlug }) => {
  const result = await getDownloadUrl({
    fileId,
    linkSlug,
    unlockType: 'sponsor_video',
    sessionKey: '',  // not needed for sponsor_video type
    forceDownload: false,
  })
  return result.downloadUrl
}

// ── Record sponsor unlock ─────────────────────────────────────────────────
// Inserts into sponsor_impressions, increments unlock_count, fetches download URL.

export const recordSponsorUnlock = async ({
  linkId,
  sponsorConfigId,
  viewerId = null,
  linkSlug,
  fileId,
  ctaClicked = false,
  watchDurationSeconds = 0,
}) => {
  const sessionKey = getSessionKey(linkId)

  // ── Check for existing unlock ───────────────────────────────────────
  let existingQuery = supabase
    .from('sponsor_impressions')
    .select('id, watch_completed')
    .eq('link_id', linkId)
    .eq('watch_completed', true)

  if (viewerId) {
    existingQuery = existingQuery.eq('viewer_id', viewerId)
  } else {
    existingQuery = existingQuery.eq('session_key', sessionKey)
  }

  const { data: existing } = await existingQuery.maybeSingle()

  if (existing) {
    markUnlockComplete(linkId)

    let downloadUrl = null
    if (fileId) {
      try {
        const result = await getDownloadUrl({
          fileId,
          linkSlug,
          unlockType: 'custom_sponsor',
          sessionKey,
          forceDownload: false,
        })
        downloadUrl = result.downloadUrl
      } catch (err) {
        console.error('Failed to get download URL:', err)
      }
    }

    return { success: true, alreadyUnlocked: true, downloadUrl }
  }

  // ── Insert new sponsor_impressions row ───────────────────────────────
  const { error: insertError } = await supabase
    .from('sponsor_impressions')
    .insert({
      link_id:                linkId,
      sponsor_config_id:      sponsorConfigId,
      viewer_id:              viewerId,
      session_key:            sessionKey,
      watch_completed:        true,
      watch_completed_at:     new Date().toISOString(),
      watch_duration_seconds: watchDurationSeconds,
      cta_clicked:            ctaClicked,
      cta_clicked_at:         ctaClicked ? new Date().toISOString() : null,
      content_accessed:       true,
    })

  if (insertError) {
    if (insertError.code === '23505') {
      markUnlockComplete(linkId)

      let downloadUrl = null
      if (fileId) {
        try {
          const result = await getDownloadUrl({
            fileId,
            linkSlug,
            unlockType: 'custom_sponsor',
            sessionKey,
            forceDownload: false,
          })
          downloadUrl = result.downloadUrl
        } catch (err) {
          console.error('Failed to get download URL on duplicate:', err)
        }
      }

      return { success: true, alreadyUnlocked: true, downloadUrl }
    }
    console.error('Sponsor impression insert error:', insertError)
    throw new Error('Failed to record unlock. Please try again.')
  }

  // ── Increment unlock counter ──────────────────────────────────────
  if (!viewerId) {
    await supabase.rpc('increment_link_unlocks', { p_link_id: linkId })
  } else {
    const { data: priorImpressions } = await supabase
      .from('sponsor_impressions')
      .select('id')
      .eq('link_id', linkId)
      .eq('viewer_id', viewerId)
      .eq('watch_completed', true)

    if (!priorImpressions || priorImpressions.length <= 1) {
      await supabase.rpc('increment_link_unlocks', { p_link_id: linkId })
    }
  }

  // ── Mark session complete ─────────────────────────────────────────
  markUnlockComplete(linkId)

  // ── Get download URL ──────────────────────────────────────────────
  let downloadUrl = null
  if (fileId) {
    try {
      const result = await getDownloadUrl({
        fileId,
        linkSlug,
        unlockType: 'custom_sponsor',
        sessionKey,
        forceDownload: false,
      })
      downloadUrl = result.downloadUrl
    } catch (err) {
      console.error('Failed to get download URL:', err)
    }
  }

  return { success: true, alreadyUnlocked: false, downloadUrl }
}
