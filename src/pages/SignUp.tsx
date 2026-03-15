import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User2 } from 'lucide-react';

export const SignUp = () => {
    const { login, isLoggingIn } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ name, email, password } as any);
            navigate('/dashboard');
        } catch {
            // Error handled by AuthContext
        }
    };

    return (
        <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-border">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-brand rounded-[16px] text-white flex items-center justify-center font-black text-[18px] mb-4 shadow-[0_4px_16px_rgba(217,119,87,0.3)]">
                        AG
                    </div>
                    <h1 className="text-[24px] font-black text-text mb-2 text-center">Create account</h1>
                    <p className="text-[14px] font-bold text-textMid text-center">Start unlocking value today</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textLight" />
                        <input
                            type="text"
                            placeholder="Full name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-12 bg-surfaceAlt border border-border rounded-[12px] pl-10 pr-4 text-[14px] font-semibold text-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                        />
                    </div>
                    
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

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textLight" />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 bg-surfaceAlt border border-border rounded-[12px] pl-10 pr-4 text-[14px] font-semibold text-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn || !name || !email || !password}
                        className="btn-primary w-full h-[48px] rounded-[12px] mt-4 text-[15px] font-black"
                    >
                        {isLoggingIn ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                        ) : (
                            'Sign Up Free'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-[13px] font-bold text-textMid flex flex-col gap-2">
                    <p>
                        Already have an account?{' '}
                        <Link to="/signin" className="text-brand font-black hover:text-brand-hover transition-colors">
                            Sign in
                        </Link>
                    </p>
                    <p className="text-[11px] leading-relaxed max-w-[280px] mx-auto mt-2">
                        By signing up, you agree to our{' '}
                        <Link to="/terms" className="underline hover:text-text transition-colors">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="underline hover:text-text transition-colors">Privacy Policy</Link>.
                    </p>
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
