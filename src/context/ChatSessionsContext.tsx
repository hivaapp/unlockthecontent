import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ViewerChatSession } from '../lib/mockData';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface ChatSessionsContextType {
  sessions: ViewerChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ViewerChatSession[]>>;
  markSessionRead: (sessionId: string) => void;
  markAllRead: () => void;
  getTotalUnread: () => number;
  addNewSession: (sessionData: ViewerChatSession) => void;
  removeSession: (sessionId: string) => void;
  loading: boolean;
  refreshSessions: () => Promise<void>;
}

const ChatSessionsContext = createContext<ChatSessionsContextType | undefined>(undefined);

// Helper to build a ViewerChatSession from raw Supabase data
const buildSessionFromSupabase = (
  session: any,
  currentUserId: string
): ViewerChatSession => {
  const isA = session.participant_a?.user_id === currentUserId;
  const me = isA ? session.participant_a : session.participant_b;
  const partner = isA ? session.participant_b : session.participant_a;
  const partnerUser = partner?.user;

  const pairedAt = new Date(session.paired_at);
  const expiresAt = new Date(session.expires_at);
  const now = new Date();
  const daysTotal = Math.max(1, Math.ceil((expiresAt.getTime() - pairedAt.getTime()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.ceil((now.getTime() - pairedAt.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);

  // Get the challenge topic from linked config or link
  const challengeTopic = session.pairing_config?.topic || session.link?.title || 'Accountability Challenge';
  const durationDays = session.pairing_config?.duration_days || daysTotal;
  const checkInFrequency = session.pairing_config?.check_in_frequency || 'daily';

  // Creator info from link
  const creator = session.link?.creator;

  return {
    sessionId: session.id,
    linkSlug: session.link?.slug || '',
    linkId: session.link_id,
    creator: {
      id: creator?.id || '',
      name: creator?.name || 'Creator',
      username: creator?.username || '',
      initial: creator?.initial || creator?.name?.[0] || 'C',
      avatarColor: creator?.avatar_color || '#6B6860',
    },
    challengeTopic,
    durationDays,
    checkInFrequency,
    viewerParticipantId: me?.id || '',
    viewerCommitment: me?.commitment_text || '',
    viewerGender: me?.gender || 'any',
    partner: {
      participantId: partner?.id || '',
      displayName: partnerUser?.name || 'Partner',
      initial: partnerUser?.initial || partnerUser?.name?.[0] || '?',
      avatarColor: partnerUser?.avatar_color || '#2563EB',
      commitment: partner?.commitment_text || '',
      gender: partner?.gender || 'any',
      trustScore: partnerUser?.trust_score,
    },
    pairedAt: session.paired_at,
    expiresAt: session.expires_at,
    isExpired: session.status === 'expired' || expiresAt <= now,
    isCompleted: session.status === 'completed',
    totalMessages: 0,
    unreadCount: session._unread_count || 0,
    lastMessage: {
      content: session._last_message?.content || 'No messages yet',
      senderId: session._last_message?.sender_id || '',
      senderName: session._last_message?.sender_name || '',
      timestamp: session._last_message?.created_at || session.paired_at,
      type: session._last_message?.is_broadcast ? 'broadcast' : 'private',
    },
    unreadBroadcasts: 0,
    daysTotal,
    daysElapsed,
    daysRemaining,
    status: session.status as 'active' | 'completed' | 'expired' | 'partner_left',
  };
};

export const ChatSessionsProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<ViewerChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isLoggedIn } = useAuth();

  const fetchSessions = useCallback(async () => {
    if (!currentUser?.id) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // First get all participant records for this user
      const { data: myParticipants, error: partErr } = await supabase
        .from('pairing_participants')
        .select('id, session_id')
        .eq('user_id', currentUser.id)
        .not('session_id', 'is', null);

      if (partErr) {
        console.error('[fetchSessions] Failed to fetch participants:', partErr);
        setSessions([]);
        setLoading(false);
        return;
      }

      console.log('[fetchSessions] myParticipants:', myParticipants);

      if (!myParticipants || myParticipants.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const sessionIds = myParticipants.map(p => p.session_id).filter(Boolean);
      console.log('[fetchSessions] sessionIds:', sessionIds);

      // Fetch all sessions with participant+user data
      const { data: rawSessions, error: sessErr } = await supabase
        .from('pairing_sessions')
        .select(`
          *,
          participant_a:pairing_participants!pairing_sessions_participant_a_id_fkey (
            *,
            user:users (id, name, username, avatar_color, initial, is_verified, trust_score)
          ),
          participant_b:pairing_participants!pairing_sessions_participant_b_id_fkey (
            *,
            user:users (id, name, username, avatar_color, initial, is_verified, trust_score)
          ),
          pairing_config:pairing_configs!pairing_sessions_pairing_config_id_fkey (
            topic, duration_days, check_in_frequency
          ),
          link:links!pairing_sessions_link_id_fkey (
            id, slug, title,
            creator:users!links_creator_id_fkey (id, name, username, avatar_color, initial)
          )
        `)
        .in('id', sessionIds)
        .order('paired_at', { ascending: false });

      if (sessErr) {
        console.error('[fetchSessions] Failed to fetch sessions:', sessErr);
        setSessions([]);
        setLoading(false);
        return;
      }

      console.log('[fetchSessions] rawSessions:', rawSessions);

      if (!rawSessions || rawSessions.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // For each session, fetch the last message
      const sessionsWithMessages = await Promise.all(
        rawSessions.map(async (session: any) => {
          // Fetch last message
          const { data: lastMsg } = await supabase
            .from('pairing_messages')
            .select('content, sender_id, is_broadcast, created_at, sender:users!pairing_messages_sender_id_fkey(name)')
            .eq('session_id', session.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Fetch unread count
          const { count: unreadCount } = await supabase
            .from('pairing_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('is_read', false)
            .neq('sender_id', currentUser.id);

          return {
            ...session,
            _last_message: lastMsg ? {
              content: lastMsg.content,
              sender_id: lastMsg.sender_id,
              sender_name: (lastMsg.sender as any)?.name || '',
              created_at: lastMsg.created_at,
              is_broadcast: lastMsg.is_broadcast,
            } : null,
            _unread_count: unreadCount || 0,
          };
        })
      );

      const built = sessionsWithMessages.map((s: any) =>
        buildSessionFromSupabase(s, currentUser.id)
      );
      setSessions(built);
    } catch (err) {
      console.error('Error loading pairing sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Load sessions when user changes
  useEffect(() => {
    if (isLoggedIn && currentUser?.id) {
      fetchSessions();
    } else {
      setSessions([]);
      setLoading(false);
    }
  }, [isLoggedIn, currentUser?.id, fetchSessions]);

  const markSessionRead = useCallback((sessionId: string) => {
    setSessions(prev =>
      prev.map(s =>
        s.sessionId === sessionId
          ? { ...s, unreadCount: 0, unreadBroadcasts: 0 }
          : s
      )
    );
  }, []);

  const markAllRead = useCallback(() => {
    setSessions(prev =>
      prev.map(s => ({ ...s, unreadCount: 0, unreadBroadcasts: 0 }))
    );
  }, []);

  const getTotalUnread = useCallback(() => {
    return sessions.reduce((sum, s) => sum + s.unreadCount + s.unreadBroadcasts, 0);
  }, [sessions]);

  const addNewSession = useCallback((sessionData: ViewerChatSession) => {
    setSessions(prev => [sessionData, ...prev]);
  }, []);

  const removeSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
  }, []);

  const refreshSessions = useCallback(async () => {
    await fetchSessions();
  }, [fetchSessions]);

  return (
    <ChatSessionsContext.Provider
      value={{ sessions, setSessions, markSessionRead, markAllRead, getTotalUnread, addNewSession, removeSession, loading, refreshSessions }}
    >
      {children}
    </ChatSessionsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChatSessions = () => {
  const context = useContext(ChatSessionsContext);
  if (context === undefined) {
    throw new Error('useChatSessions must be used within a ChatSessionsProvider');
  }
  return context;
};
