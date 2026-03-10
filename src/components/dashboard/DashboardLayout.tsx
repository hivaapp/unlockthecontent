import { Home, LinkIcon, User } from 'lucide-react';
import type { ReactNode } from 'react';

interface DashboardLayoutProps {
    children: ReactNode;
    currentTab: 'home' | 'links' | 'account';
    onTabChange: (tab: 'home' | 'links' | 'account') => void;
}

export const DashboardLayout = ({ children, currentTab, onTabChange }: DashboardLayoutProps) => {
    const tabs = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'links', icon: LinkIcon, label: 'Links' },
        { id: 'account', icon: User, label: 'Account' },
    ] as const;

    return (
        <div className="flex h-[calc(100vh-64px)] sm:h-screen w-full bg-bg overflow-hidden">
            {/* Desktop Sidebar (hidden on mobile) */}
            <aside className="hidden md:flex flex-col w-[220px] bg-surfaceAlt border-r border-border h-full flex-shrink-0">
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-[14px] bg-brand flex items-center justify-center text-white font-black text-xs leading-none">
                            AG
                        </div>
                        <span className="font-black text-xl tracking-tight text-text">AdGate</span>
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
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}

                    <button className="absolute bottom-6 left-4 right-4 flex items-center gap-3 px-4 h-12 rounded-[14px] font-bold text-sm text-error hover:bg-errorBg transition-colors mt-auto">
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

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-border z-30" style={{ height: 'calc(60px + env(safe-area-inset-bottom))' }}>
                <div className="flex items-center justify-around h-[60px] px-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center justify-center gap-1 w-full relative h-[60px] ${currentTab === tab.id ? 'text-[#E8312A]' : 'text-[#AAAAAA]'
                                }`}
                        >
                            {currentTab === tab.id && <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E8312A]" />}
                            <tab.icon className="w-[22px] h-[22px] mt-1" />
                            <span className="text-[10px] font-bold mt-[2px]">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
