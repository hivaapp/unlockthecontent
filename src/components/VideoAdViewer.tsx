import { useState, useEffect } from 'react';
import type { CustomAdData } from './CustomSponsorForm';
import { Play } from 'lucide-react';

interface VideoAdViewerProps {
    onCompleted: () => void;
    onSkip: () => void;
    isCustom?: boolean;
    customAd: Partial<CustomAdData>;
    requiresClick?: boolean;
}

export function VideoAdViewer({ onCompleted, onSkip, customAd, requiresClick }: VideoAdViewerProps) {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    const skipAfterVal = customAd.skipAfter || 5;
    const durationVal = 15;

    const canSkip = currentTime >= skipAfterVal;
    const isCompleted = currentTime >= durationVal;

    useEffect(() => {
        if (!isPlaying || isCompleted) return;

        const timer = setInterval(() => {
            setCurrentTime(prev => {
                const next = prev + 1;
                if (next >= durationVal) {
                    clearInterval(timer);
                    onCompleted();
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isPlaying, isCompleted, durationVal, onCompleted]);

    const handleSkip = () => {
        if (canSkip) {
            onSkip();
        }
    };

    const brand = customAd.brandName || "Brand";
    const logoEmoji = '✨';
    const tagline = 'Supported by our partner';
    const headline = customAd.brandName || "Brand";
    const subtext = 'Sponsor Message';

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black animate-fadeIn" role="dialog" aria-modal="true">
            {/* Top Bar with Skip/Timer */}
            <div className="h-14 w-full flex items-center justify-between px-4 sm:px-6 bg-gradient-to-b from-black/80 to-transparent shrink-0 absolute top-0 left-0 right-0 z-20">
                <span className="text-[12px] text-white/90 font-bold bg-white/20 px-2 py-1 rounded-[14px]">Sponsor • {brand}</span>

                {requiresClick && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-[rgba(255,255,255,0.15)] text-[10px] sm:text-[11px] font-black text-white px-3 py-1 rounded-full backdrop-blur-md hidden sm:block">
                        STEP 1 OF 2
                    </div>
                )}

                {canSkip ? (
                    <button
                        onClick={handleSkip}
                        className="h-9 px-4 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full font-bold text-[13px] backdrop-blur-md transition-colors"
                    >
                        Skip Video →
                    </button>
                ) : (
                    <span className="h-9 px-4 flex items-center justify-center bg-black/40 text-white rounded-full font-bold text-[13px] backdrop-blur-md">
                        Skip in {Math.max(0, skipAfterVal - currentTime)}s
                    </span>
                )}
            </div>

            {/* Simulated Video Content */}
            <div
                className="flex-1 w-full h-full relative overflow-hidden flex flex-col items-center justify-center bg-[#111]"
            >
                {/* Play/Pause overlay */}
                <div className="absolute inset-0 z-10 flex cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
                    {!isPlaying && !isCompleted && (
                        <div className="m-auto w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90">
                            <Play size={24} fill="currentColor" />
                        </div>
                    )}
                </div>

                {/* Simulated visuals */}
                <div className="relative z-0 flex flex-col items-center text-center p-8 scale-110 sm:scale-100 transition-transform duration-[10s] ease-linear" style={{ transform: `scale(${1 + (currentTime * 0.05)})` }}>
                    <div className="text-[80px] leading-none mb-6 drop-shadow-2xl">{logoEmoji}</div>
                    <h2 className="text-[32px] sm:text-[40px] font-black tracking-tight leading-tight max-w-[400px] text-white">
                        {headline}
                    </h2>
                    <p className="mt-4 text-[18px] sm:text-[20px] font-[800] opacity-90 max-w-[360px] text-white">
                        {subtext}
                    </p>
                </div>
            </div>

            {/* Bottom Bar progress */}
            <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col bg-gradient-to-t from-black/90 to-transparent pt-12">
                <div className="px-4 sm:px-6 pb-6 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-white font-black text-[18px] drop-shadow-md flex items-center gap-2">
                            {brand}
                        </span>
                        <span className="text-white/80 font-bold text-[13px]">{tagline}</span>
                    </div>
                </div>
                {/* Progress bar line */}
                <div className="h-1 w-full bg-white/20">
                    <div className="h-full bg-brand transition-all duration-1000 ease-linear" style={{ width: `${(currentTime / durationVal) * 100}%` }}></div>
                </div>
            </div>
        </div>
    );
}
