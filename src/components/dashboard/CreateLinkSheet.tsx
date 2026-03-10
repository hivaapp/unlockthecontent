import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';
import { CustomSponsorForm, type CustomAdData } from '../CustomSponsorForm';
import { ContentBuilder, type ContentData } from '../ContentBuilder';
import { UnlockTypeSelector, type UnlockType } from './UnlockTypeSelector';
import { EmailConfigForm, type EmailConfigData } from './EmailConfigForm';
import { SocialConfigForm, type SocialConfigData } from './SocialConfigForm';
import { AccountabilityConfigForm, type AccountabilityConfigData } from './AccountabilityConfigForm';

interface CreateLinkSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateLinkSheet = ({ isOpen, onClose, onSuccess }: CreateLinkSheetProps) => {
    const [contentData, setContentData] = useState<ContentData>({
        contentMode: 'both',
        textContent: '',
        links: [],
        file: null
    });
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [unlockType, setUnlockType] = useState<UnlockType>('custom_sponsor');
    
    // Config states
    const [customAd, setCustomAd] = useState<CustomAdData | null>(null);
    const [emailConfig, setEmailConfig] = useState<EmailConfigData | null>(null);
    const [socialConfig, setSocialConfig] = useState<SocialConfigData | null>(null);
    const [accountabilityConfig, setAccountabilityConfig] = useState<AccountabilityConfigData | null>(null);
    
    // Error states
    const [hasCustomAdErrors, setHasCustomAdErrors] = useState(true);
    const [hasEmailErrors, setHasEmailErrors] = useState(true);
    const [hasSocialErrors, setHasSocialErrors] = useState(true);
    const [hasAccountabilityErrors, setHasAccountabilityErrors] = useState(true);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const { startProgress, stopProgress } = useProgress();
    const { createLink } = useAuth();

    const handleSubmit = async () => {
        const hasTextContent = contentData.textContent.trim().length > 0 || contentData.links.length > 0;
        const hasContent = unlockType === 'accountability' ? true : (contentData.file || hasTextContent);
        if (!hasContent) return;

        if (unlockType === 'custom_sponsor' && hasCustomAdErrors) {
            window.dispatchEvent(new Event('CUSTOM_SPONSOR_VALIDATE'));
            return;
        }

        setIsSubmitting(true);
        startProgress();

        await createLink({
            title,
            description: desc,
            adCount: 1, // Defaulting to 1 for custom sponsors
            donateEnabled: false, // Removed platform ad feature
            unlockType,
            adSource: unlockType === 'custom_sponsor' ? 'custom' : undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            customAd: unlockType === 'custom_sponsor' ? customAd as any : undefined,
            emailConfig: unlockType === 'email_subscribe' ? emailConfig : undefined,
            socialConfig: unlockType === 'social_follow' ? socialConfig : undefined,
            accountabilityConfig: unlockType === 'accountability' ? accountabilityConfig : undefined,
            contentMode: unlockType === 'accountability' ? undefined : contentData.contentMode,
            fileType: unlockType === 'accountability' ? '' : (contentData.file ? (contentData.file.name.split('.').pop()?.toUpperCase() || 'FILE') : (contentData.contentMode === 'text' ? 'TEXT' : 'BOTH')),
            fileName: unlockType === 'accountability' ? '' : (contentData.file ? contentData.file.name : (contentData.contentMode === 'text' ? 'Text Content' : 'Combined Content')),
        });

        setIsSubmitting(false);
        stopProgress();
        onSuccess();

        // Reset state after slight delay
        setTimeout(() => {
            setContentData({
                contentMode: 'both',
                textContent: '',
                links: [],
                file: null
            });
            setTitle('');
            setDesc('');
        }, 300);
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Create New Link" fullHeight>
            <div className="flex flex-col gap-[20px] pb-[80px]">
                
                {/* Unlock Type Selector */}
                <div className="w-full">
                    <UnlockTypeSelector value={unlockType} onChange={setUnlockType} />
                </div>

                {/* Upload Section */}
                {unlockType === 'accountability' ? (
                    <div className="w-full bg-[#FAF9F7] rounded-[14px] p-4 flex items-center gap-3 border border-[#E6E2D9] h-[64px]">
                        <span className="text-[20px]">🤝</span>
                        <span className="text-[13px] font-[600] text-[#666]">No file needed for Accountability links. The pairing experience itself is what participants receive.</span>
                    </div>
                ) : (
                    <div className="w-full">
                        <ContentBuilder value={contentData} onChange={setContentData} isSheet={true} />
                    </div>
                )}

                {/* Title and Description */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5 relative">
                        <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Resource Title</label>
                        <input
                            type="text"
                            className={`input-field h-[48px] text-[15px] font-bold ${title.length > 50 ? 'border-error/50 focus:border-error focus:ring-error focus:ring-1' : ''}`}
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
                            className={`w-full border border-border rounded-[12px] p-3 text-[14px] font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors h-[80px] resize-none ${desc.length > 140 ? 'border-error/50 focus:border-error focus:ring-error focus:ring-1' : ''}`}
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
                    {unlockType === 'accountability' && (
                        <AccountabilityConfigForm
                            value={accountabilityConfig}
                            onChange={setAccountabilityConfig}
                            onErrorStateChange={setHasAccountabilityErrors}
                        />
                    )}
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-border/60 p-4 pb-[env(safe-area-inset-bottom,16px)] sm:absolute z-20">
                <button
                    onClick={handleSubmit}
                    disabled={
                        (!title || isSubmitting) || 
                        (unlockType !== 'accountability' && !(contentData.file || contentData.textContent.trim().length > 0 || contentData.links.length > 0)) ||
                        (unlockType === 'custom_sponsor' && hasCustomAdErrors) ||
                        (unlockType === 'email_subscribe' && hasEmailErrors) ||
                        (unlockType === 'social_follow' && hasSocialErrors) ||
                        (unlockType === 'accountability' && hasAccountabilityErrors)
                    }
                    className="btn-primary w-full h-[52px] border-none bg-brand text-white font-[800] rounded-[14px] text-[16px] hover:bg-brandHover disabled:opacity-50 disabled:grayscale-[50%]"
                >
                    {isSubmitting ? (
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                        'Generate Link'
                    )}
                </button>
            </div>
        </BottomSheet>
    );
};
