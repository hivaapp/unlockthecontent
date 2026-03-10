import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'default';

interface ToastOptions {
    message: string;
    type?: ToastType;
}

interface ToastContextType {
    showToast: (options: ToastOptions | string) => void;
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [isExiting, setIsExiting] = useState(false);

    const showToast = useCallback((options: ToastOptions | string) => {
        if (typeof options === 'string') {
            options = { message: options, type: 'default' };
        }

        const { message, type = 'default' } = options;

        if (toast) {
            setIsExiting(true);
            setTimeout(() => {
                setToast({ message, type });
                setIsExiting(false);
            }, 300); // Wait for exit animation
        } else {
            setToast({ message, type });
            setIsExiting(false);
        }
    }, [toast]);

    useEffect(() => {
        if (toast && !isExiting) {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => {
                    setToast(null);
                    setIsExiting(false);
                }, 300);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast, isExiting]);

    const addToast = useCallback((message: string, type: ToastType = 'default') => {
        showToast({ message, type });
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, addToast }}>
            {children}
            {toast && (
                <div
                    className={`fixed z-[100] top-0 left-0 w-full sm:w-auto sm:top-4 sm:right-4 sm:left-auto px-4 pt-[72px] sm:pt-0 pointer-events-none flex justify-center
                        ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
                >
                    <div
                        className={`bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-border rounded-[12px] p-4 flex items-center gap-3 backdrop-blur-md min-h-[52px] w-full sm:w-[320px] pointer-events-auto overflow-hidden`}
                    >
                        {/* Status border indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${toast.type === 'success' ? 'bg-success' :
                            toast.type === 'error' ? 'bg-error' :
                                    'bg-brand'
                            }`} />

                        <div className="pl-1 flex-shrink-0">
                            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-success" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-error" />}
                            {toast.type === 'default' && <CheckCircle2 className="w-5 h-5 text-brand" />}
                        </div>
                        <p className="font-nunito font-bold text-[13px] text-text leading-tight m-0">
                            {toast.message}
                        </p>
                    </div>
                </div>
            )}
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
