import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'purple' | 'default';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    isExiting: boolean;
}

interface ToastOptions {
    message: string;
    type?: ToastType;
}

interface ToastContextType {
    showToast: (options: ToastOptions | string, typeOrNone?: ToastType) => void;
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((options: ToastOptions | string, legacyType?: ToastType) => {
        let message: string;
        let type: ToastType = 'default';

        if (typeof options === 'string') {
            message = options;
            type = legacyType || 'default';
        } else {
            message = options.message;
            type = options.type || 'default';
        }

        const id = Math.random().toString(36).substring(2, 9);

        setToasts(prev => {
            const activeToasts = prev.filter(t => !t.isExiting);
            let nextActive = [...activeToasts];
            
            // Limit to max 3 visible toasts. If we have 3, make the oldest one start exiting
            if (nextActive.length >= 3) {
                // Find all active toasts, we need to mark the oldest one as exiting
                const newPrev = prev.map((t, i) => {
                    // Mark the oldest active toast as exiting. Since prev is ordered oldest->newest,
                    // the first non-exiting one is the oldest active.
                    if (!t.isExiting && i === prev.findIndex(t2 => !t2.isExiting)) {
                        return { ...t, isExiting: true };
                    }
                    return t;
                });
                return [...newPrev, { id, message, type, isExiting: false }];
            }

            return [...prev, { id, message, type, isExiting: false }];
        });

        // Auto remove after 3s
        setTimeout(() => {
            setToasts(current =>
                current.map(t => t.id === id ? { ...t, isExiting: true } : t)
            );
            
            // Remove from DOM completely after animation
            setTimeout(() => {
                setToasts(current => current.filter(t => t.id !== id));
            }, 300);
        }, 3000);
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'default') => {
        showToast({ message, type });
    }, [showToast]);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-success" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-error" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
            case 'info': return <Info className="w-5 h-5 text-brand" />;
            case 'purple': return <Sparkles className="w-5 h-5 text-[#8B5CF6]" />;
            default: return <CheckCircle2 className="w-5 h-5 text-brand" />;
        }
    };

    const getBorderColor = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-success';
            case 'error': return 'bg-error';
            case 'warning': return 'bg-warning';
            case 'info': return 'bg-brand';
            case 'purple': return 'bg-[#8B5CF6]';
            default: return 'bg-brand';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, addToast }}>
            {children}
            <div className="fixed z-[100] top-0 left-0 w-full sm:w-auto sm:top-4 sm:right-4 sm:left-auto px-4 pt-[72px] sm:pt-0 pointer-events-none flex flex-col gap-2 justify-start items-center sm:items-end">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-border rounded-[12px] p-4 flex items-center gap-3 backdrop-blur-md min-h-[52px] w-full sm:w-[320px] pointer-events-auto overflow-hidden relative transition-all duration-300
                            ${toast.isExiting ? 'opacity-0 scale-95 translate-y-[-10px]' : 'animate-toast-in'}`}
                    >
                        {/* Status border indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getBorderColor(toast.type)}`} />

                        <div className="pl-1 flex-shrink-0">
                            {getIcon(toast.type)}
                        </div>
                        <p className="font-nunito font-bold text-[13px] text-text leading-tight m-0">
                            {toast.message}
                        </p>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
