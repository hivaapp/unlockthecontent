-- Migration: Trigger for campaign pair milestones trust events
-- When a campaign's total pairs (active + completed) crosses 10, 25, or 50
-- Credits the CREATOR (link owner) with the trust event

-- ── Trigger function: check campaign pair milestones ──────────────────────
CREATE OR REPLACE FUNCTION public.fn_check_campaign_pairs_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_pairs INT;
  v_creator_id UUID;
  v_config_id UUID;
BEGIN
  -- Only fire when active_pairs or completed_pairs changes
  IF (OLD.active_pairs IS NOT DISTINCT FROM NEW.active_pairs)
     AND (OLD.completed_pairs IS NOT DISTINCT FROM NEW.completed_pairs) THEN
    RETURN NEW;
  END IF;

  v_config_id := NEW.id;
  v_total_pairs := COALESCE(NEW.active_pairs, 0) + COALESCE(NEW.completed_pairs, 0);

  -- Look up the creator via the link
  SELECT l.creator_id INTO v_creator_id
  FROM public.links l
  WHERE l.id = NEW.link_id;

  IF v_creator_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check milestones (each is idempotent per campaign via reference_id)
  IF v_total_pairs >= 10 THEN
    PERFORM public.record_trust_event(
      v_creator_id,
      'campaign_pairs_10'::public.trust_event_type,
      v_config_id,
      'Campaign reached 10 pairs'
    );
  END IF;

  IF v_total_pairs >= 25 THEN
    PERFORM public.record_trust_event(
      v_creator_id,
      'campaign_pairs_25'::public.trust_event_type,
      v_config_id,
      'Campaign reached 25 pairs'
    );
  END IF;

  IF v_total_pairs >= 50 THEN
    PERFORM public.record_trust_event(
      v_creator_id,
      'campaign_pairs_50'::public.trust_event_type,
      v_config_id,
      'Campaign reached 50 pairs'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ── Create the trigger on pairing_configs table ───────────────────────────
DROP TRIGGER IF EXISTS trg_campaign_pairs_milestones ON public.pairing_configs;
CREATE TRIGGER trg_campaign_pairs_milestones
  AFTER UPDATE OF active_pairs, completed_pairs ON public.pairing_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_campaign_pairs_milestones();
