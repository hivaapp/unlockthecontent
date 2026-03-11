import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link as LinkIcon, Lock, Check, Loader2, Star, Settings, X } from 'lucide-react';

import { SignInModal } from '../components/SignInModal';
import { CustomSponsorForm, type CustomAdData } from '../components/CustomSponsorForm';
import { useNavigate, Link } from 'react-router-dom';
import { ContentBuilder, type ContentData } from '../components/ContentBuilder';
import { UnlockTypeSelector, type UnlockType } from '../components/dashboard/UnlockTypeSelector';
import { EmailConfigForm, type EmailConfigData } from '../components/dashboard/EmailConfigForm';
import { SocialConfigForm, type SocialConfigData } from '../components/dashboard/SocialConfigForm';
import { FollowerPairingConfigForm, type FollowerPairingConfigData } from '../components/dashboard/FollowerPairingConfigForm';
import { BelowTheFold } from '../components/landing/BelowTheFold';





export const Landing = () => {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    // Generate state
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const linkRevealed = isLoggedIn && isGenerated;

    const [fakeUrl] = useState('adga.te/r/freeresource');
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

    const handleGenerate = () => {
        const hasTextContent = contentData.textContent.trim().length > 0 || contentData.links.length > 0;
        const hasContent = unlockType === 'follower_pairing' ? true : (contentData.file || hasTextContent);
        if (!hasContent) return;

        if (unlockType === 'custom_sponsor' && hasCustomAdErrors) {
            window.dispatchEvent(new Event('CUSTOM_SPONSOR_VALIDATE'));
            alert("Please complete your sponsor details before generating.");
            return;
        }

        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setIsGenerated(true);
        }, 1200);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`https://${fakeUrl}`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSignInSuccess = () => {
        if (isGenerated) {
            navigate('/dashboard');
        }
    };

    const isGenerateDisabled = isGenerating || 
        (unlockType !== 'follower_pairing' && !(contentData.file || contentData.textContent.trim().length > 0 || contentData.links.length > 0)) ||
        (hasConfiguredAdSetup && (
            (unlockType === 'custom_sponsor' && hasCustomAdErrors) ||
            (unlockType === 'email_subscribe' && hasEmailErrors) ||
            (unlockType === 'social_follow' && hasSocialErrors) ||
            (unlockType === 'follower_pairing' && hasFollowerPairingErrors)
        ));

    return (
        <div className="flex flex-col items-center w-full min-h-screen bg-bg selection:bg-brandTint selection:text-brand">
            {/* Hero Section */}
            <div className="w-full max-w-[800px] px-4 pt-[32px] pb-[20px] flex flex-col items-center text-center animate-fadeIn">
                <h1
                    className="w-full text-center"
                    style={{
                        fontFamily: '"Nunito", sans-serif',
                        fontWeight: 900,
                        fontSize: 'clamp(22px, 6vw, 36px)',
                        color: '#111111',
                        lineHeight: 1.2,
                        maxWidth: '560px',
                        margin: '0 auto'
                    }}
                >
                    Lock your best content. Your followers unlock it free. You build something real.
                </h1>

                <div className="h-[12px]" />

                <p
                    className="text-center mx-auto"
                    style={{
                        fontFamily: '"Nunito", sans-serif',
                        fontWeight: 600,
                        fontSize: '15px',
                        color: '#666666',
                        maxWidth: '400px',
                        lineHeight: 1.7
                    }}
                >
                    Lock videos, photos, files, or run a challenge. Your followers unlock everything free by subscribing, following, or watching your sponsor's ad.
                </p>
            </div>

            {/* Generator Component */}
            <div className="w-full max-w-[600px] px-4 mb-24 relative z-10" id="generator">
                {/* Desktop Step Layout */}
                <div className="hidden sm:flex bg-white rounded-[24px] border border-border shadow-md p-4 sm:p-6 flex-col gap-6">
                    {/* Step 1 */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-6 h-6 bg-text text-white rounded-full flex items-center justify-center font-black text-[12px]">1</div>
                            <h3 className="font-black text-text text-[18px] tracking-tight">Create your resource</h3>
                        </div>

                        {unlockType === 'follower_pairing' ? (
                            <div className="w-full bg-[#FFFBEB] rounded-[10px] p-[12px] border border-[#FDE68A] h-auto flex flex-col justify-center animate-in slide-in-from-top-2 fade-in duration-200">
                                <span className="text-[12px] font-[700] text-[#92400E]">🤝 No file needed for Follower Pairing. Your followers pair up and support each other.</span>
                            </div>
                        ) : (
                            <ContentBuilder value={contentData} onChange={setContentData} />
                        )}
                    </div>

                    <div className="w-full h-px bg-border my-2" />

                    {/* Section B — Mode Switch */}
                    <div className="flex flex-col gap-2">
                        <div className="w-full flex items-center p-1 border-[1.5px] border-[#E8E8E8] rounded-[12px] h-[52px] bg-white mx-auto shadow-sm">
                            <button
                                onClick={() => { if (unlockType === 'follower_pairing') setUnlockType('custom_sponsor'); }}
                                className={`flex-1 flex items-center justify-center gap-[8px] h-[44px] rounded-[10px] transition-all duration-200 ${unlockType !== 'follower_pairing' ? 'bg-[#111] text-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]' : 'bg-transparent text-[#666]'}`}
                            >
                                <span className="text-[16px]">🔒</span>
                                <span className="text-[14px] font-[800]">Lock Content</span>
                            </button>
                            <button
                                onClick={() => setUnlockType('follower_pairing')}
                                className={`flex-1 flex items-center justify-center gap-[8px] h-[44px] rounded-[10px] transition-all duration-200 ${unlockType === 'follower_pairing' ? 'bg-[#111] text-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]' : 'bg-transparent text-[#666]'}`}
                            >
                                <span className="text-[16px]">🤝</span>
                                <span className="text-[14px] font-[800]">Follower Pairing</span>
                            </button>
                        </div>
                        <div className="text-[11px] font-[600] text-[#AAAAAA] text-center mt-[8px]">
                            {unlockType !== 'follower_pairing' ? 
                                "Upload content your followers unlock by subscribing, following, or watching a sponsor." : 
                                "No file needed. Pair your followers as accountability partners for a set duration."}
                        </div>
                    </div>

                    <div className="h-px w-full bg-border my-2" />

                    {/* Section C - Config */}
                    <div className={`flex flex-col gap-3 min-h-[0px] p-4 -m-4 rounded-[20px] transition-colors bg-transparent`}>
                        <div className="flex flex-col gap-4">
                            {unlockType !== 'follower_pairing' && (
                                <UnlockTypeSelector value={unlockType} onChange={setUnlockType} />
                            )}
                            
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
                                />
                            )}
                        </div>
                    </div>

                    <div className="h-px w-full bg-border" />

                    {/* Generate Action */}
                    <div className="flex flex-col gap-2 mt-2">
                        {!isGenerated ? (
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerateDisabled}
                                className={`h-[56px] rounded-[14px] font-black text-[16px] flex items-center justify-center gap-2 transition-all ${!isGenerateDisabled ? 'bg-brand text-white hover:bg-brandHover shadow-sm' : 'bg-surfaceAlt text-textLight cursor-not-allowed disabled:opacity-50 disabled:grayscale-[50%]'}`}
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
                                            <div className="flex-1 h-[56px] rounded-[14px] border-2 px-4 flex items-center relative overflow-hidden transition-colors bg-brandTint border-brand/30">
                                                <span className="font-bold font-mono text-[14px] sm:text-[15px] truncate text-text">{fakeUrl}</span>
                                            </div>
                                            <button onClick={copyToClipboard} className={`h-[56px] w-[56px] rounded-[14px] flex items-center justify-center text-white transition-colors shrink-0 shadow-sm ${isCopied ? 'bg-success' : 'bg-brand hover:bg-brand-hover'}`}>
                                                {isCopied ? <Check size={24} /> : <LinkIcon size={24} />}
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setIsModalOpen(true)} className="w-full h-[56px] bg-brand text-white rounded-[14px] font-black text-[15px] flex items-center justify-center gap-2 shadow-sm shrink-0 hover:bg-brand-hover transition-colors">
                                            <Lock size={18} /> Sign In to Reveal Link
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <div className="h-[24px] px-2 rounded-full bg-[#6366F1] flex items-center gap-1.5 text-white shadow-sm">
                                        <Star size={10} fill="currentColor" />
                                        <span className="text-[12px] font-[700] uppercase tracking-wider">Custom Sponsor</span>
                                    </div>
                                    <div className="h-[24px] px-2 rounded-full bg-surfaceAlt border border-border flex items-center text-textMid shadow-sm">
                                        <span className="text-[12px] font-[700] uppercase">
                                            {contentData.contentMode === 'file' ? (contentData.file ? contentData.file.name : "File") :
                                             contentData.contentMode === 'text' ? (contentData.links.length > 0 && contentData.textContent.trim().length === 0 ? `${contentData.links.length} Link${contentData.links.length > 1 ? 's' : ''}` : "Text Content") :
                                             "Text + File"}
                                        </span>
                                    </div>
                                </div>
                                {!linkRevealed && (
                                    <p className="text-[12px] font-bold text-brand mt-2 flex items-center gap-1.5 bg-brandTint p-2 rounded-[14px]">
                                        <span className="text-[16px]">👆</span> Sign in or create an account to claim and share this link.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Compact Layout */}
                <div ref={generationAreaRef} className="sm:hidden flex flex-col w-full">
                    {/* Mobile Create Section */}
                    {unlockType === 'follower_pairing' ? (
                        <div className="w-full bg-[#FFFBEB] rounded-[10px] p-[12px] border border-[#FDE68A] h-auto flex flex-col justify-center animate-in slide-in-from-top-2 fade-in duration-200">
                            <span className="text-[12px] font-[700] text-[#92400E]">🤝 No file needed for Follower Pairing. Your followers pair up and support each other.</span>
                        </div>
                    ) : (
                        <ContentBuilder value={contentData} onChange={setContentData} />
                    )}

                    {/* Mode Switch Mobile */}
                    <div className="flex flex-col gap-2 mt-4 mb-2">
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

                    {/* The Settings Summary Bar */}
                    <div className="w-full h-[52px] bg-white rounded-[14px] mt-[8px] flex overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E6E2D9]">
                        {/* Ad Setup Item */}
                        <button onClick={() => setIsConfigExpanded(!isConfigExpanded)} className={`flex-1 flex flex-col justify-center items-center relative ${hasPulsed ? 'bg-[#FFF0EF] transition-colors duration-300' : 'bg-white'}`}>
                            <div className="flex items-center gap-1">
                                {hasConfiguredAdSetup ? (
                                    <>
                                        {unlockType === 'custom_sponsor' && <Star size={10} className="text-[#6366F1]" />}
                                        {unlockType === 'email_subscribe' && <span className="text-[10px]">📧</span>}
                                        {unlockType === 'social_follow' && <span className="text-[10px]">👥</span>}
                                        {unlockType === 'follower_pairing' && <span className="text-[10px]">🤝</span>}
                                    </>
                                ) : (
                                    <Settings size={10} className="text-[#AAA49C]" />
                                )}
                                <span className="text-[11px] text-textMid">{unlockType === 'follower_pairing' ? 'Pairing Details' : 'Unlock Type'}</span>
                                {hasConfiguredAdSetup && <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${unlockType === 'custom_sponsor' ? 'bg-[#6366F1]' : unlockType === 'email_subscribe' ? 'bg-[#166534]' : unlockType === 'social_follow' ? 'bg-[#2563EB]' : 'bg-[#92400E]'}`} />}
                            </div>
                            {hasConfiguredAdSetup ? (
                                <span className="text-[11px] sm:text-[12px] font-[800] text-[#111] truncate px-1 max-w-[140px]">
                                    {unlockType === 'custom_sponsor' ? (customAd?.brandName || 'Sponsor') :
                                     unlockType === 'email_subscribe' ? (emailConfig?.newsletterName || 'Newsletter') :
                                     unlockType === 'social_follow' ? (socialConfig?.customHeading || 'Socials') :
                                     (followerPairingConfig?.durationDays ? `${followerPairingConfig.durationDays} Days` : 'Pairing')}
                                </span>
                            ) : (
                                <span className="text-[12px] italic text-[#BBBBBB]">Tap to set</span>
                            )}
                        </button>
                    </div>

                    {/* Expandable Configuration Flow */}
                    {isConfigExpanded && (
                        <div className="w-full mt-2 bg-white rounded-[16px] p-4 border border-[#E6E2D9] shadow-sm animate-in slide-in-from-top-2 fade-in duration-300 relative flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-[14px] font-[800] text-[#111]">Configure Unlock Setup</h3>
                                <button onClick={() => setIsConfigExpanded(false)} className="w-[32px] h-[32px] rounded-full bg-[#f6f6f6] flex items-center justify-center text-[#888]">
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
                                    />
                                )}
                            </div>

                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#E8E8E8]">
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
                                    className="flex-1 h-[44px] bg-[#2563EB] text-white font-[800] text-[15px] rounded-[12px] shadow-sm disabled:opacity-50 transition-opacity flex items-center justify-center"
                                >
                                    Apply
                                </button>
                                <button onClick={() => setIsConfigExpanded(false)} className="flex-1 h-[44px] bg-[#F6F6F6] text-[#888] font-[800] text-[15px] rounded-[12px] transition-colors hover:bg-[#E8E8E8]">
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
                            className={`w-full h-[52px] rounded-[14px] font-[800] text-[16px] flex items-center justify-center gap-2 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06)] disabled:opacity-50 disabled:grayscale-[50%]
                            ${(!isGenerateDisabled || !hasConfiguredAdSetup) ? 'bg-[#E8312A] text-white' : 'bg-[#E8312A]/50 text-white'}`}
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
                        <div ref={outputCardRef} className="mt-[10px] bg-white rounded-[14px] p-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E6E2D9] animate-in slide-in-from-bottom-4 fade-in duration-300">
                            <div className="flex items-center gap-1.5 mb-2">
                                <div className="w-4 h-4 rounded-full bg-[#EBF5EE] text-[#417A55] flex items-center justify-center">
                                    <Check size={10} strokeWidth={4} />
                                </div>
                                <span className="text-[12px] font-[700] text-[#417A55]">Your link is ready</span>
                            </div>

                            <div className="flex gap-2">
                                {isLoggedIn ? (
                                    <>
                                        <div className="flex-1 h-[40px] rounded-[10px] px-3 flex items-center relative overflow-hidden transition-colors bg-[#F3F1EC]">
                                            <span className="font-bold font-mono text-[13px] truncate text-text">{fakeUrl}</span>
                                        </div>
                                        <button onClick={copyToClipboard} className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-white transition-colors shrink-0 shadow-sm ${isCopied ? 'bg-success' : 'bg-[#E8312A]'}`}>
                                            {isCopied ? <Check size={18} /> : <LinkIcon size={18} />}
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsModalOpen(true)} className="w-full h-[40px] bg-[#E8312A] text-white rounded-[10px] font-black text-[13px] flex items-center justify-center gap-1.5 shrink-0">
                                        Sign In to reveal
                                    </button>
                                )}
                            </div>

                            {/* Ad Type Badges Mobile */}
                            <div className="flex items-center gap-1.5 mt-3">
                                <div className={`h-[22px] px-2 rounded-full flex items-center gap-1 shadow-sm border
                                    ${unlockType === 'custom_sponsor' ? 'bg-[#F5F3FF] border-[#C4B5FD] text-[#6366F1]' : 
                                      unlockType === 'email_subscribe' ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]' : 
                                      unlockType === 'social_follow' ? 'bg-[#EFF6FF] border-[#93C5FD] text-[#2563EB]' : 
                                      'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'}`}
                                >
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
                            <div className="mt-[12px] h-[48px] bg-[#F8F8F8] rounded-[10px] flex items-center">
                                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                                    <span className="text-[18px]">🔗</span>
                                    <span className="text-[10px] font-[700] text-textMid">Click link</span>
                                </div>
                                <div className="w-[1px] h-[24px] bg-[#E8E8E8]" />
                                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                                    <span className="text-[18px]">✨</span>
                                    <span className="text-[10px] font-[700] text-textMid">View Sponsor/Unlock</span>
                                </div>
                                <div className="w-[1px] h-[24px] bg-[#E8E8E8]" />
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
            <BelowTheFold />


            {/* Standard Footer */}
            <footer className="w-full bg-white border-t border-border py-12 px-4 flex flex-col items-center">
                <div className="w-full max-w-[1000px] flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-80">
                        <div className="w-6 h-6 rounded-[14px] bg-text text-white flex items-center justify-center font-black text-[10px] leading-none shrink-0">
                            AG
                        </div>
                        <span className="font-black text-[16px] tracking-tight text-text">AdGate</span>
                    </div>

                    <div className="flex items-center gap-6 text-[13px] font-bold text-textMid">
                        <Link to="/explore" className="hover:text-text transition-colors">Explore</Link>
                        <Link to="/how-it-works" className="hover:text-text transition-colors">How It Works</Link>
                        <Link to="/terms" className="hover:text-text transition-colors">Terms</Link>
                        <Link to="/privacy" className="hover:text-text transition-colors">Privacy</Link>
                    </div>

                    <div className="text-[12px] font-bold text-textLight">
                        © {new Date().getFullYear()} AdGate Inc. All rights reserved.
                    </div>
                </div>
            </footer>

            <SignInModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSignInSuccess}
            />
        </div>
    );
};
