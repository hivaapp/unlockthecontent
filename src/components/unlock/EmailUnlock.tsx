import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
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
        <div className="w-full flex flex-col items-center animate-fadeIn">
            <div className="w-12 h-12 bg-surfaceAlt text-text rounded-full flex items-center justify-center mb-6 border border-border">
                <Mail size={24} strokeWidth={2.5} />
            </div>
            
            {config.newsletterName && (
                <span className="text-[12px] font-bold text-textMid uppercase tracking-wider mb-2">
                    {config.newsletterName}
                </span>
            )}
            
            <h2 className="text-[20px] md:text-[24px] tracking-tight font-black text-text mb-3 text-center leading-tight">
                {config.incentiveText || "Unlock this resource instantly"}
            </h2>
            
            {config.newsletterDescription && (
                <p className="text-[14px] text-textMid text-center max-w-[320px] mb-8 leading-relaxed">
                    {config.newsletterDescription}
                </p>
            )}

            {!config.newsletterDescription && (
                <div className="mb-8 p-0" />
            )}

            {config.totalSubscribers ? (
                <div className="mb-6 -mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-surfaceAlt border border-border text-text rounded-full text-[12px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                    Join {config.totalSubscribers.toLocaleString()}+ subscribers
                </div>
            ) : null}

            <form onSubmit={handleSubmit} className="w-full max-w-[340px]">
                <div className="mb-4 w-full">
                    <div className="relative">
                        <input
                            type="email"
                            required
                            placeholder="Enter your best email..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className={`w-full h-10 bg-white border border-border rounded-md px-4 text-[15px] outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-textLight ${isLoading ? 'bg-surfaceAlt text-textLight' : 'text-text'}`}
                        />
                        {isLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-border border-t-brand rounded-full animate-spin" />
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full h-10 bg-brand hover:bg-brandHover text-white rounded-md text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Please wait...
                        </>
                    ) : (
                        "Get Instant Access"
                    )}
                </button>

                <p className="text-[12px] font-medium text-textLight text-center mt-5 flex items-center justify-center gap-1.5">
                    <Lock size={12} /> 100% free • Unsubscribe anytime
                </p>
            </form>
        </div>
    );
};
