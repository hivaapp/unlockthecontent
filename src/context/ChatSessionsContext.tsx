import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { mockViewerChatSessions } from '../lib/mockData';
import type { ViewerChatSession } from '../lib/mockData';

interface ChatSessionsContextType {
  sessions: ViewerChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ViewerChatSession[]>>;
  markSessionRead: (sessionId: string) => void;
  markAllRead: () => void;
  getTotalUnread: () => number;
  addNewSession: (sessionData: ViewerChatSession) => void;
  removeSession: (sessionId: string) => void;
}

const ChatSessionsContext = createContext<ChatSessionsContextType | undefined>(undefined);

export const ChatSessionsProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<ViewerChatSession[]>(mockViewerChatSessions);

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

  return (
    <ChatSessionsContext.Provider
      value={{ sessions, setSessions, markSessionRead, markAllRead, getTotalUnread, addNewSession, removeSession }}
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
