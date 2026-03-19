/**
 * trustEventService.ts — Fire-and-forget calls to the record-trust-event Edge Function.
 *
 * All calls are non-blocking. Errors are caught and logged but never thrown.
 */

import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export type TrustEventType =
  | 'pairing_completed'
  | 'checkin_streak_7'
  | 'checkin_streak_14'
  | 'checkin_streak_30'
  | 'profile_completed'
  | 'email_verified'
  | 'first_subscription'
  | 'report_resolved_innocent'
  | 'creator_unlocks_25'
  | 'creator_unlocks_100'
  | 'creator_unlocks_500'
  | 'campaign_pairs_10'
  | 'campaign_pairs_25'
  | 'campaign_pairs_50'
  | 'pairing_abandoned'
  | 'checkin_missed_3'
  | 'report_confirmed';

/**
 * Record a trust event via the Edge Function.
 * Fire-and-forget — never blocks the UI.
 */
export const recordTrustEvent = (
  userId: string,
  eventType: TrustEventType,
  referenceId?: string,
  notes?: string,
): void => {
  // Get the current session token
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.access_token) return;

    fetch(`${SUPABASE_URL}/functions/v1/record-trust-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        userId,
        eventType,
        referenceId: referenceId || null,
        notes: notes || null,
      }),
    }).catch((err) => {
      console.warn('[TrustEvent] Failed to record:', eventType, err);
    });
  }).catch((err) => {
    console.warn('[TrustEvent] Failed to get session:', err);
  });
};

/**
 * Human-readable labels for trust event types (Account Page display).
 */
export const TRUST_EVENT_LABELS: Record<TrustEventType, { emoji: string; label: string; points: number }> = {
  pairing_completed:        { emoji: '🏆', label: 'Completed a challenge',       points: 8 },
  checkin_streak_7:         { emoji: '🔥', label: '7-day check-in streak',       points: 3 },
  checkin_streak_14:        { emoji: '🔥', label: '14-day check-in streak',      points: 5 },
  checkin_streak_30:        { emoji: '🔥', label: '30-day check-in streak',      points: 8 },
  profile_completed:        { emoji: '✅', label: 'Completed your profile',      points: 3 },
  email_verified:           { emoji: '✅', label: 'Verified email address',      points: 2 },
  first_subscription:       { emoji: '📧', label: 'First content subscription',  points: 2 },
  report_resolved_innocent: { emoji: '🛡️', label: 'Report cleared',             points: 5 },
  creator_unlocks_25:       { emoji: '🔓', label: '25 content unlocks',          points: 3 },
  creator_unlocks_100:      { emoji: '🔓', label: '100 content unlocks',         points: 5 },
  creator_unlocks_500:      { emoji: '🔓', label: '500 content unlocks',         points: 8 },
  campaign_pairs_10:        { emoji: '👥', label: 'Campaign hit 10 pairs',       points: 3 },
  campaign_pairs_25:        { emoji: '👥', label: 'Campaign hit 25 pairs',       points: 5 },
  campaign_pairs_50:        { emoji: '👥', label: 'Campaign hit 50 pairs',       points: 8 },
  pairing_abandoned:        { emoji: '⚠️', label: 'Challenge abandoned',         points: -10 },
  checkin_missed_3:         { emoji: '⚠️', label: 'Missed 3 check-ins',          points: -3 },
  report_confirmed:         { emoji: '🚫', label: 'Report confirmed',            points: -15 },
};

export default recordTrustEvent;
