import { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';

export const PullToRefresh = ({ onRefresh, children }: { onRefresh: () => Promise<void>, children: ReactNode }) => {
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { startProgress, stopProgress } = useProgress();

    const maxPull = 120;
    const threshold = 70;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (containerRef.current && containerRef.current.scrollTop <= 0) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY > 0 && !refreshing && containerRef.current && containerRef.current.scrollTop <= 0) {
            const currentY = e.touches[0].clientY;
            let distance = currentY - startY;

            if (distance > 0) {
                // Determine friction
                const pullPercent = Math.min(distance / window.innerHeight, 1);
                distance = distance * (1 - pullPercent * 0.5); // Increase friction as pulled down
                setPullDistance(Math.min(distance, maxPull));
            }
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance > threshold && !refreshing) {
            setRefreshing(true);
            setPullDistance(60); // hold height
            startProgress();
            await onRefresh();
            stopProgress();
            setRefreshing(false);
            setPullDistance(0);
        } else {
            setPullDistance(0);
        }
        setStartY(0);
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-y-auto overscroll-y-none relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className="w-full flex justify-center items-end pb-4 absolute left-0 top-0 overflow-hidden pointer-events-none z-0"
                style={{
                    height: `${pullDistance}px`,
                }}
            >
                {pullDistance > 0 && (
                    <RefreshCw
                        size={20}
                        className={`text-textMid ${refreshing ? 'animate-spin opacity-100' : 'opacity-60'}`}
                        style={{ transform: `rotate(${pullDistance * 3}deg)` }}
                        strokeWidth={2.5}
                    />
                )}
            </div>

            <div
                className="w-full relative z-10 bg-bg min-h-full transition-transform"
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: startY > 0 ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {children}
            </div>
        </div>
    );
};
