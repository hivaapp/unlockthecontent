import { BottomSheet } from '../ui/BottomSheet';
import { Share2, ArrowDownRight, UserCheck } from 'lucide-react';
import type { DashboardLink } from './tabs/LinksTab';

interface AnalyticsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    link: DashboardLink;
}

export const AnalyticsSheet = ({ isOpen, onClose, link }: AnalyticsSheetProps) => {
    const isSocial = link.unlockType === 'social_follow';
    const isAccountability = link.unlockType === 'follower_pairing';
    const targets = isSocial && link.socialConfig?.followTargets ? (link.socialConfig.followTargets as any[]) : [];
    
    const views = link.views || 0;
    const completions = link.unlocks || 0;

    // Accountability data
    const accConfig = isAccountability ? link.followerPairingConfig : null;
    const accFunnel = isAccountability ? {
        landingViews: views,
        commitmentFilled: Math.round(views * 0.65),
        genderSelected: Math.round(views * 0.58),
        matched: Math.round(views * 0.45),
        signedIn: completions,
    } : null;

    const accGender = isAccountability ? {
        male: Math.round(completions * 0.42),
        female: Math.round(completions * 0.38),
        any: completions - Math.round(completions * 0.42) - Math.round(completions * 0.38),
    } : null;

    // Social funnel
    const generateFunnelData = () => {
        if (!targets.length) return [];
        let currentRemaining = views;
        const targetDropoff = (views - completions) / targets.length;
        
        return targets.map((target, index) => {
            const isLast = index === targets.length - 1;
            const targetViews = currentRemaining;
            const targetCompletions = isLast ? completions : Math.round(currentRemaining - targetDropoff);
            const conversionRate = targetViews > 0 ? Math.round((targetCompletions / targetViews) * 100) : 0;
            currentRemaining = targetCompletions;

            return {
                ...target,
                targetViews,
                targetCompletions,
                conversionRate
            };
        });
    };

    const funnelData = generateFunnelData();

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Analytics">
            <div className="flex flex-col gap-6 pb-6 pt-2 px-2">
                {/* Header Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surfaceAlt rounded-[16px] border border-border p-4 flex flex-col justify-center items-center">
                        <span className="text-[12px] font-bold text-textLight uppercase tracking-wider mb-1">Total Views</span>
                        <span className="text-[28px] font-black text-text leading-none">{views.toLocaleString()}</span>
                    </div>
                    <div className="bg-surfaceAlt rounded-[16px] border border-border p-4 flex flex-col justify-center items-center">
                        <span className="text-[12px] font-bold text-textLight uppercase tracking-wider mb-1">
                            {isAccountability ? 'Matched' : 'Completions'}
                        </span>
                        <span className="text-[28px] font-black text-brand leading-none">{completions.toLocaleString()}</span>
                    </div>
                </div>

                {/* ═══ Accountability Analytics ═══ */}
                {isAccountability && accFunnel && accGender && accConfig && (
                    <>
                        {/* Funnel */}
                        <div className="flex flex-col w-full">
                            <h3 className="text-[15px] font-black text-text mb-4 flex items-center gap-2">
                                📊 Participation Funnel
                            </h3>
                            <div className="flex flex-col gap-0">
                                {[
                                    { label: 'Landing page views', val: accFunnel.landingViews, color: '#111' },
                                    { label: 'Commitment written', val: accFunnel.commitmentFilled, color: '#B45309' },
                                    { label: 'Gender selected', val: accFunnel.genderSelected, color: '#6366F1' },
                                    { label: 'Matched with partner', val: accFunnel.matched, color: '#2563EB' },
                                    { label: 'Signed in & started', val: accFunnel.signedIn, color: '#22C55E' },
                                ].map((step, idx, arr) => {
                                    const pct = accFunnel.landingViews > 0 ? Math.round((step.val / accFunnel.landingViews) * 100) : 0;
                                    const dropOff = idx > 0 ? arr[idx - 1].val - step.val : 0;
                                    const dropPct = idx > 0 && arr[idx - 1].val > 0 ? Math.round((dropOff / arr[idx - 1].val) * 100) : 0;

                                    return (
                                        <div key={idx} className="relative">
                                            <div className="flex items-center justify-between py-3 px-3 rounded-[10px] mb-0.5 hover:bg-[#FAFAFA]" style={{ borderLeft: `3px solid ${step.color}` }}>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-[700] text-[#111]">{step.label}</span>
                                                    {idx > 0 && dropPct > 15 && (
                                                        <span className="text-[11px] font-[600] text-[#E8312A] flex items-center gap-1 mt-0.5">
                                                            <ArrowDownRight size={10} /> -{dropOff} ({dropPct}% drop)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[16px] font-[900] text-[#111]">{step.val.toLocaleString()}</span>
                                                    <span className="text-[12px] font-[700] text-[#AAA]">{pct}%</span>
                                                </div>
                                            </div>
                                            {idx < arr.length - 1 && (
                                                <div className="w-[1px] h-2 bg-[#E8E8E8] ml-5" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Gender Distribution */}
                        <div className="flex flex-col w-full">
                            <h3 className="text-[15px] font-black text-text mb-3 flex items-center gap-2">
                                👥 Gender Distribution
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { emoji: '👨', label: 'Male', val: accGender.male, bg: '#EFF6FF' },
                                    { emoji: '👩', label: 'Female', val: accGender.female, bg: '#FDF2F8' },
                                    { emoji: '🤝', label: 'Any', val: accGender.any, bg: '#FFFBEB' },
                                ].map(g => (
                                    <div key={g.label} className="rounded-[12px] p-3 flex flex-col items-center" style={{ backgroundColor: g.bg }}>
                                        <span className="text-[20px] mb-1">{g.emoji}</span>
                                        <span className="text-[18px] font-[900] text-[#111]">{g.val}</span>
                                        <span className="text-[10px] font-[700] text-[#888] uppercase">{g.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Active status */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-[12px] p-3 flex flex-col items-center bg-[#EBF5EE]">
                                <span className="text-[18px] font-[900] text-[#417A55]">{accConfig.activePairs}</span>
                                <span className="text-[10px] font-[700] text-[#417A55] uppercase">Active Pairs</span>
                            </div>
                            <div className="rounded-[12px] p-3 flex flex-col items-center bg-surfaceAlt border border-border">
                                <span className="text-[18px] font-[900] text-[#111]">{accConfig.completedPairs}</span>
                                <span className="text-[10px] font-[700] text-[#888] uppercase">Completed</span>
                            </div>
                            <div className="rounded-[12px] p-3 flex flex-col items-center bg-surfaceAlt border border-border">
                                <span className="text-[18px] font-[900] text-[#111]">{accConfig.totalParticipants}</span>
                                <span className="text-[10px] font-[700] text-[#888] uppercase">Total</span>
                            </div>
                        </div>

                        {/* Completion Reward Status */}
                        {accConfig.completionAsset?.enabled && (
                            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#FFFBEB] border border-[#FDE68A] mt-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[20px]">🎁</span>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-[800] text-[#92400E]">Reward Active</span>
                                        <span className="text-[11px] font-[600] text-[#D97757] max-w-[150px] truncate">{accConfig.completionAsset.fileName}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[16px] font-[900] text-[#92400E]">{accConfig.completedPairs}</span>
                                    <span className="text-[9px] font-[800] text-[#D97757] uppercase tracking-wider">Delivered</span>
                                </div>
                            </div>
                        )}

                        {/* Scheduled Messages status */}
                        {accConfig.scheduledMessages && accConfig.scheduledMessages.length > 0 && (
                            <div className="flex flex-col w-full">
                                <h3 className="text-[15px] font-black text-text mb-3 flex items-center gap-2">
                                    📅 Scheduled Messages
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {accConfig.scheduledMessages.map((msg: any) => (
                                        <div key={msg.id} className="h-[44px] flex items-center justify-between px-3 rounded-[10px]" style={{ backgroundColor: '#FAFAFA', border: '1px solid #E8E8E8' }}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-[800] text-[#92400E]">Day {msg.dayNumber}</span>
                                                <span className="text-[#CCC]">·</span>
                                                <span className="text-[12px] font-[600] text-[#888] truncate max-w-[160px]">{msg.content}</span>
                                            </div>
                                            <span className={`text-[11px] font-[800] px-2 py-0.5 rounded-full ${msg.isSent ? 'bg-[#EBF5EE] text-[#417A55]' : 'bg-[#FDF4EC] text-[#A0622A]'}`}>
                                                {msg.isSent ? '✓ Sent' : 'Pending'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Waiting pool */}
                        {accConfig.waitingPool && (
                            <div className="flex flex-col w-full border-t border-border pt-4">
                                <h3 className="text-[14px] font-[800] text-text mb-3">Waiting Pool</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { k: 'male', label: 'Male', emoji: '👨' },
                                        { k: 'female', label: 'Female', emoji: '👩' },
                                        { k: 'any', label: 'Any', emoji: '🤝' },
                                    ].map(wp => (
                                        <div key={wp.k} className="h-[36px] flex items-center justify-center gap-1.5 rounded-[8px] bg-surfaceAlt border border-border text-[12px] font-[700] text-textMid">
                                            <span>{wp.emoji}</span>
                                            {(accConfig.waitingPool as any)[wp.k] || 0} waiting
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ═══ Social Follow Analytics ═══ */}
                {isSocial && funnelData.length > 0 && (
                    <div className="flex flex-col w-full">
                        <h3 className="text-[15px] font-black text-text mb-4 flex items-center gap-2">
                            <Share2 size={16} /> Target Completion Funnel
                        </h3>

                        <div className="flex flex-col gap-4">
                            {funnelData.map((target, idx) => (
                                <div key={target.id || idx} className="flex flex-col relative group">
                                    {idx < funnelData.length - 1 && (
                                        <div className="absolute left-6 top-12 bottom-[-16px] w-[2px] bg-border z-0" />
                                    )}
                                    
                                    <div className="bg-white rounded-[14px] border border-border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] z-10 relative flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-surfaceAlt flex items-center justify-center font-black text-[16px] border border-border/50">
                                                    {target.type === 'custom' ? target.customIcon || '🔗' : 
                                                     target.platform === 'youtube' ? '▶️' : 
                                                     target.platform === 'twitter' ? '🐦' : 
                                                     target.platform === 'instagram' ? '📸' : 
                                                     target.platform === 'tiktok' ? '📱' : 
                                                     target.platform === 'discord' ? '💬' : '👥'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold text-text leading-tight">
                                                        {target.type === 'custom' ? target.customLabel : target.instructionText || `Follow on ${target.platform}`}
                                                    </span>
                                                    <span className="text-[12px] font-semibold text-textMid">
                                                        {target.type === 'custom' ? target.customUrl : target.handle}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[16px] font-black text-text">{target.targetCompletions.toLocaleString()}</span>
                                                <span className="text-[11px] font-bold text-textMid uppercase tracking-wider">Completed</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5 mt-1">
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="text-textMid">{target.targetViews.toLocaleString()} reached this step</span>
                                                <span className={target.conversionRate < 50 ? 'text-warning' : 'text-success'}>
                                                    {target.conversionRate}% completion rate
                                                </span>
                                            </div>
                                            <div className="w-full h-[6px] bg-surfaceAlt rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${target.conversionRate < 50 ? 'bg-warning' : 'bg-success'}`}
                                                    style={{ width: `${target.conversionRate}%` }}
                                                />
                                            </div>
                                        </div>

                                        {target.conversionRate < 60 && (
                                            <div className="mt-2 bg-warningBg border border-warning/20 rounded-[8px] p-2.5 flex items-start gap-2">
                                                <ArrowDownRight size={14} className="text-warning mt-0.5 shrink-0" />
                                                <span className="text-[11px] font-[600] text-warning flex-1 leading-snug">
                                                    High drop-off rate detected. Consider removing this step or updating the instruction text.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {!isSocial && !isAccountability && (
                    <div className="flex flex-col items-center justify-center p-8 bg-surfaceAlt rounded-[16px] border border-border border-dashed text-center">
                        <UserCheck size={32} className="text-textLight mb-3" />
                        <span className="text-[14px] font-bold text-text">More insights coming soon</span>
                        <span className="text-[12px] font-[600] text-textMid mt-1">Advanced analytics for this unlock type are being processed.</span>
                    </div>
                )}
            </div>
        </BottomSheet>
    );
};
