import { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Grid, List as ListIcon, ChevronRight, Sparkles, X, Mail, Share2, Handshake } from 'lucide-react';
import { getAvatarColor } from '../lib/utils';
import { AuthBottomSheet } from '../components/AuthBottomSheet';
import { getExploreLinks, searchUsers } from '../services/linksService';
import { getTopCreators } from '../services/profileService';

export interface ExploreResource {
    id: string;
    slug: string;
    title: string;
    creatorName: string;
    creatorHandle: string;
    creatorAvatar: string;
    verified: boolean;
    fileType: string;
    unlockCount: string | number;
    category: string;
    adSource?: string;
    isCustomSponsor?: boolean;
    sponsorName?: string;
    requiresClick?: boolean;
    unlockType?: string;
}

const CATEGORIES = ['All', 'Dev', 'Design', 'Creators'];
const SORTS = ['Most Unlocked', 'Newest', 'Trending', 'Sponsored First'];

export const ExplorePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedCategory = searchParams.get('category') || 'All';
    const sortBy = searchParams.get('sort') || 'Most Unlocked';
    const viewMode = (searchParams.get('view') as 'grid' | 'list') || 'grid';
    const searchQuery = searchParams.get('q') || '';

    const updateParams = (newParams: Record<string, string>) => {
        const next = new URLSearchParams(searchParams);
        Object.keys(newParams).forEach(key => {
            if (newParams[key]) {
                next.set(key, newParams[key]);
            } else {
                next.delete(key);
            }
        });
        setSearchParams(next, { replace: true });
    };

    const setSelectedCategory = (cat: string) => updateParams({ category: cat === 'All' ? '' : cat });
    const setSortBy = (sort: string) => updateParams({ sort: sort === 'Most Unlocked' ? '' : sort });
    const setViewMode = (view: 'grid' | 'list') => updateParams({ view: view === 'grid' ? '' : view });
    const setSearchQuery = (q: string) => updateParams({ q });

    const [resources, setResources] = useState<ExploreResource[]>([]);
    const [topCreators, setTopCreators] = useState<any[]>([]);
    const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const [visibleCount, setVisibleCount] = useState(12);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

    // Fetch resources
    useEffect(() => {
        const fetchResources = async () => {
            setIsLoading(true);
            try {
                const sortKey = sortBy === 'Newest' ? 'created_at' : sortBy === 'Trending' ? 'view_count' : 'unlock_count';
                const { links, total } = await getExploreLinks({
                    search: searchQuery,
                    sortBy: sortKey as any,
                    pageSize: 50 // Fetch more for local filtering/pagination
                });

                const formatted: ExploreResource[] = links.map((l: any) => ({
                    id: l.id,
                    slug: l.slug,
                    title: l.title,
                    creatorName: l.creator?.name || 'Unknown',
                    creatorHandle: l.creator?.username || 'unknown',
                    creatorAvatar: l.creator?.initial || '?',
                    verified: l.creator?.is_verified || false,
                    fileType: l.file?.file_type?.toUpperCase() || 'LINK',
                    unlockCount: l.unlock_count || 0,
                    category: 'All', // We don't have explicit category in DB yet, so we'll filter by title/desc locally
                    unlockType: l.unlock_type || (l.mode === 'follower_pairing' ? 'follower_pairing' : undefined),
                    sponsorName: l.sponsor_config?.brand_name,
                    requiresClick: l.sponsor_config?.requires_click,
                }));

                setResources(formatted);
                setTotalCount(total);
            } catch (error) {
                console.error('Error fetching resources:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResources();
    }, [searchQuery, sortBy]);

    // Fetch top creators
    useEffect(() => {
        const fetchTopCreators = async () => {
            try {
                const creators = await getTopCreators(10);
                setTopCreators(creators);
            } catch (error) {
                console.error('Error fetching top creators:', error);
            }
        };
        fetchTopCreators();
    }, []);

    // Fetch searched users
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchedUsers([]);
            return;
        }
        const fetchUsers = async () => {
            try {
                const users = await searchUsers(searchQuery);
                setSearchedUsers(users);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        };
        fetchUsers();
    }, [searchQuery]);

    useLayoutEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('exploreScroll', window.scrollY.toString());
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const savedScroll = sessionStorage.getItem('exploreScroll');
        if (savedScroll) {
            window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
        }
    }, []);

    const filteredResources = useMemo(() => {
        let res = [...resources];
        if (selectedCategory !== 'All') {
            const q = selectedCategory.toLowerCase();
            res = res.filter(r => 
                r.title.toLowerCase().includes(q) || 
                (r.category && r.category.toLowerCase().includes(q))
            );
        }
        if (sortBy === 'Sponsored First') {
            res.sort((a, b) => {
                const aIsSponsor = !!(a.sponsorName || a.unlockType === 'custom_sponsor');
                const bIsSponsor = !!(b.sponsorName || b.unlockType === 'custom_sponsor');
                if (aIsSponsor && !bIsSponsor) return -1;
                if (!aIsSponsor && bIsSponsor) return 1;
                return 0;
            });
        }
        return res;
    }, [resources, selectedCategory]);

    const visibleResources = filteredResources.slice(0, visibleCount);

    const filteredUsers = searchedUsers;

    const handleLoadMore = () => {
        setIsLoadingMore(true);
        setTimeout(() => {
            setVisibleCount(prev => prev + 6);
            setIsLoadingMore(false);
        }, 800);
    };



    const getFileEmoji = (type: string) => {
        switch (type) {
            case 'ZIP': 
            case 'ARCHIVE': return '📦';
            case 'PDF': return '📄';
            case 'DOC': 
            case 'DOCUMENT': return '📝';
            case 'IMAGES': 
            case 'IMAGE': return '🖼️';
            case 'VIDEO': return '🎥';
            case 'SPREADSHEET': return '📊';
            case 'LINK': return '🔗';
            default: return '📁';
        }
    };

    return (
        <div className="w-full min-h-screen bg-bg flex flex-col items-center animate-fadeIn pb-0">

            <div className="w-full max-w-[800px] px-4 pt-8 sm:pt-12 pb-6">
                <h1 className="text-[28px] sm:text-[36px] font-black leading-tight text-text mb-2">Explore Free Resources</h1>
                <p className="text-[15px] font-semibold text-textMid">Discover {totalCount > 0 ? `${totalCount} ` : ''}files, prompts, and guides — free with a quick ad click.</p>
            </div>

            {/* Sticky Search bar on scroll simulation */}
            <div className="w-full max-w-[800px] px-4 mb-6 sticky top-14 z-20 bg-bg pt-2 pb-2">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textLight" size={18} />
                    <input
                        type="text"
                        placeholder="Search resources, users, or sponsors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-[48px] bg-white border border-border rounded-[14px] pl-10 pr-10 font-bold text-[14px] outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-textLight hover:text-text"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Category Filter */}
            <div className="w-full max-w-[800px] px-4 mb-6 relative">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`h-[36px] px-[14px] rounded-full font-extrabold text-[13px] whitespace-nowrap shrink-0 transition-colors snap-start
                                ${selectedCategory === cat ? 'bg-brand text-white border-brand border' : 'bg-white text-text border border-border hover:bg-surfaceAlt'}
                            `}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Trending Tags */}
            <div className="w-full max-w-[800px] px-4 mb-6">
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[12px] font-bold text-textMid flex items-center mr-1">Trending:</span>
                    <button className="h-[26px] px-3 rounded-[14px] font-bold text-[11px] bg-[#EDE9FE] text-[#4C1D95] border border-[#C4B5FD] transition-colors hover:bg-[#DDD6FE]">✨ Brand Sponsors</button>
                    <button className="h-[26px] px-3 rounded-[14px] font-bold text-[11px] bg-[#EDE9FE] text-[#4C1D95] border border-[#C4B5FD] transition-colors hover:bg-[#DDD6FE]">💼 Creator Deals</button>
                    <button className="h-[26px] px-3 rounded-[14px] font-bold text-[11px] bg-surfaceAlt text-textMid border border-border hover:bg-border transition-colors">Notion Templates</button>
                    <button className="h-[26px] px-3 rounded-[14px] font-bold text-[11px] bg-surfaceAlt text-textMid border border-border hover:bg-border transition-colors">UI Kits</button>
                </div>
            </div>

            {/* Sort Row */}
            <div className="w-full max-w-[800px] px-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-textMid">Sort by</span>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="bg-transparent font-black text-[14px] text-text outline-none focus:ring-0 cursor-pointer"
                    >
                        {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex bg-white rounded-[14px] p-0.5 border border-border">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-[14px] transition-colors ${viewMode === 'grid' ? 'bg-surfaceAlt text-text' : 'text-textLight hover:text-text'}`}
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-[14px] transition-colors ${viewMode === 'list' ? 'bg-surfaceAlt text-text' : 'text-textLight hover:text-text'}`}
                    >
                        <ListIcon size={18} />
                    </button>
                </div>
            </div>

            {/* Users Container */}
            {searchQuery && filteredUsers.length > 0 && (
                <div className="w-full max-w-[800px] px-4 mb-8">
                    <h2 className="text-[18px] font-black text-text mb-4">Users</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredUsers.map(user => (
                            <Link to={`/@${user.username}`} key={user.id} className="bg-white rounded-[14px] border border-border p-4 hover:border-brand transition-colors flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: user.avatar_color }}>
                                    <span className="text-white font-black text-[16px]">{user.initial}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-extrabold text-[15px] text-text flex items-center gap-1.5 truncate">
                                        {user.name}
                                        {user.is_creator && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#2563EB" className="shrink-0">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="text-[13px] font-bold text-textMid truncate">@{user.username}</div>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.location.href = `/@${user.username}`;
                                    }}
                                    className="h-[36px] px-4 rounded-full bg-brand text-white font-extrabold text-[13px] flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95"
                                >
                                    View
                                </button>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Resources Container */}
            <div className="w-full max-w-[800px] px-4 flex flex-col items-center min-h-[400px]">
                {isLoading ? (
                    <div className="w-full py-20 flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-4" />
                        <p className="text-[14px] font-bold text-textMid">Fetching resources...</p>
                    </div>
                ) : (() => {
                    const renderResourceGrid = (resources: ExploreResource[]) => (
                        <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                            {resources.map(r => (
                                <Link to={`/r/${r.slug}`} key={r.id} className="bg-white rounded-[14px] border border-border overflow-hidden hover:shadow-md transition-shadow flex flex-col group relative">
                                    {(!r.unlockType || r.unlockType === 'custom_sponsor') ? (
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border border-white/20 px-2 py-1 rounded-[6px] text-[#4C1D95] font-black text-[10px] shadow-sm z-10 flex items-center gap-1">✨ Sponsored</div>
                                    ) : (
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border border-border px-2 py-1 rounded-[6px] text-[#166534] font-black text-[10px] shadow-sm z-10 flex items-center gap-1">🆓 Free</div>
                                    )}
                                    <div className={`h-[100px] w-full ${(!r.unlockType || r.unlockType === 'custom_sponsor') ? 'bg-gradient-to-br from-[#EDE9FE] to-[#C4B5FD] text-[#4C1D95]' : r.unlockType === 'email_subscribe' ? 'bg-[#F0FDF4] text-[#166534]' : r.unlockType === 'social_follow' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-[#FFFBEB] text-[#92400E]'} flex items-center justify-center text-[40px] group-hover:scale-105 transition-transform duration-500`}>
                                        {getFileEmoji(r.fileType)}
                                    </div>
                                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                                        <h3 className="font-extrabold text-[13px] sm:text-[14px] leading-tight mb-1 line-clamp-2 min-h-[40px]">{r.title}</h3>
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                window.location.href = `/@${r.creatorHandle}`;
                                            }}
                                            className="text-[11px] font-bold text-textMid mb-3 truncate hover:text-brand text-left z-20 relative w-fit"
                                        >
                                            by @{r.creatorHandle}
                                        </button>

                                        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                                            <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 bg-surfaceAlt rounded-[14px] uppercase tracking-wide">{r.fileType}</span>
                                            {(!r.unlockType || r.unlockType === 'custom_sponsor') ? (
                                                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 bg-[#EDE9FE] text-[#4C1D95] rounded-[14px] flex items-center gap-1"><Sparkles size={10} /> {r.requiresClick ? 'Watch \u2192 Click' : 'Video Only'} · {r.sponsorName}</span>
                                            ) : r.unlockType === 'email_subscribe' ? (
                                                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 bg-[#166534] text-white rounded-[14px] flex items-center gap-1 shadow-sm"><Mail size={10} /> Email Subscribe</span>
                                            ) : r.unlockType === 'social_follow' ? (
                                                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 bg-[#2563EB] text-white rounded-[14px] flex items-center gap-1 shadow-sm"><Share2 size={10} /> Social Follow</span>
                                            ) : r.unlockType === 'follower_pairing' ? (
                                                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 bg-[#92400E] text-white rounded-[14px] flex items-center gap-1 shadow-sm"><Handshake size={10} /> Accountability</span>
                                            ) : null}
                                        </div>

                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-textLight">{r.unlockCount} unlocks</span>
                                        </div>

                                        <button className="w-full h-10 mt-3 bg-brand text-white font-black text-[13px] rounded-[14px] group-hover:bg-brand-hover transition-colors shadow-sm">
                                            Unlock Free
                                        </button>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    );

                    const renderResourceList = (resources: ExploreResource[]) => (
                        <div className="w-full flex justify-center flex-col gap-3 mb-8">
                            {resources.map(r => (
                                <Link to={`/r/${r.slug}`} key={r.id} className="w-full h-[72px] bg-white rounded-[14px] border border-border p-3 flex items-center hover:bg-surfaceAlt transition-colors group relative">
                                    <div className={`w-12 h-12 rounded-[10px] shrink-0 ${(!r.unlockType || r.unlockType === 'custom_sponsor') ? 'bg-gradient-to-br from-[#EDE9FE] to-[#C4B5FD] text-[#4C1D95] border-2 border-[#6366F1]' : r.unlockType === 'email_subscribe' ? 'bg-[#F0FDF4] text-[#166534]' : r.unlockType === 'social_follow' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-[#FFFBEB] text-[#92400E]'} flex items-center justify-center text-[24px] mr-3`}>
                                        {getFileEmoji(r.fileType)}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-extrabold text-[14px] leading-tight truncate">{r.title}</h3>
                                            {(!r.unlockType || r.unlockType === 'custom_sponsor') ? (
                                                <span className="text-[10px] bg-[#EDE9FE] text-[#4C1D95] font-black px-1.5 py-0.5 rounded-[14px]">✨ Sponsored</span>
                                            ) : (
                                                <span className="text-[10px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-black px-1.5 py-0.5 rounded-[14px]">🆓 Free</span>
                                            )}
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                window.location.href = `/@${r.creatorHandle}`;
                                            }}
                                            className="text-[12px] font-bold text-textMid truncate mt-0.5 hover:text-brand text-left z-20 relative w-fit"
                                        >
                                            by @{r.creatorHandle}
                                        </button>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0 mr-3">
                                        {(!r.unlockType || r.unlockType === 'custom_sponsor') ? (
                                            <span className="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 bg-[#EDE9FE] text-[#4C1D95] rounded-[14px] mb-1"><Sparkles size={10} /> {r.requiresClick ? 'Watch \u2192 Click' : 'Video Only'} · {r.sponsorName}</span>
                                        ) : r.unlockType === 'email_subscribe' ? (
                                            <span className="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 bg-[#166534] text-white rounded-[14px] mb-1 shadow-sm"><Mail size={10} /> Email Subscribe</span>
                                        ) : r.unlockType === 'social_follow' ? (
                                            <span className="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 bg-[#2563EB] text-white rounded-[14px] mb-1 shadow-sm"><Share2 size={10} /> Social Follow</span>
                                        ) : r.unlockType === 'follower_pairing' ? (
                                            <span className="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 bg-[#92400E] text-white rounded-[14px] mb-1 shadow-sm"><Handshake size={10} /> Accountability</span>
                                        ) : null}
                                        <span className="text-[11px] font-bold text-textLight">{r.unlockCount} unlocks</span>
                                    </div>
                                    <ChevronRight className="text-textLight group-hover:text-text transition-colors" size={20} />
                                </Link>
                            ))}
                        </div>
                    );

                    const renderResources = (res: ExploreResource[]) => viewMode === 'grid' ? renderResourceGrid(res) : renderResourceList(res);

                    if (sortBy === 'Sponsored First') {
                        const sponsored = visibleResources.filter(r => (!r.unlockType || r.unlockType === 'custom_sponsor'));
                        const standard = visibleResources.filter(r => (r.unlockType && r.unlockType !== 'custom_sponsor'));
                        return (
                            <>
                                {sponsored.length > 0 && (
                                    <>
                                        <div className="w-full flex items-center gap-2 mb-3 mt-1">
                                            <span className="text-[14px] font-black text-[#4C1D95]">✨ Sponsored Resources</span>
                                            <div className="h-px bg-border flex-1"></div>
                                        </div>
                                        {renderResources(sponsored)}
                                    </>
                                )}
                                {standard.length > 0 && (
                                    <>
                                        <div className="w-full flex items-center gap-2 mb-3 mt-1">
                                            <span className="text-[14px] font-black text-text">Standard Resources</span>
                                            <div className="h-px bg-border flex-1"></div>
                                        </div>
                                        {renderResources(standard)}
                                    </>
                                )}
                            </>
                        );
                    }

                    return renderResources(visibleResources);
                })()}

                {filteredResources.length === 0 && (
                    <div className="py-12 flex flex-col items-center">
                        <div className="text-[32px] mb-4 opacity-50">🔍</div>
                        <h3 className="text-[16px] font-black text-text mb-1">No resources found</h3>
                        <p className="text-[14px] text-textMid font-medium">Try adjusting your search or category filter</p>
                    </div>
                )}

                {visibleCount < filteredResources.length && (
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="h-[44px] px-8 border border-brand text-brand font-black text-[14px] rounded-full hover:bg-brandTint transition-colors flex items-center justify-center"
                    >
                        {isLoadingMore ? <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /> : "Load More"}
                    </button>
                )}
            </div>

            {/* Creator Leaderboard Section */}
            {/* Top Creators Leaderboard */}
            {(topCreators.length > 0 || isLoading) && (
                <div className="w-full bg-white border-y border-border py-8 mt-12 overflow-hidden flex flex-col items-center">
                    <div className="w-full max-w-[800px] px-4">
                        <h2 className="text-[20px] font-black text-text mb-6">Top Creators This Week</h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {isLoading ? (
                                // Skeleton for top creators
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="w-[140px] shrink-0 bg-surfaceAlt border border-border rounded-[16px] p-4 flex flex-col items-center snap-start animate-pulse">
                                        <div className="w-12 h-12 rounded-full bg-border/50 mb-2" />
                                        <div className="h-4 w-20 bg-border/50 rounded mb-2" />
                                        <div className="h-3 w-16 bg-border/50 rounded" />
                                    </div>
                                ))
                            ) : (
                                topCreators.map((creator) => (
                                    <div 
                                        key={creator.id} 
                                        onClick={() => window.location.href = `/@${creator.username}`}
                                        className="w-[140px] shrink-0 bg-surfaceAlt border border-border rounded-[16px] p-4 flex flex-col items-center text-center snap-start snap-always cursor-pointer hover:border-brand/30 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-full text-white flex items-center justify-center font-black text-[20px] mb-2" style={{ backgroundColor: creator.avatar_color || getAvatarColor(creator.username) }}>
                                            {creator.initial || creator.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[13px] font-black leading-tight mb-0.5 line-clamp-1">
                                            {creator.is_verified && '✨ '}
                                            {creator.name}
                                        </span>
                                        <span className="text-[11px] font-bold text-textMid mb-2 truncate max-w-full">@{creator.username}</span>
                                        
                                        {creator.active_pairing_links_count > 0 && (
                                            <span className="text-[12px] font-black text-success bg-success/10 px-2 py-0.5 rounded-[14px] mb-3">
                                                {creator.active_pairing_links_count} pairings
                                            </span>
                                        )}
                                        
                                        <span className="mt-auto text-[12px] font-bold text-brand hover:underline">View Profile</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Standard Footer */}
            <footer className="w-full bg-white border-t border-border py-12 px-4 flex flex-col items-center mt-12">
                <div className="w-full max-w-[1000px] flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-80">
                        <div className="w-6 h-6 rounded-[14px] bg-text text-white flex items-center justify-center font-black text-[10px] leading-none shrink-0">
                            AG
                        </div>
                        <span className="font-black text-[16px] tracking-tight text-text">AdGate</span>
                    </div>

                    <div className="flex items-center gap-6 text-[13px] font-bold text-textMid">
                        <Link to="/explore" className="hover:text-text transition-colors">Explore</Link>
                        <Link to="/terms" className="hover:text-text transition-colors">Terms of Service</Link>
                        <Link to="/privacy" className="hover:text-text transition-colors">Privacy Policy</Link>
                        <Link to="/contact" className="hover:text-text transition-colors">Contact</Link>
                    </div>

                    <div className="text-[12px] font-bold text-textLight">
                        © {new Date().getFullYear()} AdGate Inc. All rights reserved.
                    </div>
                </div>
            </footer>

            <AuthBottomSheet
                isOpen={isAuthSheetOpen}
                onClose={() => setIsAuthSheetOpen(false)}
                defaultScreen="signin"
            />
        </div>
    );
};
