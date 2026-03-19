import { useState, useEffect, useRef } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';
import { createLink } from '../../services/linksService';
import { CustomSponsorForm, type CustomAdData } from '../CustomSponsorForm';
import { ContentBuilder, type ContentData } from '../ContentBuilder';
import { UnlockTypeSelector, type UnlockType } from './UnlockTypeSelector';
import { EmailConfigForm, type EmailConfigData } from './EmailConfigForm';
import { SocialConfigForm, type SocialConfigData } from './SocialConfigForm';
import { FollowerPairingConfigForm, type FollowerPairingConfigData } from './FollowerPairingConfigForm';
import { useToast } from '../../context/ToastContext';

interface CreateLinkSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const INITIAL_CONTENT: ContentData = {
    contentMode: 'both',
    textContent: '',
    links: [],
    file: null,
    fileId: null,
    isUploading: false,
    uploadProgress: 0,
    uploadError: null,
};

export const CreateLinkSheet = ({ isOpen, onClose, onSuccess }: CreateLinkSheetProps) => {
    const [contentData, setContentData] = useState<ContentData>(INITIAL_CONTENT);
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [unlockType, setUnlockType] = useState<UnlockType>('custom_sponsor');
    
    // Config states
    const [customAd, setCustomAd] = useState<CustomAdData | null>(null);
    const [emailConfig, setEmailConfig] = useState<EmailConfigData | null>(null);
    const [socialConfig, setSocialConfig] = useState<SocialConfigData | null>(null);
    const [followerPairingConfig, setFollowerPairingConfig] = useState<FollowerPairingConfigData | null>(null);
    
    // Error states
    const [hasCustomAdErrors, setHasCustomAdErrors] = useState(true);
    const [hasEmailErrors, setHasEmailErrors] = useState(true);
    const [hasSocialErrors, setHasSocialErrors] = useState(true);
    const [hasFollowerPairingErrors, setHasFollowerPairingErrors] = useState(true);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const { startProgress, stopProgress } = useProgress();
    const { currentUser, refreshProfile } = useAuth();
    const { showToast } = useToast();

    // Reset ALL form state when sheet opens fresh
    const prevOpen = useRef(false);
    useEffect(() => {
        if (isOpen && !prevOpen.current) {
            // Sheet just opened — reset everything
            setContentData(INITIAL_CONTENT);
            setTitle('');
            setDesc('');
            setUnlockType('custom_sponsor');
            setCustomAd(null);
            setEmailConfig(null);
            setSocialConfig(null);
            setFollowerPairingConfig(null);
            setHasCustomAdErrors(true);
            setHasEmailErrors(true);
            setHasSocialErrors(true);
            setHasFollowerPairingErrors(true);
            setIsSubmitting(false);
        }
        prevOpen.current = isOpen;
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!currentUser?.id) return;
        const hasTextContent = contentData.textContent.trim().length > 0 || contentData.links.length > 0 || !!contentData.youtubeUrl;
        const hasContent = unlockType === 'follower_pairing' ? true : (contentData.file || hasTextContent);
        if (!hasContent) return;

        if (unlockType === 'custom_sponsor' && hasCustomAdErrors) {
            window.dispatchEvent(new Event('CUSTOM_SPONSOR_VALIDATE'));
            return;
        }

        setIsSubmitting(true);
        startProgress();

        try {
            // File is already uploaded by ContentBuilder — use fileId directly
            const finalFileId = contentData.fileId || null;

            // Block Generate if file was selected but upload hasn't completed
            if (contentData.file && !finalFileId) {
                if (contentData.isUploading) {
                    showToast({ message: 'Please wait for the file upload to complete', type: 'error' });
                } else if (contentData.uploadError) {
                    showToast({ message: 'File upload failed. Please retry or remove the file.', type: 'error' });
                }
                setIsSubmitting(false);
                stopProgress();
                return;
            }

            const mode = unlockType === 'follower_pairing' ? 'follower_pairing' : 'lock_content';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const linkData: Record<string, any> = {
                title,
                description: desc,
                mode,
                unlockType: mode === 'lock_content' ? unlockType : undefined,
                fileId: finalFileId,
                youtubeUrl: unlockType === 'follower_pairing' ? null : (contentData.youtubeUrl || null),
                donateEnabled: false,
            };

            // Attach type-specific config
            if (mode === 'lock_content') {
                if (unlockType === 'email_subscribe' && emailConfig) {
                    // Build unlock text from content builder's text
                    const unlockTextParts: string[] = [];
                    if (contentData.textContent.trim()) {
                        unlockTextParts.push(contentData.textContent.trim());
                    }
                    const unlockText = unlockTextParts.length > 0 ? unlockTextParts.join('\n\n') : null;
                    
                    // Use first external link as unlock_url
                    const unlockUrl = contentData.links.length > 0 ? contentData.links[0].url : null;
                    
                    linkData.emailConfig = {
                        newsletterName: emailConfig.newsletterName,
                        newsletterDescription: emailConfig.newsletterDescription || null,
                        incentiveText: emailConfig.incentiveText || null,
                        confirmationMessage: emailConfig.confirmationMessage || null,
                        unlockText: unlockText,
                        unlockUrl: unlockUrl,
                        platform: emailConfig.platform || 'direct',
                    };
                }
                if (unlockType === 'social_follow' && socialConfig) {
                    // Build unlock text from content builder's text — same as email subscribe
                    const socialUnlockTextParts: string[] = [];
                    if (contentData.textContent.trim()) {
                        socialUnlockTextParts.push(contentData.textContent.trim());
                    }
                    const socialUnlockText = socialUnlockTextParts.length > 0 ? socialUnlockTextParts.join('\n\n') : null;

                    // Use first external link as unlock_url — same as email subscribe
                    const socialUnlockUrl = contentData.links.length > 0 ? contentData.links[0].url : null;

                    linkData.socialConfig = {
                        customHeading: socialConfig.customHeading || null,
                        followDescription: socialConfig.followDescription || null,
                        unlockText: socialUnlockText,
                        unlockUrl: socialUnlockUrl,
                        followTargets: socialConfig.followTargets?.map((t: any) => ({
                            type: t.type || 'platform',
                            platform: t.platform,
                            handle: t.handle,
                            profileUrl: t.profileUrl,
                            customLabel: t.customLabel,
                            customUrl: t.customUrl,
                            instructionText: t.instructionText,
                        })) || [],
                    };
                }
                if (unlockType === 'custom_sponsor' && customAd) {
                    // Build unlock text from content builder's text
                    const sponsorUnlockTextParts: string[] = [];
                    if (contentData.textContent.trim()) {
                        sponsorUnlockTextParts.push(contentData.textContent.trim());
                    }
                    const sponsorUnlockText = sponsorUnlockTextParts.length > 0 ? sponsorUnlockTextParts.join('\n\n') : null;
                    const sponsorUnlockUrl = contentData.links.length > 0 ? contentData.links[0].url : null;

                    linkData.sponsorConfig = {
                        brandName: customAd.brandName || '',
                        brandWebsite: customAd.redirectUrl || null,
                        ctaButtonLabel: customAd.ctaText || 'Visit Sponsor',
                        videoFileId: (customAd as any).fileId || null,
                        requiresClick: !!(customAd.redirectUrl),
                        skipAfterSeconds: customAd.skipAfter || 5,
                        unlockText: sponsorUnlockText,
                        unlockUrl: sponsorUnlockUrl,
                    };
                }
            }

            if (mode === 'follower_pairing' && followerPairingConfig) {
                linkData.pairingConfig = {
                    topic: followerPairingConfig.topic,
                    description: followerPairingConfig.description || null,
                    commitmentPrompt: followerPairingConfig.commitmentPrompt,
                    durationDays: followerPairingConfig.durationDays,
                    checkInFrequency: followerPairingConfig.checkInFrequency || 'daily',
                    scheduledMessages: followerPairingConfig.scheduledMessages?.map((m: any) => ({
                        dayNumber: m.dayNumber,
                        sendTime: m.sendTime || '09:00:00',
                        content: m.content,
                        links: m.links || [],
                        youtubeUrl: m.youtubeUrl || null,
                        isSent: m.isSent || false,
                    })) || [],
                    completionAsset: (followerPairingConfig.completionAsset?.enabled && (followerPairingConfig.completionAsset?.fileName || followerPairingConfig.completionAsset?.youtubeUrl || (followerPairingConfig.completionAsset?.links?.length || 0) > 0)) ? {
                        fileId: (followerPairingConfig.completionAsset as any).fileId || null,
                        unlockMessage: followerPairingConfig.completionAsset.unlockMessage || null,
                        links: followerPairingConfig.completionAsset.links || [],
                        youtubeUrl: followerPairingConfig.completionAsset.youtubeUrl || null,
                        resourceTitle: title || null,
                        resourceDescription: desc || null,
                    } : null,
                };
            }

            await createLink(currentUser.id, linkData);
            await refreshProfile();

            stopProgress();
            onSuccess();

            // Reset all state after slight delay for animation
            setTimeout(() => {
                setContentData(INITIAL_CONTENT);
                setTitle('');
                setDesc('');
                setUnlockType('custom_sponsor');
                setCustomAd(null);
                setEmailConfig(null);
                setSocialConfig(null);
                setFollowerPairingConfig(null);
                setHasCustomAdErrors(true);
                setHasEmailErrors(true);
                setHasSocialErrors(true);
                setHasFollowerPairingErrors(true);
            }, 300);
        } catch (err: any) {
            stopProgress();
            if (err.message?.includes('Free plan') || err.message?.includes('Pro plan')) {
                showToast({ message: err.message, type: 'error' });
            } else {
                showToast({ message: err.message || 'Failed to create link', type: 'error' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateButton = (
        <button
            onClick={handleSubmit}
            disabled={
                (!title || isSubmitting) || 
                (unlockType !== 'follower_pairing' && !(contentData.file || contentData.textContent.trim().length > 0 || contentData.links.length > 0 || contentData.youtubeUrl)) ||
                (unlockType === 'custom_sponsor' && hasCustomAdErrors) ||
                (unlockType === 'email_subscribe' && hasEmailErrors) ||
                (unlockType === 'social_follow' && hasSocialErrors) ||
                (unlockType === 'follower_pairing' && hasFollowerPairingErrors) ||
                (contentData.isUploading === true)
            }
            className="btn-primary w-full h-[52px] border-none bg-brand text-white font-[800] rounded-[14px] text-[16px] hover:bg-brandHover disabled:opacity-50 disabled:grayscale-[50%]"
        >
            {isSubmitting ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
                'Generate Link'
            )}
        </button>
    );

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Create New Link" fullHeight footer={generateButton}>
            <div className="flex flex-col gap-[20px]">
                
                {/* Section A - File / Info */}
                {unlockType === 'follower_pairing' ? (
                    <div className="w-full bg-[#FFFBEB] rounded-[10px] p-[12px] border border-[#FDE68A] h-auto flex flex-col justify-center animate-in slide-in-from-top-2 fade-in duration-200">
                        <span className="text-[12px] font-[700] text-[#92400E]">🤝 No file needed for Follower Pairing. Your followers pair up and support each other.</span>
                    </div>
                ) : (
                    <div className="w-full">
                        <ContentBuilder value={contentData} onChange={setContentData} isSheet={true} />
                    </div>
                )}

                {/* Section B - Mode Switch */}
                <div className="flex flex-col gap-2 relative z-10 w-full mt-[-8px]">
                    <div className="w-full flex items-center p-1 border-[1.5px] border-[#E8E8E8] rounded-[12px] h-[52px] bg-white mx-auto shadow-sm">
                        <button
                            onClick={() => { if (unlockType === 'follower_pairing') setUnlockType('custom_sponsor'); }}
                            className={`flex-1 flex items-center justify-center gap-[8px] h-[44px] rounded-[10px] transition-all duration-200 ${unlockType !== 'follower_pairing' ? 'bg-[#111] text-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]' : 'bg-transparent text-[#666]'}`}
                        >
                            <span className="text-[16px]">🔒</span>
                            <span className="text-[14px] font-[800]">Lock</span>
                        </button>
                        <button
                            onClick={() => setUnlockType('follower_pairing')}
                            className={`flex-1 flex items-center justify-center gap-[8px] h-[44px] rounded-[10px] transition-all duration-200 ${unlockType === 'follower_pairing' ? 'bg-[#111] text-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]' : 'bg-transparent text-[#666]'}`}
                        >
                            <span className="text-[16px]">🤝</span>
                            <span className="text-[14px] font-[800]">Pairing</span>
                        </button>
                    </div>
                </div>

                {/* Section C - Config */}
                <div className="w-full mt-2">
                    {unlockType !== 'follower_pairing' && (
                        <div className="mb-6">
                            <UnlockTypeSelector value={unlockType} onChange={setUnlockType} />
                        </div>
                    )}
                </div>

                {/* Title and Description - Hidden for follower pairing as they are handled inside FollowerPairingConfigForm relative to reward toggle */}
                {unlockType !== 'follower_pairing' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5 relative">
                            <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Resource Title</label>
                            <input
                                type="text"
                                className={`input-field h-[48px] text-[16px] font-bold ${title.length > 50 ? 'border-error/50 focus:border-error focus:ring-error focus:ring-1' : ''}`}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={60}
                                placeholder="e.g. Figma UI Kit - 2026 Edition"
                            />
                            <span className={`absolute bottom-3 right-3 text-[11px] font-bold ${title.length >= 50 ? 'text-error' : 'text-textLight'}`}>
                                {title.length}/60
                            </span>
                        </div>

                        <div className="flex flex-col gap-1.5 relative">
                            <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Description <span className="text-textLight font-semibold capitalize tracking-normal">(optional)</span></label>
                            <textarea
                                className={`w-full border border-border rounded-[12px] p-3 text-[16px] font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors h-[80px] resize-none ${desc.length > 140 ? 'border-error/50 focus:border-error focus:ring-error focus:ring-1' : ''}`}
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                maxLength={150}
                                placeholder="Add a short description so users know what they are unlocking..."
                            />
                            <span className={`absolute bottom-3 right-3 text-[11px] font-bold ${desc.length >= 140 ? 'text-error' : 'text-textLight'}`}>
                                {desc.length}/150
                            </span>
                        </div>
                    </div>
                )}

                {/* Specific Config Forms */}
                <div className="flex flex-col gap-3">
                    {unlockType === 'custom_sponsor' && (
                        <CustomSponsorForm
                            value={customAd}
                            onChange={setCustomAd}
                            onErrorStateChange={setHasCustomAdErrors}
                        />
                    )}
                    {unlockType === 'email_subscribe' && (
                        <EmailConfigForm
                            value={emailConfig}
                            onChange={setEmailConfig}
                            onErrorStateChange={setHasEmailErrors}
                        />
                    )}
                    {unlockType === 'social_follow' && (
                        <SocialConfigForm
                            value={socialConfig}
                            onChange={setSocialConfig}
                            onErrorStateChange={setHasSocialErrors}
                        />
                    )}
                    {unlockType === 'follower_pairing' && (
                        <FollowerPairingConfigForm
                            value={followerPairingConfig}
                            onChange={setFollowerPairingConfig}
                            onErrorStateChange={setHasFollowerPairingErrors}
                            resourceTitle={title}
                            setResourceTitle={setTitle}
                            resourceDescription={desc}
                            setResourceDescription={setDesc}
                        />
                    )}
                </div>
            </div>
        </BottomSheet>
    );
};
