import { useState, useEffect } from 'react';
import { Twitter, Instagram, Linkedin, Youtube, ExternalLink, Check } from 'lucide-react';
import type { SocialConfigData, SocialFollowTarget } from '../dashboard/SocialConfigForm';
import { useParams } from 'react-router-dom';

interface SocialUnlockProps {
    config: SocialConfigData;
    onComplete: () => void;
}

const getPlatformIcon = (platform: string | null) => {
    switch (platform) {
        case 'twitter': return <Twitter size={24} className="text-white" />;
        case 'instagram': return <Instagram size={24} className="text-white" />;
        case 'linkedin': return <Linkedin size={24} className="text-white" />;
        case 'youtube': return <Youtube size={24} className="text-white" />;
        default: return <ExternalLink size={24} className="text-white" />;
    }
};

const getPlatformColor = (platform: string | null) => {
    switch (platform) {
        case 'twitter': return 'bg-[#1DA1F2]';
        case 'instagram': return 'bg-gradient-to-tr from-[#FD1D1D] to-[#833AB4]';
        case 'linkedin': return 'bg-[#0A66C2]';
        case 'youtube': return 'bg-[#FF0000]';
        default: return 'bg-[#000]';
    }
};

const useFollowSession = (slug: string = 'default', targets: SocialFollowTarget[]) => {
    const key = `adgate_follow_${slug}`;
    const [state, setState] = useState(() => {
        try {
            const saved = sessionStorage.getItem(key);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            completedTargetIds: [] as string[],
            currentTargetIndex: 0,
            isComplete: false,
            sessionStarted: false,
        };
    });

    useEffect(() => {
        sessionStorage.setItem(key, JSON.stringify(state));
    }, [state, key]);

    const confirmCurrentTarget = () => {
        setState((prev: any) => {
            const newIndex = prev.currentTargetIndex + 1;
            return {
                ...prev,
                completedTargetIds: [...prev.completedTargetIds, targets[prev.currentTargetIndex].id],
                currentTargetIndex: newIndex,
                isComplete: newIndex >= targets.length
            };
        });
    };

    return {
        ...state,
        confirmCurrentTarget,
        currentTarget: targets[state.currentTargetIndex],
        progress: { completed: state.completedTargetIds.length, total: targets.length }
    };
};

export const SocialUnlock = ({ config, onComplete }: SocialUnlockProps) => {
    const { slug } = useParams();
    const { 
        currentTargetIndex, 
        isComplete, 
        confirmCurrentTarget, 
        currentTarget, 
        progress 
    } = useFollowSession(slug, config.followTargets);

    const [actionState, setActionState] = useState<'idle' | 'clicked' | 'confirming'>('idle');

    useEffect(() => {
        if (isComplete) {
            onComplete();
        }
    }, [isComplete, onComplete]);

    // Reset action state when target changes
    useEffect(() => {
        setActionState('idle');
    }, [currentTargetIndex]);

    if (!config.followTargets || config.followTargets.length === 0) {
        return (
            <div className="w-full h-[200px] flex items-center justify-center p-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-center">
                This link is not fully configured yet. Check back later or contact the creator.
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="w-full animate-slide-down bg-[#EDFAF3] rounded-[16px] p-6 text-center border border-[#166534]/20 flex flex-col items-center">
                <span className="text-[16px] font-[900] text-[#166534] mb-3">✓ All done! Unlocking your content...</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar w-full justify-center">
                    {config.followTargets.map(t => (
                        <div key={t.id} className="h-[28px] rounded-full bg-white border border-[#166534]/20 px-3 flex items-center gap-1.5 shrink-0 shadow-sm">
                            <Check size={12} className="text-[#166534]" strokeWidth={3} />
                            <span className="text-[11px] font-[700] text-[#166534]">{t.type === 'platform' ? t.handle : t.customLabel}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const t = currentTarget;

    const handleCtaClick = () => {
        setActionState('clicked');
        window.open(t.type === 'platform' ? t.profileUrl! : t.customUrl!, '_blank');
        
        setTimeout(() => {
            setActionState('confirming');
        }, 1500);
    };

    const handleConfirm = () => {
        setActionState('idle');
        confirmCurrentTarget();
    };

    return (
        <div className="w-full flex flex-col items-center animate-fadeIn gap-5">
            <h2 className="text-[20px] font-black text-[#111] leading-tight px-2 text-center">
                {config.customHeading || "Complete the steps below to unlock"}
            </h2>
            {config.followDescription && (
                <p className="text-[14px] font-[600] text-[#6B6860] px-2 text-center max-w-[400px]">
                    {config.followDescription}
                </p>
            )}

            {/* Progress Indicator */}
            <div className="w-full max-w-[343px] flex items-center justify-between my-2 relative">
                {config.followTargets.map((target, idx) => {
                    const isCompleted = idx < currentTargetIndex;
                    const isCurrent = idx === currentTargetIndex;

                    return (
                        <div key={target.id} className="flex flex-col items-center relative z-10 gap-1.5" style={{ width: '32px' }}>
                            <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all duration-300
                                ${isCompleted ? 'bg-[#EDFAF3] border-[2px] border-[#166534]' : 
                                  isCurrent ? 'bg-white border-[2px] border-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]' : 
                                  'bg-[#F6F6F6] border-[1.5px] border-[#E8E8E8]'}
                            `}>
                                {isCompleted ? (
                                    <Check size={14} className="text-[#166534]" strokeWidth={4} />
                                ) : (
                                    <span className={`text-[13px] font-[800] ${isCurrent ? 'text-[#2563EB]' : 'text-[#BBBBBB]'}`}>
                                        {idx + 1}
                                    </span>
                                )}
                            </div>
                            <span className="text-[9px] font-[700] text-[#888] truncate w-[50px] text-center">
                                {target.type === 'platform' ? (target.platform || 'Link') : (target.customLabel || 'Link')}
                            </span>
                        </div>
                    );
                })}

                {/* Connecting Lines */}
                {config.followTargets.length > 1 && config.followTargets.map((_, idx) => {
                    if (idx === config.followTargets.length - 1) return null;
                    return (
                        <div 
                            key={`line-${idx}`} 
                            className="absolute h-[1.5px] bg-[#E8E8E8]" 
                            style={{ 
                                top: '16px', 
                                left: `calc(${(idx * 100) / (config.followTargets.length - 1)}% + 16px)`,
                                width: `calc(${100 / (config.followTargets.length - 1)}% - 32px)`
                            }} 
                        />
                    );
                })}
            </div>

            {/* Current Target Action Card */}
            <div className="w-full bg-white rounded-[16px] border-[1.5px] border-[#E8E8E8] p-[20px] shadow-sm relative overflow-hidden flex flex-col items-center">
                <span className="text-[11px] font-[800] text-[#888] uppercase tracking-[0.5px]">Step {currentTargetIndex + 1} of {progress.total}</span>
                
                <h3 className="text-[16px] font-[900] text-[#111] leading-[1.3] text-center mt-1 mb-4">
                    {t.instructionText || (t.type === 'platform' ? `Follow ${t.handle} on ${t.platform}` : 'Visit this link')}
                </h3>

                {t.type === 'platform' ? (
                    <div className="flex flex-col items-center mb-6">
                        <div className={`w-[64px] h-[64px] rounded-full ${getPlatformColor(t.platform)} flex items-center justify-center mb-3 shadow-md`}>
                           {getPlatformIcon(t.platform)}
                        </div>
                        <span className="text-[14px] font-[700] text-[#333]">{t.handle}</span>
                        <span className="text-[11px] text-[#888] truncate max-w-[200px]">{t.profileUrl}</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center mb-6">
                        <div className="text-[48px] mb-3 leading-none">
                            {t.customIcon || '🔗'}
                        </div>
                        <span className="text-[16px] font-[900] text-[#111]">{t.customLabel}</span>
                        <span className="text-[11px] text-[#888] truncate max-w-[250px]">{t.customUrl}</span>
                    </div>
                )}

                <button
                    onClick={handleCtaClick}
                    className={`w-full h-[52px] rounded-[14px] flex items-center justify-center gap-2 font-[900] text-[15px] text-white shadow-sm transition-all
                        ${actionState !== 'idle' ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'}
                        ${t.type === 'platform' ? getPlatformColor(t.platform) : 'bg-[#333333]'}
                    `}
                >
                    {t.type === 'platform' ? (
                        <>Follow on {t.platform}</>
                    ) : (
                        <>🔗 Visit Link {t.customLabel?.substring(0, 20)}...</>
                    )}
                </button>

                {actionState === 'confirming' && (
                    <div className="w-full mt-3 bg-[#EDFAF3] rounded-[12px] p-[14px] flex items-center justify-between animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#166534] flex items-center justify-center text-white shrink-0">
                                <Check size={14} strokeWidth={3} />
                            </div>
                            <span className="text-[14px] font-[700] text-[#166534]">
                                {t.type === 'platform' ? `I followed ${t.handle}` : 'I visited'}
                            </span>
                        </div>
                        <button
                            onClick={handleConfirm}
                            className="h-[36px] px-3 bg-[#166534] text-white rounded-[10px] font-[800] text-[13px] shadow-sm hover:opacity-90 transition-opacity"
                        >
                            Confirm →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
