import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react';

export const SignIn = () => {
    const { login, isLoggingIn } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login('email');
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
                    <h1 className="text-[24px] font-black text-text mb-2 text-center">Welcome back</h1>
                    <p className="text-[14px] font-bold text-textMid text-center">Sign in to your AdGate account</p>
                </div>

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

                    <div className="flex justify-end mt-1">
                        <Link to="/forgot-password" className="text-[12px] font-extrabold text-brand hover:text-brand-hover transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn || !email || !password}
                        className="btn-primary w-full h-[48px] rounded-[12px] mt-2 text-[15px] font-black"
                    >
                        {isLoggingIn ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-[13px] font-bold text-textMid">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-brand font-black hover:text-brand-hover transition-colors">
                        Sign up free
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
