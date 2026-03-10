import { useState, useEffect } from 'react';

export interface EmailConfigData {
    newsletterName: string;
    newsletterDescription: string;
    incentiveText: string;
    platform: 'direct' | 'mailchimp' | 'convertkit' | 'beehiiv' | 'substack' | 'klaviyo' | 'other';
    platformDisplayName: string;
    archiveUrl: string | null;
    confirmationMessage: string;
    totalSubscribers?: number;
}

interface EmailConfigFormProps {
    value: EmailConfigData | null;
    onChange: (data: EmailConfigData) => void;
    onErrorStateChange: (hasErrors: boolean) => void;
}

const PLATFORMS = [
    { id: 'direct', label: 'Direct' },
    { id: 'mailchimp', label: 'Mailchimp' },
    { id: 'convertkit', label: 'ConvertKit' },
    { id: 'beehiiv', label: 'Beehiiv' },
    { id: 'substack', label: 'Substack' },
    { id: 'klaviyo', label: 'Klaviyo' },
    { id: 'other', label: 'Other' },
] as const;

export const EmailConfigForm = ({ value, onChange, onErrorStateChange }: EmailConfigFormProps) => {
    const [data, setData] = useState<EmailConfigData>(value || {
        newsletterName: '',
        newsletterDescription: '',
        incentiveText: '',
        platform: 'direct',
        platformDisplayName: 'Direct',
        archiveUrl: '',
        confirmationMessage: ''
    });

    useEffect(() => {
        const hasErrors = !data.newsletterName || !data.newsletterDescription || !data.incentiveText || !data.platform;
        onErrorStateChange(hasErrors);
        onChange(data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const handleChange = <K extends keyof EmailConfigData>(field: K, val: EmailConfigData[K]) => {
        setData(prev => ({ ...prev, [field]: val }));
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 className="text-[13px] font-[900] text-[#111] mb-1">Email Subscribe Setup</h4>
            
            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">Newsletter Name</label>
                <input
                    type="text"
                    className="w-full h-[44px] rounded-[14px] border border-[#E8E8E8] px-3 text-[14px] font-[600] focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                    placeholder="e.g. Weekly Design Tips"
                    maxLength={50}
                    value={data.newsletterName}
                    onChange={(e) => handleChange('newsletterName', e.target.value)}
                />
                <span className="text-[11px] text-textLight text-right">{data.newsletterName.length}/50</span>
            </div>

            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">What subscribers receive</label>
                <textarea
                    className="w-full h-[80px] rounded-[14px] border border-[#E8E8E8] p-3 text-[14px] font-[600] resize-none focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                    placeholder="Describe what your newsletter covers and how often you send it."
                    maxLength={150}
                    value={data.newsletterDescription}
                    onChange={(e) => handleChange('newsletterDescription', e.target.value)}
                />
                <span className="text-[11px] text-textLight text-right">{data.newsletterDescription.length}/150</span>
            </div>

            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">Why they should subscribe</label>
                <textarea
                    className="w-full h-[80px] rounded-[14px] border border-[#E8E8E8] p-3 text-[14px] font-[600] resize-none focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                    placeholder="Tell viewers what they get by subscribing — the resource they are unlocking plus what to expect from your newsletter."
                    maxLength={200}
                    value={data.incentiveText}
                    onChange={(e) => handleChange('incentiveText', e.target.value)}
                />
                <span className="text-[11px] text-textLight text-right">{data.incentiveText.length}/200</span>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-[700] text-textMid">Where emails go</label>
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {PLATFORMS.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                                handleChange('platform', p.id);
                                handleChange('platformDisplayName', p.label);
                            }}
                            className={`flex-shrink-0 h-[36px] px-3.5 rounded-[18px] text-[12px] font-[700] transition-colors border ${data.platform === p.id 
                                ? 'bg-[#166534] text-white border-[#166534]' 
                                : 'bg-white text-textMid border-[#E8E8E8]'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                {data.platform === 'direct' ? (
                    <div className="bg-[#EDFAF3] p-3 rounded-[10px] mt-1">
                        <span className="text-[12px] font-[600] text-[#166534]">AdGate stores subscriber emails. Download them anytime from your dashboard.</span>
                    </div>
                ) : (
                    <div className="bg-[#EEF2FF] p-3 rounded-[10px] mt-1">
                        <span className="text-[12px] font-[600] text-[#6366F1]">We'll note which platform your subscribers go to. You'll need to export and import them manually for now — direct integration coming soon.</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-[700] text-textMid">Link to past issues (optional)</label>
                <input
                    type="url"
                    className="w-full h-[44px] rounded-[14px] border border-[#E8E8E8] px-3 text-[14px] font-[600] focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                    placeholder="https://yournewsletter.com/archive"
                    value={data.archiveUrl || ''}
                    onChange={(e) => handleChange('archiveUrl', e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-1.5 relative">
                <label className="text-[12px] font-[700] text-textMid">Message shown after subscribing</label>
                <input
                    type="text"
                    className="w-full h-[44px] rounded-[14px] border border-[#E8E8E8] px-3 text-[14px] font-[600] focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                    placeholder="e.g. Check your inbox to confirm! You're all set."
                    maxLength={100}
                    value={data.confirmationMessage}
                    onChange={(e) => handleChange('confirmationMessage', e.target.value)}
                />
                {data.confirmationMessage && <span className="text-[11px] text-textLight text-right">{data.confirmationMessage.length}/100</span>}
            </div>
        </div>
    );
};
