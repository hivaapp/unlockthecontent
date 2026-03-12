import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatSessions } from '../context/ChatSessionsContext';
import { useMessaging } from '../context/MessagingContext';
import { useToast } from '../context/ToastContext';
import { Link, useLocation } from 'react-router-dom';
import { AuthBottomSheet } from './AuthBottomSheet';
import { Menu, X, Lightbulb, Briefcase, Compass, Tag, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAvatarColor } from '../lib/utils';

// Chat icon SVG (two overlapping speech bubbles)
const ChatBubbleIcon = () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M7 13.5C4.5 13.5 2.5 11.5 2.5 9C2.5 6.5 4.5 4.5 7 4.5H10C12.5 4.5 14.5 6.5 14.5 9C14.5 11.5 12.5 13.5 10 13.5H9L7 15.5V13.5Z" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 9C14.5 9 15 8 16 8H17C18.5 8 19.5 9.5 19.5 11C19.5 12.5 18.5 14 17 14H16.5L15 15.5V14C13.5 14 12.5 13 12.5 11.5" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChatNavBadge = ({ count }: { count: number }) => {
    if (count <= 0) return null;
    const displayText = count > 9 ? '9+' : String(count);
    return (
        <div
            className="absolute flex items-center justify-center rounded-full"
            style={{
                top: '4px',
                right: '4px',
                width: count > 9 ? '18px' : '16px',
                height: '16px',
                backgroundColor: '#E8312A',
            }}
        >
            <span
                className="text-white font-[900] leading-none"
                style={{ fontSize: count > 9 ? '8px' : '9px' }}
            >
                {displayText}
            </span>
        </div>
    );
};

export const Navbar = () => {
    const { isLoggedIn, currentUser, logout } = useAuth();
    const { addToast } = useToast();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [authScreen, setAuthScreen] = useState<'signin' | 'signup'>('signin');
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            addToast('Signed out successfully.', 'success');
        } catch {
            addToast('Error signing out. Try again.', 'error');
        }
    };

    let totalUnread = 0;
    try {
        const chatContext = useChatSessions();
        totalUnread += chatContext.getTotalUnread();
    } catch {
        // ChatSessionsProvider not mounted yet — ignore
    }
    
    try {
        const msgCtx = useMessaging();
        if (currentUser?.id) {
            totalUnread += msgCtx.getTotalDMUnread(currentUser.id);
            totalUnread += msgCtx.getTotalPendingCount(currentUser.id);
        }
    } catch { /* ignore */ }

    const isDashboard = location.pathname === '/dashboard';

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
                                onClick={() => { setAuthScreen('signin'); setIsModalOpen(true); }}
                                className="font-bold text-textMid hover:text-text transition-colors px-2 py-2 text-[14px]"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => { setAuthScreen('signup'); setIsModalOpen(true); }}
                                className="btn-primary h-10 px-4 text-[14px] shadow-sm"
                            >
                                Sign Up
                            </button>
                        </>
                    ) : (
                        isDashboard ? (
                            <div className="flex items-center gap-3">
                                <Link to="/explore" className="font-bold text-brand hover:text-brand-hover transition-colors px-2 py-2 text-[13px]">Explore</Link>
                                {/* Chat icon */}
                                <button
                                    onClick={() => navigate('/chats')}
                                    className="w-[44px] h-[44px] flex items-center justify-center relative"
                                    aria-label="My chats"
                                >
                                    <ChatBubbleIcon />
                                    <ChatNavBadge count={totalUnread} />
                                </button>
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-[16px] shadow-sm" style={{ backgroundColor: getAvatarColor(currentUser?.username || '') }}>
                                    {currentUser?.avatarInitial || 'A'}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/dashboard" className="font-bold text-textMid hover:text-text transition-colors px-2 py-2">
                                    My Links
                                </Link>
                                {/* Chat icon */}
                                <button
                                    onClick={() => navigate('/chats')}
                                    className="w-[44px] h-[44px] flex items-center justify-center relative"
                                    aria-label="My chats"
                                >
                                    <ChatBubbleIcon />
                                    <ChatNavBadge count={totalUnread} />
                                </button>
                                <Link to="/dashboard" className="btn-primary h-10 px-4 text-[14px] shadow-sm">
                                    Dashboard
                                </Link>
                            </div>
                        )
                    )}
                </div>

                {/* Mobile right side: chat icon + hamburger */}
                <div className="sm:hidden flex items-center gap-1 z-50">
                    {isLoggedIn && (
                        <button
                            onClick={() => navigate('/chats')}
                            className="w-[44px] h-[44px] flex items-center justify-center relative"
                            aria-label="My chats"
                        >
                            <ChatBubbleIcon />
                            <ChatNavBadge count={totalUnread} />
                        </button>
                    )}
                    <button
                        className="w-10 h-10 flex items-center justify-center text-text"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
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
                                <>
                                    <button
                                        onClick={() => handleMobileNav('/chats')}
                                        className="w-full h-[56px] border-b border-border flex items-center justify-between font-extrabold text-[15px] text-[#111] transition-colors relative pl-[40px] pr-2"
                                    >
                                        <div className="absolute left-0 w-[40px] h-[40px] flex items-center justify-center">
                                            <ChatBubbleIcon />
                                        </div>
                                        <span className="flex items-center gap-2">
                                            My Chats
                                            {totalUnread > 0 && (
                                                <span
                                                    className="flex items-center justify-center rounded-full text-white font-[900]"
                                                    style={{
                                                        backgroundColor: '#E8312A',
                                                        height: '18px',
                                                        minWidth: '18px',
                                                        padding: '0 5px',
                                                        fontSize: '10px',
                                                    }}
                                                >
                                                    {totalUnread > 9 ? '9+' : totalUnread}
                                                </span>
                                            )}
                                        </span>
                                        <ChevronRight size={20} className="text-textMid" />
                                    </button>
                                    <Link
                                        to="/dashboard"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="w-full h-[56px] border-b border-border flex items-center font-extrabold text-[16px] text-brand transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                </>
                            )}
                        </div>

                        {!isLoggedIn && (
                            <div className="p-4 flex flex-col gap-3 pb-8">
                                <button
                                    onClick={() => { setIsMenuOpen(false); setAuthScreen('signin'); setIsModalOpen(true); }}
                                    className="w-full h-[48px] bg-white border border-border text-text font-black text-[15px] rounded-[12px] shadow-sm"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => { setIsMenuOpen(false); setAuthScreen('signup'); setIsModalOpen(true); }}
                                    className="w-full h-[48px] bg-brand text-white font-black text-[15px] rounded-[12px] shadow-sm"
                                >
                                    Sign Up Free
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AuthBottomSheet 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                defaultScreen={authScreen}
            />
        </>
    );
};
