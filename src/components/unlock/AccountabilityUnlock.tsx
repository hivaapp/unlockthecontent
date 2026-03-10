import { useState } from 'react';
import { Users, Handshake, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { AccountabilityConfigData } from '../dashboard/AccountabilityConfigForm';

interface AccountabilityUnlockProps {
    config: AccountabilityConfigData;
    onComplete: () => void;
}

export const AccountabilityUnlock = ({ config, onComplete }: AccountabilityUnlockProps) => {
    const [commitment, setCommitment] = useState('');
    const [email, setEmail] = useState('');
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commitment || !email) return;

        setJoining(true);
        // Simulate matching/pairing
        setTimeout(() => {
            setJoining(false);
            setJoined(true);
            
            // Allow them to see the success state before calling onComplete
            // (In a real app, onComplete might redirect them to their pairing dashboard)
            setTimeout(() => {
                onComplete();
            }, 3000);
        }, 2000);
    };

    if (joined) {
        return (
            <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center animate-fadeIn text-center p-6 bg-[#EBF5EE] border border-[#A5D6A7] rounded-[20px]">
                <div className="w-16 h-16 bg-[#4caf50] rounded-full flex items-center justify-center mb-6 shadow-md shadow-[#4caf50]/20 text-white">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="text-[22px] font-black text-[#1B5E20] leading-tight mb-2">
                    You're registered!
                </h2>
                <p className="text-[14px] font-[600] text-[#2E7D32]">
                    We'll email you at <span className="font-bold">{email}</span> as soon as we find your accountability partner. Get ready to commit!
                </p>
                
                {config.creatorResourceUrl && config.creatorResourceLabel && (
                    <a 
                        href={config.creatorResourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 px-6 py-3 bg-white border border-[#A5D6A7] rounded-full text-[13px] font-black text-[#1B5E20] hover:bg-[#F1F8F1] shadow-sm transition-colors"
                    >
                        {config.creatorResourceLabel}
                    </a>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5 animate-fadeIn">
            <div className="text-center">
                <div className="w-14 h-14 bg-[#FFF0EF] rounded-[16px] flex items-center justify-center mx-auto mb-4 text-[#E8312A] shadow-sm">
                    <Handshake size={28} />
                </div>
                <h2 className="text-[20px] font-black text-[#111] mb-2 leading-tight px-2">
                    {config.topic}
                </h2>
                <p className="text-[14px] font-[500] text-textMid px-2 leading-relaxed">
                    {config.description}
                </p>
            </div>

            <div className="flex gap-2 text-[11px] font-[600] text-textMid opacity-80 px-4 mt-2 mb-2">
                <div className="flex items-center gap-1.5 bg-[#FAF9F7] px-3 py-1.5 rounded-full border border-border">
                    <span className="w-2 h-2 rounded-full bg-brand"></span>
                    {config.durationDays} Days
                </div>
                <div className="flex items-center gap-1.5 bg-[#FAF9F7] px-3 py-1.5 rounded-full border border-border">
                    <span className="w-2 h-2 rounded-full bg-brand"></span>
                    {config.checkInFrequency === 'daily' ? 'Daily' : config.checkInFrequency === 'every_other_day' ? 'Every 2 days' : 'Weekly'} Check-ins
                </div>
                {(config.maxParticipants || config.totalParticipants) ? (
                    <div className="flex items-center gap-1.5 bg-[#FAF9F7] px-3 py-1.5 rounded-full border border-border">
                        <Users size={12} className="text-brand" />
                        {config.totalParticipants ? `${config.totalParticipants} Joined` : `${config.maxParticipants} max`}
                    </div>
                ) : null}
            </div>

            {config.guidelines && (
                <div className="w-full p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px]">
                    <span className="text-[11px] font-black text-[#64748B] uppercase tracking-wider block mb-2">Guidelines</span>
                    <p className="text-[13px] font-[500] text-[#334155] leading-relaxed">
                        {config.guidelines}
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-black text-text px-1">
                        {config.commitmentPrompt || "What is your main goal or commitment for this session?"}
                    </label>
                    <textarea
                        required
                        placeholder="I commit to..."
                        value={commitment}
                        onChange={(e) => setCommitment(e.target.value)}
                        className="w-full h-[100px] leading-relaxed resize-none bg-surfaceAlt border border-border rounded-[14px] p-4 font-[500] text-[15px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all placeholder:text-textLight"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-black text-text px-1">Where should we send your match?</label>
                    <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[54px] bg-surfaceAlt border border-border rounded-[14px] px-4 font-[600] text-[15px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all placeholder:text-textLight"
                    />
                </div>

                <button
                    type="submit"
                    disabled={joining || !commitment || !email}
                    className="w-full h-[56px] bg-[#E8312A] hover:bg-[#C0392B] text-white font-black text-[16px] rounded-[16px] flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] mt-2 disabled:opacity-50 disabled:grayscale-[50%] disabled:active:scale-100"
                >
                    {joining ? (
                        <>Finding Match... <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                    ) : (
                        <>Find My Partner <ArrowRight size={18} /></>
                    )}
                </button>
                <p className="text-center text-[10px] font-[600] text-textLight px-4">
                    By joining, you agree to respect your partner and adhere to the guidelines. Matches are typically emailed within 24 hours.
                </p>
            </div>
        </form>
    );
};
