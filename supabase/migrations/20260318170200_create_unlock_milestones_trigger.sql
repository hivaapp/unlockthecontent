-- Migration: Trigger for unlock milestones trust events
-- When a creator's total unlocks across all links crosses 25, 100, or 500

-- ── Trigger function: check creator-wide unlock milestones ────────────────
CREATE OR REPLACE FUNCTION public.fn_check_unlock_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id UUID;
  v_total_unlocks BIGINT;
BEGIN
  -- Only fire when unlock_count actually changes
  IF OLD.unlock_count IS NOT DISTINCT FROM NEW.unlock_count THEN
    RETURN NEW;
  END IF;

  v_creator_id := NEW.creator_id;
  IF v_creator_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Sum unlock_count across ALL active links for this creator
  SELECT COALESCE(SUM(unlock_count), 0)
  INTO v_total_unlocks
  FROM public.links
  WHERE creator_id = v_creator_id AND is_active = TRUE;

  -- Check milestones (each is idempotent in record_trust_event)
  IF v_total_unlocks >= 25 THEN
    PERFORM public.record_trust_event(v_creator_id, 'creator_unlocks_25'::public.trust_event_type, NULL, 'Reached 25 total unlocks');
  END IF;

  IF v_total_unlocks >= 100 THEN
    PERFORM public.record_trust_event(v_creator_id, 'creator_unlocks_100'::public.trust_event_type, NULL, 'Reached 100 total unlocks');
  END IF;

  IF v_total_unlocks >= 500 THEN
    PERFORM public.record_trust_event(v_creator_id, 'creator_unlocks_500'::public.trust_event_type, NULL, 'Reached 500 total unlocks');
  END IF;

  RETURN NEW;
END;
$$;

-- ── Create the trigger on links table ─────────────────────────────────────
DROP TRIGGER IF EXISTS trg_unlock_milestones ON public.links;
CREATE TRIGGER trg_unlock_milestones
  AFTER UPDATE OF unlock_count ON public.links
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_unlock_milestones();
