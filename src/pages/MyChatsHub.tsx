import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatSessions } from '../context/ChatSessionsContext';
import { useMessaging } from '../context/MessagingContext';
import type { MessageRequest } from '../context/MessagingContext';
import { useToast } from '../context/ToastContext';
import type { ViewerChatSession } from '../lib/mockData';
import { BottomSheet } from '../components/ui/BottomSheet';

// --- Shared Types & Helpers ---
export const formatRelativeTime = (ts: string) => {
  const now = Date.now();
  const then = new Date(ts).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const truncate = (str: string, len: number) =>
  str.length > len ? str.slice(0, len) + '…' : str;

// --- Pairing Tab Components ---
// (Mostly original code, refactored into a tab)

const useMockMessagePoller = () => {
  const { sessions, setSessions } = useChatSessions();

  useEffect(() => {
    const activeSessions = sessions.filter(s => s.status === 'active');
    if (activeSessions.length === 0) return;

    const interval = setInterval(() => {
      const randomSession = activeSessions[Math.floor(Math.random() * activeSessions.length)];

      const mockResponses: Record<string, string[]> = {
        session_viewer_001: [
          'Just finished my morning pages ✓',
          'How are you doing today?',
          'Missed yesterday but back on track',
          'Day check-in!',
        ],
        session_viewer_002: [
          'Sent 3 more proposals today',
          'Had a call with a potential client 🤞',
          "How's your outreach going?",
          'Feeling good about this week',
        ],
      };

      const responses = mockResponses[randomSession.sessionId] || ['Check-in!'];
      const content = responses[Math.floor(Math.random() * responses.length)];

      setSessions(prev =>
        prev.map(s =>
          s.sessionId === randomSession.sessionId
            ? {
                ...s,
                unreadCount: s.unreadCount + 1,
                lastMessage: {
                  content,
                  senderId: s.partner.participantId,
                  senderName: s.partner.displayName,
                  timestamp: new Date().toISOString(),
                  type: 'private',
                },
              }
            : s
        )
      );
    }, 45000);

    return () => clearInterval(interval);
  }, [sessions.length, setSessions, sessions]);
};

// ... existing FilterSheet and ActionSheet for Pairing ...
const PairingFilterSheet = ({
  isOpen, onClose, filter, setFilter, sortBy, setSortBy, counts, onMarkAllRead
}: any) => {
  const [localFilter, setLocalFilter] = useState(filter);
  const [localSort, setLocalSort] = useState(sortBy);

  useEffect(() => {
    if (isOpen) {
      setLocalFilter(filter);
      setLocalSort(sortBy);
    }
  }, [isOpen, filter, sortBy]);

  if (!isOpen) return null;

  const handleApply = () => {
    setFilter(localFilter);
    setSortBy(localSort);
    onClose();
  };

  const handleReset = () => {
    setLocalFilter('all');
    setLocalSort('recent');
  };

  const filterOptions = [
    { value: 'all', label: 'All Chats', count: counts.all },
    { value: 'active', label: 'Active Only', count: counts.active },
    { value: 'completed', label: 'Completed', count: counts.completed },
  ];

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'ending', label: 'Challenge End' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-t-[24px] animate-slide-up" style={{ height: '360px' }}>
        <div className="flex flex-col items-center pt-3 pb-2">
          <div className="w-8 h-1 bg-border rounded-full mb-3" />
          <div className="w-full flex items-center justify-between px-4">
            <div className="w-11" />
            <span className="text-[15px] font-[900] text-text">Filter Chats</span>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center text-textMid">✕</button>
          </div>
        </div>

        <div className="px-4 pb-4 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(360px - 60px)' }}>
          {/* Status */}
          <div>
            <span className="text-[11px] font-[800] text-textMid uppercase tracking-widest">Status</span>
            <div className="mt-2 flex flex-col">
              {filterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLocalFilter(opt.value)}
                  className="h-[48px] flex items-center justify-between border-b border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                      style={{ borderColor: localFilter === opt.value ? '#D97757' : '#E6E2D9' }}
                    >
                      {localFilter === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
                    </div>
                    <span className="text-[14px] font-[700] text-text">{opt.label}</span>
                  </div>
                  <span className="text-[13px] text-textMid">({opt.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <span className="text-[11px] font-[800] text-textMid uppercase tracking-widest">Sort By</span>
            <div className="mt-2 flex flex-col">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLocalSort(opt.value)}
                  className="h-[48px] flex items-center gap-3 border-b border-border/50"
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                    style={{ borderColor: localSort === opt.value ? '#D97757' : '#E6E2D9' }}
                  >
                    {localSort === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
                  </div>
                  <span className="text-[14px] font-[700] text-text">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { onMarkAllRead(); onClose(); }}
            className="w-full h-[48px] flex items-center justify-center text-[13px] font-[800] text-error border border-errorBg rounded-[12px] bg-errorBg/50"
          >
            Mark all read
          </button>

          <button
            onClick={handleApply}
            className="w-full h-[48px] rounded-[12px] text-white text-[14px] font-[800] flex items-center justify-center bg-brand hover:bg-brandHover transition-colors"
          >
            Apply
          </button>
          <button onClick={handleReset} className="text-[13px] font-[700] text-textMid text-center pb-2 hover:text-text selection:bg-transparent">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ label, count }: { label: string; count: number }) => (
  <div className="bg-surfaceAlt px-4 py-2 flex items-center justify-between border-b border-border">
    <span className="text-[11px] font-[800] text-textLight uppercase tracking-wide">
      {label}
    </span>
    <span className="text-[11px] font-[600] text-textLight">
      {count} {count === 1 ? 'chat' : 'chats'}
    </span>
  </div>
);

const SessionCard = ({ session, onTap, onLongPress }: { session: ViewerChatSession; onTap: () => void; onLongPress: () => void; }) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const SCROLL_THRESHOLD = 8;

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isLongPress.current = false;
    if ('touches' in e) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      try { navigator.vibrate?.(10); } catch { /* ignore */ }
      onLongPress();
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (dx > SCROLL_THRESHOLD || dy > SCROLL_THRESHOLD) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleClick = () => {
    if (!isLongPress.current) {
      onTap();
    }
  };

  const isCompleted = session.status === 'completed';
  const hasUnread = session.unreadCount > 0;

  const lastMsgPreview = (() => {
    const lm = session.lastMessage;
    if (lm.type === 'broadcast') {
      return `📣 Challenge update`;
    }
    const isOwn = lm.senderId === session.viewerParticipantId;
    const prefix = isOwn ? 'You: ' : (lm.senderName ? `${lm.senderName}: ` : '');
    return `${prefix}${truncate(lm.content, 45)}`;
  })();

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onClick={handleClick}
      className={`relative w-full cursor-pointer select-none flex flex-col transition-colors duration-150 active:bg-surfaceAlt ${isCompleted ? 'bg-surfaceAlt' : 'bg-white'}`}
      style={{ borderBottom: '1px solid #E6E2D9', minHeight: '72px' }}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="flex flex-col items-center justify-center pt-1 shrink-0 w-4">
          {isCompleted ? (
            <div className="text-[12px]">✅</div>
          ) : hasUnread ? (
            <div className="w-2 h-2 rounded-full bg-error" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full border border-brand" />
          )}
        </div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: session.partner.avatarColor || '#E8312A' }}>
             <span className="text-[16px] font-black text-white">{session.partner.initial || session.partner.displayName[0]}</span>
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
          <div className="flex items-center gap-2 overflow-hidden mb-0.5">
            <span className={`text-[15px] truncate leading-tight ${hasUnread ? 'font-[800] text-text' : 'font-[700] text-textMid'} ${isCompleted ? 'text-textLight' : ''}`}>
              {session.partner.displayName}
            </span>
            <span className="px-1.5 py-0.5 bg-surfaceAlt text-textMid text-[10px] font-bold rounded-md whitespace-nowrap overflow-hidden text-ellipsis border border-border">
              {truncate(session.challengeTopic, 15)}
            </span>
          </div>
          <div className={`text-[13px] font-semibold truncate leading-tight ${hasUnread ? 'text-text' : 'text-textMid'}`}>
            {lastMsgPreview}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end w-[48px] h-12 pt-0.5">
          <span className="text-[11px] font-bold text-textLight">
            {formatRelativeTime(session.lastMessage.timestamp)}
          </span>
          {hasUnread && (
            <div className="mt-1.5 flex items-center justify-center rounded-full bg-error min-w-[20px] h-[20px] px-1 shadow-sm">
              <span className="text-[10px] font-black text-white">{session.unreadCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Requests Tab ---
const RequestsTab = ({ onSelectChat }: { onSelectChat?: (id: string, type: 'request') => void }) => {
    const { currentUser } = useAuth();
    const { getPendingRequests, approveRequest, declineRequest } = useMessaging();
    const { showToast } = useToast();
    const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
    const [decliningId, setDecliningId] = useState<string | null>(null);
    
    // We will simulate the "DECLINED" section for visual effect 
    const [declinedLocally, setDeclinedLocally] = useState<MessageRequest[]>([]);
    const [showDeclined, setShowDeclined] = useState(false);

    if (!currentUser) return null;

    const pendingRequests = getPendingRequests(currentUser.id)
        .filter(r => !declinedLocally.find(d => d.requestId === r.requestId))
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    const handleApprove = (req: MessageRequest) => {
        // Build currentUser profile for the conversation
        approveRequest(req.requestId, {
            id: currentUser.id,
            name: currentUser.name,
            username: currentUser.username,
            initial: currentUser.initial || 'U',
            avatarColor: currentUser.avatarColor || '#2563EB',
            isCreator: currentUser.isCreator,
        });
        showToast(`Chat started with ${req.sender.name}`, 'success');
        if (onSelectChat) {
             // The new conversation id isn't explicitly returned here without a slight tweak,
             // but we will route to /chats and let the user click it, or just do nothing on desktop.
        }
    };

    const handleDecline = (req: MessageRequest) => {
        declineRequest(req.requestId);
        setDeclinedLocally(prev => [req, ...prev]);
        showToast(`Request declined`, 'info');
    };

    return (
        <div className="flex-1 overflow-y-auto bg-bg relative">
            {pendingRequests.length === 0 && declinedLocally.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-4" style={{ paddingTop: '80px' }}>
                    <span className="text-[48px] mb-4 opacity-50">📫</span>
                    <h3 className="text-[18px] font-black text-text mt-3">No message requests</h3>
                    <p className="text-[14px] font-semibold text-textMid mt-2 max-w-[280px]">
                        When someone wants to message you, their request will appear here for your approval.
                    </p>
                </div>
            ) : (
                <div className="px-4 py-4 max-w-[800px] mx-auto w-full flex flex-col gap-4">
                    {/* Mark all read button top right */}
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[14px] font-black text-text">Pending Approvals</span>
                        {pendingRequests.length > 0 && (
                            <button className="text-[12px] font-bold text-brand hover:underline">
                                Mark all read
                            </button>
                        )}
                    </div>

                    {pendingRequests.map(req => {
                        const isExpanded = expandedRequest === req.requestId;
                        const requiresExpand = req.openingMessage.length > 120;
                        const isDeclining = decliningId === req.requestId;

                        return (
                            <div key={req.requestId} className="bg-white rounded-[16px] border-l-4 border-l-warning border border-border shadow-sm p-4 relative overflow-hidden transition-all">
                                <span className="absolute top-4 right-4 text-[11px] font-bold text-textLight">{formatRelativeTime(req.sentAt)}</span>
                                
                                <div className="flex items-center gap-3 mb-3 pr-16">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-[14px] shrink-0" style={{ backgroundColor: req.sender.avatarColor }}>
                                        {req.sender.initial}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-black text-text flex items-center gap-1">
                                            {req.sender.name}
                                            {req.sender.isCreator && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#2563EB">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                                </svg>
                                            )}
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[11px] font-bold text-textMid bg-surfaceAlt px-1.5 py-0.5 rounded-[4px] flex items-center gap-1">
                                                <span className="text-success text-[10px]">★</span> {req.sender.trustScore} Trust Score
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-surfaceAlt rounded-[12px] p-3 mb-4">
                                    <p className="text-[13px] font-semibold text-text leading-relaxed">
                                        {isExpanded || !requiresExpand ? req.openingMessage : `${req.openingMessage.slice(0, 120)}...`}
                                        {requiresExpand && !isExpanded && (
                                            <button onClick={() => setExpandedRequest(req.requestId)} className="text-brand font-bold ml-1 hover:underline text-[12px]">Read more</button>
                                        )}
                                        {isExpanded && (
                                            <button onClick={() => setExpandedRequest(null)} className="text-textLight font-bold ml-1 hover:underline text-[12px]">Show less</button>
                                        )}
                                    </p>
                                </div>

                                {isDeclining ? (
                                    <div className="flex flex-col gap-2 animate-fadeIn">
                                        <span className="text-[12px] font-bold text-text text-center mb-1">Decline this request?</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleDecline(req)} className="flex-1 h-10 bg-error text-white font-bold text-[13px] rounded-[10px]">
                                                Yes, Decline
                                            </button>
                                            <button onClick={() => setDecliningId(null)} className="flex-1 h-10 bg-surfaceAlt text-text font-bold text-[13px] rounded-[10px]">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleApprove(req)} className="flex-1 h-10 bg-brand hover:bg-brandHover text-white font-black text-[13px] rounded-[10px] transition-colors">
                                            Accept
                                        </button>
                                        <button onClick={() => setDecliningId(req.requestId)} className="flex-1 h-10 bg-white border border-border text-text font-black text-[13px] rounded-[10px] hover:bg-surfaceAlt transition-colors">
                                            Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {declinedLocally.length > 0 && (
                        <div className="mt-6 border-t border-border pt-4">
                            <button 
                                onClick={() => setShowDeclined(!showDeclined)}
                                className="w-full flex justify-between items-center text-[13px] font-bold text-textMid hover:text-text transition-colors"
                            >
                                <span>Declined Requests ({declinedLocally.length})</span>
                                <span>{showDeclined ? '▲' : '▼'}</span>
                            </button>
                            
                            {showDeclined && (
                                <div className="mt-4 flex flex-col gap-3 animate-slide-up">
                                    {declinedLocally.map(req => (
                                        <div key={req.requestId} className="opacity-60 bg-white rounded-[12px] border border-border p-3 flex justify-between items-center">
                                             <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-[12px] shrink-0" style={{ backgroundColor: req.sender.avatarColor }}>
                                                    {req.sender.initial}
                                                </div>
                                                <span className="text-[13px] font-bold text-text">{req.sender.name}</span>
                                             </div>
                                             <span className="text-[11px] font-bold text-error bg-errorBg px-2 py-0.5 rounded-full">Declined</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Chats Tab (Direct Messages) ---
const ChatsTab = ({ activeChatId, onSelectChat }: { activeChatId?: string, onSelectChat?: (id: string, type: 'dm') => void }) => {
    const { currentUser } = useAuth();
    const { conversations } = useMessaging();
    const navigate = useNavigate();

    if (!currentUser) return null;

    const sortedConversations = [...conversations].sort((a, b) => 
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );

    return (
        <div className="flex-1 overflow-y-auto bg-bg">
            {sortedConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-4" style={{ paddingTop: '80px' }}>
                    <span className="text-[48px] mb-4 opacity-50">💬</span>
                    <h3 className="text-[18px] font-black text-text mt-3">No direct messages</h3>
                    <p className="text-[14px] font-semibold text-textMid mt-2 max-w-[280px]">
                        Start a conversation with a creator or wait for someone to message you.
                    </p>
                    <button
                        onClick={() => navigate('/explore')}
                        className="mt-6 h-11 px-6 bg-brand text-white font-black text-[14px] rounded-[14px] hover:bg-brandHover transition-colors flex items-center justify-center"
                    >
                        Find someone to message →
                    </button>
                </div>
            ) : (
                <div className="flex flex-col">
                    {sortedConversations.map(conv => {
                        const isUnread = conv.unreadCount > 0;
                        const partner = conv.participants.find(p => p.id !== currentUser.id);
                        if (!partner) return null;

                        const isOwnLastMsg = conv.lastMessage.senderId === currentUser.id;
                        const lastMsgPreview = isOwnLastMsg 
                            ? `You: ${truncate(conv.lastMessage.content, 40)}`
                            : truncate(conv.lastMessage.content, 45);

                        return (
                            <div
                                key={conv.conversationId}
                                onClick={() => {
                                    if (onSelectChat) {
                                        onSelectChat(conv.conversationId, 'dm');
                                    } else {
                                        navigate(`/messages/${conv.conversationId}`);
                                    }
                                }}
                                className={`relative w-full cursor-pointer select-none flex flex-col transition-colors duration-150 py-3.5 px-4 bg-white hover:bg-surfaceAlt active:bg-border
                                    ${activeChatId === conv.conversationId ? 'bg-brandTint border-l-4 border-l-brand' : 'border-b border-border'}
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center justify-center pt-1 shrink-0 w-3 -ml-1">
                                        {isUnread && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                                        )}
                                    </div>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: partner.avatarColor }}>
                                        <span className="text-[16px] font-black text-white">{partner.initial}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className={`text-[15px] truncate leading-tight ${isUnread ? 'font-black text-text' : 'font-extrabold text-text'}`}>
                                                {partner.name}
                                            </span>
                                            {partner.isCreator && (
                                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-black uppercase rounded-sm whitespace-nowrap">
                                                    Creator
                                                </span>
                                            )}
                                        </div>
                                        <div className={`text-[13px] font-semibold truncate leading-tight ${isUnread ? 'text-text' : 'text-textMid'}`}>
                                            {lastMsgPreview}
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end w-[48px] h-12 pt-0.5">
                                        <span className={`text-[11px] font-bold ${isUnread ? 'text-brand' : 'text-textLight'}`}>
                                            {formatRelativeTime(conv.lastMessage.timestamp)}
                                        </span>
                                        {isUnread && (
                                            <div className="mt-1.5 flex items-center justify-center rounded-full bg-brand min-w-[20px] h-[20px] px-1 shadow-sm">
                                                <span className="text-[10px] font-black text-white">{conv.unreadCount}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Left Panel Sidebar Export for Desktop Layout ---
export const MessagesSidebar = ({ 
    activeTab, 
    setActiveTab, 
    activeChatId, 
    onSelectChat 
}: { 
    activeTab: 'chats' | 'requests' | 'pairing'; 
    setActiveTab: (tab: 'chats' | 'requests' | 'pairing') => void;
    activeChatId?: string;
    onSelectChat?: (id: string, type: 'dm' | 'pairing') => void;
}) => {
    const { currentUser } = useAuth();
    const { sessions, markSessionRead, getTotalUnread } = useChatSessions();
    const { getTotalDMUnread, getTotalPendingCount } = useMessaging();
    const navigate = useNavigate();
    
    // Pairing specific
    const [filter, setFilter] = useState('active');
    const [sortBy, setSortBy] = useState('recent');
    const [showFilter, setShowFilter] = useState(false);
    const [showActionSheet, setShowActionSheet] = useState(false);

    useMockMessagePoller();

    const dmUnread = currentUser ? getTotalDMUnread(currentUser.id) : 0;
    const pendingCount = currentUser ? getTotalPendingCount(currentUser.id) : 0;
    const pairingUnread = getTotalUnread();

    const markAllReadPairing = useCallback(() => {
        sessions.forEach(s => markSessionRead(s.sessionId));
    }, [sessions, markSessionRead]);

    return (
        <div className="flex flex-col h-full w-full bg-white border-r border-border/60">
            {/* Header */}
            <header className="shrink-0 flex items-center justify-between px-4 h-[58px] bg-white border-b border-border">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-1 shrink-0 text-textMid hover:text-text transition-colors"
                >
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M14 5L8 11L14 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[14px] font-bold">Back</span>
                </button>

                <div className="flex items-center min-w-[44px] justify-end">
                    {activeTab === 'chats' && (
                        <button className="w-10 h-10 flex items-center justify-center text-textMid hover:text-text">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                        </button>
                    )}
                    {activeTab === 'pairing' && (
                        <button onClick={() => setShowFilter(true)} className="w-10 h-10 flex items-center justify-center text-textMid hover:text-text">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                        </button>
                    )}
                </div>
            </header>

            {/* Tabs */}
            <div className="flex items-center px-2 bg-white border-b border-border shrink-0">
                <button 
                    onClick={() => setActiveTab('chats')} 
                    className={`flex-1 h-12 flex items-center justify-center text-[13px] font-black relative transition-colors ${activeTab === 'chats' ? 'text-brand' : 'text-textLight hover:text-textMid'}`}
                >
                    Chats
                    {dmUnread > 0 && <div className="ml-1.5 w-5 h-5 rounded-full bg-brand text-white text-[10px] flex items-center justify-center">{dmUnread}</div>}
                    {activeTab === 'chats' && <div className="absolute bottom-0 left-4 right-4 h-[3px] rounded-t-full bg-brand" />}
                </button>
                <button 
                    onClick={() => setActiveTab('requests')} 
                    className={`flex-1 h-12 flex items-center justify-center text-[13px] font-black relative transition-colors ${activeTab === 'requests' ? 'text-brand' : 'text-textLight hover:text-textMid'}`}
                >
                    Requests
                    {pendingCount > 0 && <div className="ml-1.5 w-5 h-5 rounded-full bg-warning text-white text-[10px] flex items-center justify-center">{pendingCount}</div>}
                    {activeTab === 'requests' && <div className="absolute bottom-0 left-4 right-4 h-[3px] rounded-t-full bg-brand" />}
                </button>
                <button 
                    onClick={() => setActiveTab('pairing')} 
                    className={`flex-1 h-12 flex items-center justify-center text-[13px] font-black relative transition-colors ${activeTab === 'pairing' ? 'text-brand' : 'text-textLight hover:text-textMid'}`}
                >
                    Pairing
                    {pairingUnread > 0 && <div className="ml-1.5 w-5 h-5 rounded-full bg-brand text-white text-[10px] flex items-center justify-center">{pairingUnread}</div>}
                    {activeTab === 'pairing' && <div className="absolute bottom-0 left-4 right-4 h-[3px] rounded-t-full bg-brand" />}
                </button>
            </div>

            {/* Tab content wrapper */}
            <div className="flex-1 overflow-hidden flex flex-col relative w-full h-full bg-bg">
                {activeTab === 'chats' && <ChatsTab activeChatId={activeChatId} onSelectChat={onSelectChat} />}
                {activeTab === 'requests' && <RequestsTab />}
                {activeTab === 'pairing' && (
                    <div className="flex-1 overflow-y-auto w-full">
                        {/* Summary Strip */}
                        <div className="bg-white px-4 py-3 flex items-center gap-4 border-b border-border">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-black text-brand">{sessions.filter(s => s.status === 'active').length}</span>
                                <span className="text-[12px] font-bold text-textMid">active</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[13px] font-black ${pairingUnread > 0 ? 'text-error' : 'text-text'}`}>{pairingUnread}</span>
                                <span className="text-[12px] font-bold text-textMid">unread</span>
                            </div>
                        </div>

                        {pairingUnread === 0 && sessions.filter(s => s.status === 'active').length > 0 && (
                            <div className="flex items-center justify-center h-8 bg-successBg animate-fadeIn">
                                <span className="text-[11px] font-bold text-success">All caught up ✓</span>
                            </div>
                        )}

                        {sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center px-4 pt-20">
                                <span className="text-[40px] mb-3 opacity-50">🤝</span>
                                <h3 className="text-[16px] font-black text-text">No pairing chats</h3>
                                <p className="text-[13px] font-semibold text-textMid mt-2 max-w-[240px]">
                                    Join an accountability challenge and get paired.
                                </p>
                            </div>
                        ) : (
                            <div>
                                {(() => {
                                    const filteredSessions = sessions.filter(s => {
                                        if (filter === 'active') return s.status === 'active';
                                        if (filter === 'completed') return s.status === 'completed';
                                        return true;
                                    });
                                    const sortedSessions = [...filteredSessions].sort((a, b) => 
                                        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
                                    );

                                    if (filter === 'all') {
                                        const active = sortedSessions.filter(s => s.status === 'active');
                                        const comp = sortedSessions.filter(s => s.status === 'completed');
                                        
                                        return (
                                            <>
                                                {active.length > 0 && (
                                                    <>
                                                        <SectionHeader label="Active" count={active.length} />
                                                        {active.map(s => (
                                                            <SessionCard key={s.sessionId} session={s} onTap={() => onSelectChat ? onSelectChat(s.sessionId, 'pairing') : navigate(`/chats/${s.sessionId}`)} onLongPress={() => setShowActionSheet(true)} />
                                                        ))}
                                                    </>
                                                )}
                                                {comp.length > 0 && (
                                                    <>
                                                        <SectionHeader label="Completed" count={comp.length} />
                                                        {comp.map(s => (
                                                            <SessionCard key={s.sessionId} session={s} onTap={() => onSelectChat ? onSelectChat(s.sessionId, 'pairing') : navigate(`/chats/${s.sessionId}`)} onLongPress={() => setShowActionSheet(true)} />
                                                        ))}
                                                    </>
                                                )}
                                            </>
                                        );
                                    }

                                    return sortedSessions.map(s => (
                                        <SessionCard key={s.sessionId} session={s} onTap={() => onSelectChat ? onSelectChat(s.sessionId, 'pairing') : navigate(`/chats/${s.sessionId}`)} onLongPress={() => setShowActionSheet(true)} />
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals for Pairing */}
            <PairingFilterSheet
                isOpen={showFilter}
                onClose={() => setShowFilter(false)}
                filter={filter}
                setFilter={setFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                counts={{
                    all: sessions.length,
                    active: sessions.filter(s => s.status === 'active').length,
                    completed: sessions.filter(s => s.status === 'completed').length,
                }}
                onMarkAllRead={markAllReadPairing}
            />

            {/* Mock action sheet just to prevent errors, actual action sheet handling in pairing tab... */}
            <BottomSheet isOpen={showActionSheet} onClose={() => setShowActionSheet(false)} title="Options">
                 <div className="flex flex-col gap-2 p-2">
                     <button className="h-12 bg-surfaceAlt rounded-[12px] font-black" onClick={() => setShowActionSheet(false)}>Close</button>
                 </div>
            </BottomSheet>
        </div>
    );
};

// --- Main Page (Layout Wrapper) ---
// This handles the Desktop Two-Panel Layout
export const MyChatsHub = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'pairing'>('chats');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/?redirect=/chats', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  // Render the two-panel layout on desktop, or just the list on mobile
  if (isDesktop) {
      return (
          <div className="w-full flex bg-bg overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
              <div className="w-[380px] flex flex-col shrink-0 border-r border-border z-10 overflow-hidden">
                  <MessagesSidebar 
                      activeTab={activeTab} 
                      setActiveTab={setActiveTab} 
                      onSelectChat={(id, type) => {
                          if (type === 'dm') navigate(`/messages/${id}`);
                          if (type === 'pairing') navigate(`/chats/${id}`);
                      }}
                  />
              </div>
              <div className="flex-1 max-w-full min-w-0 bg-bg flex flex-col">
                  {/* Right panel header — matches sidebar header height */}
                  <header className="shrink-0 h-[58px] bg-white border-b border-border flex items-center px-6">
                      <span className="text-[15px] font-bold text-textMid">
                          {activeTab === 'chats' && 'Direct Messages'}
                          {activeTab === 'requests' && 'Message Requests'}
                          {activeTab === 'pairing' && 'Accountability Pairing'}
                      </span>
                  </header>
                  {/* Empty state when no chat is selected */}
                  <div className="flex-1 flex items-center justify-center">
                      <div className="flex flex-col items-center justify-center text-center opacity-60">
                          <div className="w-20 h-20 rounded-full bg-surfaceAlt flex items-center justify-center text-[32px] text-textLight mb-6">
                             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                             </svg>
                          </div>
                          <h3 className="text-[24px] font-black text-text mb-2 tracking-tight">Your Messages</h3>
                          <p className="text-[15px] font-bold text-textMid max-w-[300px]">
                              Select a conversation from the sidebar to start chatting.
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // Mobile layout - just the sidebar taking up the whole screen
  return (
      <div className="h-screen w-full flex flex-col bg-bg overflow-hidden pb-[64px]"> {/* bottom nav buffer */}
         <MessagesSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
  );
};
