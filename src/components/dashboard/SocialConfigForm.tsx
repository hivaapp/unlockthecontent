import { useState, useEffect } from 'react';
import { X, Menu } from 'lucide-react';

export interface SocialFollowTarget {
    id: string;
    type: 'platform' | 'custom';
    platform: 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'linkedin' | 'twitch' | 'discord' | 'telegram' | 'threads' | 'bluesky' | null;
    handle: string | null;
    profileUrl: string | null;
    customLabel: string | null;
    customUrl: string | null;
    customIcon: string | null;
    instructionText: string | null;
}

export interface SocialConfigData {
    followTargets: SocialFollowTarget[];
    customHeading: string;
    followDescription: string;
    totalFollows?: number;
    thisMonthFollows?: number;
}

interface SocialConfigFormProps {
    value: SocialConfigData | null;
    onChange: (data: SocialConfigData) => void;
    onErrorStateChange: (hasErrors: boolean) => void;
}

const PLATFORMS = [
    { id: 'instagram', label: 'Instagram', icon: '📸' },
    { id: 'twitter', label: 'Twitter', icon: '🐦' },
    { id: 'tiktok', label: 'TikTok', icon: '📱' },
    { id: 'youtube', label: 'YouTube', icon: '▶️' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { id: 'twitch', label: 'Twitch', icon: '📺' },
    { id: 'discord', label: 'Discord', icon: '💬' },
    { id: 'telegram', label: 'Telegram', icon: '✈️' },
    { id: 'threads', label: 'Threads', icon: '🧵' },
    { id: 'bluesky', label: 'Bluesky', icon: '🦋' }
] as const;

export const SocialConfigForm = ({ value, onChange, onErrorStateChange }: SocialConfigFormProps) => {
    const [data, setData] = useState<SocialConfigData>(value || {
        followTargets: [],
        customHeading: '',
        followDescription: ''
    });

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingTargetId, setEditingTargetId] = useState<string | null>(null);

    // Track targets state separately if needed, to perform drag drop, but let's keep it in data
    const targets = data.followTargets;

    useEffect(() => {
        let hasErrors = false;
        
        if (!data.customHeading || !data.followDescription || targets.length === 0) {
            hasErrors = true;
        }

        // Deep validation of targets
        for (const t of targets) {
            if (t.type === 'platform') {
                if (!t.platform || !t.handle || !t.profileUrl || !t.profileUrl.startsWith('https://')) {
                    hasErrors = true;
                    break;
                }
            } else {
                if (!t.customIcon || !t.customLabel || !t.customUrl || !t.customUrl.startsWith('https://')) {
                    hasErrors = true;
                    break;
                }
            }
        }

        onErrorStateChange(hasErrors);
        onChange(data);
    }, [data, targets]);

    const handleChange = <K extends keyof SocialConfigData>(field: K, val: SocialConfigData[K]) => {
        setData(prev => ({ ...prev, [field]: val }));
    };

    const updateTarget = (id: string, updates: Partial<SocialFollowTarget>) => {
        setData(prev => ({
            ...prev,
            followTargets: prev.followTargets.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
    };

    const removeTarget = (id: string) => {
        setData(prev => ({
            ...prev,
            followTargets: prev.followTargets.filter(t => t.id !== id)
        }));
        if (editingTargetId === id) setEditingTargetId(null);
    };

    const addTarget = (type: 'platform' | 'custom', platformId?: any) => {
        const newTarget: SocialFollowTarget = {
            id: 'target_' + Math.random().toString(36).substr(2, 9),
            type,
            platform: type === 'platform' ? platformId : null,
            handle: '',
            profileUrl: '',
            customLabel: type === 'custom' ? '' : null,
            customUrl: type === 'custom' ? '' : null,
            customIcon: type === 'custom' ? '🔗' : null,
            instructionText: ''
        };
        setData(prev => ({
            ...prev,
            followTargets: [...prev.followTargets, newTarget]
        }));
        setIsSheetOpen(false);
        setEditingTargetId(newTarget.id);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('sourceIndex', index.toString());
    };

    const handleDrop = (e: React.DragEvent, destIndex: number) => {
        const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'), 10);
        if (sourceIndex === destIndex) return;
        const newTargets = [...targets];
        const [moved] = newTargets.splice(sourceIndex, 1);
        newTargets.splice(destIndex, 0, moved);
        setData(prev => ({ ...prev, followTargets: newTargets }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-top-2 duration-300 relative">
            <h4 className="text-[13px] font-[900] text-[#111] mb-4">Social Follow Setup</h4>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[12px] font-[700] text-[#6B6860]">Custom Heading</label>
                    <input
                        type="text"
                        className="w-full h-[44px] rounded-[6px] border border-[#E6E2D9] px-3 text-[14px] focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
                        placeholder="e.g. Follow me for daily Figma tips and free resources"
                        maxLength={60}
                        value={data.customHeading}
                        onChange={(e) => handleChange('customHeading', e.target.value)}
                    />
                    <span className="text-[11px] text-[#AAA49C] text-right">{data.customHeading.length}/60</span>
                    {data.customHeading && (
                        <div className="bg-[#FAF9F7] p-3 rounded-[6px] mt-1 flex flex-col gap-1 border border-[#E6E2D9]">
                            <span className="text-[11px] font-[600] text-[#6B6860]">Viewers will see:</span>
                            <span className="text-[18px] font-[900] text-[#21201C]">{data.customHeading}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[12px] font-[700] text-[#6B6860]">Follow Description</label>
                    <textarea
                        className="w-full h-[70px] rounded-[6px] border border-[#E6E2D9] p-3 text-[14px] resize-none focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
                        placeholder="Tell viewers what content you post and why following you is worth it."
                        maxLength={120}
                        value={data.followDescription}
                        onChange={(e) => handleChange('followDescription', e.target.value)}
                    />
                    <span className="text-[11px] text-[#AAA49C] text-right">{data.followDescription.length}/120</span>
                </div>
            </div>

            <div className="w-full h-px bg-[#F0F0F0] my-4" />

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-[800] text-[#111]">Accounts to follow</h4>
                    <span className="text-[12px] font-[700] text-[#AAA49C]">{targets.length} of 6</span>
                </div>

                {targets.length === 0 && (
                    <div className="p-3 border border-red-300 rounded-[6px] bg-red-50 text-red-600 text-[12px] font-bold">
                        Add at least one account to follow
                    </div>
                )}

                <div className="flex flex-col gap-[10px]">
                    {targets.map((target, idx) => {
                        const isEditing = editingTargetId === target.id;
                        const pInfo = target.type === 'platform' ? PLATFORMS.find(p => p.id === target.platform) : null;
                        
                        return (
                            <div 
                                key={target.id} 
                                className="bg-[#FAFAFA] border-[1.5px] border-[#E8E8E8] rounded-[12px] p-[14px] flex flex-col"
                                draggable
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, idx)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center bg-[#F6F6F6]">
                                            <span className="text-[20px] leading-none">
                                                {target.type === 'platform' ? pInfo?.icon : target.customIcon}
                                            </span>
                                        </div>
                                        <span className="text-[13px] font-[800] text-[#333]">
                                            {target.type === 'platform' ? pInfo?.label : target.customLabel || 'Custom Link'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="cursor-grab hover:bg-[#E8E8E8] rounded flex items-center justify-center w-[32px] h-[32px] transition-colors">
                                            <Menu size={16} className="text-[#CCCCCC]" />
                                        </div>
                                        <button onClick={() => removeTarget(target.id)} className="w-[32px] h-[32px] flex items-center justify-center text-[#BBBBBB] hover:bg-[#E8E8E8] hover:text-[#333] rounded transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-1 flex flex-col">
                                    {target.type === 'platform' ? (
                                        <>
                                            <span className="text-[13px] font-[600] text-[#555]">{target.handle || 'No handle set'}</span>
                                            <span className="text-[11px] text-[#AAAAAA] truncate w-full max-w-[250px]">{target.profileUrl || 'No URL set'}</span>
                                        </>
                                    ) : (
                                        <span className="text-[11px] text-[#AAAAAA] truncate w-full max-w-[250px]">{target.customUrl || 'No URL set'}</span>
                                    )}
                                    {target.instructionText && (
                                        <span className="text-[11px] font-[600] text-[#888] italic mt-1">{target.instructionText}</span>
                                    )}
                                </div>

                                {!isEditing && (
                                    <div className="flex justify-end mt-2">
                                        <button onClick={() => setEditingTargetId(target.id)} className="text-[12px] font-[700] text-blue-600">
                                            Edit
                                        </button>
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="mt-4 pt-4 border-t border-[#E8E8E8] flex flex-col gap-4 animate-in slide-in-from-top-2">
                                        {target.type === 'platform' ? (
                                            <>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {PLATFORMS.map(p => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => updateTarget(target.id, { platform: p.id as any })}
                                                            className={`h-[52px] rounded-[10px] flex items-center justify-center gap-1.5 transition-all outline-none border-[1.5px] ${target.platform === p.id 
                                                                ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]' 
                                                                : 'bg-white border-[#E8E8E8] text-[#111]'}`}
                                                        >
                                                            <span className="text-[16px]">{p.icon}</span>
                                                            <span className="text-[11px] font-[700] truncate">{p.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <input
                                                    className="w-full h-[44px] rounded-[6px] border border-[#E6E2D9] px-3 text-[14px]"
                                                    placeholder="@handle"
                                                    value={target.handle || ''}
                                                    onChange={e => updateTarget(target.id, { handle: e.target.value })}
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        className="flex-1 h-[44px] rounded-[6px] border border-[#E6E2D9] px-3 text-[14px]"
                                                        placeholder="https://..."
                                                        value={target.profileUrl || ''}
                                                        onChange={e => updateTarget(target.id, { profileUrl: e.target.value })}
                                                    />
                                                    <button 
                                                        onClick={() => { if (target.profileUrl?.startsWith('https://')) window.open(target.profileUrl, '_blank') }}
                                                        className="h-[44px] px-3 border border-[#E8E8E8] rounded-[6px] text-[13px] font-[700]"
                                                    >Test Link</button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[12px] font-[700] text-[#aaa]">Icon</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['🔗', '💬', '📣', '🎮', '🎵', '📱', '🌐', '✉️'].map(emoji => (
                                                            <button 
                                                                key={emoji}
                                                                onClick={() => updateTarget(target.id, { customIcon: emoji })}
                                                                className={`w-[36px] h-[36px] flex items-center justify-center rounded-[8px] bg-white border ${target.customIcon === emoji ? 'border-blue-500 bg-blue-50' : 'border-[#E8E8E8]'}`}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                        <input 
                                                            className="w-[36px] h-[36px] rounded-[8px] border border-[#E8E8E8] text-center"
                                                            value={target.customIcon || ''}
                                                            onChange={e => updateTarget(target.id, { customIcon: e.target.value })}
                                                            maxLength={2}
                                                        />
                                                    </div>
                                                </div>
                                                <input
                                                    className="w-full h-[44px] rounded-[6px] border border-[#E6E2D9] px-3 text-[14px]"
                                                    placeholder="Link label shown to viewer"
                                                    maxLength={50}
                                                    value={target.customLabel || ''}
                                                    onChange={e => updateTarget(target.id, { customLabel: e.target.value })}
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        className="flex-1 h-[44px] rounded-[6px] border border-[#E6E2D9] px-3 text-[14px]"
                                                        placeholder="URL (https://...)"
                                                        value={target.customUrl || ''}
                                                        onChange={e => updateTarget(target.id, { customUrl: e.target.value })}
                                                    />
                                                    <button 
                                                        onClick={() => { if (target.customUrl?.startsWith('https://')) window.open(target.customUrl, '_blank') }}
                                                        className="h-[44px] px-3 border border-[#E8E8E8] rounded-[6px] text-[13px] font-[700]"
                                                    >Test Link</button>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex flex-col gap-1.5">
                                            <input
                                                className="w-full h-[44px] rounded-[6px] border border-[#E6E2D9] px-3 text-[14px]"
                                                placeholder="Per-target instruction (optional)"
                                                maxLength={60}
                                                value={target.instructionText || ''}
                                                onChange={e => updateTarget(target.id, { instructionText: e.target.value })}
                                            />
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setEditingTargetId(null)} className="flex-1 h-[36px] bg-[#2563EB] text-white rounded-[6px] font-[700] text-[13px]">
                                                Save
                                            </button>
                                            <button onClick={() => setEditingTargetId(null)} className="text-[12px] font-[700] text-[#888]">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <button
                    onClick={() => setIsSheetOpen(true)}
                    disabled={targets.length >= 6}
                    className="w-full h-[44px] border-[1.5px] border-dashed border-[#D1D5DB] rounded-[12px] bg-[#FAFAFA] text-[#888] font-[700] text-[14px] flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-50 mt-1"
                >
                    ＋ Add another account or link
                </button>
            </div>

            {/* Local Add Target Sheet */}
            {isSheetOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                    <div className="absolute inset-0 bg-text/40 backdrop-blur-sm transition-opacity opacity-100" onClick={() => setIsSheetOpen(false)} />
                    <div className="relative w-full sm:w-[500px] sm:mx-auto bg-white rounded-t-[20px] h-[320px] shadow-2xl animate-in slide-in-from-bottom-full duration-[300ms] flex flex-col items-center">
                        <div className="w-full flex items-center justify-between px-4 pb-4 pt-1 sm:pt-4 flex-shrink-0 bg-white border-b border-border/50">
                            <div className="w-9" />
                            <h2 className="text-[15px] font-[900] text-[#111] m-0">Add a follow target</h2>
                            <button onClick={() => setIsSheetOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-surfaceAlt text-textMid">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto w-full p-4 relative bg-white pb-[32px]">
                            <span className="text-[11px] font-[800] text-[#AAA49C] uppercase tracking-wider">Social platforms</span>
                            <div className="grid grid-cols-3 gap-2 mt-2 mb-4">
                                {PLATFORMS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addTarget('platform', p.id)}
                                        className="h-[52px] rounded-[10px] flex items-center justify-center gap-1.5 transition-all outline-none border border-[#E8E8E8] hover:border-[#BBBBBB] bg-white text-[#111]"
                                    >
                                        <span className="text-[16px]">{p.icon}</span>
                                        <span className="text-[11px] font-[700] truncate">{p.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="w-full h-px bg-[#F0F0F0] my-4" />
                            <span className="text-[11px] font-[800] text-[#AAA49C] uppercase tracking-wider">Custom link</span>
                            <button
                                onClick={() => addTarget('custom')}
                                className="w-full mt-2 h-[52px] rounded-[10px] flex flex-col items-center justify-center transition-all outline-none bg-[#F6F6F6] hover:bg-[#E8E8E8]"
                            >
                                <span className="text-[14px] font-[700] text-[#555]">🔗 Custom link</span>
                                <span className="text-[11px] text-[#AAA49C]">Any URL with a custom label and icon</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
