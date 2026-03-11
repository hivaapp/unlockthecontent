import { useState, useEffect, useCallback } from 'react';
import { mockAccountabilityParticipants } from '../lib/mockData';

export type MatchingState = 'searching' | 'found' | 'expired';

export interface MatchedParticipant {
  id: string;
  displayName: string;
  gender: string;
  commitmentStatement: string;
  initial: string;
  color: string;
}

const MOCK_NAMES: Record<string, { name: string; initial: string; commitment: string }> = {
  male: { name: 'Marcus', initial: 'M', commitment: 'Wake up at 5:30am and do 20 pushups before anything else.' },
  female: { name: 'Jordan', initial: 'J', commitment: 'No phone for first 30 minutes after waking. Cold shower every morning.' },
  any: { name: 'Jordan', initial: 'J', commitment: 'No phone for first 30 minutes after waking. Cold shower every morning.' },
};

export const useFollowerPairingMatching = (slug: string, genderPreference: string) => {
  const [matchingState, setMatchingState] = useState<MatchingState>('searching');
  const [matchedParticipant, setMatchedParticipant] = useState<MatchedParticipant | null>(null);
  const [matchHoldTimer, setMatchHoldTimer] = useState(600); // 10 minutes in seconds

  // Check for existing match in sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`adgate_acc_${slug}_match`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const matchFoundAt = new Date(parsed.matchFoundAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - matchFoundAt) / 1000);
        
        if (elapsed < 600) {
          setMatchedParticipant({
            id: parsed.matchedParticipantId,
            displayName: parsed.matchedParticipantName,
            gender: genderPreference,
            commitmentStatement: parsed.matchedParticipantCommitment,
            initial: parsed.matchedParticipantName[0],
            color: '#2563EB',
          });
          setMatchHoldTimer(600 - elapsed);
          setMatchingState('found');
          return;
        } else {
          // Match expired
          sessionStorage.removeItem(`adgate_acc_${slug}_match`);
          setMatchingState('expired');
          return;
        }
      } catch {
        // Invalid stored data, continue with fresh matching
      }
    }

    // Mock matching logic: simulate 6-second search
    const searchTimer = setTimeout(() => {
      const mockInfo = MOCK_NAMES[genderPreference] || MOCK_NAMES.any;
      const partner = mockAccountabilityParticipants[1];
      
      const matched: MatchedParticipant = {
        id: partner?.id || 'participant_pair',
        displayName: mockInfo.name,
        gender: genderPreference === 'any' ? 'female' : genderPreference,
        commitmentStatement: mockInfo.commitment,
        initial: mockInfo.initial,
        color: '#2563EB',
      };
      
      setMatchedParticipant(matched);
      setMatchingState('found');
      
      // Save to sessionStorage
      sessionStorage.setItem(`adgate_acc_${slug}_match`, JSON.stringify({
        matchedParticipantId: matched.id,
        matchedParticipantName: matched.displayName,
        matchedParticipantCommitment: matched.commitmentStatement,
        matchFoundAt: new Date().toISOString(),
      }));
    }, 6000);

    return () => clearTimeout(searchTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count down match hold timer every second
  useEffect(() => {
    if (matchingState !== 'found') return;

    const interval = setInterval(() => {
      setMatchHoldTimer(prev => {
        if (prev <= 1) {
          setMatchingState('expired');
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [matchingState]);

  const formatHoldTimer = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  return { matchingState, matchedParticipant, matchHoldTimer, formatHoldTimer };
};
