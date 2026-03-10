import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { HomeTab } from '../components/dashboard/tabs/HomeTab';
import { LinksTab } from '../components/dashboard/tabs/LinksTab';
import { AccountTab } from '../components/dashboard/tabs/AccountTab';
import { OnboardingCarousel } from '../components/dashboard/OnboardingCarousel';

type Tab = 'home' | 'links' | 'chats' | 'account';

export const Dashboard = () => {
    const navigate = useNavigate();
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

    const handleTabChange = (tab: Tab) => {
        if (tab === 'chats') {
            navigate('/chats');
            return;
        }
        setCurrentTab(tab);
    };

    return (
        <>
            <DashboardLayout currentTab={currentTab} onTabChange={handleTabChange}>
                {currentTab === 'home' && <HomeTab onTabChange={handleTabChange} />}
                {currentTab === 'links' && <LinksTab searchQuery={linksSearchQuery} setSearchQuery={setLinksSearchQuery} />}
                {currentTab === 'account' && <AccountTab />}
            </DashboardLayout>

            {showOnboarding && <OnboardingCarousel onComplete={handleOnboardingComplete} />}
        </>
    );
};
