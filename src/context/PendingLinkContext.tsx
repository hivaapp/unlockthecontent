import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { uploadFile } from '../services/uploadService';
import { createLink } from '../services/linksService';
import { getContentFile, getSponsorVideo, getCompletionRewardFile, clearAll } from '../stores/pendingFileStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export type RecoveryStatus = 'idle' | 'recovering' | 'uploading_file' | 'creating_link' | 'complete' | 'error';

interface PendingLinkContextType {
    recoveryStatus: RecoveryStatus;
    recoveryError: string | null;
    createdLink: { id: string, slug: string } | null;
}

const PendingLinkContext = createContext<PendingLinkContextType | undefined>(undefined);

export const PendingLinkProvider = ({ children }: { children: ReactNode }) => {
    const { isLoggedIn, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>('idle');
    const [recoveryError, setRecoveryError] = useState<string | null>(null);
    const [createdLink, setCreatedLink] = useState<{ id: string, slug: string } | null>(null);

    // Guard against double-execution (e.g. both isLoggedIn and currentUser trigger the effect)
    const recoveryAttemptedRef = useRef(false);

    const startRecovery = async (userId: string) => {
        const pendingLinkStr = localStorage.getItem('hivaapp_pending_link');
        if (!pendingLinkStr) return;

        try {
            const pendingLink = JSON.parse(pendingLinkStr);
            
            // Check staleness (24 hours)
            const savedAt = new Date(pendingLink.savedAt).getTime();
            if (Date.now() - savedAt > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('hivaapp_pending_link');
                clearAll();
                return;
            }

            setRecoveryStatus('recovering');
            setRecoveryError(null);

            // Navigate to dashboard immediately so user sees the progress overlay
            if (location.pathname !== '/dashboard') {
                navigate('/dashboard');
            }

            let contentFileId: string | null = null;
            let sponsorVideoId: string | null = null;
            let completionRewardFileId: string | null = null;

            // ── Upload Content File ─────────────────────────────────────
            if (pendingLink.fileMetadata) {
                const contentFile = getContentFile();
                if (contentFile) {
                    setRecoveryStatus('uploading_file');
                    try {
                        const uploadResult = await uploadFile(contentFile, 'content', { onProgress: () => {} });
                        contentFileId = uploadResult.fileId;
                    } catch (uploadErr: any) {
                        console.warn('[PendingLink] Content file upload failed, proceeding without file:', uploadErr.message);
                    }
                } else {
                    console.warn('[PendingLink] Content file metadata present but file lost (page was refreshed). Proceeding without file.');
                }
            }

            // ── Upload Sponsor Video ────────────────────────────────────
            if (pendingLink.hasSponsorVideo) {
                const sponsorVideo = getSponsorVideo();
                if (sponsorVideo) {
                    setRecoveryStatus('uploading_file');
                    try {
                        const uploadResult = await uploadFile(sponsorVideo, 'sponsor', { onProgress: () => {} });
                        sponsorVideoId = uploadResult.fileId;
                    } catch (uploadErr: any) {
                        console.warn('[PendingLink] Sponsor video upload failed:', uploadErr.message);
                    }
                } else {
                    console.warn('[PendingLink] Sponsor video file was lost (page was refreshed). Link will be created without sponsor video.');
                }
            }

            // ── Upload Completion Reward File (follower_pairing) ─────────
            if (pendingLink.pairingConfig?.hasCompletionFile) {
                const completionFile = getCompletionRewardFile();
                if (completionFile) {
                    setRecoveryStatus('uploading_file');
                    try {
                        const uploadResult = await uploadFile(completionFile, 'assets', { onProgress: () => {} });
                        completionRewardFileId = uploadResult.fileId;
                    } catch (uploadErr: any) {
                        console.warn('[PendingLink] Completion reward file upload failed:', uploadErr.message);
                    }
                } else {
                    console.warn('[PendingLink] Completion reward file was lost (page was refreshed). Proceeding without it.');
                }
            }

            setRecoveryStatus('creating_link');
            
            // ── Build sponsor config ────────────────────────────────────
            let sponsorConfig = null;
            if (pendingLink.unlockType === 'custom_sponsor' && pendingLink.sponsorConfig) {
                sponsorConfig = {
                    ...pendingLink.sponsorConfig,
                    videoFileId: sponsorVideoId ?? null,
                };
            }

            // ── Build pairing config ────────────────────────────────────
            let pairingConfig = null;
            if (pendingLink.mode === 'follower_pairing' && pendingLink.pairingConfig) {
                const pc = pendingLink.pairingConfig;
                pairingConfig = {
                    topic: pc.topic,
                    description: pc.description || null,
                    commitmentPrompt: pc.commitmentPrompt || 'What specific goal will you commit to for this challenge?',
                    durationDays: pc.durationDays || 7,
                    checkInFrequency: pc.checkInFrequency || 'daily',
                    guidelines: pc.guidelines || null,
                    creatorResourceUrl: pc.creatorResourceUrl || null,
                    creatorResourceLabel: pc.creatorResourceLabel || null,
                    isAccepting: pc.isAccepting !== false,
                    scheduledMessages: (pc.scheduledMessages || []).map((m: any, i: number) => ({
                        dayNumber: m.dayNumber,
                        sendTime: m.sendTime || '09:00:00',
                        content: m.content,
                        links: m.links || [],
                        linkUrl: m.linkUrl || null,
                        linkLabel: m.linkLabel || null,
                        youtubeUrl: m.youtubeUrl || null,
                        sortOrder: m.sortOrder ?? i,
                    })),
                    completionAsset: pc.completionAsset ? {
                        enabled: true,
                        fileId: completionRewardFileId || null,
                        unlockMessage: pc.completionAsset.unlockMessage || null,
                        resourceTitle: pc.completionAsset.resourceTitle || null,
                        resourceDescription: pc.completionAsset.resourceDescription || null,
                        bonusMessage: pc.completionAsset.bonusMessage || null,
                        links: pc.completionAsset.links || [],
                        additionalLinks: (pc.completionAsset.additionalLinks || []).map((l: any) => ({
                            url: l.url || '',
                            label: l.label || null,
                        })),
                        youtubeUrl: pc.completionAsset.youtubeUrl || null,
                    } : null,
                };
            }

            // ── Prepare link data payload ───────────────────────────────
            const linkDataPayload: any = {
                title: pendingLink.title,
                description: pendingLink.description || null,
                textContent: pendingLink.textContent || null,
                contentLinks: pendingLink.contentLinks || [],
                mode: pendingLink.mode,
                unlockType: pendingLink.unlockType,
                fileId: contentFileId,
                youtubeUrl: pendingLink.youtubeUrl || null,
                donateEnabled: pendingLink.donateEnabled || false,
                // Pass configs only for their respective types
                emailConfig: pendingLink.unlockType === 'email_subscribe' ? pendingLink.emailConfig : null,
                socialConfig: pendingLink.unlockType === 'social_follow' ? pendingLink.socialConfig : null,
                sponsorConfig,
                pairingConfig,
                status: 'active',
            };

            console.log('[PendingLink] Creating link with payload:', linkDataPayload);

            const created = await createLink(userId, linkDataPayload);
            
            setCreatedLink(created);
            setRecoveryStatus('complete');
            
            localStorage.removeItem('hivaapp_pending_link');
            clearAll();

            navigate(`/dashboard?tab=home&newLink=${created.slug}`);

        } catch (err: any) {
            console.error('[PendingLink] Recovery error:', err);
            setRecoveryStatus('error');
            setRecoveryError(err.message || 'Failed to recover link. Please try creating it again from your dashboard.');
        }
    };

    // Reset recovery state whenever the user logs OUT.
    // This is critical — without this, `recoveryAttemptedRef` stays `true` forever
    // after the first recovery, blocking every subsequent login attempt.
    useEffect(() => {
        if (!isLoggedIn) {
            recoveryAttemptedRef.current = false;
            setRecoveryStatus('idle');
            setRecoveryError(null);
            setCreatedLink(null);
        }
    }, [isLoggedIn]);

    // Auto trigger recovery on login — wait until both isLoggedIn AND currentUser are confirmed.
    useEffect(() => {
        if (isLoggedIn && currentUser?.id && !recoveryAttemptedRef.current) {
            const pendingLinkStr = localStorage.getItem('hivaapp_pending_link');
            if (pendingLinkStr) {
                recoveryAttemptedRef.current = true; // prevent double-run within same session
                startRecovery(currentUser.id);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, currentUser?.id]);

    return (
        <PendingLinkContext.Provider value={{ recoveryStatus, recoveryError, createdLink }}>
            {children}

            {/* Global Recovery Overlay */}
            {(recoveryStatus === 'recovering' || recoveryStatus === 'uploading_file' || recoveryStatus === 'creating_link') && (
                <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[24px] p-6 max-w-[320px] w-full shadow-2xl flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-[#FFF8F3] rounded-full flex items-center justify-center mb-4 relative">
                            <Loader2 className="w-8 h-8 text-[#D97757] animate-spin absolute" />
                        </div>
                        <h3 className="text-[18px] font-black text-[#111] mb-2">
                            {recoveryStatus === 'uploading_file' ? 'Uploading Files...' : 'Creating your link...'}
                        </h3>
                        <p className="text-[14px] text-[#666] leading-relaxed">
                            Please wait while we secure your files and set up your new link.
                        </p>
                    </div>
                </div>
            )}
        </PendingLinkContext.Provider>
    );
};

export const usePendingLinkRecovery = () => {
    const context = useContext(PendingLinkContext);
    if (!context) throw new Error("usePendingLinkRecovery must be used within PendingLinkProvider");
    return context;
};
