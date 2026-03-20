import { useState, useRef, useCallback, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';
import { updateLink } from '../../services/linksService';
import { useToast } from '../../context/ToastContext';
import { CustomSponsorForm, type CustomAdData } from '../CustomSponsorForm';
import { EmailConfigForm, type EmailConfigData } from './EmailConfigForm';
import { SocialConfigForm, type SocialConfigData } from './SocialConfigForm';
import { uploadFile, validateFile } from '../../services/uploadService';
import { X, Link as LinkIcon, UploadCloud, File as FileIcon, Check } from 'lucide-react';
import FileUploadZone from '../FileUploadZone';
import { deleteFile } from '../../services/uploadService';

interface EditLinkSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  link: any;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const getDomainName = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};
const getDomainInitial = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, '').charAt(0).toUpperCase(); } catch { return url.charAt(0).toUpperCase(); }
};
const getDomainColor = (url: string) => {
  const colors = ['#E8312A', '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < url.length; i++) hash = url.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};
const isValidYouTubeUrl = (str: string) => {
  const patterns = [/^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/, /^https?:\/\/youtu\.be\/[\w-]{11}/, /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}/];
  return patterns.some(p => p.test(str));
};

// ── Content section (file + links + youtube) shared by email/social/sponsor ──
interface ContentSectionProps {
  fileId: string | null;
  setFileId: (id: string | null) => void;
  fileName: string | null;
  setFileName: (n: string | null) => void;
  links: { url: string; title: string }[];
  setLinks: (l: { url: string; title: string }[]) => void;
  youtubeUrl: string | null;
  setYoutubeUrl: (u: string | null) => void;
  textContent: string;
  setTextContent: (t: string) => void;
}

const ContentSection = ({ fileId, setFileId, fileName, setFileName, links, setLinks, youtubeUrl, setYoutubeUrl, textContent, setTextContent }: ContentSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkError, setLinkError] = useState('');
  const [isAddingYouTube, setIsAddingYouTube] = useState(false);
  const [youtubeInput, setYoutubeInput] = useState('');
  const [youtubeError, setYoutubeError] = useState('');

  const handleFileSelect = useCallback(async (file: File) => {
    const validation = validateFile(file, 'content');
    if (!validation.valid) { setUploadError(validation.error || 'Invalid file'); return; }
    setIsUploading(true); setUploadError(null); setUploadProgress(5);
    try {
      const result = await uploadFile(file, 'content', { onProgress: (p: number) => setUploadProgress(p) });
      setFileId(result.fileId);
      setFileName(file.name);
      setUploadProgress(100);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      setFileId(null); setFileName(null);
    } finally { setIsUploading(false); }
  }, [setFileId, setFileName]);

  const removeFile = () => { setFileId(null); setFileName(null); setUploadError(null); setUploadProgress(0); };

  const addLink = (e?: React.FormEvent) => {
    e?.preventDefault();
    let url = linkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    if (!url.includes('.')) { setLinkError('Enter a valid URL'); return; }
    if (links.some(l => l.url.toLowerCase() === url.toLowerCase())) { setLinkError('Already added'); return; }
    setLinks([...links, { url, title: linkTitle.trim() || getDomainName(url) }]);
    setIsAddingLink(false); setLinkUrl(''); setLinkTitle(''); setLinkError('');
  };

  const addYouTube = (e?: React.FormEvent) => {
    e?.preventDefault();
    const url = youtubeInput.trim();
    if (!isValidYouTubeUrl(url)) { setYoutubeError('Please enter a valid YouTube URL'); return; }
    setYoutubeUrl(url); setIsAddingYouTube(false); setYoutubeInput(''); setYoutubeError('');
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Reward Content</label>

      {/* File area */}
      <div className="border border-border rounded-[12px] overflow-hidden">
        <input ref={fileInputRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); e.target.value = ''; }} />
        {isUploading ? (
          <div className="p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-bold text-text truncate">{fileName}</span>
              <span className="text-[12px] font-bold text-brand">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-surfaceAlt rounded-full"><div className="h-full bg-brand rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
          </div>
        ) : fileId || fileName ? (
          <div className="p-3 flex items-center justify-between bg-surfaceAlt">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center shrink-0 text-brand border border-border"><FileIcon size={16} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-text truncate">{fileName || 'Current file'}</span>
                {fileId && <span className="text-[10px] font-bold text-success flex items-center gap-1"><Check size={10} strokeWidth={3} /> Uploaded</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => fileInputRef.current?.click()} className="text-[11px] font-bold text-text bg-white border border-border px-2.5 h-7 rounded-full hover:border-textMid transition-colors">Replace</button>
              <button onClick={removeFile} aria-label="Remove attached file" className="w-7 h-7 rounded-full bg-white flex items-center justify-center border border-border text-textMid hover:text-error hover:border-error transition-colors"><X size={14} /></button>
            </div>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} className="w-full h-20 flex flex-col items-center justify-center gap-1 bg-surfaceAlt hover:bg-[#EAE8E3] transition-colors">
            <UploadCloud size={20} className="text-textLight" />
            <span className="text-[12px] font-bold text-textMid">Tap to attach file</span>
            <span className="text-[10px] text-textLight">PDF, ZIP, MP4, PNG, TXT</span>
          </button>
        )}
        {uploadError && <div className="px-3 py-1.5 text-[11px] text-error font-bold bg-errorBg">{uploadError}</div>}
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-bold text-textMid">Text content <span className="font-medium text-textLight">(optional)</span></label>
        <div className="relative">
          <textarea value={textContent} onChange={e => setTextContent(e.target.value.slice(0, 5000))} placeholder="Add text, instructions, or notes..." className="w-full h-[80px] border border-border rounded-[10px] p-3 text-[14px] font-semibold resize-none focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors bg-white" />
          <span className={`absolute bottom-2 right-2 text-[10px] font-bold ${textContent.length >= 4500 ? 'text-warning' : 'text-textLight'}`}>{textContent.length}/5000</span>
        </div>
      </div>

      {/* Links */}
      {links.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {links.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-surfaceAlt border border-border rounded-[8px] px-3 py-2">
              <div className="w-6 h-6 rounded-[4px] flex items-center justify-center text-white font-black text-[11px] shrink-0" style={{ backgroundColor: getDomainColor(link.url) }}>{getDomainInitial(link.url)}</div>
              <div className="flex flex-col min-w-0 flex-1"><span className="text-[12px] font-bold text-text truncate">{link.title}</span><span className="text-[10px] text-textLight truncate">{getDomainName(link.url)}</span></div>
              <button onClick={() => setLinks(links.filter((_, i) => i !== idx))} aria-label="Remove link" className="w-6 h-6 rounded-full flex items-center justify-center text-textLight hover:text-error shrink-0"><X size={12} strokeWidth={3} /></button>
            </div>
          ))}
        </div>
      )}

      {/* YouTube */}
      {youtubeUrl && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#E8312A"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
          <span className="text-[11px] font-bold text-red-700 truncate flex-1">{youtubeUrl}</span>
          <button onClick={() => setYoutubeUrl(null)} aria-label="Remove YouTube video" className="text-red-400 hover:text-red-700"><X size={14} /></button>
        </div>
      )}

      {/* Add link / YouTube buttons */}
      {!isAddingLink && !isAddingYouTube && (
        <div className="flex gap-2 flex-wrap">
          {links.length < 10 && (
            <button onClick={() => { setIsAddingLink(true); setLinkUrl(''); setLinkTitle(''); setLinkError(''); }} className="h-8 px-3 rounded-[8px] border border-border bg-white text-[12px] font-bold text-text hover:bg-surfaceAlt transition-colors flex items-center gap-1.5">
              <LinkIcon size={12} /> Add Link
            </button>
          )}
          {!youtubeUrl && (
            <button onClick={() => { setIsAddingYouTube(true); setYoutubeInput(''); setYoutubeError(''); }} className="h-8 px-3 rounded-[8px] border border-border bg-white text-[12px] font-bold text-text hover:bg-surfaceAlt transition-colors flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#E8312A"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              YouTube
            </button>
          )}
        </div>
      )}

      {isAddingLink && (
        <div className="flex flex-col gap-2 p-3 bg-surfaceAlt border border-border rounded-[10px]">
          <div className="relative">
            <input type="text" value={linkUrl} onChange={e => { setLinkUrl(e.target.value); setLinkError(''); }} placeholder="Paste URL…" className="w-full h-10 border border-border rounded-[8px] pl-3 pr-16 text-[14px] font-semibold focus:outline-none focus:ring-1 focus:ring-brand bg-white" autoFocus onKeyDown={e => { if (e.key === 'Enter') addLink(e); if (e.key === 'Escape') setIsAddingLink(false); }} />
            <button onClick={addLink} className="absolute right-1.5 top-1.5 h-7 px-3 bg-brand text-white rounded-full text-[11px] font-extrabold hover:bg-brandHover">Add</button>
          </div>
          <input type="text" value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Link title (optional)" className="w-full h-9 border border-border rounded-[8px] px-3 text-[13px] font-semibold focus:outline-none focus:ring-1 focus:ring-brand bg-white" onKeyDown={e => { if (e.key === 'Enter') addLink(e); if (e.key === 'Escape') setIsAddingLink(false); }} />
          {linkError && <span className="text-[11px] text-error font-bold">{linkError}</span>}
          <button onClick={() => setIsAddingLink(false)} className="text-[11px] text-textMid font-bold text-right">Cancel</button>
        </div>
      )}

      {isAddingYouTube && (
        <div className="flex flex-col gap-2 p-3 bg-surfaceAlt border border-border rounded-[10px]">
          <div className="flex gap-2">
            <input type="text" value={youtubeInput} onChange={e => { setYoutubeInput(e.target.value); setYoutubeError(''); }} placeholder="Paste YouTube video URL" className="flex-1 h-10 border border-border rounded-[8px] px-3 text-[14px] font-semibold focus:outline-none focus:ring-1 focus:ring-brand bg-white" autoFocus onKeyDown={e => { if (e.key === 'Enter') addYouTube(e); if (e.key === 'Escape') setIsAddingYouTube(false); }} />
            <button onClick={addYouTube} className="h-10 px-4 bg-red-600 text-white rounded-[8px] text-[12px] font-extrabold hover:bg-red-700">Add</button>
            <button onClick={() => setIsAddingYouTube(false)} aria-label="Cancel adding YouTube video" className="w-10 h-10 bg-white border border-border rounded-[8px] flex items-center justify-center text-textMid hover:bg-surfaceAlt"><X size={16} /></button>
          </div>
          {youtubeError && <span className="text-[11px] text-error font-bold">{youtubeError}</span>}
        </div>
      )}
    </div>
  );
};

// ── Pairing edit section ──────────────────────────────────────────────────────
interface PairingEditProps {
  raw: any;
  onChange: (data: any) => void;
}

const PairingEditSection = ({ raw, onChange }: PairingEditProps) => {
  const pc = raw?.pairing_config;
  const ca = pc?.completion_asset;

  const [topic, setTopic] = useState(pc?.topic || '');
  const [description, setDescription] = useState(pc?.description || '');
  const [commitmentPrompt, setCommitmentPrompt] = useState(pc?.commitment_prompt || '');
  const [durationDays, setDurationDays] = useState(pc?.duration_days || 14);
  const [guidelines, setGuidelines] = useState(pc?.guidelines || '');
  const [creatorResourceUrl, setCreatorResourceUrl] = useState(pc?.creator_resource_url || '');
  const [creatorResourceLabel, setCreatorResourceLabel] = useState(pc?.creator_resource_label || '');
  const [isAccepting, setIsAccepting] = useState(pc?.is_accepting ?? true);

  // Scheduled message add form
  const [showAddMsg, setShowAddMsg] = useState(false);
  const [addDay, setAddDay] = useState(1);
  const [addTime, setAddTime] = useState('09:00');
  const [addContent, setAddContent] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);

  // Scheduled messages state (unsent only editable)
  const [newMessages, setNewMessages] = useState<any[]>([]);

  // Completion reward
  const [rewardEnabled, setRewardEnabled] = useState(!!(ca));
  const [rewardFileId, setRewardFileId] = useState<string | null>((ca as any)?.file?.id || null);
  const [rewardFileName, setRewardFileName] = useState<string | null>((ca as any)?.file?.original_name || null);
  const [rewardMessage, setRewardMessage] = useState(ca?.unlock_message || '');
  const [rewardLinks, setRewardLinks] = useState<{ url: string; title: string }[]>(ca?.links || []);
  const [rewardYoutube, setRewardYoutube] = useState<string | null>(ca?.youtube_url || null);

  // link adder for reward
  const [isAddingRewardLink, setIsAddingRewardLink] = useState(false);
  const [rewardLinkUrl, setRewardLinkUrl] = useState('');
  const [rewardLinkTitle, setRewardLinkTitle] = useState('');
  const [rewardLinkError, setRewardLinkError] = useState('');
  const [isAddingRewardYT, setIsAddingRewardYT] = useState(false);
  const [rewardYTInput, setRewardYTInput] = useState('');
  const [rewardYTError, setRewardYTError] = useState('');

  const formatTime12h = (t: string) => { const [h, m] = t.split(':').map(Number); const ampm = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`; };

  useEffect(() => {
    onChange({
      topic, description, commitmentPrompt, durationDays, guidelines,
      creatorResourceUrl: creatorResourceUrl || null,
      creatorResourceLabel: creatorResourceLabel || null,
      isAccepting,
      scheduledMessages: newMessages,
      completionAsset: rewardEnabled ? {
        enabled: true,
        fileId: rewardFileId,
        unlockMessage: rewardMessage,
        links: rewardLinks,
        youtubeUrl: rewardYoutube,
      } : { enabled: false },
    });
  }, [topic, description, commitmentPrompt, durationDays, guidelines, creatorResourceUrl, creatorResourceLabel, isAccepting, newMessages, rewardEnabled, rewardFileId, rewardMessage, rewardLinks, rewardYoutube]);

  const handleAddOrSaveMsg = () => {
    if (!addContent.trim()) return;
    if (editingMsgId) {
      setNewMessages(prev => prev.map(m => m.id === editingMsgId ? { ...m, dayNumber: addDay, sendTime: addTime, content: addContent } : m));
    } else {
      setNewMessages(prev => [...prev, { id: `new_${Date.now()}`, dayNumber: addDay, sendTime: addTime, content: addContent, links: [], isSent: false }]);
    }
    setShowAddMsg(false); setEditingMsgId(null); setAddDay(1); setAddTime('09:00'); setAddContent('');
  };

  const addRewardLink = (e?: any) => {
    e?.preventDefault();
    let url = rewardLinkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    if (!url.includes('.')) { setRewardLinkError('Enter a valid URL'); return; }
    setRewardLinks(prev => [...prev, { url, title: rewardLinkTitle.trim() || getDomainName(url) }]);
    setIsAddingRewardLink(false); setRewardLinkUrl(''); setRewardLinkTitle(''); setRewardLinkError('');
  };

  const addRewardYouTube = (e?: any) => {
    e?.preventDefault();
    const url = rewardYTInput.trim();
    if (!isValidYouTubeUrl(url)) { setRewardYTError('Enter a valid YouTube URL'); return; }
    setRewardYoutube(url); setIsAddingRewardYT(false); setRewardYTInput(''); setRewardYTError('');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Challenge Topic</label>
        <input className="w-full h-11 border border-border rounded-[10px] px-3 text-[14px] font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors" value={topic} onChange={e => setTopic(e.target.value.slice(0, 60))} placeholder="e.g. Building a morning routine" maxLength={60} />
        <span className="text-[10px] text-textLight text-right">{topic.length}/60</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Description</label>
        <textarea className="w-full border border-border rounded-[10px] p-3 text-[14px] font-semibold resize-none h-20 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand" value={description} onChange={e => setDescription(e.target.value.slice(0, 300))} placeholder="Tell participants what they're signing up for" maxLength={300} />
        <span className="text-[10px] text-textLight text-right">{description.length}/300</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Commitment Prompt</label>
        <input className="w-full h-11 border border-border rounded-[10px] px-3 text-[14px] font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors" value={commitmentPrompt} onChange={e => setCommitmentPrompt(e.target.value.slice(0, 120))} placeholder="What specific goal will you commit to?" maxLength={120} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Duration</label>
          <div className="flex items-center gap-1.5">
            <input type="number" min={2} max={90} value={durationDays} onChange={e => setDurationDays(Math.min(90, Math.max(2, parseInt(e.target.value) || 2)))} className="w-14 h-8 rounded-[8px] border border-border text-center text-[15px] font-extrabold focus:outline-none focus:ring-1 focus:ring-brand" />
            <span className="text-[12px] font-bold text-textMid">days</span>
          </div>
        </div>
        <input type="range" min={2} max={90} value={durationDays} onChange={e => setDurationDays(parseInt(e.target.value))} className="w-full h-[4px] rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #D97757 0%, #D97757 ${((durationDays - 2) / 88) * 100}%, #E6E2D9 ${((durationDays - 2) / 88) * 100}%, #E6E2D9 100%)` }} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Guidelines <span className="font-medium text-textLight normal-case tracking-normal">(optional)</span></label>
        <textarea className="w-full border border-border rounded-[10px] p-3 text-[14px] font-semibold resize-none h-16 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand" value={guidelines} onChange={e => setGuidelines(e.target.value.slice(0, 200))} maxLength={200} placeholder="Any ground rules for participants?" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Link to Related Content <span className="font-medium text-textLight normal-case tracking-normal">(optional)</span></label>
        <input type="url" className="w-full h-10 border border-border rounded-[10px] px-3 text-[14px] font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors" value={creatorResourceUrl} onChange={e => setCreatorResourceUrl(e.target.value)} placeholder="https://yoursite.com/resource" />
        <input className="w-full h-10 border border-border rounded-[10px] px-3 text-[14px] font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors" value={creatorResourceLabel} onChange={e => setCreatorResourceLabel(e.target.value.slice(0, 50))} placeholder="Label e.g. Read my guide" maxLength={50} />
      </div>

      {/* Accepting toggle */}
      <div className="flex items-center justify-between py-2 border-t border-border">
        <div>
          <span className="text-[13px] font-bold text-text">Accepting New Pairs</span>
          <p className="text-[11px] text-textMid">When off, no new joiners can sign up</p>
        </div>
        <button type="button" onClick={() => setIsAccepting(!isAccepting)} className={`w-10 h-6 rounded-full p-1 transition-colors ${isAccepting ? 'bg-brand' : 'bg-gray-200'}`}>
          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isAccepting ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Existing sent messages (read-only) */}
      {pc?.scheduled_messages?.filter((m: any) => m.is_sent).length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-[12px] font-extrabold text-textMid uppercase tracking-wide mb-2">📅 Sent Messages <span className="font-medium normal-case tracking-normal text-textLight">(read-only)</span></p>
          <div className="flex flex-col gap-2">
            {pc.scheduled_messages.filter((m: any) => m.is_sent).sort((a: any, b: any) => a.day_number - b.day_number).map((msg: any) => (
              <div key={msg.id} className="p-3 bg-surfaceAlt border border-border rounded-[10px] opacity-60">
                <div className="flex items-center gap-2 mb-1"><span className="text-[11px] font-extrabold text-warning">Day {msg.day_number}</span><span className="text-[10px] text-textLight">· {formatTime12h(msg.send_time)} · Sent ✓</span></div>
                <p className="text-[12px] font-semibold text-text line-clamp-2">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New messages section */}
      <div className="border-t border-border pt-3">
        <p className="text-[12px] font-extrabold text-textMid uppercase tracking-wide mb-2">📅 New Scheduled Messages</p>
        {newMessages.length === 0 && !showAddMsg && <p className="text-[12px] text-textLight font-semibold">No new messages queued. Add messages to schedule.</p>}
        {newMessages.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {newMessages.sort((a, b) => a.dayNumber - b.dayNumber).map(msg => (
              <div key={msg.id} className="p-3 bg-white border border-border rounded-[10px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-extrabold text-brand">Day {msg.dayNumber} · {formatTime12h(msg.sendTime)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingMsgId(msg.id); setAddDay(msg.dayNumber); setAddTime(msg.sendTime); setAddContent(msg.content); setShowAddMsg(true); }} className="text-[11px] font-bold text-textMid hover:text-text">Edit</button>
                    <button onClick={() => setNewMessages(prev => prev.filter(m => m.id !== msg.id))} className="text-[11px] font-bold text-error hover:underline">Remove</button>
                  </div>
                </div>
                <p className="text-[12px] font-semibold text-text line-clamp-2">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
        {showAddMsg ? (
          <div className="flex flex-col gap-3 p-3 bg-white border border-border rounded-[10px]">
            <div className="flex gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-textMid">Day</label>
                <input type="number" min={1} max={durationDays} value={addDay} onChange={e => setAddDay(Math.min(durationDays, Math.max(1, parseInt(e.target.value) || 1)))} className="w-16 h-10 border border-border rounded-[8px] text-center text-[14px] font-bold focus:outline-none focus:ring-1 focus:ring-brand" />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[11px] font-bold text-textMid">Send time</label>
                <input type="time" value={addTime} onChange={e => setAddTime(e.target.value)} className="h-10 border border-border rounded-[8px] px-3 text-[14px] font-semibold focus:outline-none focus:ring-1 focus:ring-brand" />
              </div>
            </div>
            <textarea className="w-full border border-border rounded-[10px] p-3 text-[13px] font-semibold resize-none h-24 focus:outline-none focus:ring-1 focus:ring-brand" placeholder="Message to all pairs…" maxLength={400} value={addContent} onChange={e => setAddContent(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={handleAddOrSaveMsg} className="flex-1 h-10 bg-brand text-white rounded-[10px] text-[13px] font-extrabold hover:bg-brandHover">{editingMsgId ? 'Save' : 'Add Message'}</button>
              <button onClick={() => { setShowAddMsg(false); setEditingMsgId(null); setAddDay(1); setAddTime('09:00'); setAddContent(''); }} className="h-10 px-4 bg-surfaceAlt text-textMid rounded-[10px] text-[13px] font-bold hover:bg-border">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddMsg(true)} className="w-full h-11 border border-dashed border-border rounded-[10px] text-[13px] font-bold text-textMid hover:bg-surfaceAlt transition-colors">＋ Add scheduled message</button>
        )}
      </div>

      {/* Completion reward */}
      <div className="border-t border-border pt-3">
        <button type="button" onClick={() => setRewardEnabled(!rewardEnabled)} className="flex items-center justify-between w-full mb-3">
          <div>
            <p className="text-[13px] font-extrabold text-text">🎁 Completion Reward</p>
            <p className="text-[11px] text-textMid text-left">Give a reward to pairs that complete the full campaign</p>
          </div>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${rewardEnabled ? 'bg-brand' : 'bg-gray-200'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${rewardEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
        {rewardEnabled && (
          <div className="flex flex-col gap-3 bg-warningBg border border-warning/30 rounded-[12px] p-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-warning">Reward File</label>
              <FileUploadZone
                bucket="reward"
                accept=".zip,.pdf,.mp4,application/zip,application/pdf,video/mp4"
                label="🎁 Tap to upload reward"
                sublabel="ZIP, PDF, MP4 up to 20MB"
                currentFile={rewardFileName ? { originalName: rewardFileName, sizeBytes: 0, mimeType: '' } : undefined}
                onUploadComplete={(result: any) => { setRewardFileId(result.fileId); setRewardFileName(result.originalName); }}
                onUploadError={(err: string) => console.error('Reward upload error:', err)}
                onRemove={async () => { if (rewardFileId) { try { await deleteFile(rewardFileId); } catch { } } setRewardFileId(null); setRewardFileName(null); }}
                onPendingFile={() => {}}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-warning">Unlock message</label>
              <textarea className="w-full border border-warning/30 rounded-[10px] p-3 text-[13px] font-semibold resize-none h-16 focus:outline-none focus:ring-1 focus:ring-warning bg-white" value={rewardMessage} onChange={e => setRewardMessage(e.target.value.slice(0, 300))} placeholder="Congrats! Here's your reward…" maxLength={300} />
            </div>
            {/* Reward links */}
            {rewardLinks.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {rewardLinks.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white border border-border rounded-[8px] px-3 py-2">
                    <div className="w-5 h-5 rounded-[4px] flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ backgroundColor: getDomainColor(l.url) }}>{getDomainInitial(l.url)}</div>
                    <span className="text-[12px] font-bold text-text truncate flex-1">{l.title}</span>
                    <button onClick={() => setRewardLinks(prev => prev.filter((_, idx) => idx !== i))} aria-label="Remove reward link" className="text-textLight hover:text-error"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            {rewardYoutube && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#E8312A"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                <span className="text-[11px] font-bold text-red-700 truncate flex-1">{rewardYoutube}</span>
                <button onClick={() => setRewardYoutube(null)} aria-label="Remove reward YouTube video" className="text-red-400 hover:text-red-700"><X size={12} /></button>
              </div>
            )}
            {!isAddingRewardLink && !isAddingRewardYT && (
              <div className="flex gap-2">
                {rewardLinks.length < 5 && <button onClick={() => setIsAddingRewardLink(true)} className="h-8 px-3 rounded-[8px] border border-warning/40 bg-white text-[11px] font-bold text-warning hover:bg-warningBg transition-colors flex items-center gap-1"><LinkIcon size={11} /> Add Link</button>}
                {!rewardYoutube && <button onClick={() => setIsAddingRewardYT(true)} className="h-8 px-3 rounded-[8px] border border-warning/40 bg-white text-[11px] font-bold text-warning hover:bg-warningBg transition-colors flex items-center gap-1"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> YouTube</button>}
              </div>
            )}
            {isAddingRewardLink && (
              <div className="flex flex-col gap-2 p-2 bg-white border border-border rounded-[8px]">
                <div className="flex gap-2">
                  <input type="text" value={rewardLinkUrl} onChange={e => { setRewardLinkUrl(e.target.value); setRewardLinkError(''); }} placeholder="URL…" className="flex-1 h-9 border border-border rounded-[8px] px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-brand" autoFocus onKeyDown={e => e.key === 'Enter' && addRewardLink(e)} />
                  <button onClick={addRewardLink} className="h-9 px-3 bg-brand text-white rounded-[8px] text-[12px] font-extrabold">Add</button>
                  <button onClick={() => setIsAddingRewardLink(false)} aria-label="Cancel adding reward link" className="w-9 h-9 border border-border rounded-[8px] flex items-center justify-center text-textMid hover:bg-surfaceAlt"><X size={14} /></button>
                </div>
                <input type="text" value={rewardLinkTitle} onChange={e => setRewardLinkTitle(e.target.value)} placeholder="Link title (optional)" className="w-full h-9 border border-border rounded-[8px] px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-brand" onKeyDown={e => e.key === 'Enter' && addRewardLink(e)} />
                {rewardLinkError && <span className="text-[10px] text-error font-bold">{rewardLinkError}</span>}
              </div>
            )}
            {isAddingRewardYT && (
              <div className="flex gap-2 p-2 bg-white border border-border rounded-[8px]">
                <input type="text" value={rewardYTInput} onChange={e => { setRewardYTInput(e.target.value); setRewardYTError(''); }} placeholder="YouTube URL…" className="flex-1 h-9 border border-border rounded-[8px] px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-brand" autoFocus onKeyDown={e => e.key === 'Enter' && addRewardYouTube(e)} />
                <button onClick={addRewardYouTube} className="h-9 px-3 bg-red-600 text-white rounded-[8px] text-[12px] font-extrabold">Add</button>
                <button onClick={() => setIsAddingRewardYT(false)} aria-label="Cancel adding reward YouTube video" className="w-9 h-9 border border-border rounded-[8px] flex items-center justify-center text-textMid hover:bg-surfaceAlt"><X size={14} /></button>
              </div>
            )}
            {isAddingRewardYT && rewardYTError && <span className="text-[10px] text-error font-bold">{rewardYTError}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main EditLinkSheet ────────────────────────────────────────────────────────
export const EditLinkSheet = ({ isOpen, onClose, onSuccess, link }: EditLinkSheetProps) => {
  const raw = link?._raw;
  const unlockType: string = link?.unlockType || raw?.unlock_type || 'custom_sponsor';
  const mode: string = link?.mode || raw?.mode || 'lock_content';

  // Common fields
  const [title, setTitle] = useState(link?.title || '');
  const [desc, setDesc] = useState(raw?.description || link?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevLink, setPrevLink] = useState(link);

  // Content fields (for email/social/sponsor — shared file + links + youtube)
  const [fileId, setFileId] = useState<string | null>(raw?.file?.id || null);
  const [fileName, setFileName] = useState<string | null>(raw?.file?.original_name || null);
  const [links, setLinks] = useState<{ url: string; title: string }[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(raw?.youtube_url || null);
  const [textContent, setTextContent] = useState('');

  // Type-specific config state
  const [emailConfig, setEmailConfig] = useState<EmailConfigData | null>(null);
  const [socialConfig, setSocialConfig] = useState<SocialConfigData | null>(null);
  const [customAd, setCustomAd] = useState<CustomAdData | null>(null);
  const [pairingData, setPairingData] = useState<any>(null);

  const { startProgress, stopProgress } = useProgress();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Re-init when link changes
  if (link !== prevLink) {
    setPrevLink(link);
    if (link) {
      const r = link._raw;
      setTitle(link.title || '');
      setDesc(r?.description || '');
      setFileId(r?.file?.id || null);
      setFileName(r?.file?.original_name || null);
      setYoutubeUrl(r?.youtube_url || null);
      setTextContent('');
      setLinks([]);
      // Restore links from unlock_url as a single item if present
      const ec = r?.email_config;
      const sc = r?.social_config;
      const spc = r?.sponsor_config;
      if (ec?.unlock_url) setLinks([{ url: ec.unlock_url, title: getDomainName(ec.unlock_url) }]);
      else if (sc?.unlock_url) setLinks([{ url: sc.unlock_url, title: getDomainName(sc.unlock_url) }]);
      else if (spc?.unlock_url) setLinks([{ url: spc.unlock_url, title: getDomainName(spc.unlock_url) }]);
      if (ec?.unlock_text) setTextContent(ec.unlock_text);
      else if (sc?.unlock_text) setTextContent(sc.unlock_text);
      else if (spc?.unlock_text) setTextContent(spc.unlock_text);
    }
  }

  // Map raw DB to EmailConfigData
  const emailInitial: EmailConfigData | null = (() => {
    const ec = raw?.email_config;
    if (!ec) return null;
    return {
      newsletterName: ec.newsletter_name || '',
      newsletterDescription: ec.newsletter_description || '',
      incentiveText: ec.incentive_text || '',
      platform: ec.platform || 'direct',
      platformDisplayName: ec.platform_display_name || 'Direct',
      confirmationMessage: ec.confirmation_message || '',
    };
  })();

  // Map raw DB to SocialConfigData
  const socialInitial: SocialConfigData | null = (() => {
    const sc = raw?.social_config;
    if (!sc) return null;
    return {
      customHeading: sc.custom_heading || '',
      followDescription: sc.follow_description || '',
      followTargets: (sc.follow_targets || []).map((t: any) => ({
        id: t.id || `target_${Math.random().toString(36).substr(2, 9)}`,
        type: t.type || 'platform',
        platform: t.platform || null,
        handle: t.handle || null,
        profileUrl: t.profile_url || null,
        customLabel: t.custom_label || null,
        customUrl: t.custom_url || null,
        customIcon: t.custom_icon || null,
        instructionText: t.instruction_text || null,
        error: null,
      })),
    };
  })();

  // Map raw DB to CustomAdData
  const adInitial: CustomAdData | null = (() => {
    const spc = raw?.sponsor_config;
    if (!spc) return null;
    return {
      brandName: spc.brand_name || '',
      redirectUrl: spc.brand_website || '',
      ctaText: spc.cta_button_label || 'Visit Sponsor',
      skipAfter: spc.skip_after_seconds || 5,
      fileName: spc.video_file?.original_name || '',
      fileSize: spc.video_file?.size_bytes || 0,
      fileMimeType: spc.video_file?.mime_type || '',
      previewUrl: '',
      fileId: spc.video_file?.id || null,
      isUploading: false,
      uploadError: null,
    };
  })();

  const handleSubmit = async () => {
    if (!link || !currentUser?.id) return;
    setIsSubmitting(true);
    startProgress();

    try {
      const updates: Record<string, any> = { title, description: desc };

      if (mode !== 'follower_pairing') {
        const unlockText = textContent.trim() || null;
        const unlockUrl = links.length > 0 ? links[0].url : null;
        updates.fileId = fileId;
        updates.youtubeUrl = youtubeUrl;

        if (unlockType === 'email_subscribe' && emailConfig) {
          updates.emailConfig = {
            newsletterName: emailConfig.newsletterName,
            newsletterDescription: emailConfig.newsletterDescription || null,
            incentiveText: emailConfig.incentiveText || null,
            confirmationMessage: emailConfig.confirmationMessage || null,
            platform: emailConfig.platform || 'direct',
            platformDisplayName: emailConfig.platformDisplayName || null,
            unlockText,
            unlockUrl,
          };
        }
        if (unlockType === 'social_follow' && socialConfig) {
          updates.socialConfig = {
            customHeading: socialConfig.customHeading || null,
            followDescription: socialConfig.followDescription || null,
            followTargets: socialConfig.followTargets?.map((t: any) => ({
              type: t.type, platform: t.platform, handle: t.handle, profileUrl: t.profileUrl,
              customLabel: t.customLabel, customUrl: t.customUrl, instructionText: t.instructionText,
            })) || [],
            unlockText,
            unlockUrl,
          };
        }
        if (unlockType === 'custom_sponsor' && customAd) {
          updates.sponsorConfig = {
            brandName: customAd.brandName,
            brandWebsite: customAd.redirectUrl || null,
            ctaButtonLabel: customAd.ctaText || 'Visit Sponsor',
            videoFileId: customAd.fileId || null,
            requiresClick: !!(customAd.redirectUrl),
            skipAfterSeconds: customAd.skipAfter || 5,
            unlockText,
            unlockUrl,
          };
        }
      }

      if (mode === 'follower_pairing' && pairingData) {
        updates.pairingConfig = pairingData;
      }

      await updateLink(link.id, currentUser.id, updates);
      stopProgress();
      onSuccess();
    } catch (err: any) {
      stopProgress();
      showToast({ message: err.message || 'Failed to save changes', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveButton = (
    <button onClick={handleSubmit} disabled={!title || isSubmitting} className="w-full h-[52px] rounded-[14px] text-[16px] font-extrabold bg-brand hover:bg-brandHover text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
      {isSubmitting ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Save Changes'}
    </button>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Edit Link" fullHeight footer={saveButton}>
      <div className="flex flex-col gap-5">

        {/* Title & Description — always shown */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Resource Title</label>
            <input type="text" className={`input-field h-[48px] text-[16px] font-bold ${title.length > 50 ? 'border-error/50' : ''}`} value={title} onChange={e => setTitle(e.target.value)} maxLength={60} />
            <span className={`absolute bottom-3 right-3 text-[11px] font-bold ${title.length >= 50 ? 'text-error' : 'text-textLight'}`}>{title.length}/60</span>
          </div>
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Description <span className="text-textLight font-semibold capitalize tracking-normal">(optional)</span></label>
            <textarea className="w-full border border-border rounded-[12px] p-3 text-[14px] font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors h-[72px] resize-none" value={desc} onChange={e => setDesc(e.target.value)} maxLength={150} placeholder="Add a short description…" />
            <span className={`absolute bottom-3 right-3 text-[11px] font-bold ${desc.length >= 140 ? 'text-error' : 'text-textLight'}`}>{desc.length}/150</span>
          </div>
        </div>

        {/* Type-specific sections */}
        {mode !== 'follower_pairing' && (
          <>
            <div className="h-px bg-border" />
            <ContentSection
              fileId={fileId} setFileId={setFileId}
              fileName={fileName} setFileName={setFileName}
              links={links} setLinks={setLinks}
              youtubeUrl={youtubeUrl} setYoutubeUrl={setYoutubeUrl}
              textContent={textContent} setTextContent={setTextContent}
            />
          </>
        )}

        {unlockType === 'email_subscribe' && (
          <>
            <div className="h-px bg-border" />
            <EmailConfigForm
              value={emailInitial}
              onChange={setEmailConfig}
              onErrorStateChange={() => {}}
            />
          </>
        )}

        {unlockType === 'social_follow' && (
          <>
            <div className="h-px bg-border" />
            <SocialConfigForm
              value={socialInitial}
              onChange={setSocialConfig}
              onErrorStateChange={() => {}}
            />
          </>
        )}

        {unlockType === 'custom_sponsor' && (
          <>
            <div className="h-px bg-border" />
            <CustomSponsorForm
              value={adInitial}
              onChange={v => setCustomAd(v)}
              onErrorStateChange={() => {}}
            />
          </>
        )}

        {mode === 'follower_pairing' && (
          <>
            <div className="h-px bg-border" />
            <PairingEditSection raw={raw} onChange={setPairingData} />
          </>
        )}

      </div>
    </BottomSheet>
  );
};
