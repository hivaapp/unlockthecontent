import { useState } from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { socialIcons } from '../../assets/socialIcons';
import type { SocialConfigData, SocialFollowTarget } from '../dashboard/SocialConfigForm';

interface SocialUnlockProps {
    config: SocialConfigData;
    onComplete: () => void;
}

export const SocialUnlock = ({ config, onComplete }: SocialUnlockProps) => {
    const [visitedIds, setVisitedIds] = useState<string[]>([]);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const followTargets = config.followTargets || [];
    const totalTargets = followTargets.length;
    const visitedCount = visitedIds.length;
    const allVisited = visitedCount >= totalTargets && totalTargets > 0;
    const progressPercent = totalTargets > 0 ? (visitedCount / totalTargets) * 100 : 0;

    const handleTargetClick = (target: SocialFollowTarget) => {
        if (!visitedIds.includes(target.id)) {
            setVisitedIds([...visitedIds, target.id]);
        }
    };

    const handleUnlock = () => {
        if (isUnlocking) return;
        setIsUnlocking(true);
        setTimeout(() => {
            setIsUnlocking(false);
            onComplete();
        }, 1200);
    };

    if (totalTargets === 0) {
        return (
            <div className="w-full flex items-center justify-center p-6 bg-surfaceAlt text-textMid rounded-lg text-[14px]">
                Add social steps to preview your unlock page
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center animate-fadeIn">

            <div className="w-12 h-12 bg-surfaceAlt text-text rounded-full flex items-center justify-center mb-6 border border-border">
                <Users size={24} strokeWidth={2.5} />
            </div>
            
            <h2 className="text-[20px] md:text-[24px] tracking-tight font-black text-text mb-3 text-center leading-tight">
                {config.customHeading || 'Complete steps to unlock'}
            </h2>
            
            {config.followDescription && (
                <p className="text-[14px] text-textMid text-center max-w-[320px] mb-8 leading-relaxed">
                    {config.followDescription}
                </p>
            )}

            {!config.followDescription && (
                <div className="mb-8 p-0" />
            )}

            <div className="w-full max-w-[340px]">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[12px] font-bold text-textMid uppercase tracking-wider">
                        Progress: {visitedCount}/{totalTargets}
                    </span>
                    {allVisited && <span className="text-[12px] font-bold text-success uppercase tracking-wider">Complete ✓</span>}
                </div>
                
                <div className="h-[6px] bg-surfaceAlt rounded-full overflow-hidden mb-8 border border-border">
                    <div 
                        className={`h-full transition-all duration-500 rounded-full ${allVisited ? 'bg-success' : 'bg-brand'}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="flex flex-col gap-0 mb-8 border-t border-border">
                    {followTargets.map((target) => (
                        <FollowTargetCard
                            key={target.id}
                            target={target}
                            isVisited={visitedIds.includes(target.id)}
                            onClick={() => handleTargetClick(target)}
                        />
                    ))}
                </div>

                {allVisited && (
                    <button
                        onClick={handleUnlock}
                        disabled={isUnlocking}
                        className={`w-full h-10 rounded-md text-[14px] font-bold flex items-center justify-center gap-2 transition-transform shadow-sm bg-brand hover:bg-brandHover text-white active:scale-[0.98] animate-in slide-in-from-bottom-2 fade-in duration-300 disabled:opacity-50`}
                    >
                        {isUnlocking ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Unlocking...
                            </>
                        ) : (
                            'Get Instant Access'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

const FollowTargetCard = ({ target, isVisited, onClick }: { target: SocialFollowTarget, isVisited: boolean, onClick: () => void }) => {
    // Attempt logic parity with getTargetLabel from live site
    let label = 'Visit link';
    if (target.type === 'platform') {
        const platformName = target.platform ? target.platform.charAt(0).toUpperCase() + target.platform.slice(1) : '';
        label = target.handle ? `Follow ${target.handle}` : `Follow on ${platformName}`;
    } else {
        label = target.customLabel || 'Visit link';
    }

    return (
        <button
            onClick={onClick}
            className={`w-full h-[64px] flex items-center gap-4 py-2 border-b border-border transition-colors text-left bg-white hover:bg-surfaceAlt group px-3 -mx-3 rounded-md ${isVisited ? 'opacity-70' : ''}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                isVisited ? 'bg-successBg text-success border border-success/20' : 'bg-surfaceAlt text-textMid group-hover:bg-white border border-border'
            }`}>
                {isVisited ? (
                    <CheckCircle2 size={18} strokeWidth={3} />
                ) : (target.type === 'platform' && target.platform && socialIcons[target.platform as keyof typeof socialIcons]) ? (
                    <img 
                        src={socialIcons[target.platform as keyof typeof socialIcons]} 
                        alt={target.platform}
                        className="w-5 h-5 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <span className="text-lg">{target.customIcon || '🔗'}</span>
                )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className={`text-[15px] font-[800] truncate ${isVisited ? 'text-textMid line-through' : 'text-text'}`}>
                    {label}
                </div>
                {target.instructionText && !isVisited && (
                    <div className="text-[13px] font-medium text-textLight truncate mt-0.5">
                        {target.instructionText}
                    </div>
                )}
            </div>
            <div className="w-8 h-8 flex items-center justify-end text-textLight transition-colors shrink-0">
                {isVisited ? null : <span className="text-[14px] group-hover:text-text transition-colors">↗</span>}
            </div>
        </button>
    );
};
