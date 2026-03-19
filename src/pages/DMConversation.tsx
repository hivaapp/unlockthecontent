import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessaging } from '../context/MessagingContext';
import type { DMMessage } from '../context/MessagingContext';
import { BottomSheet } from '../components/ui/BottomSheet';
import { useToast } from '../context/ToastContext';
import { MessagesSidebar } from './MyChatsHub';
import { supabase } from '../lib/supabase';
import { getConversationMessages } from '../services/messageService';

// Chat media sharing
import { ChatMediaButton, ChatUploadPreview, ChatMediaContent, ChatMediaLightbox, ChatExpiryBanner } from '../components/chats';
import { uploadChatMedia, deleteChatUpload } from '../services/chatUploadService';
import type { ChatUploadResult } from '../services/chatUploadService';
import { validateChatFile, getMediaCategory, clearPendingUpload } from '../utils/chatMediaHelpers';
import type { MediaCategory } from '../utils/chatMediaHelpers';

interface MediaAttachment {
  type: 'image' | 'video' | 'file';
  url: string | null;
  fileName: string;
  fileSize?: string;
  isPlaceholder?: boolean;
}

export const DMConversation = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { conversations, sendMessage, markConversationRead, removeConversation } = useMessaging();
  const { showToast } = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [inputText, setInputText] = useState('');
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MediaAttachment[]>([]);
  const [isTyping] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [messages, setMessages] = useState<DMMessage[]>([]);

  // Media sharing state
  const [mediaUploadResult, setMediaUploadResult] = useState<ChatUploadResult | null>(null);
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [mediaUploadComplete, setMediaUploadComplete] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [mediaPreviewFile, setMediaPreviewFile] = useState<{ name: string; size: number; category: MediaCategory; thumbnailUrl: string | null } | null>(null);
  const [mediaLightbox, setMediaLightbox] = useState<{ cdnUrl: string; fileName: string; type: 'image' | 'video' } | null>(null);
  const mediaAbortRef = useRef<AbortController | null>(null);
  const isProUser = (currentUser as any)?.is_pro || false;

  const conversation = conversations.find(c => c.conversationId === conversationId);
  
  // Find the other participant
  const otherParticipant = conversation?.participants.find(p => p.id !== currentUser?.id);
  const partnerName = otherParticipant?.name || 'User';
  const partnerInitial = otherParticipant?.initial || 'U';
  const partnerColor = otherParticipant?.avatarColor || '#2563EB';

  useEffect(() => {
    if (!currentUser || !conversationId) return;
    
    // Fetch initial messages
    getConversationMessages(conversationId).then(dbMsgs => {
      const parsedMsgs: DMMessage[] = dbMsgs.map((m: any) => ({
        messageId: m.id,
        senderId: m.sender_id,
        content: m.content || '',
        timestamp: m.created_at,
        type: 'text',
        isOpeningMessage: m.is_opening_message,
        message_type: m.message_type || 'text',
        media_r2_key: m.media_r2_key || null,
        media_thumbnail_r2_key: m.media_thumbnail_r2_key || null,
        media_original_name: m.media_original_name || null,
        media_mime_type: m.media_mime_type || null,
        media_size_bytes: m.media_size_bytes || null,
        media_category: m.media_category || null,
        is_pro_storage: m.is_pro_storage || false,
      }));
      setMessages(parsedMsgs);
      scrollToBottom();
    });

    // Mark as read
    markConversationRead(conversationId);
  }, [conversationId, currentUser, markConversationRead]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`public:direct_messages:chat_${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const m = payload.new as any;
        setMessages(prev => {
          if (prev.find(x => x.messageId === m.id)) return prev;
          return [...prev, {
            messageId: m.id,
            senderId: m.sender_id,
            content: m.content || '',
            timestamp: m.created_at,
            type: 'text',
            isOpeningMessage: m.is_opening_message,
            // Media sharing fields
            message_type: m.message_type || 'text',
            media_r2_key: m.media_r2_key || null,
            media_thumbnail_r2_key: m.media_thumbnail_r2_key || null,
            media_original_name: m.media_original_name || null,
            media_mime_type: m.media_mime_type || null,
            media_size_bytes: m.media_size_bytes || null,
            media_category: m.media_category || null,
            is_pro_storage: m.is_pro_storage || false,
          }];
        });
        scrollToBottom();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSend = async () => {
    const hasText = inputText.trim().length > 0;
    const hasMedia = mediaUploadComplete && mediaUploadResult;
    if ((!hasText && !hasMedia && pendingAttachments.length === 0) || !currentUser || !conversationId) return;
    
    const content = inputText.trim() || (hasMedia ? null : 'Sent an attachment');
    setInputText('');
    setPendingAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }

    // Build media fields if applicable
    let mediaFields: any = undefined;
    if (hasMedia && mediaUploadResult) {
      const cat = mediaUploadResult.mediaCategory;
      mediaFields = {
        messageType: hasText ? 'mixed' : cat,
        mediaR2Key: mediaUploadResult.mainR2Key,
        mediaThumbnailR2Key: mediaUploadResult.thumbnailR2Key,
        mediaOriginalName: mediaUploadResult.originalName,
        mediaMimeType: mediaUploadResult.originalMimeType,
        mediaSizeBytes: mediaUploadResult.originalSizeBytes,
        mediaCategory: mediaUploadResult.mediaCategory,
        isProStorage: mediaUploadResult.isPro,
      };

      const fileIds = [mediaUploadResult.mainFileId];
      if (mediaUploadResult.thumbnailFileId) fileIds.push(mediaUploadResult.thumbnailFileId);
      clearPendingUpload(fileIds);
    }

    // Reset media state
    setMediaUploadResult(null);
    setMediaUploadComplete(false);
    setMediaUploadProgress(0);
    setMediaUploadError(null);
    if (mediaPreviewFile?.thumbnailUrl) URL.revokeObjectURL(mediaPreviewFile.thumbnailUrl);
    setMediaPreviewFile(null);

    try {
        await sendMessage(conversationId, content || '', currentUser.id, mediaFields);
    } catch (err) {
        console.error('Failed to send message', err);
        showToast('Failed to send message', 'error');
    }
  };

  // ── Chat media file selection handler ──────────────────────────────────
  const handleMediaFileSelected = async (file: File) => {
    const validation = validateChatFile(file, isProUser);
    if (!validation.valid) {
      setMediaUploadError(validation.error);
      return;
    }

    const category = getMediaCategory(file.type) || 'document';
    const thumbnailUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

    setMediaPreviewFile({ name: file.name, size: file.size, category, thumbnailUrl });
    setMediaUploadProgress(0);
    setMediaUploadComplete(false);
    setMediaUploadError(null);
    setMediaUploadResult(null);
    setShowMediaPicker(false);

    const abortController = new AbortController();
    mediaAbortRef.current = abortController;

    try {
      const result = await uploadChatMedia(file, {
        onProgress: (pct) => setMediaUploadProgress(pct),
        onStageChange: () => {},
        signal: abortController.signal,
      });
      setMediaUploadResult(result);
      setMediaUploadComplete(true);
    } catch (err: any) {
      if (err.message === 'Upload cancelled.') return;
      console.error('Chat media upload failed:', err);
      setMediaUploadError(err.message || 'Upload failed');
    } finally {
      mediaAbortRef.current = null;
    }
  };

  const handleCancelMediaUpload = () => {
    mediaAbortRef.current?.abort();
    mediaAbortRef.current = null;
    if (mediaUploadResult) {
      const fileIds = [mediaUploadResult.mainFileId];
      if (mediaUploadResult.thumbnailFileId) fileIds.push(mediaUploadResult.thumbnailFileId);
      deleteChatUpload(fileIds).catch(console.error);
    }
    if (mediaPreviewFile?.thumbnailUrl) URL.revokeObjectURL(mediaPreviewFile.thumbnailUrl);
    setMediaUploadResult(null);
    setMediaUploadComplete(false);
    setMediaUploadProgress(0);
    setMediaUploadError(null);
    setMediaPreviewFile(null);
  };

  const handleOpenMediaLightbox = (cdnUrl: string, fileName: string) => {
    const mimeGuess = fileName.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image';
    setMediaLightbox({ cdnUrl, fileName, type: mimeGuess as 'image' | 'video' });
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
      fileName: type === 'file' ? 'Document.pdf' : `Media_${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`,
      fileSize: type === 'file' ? '1.2 MB' : '4.5 MB',
      isPlaceholder: true
    };
    
    setPendingAttachments(prev => [...prev, newAttachment]);
    setShowMediaPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  const handleBlockUser = () => {
    if (conversationId) {
        removeConversation(conversationId);
        showToast(`${partnerName} has been blocked.`, 'success');
        navigate('/chats');
    }
  };

  if (!currentUser || !conversation) {
      return (
          <div className="min-h-screen bg-bg flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; msgs: DMMessage[] }[]>((acc, msg) => {
    const dateStr = formatDate(msg.timestamp);
    const last = acc[acc.length - 1];
    if (last && last.date === dateStr) {
      last.msgs.push(msg);
    } else {
      acc.push({ date: dateStr, msgs: [msg] });
    }
    return acc;
  }, []);

  return (
    <div className="flex w-full bg-bg overflow-hidden h-[calc(100dvh-128px)] md:h-[calc(100vh-64px)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col w-[380px] shrink-0 border-r border-border z-10 overflow-hidden">
         <MessagesSidebar 
            activeTab="chats" 
            setActiveTab={(tab) => { navigate(`/chats`, { state: { activeTab: tab } }); }} 
            activeChatId={conversationId} 
            onSelectChat={(id, type) => {
                if (type === 'dm') navigate(`/messages/${id}`);
                if (type === 'pairing') navigate(`/chats/${id}`);
            }}
         />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-bg relative">
      {/* Header */}
      <header className="shrink-0 h-[58px] bg-white flex items-center justify-between px-4 border-b border-border z-10">
        <button onClick={() => { window.history.length > 1 ? navigate(-1) : navigate('/chats'); }} className="flex items-center gap-1.5 shrink-0 hover:text-text transition-colors" style={{ width: '80px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M14 5L8 11L14 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="font-extrabold text-[13px] tracking-tight text-text">Back</span>
        </button>

        <div 
          className="flex items-center gap-2 justify-center cursor-pointer hover:bg-surfaceAlt px-2 py-1 rounded-full transition-colors"
          onClick={() => setShowInfoSheet(true)}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: partnerColor }}>
            <span className="text-[13px] font-black text-white">{partnerInitial}</span>
          </div>
          <span className="text-[15px] font-extrabold text-text flex items-center gap-1">
              {partnerName}
              {otherParticipant?.isCreator && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#2563EB" className="shrink-0">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
              )}
          </span>
        </div>

        <button
          onClick={() => setShowInfoSheet(true)}
          className="w-[44px] h-[44px] flex items-center justify-end shrink-0 hover:text-text"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <circle cx="10" cy="10" r="9" strokeWidth="1.5"/>
            <path d="M10 9V14M10 7V6" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </header>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide bg-[#FAF9F7]">
        {groupedMessages.map((group, gi) => (
            <div key={gi}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] font-bold text-textLight">{group.date}</span>
                <div className="flex-1 h-px bg-border" />
            </div>

            {group.msgs.map((msg) => {
                const isOwn = msg.senderId === currentUser.id;
                const isOpeningMsg = msg.isOpeningMessage;
                
                return (
                <div key={msg.messageId} className={`flex flex-col mb-4 ${isOwn ? 'items-end' : 'items-start'}`}>
                    {isOpeningMsg && (
                         <div className="bg-surfaceAlt px-3 py-1 rounded-full text-[10px] font-bold text-textMid mb-2 mx-auto uppercase tracking-wide border border-border">
                             Opening Message
                         </div>
                    )}
                    <div className="flex gap-2 items-end max-w-[85%]">
                        {!isOwn && (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-1" style={{ backgroundColor: partnerColor }}>
                                <span className="text-[10px] font-black text-white">{partnerInitial}</span>
                            </div>
                        )}
                        <div 
                            className={`rounded-[16px] px-4 py-3 text-[14px] font-semibold leading-relaxed
                                ${isOwn 
                                    ? 'bg-brand text-white rounded-br-[4px]' 
                                    : 'bg-white text-text border border-border shadow-sm rounded-bl-[4px]'
                                }
                            `}
                        >
                            {msg.content && <div style={{ marginBottom: msg.media_r2_key ? '8px' : '0' }}>{msg.content}</div>}
                            {msg.media_r2_key && msg.media_category && (
                              <ChatMediaContent
                                message={{
                                  media_r2_key: msg.media_r2_key,
                                  media_thumbnail_r2_key: msg.media_thumbnail_r2_key,
                                  media_original_name: msg.media_original_name || 'File',
                                  media_mime_type: msg.media_mime_type || undefined,
                                  media_size_bytes: msg.media_size_bytes || 0,
                                  media_category: msg.media_category,
                                  is_pro_storage: msg.is_pro_storage || false,
                                  created_at: msg.timestamp,
                                }}
                                onOpenLightbox={handleOpenMediaLightbox}
                              />
                            )}
                            {!msg.content && !msg.media_r2_key && msg.content}
                        </div>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 font-bold text-[10px] text-textLight ${isOwn ? 'mr-1' : 'ml-9'}`}>
                        {formatTime(msg.timestamp)}
                        {isOwn && <span className="ml-1 text-brand">✓✓</span>}
                    </div>
                </div>
                );
            })}
            </div>
        ))}
        {isTyping && (
             <div className="flex gap-2 items-end max-w-[85%] mb-4 animate-fadeIn">
                 <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-1" style={{ backgroundColor: partnerColor }}>
                     <span className="text-[10px] font-black text-white">{partnerInitial}</span>
                 </div>
                 <div className="rounded-[16px] rounded-bl-[4px] px-4 py-3 bg-white border border-border shadow-sm flex items-center gap-1.5 h-[44px]">
                     <div className="w-1.5 h-1.5 bg-textLight rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                     <div className="w-1.5 h-1.5 bg-textLight rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                     <div className="w-1.5 h-1.5 bg-textLight rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Message input */}
      <div className="shrink-0 bg-white flex flex-col border-t border-border pb-[env(safe-area-inset-bottom,16px)]">
        {/* Free plan media expiry banner */}
        <ChatExpiryBanner
          chatId={conversationId || ''}
          hasFreePlanMedia={messages.some(m => m.media_r2_key && !m.is_pro_storage)}
          isProUser={isProUser}
        />

        {/* Attachment Preview Strip */}
        {pendingAttachments.length > 0 && (
          <div className="flex gap-2 p-3 overflow-x-auto bg-surfaceAlt border-b border-border scrollbar-hide">
            {pendingAttachments.map((att, i) => (
              <div key={i} className="relative shrink-0 w-16 h-16 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden">
                {att.type === 'image' ? (
                  <img src={att.url || ''} className="w-full h-full object-cover" alt="attachment" />
                ) : (
                  <span className="text-[24px]">📄</span>
                )}
                <button 
                  onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] backdrop-blur-sm"
                >✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Media upload preview card */}
        {mediaPreviewFile && (
          <ChatUploadPreview
            fileName={mediaPreviewFile.name}
            fileSize={mediaPreviewFile.size}
            mediaCategory={mediaPreviewFile.category}
            thumbnailUrl={mediaPreviewFile.thumbnailUrl}
            progress={mediaUploadProgress}
            isComplete={mediaUploadComplete}
            error={mediaUploadError}
            onCancel={handleCancelMediaUpload}
          />
        )}

        <div className="flex items-end gap-2 px-4 py-3">
          <ChatMediaButton
            onFileSelected={handleMediaFileSelected}
            disabled={!!mediaPreviewFile && !mediaUploadComplete}
          />

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = '44px';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${partnerName}...`}
            className="flex-1 min-h-[44px] max-h-[120px] rounded-[22px] px-4 py-[11px] text-[15px] font-semibold resize-none bg-surfaceAlt border border-transparent focus:border-brand/30 focus:bg-white transition-all outline-none"
            style={{ scrollbarWidth: 'none' }}
          />

          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !(mediaUploadComplete && mediaUploadResult) && pendingAttachments.length === 0) || (!!mediaPreviewFile && !mediaUploadComplete && !mediaUploadError)}
            className={`w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 transition-all ${
                (inputText.trim() || (mediaUploadComplete && mediaUploadResult) || pendingAttachments.length > 0)
                ? 'bg-brand text-white shadow-sm hover:scale-105 active:scale-95'
                : 'bg-surfaceAlt text-textLight cursor-not-allowed'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Profile Info Bottom Sheet */}
      <BottomSheet 
        isOpen={showInfoSheet} 
        onClose={() => setShowInfoSheet(false)} 
        title="Details"
      >
        <div className="flex flex-col items-center pt-2 pb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: partnerColor }}>
                <span className="text-[32px] font-black text-white">{partnerInitial}</span>
            </div>
            <h3 className="text-[20px] font-black text-text flex items-center gap-1.5">
                {partnerName}
                {otherParticipant?.isCreator && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#2563EB" className="shrink-0">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                )}
            </h3>
            <span className="text-[14px] font-bold text-textMid mt-0.5">@{otherParticipant?.username || partnerName.toLowerCase().replace(/\s+/g, '')}</span>
            
            {otherParticipant?.bio && (
                <p className="text-[14px] font-medium text-text mt-4 text-center max-w-[280px]">
                    {otherParticipant.bio}
                </p>
            )}

            <div className="w-full grid grid-cols-2 gap-3 mt-6">
                <div className="bg-surfaceAlt rounded-[16px] p-3 text-center border border-border">
                    <span className="text-[11px] font-bold text-textMid uppercase block mb-1">Trust Score</span>
                    <div className="text-[18px] font-black text-success">⭐ {otherParticipant?.trustScore || 85}</div>
                </div>
                <div className="bg-surfaceAlt rounded-[16px] p-3 text-center border border-border">
                    <span className="text-[11px] font-bold text-textMid uppercase block mb-1">Joined</span>
                    <div className="text-[15px] font-bold text-text mt-0.5">{otherParticipant?.joinedDate ? new Date(otherParticipant.joinedDate).getFullYear() : '2024'}</div>
                </div>
            </div>

            <div className="w-full flex flex-col gap-2 mt-6">
                <button 
                    onClick={() => {
                        setShowInfoSheet(false);
                        navigate(`/@${otherParticipant?.username || partnerName.toLowerCase().replace(/\s+/g, '')}`);
                    }}
                    className="w-full h-12 bg-surfaceAlt hover:bg-border text-text font-black text-[14px] rounded-[14px] transition-colors"
                >
                    View Profile
                </button>
                <button 
                    onClick={() => {
                        setShowInfoSheet(false);
                        setShowBlockConfirm(true);
                    }}
                    className="w-full h-12 bg-errorBg text-error font-black text-[14px] rounded-[14px] transition-colors mt-2"
                >
                    Block User
                </button>
            </div>
        </div>
      </BottomSheet>

      {/* Block Confirmation */}
      <BottomSheet 
          isOpen={showBlockConfirm} 
          onClose={() => setShowBlockConfirm(false)} 
          title="Block User?"
      >
          <div className="flex flex-col items-center pt-2 pb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-errorBg text-error flex items-center justify-center text-[28px] mb-4">
                  🚫
              </div>
              <p className="text-[15px] font-bold text-text mb-6">
                  Are you sure you want to block {partnerName}? They will not be able to send you messages or view your profile. This conversation will be removed.
              </p>
              <div className="w-full flex gap-3">
                  <button 
                      onClick={() => setShowBlockConfirm(false)}
                      className="flex-1 h-12 bg-surfaceAlt text-text font-black text-[14px] rounded-[14px]"
                  >
                      Cancel
                  </button>
                  <button 
                      onClick={handleBlockUser}
                      className="flex-1 h-12 bg-error text-white font-black text-[14px] rounded-[14px]"
                  >
                      Block User
                  </button>
              </div>
          </div>
      </BottomSheet>

      {/* Media Picker Sheet - simplified version */}
      <BottomSheet isOpen={showMediaPicker} onClose={() => setShowMediaPicker(false)} title="Attach Media">
            <div className="grid grid-cols-3 gap-4 pb-6 pt-2">
              <button 
                onClick={() => handleAddAttachment('image')}
                className="flex flex-col items-center gap-2 p-4 rounded-[16px] hover:bg-surfaceAlt transition-colors border border-transparent hover:border-border"
              >
                <div className="w-14 h-14 rounded-full bg-brandTint flex items-center justify-center text-brand">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                     <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                     <circle cx="8.5" cy="8.5" r="1.5" />
                     <polyline points="21 15 16 10 5 21" />
                   </svg>
                </div>
                <span className="text-[13px] font-bold text-text">Photo</span>
              </button>
              <button 
                onClick={() => handleAddAttachment('video')}
                className="flex flex-col items-center gap-2 p-4 rounded-[16px] hover:bg-surfaceAlt transition-colors border border-transparent hover:border-border"
              >
                <div className="w-14 h-14 rounded-full bg-successBg flex items-center justify-center text-success">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                     <polygon points="23 7 16 12 23 17 23 7" />
                     <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                   </svg>
                </div>
                <span className="text-[13px] font-bold text-text">Video</span>
              </button>
              <button 
                onClick={() => handleAddAttachment('file')}
                className="flex flex-col items-center gap-2 p-4 rounded-[16px] hover:bg-surfaceAlt transition-colors border border-transparent hover:border-border"
              >
                <div className="w-14 h-14 rounded-full bg-surfaceAlt flex items-center justify-center text-textMid border border-border">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                     <polyline points="14 2 14 8 20 8" />
                     <line x1="16" y1="13" x2="8" y2="13" />
                     <line x1="16" y1="17" x2="8" y2="17" />
                     <polyline points="10 9 9 9 8 9" />
                   </svg>
                </div>
                <span className="text-[13px] font-bold text-text">File</span>
              </button>
            </div>
      </BottomSheet>

      {/* Chat Media Lightbox */}
      {mediaLightbox && (
        <ChatMediaLightbox
          cdnUrl={mediaLightbox.cdnUrl}
          fileName={mediaLightbox.fileName}
          type={mediaLightbox.type}
          onClose={() => setMediaLightbox(null)}
        />
      )}
      </div>
    </div>
  );
};
