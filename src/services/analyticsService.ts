// src/services/analyticsService.ts
import { supabase } from '../lib/supabase'

// ── Shared: view / unlock time-series for any link ──────────────────────────

export const getLinkViewHistory = async (linkId: string, days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('link_views')
    .select('created_at')
    .eq('link_id', linkId)
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  const byDay: Record<string, number> = {}
  data?.forEach(row => {
    const day = row.created_at.substring(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
  })
  return byDay
}

// ── Email subscribe analytics ────────────────────────────────────────────────

export const getEmailLinkAnalytics = async (linkId: string) => {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const weekAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalSubscribers },
    { count: thisWeekSubscribers },
    { count: thisMonthSubscribers },
    { data: dailyData },
    { data: linkData },
  ] = await Promise.all([
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }).eq('link_id', linkId),
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }).eq('link_id', linkId).gte('subscribed_at', weekAgo),
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }).eq('link_id', linkId).gte('subscribed_at', monthAgo),
    supabase.from('email_subscribers').select('subscribed_at').eq('link_id', linkId).gte('subscribed_at', monthAgo).order('subscribed_at', { ascending: true }),
    supabase.from('links').select('view_count, unlock_count').eq('id', linkId).single(),
  ])

  const byDay: Record<string, number> = {}
  dailyData?.forEach(row => {
    const day = row.subscribed_at.substring(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
  })

  const conversionRate = (linkData && linkData.view_count > 0)
    ? ((linkData.unlock_count / linkData.view_count) * 100).toFixed(1)
    : '0.0'

  return {
    totalSubscribers:     totalSubscribers     || 0,
    thisWeekSubscribers:  thisWeekSubscribers  || 0,
    thisMonthSubscribers: thisMonthSubscribers || 0,
    totalViews:           linkData?.view_count  || 0,
    totalUnlocks:         linkData?.unlock_count || 0,
    conversionRate,
    dailyChart: byDay,
  }
}

// ── Sponsor analytics ─────────────────────────────────────────────────────────

export const getSponsorAnalytics = async (linkId: string) => {
  const { data: linkData } = await supabase
    .from('links')
    .select('view_count, unlock_count, created_at, title')
    .eq('id', linkId)
    .single()

  const viewHistory = await getLinkViewHistory(linkId, 30)

  const views   = linkData?.view_count  || 0
  const unlocks = linkData?.unlock_count || 0
  const conversionRate = views > 0 ? ((unlocks / views) * 100).toFixed(1) : '0.0'

  // This week views from link_views table
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: thisWeekViews } = await supabase
    .from('link_views')
    .select('*', { count: 'exact', head: true })
    .eq('link_id', linkId)
    .gte('created_at', weekAgo)

  return {
    totalViews:      views,
    totalUnlocks:    unlocks,
    conversionRate,
    thisWeekViews:   thisWeekViews || 0,
    dailyChart:      viewHistory,
  }
}

// ── Social follow analytics ────────────────────────────────────────────────────

export const getSocialAnalytics = async (linkId: string) => {
  const { data: linkData } = await supabase
    .from('links')
    .select('view_count, unlock_count')
    .eq('id', linkId)
    .single()

  const viewHistory = await getLinkViewHistory(linkId, 30)

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: thisWeekViews } = await supabase
    .from('link_views')
    .select('*', { count: 'exact', head: true })
    .eq('link_id', linkId)
    .gte('created_at', weekAgo)

  const views   = linkData?.view_count  || 0
  const unlocks = linkData?.unlock_count || 0
  const conversionRate = views > 0 ? ((unlocks / views) * 100).toFixed(1) : '0.0'

  return {
    totalViews:    views,
    totalUnlocks:  unlocks,
    conversionRate,
    thisWeekViews: thisWeekViews || 0,
    dailyChart:    viewHistory,
  }
}

// ── Accountability / Follower pairing analytics ──────────────────────────────

export const getPairingAnalytics = async (linkId: string) => {
  // Get live pairing config stats
  const { data: pc } = await supabase
    .from('pairing_configs')
    .select('id, topic, duration_days, total_participants, active_pairs, completed_pairs, is_accepting')
    .eq('link_id', linkId)
    .maybeSingle()

  // Scheduled messages delivery stats
  const { data: msgs } = pc ? await supabase
    .from('scheduled_messages')
    .select('id, day_number, content, is_sent, sent_at, delivered_count')
    .eq('pairing_config_id', pc.id)
    .order('day_number', { ascending: true }) : { data: [] }

  // Waiting pool breakdown from pairing_participants (unmatched users)
  const { data: queueRows } = await supabase
    .from('pairing_participants')
    .select('gender_preference')
    .eq('link_id', linkId)
    .eq('is_available', true)
    .is('session_id', null)

  const waitingPool = { male: 0, female: 0, any: 0 }
  queueRows?.forEach((row: any) => {
    const g = row.gender_preference || 'any'
    if (g in waitingPool) (waitingPool as any)[g]++
    else waitingPool.any++
  })

  const viewHistory = await getLinkViewHistory(linkId, 30)

  return {
    pairingConfig:    pc,
    scheduledMessages: msgs || [],
    waitingPool,
    dailyChart:       viewHistory,
  }
}

// ── Generic link stats (views over time) for any type ───────────────────────

export const getGenericLinkAnalytics = async (linkId: string) => {
  const { data: linkData } = await supabase
    .from('links')
    .select('view_count, unlock_count, created_at')
    .eq('id', linkId)
    .single()

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: thisWeekViews } = await supabase
    .from('link_views')
    .select('*', { count: 'exact', head: true })
    .eq('link_id', linkId)
    .gte('created_at', weekAgo)

  const viewHistory = await getLinkViewHistory(linkId, 30)

  return {
    totalViews:    linkData?.view_count   || 0,
    totalUnlocks:  linkData?.unlock_count || 0,
    thisWeekViews: thisWeekViews          || 0,
    conversionRate: linkData && linkData.view_count > 0
      ? ((linkData.unlock_count / linkData.view_count) * 100).toFixed(1)
      : '0.0',
    dailyChart: viewHistory,
  }
}
