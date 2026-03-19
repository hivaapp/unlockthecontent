-- Migration: Update record_trust_event to handle new unlock/pairs milestones
-- and zero out messaging-related events

CREATE OR REPLACE FUNCTION public.record_trust_event(
  p_user_id UUID,
  p_event_type public.trust_event_type,
  p_reference_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points INTEGER;
  v_already_exists BOOLEAN;
BEGIN
  -- ── Determine points ────────────────────────────────────────────────
  v_points := CASE p_event_type
    -- Positive events
    WHEN 'pairing_completed'        THEN 8
    WHEN 'checkin_streak_7'         THEN 3
    WHEN 'checkin_streak_14'        THEN 5
    WHEN 'checkin_streak_30'        THEN 8
    WHEN 'profile_completed'        THEN 3
    WHEN 'email_verified'           THEN 2
    WHEN 'first_subscription'       THEN 2
    WHEN 'report_resolved_innocent' THEN 5
    -- Unlock milestones (creator benefits)
    WHEN 'creator_unlocks_25'       THEN 3
    WHEN 'creator_unlocks_100'      THEN 5
    WHEN 'creator_unlocks_500'      THEN 8
    -- Campaign pair milestones (creator benefits)
    WHEN 'campaign_pairs_10'        THEN 3
    WHEN 'campaign_pairs_25'        THEN 5
    WHEN 'campaign_pairs_50'        THEN 8
    -- Negative events
    WHEN 'pairing_abandoned'        THEN -10
    WHEN 'checkin_missed_3'         THEN -3
    WHEN 'report_confirmed'         THEN -15
    -- Messaging events — zeroed out (no longer affect score)
    WHEN 'message_request_accepted' THEN 0
    WHEN 'message_request_declined' THEN 0
    WHEN 'spam_detected'            THEN 0
    ELSE 0
  END;

  -- Skip if points are 0 (no-op events)
  IF v_points = 0 THEN
    RETURN;
  END IF;

  -- ── Idempotency for one-time events ─────────────────────────────────
  IF p_event_type IN ('profile_completed', 'email_verified', 'first_subscription') THEN
    SELECT EXISTS(
      SELECT 1 FROM public.trust_events
      WHERE user_id = p_user_id AND event_type = p_event_type
    ) INTO v_already_exists;
    IF v_already_exists THEN RETURN; END IF;
  END IF;

  -- ── Idempotency for session-scoped events ───────────────────────────
  IF p_event_type IN ('pairing_completed', 'pairing_abandoned') AND p_reference_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.trust_events
      WHERE user_id = p_user_id AND event_type = p_event_type AND reference_id = p_reference_id
    ) INTO v_already_exists;
    IF v_already_exists THEN RETURN; END IF;
  END IF;

  -- ── Idempotency for milestone events (one-time per user) ────────────
  IF p_event_type IN (
    'creator_unlocks_25', 'creator_unlocks_100', 'creator_unlocks_500',
    'campaign_pairs_10', 'campaign_pairs_25', 'campaign_pairs_50'
  ) THEN
    -- For campaign pair milestones, use reference_id (config_id) to allow per-campaign milestones
    IF p_event_type IN ('campaign_pairs_10', 'campaign_pairs_25', 'campaign_pairs_50') AND p_reference_id IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM public.trust_events
        WHERE user_id = p_user_id AND event_type = p_event_type AND reference_id = p_reference_id
      ) INTO v_already_exists;
    ELSE
      -- For unlock milestones, they're global one-time per user
      SELECT EXISTS(
        SELECT 1 FROM public.trust_events
        WHERE user_id = p_user_id AND event_type = p_event_type
      ) INTO v_already_exists;
    END IF;
    IF v_already_exists THEN RETURN; END IF;
  END IF;

  -- ── Insert the event ────────────────────────────────────────────────
  INSERT INTO public.trust_events (user_id, event_type, points, reference_id, notes)
  VALUES (p_user_id, p_event_type, v_points, p_reference_id, p_notes);

  -- ── Recalculate the score ───────────────────────────────────────────
  PERFORM public.recalculate_trust_score(p_user_id);
END;
$$;

-- Ensure only service_role can call
REVOKE ALL ON FUNCTION public.record_trust_event(UUID, public.trust_event_type, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_trust_event(UUID, public.trust_event_type, UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.record_trust_event(UUID, public.trust_event_type, UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_trust_event(UUID, public.trust_event_type, UUID, TEXT) TO service_role;
