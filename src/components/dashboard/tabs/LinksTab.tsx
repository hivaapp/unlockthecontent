import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { LinkCard } from '../LinkCard';
import { CreateLinkSheet } from '../CreateLinkSheet';
import { EditLinkSheet } from '../EditLinkSheet';
import { MoreActionSheet } from '../MoreActionSheet';
import { AnalyticsSheet } from '../AnalyticsSheet';
import { useToast } from '../../../context/ToastContext';

import type { FollowerPairingConfigData } from '../FollowerPairingConfigForm';

export interface DashboardLink {
    id: string;
    title: string;
    type: string;
    donate: boolean;
    url: string;
    views: number;
    unlocks: number;
    status: string;
    unlockType?: 'custom_sponsor' | 'email_subscribe' | 'social_follow' | 'follower_pairing';
    clicks?: number;
    customAd?: {
        requiresClick?: boolean;
        redirectUrl?: string;
        videoWatches?: number;
    };
    emailConfig?: Record<string, unknown>;
    socialConfig?: Record<string, unknown>;
    followerPairingConfig?: FollowerPairingConfigData | null;
}

export const LinksTab = ({ searchQuery, setSearchQuery }: { searchQuery: string, setSearchQuery: (q: string) => void }) => {
    const [activeSort, setActiveSort] = useState('All');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editLinkData, setEditLinkData] = useState<DashboardLink | null>(null);
    const [moreActionLink, setMoreActionLink] = useState<DashboardLink | null>(null);
    const [analyticsLink, setAnalyticsLink] = useState<DashboardLink | null>(null);

    const { showToast } = useToast();

    const [links, setLinks] = useState<DashboardLink[]>([
        {
            id: '1',
            title: 'freeresource.pdf',
            type: 'PDF',
            donate: true,
            url: 'adga.te/r/freeresource',
            views: 1243,
            unlocks: 842,
            
            status: 'active'
        },
        {
            id: '2',
            title: 'figma-ui-kit.fig',
            type: 'FIGMA',
            donate: false,
            url: 'adga.te/r/figma-kit',
            views: 450,
            unlocks: 120,
            
            status: 'active'
        },
        {
            id: '3',
            title: 'old-campaign.zip',
            type: 'ZIP',
            donate: false,
            url: 'adga.te/r/old-camp',
            views: 3220,
            unlocks: 1560,
            
            status: 'disabled'
        },
        {
            id: '4',
            title: 'Weekly UI Templates',
            type: 'FILE',
            donate: false,
            url: 'adga.te/r/ui-templates',
            views: 1205,
            unlocks: 480,
            
            status: 'active',
            unlockType: 'email_subscribe'
        },
        {
            id: '5',
            title: '14-Day Coding Challenge',
            type: 'NONE',
            donate: false,
            url: 'adga.te/r/code-challenge',
            views: 340,
            unlocks: 156,
            
            status: 'active',
            unlockType: 'follower_pairing'
        }
    ]);

    const sorts = ['All', 'Most Viewed', 'Newest', 'Disabled'];

    const handleDelete = (id: string) => {
        setLinks(prev => prev.map(l => l.id === id ? { ...l, status: 'deleting' } : l));
        setTimeout(() => {
            setLinks(prev => prev.filter(l => l.id !== id));
            showToast({ message: 'Link deleted', type: 'success' });
        }, 300);
    };

    const handleDisable = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
        setLinks(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        showToast({ message: `Link ${newStatus === 'active' ? 'activated' : 'paused'}` });
    };

    // Derived state
    const filteredLinks = links
        .filter(l => l.status !== 'deleting')
        .filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(l => {
            if (activeSort === 'All') return true;
            if (activeSort === 'Disabled') return l.status === 'disabled';
            return true;
        })
        .sort((a, b) => {
            if (activeSort === 'Most Viewed') return b.views - a.views;
            return 0; // Newest is default mock order
        });


    return (
        <div className="flex flex-col w-full relative min-h-full">
            {/* Sticky Sub-header */}
            <div className="sticky top-16 md:top-0 z-30 bg-white px-4 py-4 flex items-center justify-between border-b border-border/50">
                <h1 className="text-[16px] font-black text-text m-0">My Links</h1>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover hover:scale-105 transition-all shadow-[0_2px_8px_rgba(217,119,87,0.3)]"
                >
                    <Plus size={20} strokeWidth={3} />
                </button>
            </div>

            <div className="px-4 py-4 flex flex-col gap-4">
                {/* Search Bar */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textLight" />
                    <input
                        type="text"
                        placeholder="Search your links..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-[44px] bg-white border border-border rounded-[12px] pl-9 pr-10 text-[13px] font-semibold text-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-textLight hover:text-text"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Sort Control */}
                <div className="w-full overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="flex items-center gap-2 pb-1 pr-4 sm:pr-0 sm:flex-wrap">
                        {sorts.map(sort => (
                            <button
                                key={sort}
                                onClick={() => setActiveSort(sort)}
                                className={`flex-shrink-0 h-[36px] px-3.5 rounded-pill text-[12px] font-extrabold transition-colors border ${activeSort === sort
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-white text-textMid border-border hover:border-textLight'
                                    }`}
                            >
                                {sort}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Links List */}
                <div className="flex flex-col gap-3 pb-4">
                    {filteredLinks.length === 0 ? (
                        <div className="w-full py-16 flex flex-col items-center justify-center bg-white rounded-[18px] border border-border border-dashed">
                            <span className="text-4xl opacity-50 mb-3">👻</span>
                            <span className="text-[16px] font-black text-text">No links found</span>
                            <span className="text-[14px] font-semibold text-textMid mt-1">Try a different search or filter.</span>
                        </div>
                    ) : (
                        filteredLinks.map(link => (
                            <LinkCard
                                key={link.id}
                                link={link}
                                onEdit={() => setEditLinkData(link)}
                                onMore={() => setMoreActionLink(link)}
                            />
                        ))
                    )}
                </div>
            </div>

            <CreateLinkSheet
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => {
                    setIsCreateOpen(false);
                    showToast({ message: 'Link generated successfully!', type: 'success' });
                    setLinks([{
                        id: Date.now().toString(),
                        title: 'New Link ' + Math.floor(Math.random() * 100),
                        type: 'FILE',
                        donate: true,
                        url: 'adga.te/r/new-link',
                        views: 0,
                        unlocks: 0,
                        
                        status: 'active'
                    }, ...links]);
                }}
            />

            {editLinkData && (
                <EditLinkSheet
                    isOpen={!!editLinkData}
                    onClose={() => setEditLinkData(null)}
                    link={editLinkData}
                    onSuccess={() => {
                        setEditLinkData(null);
                        showToast({ message: 'Changes saved successfully!', type: 'success' });
                    }}
                />
            )}

            {moreActionLink && (
                <MoreActionSheet
                    isOpen={!!moreActionLink}
                    onClose={() => setMoreActionLink(null)}
                    link={moreActionLink}
                    onDelete={() => {
                        setMoreActionLink(null);
                        handleDelete(moreActionLink.id);
                    }}
                    onDisable={() => {
                        handleDisable(moreActionLink.id, moreActionLink.status);
                        setMoreActionLink(null);
                    }}
                    onAnalytics={() => {
                        setAnalyticsLink(moreActionLink);
                        setMoreActionLink(null);
                    }}
                />
            )}

            {analyticsLink && (
                <AnalyticsSheet
                    isOpen={!!analyticsLink}
                    onClose={() => setAnalyticsLink(null)}
                    link={analyticsLink}
                />
            )}
        </div>
    );
};
