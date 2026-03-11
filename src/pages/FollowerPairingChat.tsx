import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatSessions } from '../context/ChatSessionsContext';
import { mockChatSession, mockAccountabilityParticipants, mockLinks } from '../lib/mockData';
import { getAvatarColor } from '../lib/utils';

interface MediaAttachment {
  type: 'image' | 'video' | 'file';
  url: string | null;
  fileName: string;
  fileSize?: string;
  isPlaceholder?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderInitial: string;
  type: 'private' | 'broadcast';
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: MediaAttachment[];
}

export const FollowerPairingChat = () => {
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
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MediaAttachment[]>([]);
  const [lightboxAttachment, setLightboxAttachment] = useState<MediaAttachment | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn) {
      navigate(`/?redirect=/chats/${sessionId}`, { replace: true });
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

  const linkData = mockLinks.find(l => l.id === session.linkId);
  const completionAsset = linkData?.followerPairingConfig?.completionAsset;

  // Calculate day count
  const pairedAt = new Date(session.createdAt);
  const now = new Date();
  const daysPassed = Math.max(1, Math.ceil((now.getTime() - pairedAt.getTime()) / (1000 * 60 * 60 * 24)));

  // Check expiry
  useEffect(() => {
    const expiry = new Date(session.expiresAt);
    if (new Date() >= expiry) {
      setIsExpired(true);
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
    if (!inputText.trim() && pendingAttachments.length === 0) return;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      senderName: 'Alex',
      senderInitial: 'A',
      type: 'private',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      isRead: true,
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setPendingAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    setTimeout(scrollToBottom, 50);
  };

  const handleAddAttachment = (type: 'image' | 'video' | 'file') => {
    const mockUrls = {
      image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=400&q=80',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      file: 'document.pdf'
    };
    
    const newAttachment: MediaAttachment = {
      type,
      url: type === 'file' ? null : mockUrls[type],
      fileName: type === 'file' ? 'ProgressReport_March.pdf' : `Media_${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`,
      fileSize: type === 'file' ? '1.2 MB' : '4.5 MB',
      isPlaceholder: true
    };
    
    setPendingAttachments(prev => [...prev, newAttachment]);
    setShowMediaPicker(false);
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
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

// --- Media Components ---
const AttachmentDisplay = ({ 
  attachments, 
  isOwn, 
  onImageClick 
}: { 
  attachments: MediaAttachment[], 
  isOwn: boolean,
  onImageClick: (a: MediaAttachment) => void
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 mt-2 ${isOwn ? 'items-end' : 'items-start'}`}>
      {attachments.map((att, i) => {
        if (att.type === 'image') {
          return (
            <div 
              key={i} 
              className="relative rounded-[12px] overflow-hidden border border-[#E6E2D9] cursor-pointer"
              style={{ width: '200px', height: '150px' }}
              onClick={() => onImageClick(att)}
            >
              <img src={att.url || ''} alt={att.fileName} className="w-full h-full object-cover" />
            </div>
          );
        }
        if (att.type === 'video') {
          return (
            <div 
              key={i} 
              className="relative rounded-[12px] overflow-hidden border border-[#E6E2D9]"
              style={{ width: '200px', height: '150px' }}
            >
              <video src={att.url || ''} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#111" className="ml-0.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div 
            key={i} 
            className="flex items-center gap-3 p-3 rounded-[12px] border border-[#E6E2D9] bg-white w-[200px]"
          >
            <div className="w-10 h-10 rounded-[8px] bg-[#F3F1EC] flex items-center justify-center shrink-0">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B6860" strokeWidth="2">
                 <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                 <polyline points="13 2 13 9 20 9" />
               </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-[700] text-[#21201C] truncate">{att.fileName}</p>
              <p className="text-[10px] font-[600] text-[#AAA49C]">{att.fileSize}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

                  if (isBroadcast) {
                    return (
                      <div key={msg.id} className="mb-4 w-full rounded-[12px] p-3.5" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: creatorColor }}>
                              <span className="text-[10px] font-[900] text-white">A</span>
                            </div>
                            <span className="text-[14px] font-[900] text-[#92400E]">{creatorName}</span>
                          </div>
                          <span className="h-5 px-2.5 rounded-[10px] text-[10px] font-[800] text-[#92400E] flex items-center" style={{ backgroundColor: '#FAF0EB', border: '1px solid #FDE68A' }}>
                            📣 Creator Update
                          </span>
                        </div>
                        <p className="text-[14px] font-[600] text-[#21201C]" style={{ lineHeight: '1.65' }}>{msg.content}</p>
                        {msg.attachments && (
                          <AttachmentDisplay 
                            attachments={msg.attachments} 
                            isOwn={false} 
                            onImageClick={setLightboxAttachment} 
                          />
                        )}
                      </div>
                    );
                  }

                  if (isOwn) {
                    return (
                      <div key={msg.id} className="flex flex-col items-end mb-3">
                        <div className="max-w-[85%] rounded-[14px] p-3.5 text-[14px] font-[600] text-[#21201C]" style={{ backgroundColor: '#FAF0EB', border: '1px solid #E6E2D9', borderBottomRightRadius: '2px', lineHeight: '1.6' }}>
                          {msg.content}
                          {msg.attachments && (
                            <AttachmentDisplay 
                              attachments={msg.attachments} 
                              isOwn={true} 
                              onImageClick={setLightboxAttachment} 
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 mr-1">
                          <span className="text-[10px] text-[#AAA49C]">{formatTime(msg.timestamp)}</span>
                          <span className="text-[10px] text-[#AAA49C] font-[700] ml-1">Seen ✓</span>
                        </div>
                      </div>
                    );
                  }

                  // Incoming
                  return (
                    <div key={msg.id} className="flex gap-2 mb-3 items-start">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-5" style={{ backgroundColor: partnerColor }}>
                        <span className="text-[12px] font-[900] text-white">{msg.senderInitial}</span>
                      </div>
                      <div className="flex flex-col max-w-[85%]">
                        <span className="text-[11px] font-[800] text-[#6B6860] mb-1">{msg.senderName}</span>
                        <div className="rounded-[14px] p-3.5 text-[14px] font-[600] text-[#21201C] bg-white" style={{ border: '1px solid #E6E2D9', borderBottomLeftRadius: '2px', lineHeight: '1.6' }}>
                          {msg.content}
                          {msg.attachments && (
                             <AttachmentDisplay 
                               attachments={msg.attachments} 
                               isOwn={false} 
                               onImageClick={setLightboxAttachment} 
                             />
                          )}
                        </div>
                        <span className="text-[10px] text-[#AAA49C] mt-1 ml-1">{formatTime(msg.timestamp)}</span>
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
        /* ... Expiry panel ... */
        <div className="shrink-0 bg-white p-5 flex flex-col items-center" style={{ borderTop: '2px solid #C0392B' }}>
          {/* ... celebrate ... */}
          <h3 className="text-[20px] font-[900] text-[#21201C] text-center">Challenge Complete! 🎉</h3>
          <p className="text-[14px] text-[#6B6860] text-center mt-1">{session.daysTotal} days. Done.</p>

          <div className="w-full grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-[12px] p-3" style={{ backgroundColor: '#FAF0EB', border: '1px solid #E6E2D9' }}>
              <span className="text-[10px] font-[800] text-[#6B6860] uppercase block">What you committed to</span>
              <p className="text-[12px] font-[600] text-[#21201C] mt-1" style={{ lineHeight: '1.5' }}>
                {session.participantCommitments[currentUserId]}
              </p>
            </div>
            <div className="rounded-[12px] p-3 bg-white" style={{ border: '1px solid #E6E2D9' }}>
              <span className="text-[10px] font-[800] text-[#6B6860] uppercase block">What {partnerName} committed to</span>
              <p className="text-[12px] font-[600] text-[#21201C] mt-1" style={{ lineHeight: '1.5' }}>
                {session.participantCommitments['participant_pair']}
              </p>
            </div>
          </div>

          {/* Reward Reveal Card */}
          {completionAsset?.enabled && completionAsset.fileName && (
            <div className="w-full mt-4 rounded-[12px] p-4 flex flex-col items-center gap-3 bg-[#FFFBEB] border border-[#FDE68A] animate-in slide-in-from-bottom-2">
              <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[24px]">
                🎁
              </div>
              <h4 className="text-[16px] font-[800] text-[#92400E] text-center">Bonus Reward Unlocked</h4>
              {completionAsset.unlockMessage && (
                <p className="text-[13px] font-[600] text-[#D97757] text-center" style={{ lineHeight: '1.5' }}>
                  "{completionAsset.unlockMessage}"
                </p>
              )}
              <button
                className="w-full h-[40px] rounded-[8px] bg-[#F59E0B] hover:bg-[#D97757] transition-colors text-white text-[13px] font-[800] flex items-center justify-center mt-1"
                onClick={() => alert('Downloading ' + completionAsset.fileName)}
              >
                Download {completionAsset.fileName} ({completionAsset.fileSize || 'FILE'})
              </button>
            </div>
          )}

          <button
            onClick={handleShare}
            className="w-full h-[48px] rounded-md bg-[#D97757] text-white text-[14px] font-[900] flex items-center justify-center mt-4"
          >
            Share your experience →
          </button>
        </div>
      ) : (
        /* Message input */
        <div className="shrink-0 bg-white flex flex-col" style={{ borderTop: '1px solid #E6E2D9', paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}>
          {/* Attachment Preview Strip */}
          {pendingAttachments.length > 0 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-[#FAF9F7]" style={{ borderBottom: '1px solid #E6E2D9' }}>
              {pendingAttachments.map((att, i) => (
                <div key={i} className="relative shrink-0 w-16 h-16 rounded-md bg-white border border-[#E6E2D9] flex items-center justify-center overflow-hidden">
                  {att.type === 'image' ? (
                    <img src={att.url || ''} className="w-full h-full object-cover" />
                  ) : att.type === 'video' ? (
                    <div className="relative w-full h-full bg-black/10 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#6B6860">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B6860" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <polyline points="13 2 13 9 20 9" />
                    </svg>
                  )}
                  <button 
                    onClick={() => removeAttachment(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px]"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 px-4 py-2.5">
            <button 
              onClick={() => setShowMediaPicker(true)}
              className="w-10 h-10 rounded-full bg-[#FAF9F7] border border-[#E6E2D9] flex items-center justify-center shrink-0"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97757" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${partnerName}...`}
              className="flex-1 min-h-[44px] max-h-[120px] rounded-md px-3 py-2.5 text-[14px] font-[600] resize-none"
              style={{
                border: '1px solid #E6E2D9',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#D97757';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E6E2D9';
              }}
            />

            <button
              onClick={handleSend}
              className="w-[44px] h-[44px] rounded-md flex items-center justify-center shrink-0 transition-opacity"
              style={{
                backgroundColor: '#D97757',
                opacity: (inputText.trim() || pendingAttachments.length > 0) ? 1 : 0.4,
              }}
              disabled={!inputText.trim() && pendingAttachments.length === 0}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Media Picker Sheet */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMediaPicker(false)} />
          <div className="relative bg-white rounded-t-[24px] p-4 pb-8 animate-slide-up">
            <div className="w-8 h-1 bg-[#E8E8E8] rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => handleAddAttachment('image')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-[#FAF9F7]"
              >
                <div className="w-12 h-12 rounded-full bg-[#FAF0EB] flex items-center justify-center text-[#D97757]">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                     <circle cx="8.5" cy="8.5" r="1.5" />
                     <polyline points="21 15 16 10 5 21" />
                   </svg>
                </div>
                <span className="text-[12px] font-[700]">Photo</span>
              </button>
              <button 
                onClick={() => handleAddAttachment('video')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-[#FAF9F7]"
              >
                <div className="w-12 h-12 rounded-full bg-[#EBF5EE] flex items-center justify-center text-[#417A55]">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <polygon points="23 7 16 12 23 17 23 7" />
                     <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                   </svg>
                </div>
                <span className="text-[12px] font-[700]">Video</span>
              </button>
              <button 
                onClick={() => handleAddAttachment('file')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-[#FAF9F7]"
              >
                <div className="w-12 h-12 rounded-full bg-[#F3F1EC] flex items-center justify-center text-[#6B6860]">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                     <polyline points="14 2 14 8 20 8" />
                     <line x1="16" y1="13" x2="8" y2="13" />
                     <line x1="16" y1="17" x2="8" y2="17" />
                     <polyline points="10 9 9 9 8 9" />
                   </svg>
                </div>
                <span className="text-[12px] font-[700]">File</span>
              </button>
            </div>
          </div>
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

      {/* Lightbox Viewer */}
      {lightboxAttachment && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black animate-fade-in">
          <header className="flex items-center justify-between px-4 h-[58px] shrink-0">
             <div className="flex flex-col">
               <span className="text-[14px] font-[700] text-white truncate max-w-[200px]">{lightboxAttachment.fileName}</span>
               <span className="text-[11px] font-[600] text-[#888]">{lightboxAttachment.fileSize}</span>
             </div>
             <button 
               onClick={() => setLightboxAttachment(null)}
               className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
             >✕</button>
          </header>
          <div className="flex-1 flex items-center justify-center p-4">
             {lightboxAttachment.type === 'image' ? (
               <img src={lightboxAttachment.url || ''} className="max-w-full max-h-full object-contain rounded-lg" />
             ) : (
               <video src={lightboxAttachment.url || ''} controls className="max-w-full max-h-full rounded-lg" autoPlay />
             )}
          </div>
          <footer className="p-6 pb-12 flex justify-center">
             <button 
               onClick={() => {
                 // Mock download
                 alert('Downloading attachment...');
                 setLightboxAttachment(null);
               }}
               className="h-[48px] px-8 rounded-md bg-white text-[#111] text-[14px] font-[900] flex items-center gap-2"
             >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                 <polyline points="7 10 12 15 17 10" />
                 <line x1="12" y1="15" x2="12" y2="3" />
               </svg>
               Download
             </button>
          </footer>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </div>
  );
};
