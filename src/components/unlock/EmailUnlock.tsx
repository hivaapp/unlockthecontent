import { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import type { EmailConfigData } from '../dashboard/EmailConfigForm';

interface EmailUnlockProps {
    config: EmailConfigData;
    onComplete: () => void;
}

export const EmailUnlock = ({ config, onComplete }: EmailUnlockProps) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        // Simulate API call to subscribe
        setTimeout(() => {
            setIsLoading(false);
            onComplete();
        }, 1200);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 animate-fadeIn">
            <div className="text-center mb-2">
                <div className="w-12 h-12 bg-[#F3F1EC] rounded-full flex items-center justify-center mx-auto mb-3 text-brand">
                    <Mail size={24} />
                </div>
                <h2 className="text-[20px] font-black text-[#111] mb-1 leading-tight">
                    {config.newsletterName || "Join the newsletter"}
                </h2>
                <p className="text-[14px] font-[600] text-textMid">
                    {config.incentiveText || "Subscribe to unlock this resource."}
                </p>
                {config.totalSubscribers ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-brandTint text-brand rounded-full text-[12px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                        Join {config.totalSubscribers.toLocaleString()}+ subscribers
                    </div>
                ) : null}
            </div>

            <div className="flex flex-col gap-2">
                <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[54px] bg-surfaceAlt border border-border rounded-[14px] px-4 font-[600] text-[15px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all placeholder:text-textLight"
                />
                <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full h-[54px] bg-[#E8312A] hover:bg-[#C0392B] text-white font-black text-[15px] rounded-[14px] flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>Subscribe & Unlock <ArrowRight size={18} /></>
                    )}
                </button>
            </div>
            
            <p className="text-center text-[11px] font-[600] text-textLight mt-2">
                By subscribing, you agree to receive emails from this creator.
            </p>
        </form>
    );
};
