import { useState } from 'react';
import { BottomSheet } from './BottomSheet';

interface ConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    confirmText: string;
    cancelText?: string;
    onConfirm: () => Promise<void> | void;
    isDanger?: boolean;
}

export const ConfirmationBottomSheet = ({
    isOpen,
    onClose,
    title,
    description,
    confirmText,
    cancelText = 'Cancel',
    onConfirm,
    isDanger = false,
}: ConfirmationProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            await onConfirm();
        } finally {
            setIsLoading(false);
            onClose();
        }
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col h-full justify-between">
                <div className="pt-2 text-[14px] text-textMid leading-relaxed mb-6">
                    {description}
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`btn-primary w-full h-[52px] ${isDanger ? 'bg-error hover:bg-red-700' : 'bg-brand'}`}
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="btn-secondary w-full h-[52px] border-none text-textMid hover:bg-surfaceAlt"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
};
