import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export const OnboardingCarousel = ({ onComplete }: { onComplete: () => void }) => {
    const [step, setStep] = useState(0);

    // Carousel content
    const slides = [
        {
            icon: (
                <div className="flex items-center gap-2">
                    <span className="text-4xl">🔗</span>
                    <span className="text-2xl mt-4">📄</span>
                    <span className="text-4xl mb-4 text-brand mix-blend-multiply">💰</span>
                </div>
            ),
            title: "Share files, earn from ads.",
            desc: "Lock any file behind an ad wall. When users unlock it, you earn money. It's that simple.",
            buttonText: "Next",
            buttonClass: "bg-brand text-white hover:bg-brandHover"
        },
        {
            icon: (
                <div className="flex bg-surfaceAlt p-2 rounded-[14px] border-2 border-brand">
                    <div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center text-text font-black text-xl shadow-sm">1</div>
                    <div className="w-12 h-12 bg-transparent rounded-[14px] flex items-center justify-center text-textMid font-black text-xl">2</div>
                    <div className="w-12 h-12 bg-transparent rounded-[14px] flex items-center justify-center text-textMid font-black text-xl">3</div>
                </div>
            ),
            title: "You control the ads.",
            desc: "Choose between 1 to 3 ads. 1 ad is highest conversion, 3 ads means maximum revenue. Your choice.",
            buttonText: "Next",
            buttonClass: "bg-brand text-white hover:bg-brandHover"
        },
        {
            icon: (
                <div className="flex items-center gap-3">
                    <span className="text-5xl drop-shadow-sm">🌱</span>
                    <span className="text-4xl drop-shadow-sm">+</span>
                    <span className="text-5xl drop-shadow-sm">🪙</span>
                </div>
            ),
            title: "Earn 95%, give 5%.",
            desc: "Keep 95% of your ad revenue, or enable the tree donation to give 5% to environmental causes and boost conversions.",
            buttonText: "Let's Go",
            buttonClass: "bg-success text-white hover:bg-[#346344]"
        }
    ];

    const currentSlide = slides[step];

    const handleNext = () => {
        if (step < 2) setStep(step + 1);
        else onComplete();
    };

    return (
        <div className="fixed inset-0 z-50 bg-bg flex flex-col items-center justify-between p-6 pb-[calc(24px+env(safe-area-inset-bottom))] animate-fade-in">
            {/* Skip Button */}
            <div className="w-full flex justify-end">
                <button
                    onClick={onComplete}
                    className="text-[14px] font-black text-textMid hover:text-text px-3 py-2 rounded-[14px]"
                >
                    Skip
                </button>
            </div>

            {/* Slide Content */}
            <div className="flex-1 flex flex-col justify-center items-center text-center w-full max-w-[400px]">
                <div className="mb-10 w-40 h-40 bg-white rounded-[40px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-border flex items-center justify-center overflow-hidden animate-pop-in relative" key={step}>
                    {currentSlide.icon}
                </div>

                <h2 className="text-[28px] font-black tracking-tight text-text leading-[1.1] mb-4 animate-slide-up" style={{ animationDelay: '50ms' }} key={`t-${step}`}>
                    {currentSlide.title}
                </h2>
                <p className="text-[16px] font-[800] text-textMid leading-relaxed max-w-[320px] animate-slide-up" style={{ animationDelay: '100ms' }} key={`d-${step}`}>
                    {currentSlide.desc}
                </p>
            </div>

            {/* Bottom Actions */}
            <div className="w-full max-w-[400px] flex flex-col gap-6">
                {/* Progress Dots */}
                <div className="flex justify-center gap-2">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className={`h-[6px] rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-text' : 'w-[6px] bg-border'}`}
                        />
                    ))}
                </div>

                {/* Main Button */}
                <button
                    onClick={handleNext}
                    className={`btn-primary w-full h-[56px] text-[18px] rounded-[14px] flex items-center justify-center gap-2 transition-transform shadow-[0_4px_16px_rgba(0,0,0,0.1)] active:scale-95 ${currentSlide.buttonClass}`}
                >
                    {currentSlide.buttonText}
                    {step < 2 && <ArrowRight size={20} />}
                </button>
            </div>
        </div>
    );
};
