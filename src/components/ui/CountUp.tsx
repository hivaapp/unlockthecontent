import { useEffect, useState } from 'react';

export const CountUp = ({ end, prefix = '', suffix = '', duration = 800, decimals = 0 }: { end: number, prefix?: string, suffix?: string, duration?: number, decimals?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // easeOutExpo
            const easeOutProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(end * easeOutProgress);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return (
        <>{prefix}{count.toFixed(decimals)}{suffix}</>
    );
};
