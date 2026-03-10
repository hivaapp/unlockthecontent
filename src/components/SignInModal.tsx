import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { Link } from 'react-router-dom';


interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const PROVIDERS = [
    { id: 'google', name: 'Google', icon: 'G' },
    { id: 'twitter', name: 'X / Twitter', icon: '𝕏' },
    { id: 'github', name: 'GitHub', icon: 'GH' },
    { id: 'discord', name: 'Discord', icon: 'D' },
];

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { login } = useAuth();
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

    useBodyScrollLock(isOpen);

    if (!isOpen) return null;

    const handleProviderClick = async (providerId: string) => {
        setLoadingProvider(providerId);
        await login();
        setLoadingProvider(null);
        onClose();
        if (onSuccess) onSuccess();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-[400px] bg-surface rounded-t-[24px] sm:rounded-[24px] p-6 sm:p-8 pt-4 sm:pt-8 animate-slide-up sm:animate-pop-in flex flex-col items-center">
                <div className="w-12 h-1.5 bg-border rounded-full mb-6 sm:hidden" />

                <div className="w-12 h-12 bg-brand/10 rounded-[18px] flex items-center justify-center text-2xl mb-4 text-brand glow-red">
                    🔗
                </div>

                <h2 className="text-[24px] font-black tracking-tight text-text mb-2">Sign in to AdGate</h2>
                <p className="text-textMid font-bold mb-8 text-center text-sm">
                    Connect your account to start monetizing your content instantly.
                </p>

                <div className="w-full space-y-3 mb-6">
                    {PROVIDERS.map((provider) => (
                        <button
                            key={provider.id}
                            onClick={() => handleProviderClick(provider.id)}
                            disabled={loadingProvider !== null}
                            className="w-full h-[48px] bg-surface border border-border rounded-[18px] font-bold text-text flex items-center justify-center gap-3 transition-transform hover:-translate-y-[1px] hover:shadow-sm active:translate-y-0 active:shadow-none ease-out relative"
                        >
                            {loadingProvider === provider.id ? (
                                <Loader2 className="w-5 h-5 animate-spin text-textMid" />
                            ) : (
                                <>
                                    <span className="text-xl w-6 text-center font-black">{provider.icon}</span>
                                    <span>Continue with {provider.name}</span>
                                </>
                            )}
                        </button>
                    ))}
                </div>

                <div className="w-full bg-eco-tint p-4 rounded-[18px] flex items-start gap-3 mb-6 border border-eco/20">
                    <span className="text-xl">🌱</span>
                    <p className="text-sm font-bold text-eco">
                        By signing up, you'll be able to donate 5% of your ad revenue to plant trees.
                    </p>
                </div>

                <p className="text-xs font-bold text-textLight text-center">
                    By continuing, you agree to our{' '}
                    <Link to="/terms" className="text-brand hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-brand hover:underline">Privacy Policy</Link>.
                </p>
            </div>
        </div>
    );
};
