import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { EmailConfigData } from '../components/dashboard/EmailConfigForm';
import type { SocialConfigData } from '../components/dashboard/SocialConfigForm';
import type { FollowerPairingConfigData } from '../components/dashboard/FollowerPairingConfigForm';
import { currentUser as mockUser, mockLinks, mockActivity } from '../lib/mockData';
import type { User } from '../lib/mockData';
import { useToast } from './ToastContext';

export interface LinkData {
    id: string;
    slug?: string;
    title?: string;
    description?: string;
    contentMode?: string;
    textContent?: string;
    links?: { url: string; title: string; }[];
    fileAttachments?: unknown[];
    fileType?: string;
    fileName?: string;
    fileSize?: string;
    donateEnabled?: boolean;
    unlockType?: 'custom_sponsor' | 'email_subscribe' | 'social_follow' | 'follower_pairing';
    emailConfig?: EmailConfigData | null;
    socialConfig?: SocialConfigData | null;
    followerPairingConfig?: FollowerPairingConfigData | null;
    isActive?: boolean;
    viewCount?: number;
    unlockCount?: number;
    earned?: number;
    conversionRate?: string;
    createdAt?: string;
    geography?: { country: string; percent: number; }[];
    deviceSplit?: { mobile: number; desktop: number; tablet: number; };
    customAd?: {
        fileName?: string;
        fileSize?: number;
        fileMimeType?: string;
        previewUrl?: string;
        redirectUrl?: string | null;
        requiresClick?: boolean;
        ctaText?: string;
        brandName?: string;
        skipAfter?: number;
        impressions?: number;
        videoWatches?: number;
        clicks?: number;
    } | null;
    [key: string]: unknown;
}

export interface ActivityData {
    id: string;
    type?: string;
    description?: string;
    timestamp?: string;
    earned?: number;
    resourceTitle?: string;
    [key: string]: unknown;
}



type AuthContextType = {
    isLoggedIn: boolean;
    currentUser: User | null;
    links: LinkData[];
    activity: ActivityData[];
    hasSeenOnboarding: boolean;
    activeTab: string;
    login: (provider?: string) => Promise<void>;
    logout: () => void;
    createLink: (linkData: Partial<LinkData>) => Promise<void>;
    updateLink: (id: string, data: Partial<LinkData>) => Promise<void>;
    deleteLink: (id: string) => Promise<void>;
    disableLink: (id: string) => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    markOnboardingSeen: () => void;
    setActiveTab: (tab: string) => void;
    isLoggingIn: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { addToast } = useToast();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [links, setLinks] = useState<LinkData[]>(mockLinks as LinkData[]);
    const [activity, setActivity] = useState<ActivityData[]>(mockActivity as ActivityData[]);



    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
        return sessionStorage.getItem('adgate_onboarding_seen') === 'true';
    });
    const [activeTab, setActiveTab] = useState('home');

    // Utility to simulate network delay & random failure
    const simulateNetwork = async <T,>(successCallback: () => T): Promise<T> => {
        return new Promise((resolve, reject) => {
            const delay = Math.floor(Math.random() * 300) + 700; // 700-1000ms
            setTimeout(() => {
                if (Math.random() < 0.1) {
                    addToast("Network error. Please try again.", "error");
                    reject(new Error("Network error"));
                } else {
                    resolve(successCallback());
                }
            }, delay);
        });
    };

    const login = async (): Promise<void> => {
        setIsLoggingIn(true);
        try {
            await simulateNetwork(() => {
                setIsLoggedIn(true);
                setCurrentUser({ ...mockUser, hasSeenOnboarding });
            });
            addToast("Successfully signed in", "success");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const logout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
    };

    const createLink = async (linkData: Partial<LinkData>) => {
        await simulateNetwork(() => {
            const finalLinkData = { ...linkData };

            if (finalLinkData.unlockType === 'custom_sponsor' && finalLinkData.customAd) {
                if (!finalLinkData.customAd.redirectUrl || (!finalLinkData.customAd.brandName && !finalLinkData.customAd.fileName)) {
                    throw new Error("Validation failed for custom ad");
                }
            }

            const newLink = {
                id: `link_${Date.now()}`,
                isActive: true,
                viewCount: 0,
                unlockCount: 0,
                earned: 0,
                conversionRate: "0%",
                createdAt: new Date().toISOString(),
                geography: [],
                deviceSplit: { mobile: 0, desktop: 0, tablet: 0 },
                ...finalLinkData,
            };
            setLinks([newLink, ...links]);

            const newActivity = {
                id: `act_${Date.now()}`,
                type: 'creation',
                description: 'Created new link',
                timestamp: 'Just now',
                earned: 0,
                resourceTitle: linkData.title || 'Untitled Resource',
            };
            setActivity([newActivity, ...activity]);
        });
    };

    const updateLink = async (id: string, data: Partial<LinkData>) => {
        await simulateNetwork(() => {
            const finalData = { ...data };
            if (finalData.unlockType === 'custom_sponsor' && finalData.customAd) {
                if (!finalData.customAd.redirectUrl || (!finalData.customAd.brandName && !finalData.customAd.fileName)) {
                    throw new Error("Validation failed for custom ad");
                }
            }
            setLinks(links.map(l => l.id === id ? { ...l, ...finalData } : l));
        });
    };

    const deleteLink = async (id: string) => {
        await simulateNetwork(() => {
            setLinks(links.filter(l => l.id !== id));
        });
    };

    const disableLink = async (id: string) => {
        await simulateNetwork(() => {
            setLinks(links.map(l => l.id === id ? { ...l, isActive: false } : l));
        });
    };



    const updateProfile = async (data: Partial<User>) => {
        await simulateNetwork(() => {
            if (currentUser) {
                setCurrentUser({ ...currentUser, ...data });
            }
        });
    };

    const markOnboardingSeen = () => {
        setHasSeenOnboarding(true);
        sessionStorage.setItem('adgate_onboarding_seen', 'true');
        if (currentUser) {
            setCurrentUser({ ...currentUser, hasSeenOnboarding: true });
        }
    };

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            currentUser,
            links,
            activity,
            hasSeenOnboarding,
            activeTab,
            login,
            logout,
            createLink,
            updateLink,
            deleteLink,
            disableLink,
            updateProfile,
            markOnboardingSeen,
            setActiveTab,
            isLoggingIn
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
