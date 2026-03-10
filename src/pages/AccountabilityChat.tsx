import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatSessions } from '../context/ChatSessionsContext';
import { mockChatSession, mockAccountabilityParticipants } from '../lib/mockData';
import { getAvatarColor } from '../lib/utils';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderInitial: string;
  type: 'private' | 'broadcast';
  content: string;
  timestamp: string;
  isRead: boolean;
}

export const AccountabilityChat = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  let markSessionReadFn: ((id: string) => void) | null = null;
  try {
    const chatCtx = useChatSessions();
    markSessionReadFn = chatCtx.markSessionRead;
  } catch { /* ignore */ }
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(mockChatSession.messages as ChatMessage[]);
  const [inputText, setInputText] = useState('');
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showNewMsgIndicator, setShowNewMsgIndicator] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [rating, setRating] = useState(0);
  const [showExpiryCelebration, setShowExpiryCelebration] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn) {
      navigate(`/?redirect=/accountability/chat/${sessionId}`, { replace: true });
    }
  }, [isLoggedIn, navigate, sessionId]);

  const session = mockChatSession;
  const currentUserId = 'participant_current';
  const partner = mockAccountabilityParticipants.find(p => p.id !== currentUserId);
  const partnerName = partner?.displayName || 'Jordan';
  const partnerInitial = partnerName[0];
  const partnerColor = '#2563EB';
  const creatorName = 'Alex Creator';
  const creatorColor = getAvatarColor('alexcreator');

  // Calculate day count
  const pairedAt = new Date(session.createdAt);
  const now = new Date();
  const daysPassed = Math.max(1, Math.ceil((now.getTime() - pairedAt.getTime()) / (1000 * 60 * 60 * 24)));

  // Check expiry
  useEffect(() => {
    const expiry = new Date(session.expiresAt);
    if (new Date() >= expiry) {
      setIsExpired(true);
      setShowExpiryCelebration(true);
    }
  }, [session.expiresAt]);

  // Scroll to bottom on mount + mark session read
  useEffect(() => {
    scrollToBottom();
    if (sessionId && markSessionReadFn) {
      markSessionReadFn(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Count unread
  useEffect(() => {
    const count = messages.filter(m => !m.isRead && m.senderId !== currentUserId).length;
    setUnreadCount(count);
    if (count > 0) setShowNewMsgIndicator(true);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMsgIndicator(false);
    // Mark all as read
    setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      senderName: 'Alex',
      senderInitial: 'A',
      type: 'private',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      isRead: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    setTimeout(scrollToBottom, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = '44px';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; msgs: ChatMessage[] }[]>((acc, msg) => {
    const dateStr = formatDate(msg.timestamp);
    const last = acc[acc.length - 1];
    if (last && last.date === dateStr) {
      last.msgs.push(msg);
    } else {
      acc.push({ date: dateStr, msgs: [msg] });
    }
    return acc;
  }, []);

  const progressPercent = ((session.daysTotal - session.daysRemaining) / session.daysTotal) * 100;

  const suggestedMsg = `Hi ${partnerName}! I'm Alex. My commitment is ${(session.participantCommitments[currentUserId] || '').slice(0, 60)}. What's yours?`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        text: `I just completed a ${session.daysTotal}-day accountability challenge. ${mockChatSession.id ? '' : ''}Created by ${creatorName} on AdGate.`,
      });
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-[58px] bg-white flex items-center justify-between px-4" style={{ borderBottom: '1px solid #F0F0F0' }}>
        <button onClick={() => { window.history.length > 1 ? navigate(-1) : navigate('/chats'); }} className="flex items-center gap-1.5 shrink-0" style={{ width: '80px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M14 5L8 11L14 17" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="font-[900] text-[13px] tracking-tight text-[#111]">Back</span>
        </button>

        <div className="flex items-center gap-2 justify-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: partnerColor }}>
            <span className="text-[13px] font-[900] text-white">{partnerInitial}</span>
          </div>
          <span className="text-[15px] font-[800] text-[#111]">{partnerName}</span>
          <span className="text-[12px] font-[600] text-[#888]">· Day {daysPassed} of {session.daysTotal}</span>
        </div>

        <button
          onClick={() => setShowInfoSheet(true)}
          className="w-[44px] h-[44px] flex items-center justify-center shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="#888" strokeWidth="1.5"/>
            <path d="M10 9V14M10 7V6" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </header>

      {/* Progress bar */}
      <div className="shrink-0 h-1 w-full bg-[#F0F0F0]">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #B45309, #F59E0B)' }}
        />
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollBehavior: 'smooth' }}>
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <span className="text-[48px] mb-4">🤝</span>
            <h3 className="text-[18px] font-[900] text-[#111] mb-2">You've been paired with {partnerName}!</h3>
            <p className="text-[13px] font-[600] text-[#888] max-w-[260px]">Send a message to introduce yourself.</p>

            <div className="mt-4 rounded-[12px] p-3.5 max-w-[280px]" style={{ backgroundColor: '#FFFBEB' }}>
              <span className="text-[10px] text-[#AAA]">💡 Try sending:</span>
              <p className="text-[13px] font-[600] text-[#444] mt-1">{suggestedMsg}</p>
              <button
                onClick={() => setInputText(suggestedMsg)}
                className="mt-3 h-8 px-4 rounded-[8px] text-[12px] font-[800] text-[#B45309] border border-[#B45309]"
              >
                Send this →
              </button>
            </div>
          </div>
        ) : (
          <>
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-[1px] bg-[#F0F0F0]" />
                  <span className="text-[11px] font-[700] text-[#BBBBBB] shrink-0">{group.date}</span>
                  <div className="flex-1 h-[1px] bg-[#F0F0F0]" />
                </div>

                {group.msgs.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  const isBroadcast = msg.type === 'broadcast';

                  if (isBroadcast) {
                    return (
                      <div key={msg.id} className="mb-4 w-full rounded-[12px] p-3.5" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: creatorColor }}>
                              <span className="text-[10px] font-[900] text-white">A</span>
                            </div>
                            <span className="text-[12px] font-[800] text-[#92400E]">{creatorName}</span>
                          </div>
                          <span className="h-5 px-2.5 rounded-[10px] text-[10px] font-[800] text-[#92400E] flex items-center" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                            📣 Challenge Update
                          </span>
                        </div>
                        <p className="text-[13px] font-[600] text-[#555]" style={{ lineHeight: '1.65' }}>{msg.content}</p>
                      </div>
                    );
                  }

                  if (isOwn) {
                    return (
                      <div key={msg.id} className="flex flex-col items-end mb-3">
                        <div className="max-w-[78%] rounded-[14px] p-3.5 text-[14px] font-[600] text-[#333]" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderBottomRightRadius: '4px', lineHeight: '1.6' }}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-[#AAA] mt-1 mr-1">{formatTime(msg.timestamp)}</span>
                      </div>
                    );
                  }

                  // Incoming
                  return (
                    <div key={msg.id} className="flex gap-2 mb-3 items-start">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-5" style={{ backgroundColor: partnerColor }}>
                        <span className="text-[11px] font-[900] text-white">{msg.senderInitial}</span>
                      </div>
                      <div className="flex flex-col max-w-[78%]">
                        <span className="text-[10px] font-[700] text-[#888] mb-1">{msg.senderName}</span>
                        <div className="rounded-[14px] p-3.5 text-[14px] font-[600] text-[#333] bg-white" style={{ border: '1px solid #F0F0F0', borderBottomLeftRadius: '4px', lineHeight: '1.6' }}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-[#AAA] mt-1 ml-1">{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Unread indicator */}
      {showNewMsgIndicator && unreadCount > 0 && (
        <div className="absolute left-1/2 transform -translate-x-1/2" style={{ bottom: '100px' }}>
          <button
            onClick={scrollToBottom}
            className="h-8 px-3 rounded-[20px] bg-white text-[13px] font-[700] text-[#111] flex items-center"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >
            {unreadCount} new messages ↓
          </button>
        </div>
      )}

      {/* Expiry panel */}
      {isExpired ? (
        <div className="shrink-0 bg-white p-5 flex flex-col items-center" style={{ borderTop: '2px solid #E8312A' }}>
          {showExpiryCelebration && (
            <div className="relative w-full h-8 mb-4">
              {['#6366F1', '#166534', '#2563EB', '#B45309', '#E8312A'].map((color, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: color,
                    left: '50%',
                    top: '50%',
                    animation: `confetti${i} 1s ease-out forwards`,
                  }}
                />
              ))}
            </div>
          )}
          <h3 className="text-[20px] font-[900] text-[#111] text-center">Challenge Complete! 🎉</h3>
          <p className="text-[14px] text-[#888] text-center mt-1">{session.daysTotal} days. Done.</p>

          <div className="w-full grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-[12px] p-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <span className="text-[10px] font-[800] text-[#888] uppercase block">What you committed to</span>
              <p className="text-[12px] font-[600] text-[#444] mt-1" style={{ lineHeight: '1.5' }}>
                {session.participantCommitments[currentUserId]}
              </p>
            </div>
            <div className="rounded-[12px] p-3 bg-white" style={{ border: '1px solid #F0F0F0' }}>
              <span className="text-[10px] font-[800] text-[#888] uppercase block">What {partnerName} committed to</span>
              <p className="text-[12px] font-[600] text-[#444] mt-1" style={{ lineHeight: '1.5' }}>
                {session.participantCommitments['participant_pair']}
              </p>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="w-full h-[48px] rounded-[14px] bg-[#E8312A] text-white text-[14px] font-[900] flex items-center justify-center mt-4"
          >
            Share your experience →
          </button>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)} className="p-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= rating ? '#B45309' : 'none'} stroke={star <= rating ? '#B45309' : '#E8E8E8'} strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <button className="h-9 px-4 rounded-[10px] text-[13px] font-[800] text-[#B45309] border border-[#B45309] mt-2">
              Submit rating
            </button>
          )}
        </div>
      ) : (
        /* Message input */
        <div
          className="shrink-0 bg-white flex items-end gap-2 px-4 py-2.5"
          style={{ borderTop: '1px solid #F0F0F0', paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
        >
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${partnerName}...`}
            className="flex-1 min-h-[44px] max-h-[120px] rounded-[22px] px-3 py-2.5 text-[14px] font-[600] resize-none"
            style={{
              border: '1.5px solid #E8E8E8',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#B45309';
              e.target.style.boxShadow = '0 0 0 3px rgba(180,83,9,0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E8E8E8';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={handleSend}
            className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 transition-opacity"
            style={{
              backgroundColor: '#B45309',
              opacity: inputText.trim() ? 1 : 0.4,
            }}
            disabled={!inputText.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Challenge Info Bottom Sheet */}
      {showInfoSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInfoSheet(false)} />
          <div className="relative bg-white rounded-t-[24px] max-h-[80vh] overflow-y-auto" style={{ animation: 'slideUp 0.3s ease' }}>
            <div className="sticky top-0 bg-white pt-3 pb-2 flex flex-col items-center rounded-t-[24px] z-10">
              <div className="w-8 h-1 bg-[#E8E8E8] rounded-full mb-3" />
              <div className="w-full flex items-center justify-between px-4">
                <div className="w-11" />
                <span className="text-[16px] font-[900] text-[#111]">Challenge Details</span>
                <button onClick={() => setShowInfoSheet(false)} className="w-11 h-11 flex items-center justify-center text-[#888]">✕</button>
              </div>
            </div>

            <div className="px-4 pb-8">
              {/* Creator */}
              <div className="flex items-center gap-3 py-4" style={{ borderBottom: '1px solid #F0F0F0' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: creatorColor }}>
                  <span className="text-[14px] font-[900] text-white">A</span>
                </div>
                <div>
                  <span className="text-[14px] font-[800] text-[#111]">{creatorName}</span>
                  <span className="text-[11px] text-[#888] block">Created this challenge</span>
                </div>
              </div>

              {/* Challenge info */}
              <div className="py-4" style={{ borderBottom: '1px solid #F0F0F0' }}>
                <h4 className="text-[16px] font-[800] text-[#111]">{session.id ? 'Building a consistent morning routine' : ''}</h4>
                <p className="text-[13px] font-[600] text-[#555] mt-2" style={{ lineHeight: '1.65' }}>
                  Pair up with a stranger who is also trying to build a morning routine. Check in daily. Support each other.
                </p>
              </div>

              {/* Progress */}
              <div className="py-4" style={{ borderBottom: '1px solid #F0F0F0' }}>
                <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, backgroundColor: '#B45309' }} />
                </div>
                <span className="text-[12px] font-[700] text-[#555] mt-2 block text-right">{daysPassed} of {session.daysTotal} days</span>
              </div>

              {/* Your commitment */}
              <div className="py-4 rounded-[12px] px-3 mt-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <span className="text-[10px] font-[800] text-[#888] uppercase">Your commitment:</span>
                <p className="text-[13px] font-[700] text-[#333] mt-1" style={{ lineHeight: '1.5' }}>
                  {session.participantCommitments[currentUserId]}
                </p>
              </div>

              {/* Partner commitment */}
              <div className="py-4 rounded-[12px] px-3 mt-3 bg-white" style={{ border: '1px solid #F0F0F0' }}>
                <span className="text-[10px] font-[800] text-[#888] uppercase">{partnerName}'s commitment:</span>
                <p className="text-[13px] font-[700] text-[#333] mt-1" style={{ lineHeight: '1.5' }}>
                  {session.participantCommitments['participant_pair']}
                </p>
              </div>

              {/* Guidelines */}
              <div className="py-4 mt-3" style={{ borderBottom: '1px solid #F0F0F0' }}>
                <span className="text-[10px] font-[800] text-[#888] uppercase">📋 Guidelines:</span>
                <p className="text-[13px] font-[600] text-[#555] mt-1" style={{ lineHeight: '1.65' }}>
                  Be honest with your partner. Check in every day. If you miss a day, say so. No judgment.
                </p>
              </div>

              {/* Leave */}
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="w-full h-[44px] rounded-[12px] text-[14px] font-[800] text-[#E8312A] flex items-center justify-center mt-6"
                style={{ border: '1.5px solid #E8312A' }}
              >
                Leave Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirm */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLeaveConfirm(false)} />
          <div className="relative bg-white rounded-t-[24px] p-6" style={{ animation: 'slideUp 0.3s ease' }}>
            <div className="w-8 h-1 bg-[#E8E8E8] rounded-full mx-auto mb-4" />
            <p className="text-[15px] font-[700] text-[#111] text-center mb-6">Your partner won't have anyone to check in with. Are you sure?</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowLeaveConfirm(false); setShowInfoSheet(false); navigate('/'); }}
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
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes confetti0 { to { transform: translate(-30px, -25px); opacity: 0; } }
        @keyframes confetti1 { to { transform: translate(20px, -35px); opacity: 0; } }
        @keyframes confetti2 { to { transform: translate(-15px, 20px); opacity: 0; } }
        @keyframes confetti3 { to { transform: translate(35px, -10px); opacity: 0; } }
        @keyframes confetti4 { to { transform: translate(5px, -30px); opacity: 0; } }
      `}</style>
    </div>
  );
};
