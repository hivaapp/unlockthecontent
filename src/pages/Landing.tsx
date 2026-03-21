import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link as LinkIcon, Lock, Check, Loader2, Star, Settings, X } from 'lucide-react';

import { AuthBottomSheet } from '../components/AuthBottomSheet';
import { setContentFile, setSponsorVideo } from '../stores/pendingFileStore';
import { supabase } from '../lib/supabase';
import { createLink } from '../services/linksService';
import { CustomSponsorForm, type CustomAdData } from '../components/CustomSponsorForm';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ContentBuilder, type ContentData } from '../components/ContentBuilder';
import { UnlockTypeSelector, type UnlockType } from '../components/dashboard/UnlockTypeSelector';
import { EmailConfigForm, type EmailConfigData } from '../components/dashboard/EmailConfigForm';
import { SocialConfigForm, type SocialConfigData } from '../components/dashboard/SocialConfigForm';
import { FollowerPairingConfigForm, type FollowerPairingConfigData } from '../components/dashboard/FollowerPairingConfigForm';
import { BelowTheFold } from '../components/landing/BelowTheFold';





export const Landing = () => {
    const { isLoggedIn, currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isAuthOpen, setIsAuthOpen] = useState(
        searchParams.get('signIn') === 'true' || 
        searchParams.get('signUp') === 'true' || 
        searchParams.get('forgot') === 'true'
    );
    const [authDefaultScreen] = useState<'signin' | 'signup' | 'forgot'>(
        searchParams.get('signUp') === 'true' ? 'signup' : 
        searchParams.get('forgot') === 'true' ? 'forgot' : 'signin'
    );
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);

    const stripeProLink = import.meta.env.VITE_STRIPE_PRO_LINK || 'https://buy.stripe.com/test_00weVfdKm42Agwj4QafIs00';

    // Content state
    const [contentData, setContentData] = useState<ContentData>({
        contentMode: 'file',
        textContent: '',
        links: [],
        file: null
    });

    const [customAd, setCustomAd] = useState<CustomAdData | null>(null);
    const [hasCustomAdErrors, setHasCustomAdErrors] = useState(true);

    const [unlockType, setUnlockType] = useState<UnlockType>('custom_sponsor');
    const [emailConfig, setEmailConfig] = useState<EmailConfigData | null>(null);
    const [socialConfig, setSocialConfig] = useState<SocialConfigData | null>(null);
    const [followerPairingConfig, setFollowerPairingConfig] = useState<FollowerPairingConfigData | null>(null);
    
    const [hasEmailErrors, setHasEmailErrors] = useState(true);
    const [hasSocialErrors, setHasSocialErrors] = useState(true);
    const [hasFollowerPairingErrors, setHasFollowerPairingErrors] = useState(true);

    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');

    // Generate state
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const linkRevealed = isLoggedIn && isGenerated;

    const [generatedSlug, setGeneratedSlug] = useState('freeresource');
    const [isCopied, setIsCopied] = useState(false);




    // Mobile UI state
    const [isConfigExpanded, setIsConfigExpanded] = useState(false);
    const [hasPulsed, setHasPulsed] = useState(false);
    const [hasConfiguredAdSetup, setHasConfiguredAdSetup] = useState(false);
    const outputCardRef = useRef<HTMLDivElement>(null);
    const generationAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isGenerated && outputCardRef.current) {
            outputCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [isGenerated]);

    useEffect(() => {
        const hasTextContent = contentData.textContent.trim().length > 0 || contentData.links.length > 0;
        const hasContent = unlockType === 'follower_pairing' ? true : (contentData.file || hasTextContent);
        if (hasContent && !hasPulsed && !hasConfiguredAdSetup) {
            const timer = setTimeout(() => {
                if (!hasConfiguredAdSetup) setHasPulsed(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [contentData, hasPulsed, hasConfiguredAdSetup, unlockType]);

    useEffect(() => {
        if (hasPulsed) {
            const timer = setTimeout(() => setHasPulsed(false), 600);
            return () => clearTimeout(timer);
        }
    }, [hasPulsed]);

    const handleAdSetupApply = () => {
        setHasConfiguredAdSetup(true);
        setHasPulsed(false);
        setIsConfigExpanded(false);

        setTimeout(() => {
            generationAreaRef.current?.scrollIntoView({ 
                behavior: "smooth", 
                block: "start" 
            });
        }, 220);
    };

    const handleGenerate = async () => {
        const hasTextContent = contentData.textContent.trim().length > 0 || contentData.links.length > 0;
        const hasContent = unlockType === 'follower_pairing' ? true : (contentData.file || hasTextContent);
        if (!hasContent) return;

        if (unlockType === 'custom_sponsor' && hasCustomAdErrors) {
            window.dispatchEvent(new Event('CUSTOM_SPONSOR_VALIDATE'));
            alert("Please complete your sponsor details before generating.");
            return;
        }

        if (!isLoggedIn || !currentUser) {
            setIsGenerating(true);
            setTimeout(() => {
                const resolvedTitle = title || (contentData.file ? contentData.file.name : (contentData.links[0]?.title || 'My Link'));

                // Helper: convert empty strings to null
                const s = (v: any): string | null => (typeof v === 'string' && v.trim() !== '') ? v : null;

                // Build default configs for types that haven't been explicitly configured.
                const resolvedEmailConfig = unlockType === 'email_subscribe'
                    ? {
                        newsletterName: emailConfig?.newsletterName || resolvedTitle,
                        newsletterDescription: s(emailConfig?.newsletterDescription) ?? null,
                        incentiveText: s(emailConfig?.incentiveText) ?? null,
                        confirmationMessage: s(emailConfig?.confirmationMessage) ?? null,
                        platform: emailConfig?.platform || 'direct',
                        platformDisplayName: s(emailConfig?.platformDisplayName) ?? null,
                        unlockText: s((emailConfig as any)?.unlockText) ?? null,
                        unlockUrl: s((emailConfig as any)?.unlockUrl) ?? null,
                        unlockUrlLabel: s((emailConfig as any)?.unlockUrlLabel) ?? null,
                    }
                    : null;

                const resolvedSocialConfig = unlockType === 'social_follow'
                    ? {
                        customHeading: s(socialConfig?.customHeading) ?? null,
                        followDescription: s(socialConfig?.followDescription) ?? null,
                        unlockText: s((socialConfig as any)?.unlockText) ?? null,
                        unlockUrl: s((socialConfig as any)?.unlockUrl) ?? null,
                        unlockUrlLabel: s((socialConfig as any)?.unlockUrlLabel) ?? null,
                        followTargets: (socialConfig?.followTargets || []).map((t: any, i: number) => ({
                            type: t.type || 'platform',
                            platform: s(t.platform) ?? null,
                            handle: s(t.handle) ?? null,
                            profileUrl: s(t.profileUrl) ?? null,
                            customLabel: s(t.customLabel) ?? null,
                            customUrl: s(t.customUrl) ?? null,
                            customIcon: s(t.customIcon) ?? null,
                            instructionText: s(t.instructionText) ?? null,
                            sortOrder: i,
                        })),
                    }
                    : null;

                const resolvedSponsorConfig = unlockType === 'custom_sponsor'
                    ? {
                        brandName: customAd?.brandName || '',
                        brandWebsite: s(customAd?.redirectUrl) ?? null,
                        ctaButtonLabel: customAd?.ctaText || 'Visit Sponsor',
                        requiresClick: !!(customAd?.redirectUrl),
                        skipAfterSeconds: customAd?.skipAfter || 5,
                        unlockText: null as string | null,
                        unlockUrl: null as string | null,
                        unlockUrlLabel: null as string | null,
                    }
                    : null;

                // Build pairing config with all nested fields
                let resolvedPairingConfig: any = null;
                if (unlockType === 'follower_pairing' && followerPairingConfig) {
                    const pc = followerPairingConfig as any;
                    resolvedPairingConfig = {
                        topic: pc.topic || resolvedTitle,
                        description: s(pc.description) ?? null,
                        commitmentPrompt: pc.commitmentPrompt || 'What specific goal will you commit to for this challenge?',
                        durationDays: pc.durationDays || 7,
                        checkInFrequency: pc.checkInFrequency || 'daily',
                        guidelines: s(pc.guidelines) ?? null,
                        creatorResourceUrl: s(pc.creatorResourceUrl) ?? null,
                        creatorResourceLabel: s(pc.creatorResourceLabel) ?? null,
                        isAccepting: pc.isAccepting !== false,
                        scheduledMessages: (pc.scheduledMessages || []).map((m: any, i: number) => ({
                            dayNumber: m.dayNumber,
                            sendTime: m.sendTime || '09:00:00',
                            content: m.content,
                            linkUrl: s(m.linkUrl) ?? null,
                            linkLabel: s(m.linkLabel) ?? null,
                            youtubeUrl: s(m.youtubeUrl) ?? null,
                            sortOrder: m.sortOrder ?? i,
                        })),
                        completionAsset: pc.completionAsset ? {
                            resourceTitle: s(pc.completionAsset.resourceTitle) ?? null,
                            resourceDescription: s(pc.completionAsset.resourceDescription) ?? null,
                            bonusMessage: s(pc.completionAsset.bonusMessage) ?? null,
                            additionalLinks: (pc.completionAsset.additionalLinks || pc.completionAsset.links || []).map((l: any) => ({
                                url: l.url || '',
                                label: s(l.label) ?? null,
                            })),
                            youtubeUrl: s(pc.completionAsset.youtubeUrl) ?? null,
                        } : null,
                        hasCompletionFile: !!(pc.completionAsset?.fileId || pc.completionAsset?.file),
                        completionFileMetadata: (pc.completionAsset?.file) ? {
                            name: pc.completionAsset.file.name,
                            size: pc.completionAsset.file.size,
                            type: pc.completionAsset.file.type,
                            lastModified: pc.completionAsset.file.lastModified,
                        } : null,
                    };
                }

                const sponsorVideoFile = (customAd as any)?.file || null;

                const pendingLink = {
                    version: 2,
                    savedAt: new Date().toISOString(),
                    title: resolvedTitle,
                    description: s(desc) ?? s(contentData.textContent) ?? null,
                    textContent: s(contentData.textContent) ?? null,
                    contentLinks: contentData.links.length > 0
                        ? contentData.links.map(l => ({ url: l.url, title: l.title }))
                        : [],
                    mode: unlockType === 'follower_pairing' ? 'follower_pairing' : 'lock_content',
                    unlockType: unlockType as string,
                    youtubeUrl: s(contentData.youtubeUrl) ?? null,
                    donateEnabled: false,
                    fileMetadata: contentData.file ? {
                        name: contentData.file.name,
                        size: contentData.file.size,
                        type: contentData.file.type,
                        lastModified: contentData.file.lastModified,
                    } : null,
                    hasSponsorVideo: !!(customAd?.fileName || sponsorVideoFile),
                    sponsorVideoMetadata: sponsorVideoFile ? {
                        name: sponsorVideoFile.name,
                        size: sponsorVideoFile.size,
                        type: sponsorVideoFile.type,
                        lastModified: sponsorVideoFile.lastModified,
                    } : null,
                    emailConfig: resolvedEmailConfig,
                    socialConfig: resolvedSocialConfig,
                    sponsorConfig: resolvedSponsorConfig,
                    pairingConfig: resolvedPairingConfig,
                };

                localStorage.setItem('hivaapp_pending_link', JSON.stringify(pendingLink));

                // Persist the File object in in-memory store (survives within the same session)
                // Note: files are lost if user refreshes the page; recovery handles this gracefully.
                // (setContentFile / setSponsorVideo were already called by ContentBuilder / CustomSponsorForm)

                setPendingMessage("Sign up to save your link. We'll automatically create it once you're in.");
                setIsGenerating(false);
                setIsGenerated(true);
            }, 1000);
            return;
        }

        setIsGenerating(true);
        try {
            const resolvedTitle = title || (contentData.file ? contentData.file.name : (contentData.links[0]?.title || "My Link"));
            
            // Build pairingConfig with completionAsset properly mapped
            let authedPairingConfig = null;
            if (unlockType === 'follower_pairing' && followerPairingConfig) {
                const fpc = followerPairingConfig as any;
                authedPairingConfig = {
                    ...fpc,
                    completionAsset: fpc.completionAsset?.enabled ? {
                        enabled: true,
                        fileId: fpc.completionAsset.fileId || null,
                        unlockMessage: fpc.completionAsset.unlockMessage || null,
                        resourceTitle: resolvedTitle,
                        resourceDescription: desc || contentData.textContent || null,
                        bonusMessage: fpc.completionAsset.unlockMessage || null,
                        links: fpc.completionAsset.links || [],
                        additionalLinks: (fpc.completionAsset.links || []).map((l: any) => ({
                            url: l.url || '',
                            label: l.title || l.label || null,
                        })),
                        youtubeUrl: fpc.completionAsset.youtubeUrl || null,
                    } : null,
                };
            }

            const linkDataPayload: any = {
                title: resolvedTitle,
                description: desc || contentData.textContent || null,
                textContent: contentData.textContent || null,
                contentLinks: contentData.links.length > 0
                    ? contentData.links.map(l => ({ url: l.url, title: l.title }))
                    : [],
                mode: unlockType === 'follower_pairing' ? 'follower_pairing' : 'lock_content',
                unlockType: unlockType,
                fileId: contentData.fileId || null,
                emailConfig: unlockType === 'email_subscribe' ? emailConfig : null,
                socialConfig: unlockType === 'social_follow' ? socialConfig : null,
                sponsorConfig: unlockType === 'custom_sponsor' ? {
                    brandName: customAd?.brandName,
                    brandWebsite: customAd?.redirectUrl || null,
                    ctaButtonLabel: customAd?.ctaText || "Visit",
                    videoFileId: customAd?.fileId || null,
                    requiresClick: !!customAd?.redirectUrl,
                    skipAfterSeconds: customAd?.skipAfter || 5,
                    unlockText: null,
                    unlockUrl: null,
                    unlockUrlLabel: null,
                } : null,
                pairingConfig: authedPairingConfig,
                youtubeUrl: contentData.youtubeUrl || null,
                status: 'active'
            };

            const created = await createLink(
                currentUser.id,
                linkDataPayload
            );
            
            // Re-use logic for generated UI
            setGeneratedSlug(created.slug);
            setIsGenerating(false);
            setIsGenerated(true);
        } catch (err: any) {
            setIsGenerating(false);
            alert("Error creating link: " + err.message);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`${window.location.origin}/r/${generatedSlug}`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    useEffect(() => {
        const handleSelectUnlockType = (e: Event) => {
            const ce = e as CustomEvent;
            setUnlockType(ce.detail);
        };
        window.addEventListener('SELECT_UNLOCK_TYPE', handleSelectUnlockType);
        return () => window.removeEventListener('SELECT_UNLOCK_TYPE', handleSelectUnlockType);
    }, []);

    // Simple ref — survives closures and re-renders, no race conditions
    const proPendingRef = useRef(false);

    const handleStartPro = () => {
        if (isLoggedIn && currentUser) {
            // Already logged in — go straight to Stripe
            window.location.href = `${stripeProLink}?client_reference_id=${currentUser.id}&prefilled_email=${encodeURIComponent(currentUser.email || '')}`;
        } else {
            // Mark that we want Pro, then open auth
            proPendingRef.current = true;
            setPendingMessage("Create an account to upgrade to Pro and unlock unlimited Follower Pairing.");
            setIsAuthOpen(true);
        }
    };

    const handleSignInSuccess = async () => {
        if (proPendingRef.current) {
            proPendingRef.current = false;
            // Get session directly from Supabase — no React state dependency
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                window.location.href = `${stripeProLink}?client_reference_id=${session.user.id}&prefilled_email=${encodeURIComponent(session.user.email || '')}`;
                return; // Don't navigate — browser will redirect
            }
        }

        const returnTo = searchParams.get('returnTo');
        if (returnTo) {
            navigate(returnTo);
        } else {
            navigate('/dashboard?tab=home');
        }
    };

    // Determine if the generate button should be disabled.
    // For all unlock types: config errors always block generation — the user must complete
    // the unlock setup before we can save a valid pending link or create an actual link.
    // Exception: if hasConfiguredAdSetup is false on mobile, clicking Generate opens the config panel.
    const hasConfigErrors =
        (unlockType === 'custom_sponsor' && hasCustomAdErrors) ||
        (unlockType === 'email_subscribe' && hasEmailErrors) ||
        (unlockType === 'social_follow' && hasSocialErrors) ||
        (unlockType === 'follower_pairing' && hasFollowerPairingErrors);

    const isGenerateDisabled = !title || isGenerating ||
        (unlockType !== 'follower_pairing' && !(contentData.file || contentData.textContent.trim().length > 0 || contentData.links.length > 0)) ||
        (hasConfiguredAdSetup && hasConfigErrors);

    return (
        <div className="flex flex-col items-center w-full min-h-screen bg-bg selection:bg-brandTint selection:text-brand">
            {/* Hero Section */}
            <div className="w-full max-w-[800px] px-[24px] md:px-[32px] pt-[48px] md:pt-[64px] pb-[32px] md:pb-[48px] flex flex-col items-center text-center animate-fadeIn">
                <div className="flex items-center gap-3 mb-8 bg-surfaceAlt border border-border px-4 py-2 rounded-full cursor-pointer hover:bg-border transition-colors duration-200">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-brandTint border-2 border-surface flex items-center justify-center text-[12px]">👩‍🎨</div>
                        <div className="w-8 h-8 rounded-full bg-successBg border-2 border-surface flex items-center justify-center text-[12px]">👨‍💻</div>
                        <div className="w-8 h-8 rounded-full bg-warningBg border-2 border-surface flex items-center justify-center text-[12px]">📸</div>
                    </div>
                    <span className="text-[13px] md:text-[14px] font-bold text-textMid">Join <strong className="text-text">10,000+</strong> creators growing faster</span>
                </div>

                <h1 className="w-full text-center text-[clamp(36px,8vw,56px)] font-black text-text leading-[1.05] max-w-[720px] tracking-tight">
                    Turn your free content into <span className="text-brand">real growth.</span>
                </h1>

                <div className="h-[24px]" />

                <p className="text-center mx-auto text-[16px] md:text-[18px] font-medium text-textMid max-w-[540px] leading-[1.6]">
                    Gate your photos, files, or videos. Your audience unlocks them for free by subscribing to your email list, following your socials, or watching an ad.
                </p>
            </div>

            {/* Generator Component */}
            <div className="w-full max-w-[600px] px-[24px] md:px-[32px] mb-24 relative z-10" id="generator">
                {/* Desktop Step Layout */}
                <div className="hidden sm:flex bg-surface rounded-lg border border-border p-6 flex-col gap-6">
                    {/* Step 1 */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-6 h-6 bg-text text-surface rounded-full flex items-center justify-center font-black text-[12px]">1</div>
                            <h3 className="font-black text-text text-[18px] tracking-tight">Create your resource</h3>
                        </div>

                        {unlockType === 'follower_pairing' ? (
                            <div className="w-full bg-warningBg rounded-md p-4 border border-warning/20 h-auto flex flex-col justify-center animate-in slide-in-from-top-2 fade-in duration-200">
                                <span className="text-[13px] font-bold text-warning">🤝 No file needed for Follower Pairing. Your followers pair up and support each other.</span>
                            </div>
                        ) : (
                            <ContentBuilder 
                                value={contentData} 
                                onChange={setContentData}
                                isAuthenticated={isLoggedIn}
                                onPendingFile={setContentFile}
                            />
                        )}
                    </div>

                    <div className="w-full h-px bg-border my-2" />

                    {/* Section B — Mode Switch */}
                    <div className="flex flex-col gap-2">
                        <div className="w-full flex items-center p-1 border border-border rounded-md h-[52px] bg-surfaceAlt mx-auto">
                            <button
                                onClick={() => { if (unlockType === 'follower_pairing') setUnlockType('custom_sponsor'); }}
                                className={`flex-1 flex items-center justify-center gap-[8px] h-[44px] rounded-md transition-colors duration-200 cursor-pointer ${unlockType !== 'follower_pairing' ? 'bg-surface text-text border border-border' : 'bg-transparent text-textMid'}`}
                            >
                                <span className="text-[16px]">🔒</span>
                                <span className="text-[14px] font-[800]">Lock Content</span>
                            </button>
                            <button
                                onClick={() => setUnlockType('follower_pairing')}
                                className={`flex-1 flex items-center justify-center gap-[8px] h-[44px] rounded-md transition-colors duration-200 cursor-pointer ${unlockType === 'follower_pairing' ? 'bg-surface text-text border border-border' : 'bg-transparent text-textMid'}`}
                            >
                                <span className="text-[16px]">🤝</span>
                                <span className="text-[14px] font-[800]">Follower Pairing</span>
                            </button>
                        </div>
                        <div className="text-[12px] font-medium text-textLight text-center mt-2">
                            {unlockType !== 'follower_pairing' ? 
                                "Upload content your followers unlock by subscribing, following, or watching a sponsor." : 
                                "No file needed. Pair your followers as accountability partners for a set duration."}
                        </div>
                    </div>

                    <div className="h-px w-full bg-border my-2" />

                    {/* Title and Description - Hidden for follower pairing as they are handled inside FollowerPairingConfigForm relative to reward toggle */}
                    {unlockType !== 'follower_pairing' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5 relative">
                                <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Resource Title</label>
                                <input
                                    type="text"
                                    className={`h-10 px-4 w-full border rounded-md text-[15px] font-bold outline-none transition-colors duration-200 ${title.length > 50 ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : 'border-border focus:border-brand'}`}
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
                                    className={`w-full border rounded-md p-3 text-[14px] font-semibold bg-surface focus:outline-none focus:border-brand transition-colors duration-200 h-[80px] resize-none ${desc.length > 140 ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : 'border-border'}`}
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

                    <div className="h-px w-full bg-border my-2" />

                    {/* Section C - Config */}
                    <div className={`flex flex-col gap-3 min-h-[0px] rounded-lg transition-colors bg-transparent`}>
                        <div className="flex flex-col gap-4">
                            {unlockType !== 'follower_pairing' && (
                                <UnlockTypeSelector value={unlockType} onChange={setUnlockType} />
                            )}
                            
                            {unlockType === 'custom_sponsor' && (
                                <CustomSponsorForm 
                                    value={customAd} 
                                    onChange={setCustomAd} 
                                    onErrorStateChange={setHasCustomAdErrors}
                                    isAuthenticated={isLoggedIn}
                                    onPendingFile={setSponsorVideo}
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

                    <div className="h-px w-full bg-border my-2" />

                    {/* Generate Action */}
                    <div className="flex flex-col gap-2 mt-2">
                        {!isGenerated ? (
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerateDisabled}
                                className={`h-[48px] rounded-md px-4 font-black text-[16px] flex items-center justify-center gap-2 transition-all cursor-pointer ${!isGenerateDisabled ? 'bg-brand text-white hover:bg-brandHover' : 'bg-surfaceAlt text-textLight cursor-not-allowed opacity-50'}`}
                            >
                                {isGenerating ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <>
                                        <LinkIcon size={20} />
                                        Generate Shareable Link
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="flex flex-col animate-fadeIn">
                                <label className="font-black text-[11px] text-textMid uppercase tracking-wider mb-1.5">Your Generated Link</label>
                                <div className="flex gap-2">
                                    {linkRevealed ? (
                                        <>
                                            <div className="flex-1 h-[48px] rounded-md border border-brand/30 px-4 flex items-center relative overflow-hidden transition-colors bg-brandTint">
                                                <span className="text-[14px] sm:text-[15px] font-[900] text-text bg-surfaceAlt px-3 sm:px-4 py-1.5 sm:py-[8px] rounded-md border border-border tracking-tight">
                                    {window.location.origin}/r/{generatedSlug}
                                </span>            </div>
                                            <button onClick={copyToClipboard} className={`h-[48px] w-[48px] rounded-md flex items-center justify-center text-white cursor-pointer transition-colors shrink-0 ${isCopied ? 'bg-success hover:bg-success/90' : 'bg-brand hover:bg-brandHover'}`}>
                                                {isCopied ? <Check size={20} /> : <LinkIcon size={20} />}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex-1 h-[48px] rounded-md border border-border px-4 flex items-center justify-between relative overflow-hidden transition-colors bg-surfaceAlt group cursor-pointer" onClick={() => setIsAuthOpen(true)}>
                                            <div className="w-[65%] h-[20px] bg-border rounded animate-pulse"></div>
                                            <button onClick={(e) => { e.stopPropagation(); setIsAuthOpen(true); }} className="relative z-10 px-4 h-[32px] bg-brand text-white rounded-md font-black text-[13px] flex items-center justify-center gap-1.5 hover:bg-brandHover transition-colors cursor-pointer">
                                                <Lock size={14} /> Sign up to Reveal
                                            </button>
                                            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] pointer-events-none transition-all group-hover:bg-transparent"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <div className={`h-[24px] px-2 rounded-full flex items-center gap-1.5 border ${
                                        unlockType === 'custom_sponsor' ? 'bg-brandTint border-brand/20 text-brand' :
                                        unlockType === 'email_subscribe' ? 'bg-successBg border-success/20 text-success' :
                                        unlockType === 'social_follow' ? 'bg-[#EFF6FF] border-[#93C5FD] text-[#2563EB]' :
                                        'bg-warningBg border-warning/20 text-warning'
                                    }`}>
                                        {unlockType === 'custom_sponsor' ? <Star size={10} fill="currentColor" /> :
                                         unlockType === 'email_subscribe' ? <span>📧</span> :
                                         unlockType === 'social_follow' ? <span>👥</span> :
                                         <span>🤝</span>}
                                        <span className="text-[12px] font-[700] uppercase tracking-wider">
                                            {unlockType === 'custom_sponsor' ? 'Custom Sponsor' :
                                             unlockType === 'email_subscribe' ? 'Email Subscribe' :
                                             unlockType === 'social_follow' ? 'Social Follow' :
                                             'Follower Pairing'}
                                        </span>
                                    </div>
                                    <div className="h-[24px] px-2 rounded-full bg-surfaceAlt border border-border flex items-center text-textMid">
                                        <span className="text-[12px] font-[700] uppercase">
                                            {contentData.contentMode === 'file' ? (contentData.file ? contentData.file.name : "File") :
                                             contentData.contentMode === 'text' ? (contentData.links.length > 0 && contentData.textContent.trim().length === 0 ? `${contentData.links.length} Link${contentData.links.length > 1 ? 's' : ''}` : "Text Content") :
                                             "Text + File"}
                                        </span>
                                    </div>
                                </div>
                                {!linkRevealed && (
                                    <p className="text-[12px] font-bold text-brand mt-3 flex items-center gap-1.5 bg-brandTint p-2.5 rounded-md border border-brand/20">
                                        <span className="text-[16px]">👆</span> Sign in or create an account to claim and share this link.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Compact Layout */}
                <div ref={generationAreaRef} className="sm:hidden flex flex-col w-full bg-surface border border-border rounded-lg p-4">
                    {/* Mobile Create Section */}
                    {unlockType === 'follower_pairing' ? (
                        <div className="w-full bg-warningBg rounded-md p-4 border border-warning/20 h-auto flex flex-col justify-center animate-in slide-in-from-top-2 fade-in duration-200 mb-4">
                            <span className="text-[13px] font-bold text-warning">🤝 No file needed for Follower Pairing. Your followers pair up and support each other.</span>
                        </div>
                    ) : (
                        <ContentBuilder 
                            value={contentData} 
                            onChange={setContentData}
                            isAuthenticated={isLoggedIn}
                            onPendingFile={setContentFile}
                        />
                    )}

                    {/* Mode Switch Mobile */}
                    <div className="flex flex-col gap-2 mt-4 mb-2">
                        <div className="w-full flex items-center p-1 border border-border rounded-md h-[52px] bg-surface mx-auto">
                            <button
                                onClick={() => { if (unlockType === 'follower_pairing') setUnlockType('custom_sponsor'); }}
                                className={`flex-1 flex items-center justify-center gap-[8px] h-[44px] rounded-md transition-colors duration-200 cursor-pointer ${unlockType !== 'follower_pairing' ? 'bg-surface text-text border border-border' : 'bg-transparent text-textMid'}`}
                            >
                                <span className="text-[16px]">🔒</span>
                                <span className="text-[14px] font-[800]">Lock</span>
                            </button>
                            <button
                                onClick={() => setUnlockType('follower_pairing')}
                                className={`flex-1 flex items-center justify-center gap-[8px] h-[44px] rounded-md transition-colors duration-200 cursor-pointer ${unlockType === 'follower_pairing' ? 'bg-surface text-text border border-border' : 'bg-transparent text-textMid'}`}
                            >
                                <span className="text-[16px]">🤝</span>
                                <span className="text-[14px] font-[800]">Pairing</span>
                            </button>
                        </div>
                    </div>

                    {/* Title and Description - Hidden for pairing as they are inside form relative to reward toggle */}
                    {unlockType !== 'follower_pairing' && (
                        <div className="flex flex-col gap-4 mt-2 mb-2">
                            <div className="flex flex-col gap-1.5 relative">
                                <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Resource Title</label>
                                <input
                                    type="text"
                                    className={`h-10 px-4 w-full border rounded-md text-[15px] font-bold outline-none transition-colors duration-200 ${title.length > 50 ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : 'border-border focus:border-brand'}`}
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
                                    className={`w-full border rounded-md p-3 text-[14px] font-semibold bg-surface focus:outline-none focus:border-brand transition-colors duration-200 h-[80px] resize-none ${desc.length > 140 ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : 'border-border'}`}
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

                    {/* The Settings Summary Bar */}
                    <div className="w-full h-[52px] bg-surface rounded-md mt-2 flex overflow-hidden border border-border">
                        {/* Ad Setup Item */}
                        <button onClick={() => setIsConfigExpanded(!isConfigExpanded)} className={`flex-1 flex flex-col justify-center items-center relative ${hasPulsed ? 'bg-brandTint transition-colors duration-300' : 'bg-surface'}`}>
                            <div className="flex items-center gap-1">
                                {hasConfiguredAdSetup ? (
                                    <>
                                        {unlockType === 'custom_sponsor' && <Star size={10} className="text-brand" />}
                                        {unlockType === 'email_subscribe' && <span className="text-[10px]">📧</span>}
                                        {unlockType === 'social_follow' && <span className="text-[10px]">👥</span>}
                                        {unlockType === 'follower_pairing' && <span className="text-[10px]">🤝</span>}
                                    </>
                                ) : (
                                    <Settings size={10} className="text-textLight" />
                                )}
                                <span className="text-[11px] text-textMid">{unlockType === 'follower_pairing' ? 'Pairing Details' : 'Unlock Type'}</span>
                            </div>
                            {hasConfiguredAdSetup ? (
                                <span className="text-[11px] sm:text-[12px] font-[800] text-text truncate px-1 max-w-[140px]">
                                    {unlockType === 'custom_sponsor' ? (customAd?.brandName || 'Sponsor') :
                                     unlockType === 'email_subscribe' ? (emailConfig?.newsletterName || 'Newsletter') :
                                     unlockType === 'social_follow' ? (socialConfig?.customHeading || 'Socials') :
                                     (followerPairingConfig?.durationDays ? `${followerPairingConfig.durationDays} Days` : 'Pairing')}
                                </span>
                            ) : (
                                <span className="text-[12px] italic text-textLight">Tap to set</span>
                            )}
                        </button>
                    </div>

                    {/* Expandable Configuration Flow */}
                    {isConfigExpanded && (
                        <div className="w-full mt-2 bg-surface rounded-md p-4 border border-border animate-in slide-in-from-top-2 fade-in duration-300 relative flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-[14px] font-[800] text-text">Configure Unlock Setup</h3>
                                <button onClick={() => setIsConfigExpanded(false)} className="w-8 h-8 rounded-full bg-surfaceAlt flex items-center justify-center text-textMid hover:bg-border transition-colors cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className="w-full mb-5">
                                {unlockType !== 'follower_pairing' && (
                                    <UnlockTypeSelector value={unlockType} onChange={setUnlockType} />
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                {unlockType === 'custom_sponsor' && (
                                    <CustomSponsorForm
                                        value={customAd}
                                        onChange={setCustomAd}
                                        onErrorStateChange={setHasCustomAdErrors}
                                        isAuthenticated={isLoggedIn}
                                        onPendingFile={setSponsorVideo}
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

                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                                <button
                                    onClick={() => {
                                        if (unlockType === 'custom_sponsor' && hasCustomAdErrors) {
                                            window.dispatchEvent(new Event('CUSTOM_SPONSOR_VALIDATE'));
                                            return;
                                        }
                                        handleAdSetupApply();
                                    }}
                                    disabled={
                                        (unlockType === 'custom_sponsor' && hasCustomAdErrors) ||
                                        (unlockType === 'email_subscribe' && hasEmailErrors) ||
                                        (unlockType === 'social_follow' && hasSocialErrors) ||
                                        (unlockType === 'follower_pairing' && hasFollowerPairingErrors)
                                    }
                                    className="flex-1 h-[44px] bg-brand text-white font-[800] text-[15px] rounded-md transition-opacity flex items-center justify-center cursor-pointer hover:bg-brandHover disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Apply
                                </button>
                                <button onClick={() => setIsConfigExpanded(false)} className="flex-1 h-[44px] bg-surfaceAlt text-textMid font-[800] text-[15px] rounded-md transition-colors hover:bg-border cursor-pointer">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Generate Button Wrapper */}
                    <div className={`mt-[10px] transition-all duration-300 ${isConfigExpanded ? 'opacity-50 pointer-events-none' : ''}`}>
                        <button
                            onClick={() => {
                                if (!hasConfiguredAdSetup) {
                                    setIsConfigExpanded(true);
                                    return;
                                }
                                handleGenerate();
                            }}
                            disabled={isGenerateDisabled}
                            className={`w-full h-[48px] rounded-md font-[800] text-[16px] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed
                            ${(!isGenerateDisabled || !hasConfiguredAdSetup) ? 'bg-brand text-white hover:bg-brandHover' : 'bg-surfaceAlt text-textLight opacity-50'}`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (unlockType !== 'follower_pairing' && !(contentData.file || contentData.textContent.trim().length > 0 || contentData.links.length > 0)) ? (
                                "Add content to get started"
                            ) : !hasConfiguredAdSetup ? (
                                "Configure Unlock Type"
                            ) : (
                                <>
                                    <LinkIcon size={18} />
                                    Generate Shareable Link
                                </>
                            )}
                        </button>
                    </div>

                    {/* Generated Link Output (Mobile) Inline */}
                    {isGenerated && !isConfigExpanded && (
                        <div ref={outputCardRef} className="mt-[10px] bg-surface rounded-md p-4 border border-border animate-in slide-in-from-bottom-4 fade-in duration-300">
                            <div className="flex items-center gap-1.5 mb-2">
                                <div className="w-4 h-4 rounded-full bg-successBg text-success flex items-center justify-center">
                                    <Check size={10} strokeWidth={4} />
                                </div>
                                <span className="text-[12px] font-[700] text-success">Your link is ready</span>
                            </div>

                            <div className="flex gap-2">
                                {isLoggedIn ? (
                                    <>
                                        <div className="flex-1 h-[40px] rounded-md px-3 flex items-center relative overflow-hidden transition-colors bg-surfaceAlt border border-border">
                                            <span className="font-bold font-mono text-[13px] truncate text-text">{window.location.host}/r/{generatedSlug}</span>
                                        </div>
                                        <button onClick={copyToClipboard} className={`w-[40px] h-[40px] rounded-md flex items-center justify-center text-white transition-colors shrink-0 cursor-pointer ${isCopied ? 'bg-success hover:bg-success/90' : 'bg-brand hover:bg-brandHover'}`}>
                                            {isCopied ? <Check size={18} /> : <LinkIcon size={18} />}
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex-1 h-[40px] rounded-md px-3 flex items-center justify-between relative overflow-hidden transition-colors bg-surfaceAlt border border-border group cursor-pointer" onClick={() => setIsAuthOpen(true)}>
                                        <div className="w-[60%] h-[16px] bg-border rounded animate-pulse"></div>
                                        <button onClick={(e) => { e.stopPropagation(); setIsAuthOpen(true); }} className="relative z-10 px-3 h-[28px] bg-brand text-white rounded-md font-black text-[11px] flex items-center justify-center gap-1.5 hover:bg-brandHover cursor-pointer">
                                            <Lock size={12} /> Reveal
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Ad Type Badges Mobile */}
                            <div className="flex items-center gap-1.5 mt-3">
                                <div className={`h-[22px] px-2 rounded-full flex items-center gap-1 border ${
                                    unlockType === 'custom_sponsor' ? 'bg-[#F5F3FF] border-[#C4B5FD] text-[#6366F1]' : 
                                    unlockType === 'email_subscribe' ? 'bg-successBg border-success/30 text-success' : 
                                    unlockType === 'social_follow' ? 'bg-[#EFF6FF] border-[#93C5FD] text-[#2563EB]' : 
                                    'bg-warningBg border-warning/30 text-warning'
                                }`}>
                                    {unlockType === 'custom_sponsor' ? <Star size={10} fill="currentColor" /> :
                                     unlockType === 'email_subscribe' ? <span className="text-[10px]">📧</span> :
                                     unlockType === 'social_follow' ? <span className="text-[10px]">👥</span> :
                                     <span className="text-[10px]">🤝</span>}
                                    <span className="text-[10px] font-[800] uppercase pt-px">
                                        {unlockType === 'custom_sponsor' ? 'Custom Sponsor' : 
                                         unlockType === 'email_subscribe' ? 'Email Subscribe' : 
                                         unlockType === 'social_follow' ? 'Social Follow' : 
                                         'Follower Pairing'}    
                                    </span>
                                </div>
                            </div>

                            {/* Mobile Compact How It Works Row */}
                            <div className="mt-[12px] h-[48px] bg-surfaceAlt rounded-[10px] flex items-center">
                                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                                    <span className="text-[18px]">🔗</span>
                                    <span className="text-[10px] font-[700] text-textMid">Click link</span>
                                </div>
                                <div className="w-[1px] h-[24px] bg-border" />
                                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                                    <span className="text-[18px]">✨</span>
                                    <span className="text-[10px] font-[700] text-textMid">View Sponsor/Unlock</span>
                                </div>
                                <div className="w-[1px] h-[24px] bg-border" />
                                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                                    <span className="text-[18px]">🎁</span>
                                    <span className="text-[10px] font-[700] text-textMid">Free content</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Below The Fold Sections */}
            <BelowTheFold onStartPro={handleStartPro} />


            {/* Standard Footer */}
            <footer className="w-full bg-surface border-t border-border py-12 px-4 flex flex-col items-center">
                <div className="w-full max-w-[1000px] flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-80">
                        <div className="w-6 h-6 rounded-[14px] bg-text text-white flex items-center justify-center font-black text-[10px] leading-none shrink-0">
                            UC
                        </div>
                        <span className="font-black text-[16px] tracking-tight text-text">UnlockTheContent</span>
                    </div>

                    <div className="flex items-center gap-6 text-[13px] font-bold text-textMid">
                        <Link to="/explore" className="hover:text-text transition-colors">Explore</Link>
                        <Link to="/how-it-works" className="hover:text-text transition-colors">How It Works</Link>
                        <Link to="/terms" className="hover:text-text transition-colors">Terms</Link>
                        <Link to="/privacy" className="hover:text-text transition-colors">Privacy</Link>
                    </div>

                    <div className="text-[12px] font-bold text-textLight">
                        © {new Date().getFullYear()} UnlockTheContent Inc. All rights reserved.
                    </div>
                </div>
            </footer>

            <AuthBottomSheet
                isOpen={isAuthOpen}
                onClose={() => { setIsAuthOpen(false); setPendingMessage(null); }}
                onSuccess={handleSignInSuccess}
                defaultScreen={authDefaultScreen}
                contextualMessage={pendingMessage}
            />
        </div>
    );
};
