
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { CountUp } from '../../ui/CountUp';
import { Copy, Plus, ArrowRight, UserCheck, Download } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { getAllUniqueSubscribers } from '../../../services/emailSubscribeService';
import { GlobalSubscribersSheet } from '../GlobalSubscribersSheet';
import { getCreatorLinks } from '../../../services/linksService';

export const HomeTab = ({ onTabChange }: { onTabChange: (tab: 'home' | 'links' | 'chats' | 'account') => void }) => {
    const { currentUser: user } = useAuth();
    const { showToast } = useToast();
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
    const [totalViews, setTotalViews] = useState<number>(0);
    const [isSubscribersSheetOpen, setIsSubscribersSheetOpen] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadStats();
        }
    }, [user?.id]);

    const loadStats = async () => {
        try {
            // Fetch subscriber count
            const subData = await getAllUniqueSubscribers(user!.id, { pageSize: 1 });
            setSubscriberCount(subData.total);

            // Fetch total views from links
            const links = await getCreatorLinks(user!.id);
            const views = links.reduce((acc, link) => acc + (link.view_count || 0), 0);
            setTotalViews(views);
        } catch (err) {
            console.error('Failed to load home stats:', err);
        }
    };

    // Mock Data
    const latestLink = { url: 'adga.te/r/design-system', exists: true };
    const activities = [
        { id: 1, type: 'unlock', title: 'design-system locked unlocked', time: '2 mins ago', icon: '🔓', bg: 'bg-brand/10' },
        { id: 3, type: 'create', title: 'Created new link', time: '2 days ago', icon: '🔗', bg: 'bg-surfaceAlt' },
        { id: 4, type: 'unlock', title: 'figma-kit locked unlocked', time: '2 days ago', icon: '🔓', bg: 'bg-brand/10' },
        { id: 5, type: 'unlock', title: 'resume-template unlocked', time: '3 days ago', icon: '🔓', bg: 'bg-brand/10' },
    ];

    const copyLink = () => {
        navigator.clipboard.writeText(latestLink.url);
        showToast({ message: 'Link copied to clipboard', type: 'success' });
    };

    return (
        <div className="flex flex-col gap-6 px-4 pt-4 sm:pt-8 w-full pb-8">
            {/* Greeting Strip */}
            <div className="w-full h-[88px] rounded-[18px] bg-gradient-to-r from-[#D97757] to-[#C4663F] p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="flex flex-col justify-center relative z-10">
                    <span className="text-[13px] font-bold text-white/80 mb-0.5">Welcome back,</span>
                    <span className="text-[28px] font-black text-white leading-tight">
                        {user?.name?.split(' ')[0] || 'Creator'}
                    </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center relative z-10 shadow-sm">
                    <span className="text-brand font-black text-lg">{user?.name?.[0]?.toUpperCase() || 'C'}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="card h-auto p-4 flex gap-1 flex-col shadow-none bg-surfaceAlt border-0">
                        <span className="text-[20px] leading-none mb-1">👀</span>
                        <span className="text-[24px] font-black leading-none text-text">
                            <CountUp end={totalViews || 1284} />
                        </span>
                        <span className="text-[11px] font-bold text-textMid uppercase tracking-wide">Total Views</span>
                    </div>
                    <button 
                        onClick={() => setIsSubscribersSheetOpen(true)}
                        className="card h-auto p-4 flex gap-1 flex-col shadow-none bg-brand/5 border-brand/10 hover:bg-brand/10 transition-colors text-left border cursor-pointer"
                    >
                        <span className="text-[20px] leading-none mb-1">📧</span>
                        <span className="text-[24px] font-black leading-none text-brand">
                            <CountUp end={subscriberCount !== null ? subscriberCount : 842} />
                        </span>
                        <span className="text-[11px] font-bold text-brand uppercase tracking-wide flex items-center gap-1">
                            Subscribers <ArrowRight size={10} />
                        </span>
                    </button>
                </div>
                
                {subscriberCount !== null && subscriberCount > 0 && (
                    <button 
                        onClick={() => setIsSubscribersSheetOpen(true)}
                        className="w-full flex items-center justify-between p-3 rounded-[12px] bg-white border border-border hover:border-brand/40 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brandTint flex items-center justify-center text-brand">
                                <UserCheck size={16} />
                            </div>
                            <span className="text-[13px] font-bold text-text">Export all captured emails</span>
                        </div>
                        <Download size={16} className="text-textLight group-hover:text-brand transition-colors" />
                    </button>
                )}
            </div>

            {/* Quick Share Strip */}
            <div className="card p-4 shadow-none flex flex-col gap-3">
                {latestLink.exists ? (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-extrabold text-text">Latest Link</span>
                            <button
                                onClick={copyLink}
                                className="flex items-center gap-1 text-[13px] font-bold text-brand hover:text-brand-hover"
                            >
                                <Copy className="w-3.5 h-3.5" /> Copy
                            </button>
                        </div>
                        <div className="w-full h-10 bg-surfaceAlt border border-border rounded-[14px] px-3 flex items-center hover:border-[#D97757] transition-colors cursor-pointer group" onClick={copyLink}>
                            <span className="font-mono text-[13px] text-textMid truncate group-hover:text-text transition-colors">{latestLink.url}</span>
                        </div>
                    </>
                ) : (
                    <button onClick={() => onTabChange('links')} className="btn-secondary w-full text-brand border-brand/30 bg-brand-tint hover:bg-brand/10">
                        <Plus size={16} className="mr-2" />
                        Create Your First Link
                    </button>
                )}
            </div>

            {/* Sponsor Activity Feed */}
            <div className="flex flex-col w-full">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[14px] font-extrabold text-text">Recent Activity</h3>
                    <button className="text-[13px] font-bold text-brand flex items-center gap-1">
                        See All <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="card p-0 overflow-hidden shadow-none flex flex-col">
                    {activities.length > 0 ? activities.map((item, idx) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between h-[60px] px-4 border-b border-border last:border-0 animate-slide-right opacity-0"
                            style={{ animation: `slide-right 300ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 80}ms forwards` }}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center ${item.bg}`}>
                                    <span className="text-[16px]">{item.icon}</span>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-[13px] font-bold text-text truncate">{item.title}</span>
                                    <span className="text-[11px] font-semibold text-textLight">{item.time}</span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="w-full h-[120px] flex justify-center items-center flex-col gap-2">
                            <span className="text-2xl opacity-60">📭</span>
                            <span className="text-[14px] font-bold text-textMid">No activity yet</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tips Cards */}
            <div className="flex flex-col w-full mb-4">
                <h3 className="text-[14px] font-extrabold text-text mb-3">Creator Tips</h3>

                <div className="flex sm:grid sm:grid-cols-2 gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 hide-scrollbar snap-x snap-mandatory">
                    <div className="w-[220px] h-[100px] flex-shrink-0 card p-4 shadow-none border-l-4 border-l-brand flex flex-col justify-center snap-center">
                        <span className="text-[12px] font-bold text-brand mb-1">PRO TIP</span>
                        <h4 className="text-[14px] font-extrabold text-text leading-tight mb-0.5">Share in communities</h4>
                        <p className="text-[12px] font-semibold text-textMid leading-snug">Reddit and Discord drive the highest value traffic.</p>
                    </div>

                    <div className="w-[220px] h-[100px] flex-shrink-0 card p-4 shadow-none border-l-4 border-l-brand flex flex-col justify-center snap-center">
                        <span className="text-[12px] font-bold text-brand mb-1">PRO TIP</span>
                        <h4 className="text-[14px] font-extrabold text-text leading-tight mb-0.5">Test multiple CTAs</h4>
                        <p className="text-[12px] font-semibold text-textMid leading-snug">Change your sponsor button text to see what drives the most clicks.</p>
                    </div>
                </div>
            </div>

            <GlobalSubscribersSheet 
                isOpen={isSubscribersSheetOpen} 
                onClose={() => setIsSubscribersSheetOpen(false)} 
            />
        </div>
    );
};
