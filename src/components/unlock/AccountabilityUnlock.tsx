import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AccountabilityConfigData } from '../dashboard/AccountabilityConfigForm';

/**
 * Legacy redirect component — the old accountability unlock flow is replaced.
 * Redirects to the new multi-page accountability flow at /r/:slug
 */
interface AccountabilityUnlockProps {
    slug?: string;
    config?: AccountabilityConfigData;
}

export const AccountabilityUnlock = ({ slug }: AccountabilityUnlockProps) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (slug) {
            navigate(`/r/${slug}`, { replace: true });
        }
    }, [slug, navigate]);

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-[36px] mb-4">🤝</div>
            <p className="text-[14px] font-[600] text-[#888]">Redirecting to accountability challenge...</p>
        </div>
    );
};
