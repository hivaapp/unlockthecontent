import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { HomeTab } from '../components/dashboard/tabs/HomeTab';
import { LinksTab } from '../components/dashboard/tabs/LinksTab';
import { AccountTab } from '../components/dashboard/tabs/AccountTab';
import { OnboardingCarousel } from '../components/dashboard/OnboardingCarousel';

type Tab = 'home' | 'links' | 'account';

export const Dashboard = () => {
    const [currentTab, setCurrentTab] = useState<Tab>('home');
    const [linksSearchQuery, setLinksSearchQuery] = useState('');
    const [showOnboarding, setShowOnboarding] = useState(() => {
        // Mock check for first time user
        const hasSeenOnboarding = localStorage.getItem('adgate_onboarding');
        return !hasSeenOnboarding;
    });

    useEffect(() => {
        // No more simulated toasts
    }, []);

    const handleOnboardingComplete = () => {
        localStorage.setItem('adgate_onboarding', 'true');
        setShowOnboarding(false);
    };

    return (
        <>
            <DashboardLayout currentTab={currentTab} onTabChange={setCurrentTab}>
                {currentTab === 'home' && <HomeTab onTabChange={setCurrentTab} />}
                {currentTab === 'links' && <LinksTab searchQuery={linksSearchQuery} setSearchQuery={setLinksSearchQuery} />}
                {currentTab === 'account' && <AccountTab />}
            </DashboardLayout>

            {showOnboarding && <OnboardingCarousel onComplete={handleOnboardingComplete} />}
        </>
    );
};
