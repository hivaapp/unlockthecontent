import { useState, useCallback } from 'react';

export function useAdSession() {
    const [currentResourceSlug, setCurrentResourceSlug] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [customSponsorStep, setCustomSponsorStep] = useState<"watch" | "click" | null>(null);

    const startSession = useCallback((slug: string) => {
        setCurrentResourceSlug(slug);
        setIsComplete(false);
        setCustomSponsorStep("watch");
    }, []);

    const registerVideoWatch = useCallback((requiresClick: boolean) => {
        if (requiresClick) {
            setCustomSponsorStep("click");
        } else {
            setIsComplete(true);
            setCustomSponsorStep(null);
        }
    }, []);

    const registerSponsorClick = useCallback(() => {
        setIsComplete(true);
        setCustomSponsorStep(null);
    }, []);

    const resetSession = useCallback(() => {
        setCurrentResourceSlug(null);
        setIsComplete(false);
        setCustomSponsorStep(null);
    }, []);

    const completeSession = useCallback(() => {
        setIsComplete(true);
        setCustomSponsorStep(null);
    }, []);

    return {
        currentResourceSlug,
        isComplete,
        customSponsorStep,
        startSession,
        registerVideoWatch,
        registerSponsorClick,
        completeSession,
        resetSession,
    };
}
