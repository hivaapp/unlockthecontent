import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import * as messageService from '../services/messageService';
import { supabase } from '../lib/supabase';

// --- Types (Kept same as original for UI compatibility) ---
export interface MessageSender {
  id: string;
  name: string;
  username: string;
  initial: string;
  avatarColor: string;
  trustScore: number;
  isCreator: boolean;
  joinedDate?: string;
}

export interface MessageRequest {
  requestId: string;
  status: 'pending' | 'approved' | 'declined';
  sender: MessageSender;
  recipientId: string;
  openingMessage: string;
  sentAt: string;
  respondedAt: string | null;
}

export interface DMParticipant {
  id: string;
  name: string;
  username: string;
  initial: string;
  avatarColor: string;
  isCreator?: boolean;
  trustScore?: number;
  bio?: string;
  joinedDate?: string;
}

export interface DMMessage {
  messageId: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text';
  isOpeningMessage?: boolean;
}

export interface DirectConversation {
  conversationId: string;
  requestId: string;
  participants: DMParticipant[];
  createdAt: string;
  lastMessage: {
    content: string;
    senderId: string;
    timestamp: string;
  };
  unreadCount: number;
  messages: DMMessage[];
}

interface MessagingContextType {
  requests: MessageRequest[];
  conversations: DirectConversation[];
  getPendingRequests: (userId: string) => MessageRequest[];
  getTotalPendingCount: (userId: string) => number;
  getTotalDMUnread: (userId: string) => number;
  sendRequest: (recipientId: string, openingMessage: string, sender: MessageSender) => Promise<string>;
  approveRequest: (requestId: string, currentUserProfile: DMParticipant) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, senderId: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  hasPendingRequestTo: (senderId: string, recipientId: string) => boolean;
  removeConversation: (conversationId: string) => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);

  // Converters
  const convertRequest = (r: any): MessageRequest => ({
    requestId: r.id,
    status: r.status,
    sender: {
      id: r.sender.id,
      name: r.sender.name,
      username: r.sender.username,
      initial: r.sender.initial || r.sender.name[0],
      avatarColor: r.sender.avatar_color || '#E8312A',
      trustScore: r.sender.trust_score || 85,
      isCreator: r.sender.is_creator || false,
    },
    recipientId: r.recipient_id,
    openingMessage: r.opening_message,
    sentAt: r.created_at,
    respondedAt: r.responded_at,
  });

  const convertConversation = (c: any, currentUserId: string): DirectConversation => {
    const pA = c.participant_a;
    const pB = c.participant_b;
    const unreadCount = c.participant_a_id === currentUserId ? c.unread_count_a : c.unread_count_b;

    return {
      conversationId: c.id,
      requestId: c.request_id,
      participants: [
        {
          id: pA.id,
          name: pA.name,
          username: pA.username,
          initial: pA.initial || pA.name[0],
          avatarColor: pA.avatar_color || '#2563EB',
          trustScore: pA.trust_score,
        },
        {
          id: pB.id,
          name: pB.name,
          username: pB.username,
          initial: pB.initial || pB.name[0],
          avatarColor: pB.avatar_color || '#166534',
          trustScore: pB.trust_score,
        }
      ],
      createdAt: c.created_at,
      lastMessage: {
        content: c.last_message_content || 'Chat started',
        senderId: c.last_message_sender_id || '',
        timestamp: c.last_message_at || c.created_at,
      },
      unreadCount: unreadCount || 0,
      messages: [],
    };
  };

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [reqs, convs] = await Promise.all([
        messageService.getRequests(currentUser.id),
        messageService.getConversations(currentUser.id)
      ]);
      setRequests(reqs.map(convertRequest));
      setConversations(convs.map(c => convertConversation(c, currentUser.id)));
    } catch (err) {
      console.error("Failed to load messaging data", err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();

    if (!currentUser) return;

    // Realtime subscriptions
    const reqSub = supabase.channel(`public:message_requests:recipient_id=eq.${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_requests' }, () => {
        loadData();
      }).subscribe();

    const reqSubSender = supabase.channel(`public:message_requests:sender_id=eq.${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_requests' }, () => {
        loadData();
      }).subscribe();

    const convSubA = supabase.channel(`public:direct_conversations:participant_a_id=eq.${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_conversations' }, () => {
        loadData();
      }).subscribe();

    const convSubB = supabase.channel(`public:direct_conversations:participant_b_id=eq.${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_conversations' }, () => {
        loadData();
      }).subscribe();

    return () => {
      supabase.removeChannel(reqSub);
      supabase.removeChannel(reqSubSender);
      supabase.removeChannel(convSubA);
      supabase.removeChannel(convSubB);
    };
  }, [currentUser, loadData]);

  const getPendingRequests = useCallback((userId: string) =>
    requests.filter(r => r.recipientId === userId && r.status === 'pending'),
  [requests]);

  const getTotalPendingCount = useCallback((userId: string) =>
    getPendingRequests(userId).length,
  [getPendingRequests]);

  const getTotalDMUnread = useCallback((userId: string) =>
    conversations
      .filter(c => c.participants.some(p => p.id === userId))
      .reduce((sum, c) => sum + (c.unreadCount || 0), 0),
  [conversations]);

  const hasPendingRequestTo = useCallback((senderId: string, recipientId: string) =>
    requests.some(r => r.sender.id === senderId && r.recipientId === recipientId && r.status === 'pending'),
  [requests]);

  const sendRequest = useCallback(async (recipientId: string, openingMessage: string, _sender: MessageSender) => {
    if (!currentUser) return '';
    try {
      const dbReq = await messageService.createMessageRequest(currentUser.id, recipientId, openingMessage);
      // We optimistically refetch instead of manual injection to get correct payload with joins
      loadData();
      return dbReq.id;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [currentUser, loadData]);

  const approveRequest = useCallback(async (requestId: string, _currentUserProfile: DMParticipant) => {
    if (!currentUser) return;
    try {
      const theRequest = requests.find(r => r.requestId === requestId);
      if (!theRequest) return;
      
      await messageService.updateRequestStatus(requestId, 'approved');
      const conv = await messageService.createConversation(requestId, currentUser.id, theRequest.sender.id);
      
      // Send the opening message as the first message in the direct_messages table
      await messageService.sendMessage(conv.id, theRequest.sender.id, theRequest.openingMessage, true);
      
      loadData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [currentUser, requests, loadData]);

  const declineRequest = useCallback(async (requestId: string) => {
    try {
      await messageService.updateRequestStatus(requestId, 'declined');
      loadData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [loadData]);

  const sendMessageLocal = useCallback(async (conversationId: string, content: string, senderId: string) => {
    try {
      await messageService.sendMessage(conversationId, senderId, content);
      loadData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [loadData]);

  const markConversationReadLocal = useCallback(async (conversationId: string) => {
    if (!currentUser) return;
    const convInfo = conversations.find(c => c.conversationId === conversationId);
    if (!convInfo) return;
    
    // We need to know if the current user is participant_a or participant_b on the db level.
    // Fortunately we can query the row or just figure it out.
    const { data: convData } = await supabase.from('direct_conversations').select('participant_a_id').eq('id', conversationId).single();
    if (!convData) return;

    const unreadField = convData.participant_a_id === currentUser.id ? 'unread_count_a' : 'unread_count_b';
    await messageService.markConversationAsRead(conversationId, unreadField);
    loadData();
  }, [currentUser, conversations, loadData]);

  const removeConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.conversationId !== conversationId));
  }, []);

  return (
    <MessagingContext.Provider value={{
      requests, conversations,
      getPendingRequests, getTotalPendingCount, getTotalDMUnread,
      sendRequest, approveRequest, declineRequest,
      sendMessage: sendMessageLocal, markConversationRead: markConversationReadLocal, hasPendingRequestTo,
      removeConversation,
    }}>
      {children}
    </MessagingContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};
