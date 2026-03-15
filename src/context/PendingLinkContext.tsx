import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { uploadFile } from '../services/uploadService';
import { createLink } from '../services/linksService';
import { getContentFile, getSponsorVideo, clearAll } from '../stores/pendingFileStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export type RecoveryStatus = 'idle' | 'recovering' | 'uploading_file' | 'creating_link' | 'complete' | 'error';

interface PendingLinkContextType {
    recoveryStatus: RecoveryStatus;
    recoveryError: string | null;
    createdLink: { id: string, slug: string } | null;
    startRecovery: () => Promise<void>;
}

const PendingLinkContext = createContext<PendingLinkContextType | undefined>(undefined);

export const PendingLinkProvider = ({ children }: { children: ReactNode }) => {
    const { isLoggedIn, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>('idle');
    const [recoveryError, setRecoveryError] = useState<string | null>(null);
    const [createdLink, setCreatedLink] = useState<{ id: string, slug: string } | null>(null);

    const startRecovery = async () => {
        const pendingLinkStr = localStorage.getItem('hivaapp_pending_link');
        if (!pendingLinkStr || !currentUser) return;

        try {
            const pendingLink = JSON.parse(pendingLinkStr);
            
            // Check staleness (24 hours)
            const savedAt = new Date(pendingLink.savedAt).getTime();
            if (Date.now() - savedAt > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('hivaapp_pending_link');
                return;
            }

            setRecoveryStatus('recovering');
            setRecoveryError(null);

            // Navigate to dashboard immediately so user sees the progress there instead of old landing state
            if (location.pathname !== '/dashboard') {
                navigate('/dashboard');
            }

            let contentFileId = null;
            let sponsorVideoId = null;

            // Upload Content File
            if (pendingLink.fileMetadata) {
                const contentFile = getContentFile();
                if (contentFile) {
                    setRecoveryStatus('uploading_file');
                    const uploadResult = await uploadFile(contentFile, 'content', { onProgress: () => {} });
                    contentFileId = uploadResult.fileId;
                }
            }

            // Upload Sponsor Video
            if (pendingLink.hasSponsorVideo) {
                const sponsorVideo = getSponsorVideo();
                if (sponsorVideo) {
                    setRecoveryStatus('uploading_file');
                    const uploadResult = await uploadFile(sponsorVideo, 'sponsor', { onProgress: () => {} });
                    sponsorVideoId = uploadResult.fileId;
                }
            }

            setRecoveryStatus('creating_link');
            
            // Prepare link data payload
            const linkDataPayload: any = {
                title: pendingLink.title,
                description: pendingLink.description,
                mode: pendingLink.mode,
                unlockType: pendingLink.unlockType,
                fileId: contentFileId,
                emailConfig: pendingLink.emailConfig,
                socialConfig: pendingLink.socialConfig,
                sponsorConfig: pendingLink.sponsorConfig ? {
                    ...pendingLink.sponsorConfig,
                    videoFileId: sponsorVideoId
                } : null,
                youtubeUrl: pendingLink.youtubeUrl,
                status: 'active'
            };

            const created = await createLink(
                currentUser.id,
                linkDataPayload
            );
            
            setCreatedLink(created);
            setRecoveryStatus('complete');
            
            localStorage.removeItem('hivaapp_pending_link');
            clearAll();

            navigate(`/dashboard?newLink=${created.slug}`);

        } catch (err: any) {
            console.error("Recovery error:", err);
            setRecoveryStatus('error');
            setRecoveryError(err.message || "Failed to recover link");
        }
    };

    // Auto trigger recovery on login
    useEffect(() => {
        if (isLoggedIn && currentUser) {
            const pendingLinkStr = localStorage.getItem('hivaapp_pending_link');
            if (pendingLinkStr) {
                startRecovery();
            }
        }
    }, [isLoggedIn, currentUser]);

    return (
        <PendingLinkContext.Provider value={{ recoveryStatus, recoveryError, createdLink, startRecovery }}>
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
