import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { SignInModal } from './SignInModal';
import { Menu, X, Lightbulb, Briefcase, Compass, Tag, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAvatarColor } from '../lib/utils';

export const Navbar = () => {
    const { isLoggedIn, currentUser } = useAuth();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isDashboard = location.pathname === '/dashboard';
    const navigate = useNavigate();

    const handleMobileNav = (href: string) => {
        setIsMenuOpen(false);
        setTimeout(() => {
            navigate(href);
        }, 50);
    };

    const DESKTOP_LINKS = [
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'Use Cases', href: '/use-cases' },
        { label: 'Explore', href: '/explore' },
        { label: 'Pricing', href: '/pricing' },
    ];

    const MOBILE_LINKS = [
        { label: 'How It Works', href: '/how-it-works', icon: <Lightbulb size={20} className="text-textMid absolute left-0" /> },
        { label: 'Use Cases', href: '/use-cases', icon: <Briefcase size={20} className="text-textMid absolute left-0" /> },
        { label: 'Explore', href: '/explore', icon: <Compass size={20} className="text-textMid absolute left-0" /> },
        { label: 'Pricing', href: '/pricing', icon: <Tag size={20} className="text-textMid absolute left-0" /> },
    ];

    const isMarketingPage = ['/pricing', '/how-it-works', '/use-cases'].includes(location.pathname);

    return (
        <>
            <nav className="sticky top-0 z-40 bg-bg/90 backdrop-blur-md border-b border-border h-16 w-full shadow-sm px-4 sm:px-8 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 z-50">
                    <div className="w-8 h-8 rounded-[14px] bg-brand flex items-center justify-center text-white font-black text-[12px] leading-none shrink-0 cursor-pointer">
                        AG
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                        <span className="font-black text-[18px] tracking-tight text-text">AdGate</span>
                        {isMarketingPage && (
                            <span className="text-[11px] font-bold text-textMid flex sm:hidden hover:text-text transition-colors mt-0.5">← Back to Home</span>
                        )}
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden sm:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
                    {isMarketingPage && (
                        <Link to="/" className="text-[11px] font-bold text-textMid hover:text-text transition-colors mr-2">← Back to Home</Link>
                    )}
                    {DESKTOP_LINKS.map(link => (
                        <Link key={link.label} to={link.href} className="text-[14px] font-bold text-textMid hover:text-text transition-colors">
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="hidden sm:flex items-center gap-2">
                    {!isLoggedIn ? (
                        <>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="font-bold text-textMid hover:text-text transition-colors px-2 py-2 text-[14px]"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="btn-primary h-10 px-4 text-[14px] shadow-sm"
                            >
                                Sign Up
                            </button>
                        </>
                    ) : (
                        isDashboard ? (
                            <div className="flex items-center gap-3">
                                <Link to="/explore" className="font-bold text-brand hover:text-brand-hover transition-colors px-2 py-2 text-[13px]">Explore</Link>
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-[16px] shadow-sm" style={{ backgroundColor: getAvatarColor(currentUser?.username || '') }}>
                                    {currentUser?.avatarInitial || 'A'}
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link to="/dashboard" className="font-bold text-textMid hover:text-text transition-colors px-2 py-2">
                                    My Links
                                </Link>
                                <Link to="/dashboard" className="btn-primary h-10 px-4 text-[14px] shadow-sm">
                                    Dashboard
                                </Link>
                            </>
                        )
                    )}
                </div>

                {/* Mobile Hamburger */}
                <button
                    className="sm:hidden w-10 h-10 flex items-center justify-center text-text z-50"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle navigation menu"
                    aria-expanded={isMenuOpen}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </nav>

            {/* Mobile Drawer */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 sm:hidden flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={() => setIsMenuOpen(false)} />
                    <div className="w-[80%] max-w-[320px] h-full bg-bg shadow-xl animate-slideInRight flex flex-col pt-20 relative z-50">
                        <div className="flex flex-col flex-1 px-4">
                            {MOBILE_LINKS.map(link => (
                                <button
                                    key={link.label}
                                    onClick={() => handleMobileNav(link.href)}
                                    className="w-full h-[56px] border-b border-border flex items-center justify-between font-extrabold text-[15px] text-[#111] hover:text-brand transition-colors relative pl-[40px] pr-2"
                                >
                                    <div className="absolute left-0 w-[40px] h-[40px] flex items-center justify-center">
                                        {link.icon}
                                    </div>
                                    <span>{link.label}</span>
                                    <ChevronRight size={20} className="text-textMid" />
                                </button>
                            ))}
                            {isLoggedIn && (
                                <Link
                                    to="/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full h-[56px] border-b border-border flex items-center font-extrabold text-[16px] text-brand transition-colors"
                                >
                                    Dashboard
                                </Link>
                            )}
                        </div>

                        {!isLoggedIn && (
                            <div className="p-4 flex flex-col gap-3 pb-8">
                                <button
                                    onClick={() => { setIsMenuOpen(false); setIsModalOpen(true); }}
                                    className="w-full h-[48px] bg-white border border-border text-text font-black text-[15px] rounded-[12px] shadow-sm"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => { setIsMenuOpen(false); setIsModalOpen(true); }}
                                    className="w-full h-[48px] bg-brand text-white font-black text-[15px] rounded-[12px] shadow-sm"
                                >
                                    Sign Up Free
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};
