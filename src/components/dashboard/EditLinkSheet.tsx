import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { FileIcon, BarChart2, TrendingUp, Users } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';
import { updateLink } from '../../services/linksService';
import { useToast } from '../../context/ToastContext';

interface EditLinkSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    link: any; // Using any for simplicity here to accept DashboardLink or LinkData
}

export const EditLinkSheet = ({ isOpen, onClose, onSuccess, link }: EditLinkSheetProps) => {
    const [title, setTitle] = useState(link?.title || '');
    const [desc, setDesc] = useState(link?.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [prevLink, setPrevLink] = useState(link);

    const { startProgress, stopProgress } = useProgress();
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    if (link !== prevLink) {
        setPrevLink(link);
        if (link) {
            setTitle(link.title);
            setDesc(link.description || '');
        }
    }

    const handleSubmit = async () => {
        if (!link || !currentUser?.id) return;
        setIsSubmitting(true);
        startProgress();

        try {
            await updateLink(link.id, currentUser.id, {
                title,
                description: desc,
            });

            stopProgress();
            onSuccess();
        } catch (err: any) {
            stopProgress();
            showToast({ message: err.message || 'Failed to update link', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate mock analytics
    const views = link?.viewCount || link?.views || 0;
    const unlocks = link?.unlockCount || link?.unlocks || 0;
    const conversionRate = views > 0 ? ((unlocks / views) * 100).toFixed(1) : "0.0";
    
    // For custom sponsors, they keep 100% of their negotiated deal. Give a mock status if there's no custom ad.
    const isCustomSponsor = link?.unlockType === 'custom_sponsor' || !link?.unlockType;

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Edit Link" fullHeight footer={
            <button
                onClick={handleSubmit}
                disabled={!title || isSubmitting}
                className="btn-primary w-full h-[52px] rounded-[14px] text-[16px]"
            >
                {isSubmitting ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    'Save Changes'
                )}
            </button>
        }>
            <div className="flex flex-col gap-[20px]">

                {/* File Info Section */}
                <div className="w-full">
                    <div className="flex flex-col gap-1.5 mb-2">
                        <label className="text-[12px] font-extrabold text-textMid uppercase tracking-wide">Linked Resource</label>
                        <div className="w-full p-3 bg-surfaceAlt border border-border rounded-[12px] flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden pr-2">
                                <div className="w-10 h-10 rounded-[14px] bg-white flex flex-col items-center justify-center flex-shrink-0 text-brand">
                                    <FileIcon size={20} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-[14px] truncate text-text">{link?.title}</span>
                                    <span className="font-bold text-[11px] text-textLight uppercase tracking-wider">{link?.type || 'FILE'}</span>
                                </div>
                            </div>
                            <button className="text-[12px] font-bold text-text bg-white border border-border px-3 h-8 rounded-full flex-shrink-0 hover:border-textMid transition-colors">
                                Replace
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Analytics Summary */}
                <div className="w-full flex flex-col gap-3 p-4 bg-brandTint border border-brand/20 rounded-[14px]">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-black text-brand flex items-center gap-1.5">
                            <BarChart2 size={16} /> Quick Stats
                        </h3>
                        <span className="text-[11px] font-bold text-brand bg-white px-2 py-0.5 rounded-full shadow-sm border border-brand/10">
                            {conversionRate}% Conversion
                        </span>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col">
                            <span className="text-[12px] font-bold text-textMid flex items-center gap-1.5"><Users size={12}/> Views</span>
                            <span className="text-[20px] font-black text-text">{views.toLocaleString()}</span>
                        </div>
                        <div className="w-px bg-brand/20 my-1" />
                        <div className="flex-1 flex flex-col">
                            <span className="text-[12px] font-bold text-textMid flex items-center gap-1.5"><TrendingUp size={12}/> Unlocks</span>
                            <span className="text-[20px] font-black text-text">{unlocks.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mt-1 pt-3 border-t border-brand/10">
                        {isCustomSponsor ? (
                            <p className="text-[12px] font-semibold text-brand/80 leading-tight">
                                ✨ <strong className="font-black text-brand">Custom Sponsor Link:</strong> 100% of the deal is yours. You collect directly from your sponsor.
                            </p>
                        ) : (
                            <p className="text-[12px] font-semibold text-brand/80 leading-tight">
                                💡 Upgrade to a <strong className="font-black">Custom Sponsor</strong> link to display sponsor videos and earn directly.
                            </p>
                        )}
                    </div>
                </div>

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
            </div>
        </BottomSheet>
    );
};
