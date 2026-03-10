import { BottomSheet } from '../ui/BottomSheet';
import { Share2, ArrowDownRight, UserCheck } from 'lucide-react';
import type { DashboardLink } from './tabs/LinksTab';

interface AnalyticsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    link: DashboardLink;
}

export const AnalyticsSheet = ({ isOpen, onClose, link }: AnalyticsSheetProps) => {
    // Only handling social_follow for now based on the prompt
    const isSocial = link.unlockType === 'social_follow';
    const targets = isSocial && link.socialConfig?.followTargets ? (link.socialConfig.followTargets as any[]) : [];
    
    // Simulate funnel data based on total views and unlocks
    const views = link.views || 0;
    const completions = link.unlocks || 0;

    // Distribute drop-offs across targets
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
                        <span className="text-[12px] font-bold text-textLight uppercase tracking-wider mb-1">Completions</span>
                        <span className="text-[28px] font-black text-brand leading-none">{completions.toLocaleString()}</span>
                    </div>
                </div>

                {isSocial && funnelData.length > 0 && (
                    <div className="flex flex-col w-full">
                        <h3 className="text-[15px] font-black text-text mb-4 flex items-center gap-2">
                            <Share2 size={16} /> Target Completion Funnel
                        </h3>

                        <div className="flex flex-col gap-4">
                            {funnelData.map((target, idx) => (
                                <div key={target.id || idx} className="flex flex-col relative group">
                                    {/* Connection Line */}
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

                                        {/* Progress Bar & Conversion */}
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

                                        {/* Drop-off Warning */}
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
                
                {(!isSocial || funnelData.length === 0) && (
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
