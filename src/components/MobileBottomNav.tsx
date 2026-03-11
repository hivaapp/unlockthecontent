import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Compass, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChatSessions } from '../context/ChatSessionsContext';

export const MobileBottomNav = () => {
    const { isLoggedIn } = useAuth();
    const location = useLocation();

    let chatUnread = 0;
    try {
        const ctx = useChatSessions();
        chatUnread = ctx.getTotalUnread();
    } catch { /* ignore */ }

    if (!isLoggedIn) return null;

    const navItems = [
        { id: 'home', path: '/dashboard?tab=home', icon: Home, label: 'Home' },
        { id: 'explore', path: '/explore', icon: Compass, label: 'Explore' },
        { id: 'dashboard', path: '/dashboard?tab=analytics', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'chats', path: '/chats', icon: MessageCircle, label: 'Chats' },
        { id: 'account', path: '/dashboard?tab=account', icon: User, label: 'Account' }
    ];

    const getIsActive = (item: typeof navItems[0]) => {
        if (item.id === 'home') {
            return location.pathname === '/dashboard' && (!location.search || location.search.includes('tab=home'));
        }
        if (item.id === 'dashboard') {
            return location.pathname === '/dashboard' && location.search.includes('tab=analytics');
        }
        return location.pathname.startsWith(item.path);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-[64px] px-2">
                {navItems.map(item => {
                    const isActive = getIsActive(item);
                    return (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`flex flex-col items-center justify-center gap-1 w-full relative h-full ${
                                isActive ? 'text-brand' : 'text-textLight hover:text-textMid'
                            } transition-colors`}
                        >
                            {isActive && <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand" />}
                            
                            <div className="relative mt-1">
                                <item.icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                                {item.id === 'chats' && chatUnread > 0 && (
                                    <div
                                        className="absolute -top-1 -right-2 flex items-center justify-center rounded-full bg-[#E8312A]"
                                        style={{ width: chatUnread > 9 ? '18px' : '16px', height: '16px' }}
                                    >
                                        <span className="text-white font-[900] leading-none" style={{ fontSize: chatUnread > 9 ? '8px' : '9px' }}>
                                            {chatUnread > 9 ? '9+' : chatUnread}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] font-extrabold tracking-wide mt-[2px] max-[380px]:hidden">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
