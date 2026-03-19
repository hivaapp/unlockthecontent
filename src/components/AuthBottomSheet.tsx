import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, Eye, EyeOff, Check, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useNavigate } from 'react-router-dom';

interface AuthBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultScreen?: 'signin' | 'signup' | 'forgot';
  redirectAfter?: string;
  contextualMessage?: React.ReactNode;
}

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 'weak', width: '25%', color: '#EF4444', label: 'Weak' };
  if (score <= 2) return { level: 'fair', width: '50%', color: '#F59E0B', label: 'Fair' };
  if (score <= 3) return { level: 'good', width: '75%', color: '#3B82F6', label: 'Good' };
  return { level: 'strong', width: '100%', color: '#16A34A', label: 'Strong' };
};

export const AuthBottomSheet: React.FC<AuthBottomSheetProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultScreen = 'signin',
  redirectAfter,
  contextualMessage,
}) => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, sendPasswordReset, resendConfirmation } = useAuth();
  const sheetRef = useRef<HTMLDivElement>(null);

  const [screen, setScreen] = useState<'signin' | 'signup' | 'forgot' | 'confirm-email'>(defaultScreen);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign in fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign up fields
  const [name, setName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Confirm email
  const [confirmEmail, setConfirmEmail] = useState('');

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  useBodyScrollLock(isOpen);

  // Reset sheet state when it closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setScreen(defaultScreen);
        setError(null);
        setResetSent(false);
        setErrors({});
        setSignInEmail('');
        setSignInPassword('');
        setName('');
        setSignUpEmail('');
        setSignUpPassword('');
        setConfirmPassword('');
        setResetEmail('');
        setConfirmEmail('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultScreen]);

  // Resend countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard on mobile
  useEffect(() => {
    if (!isOpen) return;
    
    const handleResize = () => {
      const visualViewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const offsetTop = window.visualViewport?.offsetTop ?? 0;
      
      const containerEl = containerRef.current;
      if (containerEl) {
        containerEl.style.height = `${visualViewportHeight}px`;
        containerEl.style.top = `${offsetTop}px`;
      }

      const sheetEl = sheetRef.current;
      if (sheetEl) {
        sheetEl.style.maxHeight = `${visualViewportHeight - 10}px`;
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);
    setTimeout(handleResize, 10);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]);

  const goToForgotPassword = () => {
    setResetEmail(signInEmail);
    setScreen('forgot');
  };

  // ── Sign In Handler ──────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) return;
    setIsLoading(true);
    setError(null);
    try {
      await signIn({ email: signInEmail, password: signInPassword });
      onClose();
      if (onSuccess) onSuccess();
      if (redirectAfter) navigate(redirectAfter);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Incorrect email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Sign Up Handler ──────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required.';
    if (!signUpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpEmail)) newErrors.email = 'Valid email is required.';
    if (signUpPassword.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (signUpPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrors({});

    try {
      const result = await signUp({
        name: name.trim(),
        email: signUpEmail,
        password: signUpPassword,
      });

      if (result.requiresConfirmation) {
        // Show "check your email" state inside the sheet
        setScreen('confirm-email');
        setConfirmEmail(signUpEmail);
      } else {
        // Email confirmations disabled (dev mode) — user is signed in immediately
        onClose();
        if (onSuccess) onSuccess();
        if (redirectAfter) navigate(redirectAfter);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during sign up.';
      if (message.includes('already registered')) {
        setError('already_exists');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google Handler ───────────────────────────────────────────────────────
  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      // Browser redirects — nothing else to do here
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  };

  // ── Forgot Password Handler ──────────────────────────────────────────────
  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setErrors({ resetEmail: 'Valid email is required' });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true);
      setResendCountdown(30);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend Confirmation Handler ──────────────────────────────────────────
  const handleResendConfirmation = async () => {
    try {
      await resendConfirmation(confirmEmail);
      setResendCountdown(30);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend confirmation.');
    }
  };

  if (!isOpen) return null;

  const getTransform = () => {
    switch (screen) {
      case 'signin': return '0%';
      case 'signup': return '-25%';
      case 'forgot': return '-50%';
      case 'confirm-email': return '-75%';
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className="fixed inset-x-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none"
        style={{ top: 0, height: '100dvh' }}
      >
        <div
          ref={sheetRef}
          className="relative w-full max-w-[400px] bg-white rounded-t-[24px] sm:rounded-[24px] overflow-hidden flex flex-col animate-slide-up sm:animate-pop-in transition-all duration-300 ease-in-out pointer-events-auto shadow-2xl"
          style={{ maxHeight: 'calc(100vh - 10px)' }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-[#E8E8E8] rounded-full mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-[#AAAAAA] hover:text-[#555] transition-colors rounded-full hover:bg-black/5"
        >
          <X size={20} />
        </button>

        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ touchAction: 'pan-y' }}
        >
          <div 
            className="flex transition-transform duration-300 ease-out h-full"
            style={{ 
              width: '400%', 
              transform: `translateX(${getTransform()})` 
            }}
          >
            {/* Screen 1 — Sign In */}
            <div className="w-1/4 p-4 pt-2 flex-shrink-0">
              <div className="px-4 mt-4">
                <h2 className="text-[22px] font-black text-[#111]">Welcome back</h2>
                <p className="text-[13px] font-semibold text-[#888] mt-1">Sign in to your UnlockTheContent account</p>
              </div>

              {contextualMessage && (
                <div className="bg-[#FFF8F3] border border-[#ffddc2] rounded-[12px] p-3 mx-4 mt-3">
                  <p className="text-[13px] font-bold text-[#D97757] leading-snug">{contextualMessage}</p>
                </div>
              )}

              <form onSubmit={handleSignIn} className="mt-6 space-y-4 px-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#555] mb-1.5 ml-1">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={signInEmail}
                    onChange={(e) => {
                      setSignInEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Email address"
                    className="w-full h-[52px] border-[1.5px] border-[#E8E8E8] rounded-[12px] px-4 text-[16px] text-[#111] focus:border-[#E8312A] focus:ring-[3px] focus:ring-[#E8312A14] transition-all outline-none"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[12px] font-bold text-[#555] mb-1.5 ml-1">Password</label>
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={signInPassword}
                    onChange={(e) => {
                      setSignInPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Password"
                    className="w-full h-[52px] border-[1.5px] border-[#E8E8E8] rounded-[12px] px-4 text-[16px] text-[#111] focus:border-[#E8312A] focus:ring-[3px] focus:ring-[#E8312A14] transition-all outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-1 bottom-1 w-[44px] h-[44px] flex items-center justify-center text-[#AAAAAA] hover:text-[#888]"
                  >
                    {showSignInPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {error && error !== 'already_exists' && (
                  <div className="bg-[#FFF0EF] border border-[#FECACA] rounded-[8px] p-2.5 px-3.5 animate-in fade-in duration-200">
                    <p className="text-[13px] font-bold text-[#C0392B]">⚠️ {error}</p>
                  </div>
                )}

                <div className="text-right">
                  <button
                    type="button"
                    onClick={goToForgotPassword}
                    className="text-[12px] font-bold text-[#E8312A]"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] bg-[#E8312A] text-white rounded-[12px] font-black text-[16px] flex items-center justify-center gap-2 hover:bg-[#C4663F] transition-colors disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>Sign In <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              <div className="px-4 my-5 flex items-center gap-3">
                <div className="flex-1 h-[1px] bg-[#F0F0F0]" />
                <span className="text-[11px] font-bold text-[#AAAAAA] bg-white px-2">or</span>
                <div className="flex-1 h-[1px] bg-[#F0F0F0]" />
              </div>

              <div className="px-4 space-y-2">
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="w-full h-[52px] bg-white border-[1.5px] border-[#E8E8E8] rounded-[12px] font-extrabold text-[#333] text-[14px] flex items-center justify-center gap-2.5 hover:bg-[#F6F6F6] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="text-center mt-5 mb-8">
                <span className="text-[13px] text-[#888]">Don't have an account? </span>
                <button
                  onClick={() => setScreen('signup')}
                  className="text-[13px] font-extrabold text-[#E8312A]"
                >
                  Create one →
                </button>
              </div>
            </div>

            {/* Screen 2 — Sign Up */}
            <div className="w-1/4 p-4 pt-2 flex-shrink-0">
              <div className="px-4 mt-4">
                <h2 className="text-[22px] font-black text-[#111]">Create your account</h2>
                <p className="text-[13px] font-semibold text-[#888] mt-1">Free forever. No credit card.</p>
              </div>

              {contextualMessage && (
                <div className="bg-[#FFF8F3] border border-[#ffddc2] rounded-[12px] p-3 mx-4 mt-3">
                  <p className="text-[13px] font-bold text-[#D97757] leading-snug">{contextualMessage}</p>
                </div>
              )}

              <form onSubmit={handleSignUp} className="mt-6 space-y-3.5 px-4 overflow-x-hidden">
                <div className={errors.name ? 'animate-shake' : ''}>
                  <label className="block text-[12px] font-bold text-[#555] mb-1.5 ml-1">Full name</label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    placeholder="Your name"
                    className={`w-full h-[52px] border-[1.5px] rounded-[12px] px-4 text-[16px] text-[#111] focus:ring-[3px] focus:ring-[#E8312A14] transition-all outline-none ${
                      errors.name ? 'border-[#E8312A]' : 'border-[#E8E8E8] focus:border-[#E8312A]'
                    }`}
                  />
                  {errors.name && <p className="text-[11px] font-bold text-[#E8312A] mt-1 ml-1">{errors.name}</p>}
                </div>

                <div className={errors.email ? 'animate-shake' : ''}>
                  <label className="block text-[12px] font-bold text-[#555] mb-1.5 ml-1">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={signUpEmail}
                    onChange={(e) => {
                      setSignUpEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="Email address"
                    className={`w-full h-[52px] border-[1.5px] rounded-[12px] px-4 text-[16px] text-[#111] focus:ring-[3px] focus:ring-[#E8312A14] transition-all outline-none ${
                      errors.email ? 'border-[#E8312A]' : 'border-[#E8E8E8] focus:border-[#E8312A]'
                    }`}
                  />
                  {errors.email && <p className="text-[11px] font-bold text-[#E8312A] mt-1 ml-1">{errors.email}</p>}
                </div>

                <div className={errors.password ? 'animate-shake' : ''}>
                  <label className="block text-[12px] font-bold text-[#555] mb-1.5 ml-1">Password</label>
                  <div className="relative">
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={signUpPassword}
                      onChange={(e) => {
                        setSignUpPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: '' });
                      }}
                      placeholder="Password"
                      className={`w-full h-[52px] border-[1.5px] rounded-[12px] px-4 pr-12 text-[16px] text-[#111] focus:ring-[3px] focus:ring-[#E8312A14] transition-all outline-none ${
                        errors.password ? 'border-[#E8312A]' : 'border-[#E8E8E8] focus:border-[#E8312A]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-1 top-1 w-[44px] h-[44px] flex items-center justify-center text-[#AAAAAA]"
                    >
                      {showSignUpPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] font-bold text-[#E8312A] mt-1 ml-1">{errors.password}</p>}
                  
                  {(signUpPassword || errors.password) && (
                    <div className="mt-2.5 px-1">
                      <div className="flex justify-between items-center mb-1">
                        <div className="h-1 bg-[#F0F0F0] rounded-full flex-1 mr-2">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: getPasswordStrength(signUpPassword).width, 
                              backgroundColor: getPasswordStrength(signUpPassword).color 
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: getPasswordStrength(signUpPassword).color }}>
                          {getPasswordStrength(signUpPassword).label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className={errors.confirmPassword ? 'animate-shake' : ''}>
                  <label className="block text-[12px] font-bold text-[#555] mb-1.5 ml-1">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                      }}
                      placeholder="Confirm password"
                      className={`w-full h-[52px] border-[1.5px] rounded-[12px] px-4 pr-12 text-[16px] text-[#111] focus:ring-[3px] focus:ring-[#E8312A14] transition-all outline-none ${
                        errors.confirmPassword ? 'border-[#E8312A]' : 'border-[#E8E8E8] focus:border-[#E8312A]'
                      }`}
                    />
                    <div className="absolute right-1 top-1 w-[44px] h-[44px] flex items-center justify-center">
                      {confirmPassword && signUpPassword === confirmPassword ? (
                        <Check size={20} className="text-[#16A34A]" />
                      ) : confirmPassword && signUpPassword !== confirmPassword ? (
                         <X size={20} className="text-[#EF4444]" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-[#AAAAAA]"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      )}
                    </div>
                  </div>
                  {errors.confirmPassword && <p className="text-[11px] font-bold text-[#E8312A] mt-1 ml-1">{errors.confirmPassword}</p>}
                </div>

                {error && error === 'already_exists' && (
                  <div className="bg-[#FFF0EF] border border-[#FECACA] rounded-[8px] p-2.5 px-3.5 animate-in fade-in duration-200">
                    <p className="text-[13px] font-bold text-[#C0392B]">
                      This email is already registered.{' '}
                      <button
                        type="button"
                        onClick={() => { setScreen('signin'); setSignInEmail(signUpEmail); setError(null); }}
                        className="text-[#E8312A] font-extrabold underline"
                      >
                        Sign in instead →
                      </button>
                    </p>
                  </div>
                )}

                {error && error !== 'already_exists' && screen === 'signup' && (
                  <div className="bg-[#FFF0EF] border border-[#FECACA] rounded-[8px] p-2.5 px-3.5 animate-in fade-in duration-200">
                    <p className="text-[13px] font-bold text-[#C0392B]">⚠️ {error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] bg-[#E8312A] text-white rounded-[12px] font-black text-[16px] flex items-center justify-center gap-2 hover:bg-[#C4663F] transition-colors mt-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>Create Account <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              <div className="px-4 my-5 flex items-center gap-3">
                <div className="flex-1 h-[1px] bg-[#F0F0F0]" />
                <span className="text-[11px] font-bold text-[#AAAAAA] bg-white px-2">or</span>
                <div className="flex-1 h-[1px] bg-[#F0F0F0]" />
              </div>

              <div className="px-4 space-y-2">
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="w-full h-[52px] bg-white border-[1.5px] border-[#E8E8E8] rounded-[12px] font-extrabold text-[#333] text-[14px] flex items-center justify-center gap-2.5 hover:bg-[#F6F6F6] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="text-center mt-5">
                <span className="text-[13px] text-[#888]">Already have an account? </span>
                <button
                  onClick={() => setScreen('signin')}
                  className="text-[13px] font-extrabold text-[#E8312A]"
                >
                  Sign in →
                </button>
              </div>

              <div className="text-center mt-6 mb-8 px-8">
                <p className="text-[11px] leading-relaxed text-[#AAAAAA]">
                  By creating an account you agree to our{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-[#E8312A]">Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-[#E8312A]">Privacy Policy</a>
                </p>
              </div>
            </div>

            {/* Screen 3 — Forgot Password */}
            <div className="w-1/4 p-4 pt-2 flex-shrink-0">
              <div className="px-4 mt-2">
                <button
                  onClick={() => setScreen('signin')}
                  className="flex items-center gap-1.5 text-[13px] font-bold text-[#E8312A] mb-4"
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>
                
                {!resetSent ? (
                  <>
                    <h2 className="text-[20px] font-black text-[#111]">Reset your password</h2>
                    <p className="text-[13px] font-semibold text-[#888] mt-1">
                      Enter your email and we'll send a reset link.
                    </p>

                    <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
                      <div>
                        <label className="block text-[12px] font-bold text-[#555] mb-1.5 ml-1">Email</label>
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            if (errors.resetEmail) setErrors({ ...errors, resetEmail: '' });
                          }}
                          placeholder="Email address"
                          className={`w-full h-[52px] border-[1.5px] rounded-[12px] px-4 text-[16px] text-[#111] focus:ring-[3px] focus:ring-[#E8312A14] transition-all outline-none ${
                            errors.resetEmail ? 'border-[#E8312A]' : 'border-[#E8E8E8] focus:border-[#E8312A]'
                          }`}
                        />
                        {errors.resetEmail && <p className="text-[11px] font-bold text-[#E8312A] mt-1 ml-1">{errors.resetEmail}</p>}
                      </div>

                      {error && screen === 'forgot' && (
                        <div className="bg-[#FFF0EF] border border-[#FECACA] rounded-[8px] p-2.5 px-3.5">
                          <p className="text-[13px] font-bold text-[#C0392B]">⚠️ {error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-[52px] bg-[#E8312A] text-white rounded-[12px] font-black text-[16px] flex items-center justify-center gap-2 hover:bg-[#C4663F] transition-colors disabled:opacity-70"
                      >
                        {isLoading ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <>Send Reset Link <ArrowRight size={18} /></>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#FAF0EB] text-[#E8312A] rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-3xl">✉️</span>
                    </div>
                    
                    <h2 className="text-[22px] font-black text-[#111] mb-2">Check your email</h2>
                    <p className="text-[14px] text-[#888] mb-1">We sent a reset link to</p>
                    <p className="text-[14px] font-extrabold text-[#111] mb-8">{resetEmail}</p>

                    <button
                      onClick={() => setScreen('signin')}
                      className="w-full h-[52px] bg-white border-[1.5px] border-[#E8E8E8] rounded-[12px] font-bold text-[#333] text-[16px] hover:bg-[#F6F6F6] transition-colors mb-4"
                    >
                      Back to Sign In
                    </button>

                    <div className="mt-4">
                      {resendCountdown > 0 ? (
                        <p className="text-[11px] font-bold text-[#AAAAAA]">
                          Resend in {resendCountdown}s
                        </p>
                      ) : (
                        <button
                          onClick={() => handleResetPassword()}
                          className="text-[12px] font-extrabold text-[#E8312A]"
                        >
                          Didn't receive it? Resend →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Screen 4 — Confirm Email */}
            <div className="w-1/4 p-4 pt-2 flex-shrink-0">
              <div className="px-4 mt-4 text-center py-8">
                <div className="text-[48px] mb-6">✉️</div>
                
                <h2 className="text-[22px] font-black text-[#111] mb-2">Check your inbox</h2>
                <p className="text-[14px] text-[#888] mb-1">
                  We sent a confirmation link to
                </p>
                <p className="text-[14px] font-extrabold text-[#111] mb-2">
                  {confirmEmail}
                </p>
                <p className="text-[13px] text-[#888] mb-8">
                  Open your email app and click the link to activate your account.
                </p>

                <div className="space-y-2 px-4 mb-6">
                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-[48px] bg-white border-[1.5px] border-[#E8E8E8] rounded-[12px] font-bold text-[#333] text-[14px] flex items-center justify-center gap-2 hover:bg-[#F6F6F6] transition-colors"
                  >
                    Open Gmail →
                  </a>
                  <a
                    href="https://outlook.live.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-[48px] bg-white border-[1.5px] border-[#E8E8E8] rounded-[12px] font-bold text-[#333] text-[14px] flex items-center justify-center gap-2 hover:bg-[#F6F6F6] transition-colors"
                  >
                    Open Outlook →
                  </a>
                </div>

                <div className="mt-4 mb-4">
                  {resendCountdown > 0 ? (
                    <p className="text-[11px] font-bold text-[#AAAAAA]">
                      Resend in {resendCountdown}s
                    </p>
                  ) : (
                    <button
                      onClick={handleResendConfirmation}
                      className="text-[12px] font-extrabold text-[#E8312A]"
                    >
                      Didn't receive it? Resend →
                    </button>
                  )}
                </div>

                <button
                  onClick={() => { setScreen('signin'); setError(null); }}
                  className="text-[13px] font-bold text-[#E8312A] mt-2"
                >
                  <ArrowLeft size={14} className="inline mr-1" />
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 200ms ease-in-out;
        }
      `}</style>
      </div>
    </>
  );
};
