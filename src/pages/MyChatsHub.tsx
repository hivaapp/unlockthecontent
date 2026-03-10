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
  onMarkAllRead,
}: {
  isOpen: boolean;
  onClose: () => void;
  filter: string;
  setFilter: (f: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  counts: { all: number; active: number; completed: number };
  onMarkAllRead: () => void;
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
      <div className="relative bg-white rounded-t-[24px] animate-slide-up" style={{ height: '360px' }}>
        <div className="flex flex-col items-center pt-3 pb-2">
          <div className="w-8 h-1 bg-[#E8E8E8] rounded-full mb-3" />
          <div className="w-full flex items-center justify-between px-4">
            <div className="w-11" />
            <span className="text-[15px] font-[900] text-[#111]">Filter Chats</span>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center text-[#888]">✕</button>
          </div>
        </div>

        <div className="px-4 pb-4 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(360px - 60px)' }}>
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
                      style={{ borderColor: localFilter === opt.value ? '#D97757' : '#DDD' }}
                    >
                      {localFilter === opt.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#D97757]" />
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
                    style={{ borderColor: localSort === opt.value ? '#D97757' : '#DDD' }}
                  >
                    {localSort === opt.value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#D97757]" />
                    )}
                  </div>
                  <span className="text-[14px] font-[700] text-[#333]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { onMarkAllRead(); onClose(); }}
            className="w-full h-[48px] flex items-center justify-center text-[13px] font-[800] text-[#E8312A] border border-[#FEE2E2] rounded-[12px]"
          >
            Mark all read
          </button>

          <button
            onClick={handleApply}
            className="w-full h-[48px] rounded-[12px] text-white text-[14px] font-[800] flex items-center justify-center"
            style={{ backgroundColor: '#D97757' }}
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

// --- Section Header ---
const SectionHeader = ({ label, count, hasNew }: { label: string; count: number; hasNew?: boolean }) => (
  <div
    className="bg-[#FAFAFA] px-4 py-2 flex items-center justify-between"
    style={{ borderBottom: '1px solid #F0F0F0' }}
  >
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-[900] text-[#888] uppercase tracking-[0.05em]">
        {label}
      </span>
      {hasNew && (
        <div className="bg-[#E8312A] rounded-full px-1.5 py-0.5 animate-pulse">
          <span className="text-[9px] font-[900] text-white">NEW</span>
        </div>
      )}
    </div>
    <span className="text-[10px] font-[700] text-[#AAAAAA]">
      {count} {count === 1 ? 'chat' : 'chats'}
    </span>
  </div>
);

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
  const hasUnread = session.unreadCount > 0;

  const progressPercent = (session.daysElapsed / session.daysTotal) * 100;

  // Nudge logic: last message more than 48 hours ago
  const SHOW_NUDGE = isActive && (Date.now() - new Date(session.lastMessage.timestamp).getTime()) > (48 * 60 * 60 * 1000);

  const lastMsgPreview = (() => {
    const lm = session.lastMessage;
    if (lm.type === 'broadcast') {
      return `📣 Challenge update`;
    }
    const isOwn = lm.senderId === session.viewerParticipantId;
    const prefix = isOwn ? 'You: ' : (lm.senderName ? `${lm.senderName}: ` : '');
    return `${prefix}${truncate(lm.content, 48)}`;
  })();

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      className={`relative w-full cursor-pointer select-none bg-white flex flex-col`}
      style={{
        borderBottom: '1px solid #F4F4F4',
        borderLeft: hasUnread ? '3px solid #E8312A' : 'none',
        minHeight: '96px',
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Left: Avatar + Creator Badge */}
        <div className="flex flex-col items-center shrink-0 w-[56px]">
          <div
            className="w-[48px] h-[48px] rounded-full flex items-center justify-center relative"
            style={{
              backgroundColor: session.partner.avatarColor,
              boxShadow: isActive
                ? '0 0 0 2px #F59E0B, 0 0 0 4px rgba(245,158,11,0.15)'
                : isCompleted
                  ? '0 0 0 2px #166534, 0 0 0 4px rgba(22,101,52,0.15)'
                  : 'none',
            }}
          >
            <span className="text-[18px] font-[900] text-white">{session.partner.initial}</span>
          </div>

          {/* Part 18 Creator Badge */}
          <div
            className="mt-1 flex items-center gap-0.5 rounded-[20px] px-2 bg-[#F0F0F0] border border-[#E8E8E8]"
            style={{ height: '16px', maxWidth: '56px' }}
          >
            <span className="text-[9px] font-[800] text-[#666]">{session.creator.initial}</span>
            <span className="text-[9px] text-[#999]">·</span>
            <span className="text-[9px] font-[600] text-[#666] truncate">{session.creator.username}</span>
          </div>
        </div>

        {/* Center: Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Row 1: Name + Topic */}
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0">
              {hasUnread && (
                <div className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
              )}
              <span className={`text-[15px] text-[#111] truncate ${hasUnread ? 'font-[900]' : 'font-[900]'}`}>
                {session.partner.displayName}
              </span>
            </div>
            <span
              className="px-2 py-0.5 bg-[#F6F6F6] text-[#555] text-[10px] font-[700] rounded-[10px] whitespace-nowrap truncate"
              style={{ height: '18px' }}
            >
              {truncate(session.challengeTopic, 22)}
            </span>
          </div>

          {/* Row 2: Progress Context */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[12px]">📅</span>
              <span className="text-[12px] font-[700] text-[#B45309]">Day {session.daysElapsed} of {session.daysTotal}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[#DDDDDD]" />
            <span className="text-[12px] font-[600] text-[#AAAAAA]">Check in {session.checkInFrequency}</span>
          </div>

          {/* Row 3: Last Message */}
          <div className="text-[12px] font-[600] text-[#888] truncate">
            {lastMsgPreview}
          </div>

          {/* Nudge strip */}
          {SHOW_NUDGE && (
            <div className="mt-2 -mx-4 px-4 py-2 bg-[#FFFBEB]">
               <span className="text-[11px] font-[700] text-[#92400E]">💬 No check-in in 2 days — send a message</span>
            </div>
          )}
        </div>

        {/* Right: Meta */}
        <div className="shrink-0 flex flex-col items-end gap-1 w-[56px]">
          <span className="text-[11px] font-[600] text-[#AAAAAA]">
            {formatRelativeTime(session.lastMessage.timestamp)}
          </span>

          {hasUnread ? (
            <div
              className="flex items-center justify-center rounded-full bg-[#E8312A] min-w-[22px] h-[22px] px-1"
            >
              <span className="text-[10px] font-[900] text-white">
                {session.unreadCount}
              </span>
            </div>
          ) : (
            <span className="text-[16px] text-[#DDDDDD] mt-1">›</span>
          )}
        </div>
      </div>

      {/* Progress Bar Bottom */}
      <div className="mt-auto h-1 w-full bg-[#F0F0F0]">
        <div
          className="h-full"
          style={{
            width: `${progressPercent}%`,
            background: isCompleted
              ? '#166534'
              : 'linear-gradient(90deg, #F59E0B, #B45309)',
          }}
        />
      </div>
    </div>
  );
};

// --- Action Sheet ---
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
                <svg width="32" height="32" viewBox="0 0 24 24" fill={star <= rating ? '#D97757' : 'none'} stroke={star <= rating ? '#D97757' : '#DDD'} strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
          <textarea
            placeholder="Any comments? (optional)"
            className="w-full h-[80px] rounded-[12px] p-3 text-[13px] font-[600] resize-none"
            style={{ border: '1px solid #E6E2D9', outline: 'none' }}
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { onRate(); onClose(); }}
              className="flex-1 h-[44px] rounded-[12px] text-white text-[14px] font-[800]"
              style={{ backgroundColor: '#D97757', opacity: rating > 0 ? 1 : 0.4 }}
              disabled={rating === 0}
            >
              Submit
            </button>
            <button
              onClick={() => setShowRating(false)}
              className="flex-1 h-[44px] rounded-[12px] bg-[#F3F1EC] text-[#21201C] text-[14px] font-[800]"
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
          <p className="text-[15px] font-[700] text-[#21201C] text-center mb-6">
            Are you sure? Your partner will be notified.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { onLeave(); onClose(); }}
              className="flex-1 h-[44px] rounded-[12px] bg-[#C0392B] text-white text-[14px] font-[800]"
            >
              Leave
            </button>
            <button
              onClick={() => setShowLeaveConfirm(false)}
              className="flex-1 h-[44px] rounded-[12px] bg-[#F3F1EC] text-[#21201C] text-[14px] font-[800]"
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
          <p className="text-[15px] font-[700] text-[#21201C] text-center mb-2">
            Remove this chat from your list?
          </p>
          <p className="text-[13px] font-[600] text-[#6B6860] text-center mb-6">
            Your message history will be cleared from this device.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="flex-1 h-[44px] rounded-[12px] bg-[#C0392B] text-white text-[14px] font-[800]"
            >
              Remove
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 h-[44px] rounded-[12px] bg-[#F3F1EC] text-[#21201C] text-[14px] font-[800]"
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
        <div className="px-4 pb-3" style={{ borderBottom: '1px solid #E6E2D9' }}>
          <span className="text-[15px] font-[800] text-[#21201C]">{session.partner.displayName}</span>
          <span className="text-[12px] font-[600] text-[#6B6860] ml-2">{session.challengeTopic}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col">
          <button onClick={() => { onOpenChat(); onClose(); }} className="h-[52px] flex items-center px-4 hover:bg-[#FAF9F7] active:bg-[#F3F1EC]" style={{ borderBottom: '1px solid #E6E2D9' }}>
            <span className="text-[15px] font-[800] text-[#21201C]">Open Chat →</span>
          </button>
          <button onClick={() => { onViewChallenge(); onClose(); }} className="h-[52px] flex items-center px-4 hover:bg-[#FAF9F7] active:bg-[#F3F1EC]" style={{ borderBottom: '1px solid #E6E2D9' }}>
            <span className="text-[15px] font-[800] text-[#21201C]">View Challenge Details</span>
          </button>

          {isActive && (
            <>
              <button onClick={() => { onMarkRead(); onClose(); }} className="h-[52px] flex items-center px-4 hover:bg-[#FAF9F7] active:bg-[#F3F1EC]" style={{ borderBottom: '1px solid #E6E2D9' }}>
                <span className="text-[15px] font-[800] text-[#21201C]">Mark All Read</span>
              </button>
              <button onClick={() => setShowLeaveConfirm(true)} className="h-[52px] flex items-center px-4 hover:bg-[#FAF9F7] active:bg-[#F3F1EC]">
                <span className="text-[15px] font-[800] text-[#C0392B]">Leave Challenge</span>
              </button>
            </>
          )}

          {isCompleted && (
            <button onClick={() => setShowRating(true)} className="h-[52px] flex items-center px-4 hover:bg-[#FAF9F7] active:bg-[#F3F1EC]">
              <span className="text-[15px] font-[800] text-[#21201C]">Rate This Challenge</span>
            </button>
          )}

          {(session.status === 'expired' || session.status === 'partner_left') && (
            <button onClick={() => setShowDeleteConfirm(true)} className="h-[52px] flex items-center px-4 hover:bg-[#FAF9F7] active:bg-[#F3F1EC]">
              <span className="text-[15px] font-[800] text-[#C0392B]">Delete</span>
            </button>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
};

// --- Main Page ---
export const MyChatsHub = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { sessions, setSessions, markSessionRead, getTotalUnread, removeSession } = useChatSessions();

  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilter, setShowFilter] = useState(false);
  const [actionSession, setActionSession] = useState<ViewerChatSession | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  useMockMessagePoller();


  const markAllRead = useCallback(() => {
    setSessions(prev => prev.map(s => ({ ...s, unreadCount: 0, unreadBroadcasts: 0 })));
  }, [setSessions]);

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
          className="flex items-center gap-1 shrink-0"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 5L8 11L14 17" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[14px] font-[700] text-[#555]">Back</span>
        </button>

        <span className="text-[17px] font-[900] text-[#111]">My Chats</span>

        <div className="flex items-center">
          {totalUnread > 0 && (
            <button
              onClick={markAllRead}
              className="hidden sm:block text-[13px] font-[700] text-[#E8312A] mr-2"
            >
              Mark all read
            </button>
          )}
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
        </div>
      </header>

      {/* Pull To Refresh Indicator */}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Summary Strip */}
        <div
          className="bg-[#FAFAFA]"
          style={{ borderBottom: '1px solid #F0F0F0', padding: '20px 16px' }}
        >
          <div className="flex gap-2">
            {/* Block 1 - Active */}
            <div
              className="flex-1 bg-white rounded-[12px] p-3 flex flex-col items-center justify-center"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center justify-center mb-1">
                {activeSessions.slice(0, 2).map((s, i) => (
                  <div
                    key={s.sessionId}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-[900] text-white"
                    style={{
                      backgroundColor: s.partner.avatarColor,
                      marginLeft: i > 0 ? '-6px' : '0',
                      border: '1.5px solid white',
                      zIndex: 2 - i,
                    }}
                  >
                    {s.partner.initial}
                  </div>
                ))}
                {activeSessions.length === 0 && <span className="text-[18px]">🏃</span>}
              </div>
              <span className="text-[13px] font-[900] text-[#111]">{counts.active} Active</span>
              <span className="text-[10px] font-[600] text-[#AAAAAA] mt-0.5">challenges running</span>
            </div>

            {/* Block 2 - Unread */}
            <div
              className="flex-1 bg-white rounded-[12px] p-3 flex flex-col items-center justify-center"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <div
                className={`w-[22px] h-[22px] mb-1 flex items-center justify-center ${totalUnread > 0 ? 'animate-pulse' : ''}`}
                style={{ color: '#E8312A' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
                {totalUnread > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-[#E8312A] rounded-full border border-white" />}
              </div>
              <span className="text-[13px] font-[900]" style={{ color: totalUnread > 0 ? '#E8312A' : '#111' }}>
                {totalUnread} Unread
              </span>
              <span className="text-[10px] font-[600] whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: totalUnread === 0 ? '#166534' : '#AAAAAA' }}>
                {totalUnread === 0 ? "you're all caught up" : "messages waiting"}
              </span>
            </div>

            {/* Block 3 - Completed */}
            <div
              className="flex-1 bg-white rounded-[12px] p-3 flex flex-col items-center justify-center"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <div className="w-[22px] h-[22px] mb-1 flex items-center justify-center text-[#166534]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-[13px] font-[900] text-[#111]">{counts.completed} Done</span>
              <span className="text-[10px] font-[600] text-[#AAAAAA] mt-0.5">challenges done</span>
            </div>
          </div>
        </div>

        {/* All caught up */}
        {totalUnread === 0 && counts.active > 0 && (
          <div
            className="flex items-center justify-center animate-fade-in"
            style={{ height: '32px', backgroundColor: '#EBF5EE' }}
          >
            <span className="text-[12px] font-[700]" style={{ color: '#417A55' }}>All caught up ✓</span>
          </div>
        )}

        {/* Empty State */}
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-4" style={{ paddingTop: '80px' }}>
            <span className="text-[48px]">🤝</span>
            <h3 className="text-[20px] font-[900] text-[#21201C] mt-3">No chats yet</h3>
            <p className="text-[14px] font-[600] text-[#6B6860] mt-2 max-w-[280px]" style={{ lineHeight: '1.65' }}>
              When you join an accountability challenge and get paired with someone your chat will appear here.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="mt-6 flex items-center justify-center rounded-md"
              style={{
                height: '40px',
                width: '160px',
                backgroundColor: '#D97757',
                color: 'white',
                fontSize: '14px',
                fontWeight: 800,
              }}
            >
              Start Chatting →
            </button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-4" style={{ paddingTop: '60px' }}>
            <span className="text-[36px]">🔍</span>
            <h3 className="text-[17px] font-[900] text-[#21201C] mt-3">No matching chats</h3>
            <p className="text-[13px] font-[600] text-[#6B6860] mt-2">Try changing your filter.</p>
          </div>
        ) : (
          /* Session Cards List */
          <div onTouchStart={() => {}}>
            {filter === 'all' ? (
              <>
                {activeSessions.length > 0 && (
                  <>
                    <SectionHeader
                      label="Active"
                      count={activeSessions.length}
                      hasNew={activeSessions.some(s => s.unreadCount > 0)}
                    />
                    {activeSessions.map(s => (
                      <SessionCard
                        key={s.sessionId}
                        session={s}
                        onTap={() => navigate(`/chats/${s.sessionId}`)}
                        onLongPress={() => {
                          setActionSession(s);
                          setShowActionSheet(true);
                        }}
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
                        onTap={() => navigate(`/chats/${s.sessionId}`)}
                        onLongPress={() => {
                          setActionSession(s);
                          setShowActionSheet(true);
                        }}
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
                        onTap={() => navigate(`/chats/${s.sessionId}`)}
                        onLongPress={() => {
                          setActionSession(s);
                          setShowActionSheet(true);
                        }}
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
                  onTap={() => navigate(`/chats/${s.sessionId}`)}
                  onLongPress={() => {
                    setActionSession(s);
                    setShowActionSheet(true);
                  }}
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
        onMarkAllRead={markAllRead}
      />

      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        session={actionSession}
        onOpenChat={() => actionSession && navigate(`/chats/${actionSession.sessionId}`)}
        onViewChallenge={() => actionSession && navigate(`/challenge/${actionSession.linkId}`)}
        onMarkRead={() => actionSession && markSessionRead(actionSession.sessionId)}
        onLeave={() => actionSession && removeSession(actionSession.sessionId)}
        onRate={() => { /* mock */ }}
        onDelete={() => actionSession && removeSession(actionSession.sessionId)}
      />
    </div>
  );
};
