import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { X } from 'lucide-react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    fullHeight?: boolean;
}

export const BottomSheet = ({ isOpen, onClose, title, children, fullHeight = false }: BottomSheetProps) => {
    const [shouldRender, setShouldRender] = useState(isOpen);

    if (isOpen && !shouldRender) {
        setShouldRender(true);
    }

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (!isOpen && shouldRender) {
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [isOpen, shouldRender]);

    if (!shouldRender) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-text/40 backdrop-blur-sm transition-opacity duration-[400ms] ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Sheet/Modal Container */}
            <div
                className={`relative w-full bg-white flex flex-col transition-all duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]
                    ${isOpen ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-full opacity-0 sm:translate-y-0 sm:scale-95'}
                    ${fullHeight ? 'h-[92vh]' : 'max-h-[85vh]'}
                    rounded-t-[20px] sm:rounded-[20px] sm:w-[500px] sm:h-auto overflow-hidden`}
            >
                {/* Drag Handle (Mobile only, visual only) */}
                <div className="sm:hidden w-full flex justify-center pt-3 pb-2 flex-shrink-0 bg-white">
                    <div className="w-10 h-1 bg-border rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-4 pt-1 sm:pt-4 flex-shrink-0 bg-white border-b border-border/50">
                    <div className="w-9" /> {/* Spacer */}
                    <h2 className="text-[17px] font-black text-text m-0">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-surfaceAlt text-textMid hover:text-text transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto w-full p-4 relative bg-white pb-[env(safe-area-inset-bottom,16px)]">
                    {children}
                </div>
            </div>
        </div>
    );
};
