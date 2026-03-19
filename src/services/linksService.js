// src/services/linksService.js
import { supabase } from '../lib/supabase'

// ── Slug generation ───────────────────────────────────────────────────────
// Creates a URL-safe slug from the link title.
// "My Figma UI Kit 2024" → "my-figma-ui-kit-2024"

export const generateSlug = (title) => {
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // keep only lowercase alphanumeric, spaces, hyphens
    .replace(/[\s_]+/g, '-')       // spaces and underscores to hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '')         // trim leading/trailing hyphens
    .substring(0, 60)              // max 60 chars

  // Ensure slug meets minimum 3-char constraint
  if (slug.length < 3) {
    const suffix = Math.random().toString(36).substring(2, 8)
    slug = slug ? `${slug}-${suffix}` : `link-${suffix}`
  }

  return slug
}

// Appends a random suffix if the base slug is taken
export const generateUniqueSlug = async (title) => {
  const base = generateSlug(title)
  
  // Check if base slug is available
  const { data } = await supabase
    .from('links')
    .select('slug')
    .eq('slug', base)
    .maybeSingle()
  
  if (!data) return base  // base slug is free
  
  // Try up to 10 suffixes before giving up
  for (let i = 0; i < 10; i++) {
    const suffix = Math.random().toString(36).substring(2, 6)
    const candidate = `${base}-${suffix}`
    const { data: existing } = await supabase
      .from('links')
      .select('slug')
      .eq('slug', candidate)
      .maybeSingle()
    
    if (!existing) return candidate
  }
  
  // Fallback: timestamp suffix always unique
  return `${base}-${Date.now().toString(36)}`
}

// ── Full link query (all configs) ────────────────────────────────────────
// Used by dashboard and edit form — fetches everything for one link.

const FULL_LINK_SELECT = `
  id,
  slug,
  title,
  description,
  text_content,
  content_links,
  mode,
  unlock_type,
  youtube_url,
  donate_enabled,
  is_active,
  view_count,
  unlock_count,
  created_at,
  updated_at,
  file:files (
    id,
    original_name,
    mime_type,
    size_bytes,
    file_type,
    r2_key,
    r2_bucket
  ),
  email_config:email_configs (
    id,
    newsletter_name,
    newsletter_description,
    incentive_text,
    confirmation_message,
    unlock_text,
    unlock_url,
    unlock_url_label,
    platform,
    platform_display_name
  ),
  social_config:social_configs (
    id,
    custom_heading,
    follow_description,
    unlock_text,
    unlock_url,
    unlock_url_label,
    follow_targets (
      id,
      type,
      platform,
      handle,
      profile_url,
      custom_label,
      custom_url,
      custom_icon,
      instruction_text,
      sort_order
    )
  ),
  sponsor_config:sponsor_configs (
    id,
    brand_name,
    brand_website,
    cta_button_label,
    requires_click,
    skip_after_seconds,
    unlock_text,
    unlock_url,
    unlock_url_label,
    video_file:files (
      id,
      original_name,
      mime_type,
      size_bytes,
      r2_key,
      r2_bucket
    )
  ),
  pairing_config:pairing_configs (
    id,
    topic,
    description,
    commitment_prompt,
    duration_days,
    check_in_frequency,
    guidelines,
    creator_resource_url,
    creator_resource_label,
    max_pairs,
    is_accepting,
    total_participants,
    active_pairs,
    completed_pairs,
    completion_asset:completion_assets (
      id,
      unlock_message,
      resource_title,
      resource_description,
      bonus_message,
      links,
      additional_links,
      youtube_url,
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
  )
`

// ── Fetch all links for creator dashboard ────────────────────────────────

export const getCreatorLinks = async (creatorId) => {
  const { data, error } = await supabase
    .from('links')
    .select(FULL_LINK_SELECT)
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// ── Fetch single link by slug (public page /r/:slug) ─────────────────────

export const getLinkBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('links')
    .select(`
      ${FULL_LINK_SELECT},
      creator:users (
        id,
        name,
        username,
        bio,
        avatar_color,
        initial,
        is_verified,
        trust_score,
        social_handles (
          platform,
          handle,
          profile_url
        )
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  
  if (error) throw error
  return data
}

// ── Fetch links for creator public profile /@:username ───────────────────

export const getPublicCreatorLinks = async (creatorId) => {
  const { data, error } = await supabase
    .from('links')
    .select(`
      id,
      slug,
      title,
      description,
      mode,
      unlock_type,
      view_count,
      unlock_count,
      created_at,
      file:files (
        id,
        original_name,
        mime_type,
        file_type
      ),
      pairing_config:pairing_configs (
        topic,
        duration_days,
        is_accepting,
        total_participants,
        active_pairs,
        completed_pairs
      )
    `)
    .eq('creator_id', creatorId)
    .eq('is_active', true)
    .order('unlock_count', { ascending: false })
  
  if (error) throw error
  return data || []
}

// ── Fetch links for Explore page ─────────────────────────────────────────

export const getExploreLinks = async ({
  search = '',
  category = '',
  unlockType = '',
  sortBy = 'unlock_count',
  page = 0,
  pageSize = 20,
} = {}) => {
  let query = supabase
    .from('links')
    .select(`
      id,
      slug,
      title,
      description,
      mode,
      unlock_type,
      view_count,
      unlock_count,
      created_at,
      file:files (
        id,
        original_name,
        mime_type,
        file_type
      ),
      creator:users (
        id,
        name,
        username,
        avatar_color,
        initial,
        is_verified
      ),
      sponsor_config:sponsor_configs (
        brand_name,
        requires_click
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .range(page * pageSize, (page + 1) * pageSize - 1)
  
  // Search against title + description using pg_trgm index
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%`
    )
  }
  
  // Filter by unlock type
  if (unlockType && unlockType !== 'all') {
    if (unlockType === 'follower_pairing') {
      query = query.eq('mode', 'follower_pairing')
    } else {
      query = query.eq('unlock_type', unlockType)
    }
  }
  
  // Sort
  const sortMap = {
    unlock_count: { column: 'unlock_count', ascending: false },
    created_at:   { column: 'created_at',   ascending: false },
    view_count:   { column: 'view_count',   ascending: false },
    title:        { column: 'title',         ascending: true  },
  }
  const sort = sortMap[sortBy] || sortMap.unlock_count
  query = query.order(sort.column, { ascending: sort.ascending })
  
  const { data, error, count } = await query
  
  if (error) throw error
  return { links: data || [], total: count || 0, hasMore: (page + 1) * pageSize < (count || 0) }
}

// ── Search users for Explore people search ───────────────────────────────

export const searchUsers = async (query, limit = 8) => {
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
    .or(`name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`)
    .limit(limit)
  
  if (error) throw error
  return data || []
}

// ── Create link ───────────────────────────────────────────────────────────

export const createLink = async (creatorId, linkData) => {
  const {
    title,
    description,
    textContent,
    contentLinks,
    mode,
    unlockType,
    fileId,
    youtubeUrl,
    donateEnabled,
    // Config objects
    emailConfig,
    socialConfig,    // { customHeading, followDescription, followTargets: [] }
    sponsorConfig,
    pairingConfig,
  } = linkData
  
  // Generate unique slug from title
  const slug = await generateUniqueSlug(title)
  
  // ── Insert base link record ──────────────────────────────────────────
  const { data: link, error: linkError } = await supabase
    .from('links')
    .insert({
      creator_id:    creatorId,
      slug,
      title,
      description:   description || null,
      text_content:  textContent || null,
      content_links: contentLinks && contentLinks.length > 0 ? contentLinks : [],
      mode,
      unlock_type:   mode === 'follower_pairing' ? null : unlockType,
      file_id:       fileId || null,
      youtube_url:   youtubeUrl || null,
      donate_enabled: donateEnabled || false,
      is_active:     true,
    })
    .select('id, slug')
    .single()
  
  if (linkError) throw linkError
  
  // ── Insert type-specific config ──────────────────────────────────────
  if (mode === 'lock_content') {
    
    if (unlockType === 'email_subscribe' && emailConfig) {
      const { error } = await supabase
        .from('email_configs')
        .insert({
          link_id:                link.id,
          newsletter_name:        emailConfig.newsletterName,
          newsletter_description: emailConfig.newsletterDescription || null,
          incentive_text:         emailConfig.incentiveText || null,
          confirmation_message:   emailConfig.confirmationMessage || null,
          unlock_text:            emailConfig.unlockText || null,
          unlock_url:             emailConfig.unlockUrl || null,
          unlock_url_label:       emailConfig.unlockUrlLabel || null,
          platform:               emailConfig.platform || 'direct',
          platform_display_name:  emailConfig.platformDisplayName || null,
        })
      if (error) throw error
    }
    
    if (unlockType === 'social_follow' && socialConfig) {
      // Insert social_config
      const { data: sc, error: scError } = await supabase
        .from('social_configs')
        .insert({
          link_id:            link.id,
          custom_heading:     socialConfig.customHeading || null,
          follow_description: socialConfig.followDescription || null,
          unlock_text:        socialConfig.unlockText || null,
          unlock_url:         socialConfig.unlockUrl || null,
          unlock_url_label:   socialConfig.unlockUrlLabel || null,
        })
        .select('id')
        .single()
      
      if (scError) throw scError
      
      // Insert follow targets
      if (socialConfig.followTargets?.length > 0) {
        const targets = socialConfig.followTargets.map((t, i) => ({
          social_config_id: sc.id,
          type:             t.type || 'platform',
          platform:         t.platform || null,
          handle:           t.handle || null,
          profile_url:      t.profileUrl || null,
          custom_label:     t.customLabel || null,
          custom_url:       t.customUrl || null,
          custom_icon:      t.customIcon || null,
          instruction_text: t.instructionText || null,
          sort_order:       i,
        }))
        const { error: targetsError } = await supabase
          .from('follow_targets')
          .insert(targets)
        if (targetsError) throw targetsError
      }
    }
    
    if (unlockType === 'custom_sponsor' && sponsorConfig) {
      const { error } = await supabase
        .from('sponsor_configs')
        .insert({
          link_id:             link.id,
          brand_name:          sponsorConfig.brandName,
          brand_website:       sponsorConfig.brandWebsite || null,
          cta_button_label:    sponsorConfig.ctaButtonLabel || 'Visit Sponsor',
          video_file_id:       sponsorConfig.videoFileId || null,
          requires_click:      sponsorConfig.requiresClick || false,
          skip_after_seconds:  sponsorConfig.skipAfterSeconds || 5,
          unlock_text:         sponsorConfig.unlockText || null,
          unlock_url:          sponsorConfig.unlockUrl || null,
          unlock_url_label:    sponsorConfig.unlockUrlLabel || null,
        })
      if (error) throw error
    }
  }
  
  if (mode === 'follower_pairing' && pairingConfig) {
    // Plan limit check — Free tier max 1 active pairing link
    const { data: planCheck } = await supabase
      .from('users')
      .select('is_pro, active_pairing_links_count')
      .eq('id', creatorId)
      .single()
    
    const maxAllowed = planCheck?.is_pro ? 5 : 1
    if ((planCheck?.active_pairing_links_count || 0) >= maxAllowed) {
      // Rollback the link insert then throw
      await supabase.from('links').delete().eq('id', link.id)
      throw new Error(
        planCheck?.is_pro
          ? 'You have reached the maximum of 5 active Follower Pairing campaigns on the Pro plan.'
          : 'Free plan allows 1 active Follower Pairing campaign. Upgrade to Pro for up to 5.'
      )
    }
    
    // Insert pairing config
    const { data: pc, error: pcError } = await supabase
      .from('pairing_configs')
      .insert({
        link_id:               link.id,
        topic:                 pairingConfig.topic,
        description:           pairingConfig.description || null,
        commitment_prompt:     pairingConfig.commitmentPrompt || "What specific goal will you commit to for this challenge?",
        duration_days:         pairingConfig.durationDays,
        check_in_frequency:    pairingConfig.checkInFrequency || 'daily',
        guidelines:            pairingConfig.guidelines || null,
        creator_resource_url:  pairingConfig.creatorResourceUrl || null,
        creator_resource_label: pairingConfig.creatorResourceLabel || null,
        max_pairs:             planCheck?.is_pro ? null : 10,
        is_accepting:          true,
      })
      .select('id')
      .single()
    
    if (pcError) throw pcError
    
    // Insert scheduled messages if any
    if (pairingConfig.scheduledMessages?.length > 0) {
      const messages = pairingConfig.scheduledMessages.map((m, i) => ({
        pairing_config_id: pc.id,
        day_number:        m.dayNumber,
        send_time:         m.sendTime || '09:00:00',
        content:           m.content,
        links:             m.links || [],
        youtube_url:       m.youtubeUrl || null,
        link_url:          m.linkUrl || null,
        link_label:        m.linkLabel || null,
        sort_order:        m.sortOrder ?? i,
      }))
      const { error: msgError } = await supabase
        .from('scheduled_messages')
        .insert(messages)
      if (msgError) throw msgError
    }
    
    // Insert completion asset if provided
    const ca = pairingConfig.completionAsset
    const hasCompletionContent = ca && (
      ca.enabled || ca.fileId || ca.youtubeUrl || ca.resourceTitle || ca.bonusMessage ||
      (ca.links?.length || 0) > 0 || (ca.additionalLinks?.length || 0) > 0
    )
    if (hasCompletionContent) {
      const { error: caError } = await supabase
        .from('completion_assets')
        .insert({
          pairing_config_id:    pc.id,
          file_id:              ca.fileId || null,
          unlock_message:       ca.unlockMessage || null,
          resource_title:       ca.resourceTitle || null,
          resource_description: ca.resourceDescription || null,
          bonus_message:        ca.bonusMessage || null,
          links:                ca.links || [],
          additional_links:     ca.additionalLinks || [],
          youtube_url:          ca.youtubeUrl || null,
        })
      if (caError) throw caError
    }
    
    // Increment active_pairing_links_count on user
    await supabase.rpc('increment_pairing_link_count', { p_user_id: creatorId })
  }
  
  return { id: link.id, slug: link.slug }
}

// ── Update link ───────────────────────────────────────────────────────────

export const updateLink = async (linkId, creatorId, updates) => {
  const {
    title,
    description,
    textContent,
    contentLinks,
    fileId,
    youtubeUrl,
    donateEnabled,
    isActive,
    emailConfig,
    socialConfig,
    sponsorConfig,
    pairingConfig,
  } = updates
  
  // Build the update object — only include fields that were passed
  const linkUpdates = {}
  if (title !== undefined)         linkUpdates.title = title
  if (description !== undefined)   linkUpdates.description = description || null
  if (textContent !== undefined)   linkUpdates.text_content = textContent || null
  if (contentLinks !== undefined)  linkUpdates.content_links = contentLinks || []
  if (fileId !== undefined)        linkUpdates.file_id = fileId || null
  if (youtubeUrl !== undefined)    linkUpdates.youtube_url = youtubeUrl || null
  if (donateEnabled !== undefined) linkUpdates.donate_enabled = donateEnabled
  if (isActive !== undefined)      linkUpdates.is_active = isActive
  
  if (Object.keys(linkUpdates).length > 0) {
    const { error } = await supabase
      .from('links')
      .update(linkUpdates)
      .eq('id', linkId)
      .eq('creator_id', creatorId)  // RLS + explicit check
    if (error) throw error
  }
  
  // Update email config
  if (emailConfig) {
    const { error } = await supabase
      .from('email_configs')
      .update({
        newsletter_name:        emailConfig.newsletterName,
        newsletter_description: emailConfig.newsletterDescription || null,
        incentive_text:         emailConfig.incentiveText || null,
        confirmation_message:   emailConfig.confirmationMessage || null,
        unlock_text:            emailConfig.unlockText || null,
        unlock_url:             emailConfig.unlockUrl || null,
        unlock_url_label:       emailConfig.unlockUrlLabel || null,
        platform:               emailConfig.platform || 'direct',
      })
      .eq('link_id', linkId)
    if (error) throw error
  }
  
  // Update social config + targets
  if (socialConfig) {
    const { data: sc } = await supabase
      .from('social_configs')
      .update({
        custom_heading:     socialConfig.customHeading || null,
        follow_description: socialConfig.followDescription || null,
        unlock_text:        socialConfig.unlockText || null,
        unlock_url:         socialConfig.unlockUrl || null,
        unlock_url_label:   socialConfig.unlockUrlLabel || null,
      })
      .eq('link_id', linkId)
      .select('id')
      .single()
    
    if (sc && socialConfig.followTargets) {
      // Replace all targets — delete and re-insert
      await supabase.from('follow_targets').delete().eq('social_config_id', sc.id)
      
      if (socialConfig.followTargets.length > 0) {
        const targets = socialConfig.followTargets.map((t, i) => ({
          social_config_id: sc.id,
          type:             t.type || 'platform',
          platform:         t.platform || null,
          handle:           t.handle || null,
          profile_url:      t.profileUrl || null,
          custom_label:     t.customLabel || null,
          custom_url:       t.customUrl || null,
          custom_icon:      t.customIcon || null,
          instruction_text: t.instructionText || null,
          sort_order:       i,
        }))
        await supabase.from('follow_targets').insert(targets)
      }
    }
  }
  
  // Update sponsor config
  if (sponsorConfig) {
    const { error } = await supabase
      .from('sponsor_configs')
      .update({
        brand_name:         sponsorConfig.brandName,
        brand_website:      sponsorConfig.brandWebsite || null,
        cta_button_label:   sponsorConfig.ctaButtonLabel || 'Visit Sponsor',
        video_file_id:      sponsorConfig.videoFileId || null,
        requires_click:     sponsorConfig.requiresClick || false,
        skip_after_seconds: sponsorConfig.skipAfterSeconds || 5,
      })
      .eq('link_id', linkId)
    if (error) throw error
  }
  
  // Update pairing config
  if (pairingConfig) {
    const { data: pc } = await supabase
      .from('pairing_configs')
      .update({
        topic:                  pairingConfig.topic,
        description:            pairingConfig.description || null,
        commitment_prompt:      pairingConfig.commitmentPrompt,
        duration_days:          pairingConfig.durationDays,
        check_in_frequency:     pairingConfig.checkInFrequency || 'daily',
        guidelines:             pairingConfig.guidelines || null,
        creator_resource_url:   pairingConfig.creatorResourceUrl || null,
        creator_resource_label: pairingConfig.creatorResourceLabel || null,
        is_accepting:           pairingConfig.isAccepting ?? true,
      })
      .eq('link_id', linkId)
      .select('id')
      .single()
    
    if (pc && pairingConfig.scheduledMessages) {
      // Only delete scheduled messages that haven't been delivered to any session
      // A message is considered delivered if any pairing_messages row references it
      const { data: existingMsgs } = await supabase
        .from('scheduled_messages')
        .select('id')
        .eq('pairing_config_id', pc.id)
      
      if (existingMsgs && existingMsgs.length > 0) {
        // Check which messages have been delivered
        const { data: deliveredRefs } = await supabase
          .from('pairing_messages')
          .select('scheduled_message_id')
          .in('scheduled_message_id', existingMsgs.map(m => m.id))
          .eq('message_type', 'scheduled')
        
        const deliveredIds = new Set((deliveredRefs || []).map(r => r.scheduled_message_id))
        const deletableIds = existingMsgs.filter(m => !deliveredIds.has(m.id)).map(m => m.id)
        
        if (deletableIds.length > 0) {
          await supabase
            .from('scheduled_messages')
            .delete()
            .in('id', deletableIds)
        }
      }
      
      // Insert new/updated messages that don't already exist as delivered
      const unsent = pairingConfig.scheduledMessages.filter(m => !m.isSent)
      if (unsent.length > 0) {
        await supabase.from('scheduled_messages').insert(
          unsent.map((m, i) => ({
            pairing_config_id: pc.id,
            day_number:        m.dayNumber,
            send_time:         m.sendTime || '09:00:00',
            content:           m.content,
            links:             m.links || [],
            youtube_url:       m.youtubeUrl || null,
            sort_order:        i,
          }))
        )
      }
    }
    
    // Update completion asset
    if (pairingConfig.completionAsset !== undefined) {
      const ca = pairingConfig.completionAsset;
      if (ca.enabled && (ca.fileId || ca.youtubeUrl || (ca.links?.length || 0) > 0)) {
        await supabase
          .from('completion_assets')
          .upsert({
            pairing_config_id: pc.id,
            file_id:           ca.fileId || null,
            unlock_message:    ca.unlockMessage || null,
            links:             ca.links || [],
            youtube_url:       ca.youtubeUrl || null,
            resource_title:    ca.resourceTitle || null,
            resource_description: ca.resourceDescription || null,
          }, { onConflict: 'pairing_config_id' })
      } else {
        // Completion asset removed
        await supabase
          .from('completion_assets')
          .delete()
          .eq('pairing_config_id', pc.id)
      }
    }
  }
  
  return true
}

// ── Toggle link active/inactive ───────────────────────────────────────────

export const toggleLinkActive = async (linkId, creatorId, isActive) => {
  const { error } = await supabase
    .from('links')
    .update({ is_active: isActive })
    .eq('id', linkId)
    .eq('creator_id', creatorId)
  
  if (error) throw error
  
  // If this is a pairing link being deactivated, update the count
  const { data: link } = await supabase
    .from('links')
    .select('mode')
    .eq('id', linkId)
    .single()
  
  if (link?.mode === 'follower_pairing') {
    await supabase.rpc(
      isActive ? 'increment_pairing_link_count' : 'decrement_pairing_link_count',
      { p_user_id: creatorId }
    )
  }
  
  return true
}

// ── Delete link ───────────────────────────────────────────────────────────

export const deleteLink = async (linkId, creatorId) => {
  // Get link mode before delete
  const { data: link } = await supabase
    .from('links')
    .select('mode, file_id, is_active')
    .eq('id', linkId)
    .single()
  
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', linkId)
    .eq('creator_id', creatorId)
  
  if (error) throw error
  
  // Adjust pairing link count if was active pairing link
  if (link?.mode === 'follower_pairing' && link?.is_active) {
    await supabase.rpc('decrement_pairing_link_count', { p_user_id: creatorId })
  }
  
  return true
}

// ── Track a link view ─────────────────────────────────────────────────────

export const trackLinkView = async (linkId, sessionKey, viewerId = null) => {
  // Deduplicate: don't count the same session_key twice within 30 minutes
  const { data: recent } = await supabase
    .from('link_views')
    .select('id')
    .eq('link_id', linkId)
    .eq('session_key', sessionKey)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle()
  
  if (recent) return  // already counted
  
  await supabase.from('link_views').insert({
    link_id:    linkId,
    viewer_id:  viewerId,
    session_key: sessionKey,
    referrer:   typeof document !== 'undefined' ? (document.referrer || null) : null,
  })
  
  // Increment denormalized counter
  await supabase.rpc('increment_link_views', { p_link_id: linkId })
}
