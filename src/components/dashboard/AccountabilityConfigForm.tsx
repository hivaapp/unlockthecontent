import { useState, useEffect } from 'react';

export interface ScheduledMessage {
    id: string;
    dayNumber: number;
    sendTime: string;
    content: string;
    isSent: boolean;
}

export interface AccountabilityConfigData {
    topic: string;
    description: string;
    commitmentPrompt: string;
    durationDays: 7 | 14 | 21 | 30;
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
}

interface AccountabilityConfigFormProps {
    value: AccountabilityConfigData | null;
    onChange: (data: AccountabilityConfigData) => void;
    onErrorStateChange: (hasErrors: boolean) => void;
}

const messageTemplates = [
    {
        name: "Day 1 — Welcome",
        dayNumber: 1,
        sendTime: "09:00",
        content: "Welcome to the challenge! The first step is to introduce yourself to your partner. Share your commitment and ask about theirs. The more specific you both are, the better this works.",
    },
    {
        name: "Midpoint Check-In",
        dayNumber: null as number | null,
        sendTime: "09:00",
        content: "You're halfway through! Check in with your partner today. What's working? What's hard? Honesty with your partner is more valuable than performing consistency.",
    },
    {
        name: "Final Day",
        dayNumber: null as number | null,
        sendTime: "09:00",
        content: "Today is the final day. Tell your partner one real thing that changed because of this challenge — even something small. This conversation is yours. I can't see it. Make it count.",
    },
    {
        name: "Accountability Check",
        dayNumber: null as number | null,
        sendTime: "09:00",
        content: "Quick check-in from me. How are both of you doing? Remember — if you've slipped, your partner is there to help you get back, not to judge you.",
    },
];

export const AccountabilityConfigForm = ({ value, onChange, onErrorStateChange }: AccountabilityConfigFormProps) => {
    const [data, setData] = useState<AccountabilityConfigData>(value || {
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
    });

    const [hasLimit] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Add form fields
    const [addDay, setAddDay] = useState(1);
    const [addTime, setAddTime] = useState('09:00');
    const [addContent, setAddContent] = useState('');
    const [dayError, setDayError] = useState('');

    useEffect(() => {
        let hasErrors = !data.topic || !data.description || !data.commitmentPrompt;
        if (data.creatorResourceUrl && !data.creatorResourceLabel) hasErrors = true;
        if (hasLimit) hasErrors = true;

        onErrorStateChange(hasErrors);
        onChange(data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, hasLimit]);

    const handleChange = <K extends keyof AccountabilityConfigData>(field: K, val: AccountabilityConfigData[K]) => {
        setData(prev => ({ ...prev, [field]: val }));
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
            isSent: false,
        };

        handleChange('scheduledMessages', [...data.scheduledMessages, newMsg]);
        setAddDay(1);
        setAddTime('09:00');
        setAddContent('');
        setShowAddForm(false);
        setDayError('');
    };

    const handleDeleteMessage = (id: string) => {
        handleChange('scheduledMessages', data.scheduledMessages.filter(m => m.id !== id));
    };

    const handleEditMessage = (id: string) => {
        const msg = data.scheduledMessages.find(m => m.id === id);
        if (!msg) return;
        setAddDay(msg.dayNumber);
        setAddTime(msg.sendTime);
        setAddContent(msg.content);
        setEditingId(id);
        setShowAddForm(true);
    };

    const handleSaveEdit = () => {
        if (addDay < 1 || addDay > data.durationDays) {
            setDayError('Cannot exceed campaign duration');
            return;
        }
        if (!addContent.trim() || !editingId) return;

        handleChange('scheduledMessages', data.scheduledMessages.map(m =>
            m.id === editingId ? { ...m, dayNumber: addDay, sendTime: addTime, content: addContent.trim() } : m
        ));
        setEditingId(null);
        setAddDay(1);
        setAddTime('09:00');
        setAddContent('');
        setShowAddForm(false);
        setDayError('');
    };

    const handleUseTemplate = (template: typeof messageTemplates[0]) => {
        const day = template.dayNumber !== null ? template.dayNumber :
            template.name.includes('Midpoint') ? Math.floor(data.durationDays / 2) :
            template.name.includes('Final') ? data.durationDays : 1;
        setAddDay(day);
        setAddTime(template.sendTime);
        setAddContent(template.content);
        setShowAddForm(true);
        setShowTemplates(false);
    };

    const formatTime12h = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 className="text-[13px] font-[900] text-[#111] mb-1">Accountability Setup</h4>

            {/* Topic */}
            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">What is this accountability about?</label>
                <input
                    type="text"
                    className="w-full h-[44px] rounded-[14px] border border-[#E8E8E8] px-3 text-[14px] font-[600] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
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
                    className="w-full h-[100px] rounded-[14px] border border-[#E8E8E8] p-3 text-[14px] font-[600] resize-none focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                    placeholder="Tell participants what they are signing up for."
                    maxLength={300}
                    value={data.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                />
                <span className="text-[11px] text-textLight text-right">{data.description.length}/300</span>
            </div>

            {/* Commitment prompt */}
            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">Commitment prompt shown to each participant</label>
                <textarea
                    className="w-full h-[70px] rounded-[14px] border border-[#E8E8E8] p-3 text-[14px] font-[600] resize-none focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                    placeholder="e.g. What specific habit will you commit to for the next 14 days?"
                    maxLength={200}
                    value={data.commitmentPrompt}
                    onChange={(e) => handleChange('commitmentPrompt', e.target.value)}
                />
                <span className="text-[11px] text-textLight text-right">{data.commitmentPrompt.length}/200</span>
            </div>

            {/* Duration pills */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-[700] text-textMid">Pairing duration</label>
                <div className="flex gap-2 w-full">
                    {([7, 14, 21, 30] as const).map(days => (
                        <button
                            key={days}
                            type="button"
                            onClick={() => handleChange('durationDays', days)}
                            className={`flex-1 h-[36px] items-center justify-center rounded-[18px] text-[12px] font-[700] transition-colors ${data.durationDays === days ? 'bg-[#92400E] text-white' : 'bg-[#F3F1EC] text-textMid hover:bg-[#E6E2D9]'}`}
                        >
                            {days} Days
                        </button>
                    ))}
                </div>
            </div>

            {/* Check-in frequency */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-[700] text-textMid">How often should partners check in?</label>
                <div className="flex gap-2 w-full">
                    {([
                        { id: 'daily' as const, label: 'Daily' },
                        { id: 'every_other_day' as const, label: 'Every 2 Days' },
                        { id: 'weekly' as const, label: 'Weekly' }
                    ]).map(freq => (
                        <button
                            key={freq.id}
                            type="button"
                            onClick={() => handleChange('checkInFrequency', freq.id)}
                            className={`flex-1 h-[36px] items-center justify-center rounded-[18px] text-[12px] font-[700] transition-colors ${data.checkInFrequency === freq.id ? 'bg-[#92400E] text-white' : 'bg-[#F3F1EC] text-textMid hover:bg-[#E6E2D9]'}`}
                        >
                            {freq.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Guidelines */}
            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">Rules or guidelines (optional)</label>
                <textarea
                    className="w-full h-[70px] rounded-[14px] border border-[#E8E8E8] p-3 text-[14px] font-[600] resize-none focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
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
                        className="flex-1 h-[44px] rounded-[14px] border border-[#E8E8E8] px-3 text-[14px] font-[600] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                        placeholder="https://yoursite.com/resource"
                        value={data.creatorResourceUrl || ''}
                        onChange={(e) => handleChange('creatorResourceUrl', e.target.value)}
                    />
                    <input
                        type="text"
                        className="flex-1 h-[44px] rounded-[14px] border border-[#E8E8E8] px-3 text-[14px] font-[600] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
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
                                    <button onClick={() => handleEditMessage(msg.id)} className="w-8 h-8 flex items-center justify-center text-[#888] hover:text-[#555]">✏️</button>
                                    <button onClick={() => handleDeleteMessage(msg.id)} className="w-8 h-8 flex items-center justify-center text-[#888] hover:text-[#E8312A]">✕</button>
                                </div>
                            </div>
                            <p className="text-[13px] font-[600] text-[#555]" style={{ lineHeight: '1.65', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                                {msg.content}
                            </p>
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
                        onClick={() => { setShowAddForm(true); setEditingId(null); setAddDay(1); setAddTime('09:00'); setAddContent(''); }}
                        className="w-full h-[44px] rounded-[12px] flex items-center justify-center text-[14px] font-[700] text-[#888] mt-3"
                        style={{ border: '1.5px dashed #D1D5DB', backgroundColor: '#FAFAFA' }}
                    >
                        ＋ Add scheduled message
                    </button>
                )}

                {/* Add/Edit form */}
                {showAddForm && (
                    <div className="mt-3 flex flex-col gap-3 p-3.5 rounded-[12px] bg-white" style={{ border: '1.5px solid #E8E8E8', animation: 'fadeIn 0.2s' }}>
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
                                        className="w-[70px] h-[44px] rounded-[10px] border border-[#E8E8E8] px-3 text-[14px] font-[600] focus:outline-none focus:border-[#92400E]"
                                    />
                                    <span className="text-[13px] font-[600] text-[#888]">of {data.durationDays}</span>
                                </div>
                                {dayError && <span className="text-[11px] text-[#E8312A]">{dayError}</span>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[12px] font-[700] text-textMid">At what time</label>
                                <input
                                    type="time"
                                    value={addTime}
                                    onChange={(e) => setAddTime(e.target.value)}
                                    className="h-[44px] rounded-[10px] border border-[#E8E8E8] px-3 text-[14px] font-[600] focus:outline-none focus:border-[#92400E]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[12px] font-[700] text-textMid">Message to all pairs</label>
                            <textarea
                                className="w-full h-[100px] rounded-[12px] border border-[#E8E8E8] p-3 text-[13px] font-[600] resize-none focus:outline-none focus:border-[#92400E]"
                                placeholder="Write a message that encourages, guides, or checks in with all pairs on this day..."
                                maxLength={400}
                                value={addContent}
                                onChange={(e) => setAddContent(e.target.value)}
                            />
                            <span className="text-[11px] text-textLight text-right">{addContent.length}/400</span>
                        </div>

                        <div className="rounded-[10px] p-2.5" style={{ backgroundColor: '#FFFBEB' }}>
                            <p className="text-[11px] font-[600] text-[#92400E]" style={{ lineHeight: '1.6' }}>
                                📣 This message appears in all pair chats as a "Challenge Update" — visually distinct from their private messages. You cannot see their replies.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={editingId ? handleSaveEdit : handleAddMessage}
                                className="h-[36px] px-4 rounded-[10px] bg-[#B45309] text-white text-[13px] font-[800]"
                            >
                                {editingId ? 'Save Changes' : 'Add Message'}
                            </button>
                            <button
                                onClick={() => { setShowAddForm(false); setEditingId(null); setDayError(''); }}
                                className="text-[13px] font-[700] text-textMid hover:text-[#555]"
                            >
                                Cancel
                            </button>
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
