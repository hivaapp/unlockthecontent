// src/services/analyticsService.js
import { supabase } from '../lib/supabase'

// ── Email subscribe analytics for a specific link ─────────────────────────

export const getEmailLinkAnalytics = async (linkId: string) => {
  // Subscriber count
  const { count: totalSubscribers } = await supabase
    .from('email_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('link_id', linkId)

  // This week's subscribers
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: thisWeekSubscribers } = await supabase
    .from('email_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('link_id', linkId)
    .gte('subscribed_at', weekAgo)

  // This month's subscribers
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { count: thisMonthSubscribers } = await supabase
    .from('email_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('link_id', linkId)
    .gte('subscribed_at', monthAgo)

  // Subscribers by day for chart (last 30 days)
  const { data: dailyData } = await supabase
    .from('email_subscribers')
    .select('subscribed_at')
    .eq('link_id', linkId)
    .gte('subscribed_at', monthAgo)
    .order('subscribed_at', { ascending: true })

  // Group by day
  const byDay: Record<string, number> = {}
  dailyData?.forEach(row => {
    const day = row.subscribed_at.substring(0, 10)  // YYYY-MM-DD
    byDay[day] = (byDay[day] || 0) + 1
  })

  // View count and unlock rate
  const { data: linkData } = await supabase
    .from('links')
    .select('view_count, unlock_count')
    .eq('id', linkId)
    .single()

  const conversionRate = (linkData && linkData.view_count > 0)
    ? ((linkData.unlock_count / linkData.view_count) * 100).toFixed(1)
    : '0.0'

  return {
    totalSubscribers:      totalSubscribers || 0,
    thisWeekSubscribers:   thisWeekSubscribers || 0,
    thisMonthSubscribers:  thisMonthSubscribers || 0,
    totalViews:            linkData?.view_count || 0,
    totalUnlocks:          linkData?.unlock_count || 0,
    conversionRate,
    dailyChart:            byDay,
  }
}
