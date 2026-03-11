import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileIcon, FileText, FileArchive, Image as ImageIcon, CheckCircle2, Download, Twitter, MessageCircle, Copy, Check, Play, MousePointerClick, ArrowRight } from 'lucide-react';
import { useAdSession } from '../hooks/useAdSession';
import { useToast } from '../context/ToastContext';
import { VideoAdViewer } from '../components/VideoAdViewer';
import { Navbar } from '../components/Navbar';
import { mockExploreResources } from '../lib/mockData';
import { getAvatarColor } from '../lib/utils';
import type { CustomAdData } from '../components/CustomSponsorForm';
import { EmailUnlock } from '../components/unlock/EmailUnlock';
import { SocialUnlock } from '../components/unlock/SocialUnlock';
import { FollowerPairingUnlock } from '../components/unlock/FollowerPairingUnlock';

export const ResourceUnlock = () => {
    const { slug } = useParams();
    const { addToast } = useToast();
    const { startSession, registerVideoWatch, registerSponsorClick, isComplete, customSponsorStep } = useAdSession();

    const [isShowingAd, setIsShowingAd] = useState(false);
    const [isRevealing, setIsRevealing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [popupBlocked, setPopupBlocked] = useState(false);

    // Mock resource fetch
    const resource = mockExploreResources.find(r => r.slug === slug);

    const requiresClick = !!resource?.customAd?.redirectUrl || (resource?.requiresClick ?? false);

    useEffect(() => {
        if (!resource || resource.isActive === false) return;
        // Initialize session on mount or slug change
        startSession(slug || 'default');
        // Set open graph tags (mock implementation via DOM)
        document.title = `${resource.title} - AdGate`;
    }, [slug, startSession, resource?.title, resource?.isActive, resource]);

    const handleUnlockClick = useCallback(() => {
        setIsShowingAd(true);
    }, []);

    if (isComplete && !isRevealing) {
        setIsRevealing(true);
    }

    const handleAdClose = () => {
        setIsShowingAd(false);
    };

    const handleVideoComplete = () => {
        registerVideoWatch(requiresClick);
        if (!requiresClick) {
            setIsShowingAd(false);
            addToast('Video complete! Revealing your content...', 'success');
        }
    };

    const handleVideoSkip = () => {
        registerVideoWatch(requiresClick);
        if (!requiresClick) {
            setIsShowingAd(false);
            addToast('Video complete! Revealing your content...', 'success');
        }
    };

    const handleSponsorClick = () => {
        if (resource?.customAd?.redirectUrl) {
            const newWindow = window.open(resource.customAd.redirectUrl, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                setPopupBlocked(true);
                return;
            }
        }
        registerSponsorClick();
        setIsShowingAd(false);
        addToast('Sponsor visited! Revealing your content...', 'success');
    };

    const handleSponsorClickFallback = () => {
        registerSponsorClick();
        setIsShowingAd(false);
        setPopupBlocked(false);
        addToast('Sponsor visited! Revealing your content...', 'success');
    };

    if (!resource) {
        return <ResourceNotFound />;
    }

    if (resource.isActive === false) {
        return <ResourceDisabled />;
    }

    const handleDownload = () => {
        setIsDownloading(true);
        setTimeout(() => {
            setIsDownloading(false);
            addToast('Download started', 'success');
        }, 800);
    };

    const getFileIcon = () => {
        switch (resource.fileType) {
            case 'ZIP': return <FileArchive size={32} className="text-[#8e44ad]" />;
            case 'PDF': return <FileIcon size={32} className="text-[#e74c3c]" />;
            case 'DOC': return <FileText size={32} className="text-[#2980b9]" />;
            case 'IMAGES': return <ImageIcon size={32} className="text-[#27ae60]" />;
            default: return <FileIcon size={32} className="text-[#e74c3c]" />;
        }
    };

    const getFileBgClass = () => {
        switch (resource.fileType) {
            case 'ZIP': return 'bg-[#f4ecf7]';
            case 'PDF': return 'bg-[#fdedec]';
            case 'DOC': return 'bg-[#ebf5fb]';
            case 'IMAGES': return 'bg-[#e9f7ef]';
            default: return 'bg-[#fdedec]';
        }
    };

    // Button text dynamic logic
    let buttonText = "Watch Video to Unlock";
    let buttonIcon = <Play size={18} fill="currentColor" />;
    let buttonBg = "bg-[#E8312A] hover:bg-[#C0392B]";

    if (customSponsorStep === "click") {
        buttonText = "Visit Sponsor to Unlock";
        buttonIcon = <MousePointerClick size={18} />;
        buttonBg = "bg-[#6366F1] hover:bg-[#4F46E5]";
    }

    return (
        <div className="w-full min-h-screen bg-bg flex flex-col items-center animate-fadeIn pb-24">
            {/* Header */}
            <header className="w-full h-12 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 sticky top-0 bg-bg/90 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-[14px] bg-brand flex items-center justify-center text-white font-black text-[10px] leading-none">
                        AG
                    </div>
                    <span className="font-black text-[15px] tracking-tight">AdGate</span>
                </div>
                <Link to="/" className="text-[13px] font-bold text-brand hover:underline">
                    Create your own free link
                </Link>
            </header>

            {/* Success Banner */}
            {isComplete && resource.unlockType !== 'follower_pairing' && (
                <div className="w-full bg-success flex flex-col items-center justify-center animate-slide-down shadow-md z-20 px-4 py-3">
                    <div className="flex items-center gap-2 text-white font-black text-[15px] sm:text-[16px] text-center">
                        <CheckCircle2 size={20} className="shrink-0" />
                        {requiresClick && resource.unlockType === 'custom_sponsor'
                            ? `Thanks for supporting ${resource.customAd?.brandName}. You watched their video and visited their site.`
                            : 'Unlocked!'}
                    </div>
                    <span className="text-white/90 text-[13px] font-bold mt-1">Your free resource is ready to download</span>
                </div>
            )}

            <main className="w-full max-w-[800px] px-4 sm:px-8 mt-6 flex flex-col items-center">

                {/* Resource Card */}
                <div className="w-full bg-white rounded-[18px] border border-border p-5 flex flex-col relative overflow-hidden">
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-[16px] ${getFileBgClass()} flex items-center justify-center mb-4`}>
                            {getFileIcon()}
                        </div>
                        <h1 className="text-[20px] font-black leading-tight mb-3 px-2 line-clamp-1 sm:line-clamp-none">{resource.title}</h1>

                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-[12px]" style={{ backgroundColor: getAvatarColor(resource.creatorHandle) }}>
                                {resource.creatorAvatar}
                            </div>
                            <span className="text-[13px] font-bold text-textMid flex items-center gap-1">
                                by @{resource.creatorHandle}
                                {resource.verified && <CheckCircle2 size={12} className="text-blue-500 fill-blue-500/10" />}
                            </span>
                        </div>

                        <p className="text-[14px] font-semibold text-text leading-[1.6] max-w-[500px] mb-4 line-clamp-3">
                            {resource.description}
                        </p>

                        <div className="flex items-center flex-wrap justify-center gap-2 text-[12px] font-bold text-textMid mb-6">
                            <span>{resource.unlockCount} unlocks</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>{resource.fileSize}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="px-2 py-0.5 bg-surfaceAlt rounded-[14px] text-[11px]">{resource.fileType}</span>

                            <div className="h-[40px] px-3 bg-[#EDE9FE] text-[#6366F1] rounded-[10px] flex items-center gap-2 ml-1 shadow-[0_1px_2px_rgba(99,102,241,0.1)]">
                                {requiresClick ? (
                                    <div className="flex items-center gap-1 opacity-90 shrink-0 mr-1">
                                        <Play size={10} fill="currentColor" />
                                        <ArrowRight size={10} strokeWidth={3} />
                                        <MousePointerClick size={10} />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 opacity-90 shrink-0 mr-1">
                                        <Play size={10} fill="currentColor" />
                                    </div>
                                )}
                                <div className="flex flex-col justify-center text-left">
                                    <span className="text-[12px] font-black leading-none mb-0.5 tracking-tight text-[#4C1D95]">
                                        {requiresClick ? 'Watch \u2192 Then Click' : 'Video Only'}
                                    </span>
                                    <span className="text-[10px] font-bold opacity-70 leading-none">
                                        Sponsored \u00B7 {resource.customAd?.brandName || 'Partner'}
                                    </span>
                                </div>
                            </div>

                        </div>

                        {/* Locked/Revealed Preview Zone */}
                        </div>
                    </div>

                {/* Interaction Section */}
                <div className="w-full mt-5">
                    {!isComplete ? (
                        <>
                            {(!resource.unlockType || resource.unlockType === 'custom_sponsor') && (
                                <>
                                    {/* Progress Indicator */}
                                    <div className="flex items-center justify-center gap-2 mb-6 pointer-events-none">
                                        <div className="flex flex-col items-center gap-2 relative">
                                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 z-10 shadow-sm transition-all duration-300
                                                ${customSponsorStep === "click" || isComplete ? 'bg-success border-success text-white animate-checkPop' : 'bg-white border-[#E8312A] text-[#E8312A] animate-pulseRing'}
                                            `}
                                            aria-label={customSponsorStep === "click" || isComplete ? "Step 1 complete" : "Current Step: Watch Video"}
                                            role="status"
                                            >
                                                {(customSponsorStep === "click" || isComplete) ? <Check size={18} strokeWidth={3} /> : <Play size={16} fill="currentColor" />}
                                            </div>
                                            <span className={`text-[11px] font-[700] ${customSponsorStep === "watch" && !isComplete ? 'text-[#E8312A]' : 'text-[#AAA]'}`}>
                                                Watch Video
                                            </span>
                                        </div>

                                        {requiresClick && (
                                            <>
                                                <div className="w-8 sm:w-16 h-[2px] -mt-[18px] relative overflow-hidden flex items-center">
                                                    <div className="absolute inset-0 border-t-[2px] border-dashed border-[#E8E8E8]" />
                                                    <div className={`absolute inset-y-0 left-0 bg-success transition-all duration-400 ease-out ${(customSponsorStep === "click" || isComplete) ? 'w-full' : 'w-0'}`} />
                                                </div>
                                                <div className="flex flex-col items-center gap-2 relative">
                                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 z-10 shadow-sm transition-all duration-300
                                                        ${isComplete ? 'bg-success border-success text-white animate-checkPop' :
                                                            customSponsorStep === "click" ? 'bg-white border-[#6366F1] text-[#6366F1] animate-pulseRing' :
                                                                'bg-white border-[#E8E8E8] text-[#AAA]'}
                                                    `}
                                                    aria-label={isComplete ? "Step 2 complete" : customSponsorStep === "click" ? "Current Step: Visit Sponsor" : "Step 2 pending: Visit Sponsor"}
                                                    role="status"
                                                    >
                                                        {isComplete ? <Check size={18} strokeWidth={3} /> : <MousePointerClick size={16} />}
                                                    </div>
                                                    <span className={`text-[11px] font-[700] ${isComplete ? 'text-[#AAA]' : customSponsorStep === "click" ? 'text-[#6366F1]' : 'text-[#AAA]'}`}>
                                                        Visit Sponsor
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="text-center mb-5">
                                        <p className={`text-[14px] font-[700] mb-1 ${customSponsorStep === "click" ? 'text-[#6366F1]' : 'text-[#444]'}`}>
                                            {customSponsorStep === "click" ? "Great \u2014 now visit the sponsor's site to unlock your content." : "Watch the sponsor video, then visit their site to unlock."}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleUnlockClick}
                                        className={`w-full h-[54px] ${buttonBg} text-white font-black text-[15px] rounded-[14px] flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]`}
                                    >
                                        {buttonIcon}
                                        {buttonText}
                                    </button>
                                </>
                            )}
                            
                            {resource.unlockType === 'email_subscribe' && resource.emailConfig && (
                                <EmailUnlock config={resource.emailConfig} onComplete={() => registerVideoWatch(false)} />
                            )}
                            
                            {resource.unlockType === 'social_follow' && resource.socialConfig && (
                                <SocialUnlock config={resource.socialConfig} onComplete={() => registerVideoWatch(false)} />
                            )}
                            
                            {resource.unlockType === 'follower_pairing' && resource.followerPairingConfig && (
                                <FollowerPairingUnlock config={resource.followerPairingConfig} onComplete={() => registerVideoWatch(false)} />
                            )}
                        </>
                    ) : (
                        <div className="animate-fadeIn">
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="w-full h-[56px] bg-success hover:bg-success/90 text-white font-black text-[16px] rounded-[14px] flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] mb-2"
                            >
                                {isDownloading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Download size={20} strokeWidth={2.5} />
                                        Download {resource.fileType}
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[12px] font-bold text-textMid mb-8 mt-1">
                                {resource.fileSize} • {resource.fileType} Secure Download
                            </p>

                            <div className="mb-8">
                                <p className="text-[14px] font-black text-center text-text mb-4">Share this free resource with your friends</p>
                                <div className="flex justify-center gap-3">
                                    <button className="flex-1 h-10 bg-[#000000] text-white rounded-full flex items-center justify-center gap-2 font-bold text-[13px] hover:opacity-90">
                                        <Twitter size={16} /> Twitter
                                    </button>
                                    <button className="flex-1 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center gap-2 font-bold text-[13px] hover:opacity-90">
                                        <MessageCircle size={16} /> WhatsApp
                                    </button>
                                    <button className="flex-1 h-10 bg-surfaceAlt text-text rounded-full flex items-center justify-center gap-2 font-bold text-[13px] hover:bg-border">
                                        <Copy size={16} /> Copy
                                    </button>
                                </div>
                            </div>

                            <div className="w-full bg-white border border-border rounded-[14px] p-4 flex items-center justify-between mb-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold text-[16px]">
                                        {resource.creatorAvatar}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-[14px]">{resource.creatorName}</span>
                                        <span className="text-[12px] font-bold text-textMid">Creator on AdGate</span>
                                    </div>
                                </div>
                                <Link to={`/@${resource.creatorHandle}`} className="px-4 h-8 flex items-center justify-center rounded-full bg-brand/10 text-brand font-black text-[12px] hover:bg-brand/20 transition-colors">
                                    Follow
                                </Link>
                            </div>

                            <div className="w-full bg-surfaceAlt border border-border rounded-[14px] p-5 flex flex-col items-center text-center">
                                <h3 className="font-black text-[15px] mb-1">Want to earn from your own free content?</h3>
                                <p className="text-[13px] font-semibold text-textMid mb-4">Join 10,000+ creators earning with AdGate links.</p>
                                <Link to="/" className="w-full sm:w-auto px-6 h-10 flex items-center justify-center rounded-[14px] bg-brand text-white font-black text-[14px] hover:bg-brand-hover shadow-sm">
                                    Create Free Link
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {isShowingAd && (!resource.unlockType || resource.unlockType === 'custom_sponsor') && (
                customSponsorStep === "click" ? (
                    <SponsorClickInterstitial
                        customAd={resource.customAd}
                        onClick={handleSponsorClick}
                        onClose={handleAdClose}
                        popupBlocked={popupBlocked}
                        onFallbackClick={handleSponsorClickFallback}
                    />
                ) : (
                    <VideoAdViewer
                        onCompleted={handleVideoComplete}
                        onSkip={handleVideoSkip}
                        isCustom={true}
                        customAd={resource.customAd!}
                        requiresClick={requiresClick}
                    />
                )
            )}
        </div>
    );
};

// Step 2 Click Interstitial for Custom Sponsors
const SponsorClickInterstitial = ({ customAd, onClick, onClose, popupBlocked, onFallbackClick }: { customAd: CustomAdData | undefined, onClick: () => void, onClose: () => void, popupBlocked?: boolean, onFallbackClick?: () => void }) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-fadeIn p-4 sm:p-8 items-center justify-center" role="dialog" aria-modal="true">
            {/* Deliberately no close button on Step 2; encourages click or abandonment */}
            <div className="w-full max-w-[400px] bg-white rounded-[24px] overflow-hidden flex flex-col items-center border border-border shadow-2xl relative pb-6">
                <div className="w-full h-12 bg-[#EDE9FE] flex items-center justify-center gap-2 border-b border-[#C4B5FD] mb-6 shadow-sm">
                    <span className="text-[13px] font-black text-[#6366F1] uppercase tracking-wider">Step 2 Required</span>
                </div>

                <div className="px-6 flex flex-col items-center w-full">
                    <div className="w-16 h-16 bg-surfaceAlt rounded-[16px] mb-4 flex items-center justify-center border border-border shadow-sm text-3xl font-black text-brand">
                        {customAd?.brandName ? customAd.brandName[0].toUpperCase() : "B"}
                    </div>
                    <h2 className="text-[22px] font-black tracking-tight leading-tight text-center mb-4">
                        Almost there. One last step!
                    </h2>

                    <div className="w-full bg-surfaceAlt rounded-[16px] p-4 flex flex-col gap-4 mb-6 border border-border">
                        <div className="flex items-start gap-3 opacity-50">
                            <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center shrink-0 mt-0.5">
                                <Check size={12} className="text-white" strokeWidth={3} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-text line-through">1. Watch the sponsor video</span>
                                <span className="text-[11px] font-[600] text-textMid mt-0.5">Completed</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#6366F1] flex items-center justify-center shrink-0 mt-0.5 text-white font-black text-[12px] shadow-sm">
                                2
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-text">Click below to visit the sponsor</span>
                                <span className="text-[12px] font-[600] text-textMid mt-1 leading-relaxed">
                                    This supports <span className="font-bold text-text">{customAd?.brandName}</span> who made this resource free for you. It opens in a new tab.
                                </span>
                            </div>
                        </div>
                    </div>

                    {popupBlocked ? (
                        <div className="w-full flex flex-col gap-2">
                            <p className="text-[12px] font-bold text-error text-center mb-1">Popup blocked! Please click the link below directly.</p>
                            <a
                                href={customAd?.redirectUrl || undefined}
                                target="_blank"
                                rel="noreferrer"
                                onClick={onFallbackClick}
                                className="w-full h-[56px] rounded-[16px] bg-[#6366F1] hover:bg-[#4F46E5] flex items-center justify-center text-white font-black text-[16px] shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {customAd?.ctaText || "Visit Sponsor"} <ArrowRight size={18} className="ml-2" />
                            </a>
                        </div>
                    ) : (
                        <button
                            onClick={onClick}
                            className="w-full h-[56px] rounded-[16px] bg-[#6366F1] hover:bg-[#4F46E5] flex items-center justify-center text-white font-black text-[16px] shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {customAd?.ctaText || "Visit Sponsor"} <ArrowRight size={18} className="ml-2" />
                        </button>
                    )}
                    
                    <button onClick={onClose} className="mt-5 text-textLight hover:text-textMid text-[12px] font-bold hover:underline transition-colors w-full h-[32px]">
                        I don't want the free resource anymore
                    </button>
                </div>
            </div>
        </div>
    );
};

const ResourceNotFound = () => (
    <div className="min-h-screen bg-bg flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="text-[48px] mb-4">🔗</div>
            <h1 className="text-[22px] font-black text-[#111] mb-2">This link doesn't exist</h1>
            <p className="text-[14px] font-bold text-textMid mb-8 max-w-[360px]">The creator may have deleted this resource or the link is incorrect.</p>

            <div className="flex items-center gap-3 mb-12 flex-col sm:flex-row w-full max-w-[400px]">
                <Link to="/" className="w-full sm:w-auto flex-1 h-[44px] bg-[#E8312A] text-white font-black text-[14px] rounded-[14px] flex items-center justify-center hover:bg-[#C0392B] shadow-sm">
                    Go Home
                </Link>
                <Link to="/explore" className="w-full sm:w-auto flex-1 h-[44px] bg-transparent border-2 border-[#E8312A] text-[#E8312A] font-black text-[14px] rounded-[14px] flex items-center justify-center hover:bg-[#FFF0EF] shadow-sm">
                    Explore Resources
                </Link>
            </div>

            <div className="flex items-center gap-1.5 opacity-60">
                <div className="w-5 h-5 rounded-[6px] bg-text text-white flex items-center justify-center font-black text-[9px] leading-none">
                    AG
                </div>
                <span className="font-black text-[13px] tracking-tight text-text">AdGate</span>
            </div>
        </div>
    </div>
);

const ResourceDisabled = () => (
    <div className="min-h-screen bg-bg flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="text-[48px] mb-4">🔒</div>
            <h1 className="text-[22px] font-black text-[#111] mb-2">This resource is no longer available</h1>
            <p className="text-[14px] font-bold text-textMid mb-8 max-w-[360px]">The creator has paused this link.</p>

            <div className="flex items-center gap-3 mb-12 flex-col sm:flex-row w-full max-w-[400px]">
                <Link to="/explore" className="w-full sm:w-auto px-6 h-[44px] bg-[#E8312A] text-white font-black text-[14px] rounded-[14px] flex items-center justify-center hover:bg-[#C0392B] shadow-sm">
                    Explore Free Resources
                </Link>
            </div>

            <div className="flex items-center gap-1.5 opacity-60">
                <div className="w-5 h-5 rounded-[6px] bg-text text-white flex items-center justify-center font-black text-[9px] leading-none">
                    AG
                </div>
                <span className="font-black text-[13px] tracking-tight text-text">AdGate</span>
            </div>
        </div>
    </div>
);
