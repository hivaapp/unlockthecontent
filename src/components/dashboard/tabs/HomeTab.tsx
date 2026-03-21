
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { CountUp } from '../../ui/CountUp';
import { ArrowRight, UserCheck, Download } from 'lucide-react';
import { getAllUniqueSubscribers } from '../../../services/emailSubscribeService';
import { GlobalSubscribersSheet } from '../GlobalSubscribersSheet';
import { getCreatorLinks } from '../../../services/linksService';
import { getRecentActivity, type Activity, clearActivity } from '../../../services/activityService';
import { Trash2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const HomeTab = () => {
    const { currentUser: user, refreshProfile } = useAuth();
    const { showToast: toast } = useToast();
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
    const [totalViews, setTotalViews] = useState<number>(0);
    const [isSubscribersSheetOpen, setIsSubscribersSheetOpen] = useState(false);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(true);

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

            // Fetch recent activities
            setIsLoadingActivities(true);
            const recentActivities = await getRecentActivity(user!.id, user?.lastActivityClearedAt);
            setActivities(recentActivities);
            setIsLoadingActivities(false);
        } catch (err) {
            console.error('Failed to load home stats:', err);
            setIsLoadingActivities(false);
        }
    };

    const handleClearActivity = async () => {
        if (!user?.id) return;
        
        if (!window.confirm('Are you sure you want to clear all recent activity? This cannot be undone.')) {
            return;
        }

        try {
            await clearActivity(user.id);
            await refreshProfile();
            setActivities([]);
            toast('Activity cleared', 'success');
        } catch (err) {
            console.error('Failed to clear activity:', err);
            toast('Failed to clear activity', 'error');
        }
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
                            <CountUp end={totalViews} />
                        </span>
                        <span className="text-[11px] font-bold text-textMid uppercase tracking-wide">Total Views</span>
                    </div>
                    <button 
                        onClick={() => setIsSubscribersSheetOpen(true)}
                        className="card h-auto p-4 flex gap-1 flex-col shadow-none bg-brand/5 border-brand/10 hover:bg-brand/10 transition-colors text-left border cursor-pointer"
                    >
                        <span className="text-[20px] leading-none mb-1">📧</span>
                        <span className="text-[24px] font-black leading-none text-brand">
                            <CountUp end={subscriberCount || 0} />
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


            {/* Sponsor Activity Feed */}
            <div className="flex flex-col w-full">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[14px] font-extrabold text-text">Recent Activity</h3>
                    <div className="flex items-center gap-3">
                        {activities.length > 0 && (
                            <button 
                                onClick={handleClearActivity}
                                className="text-[12px] font-bold text-error flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                                <Trash2 size={12} /> Clear
                            </button>
                        )}
                        <button className="text-[13px] font-bold text-brand flex items-center gap-1">
                            See All <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                <div className="card p-0 overflow-hidden shadow-none flex flex-col min-h-[120px]">
                    {isLoadingActivities ? (
                        <div className="w-full h-[120px] flex justify-center items-center flex-col gap-2">
                             <div className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
                             <span className="text-[12px] font-bold text-textLight">Loading activity...</span>
                        </div>
                    ) : activities.length > 0 ? activities.map((item, idx) => (
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

            {/* Creator Tips */}
            <div className="flex flex-col w-full mb-4 mt-2">
                <h3 className="text-[14px] font-extrabold text-text mb-3">Growth Tips</h3>

                <div className="flex sm:grid sm:grid-cols-2 gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 hide-scrollbar snap-x snap-mandatory">
                    {/* Tip 1: Outcome focus */}
                    <div className="w-[230px] h-[110px] flex-shrink-0 card p-4 shadow-none border-l-4 border-l-brand flex flex-col justify-center snap-center bg-white border-border">
                        <span className="text-[10px] font-black text-brand mb-1 uppercase tracking-widest">Revenue Tip</span>
                        <h4 className="text-[13px] font-black text-text leading-tight mb-0.5">Sell the outcome, not the file</h4>
                        <p className="text-[11px] font-bold text-textMid leading-tight">"How to save 10 hours" converts 2x better than "Productivity Template".</p>
                    </div>

                    {/* Tip 2: Email ownership */}
                    <div className="w-[230px] h-[110px] flex-shrink-0 card p-4 shadow-none border-l-4 border-l-brand flex flex-col justify-center snap-center bg-white border-border">
                        <span className="text-[10px] font-black text-brand mb-1 uppercase tracking-widest">Audience Tip</span>
                        <h4 className="text-[13px] font-black text-text leading-tight mb-0.5">Bypass the algorithms</h4>
                        <p className="text-[11px] font-bold text-textMid leading-tight">Use "Email Subscribe" to turn followers into a mailing list you own forever.</p>
                    </div>

                    {/* Tip 3: Friction/Value balance */}
                    <div className="w-[230px] h-[110px] flex-shrink-0 card p-4 shadow-none border-l-4 border-l-brand flex flex-col justify-center snap-center bg-white border-border">
                        <span className="text-[10px] font-black text-brand mb-1 uppercase tracking-widest">Conversion Tip</span>
                        <h4 className="text-[13px] font-black text-text leading-tight mb-0.5">Balance friction and value</h4>
                        <p className="text-[11px] font-bold text-textMid leading-tight">Save "Email Unlocks" for deep-dives. Use "Social Follow" for quick tips.</p>
                    </div>

                    {/* Tip 4: Monetization */}
                    <div className="w-[230px] h-[110px] flex-shrink-0 card p-4 shadow-none border-l-4 border-l-brand flex flex-col justify-center snap-center bg-white border-border">
                        <span className="text-[10px] font-black text-brand mb-1 uppercase tracking-widest">Earnings Tip</span>
                        <h4 className="text-[13px] font-black text-text leading-tight mb-0.5">Monetize with zero friction</h4>
                        <p className="text-[11px] font-bold text-textMid leading-tight">Sponsor Ads are free for your users while earning you revenue per watch.</p>
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
