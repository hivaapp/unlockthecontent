import { Copy, ChartBar, EyeOff, Trash2, ShieldAlert } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { useToast } from '../../context/ToastContext';
import type { DashboardLink } from './tabs/LinksTab';
interface MoreActionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    link: DashboardLink;
    onDelete: () => void;
    onDisable: () => void;
    onAnalytics: () => void;
}

export const MoreActionSheet = ({ isOpen, onClose, link, onDelete, onDisable, onAnalytics }: MoreActionSheetProps) => {
    const { showToast } = useToast();
    const isDisabled = link.status === 'disabled';

    const handleCopy = async () => {
        const text = link.url;
        let success = false;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                showToast({ message: 'Link copied to clipboard', type: 'success' });
                success = true;
            } else {
                throw new Error('Clipboard API unavailable');
            }
        } catch (err) {
            // Legacy Fallback
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    showToast({ message: 'Link copied to clipboard', type: 'success' });
                    success = true;
                }
            } catch (fallbackErr) {
                console.error('Fallback copy failed', fallbackErr);
            }
        }

        if (success) {
            onClose();
        } else {
            showToast({ message: 'Failed to copy link', type: 'error' });
        }
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="More Options">
            <div className="flex flex-col gap-0 pb-4">
                <button
                    onClick={handleCopy}
                    className="w-full h-[52px] flex items-center gap-4 px-2 border-b border-border/50 text-text hover:bg-surfaceAlt transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-surfaceAlt flex items-center justify-center text-textMid shrink-0">
                        <Copy size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-[15px] font-bold">Copy Link</span>
                </button>

                <button
                    onClick={() => {
                        onAnalytics();
                        onClose();
                    }}
                    className="w-full h-[52px] flex items-center gap-4 px-2 border-b border-border/50 text-text hover:bg-surfaceAlt transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-surfaceAlt flex items-center justify-center text-textMid shrink-0">
                        <ChartBar size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-[15px] font-bold">View Subscribers & Analytics</span>
                </button>

                <button
                    onClick={onDisable}
                    className="w-full h-[52px] flex items-center gap-4 px-2 border-b border-border/50 text-text hover:bg-surfaceAlt transition-colors"
                >
                    <div className={`w-8 h-8 rounded-full ${isDisabled ? 'bg-successBg text-success' : 'bg-warningBg text-warning'} flex items-center justify-center shrink-0`}>
                        {isDisabled ? <ShieldAlert size={16} strokeWidth={2.5} /> : <EyeOff size={16} strokeWidth={2.5} />}
                    </div>
                    <span className="text-[15px] font-bold">
                        {isDisabled ? 'Activate Link' : 'Disable Link'}
                    </span>
                </button>

                <button
                    onClick={onDelete}
                    className="w-full h-[52px] flex items-center gap-4 px-2 border-b border-border/50 text-error hover:bg-errorBg transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-errorBg flex items-center justify-center text-error shrink-0">
                        <Trash2 size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-[15px] font-bold">Delete Link</span>
                </button>

                <button
                    onClick={onClose}
                    className="w-full h-[52px] flex items-center justify-center px-2 mt-2 text-textMid hover:text-text hover:bg-surfaceAlt transition-colors font-bold rounded-[14px]"
                >
                    Cancel
                </button>
            </div>
        </BottomSheet>
    );
};
