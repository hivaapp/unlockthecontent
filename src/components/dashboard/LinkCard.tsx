import { Share2, Edit2, MoreHorizontal, FileIcon, ShieldAlert, Sparkles, Mail, Handshake } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import type { DashboardLink } from './tabs/LinksTab';

interface LinkCardProps {
    link: DashboardLink;
    onEdit: () => void;
    onMore: () => void;
}

export const LinkCard = ({ link, onEdit, onMore }: LinkCardProps) => {
    const { showToast } = useToast();
    const isDisabled = link.status === 'disabled';

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: link.title,
                    url: `https://${link.url}`
                });
            } catch (err) {
                console.log('Share canceled', err);
            }
        } else {
            handleCopy();
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://${link.url}`);
        showToast({ message: 'Link copied to clipboard', type: 'success' });
    };

    return (
        <div
            className={`w-full bg-white rounded-[18px] p-4 flex flex-col gap-3 transition-all duration-300 relative border border-border shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden ${isDisabled ? 'opacity-60 grayscale-[20%]' : ''
                }`}
        >
            {/* 1. Title Row */}
            <div className="flex items-center justify-between w-full">
                <h3 className="text-[15px] font-black text-text truncate max-w-[85%]">
                    {link.title}
                </h3>
            </div>

            {/* 2. Badges Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {isDisabled ? (
                    <span className="flex-shrink-0 h-[28px] px-2.5 rounded-pill bg-warningBg border border-warning/20 text-[11px] font-black tracking-wide text-warning uppercase flex items-center justify-center">
                        ⏸ Paused
                    </span>
                ) : (
                    <span className="flex-shrink-0 h-[28px] px-2.5 rounded-pill bg-surfaceAlt border border-border text-[11px] font-black tracking-wide text-textMid uppercase flex items-center justify-center gap-1">
                        <FileIcon size={12} strokeWidth={3} /> {link.type}
                    </span>
                )}

                {(!link.unlockType || link.unlockType === 'custom_sponsor') ? (
                    <>
                        <span className="flex-shrink-0 h-[26px] px-[10px] rounded-[50px] bg-[#6366F1] text-[11px] font-[800] text-white flex items-center justify-center gap-1.5 shadow-sm">
                            <Sparkles size={10} /> Sponsor
                        </span>

                        <div className="flex flex-col items-start gap-1">
                            <span className="flex-shrink-0 h-[28px] px-2.5 rounded-pill bg-surfaceAlt border border-border text-[11px] font-black tracking-wide text-textMid uppercase flex items-center justify-center gap-1">
                                <ShieldAlert size={12} strokeWidth={3} /> {(link.customAd?.requiresClick || link.customAd?.redirectUrl) ? 'Watch \u2192 Click' : 'Video Only'}
                            </span>
                            <span className="text-[10px] font-black tracking-wide text-[#E8312A] uppercase px-1">
                                0% Fee
                            </span>
                        </div>
                    </>
                ) : link.unlockType === 'email_subscribe' ? (
                    <span className="flex-shrink-0 h-[26px] px-[10px] rounded-[50px] bg-[#166534] text-[11px] font-[800] text-white flex items-center justify-center gap-1.5 shadow-sm">
                        <Mail size={10} /> Email Subscribe
                    </span>
                ) : link.unlockType === 'social_follow' ? (
                    <span className="flex-shrink-0 h-[26px] px-[10px] rounded-[50px] bg-[#2563EB] text-[11px] font-[800] text-white flex items-center justify-center gap-1.5 shadow-sm">
                        <Share2 size={10} /> Social Follow
                    </span>
                ) : link.unlockType === 'follower_pairing' ? (
                    <span className="flex-shrink-0 h-[26px] px-[10px] rounded-[50px] bg-[#92400E] text-[11px] font-[800] text-white flex items-center justify-center gap-1.5 shadow-sm">
                        <Handshake size={10} /> Accountability
                    </span>
                ) : null}
            </div>

            {/* 3. URL Pill */}
            <button
                onClick={handleCopy}
                className="w-full h-[36px] bg-surfaceAlt border border-border rounded-[8px] px-3 flex items-center hover:border-textLight transition-colors mt-0.5 active:bg-border"
            >
                <span className="font-mono text-[13px] font-bold text-textMid truncate">{link.url}</span>
            </button>

            {/* 4. Stats Row */}
            {(!link.unlockType || link.unlockType === 'custom_sponsor') ? (
                <div className={`grid w-full mt-1 border border-border rounded-[14px] grid-cols-3 bg-surfaceAlt`}>
                    <div className="flex flex-col justify-center items-center py-2 border-r border-border">
                        <span className="text-[10px] sm:text-[11px] font-bold text-textLight uppercase tracking-wider mb-0.5">Views</span>
                        <span className="text-[14px] font-black text-text leading-none">{link.views.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col justify-center items-center py-2 border-r border-border">
                        <span className="text-[10px] sm:text-[11px] font-bold text-textLight uppercase tracking-wider mb-0.5">Watches</span>
                        <span className="text-[14px] font-black text-brand leading-none">{link.customAd?.videoWatches?.toLocaleString() || link.unlocks.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col justify-center items-center py-2 rounded-r-[14px]">
                        <span className="text-[10px] sm:text-[11px] font-bold text-textLight uppercase tracking-wider mb-0.5">Clicks</span>
                        <span className="text-[14px] font-black text-[#6366F1] leading-none">{(link.clicks || 0) > 0 ? (link.clicks || 0).toLocaleString() : link.unlocks.toLocaleString()}</span>
                    </div>
                </div>
            ) : link.unlockType === 'email_subscribe' ? (
                <div className={`grid w-full mt-1 border border-border rounded-[14px] grid-cols-2 bg-surfaceAlt`}>
                    <div className="flex flex-col justify-center items-center py-2 border-r border-border">
                        <span className="text-[10px] sm:text-[11px] font-bold text-textLight uppercase tracking-wider mb-0.5">Views</span>
                        <span className="text-[14px] font-black text-text leading-none">{link.views.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col justify-center items-center py-2 bg-surfaceAlt rounded-r-[14px]">
                        <span className="text-[10px] sm:text-[11px] font-bold text-textLight uppercase tracking-wider mb-0.5">Subscribers</span>
                        <span className="text-[14px] font-black text-brand leading-none">{link.unlocks.toLocaleString()}</span>
                    </div>
                </div>
            ) : link.unlockType === 'social_follow' ? (
                <div className={`grid w-full mt-1 border border-border rounded-[14px] grid-cols-3 bg-surfaceAlt`}>
                    <div className="flex flex-col justify-center items-center py-2 border-r border-border">
                        <span className="text-[10px] sm:text-[11px] font-bold text-textLight uppercase tracking-wider mb-0.5">Completions</span>
                        <span className="text-[14px] font-black text-brand leading-none">{link.unlocks?.toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-textMid mt-[2px]">All Targets</span>
                    </div>
                    <div className="flex flex-col justify-center items-center py-2 border-r border-border bg-surfaceAlt">
                        <span className="text-[10px] sm:text-[11px] font-bold text-textLight uppercase tracking-wider mb-0.5">Avg Rate</span>
                        <span className="text-[14px] font-black text-text leading-none">{link.views ? Math.round((link.unlocks / link.views) * 100) : 0}%</span>
                    </div>
                    <div className="flex flex-col justify-center items-center py-2 bg-surfaceAlt rounded-r-[14px]">
                        <span className="text-[10px] sm:text-[11px] font-bold text-textLight uppercase tracking-wider mb-0.5">Targets</span>
                        <span className="text-[14px] font-black text-text leading-none">{link.socialConfig?.followTargets ? (link.socialConfig.followTargets as any[]).length : 1}</span>
                    </div>
                </div>
            ) : (
                <div className={`grid w-full mt-1 border border-border rounded-[14px] grid-cols-2 bg-surfaceAlt`}>
                    <div className="flex flex-col justify-center items-center py-2 border-r border-border">
                        <span className="text-[10px] sm:text-[11px] font-bold text-textLight uppercase tracking-wider mb-0.5">Views</span>
                        <span className="text-[14px] font-black text-text leading-none">{link.views.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col justify-center items-center py-2 bg-surfaceAlt rounded-r-[14px]">
                        <span className="text-[10px] sm:text-[11px] font-bold text-textLight uppercase tracking-wider mb-0.5">Matched</span>
                        <span className="text-[14px] font-black text-brand leading-none">{link.unlocks.toLocaleString()}</span>
                    </div>
                </div>
            )}

            {/* 5. Actions Row */}
            <div className="w-full flex gap-2 mt-2">
                <button
                    onClick={handleShare}
                    className="flex-1 h-[36px] bg-[#EEF2FF] text-[#4F46E5] font-black text-[13px] rounded-[10px] flex items-center justify-center gap-1.5 hover:bg-[#E0E7FF] transition-colors"
                >
                    <Share2 size={16} strokeWidth={3} /> Share
                </button>
                <button
                    onClick={onEdit}
                    className="flex-1 h-[36px] bg-surfaceAlt text-text font-black text-[13px] rounded-[10px] flex items-center justify-center gap-1.5 hover:bg-border transition-colors border border-border"
                >
                    <Edit2 size={16} strokeWidth={3} /> Edit
                </button>
                <button
                    onClick={onMore}
                    className="flex-1 h-[36px] bg-white text-brand border border-brand/40 font-black text-[13px] rounded-[10px] flex items-center justify-center gap-1.5 hover:bg-brandTint transition-colors"
                >
                    <MoreHorizontal size={20} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};
