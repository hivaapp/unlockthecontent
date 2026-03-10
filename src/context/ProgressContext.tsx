import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

interface ProgressContextType {
    startProgress: () => void;
    stopProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider = ({ children }: { children: ReactNode }) => {
    const [isProgressing, setIsProgressing] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<number | null>(null);

    const startProgress = useCallback(() => {
        setIsProgressing(true);
        setProgress(30);
        // Simulate progress bar moving
        const interval = window.setInterval(() => {
            setProgress((prev) => {
                if (prev > 85) return prev;
                return prev + Math.random() * 10;
            });
        }, 300);

        intervalRef.current = interval;
    }, []);

    const stopProgress = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setProgress(100);
        setTimeout(() => {
            setIsProgressing(false);
            setProgress(0);
        }, 300);
    }, []);

    return (
        <ProgressContext.Provider value={{ startProgress, stopProgress }}>
            {children}
            {isProgressing && (
                <div id="nprogress">
                    <div
                        className="bar"
                        style={{ width: `${progress}%`, transition: 'width 200ms ease' }}
                    >
                        <div className="peg" />
                    </div>
                </div>
            )}
        </ProgressContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProgress = () => {
    const context = useContext(ProgressContext);
    if (!context) throw new Error('useProgress used outside Provider');
    return context;
};
