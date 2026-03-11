import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

// --- Types ---
export interface MessageSender {
  id: string;
  name: string;
  username: string;
  initial: string;
  avatarColor: string;
  trustScore: number;
  isCreator: boolean;
  joinedDate: string;
  bio?: string;
  socialHandles?: Record<string, string | null>;
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
  bio?: string;
  trustScore?: number;
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

// --- Mock Data ---
export const mockMessageRequests: MessageRequest[] = [
  {
    requestId: "req_001",
    status: "pending",
    sender: {
      id: "user_viewer_001",
      name: "Rahul Sharma",
      username: "rahulsharma",
      initial: "R",
      avatarColor: "#2563EB",
      trustScore: 82,
      isCreator: false,
      joinedDate: "2024-06-15",
    },
    recipientId: "creator_001",
    openingMessage: "Hey James! I have been following your productivity content for months. Your time-blocking framework completely changed how I work. I wanted to ask you about how you handle deep work sessions when you have a lot of meetings in a day.",
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    respondedAt: null,
  },
  {
    requestId: "req_002",
    status: "pending",
    sender: {
      id: "user_viewer_002",
      name: "Preethi Nair",
      username: "preethinks",
      initial: "P",
      avatarColor: "#166534",
      trustScore: 91,
      isCreator: true,
      joinedDate: "2024-03-20",
    },
    recipientId: "creator_001",
    openingMessage: "Hi James, I am a fellow creator in the productivity space. I run a newsletter on focus and deep work for remote workers. Would love to explore a collaboration or content swap if you are open to it.",
    sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    respondedAt: null,
  },
  {
    requestId: "req_003",
    status: "approved",
    sender: {
      id: "user_viewer_003",
      name: "Karan Dev",
      username: "karandev",
      initial: "K",
      avatarColor: "#6366F1",
      trustScore: 76,
      isCreator: false,
      joinedDate: "2024-08-01",
    },
    recipientId: "creator_001",
    openingMessage: "James! Quick question about your Notion setup from the last video. Do you use a separate workspace for personal vs work or keep everything in one?",
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockDirectConversations: DirectConversation[] = [
  {
    conversationId: "dm_001",
    requestId: "req_003",
    participants: [
      {
        id: "creator_001",
        name: "James Productivity",
        username: "jamesproductivity",
        initial: "J",
        avatarColor: "#E8312A",
        isCreator: true,
        bio: "I help people build better systems for work and life.",
        trustScore: 95,
        joinedDate: "2024-01-15",
      },
      {
        id: "user_viewer_003",
        name: "Karan Dev",
        username: "karandev",
        initial: "K",
        avatarColor: "#6366F1",
        isCreator: false,
        bio: "Developer & productivity enthusiast.",
        trustScore: 76,
        joinedDate: "2024-08-01",
      }
    ],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: {
      content: "Yeah I keep everything in one workspace. Databases with filtered views do the heavy lifting.",
      senderId: "creator_001",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    unreadCount: 1,
    messages: [
      {
        messageId: "dm_msg_001",
        senderId: "user_viewer_003",
        content: "James! Quick question about your Notion setup from the last video. Do you use a separate workspace for personal vs work or keep everything in one?",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: "text",
        isOpeningMessage: true,
      },
      {
        messageId: "dm_msg_002",
        senderId: "creator_001",
        content: "Great question! Yeah I keep everything in one workspace. Databases with filtered views do the heavy lifting.",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        type: "text",
      }
    ]
  }
];

// --- Context ---
interface MessagingContextType {
  requests: MessageRequest[];
  conversations: DirectConversation[];
  getPendingRequests: (userId: string) => MessageRequest[];
  getTotalPendingCount: (userId: string) => number;
  getTotalDMUnread: (userId: string) => number;
  sendRequest: (recipientId: string, openingMessage: string, sender: MessageSender) => string;
  approveRequest: (requestId: string, currentUserProfile: DMParticipant) => void;
  declineRequest: (requestId: string) => void;
  sendMessage: (conversationId: string, content: string, senderId: string) => void;
  markConversationRead: (conversationId: string) => void;
  hasPendingRequestTo: (senderId: string, recipientId: string) => boolean;
  removeConversation: (conversationId: string) => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<MessageRequest[]>(mockMessageRequests);
  const [conversations, setConversations] = useState<DirectConversation[]>(mockDirectConversations);

  const getPendingRequests = useCallback((userId: string) =>
    requests.filter(r => r.recipientId === userId && r.status === 'pending'),
    [requests]
  );

  const getTotalPendingCount = useCallback((userId: string) =>
    requests.filter(r => r.recipientId === userId && r.status === 'pending').length,
    [requests]
  );

  const getTotalDMUnread = useCallback((userId: string) =>
    conversations
      .filter(c => c.participants.some(p => p.id === userId))
      .reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  );

  const hasPendingRequestTo = useCallback((senderId: string, recipientId: string) =>
    requests.some(r => r.sender.id === senderId && r.recipientId === recipientId && r.status === 'pending'),
    [requests]
  );

  const sendRequest = useCallback((recipientId: string, openingMessage: string, sender: MessageSender) => {
    const newRequest: MessageRequest = {
      requestId: `req_${Date.now()}`,
      status: 'pending',
      sender,
      recipientId,
      openingMessage,
      sentAt: new Date().toISOString(),
      respondedAt: null,
    };
    setRequests(prev => [newRequest, ...prev]);
    return newRequest.requestId;
  }, []);

  const approveRequest = useCallback((requestId: string, currentUserProfile: DMParticipant) => {
    let theRequest: MessageRequest | undefined;
    setRequests(prev => prev.map(r => {
      if (r.requestId === requestId) {
        theRequest = r;
        return { ...r, status: 'approved' as const, respondedAt: new Date().toISOString() };
      }
      return r;
    }));

    if (theRequest) {
      const req = theRequest;
      const newConversation: DirectConversation = {
        conversationId: `dm_${Date.now()}`,
        requestId,
        participants: [
          currentUserProfile,
          {
            id: req.sender.id,
            name: req.sender.name,
            username: req.sender.username,
            initial: req.sender.initial,
            avatarColor: req.sender.avatarColor,
            isCreator: req.sender.isCreator,
            trustScore: req.sender.trustScore,
            joinedDate: req.sender.joinedDate,
          },
        ],
        createdAt: new Date().toISOString(),
        lastMessage: {
          content: req.openingMessage,
          senderId: req.sender.id,
          timestamp: req.sentAt,
        },
        unreadCount: 0,
        messages: [{
          messageId: `dm_msg_${Date.now()}`,
          senderId: req.sender.id,
          content: req.openingMessage,
          timestamp: req.sentAt,
          type: 'text',
          isOpeningMessage: true,
        }]
      };
      setConversations(prev => [newConversation, ...prev]);
    }
  }, []);

  const declineRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.map(r =>
      r.requestId === requestId
        ? { ...r, status: 'declined' as const, respondedAt: new Date().toISOString() }
        : r
    ));
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string, senderId: string) => {
    const newMessage: DMMessage = {
      messageId: `dm_msg_${Date.now()}`,
      senderId,
      content,
      timestamp: new Date().toISOString(),
      type: 'text',
    };
    setConversations(prev => prev.map(c =>
      c.conversationId === conversationId
        ? {
          ...c,
          messages: [...c.messages, newMessage],
          lastMessage: { content, senderId, timestamp: newMessage.timestamp }
        }
        : c
    ));
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(c =>
      c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
    ));
  }, []);

  const removeConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.conversationId !== conversationId));
  }, []);

  return (
    <MessagingContext.Provider value={{
      requests, conversations,
      getPendingRequests, getTotalPendingCount, getTotalDMUnread,
      sendRequest, approveRequest, declineRequest,
      sendMessage, markConversationRead, hasPendingRequestTo,
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
