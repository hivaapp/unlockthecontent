import { useState, useEffect } from 'react';

export interface AccountabilityConfigData {
    topic: string;
    description: string;
    commitmentPrompt: string;
    durationDays: 7 | 14 | 21 | 30;
    checkInFrequency: 'daily' | 'every_other_day' | 'weekly';
    guidelines: string;
    creatorResourceUrl: string | null;
    creatorResourceLabel: string | null;
    waitingRoomEnabled: boolean;
    maxParticipants: number | null;
    totalParticipants?: number;
}

interface AccountabilityConfigFormProps {
    value: AccountabilityConfigData | null;
    onChange: (data: AccountabilityConfigData) => void;
    onErrorStateChange: (hasErrors: boolean) => void;
}

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
        waitingRoomEnabled: true,
        maxParticipants: null
    });

    const [hasLimit, setHasLimit] = useState(data.maxParticipants !== null);

    useEffect(() => {
        let hasErrors = !data.topic || !data.description || !data.commitmentPrompt;
        if (data.creatorResourceUrl && !data.creatorResourceLabel) hasErrors = true;
        if (hasLimit && (!data.maxParticipants || data.maxParticipants < 2)) hasErrors = true;
        
        onErrorStateChange(hasErrors);
        onChange(data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, hasLimit]);

    const handleChange = <K extends keyof AccountabilityConfigData>(field: K, val: AccountabilityConfigData[K]) => {
        setData(prev => ({ ...prev, [field]: val }));
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 className="text-[13px] font-[900] text-[#111] mb-1">Accountability Setup</h4>

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

            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">Describe the experience to participants</label>
                <textarea
                    className="w-full h-[100px] rounded-[14px] border border-[#E8E8E8] p-3 text-[14px] font-[600] resize-none focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                    placeholder="Tell participants what they are signing up for. What will they do? How will the pairing help them? Keep it honest and specific."
                    maxLength={300}
                    value={data.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                />
                <span className="text-[11px] text-textLight text-right">{data.description.length}/300</span>
            </div>

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
                {data.commitmentPrompt && (
                    <div className="bg-[#FAF9F7] p-3 rounded-[10px] mt-1 flex flex-col gap-1 border border-[#E6E2D9]">
                        <span className="text-[11px] font-[600] text-[#888]">Viewers will answer:</span>
                        <span className="text-[14px] font-[600] text-[#333]">{data.commitmentPrompt}</span>
                    </div>
                )}
            </div>

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

            <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-[700] text-textMid">How often should partners check in?</label>
                <div className="flex gap-2 w-full">
                    {([] as { id: 'daily' | 'every_other_day' | 'weekly', label: string }[]).concat([
                        { id: 'daily', label: 'Daily' },
                        { id: 'every_other_day', label: 'Every 2 Days' },
                        { id: 'weekly', label: 'Weekly' }
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

            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">Rules or guidelines (optional)</label>
                <textarea
                    className="w-full h-[70px] rounded-[14px] border border-[#E8E8E8] p-3 text-[14px] font-[600] resize-none focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                    placeholder="Any ground rules for participants? e.g. Be honest, show up for your partner, no judgment."
                    maxLength={200}
                    value={data.guidelines}
                    onChange={(e) => handleChange('guidelines', e.target.value)}
                />
                <span className="text-[11px] text-textLight text-right">{data.guidelines.length}/200</span>
            </div>

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

            <div className="flex flex-col gap-1.5 mt-2 border-t border-[#E8E8E8] pt-4">
                <label className="text-[12px] font-[700] text-textMid mb-1">Maximum participants (optional)</label>
                <div className="flex gap-2 mb-2 w-full">
                    <button
                        type="button"
                        onClick={() => { setHasLimit(false); handleChange('maxParticipants', null); }}
                        className={`flex-1 h-[36px] rounded-[18px] text-[12px] font-[700] transition-colors ${!hasLimit ? 'bg-[#111] text-white' : 'bg-[#E8E8E8] text-textMid'}`}
                    >
                        Unlimited
                    </button>
                    <button
                        type="button"
                        onClick={() => setHasLimit(true)}
                        className={`flex-1 h-[36px] rounded-[18px] text-[12px] font-[700] transition-colors ${hasLimit ? 'bg-[#111] text-white' : 'bg-[#E8E8E8] text-textMid'}`}
                    >
                        Set a limit
                    </button>
                </div>
                {hasLimit && (
                    <input
                        type="number"
                        min="2"
                        className="w-full h-[44px] rounded-[14px] border border-[#E8E8E8] px-3 text-[14px] font-[600] focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111]"
                        placeholder="e.g. 50"
                        value={data.maxParticipants || ''}
                        onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value) || null)}
                    />
                )}
            </div>
        </div>
    );
};
