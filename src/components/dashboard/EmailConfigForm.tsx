import { useState, useEffect } from 'react';

export interface EmailConfigData {
    newsletterName: string;
    newsletterDescription: string;
    incentiveText: string;
    platform: 'direct' | 'mailchimp' | 'convertkit' | 'beehiiv' | 'substack' | 'klaviyo' | 'other';
    platformDisplayName: string;
    confirmationMessage: string;
    totalSubscribers?: number;
}

interface EmailConfigFormProps {
    value: EmailConfigData | null;
    onChange: (data: EmailConfigData) => void;
    onErrorStateChange: (hasErrors: boolean) => void;
}

export const EmailConfigForm = ({ value, onChange, onErrorStateChange }: EmailConfigFormProps) => {
    const [data, setData] = useState<EmailConfigData>(value || {
        newsletterName: '',
        newsletterDescription: '',
        incentiveText: '',
        platform: 'direct',
        platformDisplayName: 'Direct',
        confirmationMessage: ''
    });

    useEffect(() => {
        const hasErrors = !data.newsletterName.trim();
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
