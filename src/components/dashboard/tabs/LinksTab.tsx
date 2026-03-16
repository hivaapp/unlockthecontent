import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, X, CheckCircle2 } from 'lucide-react';
import { LinkCard } from '../LinkCard';
import { CreateLinkSheet } from '../CreateLinkSheet';
import { EditLinkSheet } from '../EditLinkSheet';
import { MoreActionSheet } from '../MoreActionSheet';
import { AnalyticsSheet } from '../AnalyticsSheet';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { getCreatorLinks, toggleLinkActive, deleteLink as deleteLinkService } from '../../../services/linksService';
import { supabase } from '../../../lib/supabase';

import type { FollowerPairingConfigData } from '../FollowerPairingConfigForm';

export interface DashboardLink {
    id: string;
    title: string;
    type: string;
    donate: boolean;
    url: string;
    slug?: string;
    views: number;
    unlocks: number;
    status: string;
    mode?: string;
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
    file?: {
        id: string;
        original_name: string;
        mime_type: string;
        file_type: string;
    };
    // Raw DB fields for edit sheet
    _raw?: Record<string, unknown>;
}

// Transform Supabase link row to DashboardLink shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformLink = (row: any): DashboardLink => {
    const fileType = row.file?.file_type?.toUpperCase()
        || row.file?.original_name?.split('.').pop()?.toUpperCase()
        || (row.mode === 'follower_pairing' ? 'NONE' : 'FILE');

    const unlockType: DashboardLink['unlockType'] =
        row.mode === 'follower_pairing'
            ? 'follower_pairing'
            : row.unlock_type || 'custom_sponsor';

    return {
        id: row.id,
        title: row.title,
        type: fileType,
        donate: row.donate_enabled || false,
        url: `${window.location.origin}/r/${row.slug}`,
        slug: row.slug,
        views: row.view_count || 0,
        unlocks: row.unlock_count || 0,
        status: row.is_active ? 'active' : 'disabled',
        mode: row.mode,
        unlockType,
        customAd: row.sponsor_config ? {
            requiresClick: row.sponsor_config.requires_click,
            redirectUrl: row.sponsor_config.brand_website,
            videoWatches: row.unlock_count || 0,
        } : undefined,
        emailConfig: row.email_config || undefined,
        socialConfig: row.social_config || undefined,
        followerPairingConfig: row.pairing_config || undefined,
        file: row.file || undefined,
        _raw: row,
    };
};

export const LinksTab = ({ searchQuery, setSearchQuery }: { searchQuery: string, setSearchQuery: (q: string) => void }) => {
    const [activeSort, setActiveSort] = useState('All');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editLinkData, setEditLinkData] = useState<DashboardLink | null>(null);
    const [moreActionLink, setMoreActionLink] = useState<DashboardLink | null>(null);
    const [analyticsLink, setAnalyticsLink] = useState<DashboardLink | null>(null);
    const [links, setLinks] = useState<DashboardLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

    const { showToast } = useToast();
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Read newLink param for newly generated links after recovery
    const query = new URLSearchParams(location.search);
    const newLinkSlug = query.get('newLink');
    const [showNewLinkBanner, setShowNewLinkBanner] = useState(!!newLinkSlug);

    const clearNewLinkParam = useCallback(() => {
        if (newLinkSlug) {
            query.delete('newLink');
            navigate({
                pathname: location.pathname,
                search: query.toString()
            }, { replace: true });
        }
    }, [newLinkSlug, query, navigate, location.pathname]);

    // ── Fetch links from Supabase ─────────────────────────────────────────
    const fetchLinks = useCallback(async () => {
        if (!currentUser?.id) return;
        try {
            const data = await getCreatorLinks(currentUser.id);
            setLinks(data.map(transformLink));
        } catch (err) {
            console.error('Failed to fetch links:', err);
            showToast({ message: 'Could not load links', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.id, showToast]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    // ── Real-time stats subscription ──────────────────────────────────────
    useEffect(() => {
        if (!currentUser?.id) return;

        const channel = supabase
            .channel('link-stats')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'links',
                    filter: `creator_id=eq.${currentUser.id}`,
                },
                (payload: { new: { id: string; view_count: number; unlock_count: number } }) => {
                    setLinks(prev => prev.map(l =>
                        l.id === payload.new.id
                            ? { ...l, views: payload.new.view_count, unlocks: payload.new.unlock_count }
                            : l
                    ));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'email_subscribers',
                    filter: `creator_id=eq.${currentUser.id}`,
                },
                (payload: { new: { link_id: string } }) => {
                    setLinks(prev => prev.map(l =>
                        l.id === payload.new.link_id
                            ? { ...l, unlocks: (l.unlocks || 0) + 1 }
                            : l
                    ));
                    showToast({ message: 'New subscriber!', type: 'success' });
                }
            )
            .subscribe();

        subscriptionRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id]);

    // ── Optimistic toggle ─────────────────────────────────────────────────
    const handleDisable = async (id: string, currentStatus: string) => {
        const newIsActive = currentStatus === 'disabled';
        const newStatus = newIsActive ? 'active' : 'disabled';

        // Optimistic update
        setLinks(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        setPendingIds(prev => new Set([...prev, id]));

        try {
            await toggleLinkActive(id, currentUser!.id, newIsActive);
            showToast({ message: `Link ${newIsActive ? 'activated' : 'paused'}` });
        } catch {
            // Revert
            setLinks(prev => prev.map(l => l.id === id ? { ...l, status: currentStatus } : l));
            showToast({ message: 'Failed to update link', type: 'error' });
        } finally {
            setPendingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    // ── Optimistic delete ─────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        const original = [...links];
        setLinks(prev => prev.filter(l => l.id !== id));

        try {
            await deleteLinkService(id, currentUser!.id);
            showToast({ message: 'Link deleted', type: 'success' });
        } catch {
            setLinks(original);
            showToast({ message: 'Failed to delete link', type: 'error' });
        }
    };

    const sorts = ['All', 'Most Viewed', 'Newest', 'Disabled'];

    // Derived state
    const filteredLinks = links
        .filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(l => {
            if (activeSort === 'All') return true;
            if (activeSort === 'Disabled') return l.status === 'disabled';
            return true;
        })
        .sort((a, b) => {
            if (activeSort === 'Most Viewed') return b.views - a.views;
            if (activeSort === 'Newest') return 0; // DB already returns newest first
            return 0;
        });

    // ── Skeleton loader ───────────────────────────────────────────────────
    const SkeletonCard = () => (
        <div className="w-full bg-white rounded-[18px] p-4 flex flex-col gap-3 border border-border overflow-hidden">
            <div className="h-[18px] w-3/5 bg-surfaceAlt rounded-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
            </div>
            <div className="flex gap-2">
                <div className="h-[28px] w-16 bg-surfaceAlt rounded-pill relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                </div>
                <div className="h-[28px] w-20 bg-surfaceAlt rounded-pill relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                </div>
            </div>
            <div className="h-[36px] bg-surfaceAlt rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
            </div>
            <div className="h-[48px] bg-surfaceAlt rounded-[14px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
            </div>
            <div className="flex gap-2">
                <div className="flex-1 h-[36px] bg-surfaceAlt rounded-[10px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                </div>
                <div className="flex-1 h-[36px] bg-surfaceAlt rounded-[10px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                </div>
                <div className="flex-1 h-[36px] bg-surfaceAlt rounded-[10px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                </div>
            </div>
        </div>
    );

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
                {/* Success Banner for Recovered Links */}
                {showNewLinkBanner && (
                    <div className="bg-[#EBF5EE] border border-[#d3e8db] rounded-[16px] p-4 flex items-start gap-3 relative animate-in slide-in-from-top-4 fade-in duration-300">
                        <CheckCircle2 className="w-5 h-5 text-[#417A55] shrink-0 mt-0.5" />
                        <div className="pr-6">
                            <h3 className="text-[14px] font-black text-[#111]">Link created successfully!</h3>
                            <p className="text-[13px] text-[#417A55] font-medium mt-1 leading-snug">
                                Good news! Since you signed in, we secured your files and successfully generated your link. 
                            </p>
                        </div>
                        <button 
                            onClick={() => { setShowNewLinkBanner(false); clearNewLinkParam(); }}
                            className="absolute top-4 right-4 text-[#417A55] hover:opacity-70 p-1 -m-1"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

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
                    {isLoading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : filteredLinks.length === 0 ? (
                        <div className="w-full py-16 flex flex-col items-center justify-center bg-white rounded-[18px] border border-border border-dashed">
                            <span className="text-4xl opacity-50 mb-3">👻</span>
                            <span className="text-[16px] font-black text-text">No links found</span>
                            <span className="text-[14px] font-semibold text-textMid mt-1">
                                {links.length === 0 ? 'Create your first link to get started.' : 'Try a different search or filter.'}
                            </span>
                        </div>
                    ) : (
                        filteredLinks.map(link => (
                            <div key={link.id} className={newLinkSlug === link.slug ? "ring-2 ring-brand rounded-[18px] transition-all" : ""}>
                                <LinkCard
                                    link={link}
                                    onEdit={() => setEditLinkData(link)}
                                    onMore={() => setMoreActionLink(link)}
                                    onAnalytics={() => setAnalyticsLink(link)}
                                    isPending={pendingIds.has(link.id)}
                                />
                            </div>
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
                    fetchLinks(); // Refetch real data
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
                        fetchLinks(); // Refetch real data
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
