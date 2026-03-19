import { useState, useEffect } from 'react';
import { Link as LinkIcon, X } from 'lucide-react';
import FileUploadZone from '../FileUploadZone';
import { deleteFile, formatFileSize } from '../../services/uploadService';

export interface LinkItem {
    url: string;
    title: string;
}

export interface ScheduledMessage {
    id: string;
    dayNumber: number;
    sendTime: string;
    content: string;
    links: LinkItem[];
    youtubeUrl?: string | null;
    isSent: boolean;
}

export interface FollowerPairingConfigData {
    topic: string;
    description: string;
    commitmentPrompt: string;
    durationDays: number;
    checkInFrequency: 'daily' | 'every_other_day' | 'weekly';
    guidelines: string;
    creatorResourceUrl: string | null;
    creatorResourceLabel: string | null;
    genderMatchingEnabled: boolean;
    scheduledMessages: ScheduledMessage[];
    totalParticipants?: number;
    activePairs?: number;
    completedPairs?: number;
    isAcceptingParticipants?: boolean;
    waitingPool?: { male: number; female: number; any: number };
    completionAsset?: {
        enabled: boolean;
        fileName: string | null;
        fileSize: string | null;
        fileType: string | null;
        unlockMessage: string;
        links?: LinkItem[];
        youtubeUrl?: string | null;
        fileId?: string | null;
        isUploading?: boolean;
        sizeBytes?: number | null;
    };
}

interface FollowerPairingConfigFormProps {
    value: FollowerPairingConfigData | null;
    onChange: (data: FollowerPairingConfigData) => void;
    onErrorStateChange: (hasErrors: boolean) => void;
    resourceTitle: string;
    setResourceTitle: (val: string) => void;
    resourceDescription: string;
    setResourceDescription: (val: string) => void;
}

const messageTemplates = [
    {
        name: "Day 1 — Welcome",
        dayNumber: 1,
        sendTime: "09:00",
        content: "Welcome to the challenge! The first step is to introduce yourself to your partner. Share your commitment and ask about theirs. The more specific you both are, the better this works.",
        links: [],
    },
    {
        name: "Midpoint Check-In",
        dayNumber: null as number | null,
        sendTime: "09:00",
        content: "You're halfway through! Check in with your partner today. What's working? What's hard? Honesty with your partner is more valuable than performing consistency.",
        links: [],
    },
    {
        name: "Final Day",
        dayNumber: null as number | null,
        sendTime: "09:00",
        content: "Today is the final day. Tell your partner one real thing that changed because of this challenge — even something small. This conversation is yours. I can't see it. Make it count.",
        links: [],
    },
    {
        name: "Accountability Check",
        dayNumber: null as number | null,
        sendTime: "09:00",
        content: "Quick check-in from me. How are both of you doing? Remember — if you've slipped, your partner is there to help you get back, not to judge you.",
        links: [],
    },
];

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

export const FollowerPairingConfigForm = ({ 
    value, 
    onChange, 
    onErrorStateChange,
    resourceTitle,
    setResourceTitle,
    resourceDescription,
    setResourceDescription
}: FollowerPairingConfigFormProps) => {
    const [data, setData] = useState<FollowerPairingConfigData>(value || {
        topic: '',
        description: '',
        commitmentPrompt: '',
        durationDays: 14,
        checkInFrequency: 'daily',
        guidelines: '',
        creatorResourceUrl: null,
        creatorResourceLabel: null,
        genderMatchingEnabled: true,
        scheduledMessages: [],
        completionAsset: {
            enabled: false,
            fileName: null,
            fileSize: null,
            fileType: null,
            unlockMessage: '',
            links: [],
            youtubeUrl: null,
            fileId: null,
            isUploading: false,
            sizeBytes: null,
        }
    });

    const [hasLimit] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showCompletionReward, setShowCompletionReward] = useState(data.completionAsset?.enabled || false);
    const [isAddingRewardLink, setIsAddingRewardLink] = useState(false);
    const [isAddingRewardYouTube, setIsAddingRewardYouTube] = useState(false);
    const [rewardLinkUrl, setRewardLinkUrl] = useState('');
    const [rewardLinkTitle, setRewardLinkTitle] = useState('');
    const [rewardLinkError, setRewardLinkError] = useState('');
    const [rewardYoutubeInput, setRewardYoutubeInput] = useState('');
    const [rewardYoutubeError, setRewardYoutubeError] = useState('');

    // Add form fields
    const [addDay, setAddDay] = useState(1);
    const [addTime, setAddTime] = useState('09:00');
    const [addContent, setAddContent] = useState('');
    const [addLinks, setAddLinks] = useState<LinkItem[]>([]);
    const [addYoutubeUrl, setAddYoutubeUrl] = useState<string | null>(null);
    const [dayError, setDayError] = useState('');

    // Link/YouTube Adder State
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkTitle, setLinkTitle] = useState('');
    const [linkError, setLinkError] = useState('');
    const [isAddingYouTube, setIsAddingYouTube] = useState(false);
    const [youtubeInput, setYoutubeInput] = useState('');
    const [youtubeError, setYoutubeError] = useState('');

    useEffect(() => {
        let hasErrors = !data.topic || !data.description;
        if (data.creatorResourceUrl && !data.creatorResourceLabel) hasErrors = true;
        if (hasLimit) hasErrors = true;

        // If completion reward is enabled, resource title is required
        if (data.completionAsset?.enabled && !resourceTitle) hasErrors = true;

        onErrorStateChange(hasErrors);
        onChange(data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, hasLimit, resourceTitle]);

    // Sync resourceTitle with topic if reward is disabled
    useEffect(() => {
        if (!data.completionAsset?.enabled) {
            if (resourceTitle !== data.topic) {
                setResourceTitle(data.topic);
            }
        }
    }, [data.topic, data.completionAsset?.enabled, resourceTitle, setResourceTitle]);

    const handleChange = <K extends keyof FollowerPairingConfigData>(field: K, val: FollowerPairingConfigData[K]) => {
        setData((prev: FollowerPairingConfigData) => ({ ...prev, [field]: val }));
    };

    const sortedMessages = [...data.scheduledMessages].sort((a, b) => a.dayNumber - b.dayNumber);

    const handleAddMessage = () => {
        if (addDay < 1 || addDay > data.durationDays) {
            setDayError('Cannot exceed campaign duration');
            return;
        }
        if (!addContent.trim()) return;

        const newMsg: ScheduledMessage = {
            id: `sched_${Date.now()}`,
            dayNumber: addDay,
            sendTime: addTime,
            content: addContent.trim(),
            links: addLinks,
            youtubeUrl: addYoutubeUrl,
            isSent: false,
        };

        handleChange('scheduledMessages', [...data.scheduledMessages, newMsg]);
        resetAddForm();
    };

    const resetAddForm = () => {
        setAddDay(1);
        setAddTime('09:00');
        setAddContent('');
        setAddLinks([]);
        setAddYoutubeUrl(null);
        setShowAddForm(false);
        setEditingId(null);
        setDayError('');
        setIsAddingLink(false);
        setIsAddingYouTube(false);
    };

    const handleDeleteMessage = (id: string) => {
        handleChange('scheduledMessages', data.scheduledMessages.filter((m: ScheduledMessage) => m.id !== id));
    };

    const handleEditMessage = (id: string) => {
        const msg = data.scheduledMessages.find((m: ScheduledMessage) => m.id === id);
        if (!msg) return;
        setAddDay(msg.dayNumber);
        setAddTime(msg.sendTime);
        setAddContent(msg.content);
        setAddLinks(msg.links || []);
        setAddYoutubeUrl(msg.youtubeUrl || null);
        setEditingId(id);
        setShowAddForm(true);
    };

    const handleSaveEdit = () => {
        if (addDay < 1 || addDay > data.durationDays) {
            setDayError('Cannot exceed campaign duration');
            return;
        }
        if (!addContent.trim() || !editingId) return;

        handleChange('scheduledMessages', data.scheduledMessages.map((m: ScheduledMessage) =>
            m.id === editingId ? { ...m, dayNumber: addDay, sendTime: addTime, content: addContent.trim(), links: addLinks, youtubeUrl: addYoutubeUrl } : m
        ));
        resetAddForm();
    };

    const handleUseTemplate = (template: typeof messageTemplates[0]) => {
        const day = template.dayNumber !== null ? template.dayNumber :
            template.name.includes('Midpoint') ? Math.floor(data.durationDays / 2) :
            template.name.includes('Final') ? data.durationDays : 1;
        setAddDay(day);
        setAddTime(template.sendTime);
        setAddContent(template.content);
        setAddLinks(template.links || []);
        setAddYoutubeUrl(null);
        setShowAddForm(true);
        setShowTemplates(false);
    };

    const formatTime12h = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const validateAndAddLink = (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        
        let finalUrl = linkUrl.trim();
        if (!finalUrl) return;

        if (!/^https?:\/\//i.test(finalUrl)) {
            finalUrl = 'https://' + finalUrl;
        }

        if (!finalUrl.includes('.')) {
            setLinkError("Please enter a valid URL like https://example.com");
            return;
        }

        const isDuplicate = addLinks.some(l => l.url.toLowerCase() === finalUrl.toLowerCase());
        if (isDuplicate) {
            setLinkError("Already added");
            return;
        }

        const finalTitle = linkTitle.trim() || getDomainName(finalUrl);

        setAddLinks(prev => [...prev, { url: finalUrl, title: finalTitle }]);
        setIsAddingLink(false);
        setLinkUrl('');
        setLinkTitle('');
        setLinkError('');
    };

    const removeLink = (index: number) => {
        setAddLinks((prev: LinkItem[]) => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    };

    const validateAndAddYouTube = (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        const url = youtubeInput.trim();
        const isValidYouTubeUrl = (str: string) => {
            const patterns = [
                /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,
                /^https?:\/\/youtu\.be\/[\w-]{11}/,
                /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}/,
            ];
            return patterns.some(p => p.test(str));
        };

        if (!isValidYouTubeUrl(url)) {
            setYoutubeError("Please paste a valid YouTube video URL");
            return;
        }

        setAddYoutubeUrl(url);
        setIsAddingYouTube(false);
        setYoutubeInput('');
        setYoutubeError('');
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 className="text-[13px] font-[900] text-[#111] mb-1">Accountability Setup</h4>

            {/* Topic */}
            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">What is this accountability about?</label>
                <input
                    type="text"
                    className="w-full h-[44px] rounded-[14px] border border-[#E8E8E8] px-3 text-[16px] font-[600] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                    placeholder="e.g. Building a morning routine, hitting a revenue goal, reading daily"
                    maxLength={60}
                    value={data.topic}
                    onChange={(e) => handleChange('topic', e.target.value)}
                />
                <span className="text-[11px] text-textLight text-right">{data.topic.length}/60</span>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">Describe the experience to participants</label>
                <textarea
                    className="w-full h-[100px] rounded-[14px] border border-[#E8E8E8] p-3 text-[16px] font-[600] resize-none focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                    placeholder="Tell participants what they are signing up for."
                    maxLength={300}
                    value={data.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                />
                <span className="text-[11px] text-textLight text-right">{data.description.length}/300</span>
            </div>


            {/* Duration — dynamic input */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className="text-[12px] font-[700] text-textMid">Pairing duration</label>
                    <div className="flex items-center gap-1.5">
                        <input
                            type="number"
                            min={2}
                            max={90}
                            value={data.durationDays}
                            onChange={(e) => {
                                const v = Math.min(90, Math.max(2, parseInt(e.target.value) || 2));
                                handleChange('durationDays', v);
                            }}
                            className="w-[52px] h-[32px] rounded-[8px] border border-[#E6E2D9] text-center text-[16px] font-[800] text-text focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                        />
                        <span className="text-[12px] font-[700] text-textMid">days</span>
                    </div>
                </div>

                {/* Slider */}
                <input
                    type="range"
                    min={2}
                    max={90}
                    value={data.durationDays}
                    onChange={(e) => handleChange('durationDays', parseInt(e.target.value))}
                    className="w-full h-[4px] rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #92400E 0%, #92400E ${((data.durationDays - 2) / 88) * 100}%, #E6E2D9 ${((data.durationDays - 2) / 88) * 100}%, #E6E2D9 100%)`,
                    }}
                />
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-[600] text-textLight">2 days</span>
                    <span className="text-[10px] font-[600] text-textLight">3 months</span>
                </div>

                {/* Quick-pick pills */}
                <div className="flex gap-1.5 flex-wrap">
                    {[7, 14, 21, 30, 60, 90].map(days => (
                        <button
                            key={days}
                            type="button"
                            onClick={() => handleChange('durationDays', days)}
                            className={`h-[28px] px-3 rounded-[14px] text-[11px] font-[700] transition-colors ${
                                data.durationDays === days
                                    ? 'bg-[#92400E] text-white'
                                    : 'bg-[#F3F1EC] text-textMid hover:bg-[#E6E2D9]'
                            }`}
                        >
                            {days <= 30 ? `${days}d` : `${days / 30}mo`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Guidelines */}
            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">Rules or guidelines (optional)</label>
                <textarea
                    className="w-full h-[70px] rounded-[14px] border border-[#E8E8E8] p-3 text-[16px] font-[600] resize-none focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                    placeholder="Any ground rules for participants?"
                    maxLength={200}
                    value={data.guidelines}
                    onChange={(e) => handleChange('guidelines', e.target.value)}
                />
                <span className="text-[11px] text-textLight text-right">{data.guidelines.length}/200</span>
            </div>

            {/* Creator resource link */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-[700] text-textMid">Link to related content (optional)</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="url"
                        className="flex-1 h-[44px] rounded-[14px] border border-[#E8E8E8] px-3 text-[16px] font-[600] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                        placeholder="https://yoursite.com/resource"
                        value={data.creatorResourceUrl || ''}
                        onChange={(e) => handleChange('creatorResourceUrl', e.target.value)}
                    />
                    <input
                        type="text"
                        className="flex-1 h-[44px] rounded-[14px] border border-[#E8E8E8] px-3 text-[16px] font-[600] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                        placeholder="e.g. Read my guide on morning routines"
                        maxLength={50}
                        value={data.creatorResourceLabel || ''}
                        onChange={(e) => handleChange('creatorResourceLabel', e.target.value)}
                    />
                </div>
            </div>

            {/* ═══════ Section B — Scheduled Messages ═══════ */}
            <div className="border-t border-[#F0F0F0] pt-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-[900] text-[#111]">📅 Scheduled Messages</span>
                    <span className="text-[12px] font-[700] text-textMid">{data.scheduledMessages.length} messages</span>
                </div>
                <p className="text-[12px] font-[600] text-[#888] mb-4" style={{ lineHeight: '1.65' }}>
                    Preset messages sent automatically to all pairs on specific days. Participants see these as challenge updates — separate from their private chat.
                </p>

                {/* Message list */}
                <div className="flex flex-col gap-2.5">
                    {sortedMessages.map(msg => (
                        <div key={msg.id} className="rounded-[12px] p-3.5" style={{ backgroundColor: '#FAFAFA', border: '1.5px solid #E8E8E8' }}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-[900] text-[#92400E]">Day {msg.dayNumber}</span>
                                    <span className="text-[#BBB]">·</span>
                                    <span className="text-[12px] font-[600] text-[#888]">{formatTime12h(msg.sendTime)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEditMessage(msg.id)} className="w-8 h-8 flex items-center justify-center text-[18px] text-[#888] hover:text-[#555] transition-transform hover:scale-110">✏️</button>
                                    <button onClick={() => handleDeleteMessage(msg.id)} className="w-8 h-8 flex items-center justify-center text-[18px] text-[#888] hover:text-[#E8312A] transition-transform hover:scale-110">✕</button>
                                </div>
                            </div>
                            <p className="text-[13px] font-[600] text-[#555] mb-2" style={{ lineHeight: '1.65', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                                {msg.content}
                            </p>
                            
                            {/* Message Attachments Preview */}
                            {(msg.youtubeUrl || (msg.links && msg.links.length > 0)) && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {msg.youtubeUrl && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-[10px] font-bold text-red-600 rounded-full border border-red-100">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                            YouTube
                                        </div>
                                    )}
                                    {msg.links?.map((l: LinkItem, i: number) => (
                                        <div key={i} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-full border border-blue-100">
                                            <LinkIcon size={8} />
                                            {getDomainName(l.url)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Quick templates */}
                {!showAddForm && (
                    <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="w-full flex items-center justify-between px-3 py-2 mt-3 text-[13px] font-[700] text-[#888] hover:text-[#555] rounded-[8px] hover:bg-[#FAFAFA]"
                    >
                        <span>Quick templates</span>
                        <span className="text-[16px] text-[#BBBBB]" style={{ transform: showTemplates ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                    </button>
                )}

                {showTemplates && !showAddForm && (
                    <div className="flex flex-col gap-2 mt-2" style={{ animation: 'fadeIn 0.2s' }}>
                        {messageTemplates.map((tmpl, i) => (
                            <div key={i} className="h-[48px] bg-white rounded-[10px] flex items-center justify-between px-3" style={{ border: '1px solid #E8E8E8' }}>
                                <span className="text-[13px] font-[700] text-[#333]">{tmpl.name}</span>
                                <button
                                    onClick={() => handleUseTemplate(tmpl)}
                                    className="h-7 px-3 rounded-[8px] text-[12px] font-[800] text-[#B45309] border border-[#B45309] hover:bg-[#FFFBEB]"
                                >
                                    Use →
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add button */}
                {!showAddForm && (
                    <button
                        onClick={() => { setShowAddForm(true); setEditingId(null); setAddDay(1); setAddTime('09:00'); setAddContent(''); setAddLinks([]); setAddYoutubeUrl(null); }}
                        className="w-full h-[44px] rounded-[12px] flex items-center justify-center text-[16px] font-[700] text-[#888] mt-3"
                        style={{ border: '1.5px dashed #D1D5DB', backgroundColor: '#FAFAFA' }}
                    >
                        ＋ Add scheduled message
                    </button>
                )}

                {/* Add/Edit form */}
                {showAddForm && (
                    <div className="mt-3 flex flex-col gap-4 p-3.5 rounded-[12px] bg-white border-[1.5px] border-[#E8E8E8] shadow-sm animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[12px] font-[700] text-textMid">Send on day</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={data.durationDays}
                                        value={addDay}
                                        onChange={(e) => { setAddDay(parseInt(e.target.value) || 1); setDayError(''); }}
                                        className="w-[70px] h-[44px] rounded-[10px] border border-[#E8E8E8] px-3 text-[16px] font-[600] focus:outline-none focus:border-[#92400E]"
                                    />
                                    <span className="text-[13px] font-[600] text-[#888]">of {data.durationDays}</span>
                                </div>
                                {dayError && <span className="text-[11px] text-[#E8312A] font-[700]">{dayError}</span>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[12px] font-[700] text-textMid">At what time</label>
                                <input
                                    type="time"
                                    value={addTime}
                                    onChange={(e) => setAddTime(e.target.value)}
                                    className="h-[44px] rounded-[10px] border border-[#E8E8E8] px-3 text-[16px] font-[600] focus:outline-none focus:border-[#92400E]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 relative">
                            <label className="text-[12px] font-[700] text-textMid">Message to all pairs</label>
                            <textarea
                                className="w-full min-h-[100px] rounded-[12px] border border-[#E8E8E8] p-3 text-[13px] font-[600] resize-none focus:outline-none focus:border-[#92400E] leading-relaxed"
                                placeholder="Write a message that encourages, guides, or checks in with all pairs on this day..."
                                maxLength={400}
                                value={addContent}
                                onChange={(e) => setAddContent(e.target.value)}
                            />
                            <span className="text-[11px] text-textLight text-right mt-1">{addContent.length}/400</span>
                        </div>

                        {/* Link/YouTube Section for Message */}
                        <div className="flex flex-col gap-2">
                            {/* Attachments Preview in Editor */}
                            {(addYoutubeUrl || addLinks.length > 0) && (
                                <div className="flex flex-col gap-2 mb-2">
                                    {addYoutubeUrl && (
                                        <div className="flex items-center gap-3 p-2 bg-red-50 rounded-[8px] border border-red-100 relative group">
                                            <div className="shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="#E8312A" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></div>
                                            <span className="text-[12px] font-[700] text-red-700 truncate">{addYoutubeUrl}</span>
                                            <button onClick={() => setAddYoutubeUrl(null)} className="absolute right-2 text-red-400 hover:text-red-700"><X size={14} /></button>
                                        </div>
                                    )}
                                    {addLinks.map((link, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 bg-blue-50 rounded-[8px] border border-blue-100 relative group">
                                            <div className="w-6 h-6 rounded-[4px] flex items-center justify-center text-white font-black text-[12px]" style={{ backgroundColor: getDomainColor(link.url) }}>{getDomainInitial(link.url)}</div>
                                            <span className="text-[12px] font-[700] text-blue-700 truncate">{link.title}</span>
                                            <button onClick={() => removeLink(idx)} className="absolute right-2 text-blue-400 hover:text-blue-700"><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isAddingLink && !isAddingYouTube ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setIsAddingLink(true); setLinkUrl(''); setLinkTitle(''); setLinkError(''); }}
                                        disabled={addLinks.length >= 5}
                                        className="h-[32px] px-3 rounded-[8px] border border-[#E8E8E8] bg-white hover:bg-[#F8F8F8] text-[11px] font-[800] text-[#555] flex items-center gap-1.5 transition-colors"
                                    >
                                        ＋ Link
                                    </button>
                                    {!addYoutubeUrl && (
                                        <button
                                            onClick={() => { setIsAddingYouTube(true); setYoutubeInput(''); setYoutubeError(''); }}
                                            className="h-[32px] px-3 rounded-[8px] border border-[#E8E8E8] bg-white hover:bg-[#F8F8F8] text-[11px] font-[800] text-[#555] flex items-center gap-1.5 transition-colors"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#E8312A" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                            YouTube
                                        </button>
                                    )}
                                </div>
                            ) : isAddingLink ? (
                                <div className="flex flex-col gap-2 p-2 bg-[#F8F8F8] rounded-[8px] border border-[#E8E8E8]">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={linkUrl}
                                            onChange={(e: any) => { setLinkUrl(e.target.value); setLinkError(''); }}
                                            placeholder="Paste URL..."
                                            className="flex-1 h-[32px] rounded-[6px] border border-[#E8E8E8] px-2 text-[12px] font-[600] outline-none focus:border-[#92400E]"
                                            autoFocus
                                            onKeyDown={(e: any) => e.key === 'Enter' && validateAndAddLink()}
                                        />
                                        <button onClick={validateAndAddLink} className="h-[32px] px-3 rounded-[6px] bg-[#92400E] text-white text-[11px] font-[800]">Add</button>
                                        <button onClick={() => setIsAddingLink(false)} className="text-[#999] hover:text-[#555] px-1"><X size={16} /></button>
                                    </div>
                                    <input
                                        type="text"
                                        value={linkTitle}
                                        onChange={(e: any) => setLinkTitle(e.target.value)}
                                        placeholder="Link title (optional)"
                                        className="w-full h-[32px] rounded-[6px] border border-[#E8E8E8] px-2 text-[12px] font-[600] outline-none focus:border-[#92400E]"
                                    />
                                    {linkError && <span className="text-[10px] text-red-600 font-bold">{linkError}</span>}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 p-2 bg-[#F8F8F8] rounded-[8px] border border-[#E8E8E8]">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={youtubeInput}
                                            onChange={(e: any) => { setYoutubeInput(e.target.value); setYoutubeError(''); }}
                                            placeholder="Paste YouTube URL..."
                                            className="flex-1 h-[32px] rounded-[6px] border border-[#E8E8E8] px-2 text-[12px] font-[600] outline-none focus:border-[#92400E]"
                                            autoFocus
                                            onKeyDown={(e: any) => e.key === 'Enter' && validateAndAddYouTube()}
                                        />
                                        <button onClick={validateAndAddYouTube} className="h-[32px] px-3 rounded-[6px] bg-red-600 text-white text-[11px] font-[800]">Add</button>
                                        <button onClick={() => setIsAddingYouTube(false)} className="text-[#999] hover:text-[#555] px-1"><X size={16} /></button>
                                    </div>
                                    {youtubeError && <span className="text-[10px] text-red-600 font-bold">{youtubeError}</span>}
                                </div>
                            )}
                        </div>

                        <div className="rounded-[10px] p-2.5" style={{ backgroundColor: '#FFFBEB' }}>
                            <p className="text-[11px] font-[600] text-[#92400E]" style={{ lineHeight: '1.6' }}>
                                📣 This message appears in all pair chats as a "Challenge Update" — visually distinct from their private messages. You cannot see their replies.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={editingId ? handleSaveEdit : handleAddMessage}
                                className="h-[44px] px-6 rounded-[12px] bg-[#B45309] text-white text-[16px] font-[800] flex-1 hover:bg-[#92400E] transition-colors"
                            >
                                {editingId ? 'Save Changes' : 'Add Message'}
                            </button>
                            <button
                                onClick={resetAddForm}
                                className="h-[44px] px-4 rounded-[12px] bg-[#F3F1EC] text-textMid text-[16px] font-[800] hover:bg-[#E6E2D9] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════ Section C — Completion Reward ═══════ */}
            <div className="border-t border-[#F0F0F0] pt-4 mt-2">
                <div className="flex flex-col gap-1 mb-3">
                    <button
                        type="button"
                        onClick={() => {
                            const willShow = !showCompletionReward;
                            setShowCompletionReward(willShow);
                            handleChange('completionAsset', {
                                enabled: willShow,
                                fileName: willShow ? data.completionAsset?.fileName || null : null,
                                fileSize: willShow ? data.completionAsset?.fileSize || null : null,
                                fileType: willShow ? data.completionAsset?.fileType || null : null,
                                unlockMessage: willShow ? data.completionAsset?.unlockMessage || '' : '',
                                links: willShow ? data.completionAsset?.links || [] : [],
                                youtubeUrl: willShow ? data.completionAsset?.youtubeUrl || null : null
                            });
                        }}
                        className="flex justify-between items-center w-full text-left"
                    >
                        <div className="flex flex-col gap-1">
                            <h4 className="text-[13px] font-[900] text-[#111]">🎁 Reward for completions (Optional)</h4>
                            <p className="text-[12px] font-[600] text-[#888] pr-4">Give a downloadable file to pairs that successfully complete the full duration.</p>
                        </div>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${showCompletionReward ? 'bg-brand' : 'bg-gray-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${showCompletionReward ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>
                </div>

                {showCompletionReward && (
                    <div className="flex flex-col gap-4 bg-[#FFFBEB] p-4 rounded-[12px] border border-[#FDE68A] animate-in fade-in zoom-in-95 duration-200">
                        {/* File Upload Zone */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-[700] text-[#92400E]">Upload Reward File</label>
                            <FileUploadZone
                                bucket="reward"
                                accept=".zip,.pdf,.mp4,application/zip,application/x-zip-compressed,application/pdf,video/mp4"
                                label="🎁 Tap to upload reward"
                                sublabel="ZIP, PDF, MP4 up to 20MB"
                                currentFile={
                                    data.completionAsset?.fileName
                                        ? {
                                            originalName: data.completionAsset.fileName,
                                            sizeBytes: data.completionAsset.sizeBytes || 0,
                                            mimeType: data.completionAsset.fileType || '',
                                        }
                                        : undefined
                                }
                                onUploadComplete={(result: any) => {
                                    handleChange('completionAsset', {
                                        ...data.completionAsset!,
                                        fileName: result.originalName,
                                        fileSize: formatFileSize(result.sizeBytes),
                                        fileType: result.mimeType,
                                        fileId: result.fileId,
                                        isUploading: false,
                                        sizeBytes: result.sizeBytes,
                                    });
                                }}
                                onUploadError={(error: string) => {
                                    console.error('Reward file upload error:', error);
                                    handleChange('completionAsset', {
                                        ...data.completionAsset!,
                                        isUploading: false,
                                    });
                                }}
                                onRemove={async () => {
                                    // Delete file from R2 if it was uploaded
                                    if (data.completionAsset?.fileId) {
                                        try {
                                            await deleteFile(data.completionAsset.fileId);
                                        } catch (err) {
                                            console.error('Failed to delete reward file:', err);
                                        }
                                    }
                                    handleChange('completionAsset', {
                                        ...data.completionAsset!,
                                        fileName: null,
                                        fileSize: null,
                                        fileType: null,
                                        fileId: null,
                                        isUploading: false,
                                        sizeBytes: null,
                                    });
                                }}
                                onPendingFile={() => {}}
                            />
                            <span className="text-[10px] font-[600] text-[#D97757]">Max file size: 20 MB</span>
                        </div>

                        {/* Optional Unlock Message */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-[700] text-[#92400E]">Bonus Message (Optional)</label>
                            <textarea
                                className="w-full h-[80px] rounded-[12px] border border-[#FDE68A] p-3 text-[16px] font-[600] resize-none focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] bg-white/80"
                                placeholder="A note that appears with their reward when they finish..."
                                maxLength={200}
                                value={data.completionAsset?.unlockMessage || ''}
                                onChange={(e) => handleChange('completionAsset', { ...data.completionAsset!, unlockMessage: e.target.value })}
                            />
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-[#D97757] font-[600]">This shows up as a "Creator Note"</span>
                                <span className="text-[11px] text-[#D97757] text-right">{(data.completionAsset?.unlockMessage || '').length}/200</span>
                            </div>
                        </div>

                        {/* Link/YouTube Section for Reward */}
                        <div className="flex flex-col gap-2">
                             <label className="text-[12px] font-[700] text-[#92400E]">Additional Prize Content (Links/Video)</label>
                            {/* Attachments Preview */}
                            {(data.completionAsset?.youtubeUrl || (data.completionAsset?.links?.length || 0) > 0) && (
                                <div className="flex flex-col gap-2 mb-2">
                                    {data.completionAsset?.youtubeUrl && (
                                        <div className="flex items-center gap-3 p-2 bg-red-50 rounded-[8px] border border-red-100 relative group">
                                            <div className="shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="#E8312A" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></div>
                                            <span className="text-[12px] font-[700] text-red-700 truncate">{data.completionAsset.youtubeUrl}</span>
                                            <button 
                                                onClick={() => handleChange('completionAsset', { ...data.completionAsset!, youtubeUrl: null })} 
                                                className="absolute right-2 text-red-400 hover:text-red-700"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                    {data.completionAsset?.links?.map((link, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 bg-blue-50 rounded-[8px] border border-blue-100 relative group">
                                            <div className="w-6 h-6 rounded-[4px] flex items-center justify-center text-white font-black text-[12px]" style={{ backgroundColor: getDomainColor(link.url) }}>{getDomainInitial(link.url)}</div>
                                            <span className="text-[12px] font-[700] text-blue-700 truncate">{link.title}</span>
                                            <button 
                                                onClick={() => {
                                                    const newLinks = [...(data.completionAsset?.links || [])];
                                                    newLinks.splice(idx, 1);
                                                    handleChange('completionAsset', { ...data.completionAsset!, links: newLinks });
                                                }} 
                                                className="absolute right-2 text-blue-400 hover:text-blue-700"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isAddingRewardLink && !isAddingRewardYouTube ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setIsAddingRewardLink(true); setRewardLinkUrl(''); setRewardLinkTitle(''); setRewardLinkError(''); }}
                                        disabled={(data.completionAsset?.links?.length || 0) >= 5}
                                        className="h-[32px] px-3 rounded-[8px] border border-[#FDE68A] bg-white hover:bg-[#FFFBEB] text-[11px] font-[800] text-[#92400E] flex items-center gap-1.5 transition-colors"
                                    >
                                        ＋ Link
                                    </button>
                                    {!data.completionAsset?.youtubeUrl && (
                                        <button
                                            onClick={() => { setIsAddingRewardYouTube(true); setRewardYoutubeInput(''); setRewardYoutubeError(''); }}
                                            className="h-[32px] px-3 rounded-[8px] border border-[#FDE68A] bg-white hover:bg-[#FFFBEB] text-[11px] font-[800] text-[#92400E] flex items-center gap-1.5 transition-colors"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#E8312A" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                            YouTube
                                        </button>
                                    )}
                                </div>
                            ) : isAddingRewardLink ? (
                                <div className="flex flex-col gap-2 p-2 bg-white rounded-[8px] border border-[#FDE68A]">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={rewardLinkUrl}
                                            onChange={(e: any) => { setRewardLinkUrl(e.target.value); setRewardLinkError(''); }}
                                            placeholder="Paste URL..."
                                            className="flex-1 h-[32px] bg-[#FAF9F7] border border-[#E8E8E8] rounded-[6px] px-2 text-[12px] font-[600] focus:outline-none focus:border-brand"
                                        />
                                        <input
                                            type="text"
                                            value={rewardLinkTitle}
                                            onChange={(e: any) => setRewardLinkTitle(e.target.value)}
                                            placeholder="Label (e.g. 'Bonus PDF')"
                                            className="w-[120px] h-[32px] bg-[#FAF9F7] border border-[#E8E8E8] rounded-[6px] px-2 text-[12px] font-[600] focus:outline-none focus:border-brand"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        {rewardLinkError ? <span className="text-[10px] text-red-500 font-[700]">{rewardLinkError}</span> : <div />}
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsAddingRewardLink(false)} className="text-[11px] font-[800] text-textMid px-2 py-1">Cancel</button>
                                            <button 
                                                onClick={() => {
                                                    if (!rewardLinkUrl) { setRewardLinkError('URL required'); return; }
                                                    const cleanUrl = rewardLinkUrl.includes('://') ? rewardLinkUrl : `https://${rewardLinkUrl}`;
                                                    const newLinks = [...(data.completionAsset?.links || []), { url: cleanUrl, title: rewardLinkTitle || getDomainName(cleanUrl) }];
                                                    handleChange('completionAsset', { ...data.completionAsset!, links: newLinks });
                                                    setIsAddingRewardLink(false);
                                                }}
                                                className="bg-brand text-white px-3 py-1 rounded-[6px] text-[11px] font-[900]"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 p-2 bg-white rounded-[8px] border border-[#FDE68A]">
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={rewardYoutubeInput}
                                                onChange={(e: any) => { setRewardYoutubeInput(e.target.value); setRewardYoutubeError(''); }}
                                                placeholder="Paste YouTube Link..."
                                                className="w-full h-[32px] bg-[#FAF9F7] border border-[#E8E8E8] rounded-[6px] pl-8 pr-2 text-[12px] font-[600] focus:outline-none focus:border-red-500"
                                            />
                                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#E8312A"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsAddingRewardYouTube(false)} className="text-[11px] font-[800] text-textMid px-2 py-1">Cancel</button>
                                            <button 
                                                onClick={() => {
                                                    if (!rewardYoutubeInput) { setRewardYoutubeError('URL required'); return; }
                                                    if (!rewardYoutubeInput.includes('youtube.com') && !rewardYoutubeInput.includes('youtu.be')) {
                                                        setRewardYoutubeError('Invalid YouTube URL'); return;
                                                    }
                                                    handleChange('completionAsset', { ...data.completionAsset!, youtubeUrl: rewardYoutubeInput });
                                                    setIsAddingRewardYouTube(false);
                                                }}
                                                className="bg-red-600 text-white px-3 py-1 rounded-[6px] text-[11px] font-[900]"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    {rewardYoutubeError && <span className="text-[10px] text-red-500 font-[700] px-1">{rewardYoutubeError}</span>}
                                </div>
                            )}
                        </div>

                        {/* Resource Title & Description moved here for Follower Pairing */}
                        <div className="flex flex-col gap-4 mt-2 border-t border-[#FDE68A] pt-4">
                            <div className="flex flex-col gap-1.5 relative">
                                <label className="text-[12px] font-extrabold text-[#92400E] uppercase tracking-wide">Resource Title</label>
                                <input
                                    type="text"
                                    className={`w-full h-[48px] rounded-[12px] border border-[#FDE68A] px-3 text-[16px] font-bold focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] bg-white ${resourceTitle.length > 50 ? 'border-error/50 focus:border-error focus:ring-error focus:ring-1' : ''}`}
                                    value={resourceTitle}
                                    onChange={(e) => setResourceTitle(e.target.value)}
                                    maxLength={60}
                                    placeholder="e.g. Figma UI Kit - 2026 Edition"
                                />
                                <span className={`absolute bottom-3 right-3 text-[11px] font-bold ${resourceTitle.length >= 50 ? 'text-error' : 'text-[#D97757]'}`}>
                                    {resourceTitle.length}/60
                                </span>
                            </div>

                            <div className="flex flex-col gap-1.5 relative">
                                <label className="text-[12px] font-extrabold text-[#92400E] uppercase tracking-wide">Description <span className="text-[#D97757] font-semibold capitalize tracking-normal">(optional)</span></label>
                                <textarea
                                    className={`w-full border border-[#FDE68A] rounded-[12px] p-3 text-[16px] font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] transition-colors h-[80px] resize-none ${resourceDescription.length > 140 ? 'border-error/50 focus:border-error focus:ring-error focus:ring-1' : ''}`}
                                    value={resourceDescription}
                                    onChange={(e) => setResourceDescription(e.target.value)}
                                    maxLength={150}
                                    placeholder="Add a short description so users know what they are unlocking..."
                                />
                                <span className={`absolute bottom-3 right-3 text-[11px] font-bold ${resourceDescription.length >= 140 ? 'text-error' : 'text-[#D97757]'}`}>
                                    {resourceDescription.length}/150
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
