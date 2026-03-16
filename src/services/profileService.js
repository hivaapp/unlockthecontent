// src/services/profileService.js
import { supabase } from '../lib/supabase'
import { getPublicCreatorLinks } from './linksService'

// ── Get creator profile by username ──────────────────────────────────────

export const getCreatorProfile = async (username) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      username,
      bio,
      location,
      website,
      avatar_color,
      initial,
      is_creator,
      is_verified,
      is_pro,
      trust_score,
      created_at,
      social_handles (
        platform,
        handle,
        profile_url,
        sort_order
      )
    `)
    .eq('username', username)
    .maybeSingle()
  
  if (error) throw error
  if (!data) return null
  
  // Reshape social handles
  const socialHandles = {}
  if (data.social_handles) {
    data.social_handles
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach(h => { socialHandles[h.platform] = h.handle })
  }
  
  // Fetch stats separately — aggregate queries
  const [linksData, statsData] = await Promise.all([
    getPublicCreatorLinks(data.id),
    getCreatorStats(data.id),
  ])
  
  return {
    ...data,
    socialHandles,
    avatarColor: data.avatar_color,
    isCreator: data.is_creator,
    isVerified: data.is_verified,
    isProUser: data.is_pro,
    trustScore: data.trust_score,
    links: linksData,
    stats: statsData,
  }
}

// ── Get creator stats ─────────────────────────────────────────────────────

export const getCreatorStats = async (creatorId) => {
  // Total links count
  const { count: totalLinks } = await supabase
    .from('links')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
    .eq('is_active', true)
  
  // Total unlocks across all links
  const { data: unlockSum } = await supabase
    .from('links')
    .select('unlock_count')
    .eq('creator_id', creatorId)
    .eq('is_active', true)
  
  const totalUnlocks = unlockSum?.reduce((sum, l) => sum + (l.unlock_count || 0), 0) || 0
  
  // Pairing stats
  const { data: pairingStats } = await supabase
    .from('links')
    .select(`
      pairing_config:pairing_configs (
        total_participants,
        active_pairs,
        completed_pairs
      )
    `)
    .eq('creator_id', creatorId)
    .eq('mode', 'follower_pairing')
    .eq('is_active', true)
  
  const totalCampaigns = pairingStats?.length || 0
  const totalPairsFormed = pairingStats?.reduce((sum, l) => {
    const pc = l.pairing_config
    return sum + (pc?.active_pairs || 0) + (pc?.completed_pairs || 0)
  }, 0) || 0
  
  return {
    totalLinks: totalLinks || 0,
    totalUnlocks,
    totalFollowerPairingCampaigns: totalCampaigns,
    totalPairsFormed,
    treesPlanted: 0,  // Part 17 (referrals/trees) fills this in
  }
}

// ── Search users for Explore + DM ────────────────────────────────────────

export const searchPeople = async (query, currentUserId = null) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      username,
      bio,
      avatar_color,
      initial,
      is_creator,
      is_verified,
      trust_score
    `)
    .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(8)
  
  if (error) throw error
  
  // Filter out the current user from results
  return (data || []).filter(u => u.id !== currentUserId)
}

// ── Get Top Creators (Leaderboard) ───────────────────────────────────────

export const getTopCreators = async (limit = 10) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      username,
      avatar_color,
      initial,
      is_creator,
      is_verified,
      active_pairing_links_count
    `)
    .eq('is_creator', true)
    .order('active_pairing_links_count', { ascending: false, nullsFirst: false })
    .order('name', { ascending: true })
    .limit(limit)
  
  if (error) throw error
  
  return data || []
}
