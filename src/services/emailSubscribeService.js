// src/services/emailSubscribeService.js
import { supabase } from '../lib/supabase'
import { getDownloadUrl } from './uploadService'

// ── Session key management ────────────────────────────────────────────────
// Anonymous viewers get a session key stored in sessionStorage.
// This tracks their unlock state without requiring an account.
// Key format: adgate_email_[linkId]

const getSessionKey = (linkId) => {
  const storageKey = `adgate_email_${linkId}`
  let key = sessionStorage.getItem(storageKey)
  if (!key) {
    key = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    sessionStorage.setItem(storageKey, key)
  }
  return key
}

// Check if this session has already completed the email subscribe unlock
export const hasCompletedEmailUnlock = (linkId) => {
  const sessionKey = `adgate_email_unlocked_${linkId}`
  return sessionStorage.getItem(sessionKey) === 'true'
}

// Mark this session as having completed the unlock
const markUnlockComplete = (linkId) => {
  sessionStorage.setItem(`adgate_email_unlocked_${linkId}`, 'true')
}

// ── Validate email format ─────────────────────────────────────────────────

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// ── Check if email already subscribed ────────────────────────────────────
// Used to show "already subscribed" state if viewer returns.

export const checkExistingSubscriber = async (linkId, email) => {
  const { data } = await supabase
    .from('email_subscribers')
    .select('id, content_accessed')
    .eq('link_id', linkId)
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  
  return data || null
}

// ── Subscribe and unlock ──────────────────────────────────────────────────
// Core function. Inserts subscriber record, returns download URL.

export const subscribeAndUnlock = async ({
  linkId,
  creatorId,
  email,
  viewerId = null,      // null for anonymous viewers
  linkSlug,
  fileId,
}) => {
  const sessionKey = getSessionKey(linkId)
  const normalizedEmail = email.trim().toLowerCase()

  // ── Check for duplicate subscription ────────────────────────────────
  const existing = await checkExistingSubscriber(linkId, normalizedEmail)
  
  if (existing) {
    // Email already subscribed — still serve the content
    // Update content_accessed if not already set
    if (!existing.content_accessed) {
      await supabase
        .from('email_subscribers')
        .update({ content_accessed: true })
        .eq('id', existing.id)
    }
    
    // Mark session as unlocked and get download URL
    markUnlockComplete(linkId)
    
    // Increment unlock count only if first time accessing
    if (!existing.content_accessed) {
      await supabase.rpc('increment_link_unlocks', { p_link_id: linkId })
    }
    
    // Get download URL only if a file is attached
    let downloadUrl = null
    if (fileId) {
      try {
        const result = await getDownloadUrl({
          fileId,
          linkSlug,
          unlockType: 'email_subscribe',
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
      alreadySubscribed: true,
      downloadUrl,
      subscriberId: existing.id,
    }
  }

  // ── Insert new subscriber ────────────────────────────────────────────
  // NOTE: We do NOT use .select().single() here because anonymous users
  // cannot read back their own row due to RLS policies. The insert itself
  // succeeds (insert policy allows any), but the SELECT-back would fail.
  const { error: insertError } = await supabase
    .from('email_subscribers')
    .insert({
      link_id:          linkId,
      creator_id:       creatorId,
      email:            normalizedEmail,
      session_key:      sessionKey,
      viewer_id:        viewerId,
      content_accessed: true,
    })
  
  if (insertError) {
    // Handle race condition — duplicate insert from double-tap
    if (insertError.code === '23505') {
      // Unique constraint violation — already subscribed
      markUnlockComplete(linkId)
      
      let downloadUrl = null
      if (fileId) {
        try {
          const result = await getDownloadUrl({
            fileId,
            linkSlug,
            unlockType: 'email_subscribe',
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
        alreadySubscribed: true,
        downloadUrl,
        subscriberId: null,
      }
    }
    console.error('Subscriber insert error:', insertError)
    throw new Error('Failed to save subscription. Please try again.')
  }

  // ── Increment unlock counter ─────────────────────────────────────────
  await supabase.rpc('increment_link_unlocks', { p_link_id: linkId })

  // ── Mark session as complete ─────────────────────────────────────────
  markUnlockComplete(linkId)

  // ── Get download URL from Edge Function ─────────────────────────────
  let downloadUrl = null
  if (fileId) {
    try {
      const result = await getDownloadUrl({
        fileId,
        linkSlug,
        unlockType: 'email_subscribe',
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
    alreadySubscribed: false,
    downloadUrl,
    subscriberId: null,
  }
}

// ── Get subscriber count for a link (creator dashboard) ──────────────────

export const getSubscriberCount = async (linkId) => {
  const { count, error } = await supabase
    .from('email_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('link_id', linkId)
  
  if (error) throw error
  return count || 0
}

// ── Get subscriber list for creator (dashboard analytics) ────────────────

export const getSubscriberList = async (linkId, { page = 0, pageSize = 50 } = {}) => {
  const { data, error, count } = await supabase
    .from('email_subscribers')
    .select('id, email, content_accessed, subscribed_at', { count: 'exact' })
    .eq('link_id', linkId)
    .order('subscribed_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)
  
  if (error) throw error
  return { subscribers: data || [], total: count || 0 }
}

// ── Export subscriber emails as CSV ──────────────────────────────────────

export const exportSubscribersCSV = async (linkId, linkTitle) => {
  const { subscribers } = await getSubscriberList(linkId, { pageSize: 10000 })
  
  if (subscribers.length === 0) {
    throw new Error('No subscribers to export.')
  }
  
  const headers = ['Email', 'Subscribed At', 'Content Accessed']
  const rows = subscribers.map(s => [
    s.email,
    new Date(s.subscribed_at).toLocaleDateString('en-IN'),
    s.content_accessed ? 'Yes' : 'No',
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `subscribers-${linkTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  // Mark all as exported in DB
  await supabase
    .from('email_subscribers')
    .update({ exported_at: new Date().toISOString() })
    .eq('link_id', linkId)
    .is('exported_at', null)
}
