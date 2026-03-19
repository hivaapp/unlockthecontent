import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatSessions } from '../context/ChatSessionsContext';
import { getAvatarColor } from '../lib/utils';
import { MessagesSidebar } from './MyChatsHub';
import {
  getSession,
  getSessionMessages,
  sendMessage as sendChatMessage,
  markMessagesRead,
  subscribeToMessages,
  subscribeToSessionUpdates,
  reportPartner,
  updateLastActive,
  deliverScheduledMessages,
  getCompletionAssetUrl,
} from '../services/followerPairingService';
import type { PairingSession, PairingMessage } from '../services/followerPairingService';
import { uploadFile } from '../services/uploadService';
import { TrustScoreBadge } from '../components/shared/TrustScoreBadge';
import { supabase } from '../lib/supabase';

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

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderInitial: string;
  type: 'private' | 'broadcast' | 'scheduled' | 'reward_reveal';
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: MediaAttachment[];
  links?: { url: string; title: string }[] | null;
  youtubeUrl?: string | null;
  dayNumber?: number;
  sendTime?: string;
  completionAssetId?: string | null;
  // Media sharing fields
  messageType?: string;
  media_r2_key?: string | null;
  media_thumbnail_r2_key?: string | null;
  media_original_name?: string | null;
  media_mime_type?: string | null;
  media_size_bytes?: number | null;
  media_category?: string | null;
  is_pro_storage?: boolean;
}

interface CompletionAssetData {
  id: string;
  file_id: string | null;
  unlock_message: string | null;
  links: { url: string; title: string }[];
  youtube_url: string | null;
  resource_title: string | null;
  resource_description: string | null;
  file?: {
    id: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    r2_key: string;
    r2_bucket: string;
  } | null;
}

// Convert Supabase PairingMessage to local ChatMessage
const toLocalMessage = (msg: PairingMessage, currentUserId: string): ChatMessage => {
  // Determine message type
  let msgType: 'private' | 'broadcast' | 'scheduled' | 'reward_reveal' = 'private';
  if (msg.message_type === 'reward_reveal') {
    msgType = 'reward_reveal';
  } else if (msg.message_type === 'scheduled') {
    msgType = 'scheduled';
  } else if (msg.is_broadcast) {
    msgType = 'broadcast';
  }

  // Parse links from JSONB
  let parsedLinks = msg.links;
  if (typeof msg.links === 'string') {
    try { parsedLinks = JSON.parse(msg.links); } catch { parsedLinks = []; }
  }

  return {
    id: msg.id,
    senderId: msg.sender_id,
    senderName: msg.sender?.name || 'Unknown',
    senderInitial: msg.sender?.initial || msg.sender?.name?.[0] || '?',
    type: msgType,
    content: msg.content || '',
    timestamp: msg.created_at,
    isRead: msg.is_read || msg.sender_id === currentUserId,
    links: Array.isArray(parsedLinks) && parsedLinks.length > 0 ? parsedLinks : null,
    youtubeUrl: msg.youtube_url || null,
    dayNumber: msg.scheduled_message?.day_number,
    sendTime: msg.scheduled_message?.send_time,
    completionAssetId: msg.message_type === 'reward_reveal' ? (msg.content || null) : null,
    attachments: msg.file ? [{
      type: msg.file.mime_type?.startsWith('image/') ? 'image' as const
          : msg.file.mime_type?.startsWith('video/') ? 'video' as const
          : 'file' as const,
      url: null,
      fileName: msg.file.original_name,
      fileSize: formatBytes(msg.file.size_bytes),
    }] : undefined,
    // Media sharing fields
    messageType: (msg as any).message_type || 'text',
    media_r2_key: (msg as any).media_r2_key || null,
    media_thumbnail_r2_key: (msg as any).media_thumbnail_r2_key || null,
    media_original_name: (msg as any).media_original_name || null,
    media_mime_type: (msg as any).media_mime_type || null,
    media_size_bytes: (msg as any).media_size_bytes || null,
    media_category: (msg as any).media_category || null,
    is_pro_storage: (msg as any).is_pro_storage || false,
  };
};

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Helper to reliably get a domain name
const getDomainName = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const getDomainInitial = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    const base = hostname.replace(/^www\./, '');
    return base.charAt(0).toUpperCase();
  } catch {
    return url.charAt(0).toUpperCase();
  }
};

const getDomainColor = (url: string) => {
  const colors = ['#E8312A', '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = url.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const FollowerPairingChat = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, currentUser } = useAuth();
  const { markSessionRead } = useChatSessions();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showNewMsgIndicator, setShowNewMsgIndicator] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MediaAttachment[]>([]);
  const [lightboxAttachment, setLightboxAttachment] = useState<MediaAttachment | null>(null);
  const [showChangePartnerConfirm, setShowChangePartnerConfirm] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isRematching, setIsRematching] = useState(false);
  const [session, setSession] = useState<PairingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [rewardAssets, setRewardAssets] = useState<Record<string, CompletionAssetData>>({});
  const [downloadingReward, setDownloadingReward] = useState(false);

  // ── Chat media sharing state ──────────────────────────────────────────
  const [mediaUploadResult, setMediaUploadResult] = useState<ChatUploadResult | null>(null);
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [mediaUploadComplete, setMediaUploadComplete] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [mediaPreviewFile, setMediaPreviewFile] = useState<{ name: string; size: number; category: MediaCategory; thumbnailUrl: string | null } | null>(null);
  const [mediaLightbox, setMediaLightbox] = useState<{ cdnUrl: string; fileName: string; type: 'image' | 'video' } | null>(null);
  const mediaAbortRef = useRef<AbortController | null>(null);
  const isProUser = (currentUser as any)?.is_pro || false;

  const [resolvedUserId, setResolvedUserId] = useState('');

  // Resolve user ID from AuthContext or Supabase session
  useEffect(() => {
    if (currentUser?.id) {
      setResolvedUserId(currentUser.id);
      return;
    }
    // If currentUser hasn't loaded yet, get ID directly from Supabase session
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      if (authSession?.user?.id) {
        setResolvedUserId(authSession.user.id);
      }
    });
  }, [currentUser]);

  const currentUserId = resolvedUserId;

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn) {
      navigate(`/?redirect=/chats/${sessionId}`, { replace: true });
    }
  }, [isLoggedIn, navigate, sessionId]);

  // Load session and messages
  useEffect(() => {
    if (!sessionId || !currentUserId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const sessionData = await getSession(sessionId);
        if (!sessionData) {
          navigate('/chats', { replace: true });
          return;
        }
        setSession(sessionData);

        // Check expiry
        if (sessionData.status === 'expired' || sessionData.status === 'completed' || new Date(sessionData.expires_at) <= new Date()) {
          setIsExpired(true);
        }

        // Load messages
        const msgs = await getSessionMessages(sessionId);
        setMessages(msgs.map(m => toLocalMessage(m, currentUserId)));

        // Mark as read
        await markMessagesRead(sessionId, currentUserId);
        markSessionRead(sessionId);

        // Fire-and-forget: deliver any scheduled/reward messages that are due
        // The Realtime subscription will pick up any newly inserted messages
        if (sessionData.status === 'active') {
          deliverScheduledMessages(sessionId, currentUserId).catch(console.error);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, currentUserId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!sessionId) return;

    const channel = subscribeToMessages(sessionId, (newMsg: PairingMessage) => {
      const localMsg = toLocalMessage(newMsg, currentUserId);
      setMessages(prev => {
        // Prevent duplicates
        if (prev.some(m => m.id === localMsg.id)) return prev;
        return [...prev, localMsg];
      });

      // If message is from partner, show indicator
      if (newMsg.sender_id !== currentUserId) {
        setShowNewMsgIndicator(true);
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, currentUserId]);

  // Subscribe to session status changes
  useEffect(() => {
    if (!sessionId) return;

    const channel = subscribeToSessionUpdates(sessionId, (updated: any) => {
      setSession(prev => prev ? { ...prev, ...updated } : prev);
      if (updated.status === 'expired' || updated.status === 'completed') {
        setIsExpired(true);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Update last active periodically
  useEffect(() => {
    if (!sessionId || !currentUserId) return;

    // Get participant ID from session
    const myParticipantId = session?.participant_a?.user_id === currentUserId
      ? session?.participant_a_id
      : session?.participant_b?.user_id === currentUserId
        ? session?.participant_b_id
        : null;

    if (!myParticipantId) return;

    const interval = setInterval(() => {
      updateLastActive(myParticipantId);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [sessionId, currentUserId, session]);

  // Fetch completion asset data when reward_reveal messages appear
  useEffect(() => {
    const rewardMsgs = messages.filter(m => m.type === 'reward_reveal' && m.completionAssetId);
    if (rewardMsgs.length === 0) return;

    const fetchAssets = async () => {
      for (const msg of rewardMsgs) {
        if (!msg.completionAssetId || rewardAssets[msg.completionAssetId]) continue;
        try {
          const { data, error } = await supabase
            .from('completion_assets')
            .select(`
              id,
              file_id,
              unlock_message,
              links,
              youtube_url,
              resource_title,
              resource_description,
              file:files (
                id, original_name, mime_type, size_bytes, r2_key, r2_bucket
              )
            `)
            .eq('id', msg.completionAssetId)
            .maybeSingle();

          if (!error && data) {
            // Supabase returns joined relations as arrays — normalize file to single object
            const normalized = {
              ...data,
              file: Array.isArray(data.file) ? data.file[0] || null : data.file,
            } as CompletionAssetData;
            setRewardAssets(prev => ({ ...prev, [data.id]: normalized }));
          }
        } catch (err) {
          console.error('Failed to fetch completion asset:', err);
        }
      }
    };

    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Scroll on mount
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Derive partner info from session
  const getPartnerInfo = useCallback(() => {
    if (!session || !currentUserId) return { name: 'Partner', initial: '?', color: '#6B6860', userId: '', commitment: '', participantId: '' };

    const isA = session.participant_a?.user_id === currentUserId;
    const partner = isA ? session.participant_b : session.participant_a;
    const partnerUser = partner?.user;

    return {
      name: partnerUser?.name || 'Partner',
      initial: partnerUser?.initial || partnerUser?.name?.[0] || '?',
      color: partnerUser?.avatar_color || '#2563EB',
      userId: partner?.user_id || '',
      commitment: partner?.commitment_text || '',
      participantId: partner?.id || '',
      trustScore: partnerUser?.trust_score,
    };
  }, [session, currentUserId]);

  const getMyInfo = useCallback(() => {
    if (!session || !currentUserId) return { commitment: '', participantId: '' };
    const isA = session.participant_a?.user_id === currentUserId;
    const me = isA ? session.participant_a : session.participant_b;
    return {
      commitment: me?.commitment_text || '',
      participantId: me?.id || '',
    };
  }, [session, currentUserId]);

  const partner = getPartnerInfo();
  const myInfo = getMyInfo();
  const partnerName = partner.name;
  const partnerInitial = partner.initial;
  const partnerColor = partner.color;

  // Get creator info from session link
  const creatorName = 'Creator';
  const creatorColor = getAvatarColor('creator');

  // Calculate day count
  const pairedAt = session ? new Date(session.paired_at) : new Date();
  const now = new Date();
  const daysPassed = Math.max(1, Math.ceil((now.getTime() - pairedAt.getTime()) / (1000 * 60 * 60 * 24)));
  const hoursElapsed = Math.floor((now.getTime() - pairedAt.getTime()) / (1000 * 60 * 60));
  const daysTotal = session ? Math.ceil((new Date(session.expires_at).getTime() - pairedAt.getTime()) / (1000 * 60 * 60 * 24)) : 14;
  const progressPercent = Math.min(100, (daysPassed / daysTotal) * 100);

  // Count unread
  useEffect(() => {
    const count = messages.filter(m => !m.isRead && m.senderId !== currentUserId).length;
    setUnreadCount(count);
    if (count > 0) setShowNewMsgIndicator(true);
  }, [messages, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMsgIndicator(false);
    // Mark all as read in state
    setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    if (sessionId && currentUserId) {
      markMessagesRead(sessionId, currentUserId);
    }
  };

  const handleSend = async () => {
    const hasText = inputText.trim().length > 0;
    const hasMedia = mediaUploadComplete && mediaUploadResult;
    if ((!hasText && !hasMedia && pendingAttachments.length === 0) || isSending || !sessionId || !currentUserId) return;

    setIsSending(true);
    try {
      // Determine message_type
      let messageType = 'text';
      let mediaFields: Record<string, unknown> = {};

      if (hasMedia && mediaUploadResult) {
        const cat = mediaUploadResult.mediaCategory;
        messageType = hasText ? 'mixed' : cat;
        mediaFields = {
          messageType,
          mediaR2Key: mediaUploadResult.mainR2Key,
          mediaThumbnailR2Key: mediaUploadResult.thumbnailR2Key,
          mediaOriginalName: mediaUploadResult.originalName,
          mediaMimeType: mediaUploadResult.originalMimeType,
          mediaSizeBytes: mediaUploadResult.originalSizeBytes,
          mediaCategory: mediaUploadResult.mediaCategory,
          isProStorage: mediaUploadResult.isPro,
        };

        // Clear orphan tracking — file is now referenced by a message
        const fileIds = [mediaUploadResult.mainFileId];
        if (mediaUploadResult.thumbnailFileId) fileIds.push(mediaUploadResult.thumbnailFileId);
        clearPendingUpload(fileIds);
      }

      // Legacy file attachments support
      let fileId: string | null = null;
      if (pendingAttachments.length > 0 && !hasMedia) {
        // TODO: legacy upload path
      }

      const msg = await sendChatMessage({
        sessionId,
        senderId: currentUserId,
        content: inputText.trim() || null,
        fileId,
        ...mediaFields,
      });

      // Add to local state immediately
      const localMsg = toLocalMessage(msg, currentUserId);
      setMessages(prev => {
        if (prev.some(m => m.id === localMsg.id)) return prev;
        return [...prev, localMsg];
      });

      // Clear composer
      setInputText('');
      setPendingAttachments([]);
      setMediaUploadResult(null);
      setMediaUploadComplete(false);
      setMediaUploadProgress(0);
      setMediaUploadError(null);
      setMediaPreviewFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // ── Chat media file selection handler ──────────────────────────────────
  const handleMediaFileSelected = async (file: File) => {
    // Client-side validation
    const validation = validateChatFile(file, isProUser);
    if (!validation.valid) {
      setMediaUploadError(validation.error);
      return;
    }

    const category = getMediaCategory(file.type) || 'document';
    const thumbnailUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

    // Set preview immediately
    setMediaPreviewFile({ name: file.name, size: file.size, category, thumbnailUrl });
    setMediaUploadProgress(0);
    setMediaUploadComplete(false);
    setMediaUploadError(null);
    setMediaUploadResult(null);
    setShowMediaPicker(false);

    // Create abort controller
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
      if (err.message === 'Upload cancelled.') {
        // User cancelled — preview already cleared by handleCancelMediaUpload
        return;
      }
      console.error('Chat media upload failed:', err);
      setMediaUploadError(err.message || 'Upload failed');
    } finally {
      mediaAbortRef.current = null;
    }
  };

  const handleCancelMediaUpload = () => {
    // Abort in-progress upload
    mediaAbortRef.current?.abort();
    mediaAbortRef.current = null;

    // If upload already completed, clean up R2 files
    if (mediaUploadResult) {
      const fileIds = [mediaUploadResult.mainFileId];
      if (mediaUploadResult.thumbnailFileId) fileIds.push(mediaUploadResult.thumbnailFileId);
      deleteChatUpload(fileIds).catch(console.error);
    }

    // Revoke thumbnail URL
    if (mediaPreviewFile?.thumbnailUrl) {
      URL.revokeObjectURL(mediaPreviewFile.thumbnailUrl);
    }

    // Reset all media state
    setMediaUploadResult(null);
    setMediaUploadComplete(false);
    setMediaUploadProgress(0);
    setMediaUploadError(null);
    setMediaPreviewFile(null);
  };

  // ── Lightbox handlers for media messages ────────────────────────────
  const handleOpenMediaLightbox = (cdnUrl: string, fileName: string) => {
    const mimeGuess = fileName.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image';
    setMediaLightbox({ cdnUrl, fileName, type: mimeGuess as 'image' | 'video' });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId || !currentUserId) return;

    setUploadingFile(true);
    setShowMediaPicker(false);

    try {
      // Upload file
      const result = await uploadFile(file, 'assets');

      // Send as message with file
      const msg = await sendChatMessage({
        sessionId,
        senderId: currentUserId,
        content: null,
        fileId: result.fileId,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
      });

      const localMsg = toLocalMessage(msg, currentUserId);
      setMessages(prev => {
        if (prev.some(m => m.id === localMsg.id)) return prev;
        return [...prev, localMsg];
      });
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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

  const suggestedMsg = `Hi ${partnerName}! I'm ${currentUser?.name || 'here'}. My commitment is "${myInfo.commitment.slice(0, 60)}${myInfo.commitment.length > 60 ? '...' : ''}". What's yours?`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        text: `I just completed a ${daysTotal}-day accountability challenge on AdGate.`,
      });
    }
  };

  const handleReport = async () => {
    if (!reportReason || !sessionId || !currentUserId || !partner.userId) return;
    setIsReporting(true);
    try {
      await reportPartner({
        sessionId,
        reporterId: currentUserId,
        reportedUserId: partner.userId,
        reason: reportReason,
        details: reportDetails,
      });
      setReportSuccess(true);
    } catch (err) {
      console.error('Failed to report:', err);
    } finally {
      setIsReporting(false);
    }
  };

  if (!isLoggedIn) return null;

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="w-8 h-8 rounded-full" style={{ border: '3px solid #E6E2D9', borderTopColor: '#D97757', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg flex-col gap-4">
        <span className="text-[40px]">🔗</span>
        <p className="text-[14px] font-[700] text-textMid">Session not found</p>
        <button onClick={() => navigate('/chats')} className="h-10 px-4 rounded-md bg-brand text-white text-[14px] font-[800]">Go to Chats</button>
      </div>
    );
  }

  return (
    <div className="flex w-full bg-bg overflow-hidden h-[calc(100dvh-128px)] md:h-[calc(100vh-64px)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col w-[380px] shrink-0 border-r border-[#E6E2D9] z-10 overflow-hidden">
         <MessagesSidebar 
            activeTab="pairing" 
            setActiveTab={(tab) => { navigate(`/chats`, { state: { activeTab: tab } }); }} 
            activeChatId={sessionId} 
            onSelectChat={(id: string, type: string) => {
                if (type === 'dm') navigate(`/messages/${id}`);
                if (type === 'pairing') navigate(`/chats/${id}`);
            }}
         />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-bg relative">
      {/* Header */}
      <header className="shrink-0 h-[58px] bg-white flex items-center justify-between px-4 border-b border-border z-10" style={{ borderBottom: '1px solid #E6E2D9' }}>
        <button onClick={() => { window.history.length > 1 ? navigate(-1) : navigate('/chats'); }} className="flex items-center gap-1.5 shrink-0 hover:text-text transition-colors" style={{ width: '80px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M14 5L8 11L14 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="font-[900] text-[13px] tracking-tight text-text">Back</span>
        </button>

        <div className="flex items-center gap-2 justify-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: partnerColor }}>
            <span className="text-[13px] font-[900] text-white">{partnerInitial}</span>
          </div>
          <span className="text-[15px] font-[800] text-text">{partnerName}</span>
          <span className="text-[12px] font-[600] text-textMid">· Day {daysPassed} of {daysTotal}</span>
        </div>

        <button
          onClick={() => setShowInfoSheet(true)}
          className="w-[44px] h-[44px] flex items-center justify-center shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="#6B6860" strokeWidth="1.5"/>
            <path d="M10 9V14M10 7V6" stroke="#6B6860" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </header>

      {/* Progress bar */}
      <div className="shrink-0 h-1 w-full bg-border">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, background: '#D97757' }}
        />
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollBehavior: 'smooth' }}>
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <span className="text-[48px] mb-4">🤝</span>
            <h3 className="text-[18px] font-[900] text-text mb-2">You've been paired with {partnerName}!</h3>
            {(partner.trustScore || 75) >= 75 && (
              <div className="mb-2">
                <TrustScoreBadge score={partner.trustScore || 75} size="md" />
              </div>
            )}
            <p className="text-[13px] font-[600] text-textMid max-w-[260px]">Send a message to introduce yourself.</p>

            <div className="mt-4 rounded-[12px] p-3.5 max-w-[280px]" style={{ backgroundColor: '#FFFBEB' }}>
              <span className="text-[10px] text-textLight">💡 Try sending:</span>
              <p className="text-[13px] font-[600] text-text mt-1">{suggestedMsg}</p>
              <button
                onClick={() => setInputText(suggestedMsg)}
                className="mt-3 h-8 px-4 rounded-[8px] text-[12px] font-[800] text-brand border border-brand"
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
                  <div className="flex-1 h-[1px] bg-border" />
                  <span className="text-[11px] font-[700] text-textLight shrink-0">{group.date}</span>
                  <div className="flex-1 h-[1px] bg-border" />
                </div>

                {group.msgs.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  const isBroadcast = msg.type === 'broadcast';
                  const isScheduled = msg.type === 'scheduled';

                  // ── Scheduled Challenge Update message ──
                  if (isScheduled) {
                    return (
                      <div key={msg.id} className="mb-4 w-full rounded-[12px] p-4" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: creatorColor }}>
                              <span className="text-[10px] font-[900] text-white">C</span>
                            </div>
                            <span className="text-[13px] font-[900] text-[#92400E]">{creatorName}</span>
                          </div>
                          <span className="h-5 px-2.5 rounded-[10px] text-[10px] font-[800] text-[#92400E] flex items-center gap-1" style={{ backgroundColor: '#FAF0EB', border: '1px solid #FDE68A' }}>
                            📅 Challenge Update{msg.dayNumber ? ` · Day ${msg.dayNumber}` : ''}
                          </span>
                        </div>
                        <p className="text-[14px] font-[600] text-text" style={{ lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                        
                        {/* YouTube + Links for Scheduled */}
                        {(msg.youtubeUrl || (msg.links && msg.links.length > 0)) && (
                          <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-[#FDE68A]">
                            {msg.youtubeUrl && (
                              <a 
                                href={msg.youtubeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/50 rounded-[10px] border border-red-100 hover:bg-white transition-colors group"
                              >
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8312A"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-black text-text">Watch Video</div>
                                  <div className="text-[11px] text-textLight truncate">{msg.youtubeUrl}</div>
                                </div>
                                <span className="text-[#AAA49C] group-hover:text-text translate-x-0 group-hover:translate-x-1 transition-all">→</span>
                              </a>
                            )}
                            {msg.links?.map((link, idx) => (
                              <a 
                                key={idx}
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/50 rounded-[10px] border border-blue-100 hover:bg-white transition-colors group"
                              >
                                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-black text-[14px] shrink-0" 
                                     style={{ backgroundColor: getDomainColor(link.url) }}>
                                  {getDomainInitial(link.url)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-black text-text truncate">{link.title || getDomainName(link.url)}</div>
                                  <div className="text-[11px] text-textLight truncate">{link.url}</div>
                                </div>
                                <span className="text-[#AAA49C] group-hover:text-text translate-x-0 group-hover:translate-x-1 transition-all">→</span>
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#FDE68A]/50">
                          <span className="text-[10px] font-[600] text-[#B4956A]">
                            {msg.sendTime ? `Scheduled for ${msg.sendTime.slice(0, 5)}` : ''}
                          </span>
                          <span className="text-[10px] text-[#B4956A]">{formatTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    );
                  }

                  // ── Reward Reveal card ──
                  if (msg.type === 'reward_reveal' && msg.completionAssetId) {
                    const asset = rewardAssets[msg.completionAssetId];
                    // Parse links
                    let assetLinks: { url: string; title: string }[] = [];
                    if (asset?.links) {
                      if (typeof asset.links === 'string') {
                        try { assetLinks = JSON.parse(asset.links); } catch { assetLinks = []; }
                      } else if (Array.isArray(asset.links)) {
                        assetLinks = asset.links;
                      }
                    }

                    return (
                      <div key={msg.id} className="mb-4 w-full rounded-[16px] overflow-hidden" style={{ border: '1px solid #F59E0B', background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' }}>
                        {/* Header */}
                        <div className="px-4 pt-4 pb-3">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[28px]">🎁</span>
                            <div>
                              <span className="h-5 px-2.5 rounded-[10px] text-[10px] font-[800] text-[#92400E] flex items-center" style={{ backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                                ✨ Reward Unlocked
                              </span>
                            </div>
                          </div>

                          {asset?.resource_title && (
                            <h3 className="text-[18px] font-[900] text-[#1C1917] mb-1" style={{ lineHeight: '1.3' }}>
                              {asset.resource_title}
                            </h3>
                          )}
                          {asset?.resource_description && (
                            <p className="text-[13px] font-[600] text-[#78716C] mb-3" style={{ lineHeight: '1.5' }}>
                              {asset.resource_description}
                            </p>
                          )}

                          {/* Creator's bonus message */}
                          {asset?.unlock_message && (
                            <div className="rounded-[10px] p-3 mb-3 flex gap-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(245,158,11,0.2)' }}>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: creatorColor }}>
                                <span className="text-[10px] font-[900] text-white">C</span>
                              </div>
                              <div>
                                <span className="text-[11px] font-[800] text-[#92400E]">{creatorName}</span>
                                <p className="text-[13px] font-[600] text-[#44403C] mt-0.5" style={{ lineHeight: '1.5' }}>
                                  "{asset.unlock_message}"
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Resources */}
                        {(asset?.file || assetLinks.length > 0 || asset?.youtube_url) && (
                          <div className="px-4 pb-4 flex flex-col gap-2">
                            {/* File Download */}
                            {asset?.file && (
                              <button
                                onClick={async () => {
                                  setDownloadingReward(true);
                                  try {
                                    const url = await getCompletionAssetUrl(sessionId!);
                                    if (url) window.open(url, '_blank');
                                  } finally {
                                    setDownloadingReward(false);
                                  }
                                }}
                                className="flex items-center gap-3 p-3 bg-white rounded-[12px] hover:bg-white/90 transition-all group"
                                style={{ border: '1px solid rgba(245,158,11,0.2)' }}
                              >
                                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#92400E]" style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="text-[13px] font-black text-[#1C1917] truncate">{asset.file.original_name}</div>
                                  <div className="text-[11px] text-[#A8A29E]">{formatBytes(asset.file.size_bytes)} · {downloadingReward ? 'Downloading...' : 'Tap to download'}</div>
                                </div>
                                <span className="text-[#D4A843] group-hover:text-[#92400E] translate-x-0 group-hover:translate-x-1 transition-all font-[800]">↓</span>
                              </button>
                            )}

                            {/* YouTube Video */}
                            {asset?.youtube_url && (
                              <a
                                href={asset.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white rounded-[12px] hover:bg-white/90 transition-all group"
                                style={{ border: '1px solid rgba(245,158,11,0.2)' }}
                              >
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8312A"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="text-[13px] font-black text-[#1C1917] truncate">Bonus Video Content</div>
                                  <div className="text-[11px] text-[#A8A29E] truncate">{asset.youtube_url}</div>
                                </div>
                                <span className="text-[#D4A843] group-hover:text-[#92400E] translate-x-0 group-hover:translate-x-1 transition-all font-[800]">→</span>
                              </a>
                            )}

                            {/* Links */}
                            {assetLinks.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white rounded-[12px] hover:bg-white/90 transition-all group"
                                style={{ border: '1px solid rgba(245,158,11,0.2)' }}
                              >
                                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-black text-[14px]"
                                     style={{ backgroundColor: getDomainColor(link.url) }}>
                                  {getDomainInitial(link.url)}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="text-[13px] font-black text-[#1C1917] truncate">{link.title || getDomainName(link.url)}</div>
                                  <div className="text-[11px] text-[#A8A29E] truncate">{link.url}</div>
                                </div>
                                <span className="text-[#D4A843] group-hover:text-[#92400E] translate-x-0 group-hover:translate-x-1 transition-all font-[800]">→</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="px-4 pb-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(245,158,11,0.15)' }}>
                          <span className="text-[10px] font-[700] text-[#D4A843] pt-2">🎉 Congratulations on completing the challenge!</span>
                          <span className="text-[10px] text-[#D4A843] pt-2">{formatTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    );
                  }

                  if (isBroadcast) {
                    return (
                      <div key={msg.id} className="mb-4 w-full rounded-[12px] p-4 shadow-sm" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: creatorColor }}>
                              <span className="text-[10px] font-[900] text-white">C</span>
                            </div>
                            <span className="text-[14px] font-[900] text-[#92400E]">{creatorName}</span>
                          </div>
                          <span className="h-5 px-2.5 rounded-[10px] text-[10px] font-[800] text-[#92400E] flex items-center" style={{ backgroundColor: '#FAF0EB', border: '1px solid #FDE68A' }}>
                            📣 Challenge Update
                          </span>
                        </div>
                        <p className="text-[14px] font-[600] text-text mb-4" style={{ lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                        
                        {/* Attachments for Broadcast */}
                        {(msg.youtubeUrl || (msg.links && msg.links.length > 0)) && (
                          <div className="flex flex-col gap-2 pt-3 border-t border-[#FDE68A]">
                            {msg.youtubeUrl && (
                              <a 
                                href={msg.youtubeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/50 rounded-[10px] border border-red-100 hover:bg-white transition-colors group"
                              >
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8312A"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-black text-text">Watch Video</div>
                                  <div className="text-[11px] text-textLight truncate">{msg.youtubeUrl}</div>
                                </div>
                                <span className="text-[#AAA49C] group-hover:text-text translate-x-0 group-hover:translate-x-1 transition-all">→</span>
                              </a>
                            )}
                            {msg.links?.map((link, idx) => (
                              <a 
                                key={idx}
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/50 rounded-[10px] border border-blue-100 hover:bg-white transition-colors group"
                              >
                                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-black text-[14px] shrink-0" 
                                     style={{ backgroundColor: getDomainColor(link.url) }}>
                                  {getDomainInitial(link.url)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-black text-text truncate">{link.title || getDomainName(link.url)}</div>
                                  <div className="text-[11px] text-textLight truncate">{link.url}</div>
                                </div>
                                <span className="text-[#AAA49C] group-hover:text-text translate-x-0 group-hover:translate-x-1 transition-all">→</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (isOwn) {
                    const hasMediaContent = msg.media_r2_key && msg.media_category;
                    return (
                      <div key={msg.id} className="flex flex-col items-end mb-3">
                        <div className="max-w-[85%] rounded-[14px] p-3.5 text-[14px] font-[600] text-text" style={{ backgroundColor: '#FAF0EB', border: '1px solid #E6E2D9', borderBottomRightRadius: '2px', lineHeight: '1.6' }}>
                          {msg.content && <div style={{ marginBottom: hasMediaContent ? '8px' : '0' }}>{msg.content}</div>}
                          {hasMediaContent && (
                            <ChatMediaContent
                              message={{
                                media_r2_key: msg.media_r2_key!,
                                media_thumbnail_r2_key: msg.media_thumbnail_r2_key,
                                media_original_name: msg.media_original_name || 'File',
                                media_mime_type: msg.media_mime_type || undefined,
                                media_size_bytes: msg.media_size_bytes || 0,
                                media_category: msg.media_category!,
                                is_pro_storage: msg.is_pro_storage || false,
                                created_at: msg.timestamp,
                              }}
                              onOpenLightbox={handleOpenMediaLightbox}
                            />
                          )}
                          {!msg.content && !hasMediaContent && msg.content}
                        </div>
                        <div className="flex items-center gap-1 mt-1 mr-1">
                          <span className="text-[10px] text-textLight">{formatTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    );
                  }

                  // Incoming
                  const incomingHasMedia = msg.media_r2_key && msg.media_category;
                  return (
                    <div key={msg.id} className="flex gap-2 mb-3 items-start">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-5" style={{ backgroundColor: partnerColor }}>
                        <span className="text-[12px] font-[900] text-white">{msg.senderInitial}</span>
                      </div>
                      <div className="flex flex-col max-w-[85%]">
                        <span className="text-[11px] font-[800] text-textMid mb-1">{msg.senderName}</span>
                        <div className="rounded-[14px] p-3.5 text-[14px] font-[600] text-text bg-white" style={{ border: '1px solid #E6E2D9', borderBottomLeftRadius: '2px', lineHeight: '1.6' }}>
                          {msg.content && <div style={{ marginBottom: incomingHasMedia ? '8px' : '0' }}>{msg.content}</div>}
                          {incomingHasMedia && (
                            <ChatMediaContent
                              message={{
                                media_r2_key: msg.media_r2_key!,
                                media_thumbnail_r2_key: msg.media_thumbnail_r2_key,
                                media_original_name: msg.media_original_name || 'File',
                                media_mime_type: msg.media_mime_type || undefined,
                                media_size_bytes: msg.media_size_bytes || 0,
                                media_category: msg.media_category!,
                                is_pro_storage: msg.is_pro_storage || false,
                                created_at: msg.timestamp,
                              }}
                              onOpenLightbox={handleOpenMediaLightbox}
                            />
                          )}
                          {!msg.content && !incomingHasMedia && msg.content}
                        </div>
                        <span className="text-[10px] text-textLight mt-1 ml-1">{formatTime(msg.timestamp)}</span>
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
            className="h-8 px-3 rounded-[20px] bg-white text-[13px] font-[700] text-text flex items-center"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >
            {unreadCount} new {unreadCount === 1 ? 'message' : 'messages'} ↓
          </button>
        </div>
      )}

      {/* Expiry panel */}
      {isExpired ? (
        <div className="shrink-0 bg-white p-5 flex flex-col items-center" style={{ borderTop: '2px solid #417A55' }}>
          <h3 className="text-[20px] font-[900] text-text text-center">Challenge Complete! 🎉</h3>
          <p className="text-[14px] text-textMid text-center mt-1">{daysTotal} days. Done.</p>

          <div className="w-full grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-[12px] p-3" style={{ backgroundColor: '#FAF0EB', border: '1px solid #E6E2D9' }}>
              <span className="text-[10px] font-[800] text-textMid uppercase block">What you committed to</span>
              <p className="text-[12px] font-[600] text-text mt-1" style={{ lineHeight: '1.5' }}>
                {myInfo.commitment}
              </p>
            </div>
            <div className="rounded-[12px] p-3 bg-white" style={{ border: '1px solid #E6E2D9' }}>
              <span className="text-[10px] font-[800] text-textMid uppercase block">What {partnerName} committed to</span>
              <p className="text-[12px] font-[600] text-text mt-1" style={{ lineHeight: '1.5' }}>
                {partner.commitment}
              </p>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="w-full h-[48px] rounded-md bg-brand text-white text-[14px] font-[900] flex items-center justify-center mt-4"
          >
            Share your experience →
          </button>

          {/* Reward Panel */}
          {session?.pairing_config?.completion_assets && (
            <div className="w-full mt-6 flex flex-col items-center">
              <div className="w-full h-[1px] bg-border mb-6" />
              <div className="flex flex-col items-center text-center max-w-[400px]">
                <span className="text-[32px] mb-3">🎁</span>
                <h4 className="text-[18px] font-[900] text-text mb-2">Creator's Reward</h4>
                <p className="text-[14px] font-[600] text-textMid mb-6" style={{ lineHeight: '1.6' }}>
                  {session.pairing_config.completion_assets.unlock_message || "You've successfully completed the challenge! Here's your reward from the creator."}
                </p>

                <div className="w-full flex flex-col gap-3">
                  {/* File Download */}
                  {session.pairing_config.completion_assets.file && (
                    <button
                      onClick={async () => {
                        const url = await getCompletionAssetUrl(sessionId!);
                        if (url) window.open(url, '_blank');
                      }}
                      className="flex items-center gap-3 p-4 bg-white rounded-[14px] border border-border hover:border-brand/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-[10px] bg-surfaceAlt flex items-center justify-center text-textMid">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[13px] font-black text-text truncate">{session.pairing_config.completion_assets.file.original_name}</div>
                        <div className="text-[11px] text-textLight">{formatBytes(session.pairing_config.completion_assets.file.size_bytes)} · Resource File</div>
                      </div>
                      <span className="text-[#AAA49C] group-hover:text-text translate-x-0 group-hover:translate-x-1 transition-all">→</span>
                    </button>
                  )}

                  {/* YouTube Video */}
                  {session.pairing_config.completion_assets.youtube_url && (
                    <a
                      href={session.pairing_config.completion_assets.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-white rounded-[14px] border border-border hover:border-brand/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8312A"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[13px] font-black text-text truncate">Bonus Video Content</div>
                        <div className="text-[11px] text-textLight">{session.pairing_config.completion_assets.youtube_url}</div>
                      </div>
                      <span className="text-[#AAA49C] group-hover:text-text translate-x-0 group-hover:translate-x-1 transition-all">→</span>
                    </a>
                  )}

                  {/* Links */}
                  {session.pairing_config.completion_assets.links && session.pairing_config.completion_assets.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-white rounded-[14px] border border-border hover:border-brand/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-black text-[14px]"
                           style={{ backgroundColor: getDomainColor(link.url) }}>
                        {getDomainInitial(link.url)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[13px] font-black text-text truncate">{link.title || getDomainName(link.url)}</div>
                        <div className="text-[11px] text-textLight">{link.url}</div>
                      </div>
                      <span className="text-[#AAA49C] group-hover:text-text translate-x-0 group-hover:translate-x-1 transition-all">→</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Message input */
        <div className="shrink-0 bg-white flex flex-col" style={{ borderTop: '1px solid #E6E2D9', paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}>
          {/* Free plan media expiry banner */}
          <ChatExpiryBanner
            chatId={sessionId || ''}
            hasFreePlanMedia={messages.some(m => m.media_r2_key && !m.is_pro_storage)}
            isProUser={isProUser}
          />

          {uploadingFile && (
            <div className="flex items-center gap-2 px-4 py-2 bg-bg">
              <div className="w-4 h-4 rounded-full" style={{ border: '2px solid #E6E2D9', borderTopColor: '#D97757', animation: 'spin 0.8s linear infinite' }} />
              <span className="text-[12px] font-[600] text-textMid">Uploading file...</span>
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

          <div className="flex items-end gap-2 px-4 py-2.5">
            <ChatMediaButton
              onFileSelected={handleMediaFileSelected}
              disabled={!!mediaPreviewFile && !mediaUploadComplete}
            />

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
                opacity: (inputText.trim() || (mediaUploadComplete && mediaUploadResult) || pendingAttachments.length > 0) ? 1 : 0.4,
              }}
              disabled={(!inputText.trim() && !(mediaUploadComplete && mediaUploadResult) && pendingAttachments.length === 0) || isSending || (!!mediaPreviewFile && !mediaUploadComplete && !mediaUploadError)}
            >
              {isSending ? (
                <div className="w-5 h-5 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,.pdf,.zip,.doc,.docx"
        onChange={handleFileSelect}
      />

      {/* Media Picker Sheet */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMediaPicker(false)} />
          <div className="relative bg-white rounded-t-[24px] p-4 pb-8 animate-slide-up">
            <div className="w-8 h-1 bg-border rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => { fileInputRef.current?.setAttribute('accept', 'image/*'); fileInputRef.current?.click(); setShowMediaPicker(false); }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-bg"
              >
                <div className="w-12 h-12 rounded-full bg-[#FAF0EB] flex items-center justify-center text-brand">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                     <circle cx="8.5" cy="8.5" r="1.5" />
                     <polyline points="21 15 16 10 5 21" />
                   </svg>
                </div>
                <span className="text-[12px] font-[700]">Photo</span>
              </button>
              <button 
                onClick={() => { fileInputRef.current?.setAttribute('accept', 'video/*'); fileInputRef.current?.click(); setShowMediaPicker(false); }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-bg"
              >
                <div className="w-12 h-12 rounded-full bg-successBg flex items-center justify-center text-success">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <polygon points="23 7 16 12 23 17 23 7" />
                     <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                   </svg>
                </div>
                <span className="text-[12px] font-[700]">Video</span>
              </button>
              <button 
                onClick={() => { fileInputRef.current?.setAttribute('accept', '.pdf,.zip,.doc,.docx,.txt'); fileInputRef.current?.click(); setShowMediaPicker(false); }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-bg"
              >
                <div className="w-12 h-12 rounded-full bg-surfaceAlt flex items-center justify-center text-textMid">
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
              <div className="w-8 h-1 bg-border rounded-full mb-3" />
              <div className="w-full flex items-center justify-between px-4">
                <div className="w-11" />
                <span className="text-[16px] font-[900] text-text">Challenge Details</span>
                <button onClick={() => setShowInfoSheet(false)} className="w-11 h-11 flex items-center justify-center text-textMid">✕</button>
              </div>
            </div>

            <div className="pb-8">
              {/* Partner Trust Row */}
              <div className="px-4 py-4" style={{ borderBottom: '1px solid #E6E2D9' }}>
                <span className="text-[12px] font-[800] text-textMid uppercase">{partnerName}'s trust</span>
                <div className="flex items-center gap-2 mt-2">
                  <TrustScoreBadge score={partner.trustScore || 75} size="md" />
                </div>
              </div>

              {/* Progress */}
              <div className="py-4 px-4" style={{ borderBottom: '1px solid #E6E2D9' }}>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, backgroundColor: '#D97757' }} />
                </div>
                <span className="text-[12px] font-[700] text-textMid mt-2 block text-right">{daysPassed} of {daysTotal} days</span>
              </div>

              <div className="px-4">
                {/* Your commitment */}
                <div className="py-4 rounded-[12px] px-3 mt-4" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <span className="text-[10px] font-[800] text-textMid uppercase">Your commitment:</span>
                  <p className="text-[13px] font-[700] text-text mt-1" style={{ lineHeight: '1.5' }}>
                    {myInfo.commitment}
                  </p>
                </div>

                {/* Partner commitment */}
                <div className="py-4 rounded-[12px] px-3 mt-3 bg-white" style={{ border: '1px solid #E6E2D9' }}>
                  <span className="text-[10px] font-[800] text-textMid uppercase">{partnerName}'s commitment:</span>
                  <p className="text-[13px] font-[700] text-text mt-1" style={{ lineHeight: '1.5' }}>
                    {partner.commitment}
                  </p>
                </div>
              </div>

              <div className="px-4">
                {/* Change Partner */}
                <button 
                  className="h-[52px] w-full flex items-center justify-between mt-4 transition-colors hover:bg-bg" 
                  onClick={() => {
                    if (hoursElapsed < 24) {
                      setShowChangePartnerConfirm(true); 
                      setShowInfoSheet(false);
                    }
                  }}
                  style={{ opacity: hoursElapsed >= 24 ? 0.4 : 1, pointerEvents: hoursElapsed >= 24 ? 'none' : 'auto' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-bg text-[16px]">🔄</div>
                    <div className="flex flex-col text-left">
                      <span className="text-[14px] font-[700] text-text">Change Partner</span>
                      <span className="text-[11px] text-textLight">{hoursElapsed < 24 ? 'Available within first 24 hours' : 'No longer available after 24 hours'}</span>
                    </div>
                  </div>
                  <span className="text-border font-[800]">›</span>
                </button>

                {/* Report */}
                <button 
                  className="h-[52px] w-full flex items-center justify-between mt-2 transition-colors hover:bg-bg" 
                  onClick={() => { setShowReportSheet(true); setShowInfoSheet(false); }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-errorBg text-[16px]">🚩</div>
                    <div className="flex flex-col text-left">
                      <span className="text-[14px] font-[700] text-error">Report a problem</span>
                      <span className="text-[11px] text-textLight">Harassment, ghosting, inappropriate content</span>
                    </div>
                  </div>
                  <span className="text-border font-[800]">›</span>
                </button>

                {/* Leave */}
                <button
                  onClick={() => { setShowLeaveConfirm(true); setShowInfoSheet(false); }}
                  className="w-full h-[44px] rounded-[12px] text-[14px] font-[800] text-error flex items-center justify-center mt-6"
                  style={{ border: '1px solid #C0392B' }}
                >
                  Leave Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Partner Confirm */}
      {showChangePartnerConfirm && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isRematching && setShowChangePartnerConfirm(false)} />
          <div className="relative bg-white rounded-t-[24px] p-6 animate-slide-up">
            <div className="w-8 h-1 bg-border rounded-full mx-auto mb-4" />
            <h3 className="text-[16px] font-[900] text-text text-center mb-2">Change your partner?</h3>
            <p className="text-[13px] text-textMid text-center mb-6" style={{ lineHeight: '1.65' }}>
              Your current partner {partnerName} will be notified. You will be placed back in the matching pool.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsRematching(true);
                  setTimeout(() => {
                    // TODO: implement rematch logic
                    navigate(`/r/${session.link_id}/matching?rematch=true`);
                  }, 1500);
                }}
                disabled={isRematching}
                className="w-full h-[48px] rounded-[12px] bg-brand text-white text-[15px] font-[900] flex justify-center items-center"
              >
                {isRematching ? <span className="animate-pulse">Finding a new match...</span> : "I understand — Rematch me"}
              </button>
              <button
                disabled={isRematching}
                onClick={() => setShowChangePartnerConfirm(false)}
                className="w-full h-[48px] rounded-[12px] bg-bg text-textMid text-[15px] font-[900]"
              >
                Keep current partner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Sheet */}
      {showReportSheet && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isReporting && setShowReportSheet(false)} />
          <div className="relative bg-white rounded-t-[24px] max-h-[80vh] overflow-y-auto animate-slide-up flex flex-col">
            <div className="sticky top-0 bg-white pt-3 pb-2 flex flex-col items-center rounded-t-[24px] z-10 px-4">
              <div className="w-8 h-1 bg-border rounded-full mb-3" />
              <div className="w-full flex items-center justify-between">
                <div className="w-11" />
                <span className="text-[16px] font-[900] text-text">Report {partnerName}</span>
                <button onClick={() => !isReporting && setShowReportSheet(false)} className="w-11 h-11 flex items-center justify-center text-textMid">✕</button>
              </div>
            </div>

            <div className="px-4 pb-8 flex flex-col">
              {reportSuccess ? (
                <div className="flex flex-col items-center justify-center text-center py-10 px-4 animate-fade-in">
                  <div className="w-[64px] h-[64px] rounded-full bg-successBg text-success flex items-center justify-center mb-4 text-[32px]">✓</div>
                  <h3 className="text-[16px] font-[900] text-text mb-2">Report submitted</h3>
                  <p className="text-[14px] font-[700] text-text mb-8" style={{ lineHeight: '1.6' }}>
                    Thank you for keeping the community safe. We will review this within 24 hours.
                  </p>
                  <button onClick={() => setShowReportSheet(false)} className="w-full h-[48px] rounded-[12px] bg-bg text-textMid text-[15px] font-[900]">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h4 className="text-[13px] font-[800] text-text mb-2 mt-2">What happened?</h4>
                  <div className="flex flex-col mb-6">
                    {[
                      "👻 Ghosting — stopped responding completely",
                      "💬 Inappropriate messages",
                      "🤥 Fake commitment — never intended to participate",
                      "🔞 Offensive or harmful content",
                      "📵 Sharing personal contact info without consent",
                      "Other"
                    ].map((reason) => (
                      <button 
                        key={reason}
                        onClick={() => setReportReason(reason)}
                        className="h-[48px] flex items-center gap-3 w-full text-left border-b border-border"
                      >
                        <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${reportReason === reason ? 'border-error bg-error' : 'border-border bg-white'}`}>
                           {reportReason === reason && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-[14px] font-[700] text-text">{reason}</span>
                      </button>
                    ))}
                  </div>

                  <h4 className="text-[13px] font-[800] text-text mb-2">Additional details (optional)</h4>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Tell us what happened..."
                    maxLength={300}
                    className="w-full h-[80px] rounded-[12px] border border-border p-3 text-[14px] resize-none mb-1 focus:border-brand focus:outline-none"
                  />
                  <div className="text-right text-[11px] font-[600] text-textLight mb-6">{reportDetails.length}/300</div>

                  <div className="bg-bg rounded-[10px] p-[12px] mb-6">
                    <p className="text-[12px] font-[600] text-textMid" style={{ lineHeight: '1.6' }}>
                      🔒 Your report is private. {partnerName} will not know you reported them.
                    </p>
                  </div>

                  <button
                    onClick={handleReport}
                    disabled={isReporting || !reportReason}
                    className="w-full h-[48px] rounded-[12px] bg-error text-white text-[15px] font-[900] flex justify-center items-center disabled:opacity-50"
                  >
                    {isReporting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirm */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLeaveConfirm(false)} />
          <div className="relative bg-white rounded-t-[24px] p-6" style={{ animation: 'slideUp 0.3s ease' }}>
            <div className="w-8 h-1 bg-border rounded-full mx-auto mb-4" />
            <p className="text-[15px] font-[700] text-text text-center mb-6">Your partner won't have anyone to check in with. Are you sure?</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowLeaveConfirm(false); setShowInfoSheet(false); navigate('/'); }}
                className="flex-1 h-[44px] rounded-[12px] bg-error text-white text-[14px] font-[800]"
              >
                Leave
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 h-[44px] rounded-[12px] bg-bg text-textMid text-[14px] font-[800]"
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
               <span className="text-[11px] font-[600] text-textMid">{lightboxAttachment.fileSize}</span>
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
        </div>
      )}

      {/* Chat Media Lightbox */}
      {mediaLightbox && (
        <ChatMediaLightbox
          cdnUrl={mediaLightbox.cdnUrl}
          fileName={mediaLightbox.fileName}
          type={mediaLightbox.type}
          onClose={() => setMediaLightbox(null)}
        />
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
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
      </div>
    </div>
  );
};
