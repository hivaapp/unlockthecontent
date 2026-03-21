import { Home, LayoutDashboard, User, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useChatSessions } from '../../context/ChatSessionsContext';
import { useAuth } from '../../context/AuthContext';
import type { DashboardTab } from '../../pages/Dashboard';

interface DashboardLayoutProps {
    children: ReactNode;
    currentTab: DashboardTab;
    onTabChange: (tab: DashboardTab) => void;
}

export const DashboardLayout = ({ children, currentTab, onTabChange }: DashboardLayoutProps) => {
    let chatUnread = 0;
    try {
        const ctx = useChatSessions();
        chatUnread = ctx.getTotalUnread();
    } catch { /* ignore */ }

    const { logout } = useAuth();
    const tabs = [
        { id: 'home' as const, icon: Home, label: 'Home' },
        { id: 'analytics' as const, icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'chats' as const, icon: MessageCircle, label: 'Chats' },
        { id: 'account' as const, icon: User, label: 'Account' },
    ];

    return (
        <div className="flex h-[calc(100vh-64px)] sm:h-screen w-full bg-bg overflow-hidden">
            {/* Desktop Sidebar (hidden on mobile) */}
            <aside className="hidden md:flex flex-col w-[240px] bg-surfaceAlt border-r border-border h-full flex-shrink-0">
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-[14px] bg-brand flex items-center justify-center text-white font-black text-xs leading-none">
                            UC
                        </div>
                        <span className="font-black text-lg tracking-tighter text-text truncate">UnlockTheContent</span>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-4 flex flex-col gap-2 relative">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-3 px-4 h-12 rounded-[14px] font-bold text-sm transition-colors ${currentTab === tab.id
                                ? 'bg-[#FFF0EF] text-[#E8312A] border-l-[3px] border-[#E8312A]'
                                : 'text-textMid hover:bg-surface hover:text-text border-l-[3px] border-transparent'
                                }`}
                        >
                            <div className="relative">
                                <tab.icon className="w-5 h-5" />
                                {tab.id === 'chats' && chatUnread > 0 && (
                                    <div
                                        className="absolute -top-1 -right-1.5 flex items-center justify-center rounded-full"
                                        style={{ backgroundColor: '#E8312A', width: '14px', height: '14px' }}
                                    >
                                        <span className="text-[8px] font-[900] text-white">{chatUnread > 9 ? '9+' : chatUnread}</span>
                                    </div>
                                )}
                            </div>
                            {tab.label}
                        </button>
                    ))}

                    <button onClick={logout} className="absolute bottom-6 left-4 right-4 flex items-center gap-3 px-4 h-12 rounded-[14px] font-bold text-sm text-error hover:bg-errorBg transition-colors mt-auto">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Log Out
                    </button>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 h-full overflow-y-auto relative pb-[calc(60px+env(safe-area-inset-bottom)+16px)] md:pb-8">
                <div className="max-w-[800px] w-full mx-auto sm:px-8">
                    {children}
                </div>
            </main>

        </div>
    );
};
