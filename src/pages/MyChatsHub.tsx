import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatSessions } from '../context/ChatSessionsContext';
import type { ViewerChatSession } from '../lib/mockData';

// --- Helpers ---
const formatRelativeTime = (ts: string) => {
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

const truncate = (str: string, len: number) =>
  str.length > len ? str.slice(0, len) + '…' : str;

// --- Mock Message Poller Hook ---
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions.length]);
};

// --- Filter Bottom Sheet ---
const FilterSheet = ({
  isOpen,
  onClose,
  filter,
  setFilter,
  sortBy,
  setSortBy,
  counts,
}: {
  isOpen: boolean;
  onClose: () => void;
  filter: string;
  setFilter: (f: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  counts: { all: number; active: number; completed: number };
}) => {
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
      <div className="relative bg-white rounded-t-[24px] animate-slide-up" style={{ height: '320px' }}>
        <div className="flex flex-col items-center pt-3 pb-2">
          <div className="w-8 h-1 bg-[#E8E8E8] rounded-full mb-3" />
          <div className="w-full flex items-center justify-between px-4">
            <div className="w-11" />
            <span className="text-[15px] font-[900] text-[#111]">Filter Chats</span>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center text-[#888]">✕</button>
          </div>
        </div>

        <div className="px-4 pb-4 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(320px - 60px)' }}>
          {/* Status */}
          <div>
            <span className="text-[11px] font-[800] text-[#888] uppercase tracking-widest">Status</span>
            <div className="mt-2 flex flex-col">
              {filterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLocalFilter(opt.value)}
                  className="h-[48px] flex items-center justify-between"
                  style={{ borderBottom: '1px solid #F4F4F4' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: localFilter === opt.value ? '#B45309' : '#DDD' }}
                    >
                      {localFilter === opt.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
                      )}
                    </div>
                    <span className="text-[14px] font-[700] text-[#333]">{opt.label}</span>
                  </div>
                  <span className="text-[13px] text-[#888]">({opt.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <span className="text-[11px] font-[800] text-[#888] uppercase tracking-widest">Sort By</span>
            <div className="mt-2 flex flex-col">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLocalSort(opt.value)}
                  className="h-[48px] flex items-center gap-3"
                  style={{ borderBottom: '1px solid #F4F4F4' }}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: localSort === opt.value ? '#B45309' : '#DDD' }}
                  >
                    {localSort === opt.value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
                    )}
                  </div>
                  <span className="text-[14px] font-[700] text-[#333]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleApply}
            className="w-full h-[48px] rounded-[12px] text-white text-[14px] font-[800] flex items-center justify-center"
            style={{ backgroundColor: '#B45309' }}
          >
            Apply
          </button>
          <button onClick={handleReset} className="text-[13px] font-[700] text-[#888] text-center pb-2">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Long Press Action Sheet ---
const ActionSheet = ({
  isOpen,
  onClose,
  session,
  onOpenChat,
  onViewChallenge,
  onMarkRead,
  onLeave,
  onRate,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  session: ViewerChatSession | null;
  onOpenChat: () => void;
  onViewChallenge: () => void;
  onMarkRead: () => void;
  onLeave: () => void;
  onRate: () => void;
  onDelete: () => void;
}) => {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setShowLeaveConfirm(false);
      setShowDeleteConfirm(false);
      setShowRating(false);
      setRating(0);
    }
  }, [isOpen]);

  if (!isOpen || !session) return null;

  if (showRating) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-t-[24px] p-6 animate-slide-up">
          <div className="w-8 h-1 bg-[#E8E8E8] rounded-full mx-auto mb-4" />
          <h3 className="text-[15px] font-[900] text-[#111] text-center mb-4">Rate This Challenge</h3>
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)} className="p-1">
                <svg width="32" height="32" viewBox="0 0 24 24" fill={star <= rating ? '#B45309' : 'none'} stroke={star <= rating ? '#B45309' : '#DDD'} strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
          <textarea
            placeholder="Any comments? (optional)"
            className="w-full h-[80px] rounded-[12px] p-3 text-[13px] font-[600] resize-none"
            style={{ border: '1.5px solid #E8E8E8', outline: 'none' }}
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { onRate(); onClose(); }}
              className="flex-1 h-[44px] rounded-[12px] text-white text-[14px] font-[800]"
              style={{ backgroundColor: '#B45309', opacity: rating > 0 ? 1 : 0.4 }}
              disabled={rating === 0}
            >
              Submit
            </button>
            <button
              onClick={() => setShowRating(false)}
              className="flex-1 h-[44px] rounded-[12px] bg-[#F0F0F0] text-[#555] text-[14px] font-[800]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showLeaveConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-t-[24px] p-6 animate-slide-up">
          <div className="w-8 h-1 bg-[#E8E8E8] rounded-full mx-auto mb-4" />
          <p className="text-[15px] font-[700] text-[#111] text-center mb-6">
            Are you sure? Your partner will be notified.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { onLeave(); onClose(); }}
              className="flex-1 h-[44px] rounded-[12px] bg-[#E8312A] text-white text-[14px] font-[800]"
            >
              Leave
            </button>
            <button
              onClick={() => setShowLeaveConfirm(false)}
              className="flex-1 h-[44px] rounded-[12px] bg-[#F0F0F0] text-[#555] text-[14px] font-[800]"
            >
              Stay
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-t-[24px] p-6 animate-slide-up">
          <div className="w-8 h-1 bg-[#E8E8E8] rounded-full mx-auto mb-4" />
          <p className="text-[15px] font-[700] text-[#111] text-center mb-2">
            Remove this chat from your list?
          </p>
          <p className="text-[13px] font-[600] text-[#888] text-center mb-6">
            Your message history will be cleared from this device.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="flex-1 h-[44px] rounded-[12px] bg-[#E8312A] text-white text-[14px] font-[800]"
            >
              Remove
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 h-[44px] rounded-[12px] bg-[#F0F0F0] text-[#555] text-[14px] font-[800]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = session.status === 'active';
  const isCompleted = session.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-t-[24px] animate-slide-up pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col items-center pt-3 pb-2">
          <div className="w-8 h-1 bg-[#E8E8E8] rounded-full mb-3" />
        </div>
        {/* Header */}
        <div className="px-4 pb-3" style={{ borderBottom: '1px solid #F4F4F4' }}>
          <span className="text-[15px] font-[800] text-[#111]">{session.partner.displayName}</span>
          <span className="text-[12px] font-[600] text-[#888] ml-2">{truncate(session.challengeTopic, 25)}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col">
          <button onClick={() => { onOpenChat(); onClose(); }} className="h-[52px] flex items-center px-4 hover:bg-[#FAFAFA] active:bg-[#F4F4F4]" style={{ borderBottom: '1px solid #F4F4F4' }}>
            <span className="text-[15px] font-[700] text-[#111]">Open Chat →</span>
          </button>
          <button onClick={() => { onViewChallenge(); onClose(); }} className="h-[52px] flex items-center px-4 hover:bg-[#FAFAFA] active:bg-[#F4F4F4]" style={{ borderBottom: '1px solid #F4F4F4' }}>
            <span className="text-[15px] font-[700] text-[#111]">View Challenge Details</span>
          </button>

          {isActive && (
            <>
              <button onClick={() => { onMarkRead(); onClose(); }} className="h-[52px] flex items-center px-4 hover:bg-[#FAFAFA] active:bg-[#F4F4F4]" style={{ borderBottom: '1px solid #F4F4F4' }}>
                <span className="text-[15px] font-[700] text-[#111]">Mark All Read</span>
              </button>
              <button onClick={() => setShowLeaveConfirm(true)} className="h-[52px] flex items-center px-4 hover:bg-[#FAFAFA] active:bg-[#F4F4F4]">
                <span className="text-[15px] font-[700] text-[#E8312A]">Leave Challenge</span>
              </button>
            </>
          )}

          {isCompleted && (
            <button onClick={() => setShowRating(true)} className="h-[52px] flex items-center px-4 hover:bg-[#FAFAFA] active:bg-[#F4F4F4]">
              <span className="text-[15px] font-[700] text-[#111]">Rate This Challenge</span>
            </button>
          )}

          {(session.status === 'expired' || session.status === 'partner_left') && (
            <button onClick={() => setShowDeleteConfirm(true)} className="h-[52px] flex items-center px-4 hover:bg-[#FAFAFA] active:bg-[#F4F4F4]">
              <span className="text-[15px] font-[700] text-[#E8312A]">Delete</span>
            </button>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
};

// --- Session Card ---
const SessionCard = ({
  session,
  onTap,
  onLongPress,
}: {
  session: ViewerChatSession;
  onTap: () => void;
  onLongPress: () => void;
}) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handleTouchStart = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      try { navigator.vibrate?.(10); } catch { /* ignore */ }
      onLongPress();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!isLongPress.current) onTap();
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const isActive = session.status === 'active';
  const isCompleted = session.status === 'completed';
  const isExpiredOrLeft = session.status === 'expired' || session.status === 'partner_left';
  const hasUnread = session.unreadCount > 0;

  const progressPercent = (session.daysElapsed / session.daysTotal) * 100;

  const lastMsgPreview = (() => {
    const lm = session.lastMessage;
    if (lm.type === 'broadcast') {
      return { text: `📣 Challenge update from ${session.creator.name}`, color: '#92400E', italic: true, prefix: '' };
    }
    const isOwn = lm.senderId === session.viewerParticipantId;
    if (isCompleted || isExpiredOrLeft) {
      return { text: truncate(lm.content, 45), color: '#AAAAAA', italic: false, prefix: isOwn ? 'You: ' : '' };
    }
    if (isOwn) {
      return { text: truncate(lm.content, 45), color: '#888', italic: false, prefix: 'You: ' };
    }
    return { text: truncate(lm.content, 45), color: '#555', italic: false, prefix: '' };
  })();

  // Badge
  const badge = (() => {
    if (session.unreadCount > 0) {
      return { count: session.unreadCount, bg: '#E8312A' };
    }
    if (session.unreadBroadcasts > 0) {
      return { count: session.unreadBroadcasts, bg: '#B45309' };
    }
    return null;
  })();

  // Status pill
  const statusPill = (() => {
    if (isCompleted) {
      return { text: '✅ Completed', bg: '#EDFAF3', color: '#166534' };
    }
    if (session.status === 'partner_left') {
      return { text: '👤 Partner left', bg: 'transparent', color: '#E8312A', border: '1px solid #E8312A' };
    }
    if (session.status === 'expired') {
      return { text: '⏰ Expired', bg: '#F6F6F6', color: '#888' };
    }
    return null;
  })();

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
      className="relative w-full cursor-pointer select-none"
      style={{
        backgroundColor: isExpiredOrLeft ? '#FAFAFA' : '#FFF',
        borderBottom: '1px solid #F4F4F4',
        minHeight: '80px',
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ minHeight: '76px' }}
      >
        {/* Left: Partner Avatar */}
        <div className="relative shrink-0" style={{ width: '52px' }}>
          <div
            className="w-[48px] h-[48px] rounded-full flex items-center justify-center"
            style={{
              backgroundColor: session.partner.avatarColor,
              boxShadow: isCompleted
                ? '0 0 0 2px #166534'
                : isExpiredOrLeft
                  ? '0 0 0 2px #DDDDDD'
                  : 'none',
            }}
          >
            {session.status === 'partner_left' && (
              <svg className="absolute inset-0 w-[48px] h-[48px]" viewBox="0 0 48 48">
                <line x1="8" y1="8" x2="40" y2="40" stroke="#AAA" strokeWidth="2" />
              </svg>
            )}
            <span className="text-[18px] font-[900] text-white relative z-10">{session.partner.initial}</span>
          </div>
          {/* Creator attribution badge */}
          <div
            className="absolute flex items-center gap-0.5 rounded-[20px] px-2"
            style={{
              height: '18px',
              bottom: '-2px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#F0F0F0',
              border: '1px solid #E8E8E8',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="text-[9px] font-[800] text-[#666]">{session.creator.initial}</span>
            <span className="text-[9px] text-[#999]">·</span>
            <span className="text-[9px] font-[600] text-[#666]">{truncate(session.creator.username, 8)}</span>
          </div>
        </div>

        {/* Center: Name + Message */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Top row */}
          <div className="flex items-center gap-2 min-w-0">
            {hasUnread && isActive && (
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#2563EB' }} />
            )}
            <span
              className="text-[15px] text-[#111] truncate"
              style={{ fontWeight: hasUnread && isActive ? 900 : 800 }}
            >
              {session.partner.displayName}
            </span>
            {statusPill ? (
              <span
                className="shrink-0 flex items-center rounded-[10px] px-2"
                style={{
                  height: '18px',
                  backgroundColor: statusPill.bg,
                  color: statusPill.color,
                  fontSize: '10px',
                  fontWeight: 700,
                  border: (statusPill as { border?: string }).border || 'none',
                }}
              >
                {statusPill.text}
              </span>
            ) : (
              <span
                className="shrink-0 flex items-center rounded-[10px] px-2 truncate"
                style={{
                  height: '18px',
                  backgroundColor: '#F6F6F6',
                  color: '#666',
                  fontSize: '10px',
                  fontWeight: 700,
                  maxWidth: '130px',
                }}
              >
                {truncate(session.challengeTopic, 20)}
              </span>
            )}
          </div>
          {/* Bottom row: last message preview */}
          <div className="truncate" style={{ fontSize: '12px', fontWeight: 600, color: lastMsgPreview.color, fontStyle: lastMsgPreview.italic ? 'italic' : 'normal' }}>
            {lastMsgPreview.prefix && (
              <span style={{ fontWeight: 700, color: '#AAAAAA' }}>{lastMsgPreview.prefix}</span>
            )}
            {lastMsgPreview.text}
          </div>
        </div>

        {/* Right: Timestamp + Badge */}
        <div className="shrink-0 flex flex-col items-end gap-1.5" style={{ width: '52px' }}>
          <span className="text-[11px] font-[600] text-[#AAAAAA] text-right">
            {formatRelativeTime(session.lastMessage.timestamp)}
          </span>
          {badge && (
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                backgroundColor: badge.bg,
                height: '20px',
                minWidth: '20px',
                padding: badge.count > 9 ? '0 6px' : '0',
                width: badge.count > 9 ? '26px' : '20px',
              }}
            >
              <span className="text-[10px] font-[900] text-white">
                {badge.count > 9 ? '9+' : badge.count}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress strip */}
      <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#F0F0F0]">
        <div
          className="h-full"
          style={{
            width: `${Math.min(progressPercent, 100)}%`,
            background: isCompleted
              ? '#166534'
              : 'linear-gradient(90deg, #B45309, #F59E0B)',
          }}
        />
      </div>
    </div>
  );
};

// --- Main Page ---
export const MyChatsHub = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { sessions, markSessionRead, getTotalUnread, removeSession } = useChatSessions();

  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilter, setShowFilter] = useState(false);
  const [actionSession, setActionSession] = useState<ViewerChatSession | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  useMockMessagePoller();

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/?redirect=/chats', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Filtering
  const filteredSessions = sessions.filter(s => {
    if (filter === 'active') return s.status === 'active';
    if (filter === 'completed') return s.status === 'completed';
    return true;
  });

  // Sorting
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (sortBy === 'ending') {
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    }
    return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
  });

  // Group by status (only for "all" filter)
  const activeSessions = sortedSessions.filter(s => s.status === 'active');
  const completedSessions = sortedSessions.filter(s => s.status === 'completed');
  const expiredSessions = sortedSessions.filter(s => s.status === 'expired' || s.status === 'partner_left');

  const counts = {
    all: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    completed: sessions.filter(s => s.status === 'completed').length,
  };

  const totalUnread = getTotalUnread();

  const handleCardTap = useCallback((session: ViewerChatSession) => {
    navigate(`/accountability/chat/${session.sessionId}`);
  }, [navigate]);

  const handleLongPress = useCallback((session: ViewerChatSession) => {
    setActionSession(session);
    setShowActionSheet(true);
  }, []);

  // Section header component (sticky)
  const SectionHeader = ({ label, count }: { label: string; count: number }) => (
    <div
      className="w-full flex items-center px-4"
      style={{
        height: '32px',
        backgroundColor: '#F6F6F6',
        position: 'sticky',
        top: '0px',
        zIndex: 10,
      }}
    >
      <span className="text-[10px] font-[800] text-[#888] uppercase tracking-widest">
        {label} · {count}
      </span>
    </div>
  );

  if (!isLoggedIn) return null;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Fixed Header */}
      <header
        className="shrink-0 flex items-center justify-between px-4 bg-white"
        style={{ height: '58px', borderBottom: '1px solid #F0F0F0' }}
      >
        <button
          onClick={() => { window.history.length > 1 ? navigate(-1) : navigate('/'); }}
          className="w-[44px] h-[44px] flex items-center justify-center"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 5L8 11L14 17" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[17px] font-[900] text-[#111]">My Chats</span>
        <button
          onClick={() => setShowFilter(true)}
          className="w-[44px] h-[44px] flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Summary Strip */}
        <div
          className="flex items-center px-4"
          style={{ borderBottom: '1px solid #F4F4F4', padding: '14px 16px' }}
        >
          <div className="flex-1 flex items-center justify-center flex-col">
            <span className="text-[20px] font-[900] text-[#111]">
              {counts.active || '—'}
            </span>
            <span className="text-[11px] font-[700] text-[#888]">Active</span>
          </div>
          <div className="w-[1px] h-[28px]" style={{ backgroundColor: '#F0F0F0' }} />
          <div className="flex-1 flex items-center justify-center flex-col">
            <span
              className="text-[20px] font-[900]"
              style={{ color: totalUnread > 0 ? '#E8312A' : '#BBBBBB' }}
            >
              {totalUnread}
            </span>
            <span className="text-[11px] font-[700] text-[#888]">Unread</span>
          </div>
          <div className="w-[1px] h-[28px]" style={{ backgroundColor: '#F0F0F0' }} />
          <div className="flex-1 flex items-center justify-center flex-col">
            <span className="text-[20px] font-[900] text-[#111]">{counts.completed}</span>
            <span className="text-[11px] font-[700] text-[#888]">Completed</span>
          </div>
        </div>

        {/* All caught up */}
        {totalUnread === 0 && counts.active > 0 && (
          <div
            className="flex items-center justify-center animate-fade-in"
            style={{ height: '32px', backgroundColor: '#EDFAF3' }}
          >
            <span className="text-[12px] font-[700]" style={{ color: '#166534' }}>All caught up ✓</span>
          </div>
        )}

        {/* Empty State */}
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-4" style={{ paddingTop: '60px' }}>
            <span className="text-[48px]">🤝</span>
            <h3 className="text-[20px] font-[900] text-[#111] mt-3">No chats yet</h3>
            <p className="text-[14px] font-[600] text-[#888] mt-2 max-w-[280px]" style={{ lineHeight: '1.65' }}>
              When you join an accountability challenge and get paired with someone your chat will appear here.
            </p>
            <button
              onClick={() => navigate('/explore?type=accountability')}
              className="mt-6 flex items-center justify-center rounded-[14px]"
              style={{
                height: '44px',
                width: '160px',
                border: '1.5px solid #E8312A',
                color: '#E8312A',
                fontSize: '14px',
                fontWeight: 800,
              }}
            >
              Find a challenge →
            </button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-4" style={{ paddingTop: '60px' }}>
            <span className="text-[36px]">🔍</span>
            <h3 className="text-[17px] font-[900] text-[#111] mt-3">No matching chats</h3>
            <p className="text-[13px] font-[600] text-[#888] mt-2">Try changing your filter.</p>
          </div>
        ) : (
          /* Session Cards List */
          <div>
            {filter === 'all' ? (
              <>
                {activeSessions.length > 0 && (
                  <>
                    <SectionHeader label="Active" count={activeSessions.length} />
                    {activeSessions.map(s => (
                      <SessionCard
                        key={s.sessionId}
                        session={s}
                        onTap={() => handleCardTap(s)}
                        onLongPress={() => handleLongPress(s)}
                      />
                    ))}
                  </>
                )}
                {completedSessions.length > 0 && (
                  <>
                    <SectionHeader label="Completed" count={completedSessions.length} />
                    {completedSessions.map(s => (
                      <SessionCard
                        key={s.sessionId}
                        session={s}
                        onTap={() => handleCardTap(s)}
                        onLongPress={() => handleLongPress(s)}
                      />
                    ))}
                  </>
                )}
                {expiredSessions.length > 0 && (
                  <>
                    <SectionHeader label="Expired" count={expiredSessions.length} />
                    {expiredSessions.map(s => (
                      <SessionCard
                        key={s.sessionId}
                        session={s}
                        onTap={() => handleCardTap(s)}
                        onLongPress={() => handleLongPress(s)}
                      />
                    ))}
                  </>
                )}
              </>
            ) : (
              sortedSessions.map(s => (
                <SessionCard
                  key={s.sessionId}
                  session={s}
                  onTap={() => handleCardTap(s)}
                  onLongPress={() => handleLongPress(s)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Filter Sheet */}
      <FilterSheet
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        filter={filter}
        setFilter={setFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        counts={counts}
      />

      {/* Action Sheet */}
      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        session={actionSession}
        onOpenChat={() => actionSession && handleCardTap(actionSession)}
        onViewChallenge={() => actionSession && navigate(`/r/${actionSession.linkSlug}`)}
        onMarkRead={() => actionSession && markSessionRead(actionSession.sessionId)}
        onLeave={() => actionSession && removeSession(actionSession.sessionId)}
        onRate={() => { /* mock */ }}
        onDelete={() => actionSession && removeSession(actionSession.sessionId)}
      />
    </div>
  );
};
