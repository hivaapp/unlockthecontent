// src/services/followerPairingService.ts
import { supabase } from '../lib/supabase'

const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// ── Auth headers helper ──────────────────────────────────────────────────

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated. Please sign in.')
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface PairingParticipant {
  id: string
  link_id: string
  user_id: string | null
  commitment_text: string
  gender_preference: 'male' | 'female' | 'any'
  gender: string | null
  is_available: boolean
  matched_at: string | null
  session_id: string | null
  last_active_at: string | null
  missed_checkins: number
  created_at: string
  user?: {
    id: string
    name: string
    username: string
    avatar_color: string
    initial: string
    is_verified: boolean
    trust_score: number
  }
}

export interface PairingSession {
  id: string
  pairing_config_id: string
  link_id: string
  participant_a_id: string
  participant_b_id: string
  status: 'active' | 'completed' | 'expired' | 'partner_left'
  paired_at: string
  expires_at: string
  completed_at: string | null
  asset_delivered: boolean
  asset_delivered_at: string | null
  match_held_until: string | null
  created_at: string
  participant_a?: PairingParticipant
  participant_b?: PairingParticipant
  pairing_config?: {
    topic: string
    completion_assets?: {
      file_id: string | null
      unlock_message: string | null
      links: { url: string; title: string }[]
      youtube_url: string | null
      resource_title: string | null
      resource_description: string | null
      file?: {
        id: string
        original_name: string
        mime_type: string
        size_bytes: number
        r2_key: string
        r2_bucket: string
      }
    }
  }
}

export interface PairingMessage {
  id: string
  session_id: string
  sender_id: string
  content: string | null
  type: string
  message_type?: 'chat' | 'scheduled' | 'system' | 'broadcast' | 'reward_reveal'
  scheduled_message_id?: string | null
  links?: { url: string; title: string }[] | null
  youtube_url?: string | null
  file_id: string | null
  is_broadcast: boolean
  broadcast_id: string | null
  is_read: boolean
  read_at: string | null
  reply_to_id: string | null
  reactions: any
  is_deleted: boolean
  created_at: string
  sender?: {
    id: string
    name: string
    initial: string
    avatar_color: string
  }
  file?: {
    id: string
    original_name: string
    mime_type: string
    size_bytes: number
    r2_key: string
    r2_bucket: string
  }
  // Joined scheduled_message data for display
  scheduled_message?: {
    id: string
    day_number: number
    send_time: string
  } | null
}

// ── Get waiting count for a link ──────────────────────────────────────────
// Counts how many participants are available (not yet matched) for this campaign.

export const getWaitingCount = async (linkId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('pairing_participants')
    .select('*', { count: 'exact', head: true })
    .eq('link_id', linkId)
    .eq('is_available', true)

  if (error) {
    console.error('Failed to get waiting count:', error)
    return 0
  }
  return count || 0
}

// ── Join a pairing campaign ───────────────────────────────────────────────
// Inserts a new participant record. The user must be authenticated.

export const joinPairing = async ({
  linkId,
  userId,
  commitmentText,
  gender,
  genderPreference,
}: {
  linkId: string
  userId: string
  commitmentText: string
  gender: string | null
  genderPreference: 'male' | 'female' | 'any'
}): Promise<PairingParticipant> => {
  // Check if user already has a participant record for this link
  const { data: existing } = await supabase
    .from('pairing_participants')
    .select('*')
    .eq('link_id', linkId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    // If they have an existing available record, update it
    if (existing.is_available && !existing.session_id) {
      const { data, error } = await supabase
        .from('pairing_participants')
        .update({
          commitment_text: commitmentText,
          gender,
          gender_preference: genderPreference,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    }

    // If they have a session already, return the existing record
    if (existing.session_id) {
      return existing
    }

    // Otherwise update and mark available
    const { data, error } = await supabase
      .from('pairing_participants')
      .update({
        commitment_text: commitmentText,
        gender,
        gender_preference: genderPreference,
        is_available: true,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Insert new participant
  const { data, error } = await supabase
    .from('pairing_participants')
    .insert({
      link_id: linkId,
      user_id: userId,
      commitment_text: commitmentText,
      gender,
      gender_preference: genderPreference,
      is_available: true,
      last_active_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Find a match via Edge Function ────────────────────────────────────────
// Calls the find-pairing-match Edge Function which handles the matching algorithm.

export const findMatch = async (participantId: string, linkId: string): Promise<{
  matched: boolean
  session?: PairingSession
  partner?: PairingParticipant & { user?: any }
}> => {
  const headers = await getAuthHeaders()

  const response = await fetch(`${EDGE_FUNCTION_BASE}/find-pairing-match`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ participantId, linkId }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }))
    // Not an error if no match found yet — just means no compatible partner available
    if (response.status === 404) {
      return { matched: false }
    }
    throw new Error(err.error || 'Failed to find match.')
  }

  const data = await response.json()
  return {
    matched: true,
    session: data.session,
    partner: data.partner,
  }
}

// ── Get session with participants ─────────────────────────────────────────

export const getSession = async (sessionId: string): Promise<PairingSession | null> => {
  const { data, error } = await supabase
    .from('pairing_sessions')
    .select(`
      *,
      participant_a:pairing_participants!pairing_sessions_participant_a_id_fkey (
        *,
        user:users (
          id, name, username, avatar_color, initial, is_verified, trust_score
        )
      ),
      participant_b:pairing_participants!pairing_sessions_participant_b_id_fkey (
        *,
        user:users (
          id, name, username, avatar_color, initial, is_verified, trust_score
        )
      ),
      pairing_config:pairing_configs (
        topic,
        completion_assets:completion_assets (
          file_id,
          unlock_message,
          links,
          youtube_url,
          resource_title,
          resource_description,
          file:files (
            id, original_name, mime_type, size_bytes, r2_key, r2_bucket
          )
        )
      )
    `)
    .eq('id', sessionId)
    .maybeSingle()

  if (error) throw error
  return data
}

// ── Get session by participant user_id and link_id ────────────────────────
// Finds an active session for this user+link combination.

export const getActiveSessionForUser = async (userId: string, linkId: string): Promise<PairingSession | null> => {
  // First find the participant record
  const { data: participant } = await supabase
    .from('pairing_participants')
    .select('id, session_id')
    .eq('user_id', userId)
    .eq('link_id', linkId)
    .not('session_id', 'is', null)
    .maybeSingle()

  if (!participant?.session_id) return null

  return getSession(participant.session_id)
}

// ── Get messages for a session ────────────────────────────────────────────

export const getSessionMessages = async (sessionId: string): Promise<PairingMessage[]> => {
  const { data, error } = await supabase
    .from('pairing_messages')
    .select(`
      *,
      sender:users!pairing_messages_sender_id_fkey (
        id, name, initial, avatar_color
      ),
      file:files!pairing_messages_file_id_fkey (
        id, original_name, mime_type, size_bytes, r2_key, r2_bucket
      ),
      scheduled_message:scheduled_messages!pairing_messages_scheduled_message_id_fkey (
        id, day_number, send_time
      )
    `)
    .eq('session_id', sessionId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

// ── Send a message ────────────────────────────────────────────────────────

export const sendMessage = async ({
  sessionId,
  senderId,
  content,
  type = 'text',
  fileId = null,
  replyToId = null,
  messageType = 'text',
  mediaR2Key = null,
  mediaThumbnailR2Key = null,
  mediaOriginalName = null,
  mediaMimeType = null,
  mediaSizeBytes = null,
  mediaCategory = null,
  isProStorage = false,
}: {
  sessionId: string
  senderId: string
  content: string | null
  type?: string
  fileId?: string | null
  replyToId?: string | null
  messageType?: string
  mediaR2Key?: string | null
  mediaThumbnailR2Key?: string | null
  mediaOriginalName?: string | null
  mediaMimeType?: string | null
  mediaSizeBytes?: number | null
  mediaCategory?: string | null
  isProStorage?: boolean
}): Promise<PairingMessage> => {
  const insertData: Record<string, unknown> = {
    session_id: sessionId,
    sender_id: senderId,
    content,
    type,
    file_id: fileId,
    is_broadcast: false,
    reply_to_id: replyToId,
    message_type: messageType,
  }

  // Only include media fields if there's a media attachment
  if (mediaR2Key) {
    insertData.media_r2_key = mediaR2Key
    insertData.media_thumbnail_r2_key = mediaThumbnailR2Key
    insertData.media_original_name = mediaOriginalName
    insertData.media_mime_type = mediaMimeType
    insertData.media_size_bytes = mediaSizeBytes
    insertData.media_category = mediaCategory
    insertData.is_pro_storage = isProStorage
  }

  const { data, error } = await supabase
    .from('pairing_messages')
    .insert(insertData)
    .select(`
      *,
      sender:users!pairing_messages_sender_id_fkey (
        id, name, initial, avatar_color
      ),
      file:files!pairing_messages_file_id_fkey (
        id, original_name, mime_type, size_bytes, r2_key, r2_bucket
      )
    `)
    .single()

  if (error) throw error
  return data
}

// ── Mark messages as read ─────────────────────────────────────────────────

export const markMessagesRead = async (sessionId: string, userId: string) => {
  const { error } = await supabase
    .from('pairing_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .neq('sender_id', userId)
    .eq('is_read', false)

  if (error) console.error('Failed to mark messages read:', error)
}

// ── Subscribe to new messages (Realtime) ──────────────────────────────────

export const subscribeToMessages = (
  sessionId: string,
  onNewMessage: (message: any) => void
) => {
  const channel = supabase
    .channel(`pairing_messages:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'pairing_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      async (payload) => {
        // Fetch the full message with joins
        const { data } = await supabase
          .from('pairing_messages')
          .select(`
            *,
            sender:users!pairing_messages_sender_id_fkey (
              id, name, initial, avatar_color
            ),
            file:files!pairing_messages_file_id_fkey (
              id, original_name, mime_type, size_bytes, r2_key, r2_bucket
            ),
            scheduled_message:scheduled_messages!pairing_messages_scheduled_message_id_fkey (
              id, day_number, send_time
            )
          `)
          .eq('id', payload.new.id)
          .single()

        if (data) onNewMessage(data)
      }
    )
    .subscribe()

  return channel
}

// ── Subscribe to session status changes (Realtime) ────────────────────────

export const subscribeToSessionUpdates = (
  sessionId: string,
  onUpdate: (session: any) => void
) => {
  const channel = supabase
    .channel(`pairing_session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pairing_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        onUpdate(payload.new)
      }
    )
    .subscribe()

  return channel
}

// ── Report a partner ──────────────────────────────────────────────────────

export const reportPartner = async ({
  sessionId,
  reporterId,
  reportedUserId,
  reason,
  details,
}: {
  sessionId: string
  reporterId: string
  reportedUserId: string
  reason: string
  details: string
}) => {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      reason,
      details: details || null,
      session_id: sessionId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Update participant last_active_at ─────────────────────────────────────

export const updateLastActive = async (participantId: string) => {
  await supabase
    .from('pairing_participants')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', participantId)
}

// ── Get pairing config for a link ─────────────────────────────────────────

export const getPairingConfig = async (linkId: string) => {
  const { data, error } = await supabase
    .from('pairing_configs')
    .select(`
      *,
      completion_asset:completion_assets (
        id,
        unlock_message,
        links,
        youtube_url,
        resource_title,
        resource_description,
        file:files (
          id,
          original_name,
          mime_type,
          size_bytes
        )
      ),
      scheduled_messages (
        id,
        day_number,
        send_time,
        content,
        links,
        youtube_url,
        link_url,
        link_label,
        sort_order,
        is_sent,
        sent_at,
        delivered_count
      )
    `)
    .eq('link_id', linkId)
    .maybeSingle()

  if (error) throw error
  return data
}

// ── Get user's participant record for a link ──────────────────────────────

export const getUserParticipant = async (userId: string, linkId: string): Promise<PairingParticipant | null> => {
  const { data, error } = await supabase
    .from('pairing_participants')
    .select('*')
    .eq('user_id', userId)
    .eq('link_id', linkId)
    .maybeSingle()

  if (error) throw error
  return data
}

// ── Release a match (rematch) ─────────────────────────────────────────
// Releases the current match so the participant can be re-matched.
// This sets both participants back to available and removes the session.

export const releaseMatch = async (_participantId: string, sessionId: string): Promise<void> => {
  // Get the session to find both participants
  const { data: session, error: sessionError } = await supabase
    .from('pairing_sessions')
    .select('participant_a_id, participant_b_id')
    .eq('id', sessionId)
    .single()

  if (sessionError) throw sessionError

  // Reset both participants to available
  const participantIds = [session.participant_a_id, session.participant_b_id]
  for (const pid of participantIds) {
    await supabase
      .from('pairing_participants')
      .update({
        is_available: true,
        session_id: null,
        matched_at: null,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', pid)
  }

  // Delete the session
  await supabase
    .from('pairing_sessions')
    .delete()
    .eq('id', sessionId)
}

// ── Get completion asset download URL ─────────────────────────────────────

// ── Deliver scheduled messages (pull-based) ──────────────────────────────
// Called on chat mount. The RPC function handles all delivery logic atomically.

export const deliverScheduledMessages = async (sessionId: string, userId: string): Promise<number> => {
  // Get the user's browser timezone (e.g. 'Asia/Kolkata', 'America/New_York')
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

  const { data, error } = await supabase
    .rpc('deliver_scheduled_messages', {
      p_session_id: sessionId,
      p_user_id: userId,
      p_user_tz: userTz,
    })

  if (error) {
    console.error('Failed to deliver scheduled messages:', error)
    return 0
  }

  return data || 0
}

// ── Get completion asset download URL ─────────────────────────────────────
// Called when a participant taps "Download" on the reward card.
// The Edge Function verifies the user is a participant in the session
// and that the challenge has reached the final day before returning a presigned URL.

export const getCompletionAssetUrl = async (sessionId: string): Promise<string | null> => {
  const headers = await getAuthHeaders()

  const response = await fetch(`${EDGE_FUNCTION_BASE}/get-download-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sessionId,
      unlockType: 'completion_asset',
    }),
  })

  if (!response.ok) return null

  const { downloadUrl } = await response.json()
  return downloadUrl || null
}
