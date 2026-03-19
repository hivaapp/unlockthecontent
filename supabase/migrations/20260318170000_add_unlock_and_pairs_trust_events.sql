-- Migration: Add unlock milestone and campaign pairs trust events
-- Also zero out messaging-related events

-- ── Add new enum values ──────────────────────────────────────────────────────
ALTER TYPE public.trust_event_type ADD VALUE IF NOT EXISTS 'creator_unlocks_25';
ALTER TYPE public.trust_event_type ADD VALUE IF NOT EXISTS 'creator_unlocks_100';
ALTER TYPE public.trust_event_type ADD VALUE IF NOT EXISTS 'creator_unlocks_500';
ALTER TYPE public.trust_event_type ADD VALUE IF NOT EXISTS 'campaign_pairs_10';
ALTER TYPE public.trust_event_type ADD VALUE IF NOT EXISTS 'campaign_pairs_25';
ALTER TYPE public.trust_event_type ADD VALUE IF NOT EXISTS 'campaign_pairs_50';
