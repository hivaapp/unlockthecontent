import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ForgotPassword = () => {
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate network
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSent(true);
            addToast("Password reset link sent!", "success");
        }, 800);
    };

    return (
        <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-border">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-brand rounded-[16px] text-white flex items-center justify-center font-black text-[18px] mb-4 shadow-[0_4px_16px_rgba(217,119,87,0.3)]">
                        AG
                    </div>
                    <h1 className="text-[24px] font-black text-text mb-2 text-center">Reset password</h1>
                    <p className="text-[14px] font-bold text-textMid text-center px-4">
                        {isSent ? "Check your email for a link to reset your password." : "Enter your email address and we'll send you a link to reset your password."}
                    </p>
                </div>

                {!isSent ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textLight" />
                            <input
                                type="email"
                                placeholder="Email address"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 bg-surfaceAlt border border-border rounded-[12px] pl-10 pr-4 text-[14px] font-semibold text-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !email}
                            className="btn-primary w-full h-[48px] rounded-[12px] mt-2 text-[15px] font-black"
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="bg-[#EBF5EE] border border-[#BBF7D0] rounded-[12px] p-4 flex flex-col items-center gap-3">
                        <CheckCircle2 className="w-8 h-8 text-[#166534]" />
                        <span className="font-extrabold text-[14px] text-[#166534] text-center">Link sent to {email}</span>
                        <button
                            onClick={() => setIsSent(false)}
                            className="mt-2 text-[13px] font-bold text-[#166534] underline hover:text-[#14532D]"
                        >
                            Try another email
                        </button>
                    </div>
                )}

                <div className="mt-8 flex justify-center">
                    <Link to="/signin" className="text-[13px] font-bold text-brand hover:text-brand-hover transition-colors">
                        ← Back to Sign In
                    </Link>
                </div>
            </div>
            
            <div className="mt-12 flex justify-center">
                <Link to="/" className="text-[12px] font-extrabold text-textMid/60 uppercase tracking-widest hover:text-textMid transition-colors flex items-center gap-1">
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
};
