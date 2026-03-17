import { useState, useEffect, useCallback, useRef } from 'react';
import { findMatch, joinPairing, releaseMatch } from '../services/followerPairingService';
import { getLinkBySlug } from '../services/linksService';
import { supabase } from '../lib/supabase';

export type MatchingState = 'searching' | 'found' | 'expired' | 'releasing';

export interface MatchedParticipant {
  id: string;
  displayName: string;
  gender: string;
  commitmentStatement: string;
  initial: string;
  color: string;
  userId?: string;
  trustScore?: number;
}

export const useFollowerPairingMatching = (slug: string, genderPreference: string) => {
  const [matchingState, setMatchingState] = useState<MatchingState>('searching');
  const [matchedParticipant, setMatchedParticipant] = useState<MatchedParticipant | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<any>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);

  // Start matching — only for authenticated users
  useEffect(() => {
    if (!slug || hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Check for existing match in sessionStorage
    const stored = sessionStorage.getItem(`adgate_acc_${slug}_match`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const matchFoundAt = new Date(parsed.matchFoundAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - matchFoundAt) / 1000);

        if (elapsed < 600 && parsed.matchedParticipantId !== 'pending') {
          setMatchedParticipant({
            id: parsed.matchedParticipantId,
            displayName: parsed.matchedParticipantName,
            gender: genderPreference,
            commitmentStatement: parsed.matchedParticipantCommitment,
            initial: parsed.matchedParticipantName?.[0] || '?',
            color: parsed.matchedParticipantColor || '#2563EB',
            userId: parsed.matchedParticipantUserId,
            trustScore: parsed.matchedParticipantTrustScore,
          });
          setSessionId(parsed.sessionId || null);
          setParticipantId(parsed.participantId || null);
          setMatchingState('found');
          return;
        } else {
          sessionStorage.removeItem(`adgate_acc_${slug}_match`);
          if (elapsed >= 600) {
            setMatchingState('expired');
            return;
          }
        }
      } catch {
        // Invalid stored data
      }
    }

    // Start real matching
    fetchLinkAndStartMatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchLinkAndStartMatching = async () => {
    try {
      const link = await getLinkBySlug(slug);
      if (!link || link.mode !== 'follower_pairing') return;
      setLinkData(link);

      // Get auth session directly from Supabase
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const userId = authSession?.user?.id;

      if (userId) {
        await startRealMatching(link, userId);
      } else {
        // User is not logged in — they shouldn't be here
        // The matching page guards against this, but just in case
        console.warn('User is not authenticated. Cannot start matching.');
      }
    } catch (err) {
      console.error('Failed to start matching:', err);
    }
  };

  const startRealMatching = async (link: any, userId: string) => {
    try {
      const commitment = sessionStorage.getItem(`adgate_acc_${slug}_commitment`) || '';
      const gender = sessionStorage.getItem(`adgate_acc_${slug}_gender`) || 'any';

      // Join the campaign
      const participant = await joinPairing({
        linkId: link.id,
        userId,
        commitmentText: commitment,
        gender,
        genderPreference: gender as 'male' | 'female' | 'any',
      });

      setParticipantId(participant.id);

      // If already has a session, load it
      if (participant.session_id) {
        try {
          const result = await findMatch(participant.id, link.id);
          if (result.matched && result.session && result.partner) {
            handleMatchFound(result.session, result.partner, participant.id);
            return;
          }
        } catch {
          // findMatch might fail if the session already exists
          setSessionId(participant.session_id);
          setMatchingState('found');
          return;
        }
      }

      // Try to find a match immediately
      try {
        const result = await findMatch(participant.id, link.id);
        if (result.matched && result.session && result.partner) {
          handleMatchFound(result.session, result.partner, participant.id);
          return;
        }
      } catch {
        // No match available yet — fall through to polling
      }

      // Start polling for a match
      pollIntervalRef.current = setInterval(async () => {
        try {
          const result = await findMatch(participant.id, link.id);
          if (result.matched && result.session && result.partner) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            handleMatchFound(result.session, result.partner, participant.id);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 5000);
    } catch (err) {
      console.error('Real matching failed:', err);
    }
  };

  const handleMatchFound = (session: any, partner: any, myParticipantId: string) => {
    const partnerUser = partner.user;
    const displayName = partnerUser?.name || partner.displayName || 'Your Partner';
    const initial = partnerUser?.initial || displayName[0] || '?';
    const color = partnerUser?.avatar_color || '#2563EB';
    const trustScore = partnerUser?.trust_score ?? 75;

    const matched: MatchedParticipant = {
      id: partner.id,
      displayName,
      gender: partner.gender || genderPreference,
      commitmentStatement: partner.commitment_text || '',
      initial,
      color,
      userId: partner.user_id,
      trustScore,
    };

    setMatchedParticipant(matched);
    setSessionId(session.id);
    setParticipantId(myParticipantId);
    setMatchingState('found');

    // Save to sessionStorage
    sessionStorage.setItem(`adgate_acc_${slug}_match`, JSON.stringify({
      matchedParticipantId: partner.id,
      matchedParticipantName: displayName,
      matchedParticipantCommitment: partner.commitment_text || '',
      matchedParticipantColor: color,
      matchedParticipantUserId: partner.user_id,
      matchedParticipantTrustScore: trustScore,
      matchFoundAt: new Date().toISOString(),
      sessionId: session.id,
      participantId: myParticipantId,
    }));

    sessionStorage.setItem(`adgate_acc_${slug}_session`, session.id);
    sessionStorage.setItem(`adgate_acc_${slug}_participant`, myParticipantId);
  };

  // Rematch: release current match and re-enter the queue
  const handleRematch = useCallback(async () => {
    if (!participantId || !sessionId || !linkData) return;

    setMatchingState('releasing');

    try {
      // Release the current match
      await releaseMatch(participantId, sessionId);

      // Clear stored match
      sessionStorage.removeItem(`adgate_acc_${slug}_match`);
      sessionStorage.removeItem(`adgate_acc_${slug}_session`);

      // Reset state
      setMatchedParticipant(null);
      setSessionId(null);
      setMatchingState('searching');

      // Get auth session
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const userId = authSession?.user?.id;

      if (userId) {
        await startRealMatching(linkData, userId);
      }
    } catch (err) {
      console.error('Rematch failed:', err);
      setMatchingState('found'); // Revert to previous state
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId, sessionId, linkData, slug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const formatHoldTimer = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  return {
    matchingState,
    matchedParticipant,
    formatHoldTimer,
    sessionId,
    participantId,
    linkData,
    handleRematch,
  };
};
