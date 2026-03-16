// src/services/socialFollowService.ts
import { supabase } from '../lib/supabase';
import { getDownloadUrl } from './uploadService';
import { validateSocialInput, type SocialPlatformId } from '../lib/socialValidation';

// ── Session key management ────────────────────────────────────────────────
// Same anonymous session key pattern as emailSubscribeService.
// Key format: adgate_social_[linkId]

const getSessionKey = (linkId: string) => {
  const storageKey = `adgate_social_${linkId}`;
  let key = sessionStorage.getItem(storageKey);
  if (!key) {
    key = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem(storageKey, key);
  }
  return key;
};

// ── Visited targets tracking ──────────────────────────────────────────────
// Tracks which follow targets have been visited in this browser session.
// Key format: adgate_follow_[linkId]_visited
// Value: JSON array of target IDs

export const getVisitedTargets = (linkId: string): string[] => {
  const key = `adgate_follow_${linkId}_visited`;
  try {
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const markTargetVisited = (linkId: string, targetId: string) => {
  const key = `adgate_follow_${linkId}_visited`;
  const visited = getVisitedTargets(linkId);
  if (!visited.includes(targetId)) {
    visited.push(targetId);
    sessionStorage.setItem(key, JSON.stringify(visited));
  }
  return visited;
};

export const areAllTargetsVisited = (linkId: string, totalTargets: any[]) => {
  const visited = getVisitedTargets(linkId);
  return visited.length >= totalTargets.length &&
    totalTargets.every(t => visited.includes(t.id));
};

// ── Check if unlock already completed in this session ─────────────────────

export const hasCompletedSocialUnlock = (linkId: string) => {
  return sessionStorage.getItem(`adgate_social_unlocked_${linkId}`) === 'true';
};

const markUnlockComplete = (linkId: string) => {
  sessionStorage.setItem(`adgate_social_unlocked_${linkId}`, 'true');
};

// ── Record social unlock ──────────────────────────────────────────────────
// Core function. Inserts social_unlocks row, returns download URL.

interface RecordSocialUnlockParams {
  linkId: string;
  socialConfigId: string;
  viewerId?: string | null;
  linkSlug: string;
  fileId?: string | null;
  completedTargets?: string[];
}

export const recordSocialUnlock = async ({
  linkId,
  socialConfigId,
  viewerId = null,
  linkSlug,
  fileId,
  completedTargets = [],
}: RecordSocialUnlockParams) => {
  const sessionKey = getSessionKey(linkId);

  // ── Check for existing unlock ───────────────────────────────────────
  let existingQuery = supabase
    .from('social_unlocks')
    .select('id, all_completed')
    .eq('link_id', linkId)
    .eq('all_completed', true);

  if (viewerId) {
    existingQuery = existingQuery.eq('viewer_id', viewerId);
  } else {
    existingQuery = existingQuery.eq('session_key', sessionKey);
  }

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    markUnlockComplete(linkId);

    let downloadUrl = null;
    if (fileId) {
      try {
        const result = await getDownloadUrl({
          fileId,
          linkSlug,
          unlockType: 'social_follow',
          sessionKey,
          forceDownload: false,
        });
        downloadUrl = result.downloadUrl;
      } catch (err) {
        console.error('Failed to get download URL:', err);
      }
    }

    return {
      success: true,
      alreadyUnlocked: true,
      downloadUrl,
    };
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
    });

  if (insertError) {
    if (insertError.code === '23505') {
      markUnlockComplete(linkId);

      let downloadUrl = null;
      if (fileId) {
        try {
          const result = await getDownloadUrl({
            fileId,
            linkSlug,
            unlockType: 'social_follow',
            sessionKey,
            forceDownload: false,
          });
          downloadUrl = result.downloadUrl;
        } catch (err) {
          console.error('Failed to get download URL on duplicate:', err);
        }
      }

      return {
        success: true,
        alreadyUnlocked: true,
        downloadUrl,
      };
    }
    console.error('Social unlock insert error:', insertError);
    throw new Error('Failed to record unlock. Please try again.');
  }

  // ── Increment unlock counter ──────────────────────────────────────
  if (!viewerId) {
    await supabase.rpc('increment_link_unlocks', { p_link_id: linkId });
  } else {
    const { data: priorUnlocks } = await supabase
      .from('social_unlocks')
      .select('id')
      .eq('link_id', linkId)
      .eq('viewer_id', viewerId)
      .eq('all_completed', true);

    if (!priorUnlocks || priorUnlocks.length <= 1) {
      await supabase.rpc('increment_link_unlocks', { p_link_id: linkId });
    }
  }

  markUnlockComplete(linkId);

  let downloadUrl = null;
  if (fileId) {
    try {
      const result = await getDownloadUrl({
        fileId,
        linkSlug,
        unlockType: 'social_follow',
        sessionKey,
        forceDownload: false,
      });
      downloadUrl = result.downloadUrl;
    } catch (err) {
      console.error('Failed to get download URL:', err);
    }
  }

  return {
    success: true,
    alreadyUnlocked: false,
    downloadUrl,
  };
};

// ── Get the URL for a follow target ───────────────────────────────────────

export const constructProfileUrl = (platform: string, handle: string) => {
  const validation = validateSocialInput(platform as SocialPlatformId, handle);
  return validation.isValid ? validation.profileUrl : handle;
};

export const getTargetUrl = (target: any) => {
  if (target.type === 'custom') {
    return target.custom_url || target.customUrl || '#';
  }
  // Use stored profile_url if available
  if (target.profile_url || target.profileUrl) {
    return target.profile_url || target.profileUrl;
  }
  return constructProfileUrl(target.platform, target.handle);
};

// ── Get display label for a target ────────────────────────────────────────

export const getTargetLabel = (target: any) => {
  if (target.type === 'custom') {
    return target.custom_label || target.customLabel || 'Visit Link';
  }
  const platformName = target.platform
    ? target.platform.charAt(0).toUpperCase() + target.platform.slice(1)
    : 'Follow';
  const handle = target.handle || '';
  return handle ? `${platformName} · ${handle}` : `Follow on ${platformName}`;
};

// ── Platform info for icons ───────────────────────────────────────────────

export const PLATFORM_INFO: Record<string, { icon: string; label: string; color: string }> = {
  instagram:  { icon: '📸', label: 'Instagram', color: '#E4405F' },
  twitter:    { icon: '🐦', label: 'Twitter',   color: '#1DA1F2' },
  tiktok:     { icon: '📱', label: 'TikTok',    color: '#010101' },
  youtube:    { icon: '▶️', label: 'YouTube',   color: '#FF0000' },
  linkedin:   { icon: '💼', label: 'LinkedIn',  color: '#0077B5' },
  twitch:     { icon: '📺', label: 'Twitch',    color: '#9146FF' },
  discord:    { icon: '💬', label: 'Discord',   color: '#5865F2' },
  telegram:   { icon: '✈️', label: 'Telegram',  color: '#26A5E4' },
  threads:    { icon: '🧵', label: 'Threads',   color: '#000000' },
  pinterest:  { icon: '📌', label: 'Pinterest', color: '#E60023' },
  spotify:    { icon: '🎵', label: 'Spotify',   color: '#1DB954' },
  github:     { icon: '💻', label: 'GitHub',    color: '#333333' },
};

export const getTargetIcon = (target: any) => {
  if (target.type === 'custom') {
    return target.custom_icon || target.customIcon || '🔗';
  }
  return PLATFORM_INFO[target.platform]?.icon || '🔗';
};
