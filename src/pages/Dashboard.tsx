import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { HomeTab } from '../components/dashboard/tabs/HomeTab';
import { LinksTab } from '../components/dashboard/tabs/LinksTab';
import { AccountTab } from '../components/dashboard/tabs/AccountTab';
import { OnboardingCarousel } from '../components/dashboard/OnboardingCarousel';

export type DashboardTab = 'home' | 'analytics' | 'chats' | 'account' | 'explore';

export const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine current tab from URL
    const query = new URLSearchParams(location.search);
    const tabParam = (query.get('tab') as DashboardTab) || 'home';

    const [linksSearchQuery, setLinksSearchQuery] = useState('');
    const [showOnboarding, setShowOnboarding] = useState(() => {
        // Mock check for first time user
        const hasSeenOnboarding = localStorage.getItem('adgate_onboarding');
        return !hasSeenOnboarding;
    });

    const handleOnboardingComplete = () => {
        localStorage.setItem('adgate_onboarding', 'true');
        setShowOnboarding(false);
    };

    const handleTabChange = (tab: string) => {
        if (tab === 'chats') {
            navigate('/chats');
            return;
        }
        if (tab === 'explore') {
            navigate('/explore');
            return;
        }
        navigate(`/dashboard?tab=${tab}`);
    };

    return (
        <>
            <DashboardLayout currentTab={tabParam} onTabChange={handleTabChange as any}>
                {tabParam === 'home' && <LinksTab searchQuery={linksSearchQuery} setSearchQuery={setLinksSearchQuery} />}
                {tabParam === 'analytics' && <HomeTab onTabChange={handleTabChange as any} />}
                {tabParam === 'account' && <AccountTab />}
            </DashboardLayout>

            {showOnboarding && <OnboardingCarousel onComplete={handleOnboardingComplete} />}
        </>
    );
};
