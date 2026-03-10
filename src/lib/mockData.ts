export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    avatarInitial?: string;
    initial?: string;
    avatarColor?: string;
    bio?: string;
    website?: string;
    joinedDate?: string;
    hasSeenOnboarding?: boolean;
    isCreator?: boolean;
    referralCode?: string;
    referralCount?: number;
    myTrees?: number;
    stripeConnected?: boolean;
    balance?: number;
    pendingPayout?: number;
}

export const currentUser: User = {
    id: "u_123",
    name: "Alex Creator",
    username: "alexcreator",
    email: "alex@example.com",
    avatarInitial: "A",
    initial: "A",
    avatarColor: "#E8312A",
    bio: "Creating tools and resources for designers and developers.",
    website: "https://alexcreator.com",
    joinedDate: "2024-01-15T00:00:00Z",
    hasSeenOnboarding: false,
    isCreator: true,
    referralCode: "ADGATE-ALEX",
    referralCount: 3,
    myTrees: 12,
    stripeConnected: false,
    balance: 247.50,
    pendingPayout: 85.00,
};

export const mockLinks = [
    {
        id: "link_01",
        slug: "combo-notion-setup",
        title: "Notion Productivity Setup Guide",
        description: "Follow these steps to set up your Notion workspace and use the attached template to get started instantly.",
        contentMode: "file",
        textContent: "",
        links: [],
        fileAttachments: [ { fileName: "notion-template.zip", fileSize: "1.2 MB", fileType: "zip" } ],
        fileType: "ZIP",
        fileName: "notion-template.zip",
        fileSize: "1.2 MB",
        unlockType: "custom_sponsor",
        adSource: "custom",
        requiresClick: true,
        brandName: "Notion",
        ctaText: "Get Notion Free",
        redirectUrl: "https://notion.so",
        skipAfter: 5,
        customAd: {
            fileName: "notion-promo.mp4",
            fileSize: 10240000,
            fileMimeType: "video/mp4",
            previewUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800",
            redirectUrl: "https://notion.so",
            requiresClick: true,
            ctaText: "Get Notion Free",
            brandName: "Notion",
            skipAfter: 5,
            impressions: 1200,
            videoWatches: 950,
            clicks: 800
        },
        videoWatches: 950,
        clicks: 800,
        donateEnabled: false,
        isActive: true,
        viewCount: 1200,
        unlockCount: 950,
        conversionRate: "79.1%",
        createdAt: "2024-05-11T12:00:00Z",
        geography: [],
        deviceSplit: { mobile: 50, desktop: 50, tablet: 0 },
    },
    {
        id: "link_02",
        slug: "design-system-pro",
        title: "Pro Design System UI Kit",
        description: "A complete professional design system for Figma with 1000+ components.",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "ZIP",
        fileName: "DesignSystemPro.zip",
        fileSize: "24.5 MB",
        unlockType: "custom_sponsor",
        adSource: "custom",
        requiresClick: false,
        brandName: "Canva",
        ctaText: "Learn More",
        redirectUrl: null,
        skipAfter: 5,
        customAd: {
            fileName: "canva-promo.mp4",
            fileSize: 4500000,
            fileMimeType: "video/mp4",
            previewUrl: "",
            redirectUrl: null,
            requiresClick: false,
            ctaText: "Learn More",
            brandName: "Canva",
            skipAfter: 5,
            impressions: 1420,
            videoWatches: 840,
            clicks: 0
        },
        videoWatches: 840,
        clicks: 0,
        donateEnabled: true,
        isActive: true,
        viewCount: 1420,
        unlockCount: 840,
        conversionRate: "59.1%",
        createdAt: "2024-02-10T10:00:00Z",
        geography: [{ country: "US", percent: 45 }, { country: "UK", percent: 20 }, { country: "IN", percent: 15 }],
        deviceSplit: { mobile: 65, desktop: 30, tablet: 5 },
    },
    {
        id: "link_03",
        slug: "midjourney-prompts",
        title: "100+ Midjourney Prompts for Character Design",
        description: "My personal collection of prompts for generating consistent and detailed characters.",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "PDF",
        fileName: "Midjourney_Characters.pdf",
        fileSize: "4.2 MB",
        unlockType: "custom_sponsor",
        adSource: "custom",
        requiresClick: true,
        brandName: "Grammarly",
        ctaText: "Try Grammarly",
        redirectUrl: "https://grammarly.com",
        skipAfter: 5,
        customAd: {
            fileName: "grammarly-promo.mp4",
            fileSize: 10240000,
            fileMimeType: "video/mp4",
            previewUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800",
            redirectUrl: "https://grammarly.com",
            requiresClick: true,
            ctaText: "Try Grammarly",
            brandName: "Grammarly",
            skipAfter: 5,
            impressions: 890,
            videoWatches: 650,
            clicks: 612
        },
        videoWatches: 650,
        clicks: 612,
        donateEnabled: false,
        isActive: true,
        viewCount: 890,
        unlockCount: 612,
        conversionRate: "68.7%",
        createdAt: "2024-03-01T14:30:00Z",
        geography: [{ country: "US", percent: 50 }, { country: "CA", percent: 15 }, { country: "AU", percent: 10 }],
        deviceSplit: { mobile: 80, desktop: 15, tablet: 5 },
    },
    {
        id: "link_04",
        slug: "marketing-template",
        title: "Marketing Campaign Template",
        description: "The spreadsheet I use to plan all my successful campaigns.",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "ZIP",
        fileName: "marketing-starter.zip",
        fileSize: "1.8 MB",
        unlockType: "custom_sponsor",
        adSource: "custom",
        requiresClick: false,
        brandName: "Buffer",
        ctaText: "Learn More",
        redirectUrl: null,
        skipAfter: 5,
        customAd: {
            fileName: "buffer-demo.mp4",
            fileSize: 4500000,
            fileMimeType: "video/mp4",
            previewUrl: "",
            redirectUrl: null,
            requiresClick: false,
            ctaText: "Learn More",
            brandName: "Buffer",
            skipAfter: 5,
            impressions: 450,
            videoWatches: 180,
            clicks: 0
        },
        videoWatches: 180,
        clicks: 0,
        donateEnabled: true,
        isActive: true,
        viewCount: 450,
        unlockCount: 180,
        conversionRate: "40.0%",
        createdAt: "2024-04-05T16:45:00Z",
        geography: [{ country: "IN", percent: 40 }, { country: "US", percent: 30 }, { country: "DE", percent: 10 }],
        deviceSplit: { mobile: 20, desktop: 78, tablet: 2 },
    },
    {
        id: "link_05",
        slug: "illustration-pack",
        title: "3D Illustration Vector Pack",
        description: "A huge pack of 3D illustrations for your UI designs.",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "ZIP",
        fileName: "3d_vectors.zip",
        fileSize: "50 MB",
        unlockType: "custom_sponsor",
        adSource: "custom",
        requiresClick: false,
        brandName: "Adobe",
        ctaText: "Learn More",
        redirectUrl: null,
        skipAfter: 6,
        customAd: {
            fileName: "adobe-demo.mp4",
            fileSize: 6500000,
            fileMimeType: "video/mp4",
            previewUrl: "",
            redirectUrl: null,
            requiresClick: false,
            ctaText: "Learn More",
            brandName: "Adobe",
            skipAfter: 6,
            impressions: 350,
            videoWatches: 210,
            clicks: 0
        },
        videoWatches: 210,
        clicks: 0,
        donateEnabled: true,
        isActive: true,
        viewCount: 350,
        unlockCount: 210,
        conversionRate: "60.0%",
        createdAt: "2024-04-10T16:45:00Z",
        geography: [],
        deviceSplit: { mobile: 20, desktop: 78, tablet: 2 },
    },
    {
        id: "link_06",
        slug: "youtube-thumbnail-pack",
        title: "Viral YouTube Thumbnail PSDs",
        description: "5 fully editable Photoshop templates for high-CTR thumbnails.",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "ZIP",
        fileName: "YT_Thumbnails.zip",
        fileSize: "45.2 MB",
        unlockType: "custom_sponsor",
        adSource: "custom",
        requiresClick: true,
        brandName: "Figma",
        ctaText: "Download Figma",
        redirectUrl: "https://figma.com",
        skipAfter: 5,
        customAd: {
            fileName: "figma-app.mp4",
            fileSize: 8500000,
            fileMimeType: "video/mp4",
            previewUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800",
            redirectUrl: "https://figma.com",
            requiresClick: true,
            ctaText: "Download Figma",
            brandName: "Figma",
            skipAfter: 5,
            impressions: 110,
            videoWatches: 85,
            clicks: 70
        },
        videoWatches: 85,
        clicks: 70,
        donateEnabled: false,
        isActive: true,
        viewCount: 110,
        unlockCount: 70,
        conversionRate: "63.6%",
        createdAt: "2024-04-18T08:00:00Z",
        geography: [],
        deviceSplit: { mobile: 0, desktop: 0, tablet: 0 },
    },
    {
        id: "link_email_001",
        slug: "design-system-checklist",
        title: "Design System Setup Checklist",
        description: "A 47-point checklist for setting up a scalable design system from scratch.",
        unlockType: "email_subscribe",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "pdf",
        fileName: "design-system-checklist.pdf",
        fileSize: "1.2 MB",
        fileAttachments: [{ fileName: "design-system-checklist.pdf", fileSize: "1.2 MB", fileType: "pdf", fileEmoji: "📄" }],
        donateEnabled: true,
        isActive: true,
        viewCount: 2840,
        unlockCount: 1203,
        views: 2840,
        unlocks: 1203,
        createdAt: "2024-05-12T12:00:00Z",
        conversionRate: "42.4%",
        geography: [],
        deviceSplit: { mobile: 50, desktop: 50, tablet: 0 },
        emailConfig: {
            newsletterName: "Design Systems Weekly",
            newsletterDescription: "Weekly insights on design systems, component libraries, and scalable UI.",
            incentiveText: "Subscribe to access this checklist and join 3,200 designers getting weekly systems thinking.",
            platform: "convertkit",
            platformDisplayName: "ConvertKit",
            archiveUrl: null,
            confirmationMessage: "Check your inbox to confirm! Your checklist unlocks immediately.",
            totalSubscribers: 1203,
            thisMonthSubscribers: 187,
        }
    },
    {
        id: "link_email_002",
        slug: "freelance-email-scripts",
        title: "7 Freelance Email Scripts That Get Replies",
        description: "Copy-paste email scripts for cold outreach, rate increases, late payments, and scope creep.",
        unlockType: "email_subscribe",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "pdf",
        fileName: "freelance-email-scripts.pdf",
        fileSize: "890 KB",
        fileAttachments: [{ fileName: "freelance-email-scripts.pdf", fileSize: "890 KB", fileType: "pdf", fileEmoji: "📄" }],
        donateEnabled: false,
        isActive: true,
        viewCount: 1560,
        unlockCount: 743,
        views: 1560,
        unlocks: 743,
        createdAt: "2024-05-13T12:00:00Z",
        conversionRate: "47.6%",
        geography: [],
        deviceSplit: { mobile: 50, desktop: 50, tablet: 0 },
        emailConfig: {
            newsletterName: "Freelance Forward",
            newsletterDescription: "Practical freelance business advice every two weeks. No fluff.",
            incentiveText: "Subscribe and get the scripts plus a new freelance template every two weeks.",
            platform: "beehiiv",
            platformDisplayName: "Beehiiv",
            archiveUrl: "https://freelanceforward.beehiiv.com",
            confirmationMessage: "You're subscribed! Your scripts are ready below.",
            totalSubscribers: 743,
            thisMonthSubscribers: 98,
        }
    },
    {
        id: "link_social_001",
        slug: "figma-shortcuts-sheet",
        title: "Ultimate Figma Shortcuts Cheat Sheet",
        description: "Every Figma keyboard shortcut organized by workflow. Print-ready PDF.",
        unlockType: "social_follow",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "pdf",
        fileName: "figma-shortcuts.pdf",
        fileSize: "2.1 MB",
        fileAttachments: [{ fileName: "figma-shortcuts.pdf", fileSize: "2.1 MB", fileType: "pdf", fileEmoji: "📄" }],
        donateEnabled: false,
        isActive: true,
        viewCount: 4210,
        unlockCount: 2890,
        views: 4210,
        unlocks: 2890,
        createdAt: "2024-05-14T12:00:00Z",
        conversionRate: "68.6%",
        geography: [],
        deviceSplit: { mobile: 50, desktop: 50, tablet: 0 },
        socialConfig: {
            followTargets: [
                {
                    id: "target_s1_001",
                    type: "platform",
                    platform: "instagram",
                    handle: "@uidesigns",
                    profileUrl: "https://instagram.com/uidesigns",
                    customLabel: null, customUrl: null, customIcon: null,
                    instructionText: null,
                },
                {
                    id: "target_s1_002",
                    type: "platform",
                    platform: "tiktok",
                    handle: "@uidesigns",
                    profileUrl: "https://tiktok.com/@uidesigns",
                    customLabel: null, customUrl: null, customIcon: null,
                    instructionText: null,
                }
            ],
            customHeading: "Follow for daily Figma tips and free resources",
            followDescription: "I post daily Figma tutorials, UI breakdowns, and free resource drops. Come join.",
            totalFollows: 2890,
            thisMonthFollows: 340,
        }
    },
    {
        id: "link_social_002",
        slug: "python-beginners-guide",
        title: "Python for Complete Beginners — 30 Day Plan",
        description: "A structured 30-day learning plan with daily exercises, resources, and project ideas.",
        unlockType: "social_follow",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "pdf",
        fileName: "python-30day-plan.pdf",
        fileSize: "3.4 MB",
        fileAttachments: [{ fileName: "python-30day-plan.pdf", fileSize: "3.4 MB", fileType: "pdf", fileEmoji: "📄" }],
        donateEnabled: true,
        isActive: true,
        viewCount: 3180,
        unlockCount: 1940,
        views: 3180,
        unlocks: 1940,
        createdAt: "2024-05-15T12:00:00Z",
        conversionRate: "61.0%",
        geography: [],
        deviceSplit: { mobile: 50, desktop: 50, tablet: 0 },
        socialConfig: {
            followTargets: [
                {
                    id: "target_s2_001",
                    type: "platform",
                    platform: "youtube",
                    handle: "@devhints",
                    profileUrl: "https://youtube.com/@devhints",
                    customLabel: null, customUrl: null, customIcon: null,
                    instructionText: "Subscribe to the channel",
                },
                {
                    id: "target_s2_002",
                    type: "platform",
                    platform: "twitter",
                    handle: "@devhints",
                    profileUrl: "https://twitter.com/devhints",
                    customLabel: null, customUrl: null, customIcon: null,
                    instructionText: null,
                },
                {
                    id: "target_s2_003",
                    type: "custom",
                    platform: null,
                    handle: null,
                    profileUrl: null,
                    customLabel: "Join our Discord server",
                    customUrl: "https://discord.gg/devhints",
                    customIcon: "💬",
                    instructionText: "Join the community",
                }
            ],
            customHeading: "Subscribe for weekly Python tutorials and coding challenges",
            followDescription: "Free weekly Python tutorials, project walkthroughs, and coding challenges for beginners.",
            totalFollows: 1940,
            thisMonthFollows: 234,
        }
    },
    {
        id: "link_accountability_001",
        slug: "morning-routine-accountability",
        title: "14-Day Morning Routine Challenge",
        description: "Pair up with someone building a morning routine. Check in daily. Support each other.",
        unlockType: "accountability",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "",
        fileName: "",
        fileSize: "",
        fileAttachments: [],
        donateEnabled: false,
        isActive: true,
        viewCount: 1840,
        unlockCount: 0,
        views: 1840,
        unlocks: 0,
        createdAt: "2024-05-16T12:00:00Z",
        conversionRate: "0.0%",
        geography: [],
        deviceSplit: { mobile: 50, desktop: 50, tablet: 0 },
        accountabilityConfig: {
            topic: "14-Day Morning Routine Challenge",
            description: "Pair up with someone building the same habit. Check in daily. Support each other for 14 days.",
            commitmentPrompt: "What specific morning habit will you commit to for the next 14 days?",
            durationDays: 14,
            checkInFrequency: "daily",
            guidelines: "Be honest. Show up for your partner. One check-in per day minimum.",
            creatorResourceUrl: "https://example.com/morning-guide",
            creatorResourceLabel: "Read the creator's morning routine guide",
            genderMatchingEnabled: true,
            scheduledMessages: [
                { id: "sched_001", dayNumber: 1, sendTime: "09:00", content: "Welcome to the challenge! Introduce yourself to your partner and share your commitment. Tell them exactly what you are going to do every day.", isSent: true },
                { id: "sched_002", dayNumber: 3, sendTime: "09:00", content: "Day 3 check-in! How are both of you doing? Remember — honesty with your partner is more valuable than performing. If you missed a day, say so.", isSent: false },
                { id: "sched_003", dayNumber: 7, sendTime: "09:00", content: "Halfway there! One week in. Check in with your partner today and share one thing that surprised you about this challenge so far.", isSent: false },
                { id: "sched_004", dayNumber: 14, sendTime: "09:00", content: "Final day! You made it. Tell your partner one thing that changed because of this challenge. This conversation is yours — I cannot see it, but I know it mattered.", isSent: false },
            ],
            totalParticipants: 234,
            activePairs: 47,
            completedPairs: 156,
            isAcceptingParticipants: true,
            waitingPool: { male: 3, female: 2, any: 1 },
        }
    },
    {
        id: "link_accountability_002",
        slug: "freelance-goal-accountability",
        title: "30-Day Freelance Revenue Goal",
        description: "Set a freelance revenue goal for next month and get an accountability partner to keep you on track.",
        unlockType: "accountability",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "",
        fileName: "",
        fileSize: "",
        fileAttachments: [],
        donateEnabled: false,
        isActive: true,
        viewCount: 980,
        unlockCount: 0,
        views: 980,
        unlocks: 0,
        createdAt: "2024-05-17T12:00:00Z",
        conversionRate: "0.0%",
        geography: [],
        deviceSplit: { mobile: 50, desktop: 50, tablet: 0 },
        accountabilityConfig: {
            topic: "30-Day Freelance Revenue Goal",
            description: "Set a freelance revenue goal for next month and get an accountability partner to keep you on track.",
            commitmentPrompt: "What is your freelance revenue goal for the next 30 days, and what is one specific action you will take this week to move toward it?",
            durationDays: 30,
            checkInFrequency: "every_other_day",
            guidelines: "Share your numbers honestly. Celebrate each other's wins. Call each other out on excuses.",
            creatorResourceUrl: null,
            creatorResourceLabel: null,
            genderMatchingEnabled: true,
            scheduledMessages: [
                { id: "sched_f_001", dayNumber: 1, sendTime: "09:00", content: "Welcome! Share your revenue goal with your partner.", isSent: false },
                { id: "sched_f_002", dayNumber: 15, sendTime: "09:00", content: "Halfway! How are the numbers looking?", isSent: false },
                { id: "sched_f_003", dayNumber: 30, sendTime: "09:00", content: "Final day. Did you hit your goal?", isSent: false },
            ],
            totalParticipants: 89,
            activePairs: 23,
            completedPairs: 31,
            isAcceptingParticipants: true,
            waitingPool: { male: 2, female: 1, any: 0 },
        }
    },
    {
        id: "link_premium_media_001",
        slug: "uncut-interview-series",
        title: "Uncut Interview Series: Behind The Scenes",
        description: "Full, unedited 2-hour interview with top designers. Learn the messy reality of freelance.",
        unlockType: "premium_media",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "mp4",
        fileName: "uncut_interview_ep1.mp4",
        fileSize: "850 MB",
        fileAttachments: [{ fileName: "uncut_interview_ep1.mp4", fileSize: "850 MB", fileType: "mp4", fileEmoji: "🎥" }],
        donateEnabled: true,
        isActive: true,
        viewCount: 1240,
        unlockCount: 420,
        views: 1240,
        unlocks: 420,
        createdAt: "2024-05-18T12:00:00Z",
        conversionRate: "33.8%",
        geography: [],
        deviceSplit: { mobile: 50, desktop: 50, tablet: 0 },
    },
    {
        id: "link_premium_media_002",
        slug: "exclusive-vlog",
        title: "Exclusive Weekly Vlog - Episode 12",
        description: "A private weekly vlog only for my top supporters.",
        unlockType: "premium_media",
        contentMode: "file",
        textContent: "",
        links: [],
        fileType: "mp4",
        fileName: "vlog_ep12.mp4",
        fileSize: "400 MB",
        fileAttachments: [{ fileName: "vlog_ep12.mp4", fileSize: "400 MB", fileType: "mp4", fileEmoji: "🎥" }],
        donateEnabled: true,
        isActive: true,
        viewCount: 520,
        unlockCount: 180,
        views: 520,
        unlocks: 180,
        createdAt: "2024-05-19T12:00:00Z",
        conversionRate: "34.6%",
        geography: [],
        deviceSplit: { mobile: 50, desktop: 50, tablet: 0 },
    }
];

export const mockAccountabilityParticipants = [
    {
        id: "participant_current",
        linkId: "link_accountability_001",
        userId: "user_current",
        displayName: "Alex",
        gender: "male" as const,
        commitmentStatement: "Wake up at 6am and journal for 10 minutes before opening my phone.",
        pairId: "participant_pair",
        isPaired: true,
        pairedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        chatSessionId: "session_mock_001",
        expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active" as const,
        joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        genderPreference: "any" as const,
    },
    {
        id: "participant_pair",
        linkId: "link_accountability_001",
        userId: "user_pair",
        displayName: "Jordan",
        gender: "female" as const,
        commitmentStatement: "No phone for first 30 minutes after waking. Cold shower every morning.",
        pairId: "participant_current",
        isPaired: true,
        pairedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        chatSessionId: "session_mock_001",
        expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active" as const,
        joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        genderPreference: "any" as const,
    },
];

export interface MediaAttachment {
    type: 'image' | 'video' | 'file';
    url: string | null;
    fileName: string;
    fileSize?: string;
    isPlaceholder?: boolean;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderInitial: string;
    type: 'private' | 'broadcast';
    content: string;
    timestamp: string;
    isRead: boolean;
    status?: 'sent' | 'delivered' | 'read';
    mediaAttachments?: MediaAttachment[];
    replyTo?: {
        senderName: string;
        content: string;
    };
    reactions?: string[];
}

export const mockChatSession = {
    id: "session_mock_001",
    linkId: "link_accountability_001",
    participantIds: ["participant_current", "participant_pair"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
    messages: [
        {
            id: "msg_001",
            senderId: "participant_pair",
            senderName: "Jordan",
            senderInitial: "J",
            type: "private" as const,
            content: "Hey! Just got paired with you. What's your morning routine goal?",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
            isRead: true,
        },
        {
            id: "msg_002",
            senderId: "participant_current",
            senderName: "Alex",
            senderInitial: "A",
            type: "private" as const,
            content: "Hey Jordan! I'm trying to journal every day before I check my phone. Day 2 done ✓",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            isRead: true,
        },
        {
            id: "msg_003",
            senderId: "participant_pair",
            senderName: "Jordan",
            senderInitial: "J",
            type: "private" as const,
            content: "That's amazing! Cold shower this morning. Brutal but I did it 💪",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
            isRead: true,
        },
        {
            id: "msg_broadcast_001",
            senderId: "creator_broadcast",
            senderName: "Creator",
            senderInitial: "C",
            type: "broadcast" as const,
            content: "Welcome to the challenge! Introduce yourself to your partner and share your commitment. Tell them exactly what you are going to do every day.",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
            isRead: true,
        },
        {
            id: "msg_004",
            senderId: "participant_pair",
            senderName: "Jordan",
            senderInitial: "J",
            type: "private" as const,
            content: "Day 3 check-in — did you journal this morning?",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isRead: false,
            status: 'delivered',
        },
        {
            id: "msg_broadcast_002",
            senderId: "creator_broadcast",
            senderName: "Alex Creator",
            senderInitial: "A",
            type: "broadcast" as const,
            content: "Day 7 check-in! Here is a quick visual framework to help you structure your morning. Hope it helps.",
            mediaAttachments: [{
                type: "image",
                url: null,
                fileName: "morning-framework.jpg",
                isPlaceholder: true,
            }],
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            isRead: false,
        },
    ],
    broadcastsReceived: ["sched_001"],
    participantCommitments: {
        "participant_current": "Wake up at 6am and journal for 10 minutes before opening my phone.",
        "participant_pair": "No phone for first 30 minutes after waking. Cold shower every morning.",
    } as Record<string, string>,
    daysRemaining: 12,
    daysTotal: 14,
};

export const mockBroadcasts = [
    {
        id: "broadcast_mock_001",
        linkId: "link_accountability_001",
        type: "scheduled" as const,
        scheduledMessageId: "sched_001",
        dayNumber: 1,
        content: "Welcome to the challenge! Introduce yourself to your partner and share your commitment. Tell them exactly what you are going to do every day.",
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
        deliveredToCount: 47,
    },
];

export const mockAutoResponses = [
    "Day check-in! How are you doing today?",
    "Keep it up! Consistency is everything.",
    "I almost skipped today but remembered we were checking in 😅",
    "How are you finding it so far?",
    "Day done! Feeling good about this.",
    "Any tips from your experience so far?",
    "We're halfway through! Can't believe it.",
    "Almost there! Last few days — let's finish strong.",
];

export interface ViewerChatSession {
    sessionId: string;
    linkSlug: string;
    linkId: string;
    creator: {
        id: string;
        name: string;
        username: string;
        initial: string;
        avatarColor: string;
    };
    challengeTopic: string;
    durationDays: number;
    checkInFrequency: string;
    viewerParticipantId: string;
    viewerCommitment: string;
    viewerGender: string;
    partner: {
        participantId: string;
        displayName: string;
        initial: string;
        avatarColor: string;
        commitment: string;
        gender: string;
    };
    pairedAt: string;
    expiresAt: string;
    isExpired: boolean;
    isCompleted: boolean;
    totalMessages: number;
    unreadCount: number;
    lastMessage: {
        content: string;
        senderId: string;
        senderName: string;
        timestamp: string;
        type: string;
        status?: 'sent' | 'delivered' | 'read';
    };
    unreadBroadcasts: number;
    daysTotal: number;
    daysElapsed: number;
    daysRemaining: number;
    status: 'active' | 'completed' | 'expired' | 'partner_left';
}

export const mockViewerChatSessions: ViewerChatSession[] = [
    {
        sessionId: "session_viewer_001",
        linkSlug: "morning-routine-accountability",
        linkId: "link_accountability_001",
        creator: {
            id: "creator_001",
            name: "James Productivity",
            username: "jamesproductivity",
            initial: "J",
            avatarColor: "#E8312A",
        },
        challengeTopic: "14-Day Morning Routine Challenge",
        durationDays: 14,
        checkInFrequency: "daily",
        viewerParticipantId: "participant_current",
        viewerCommitment: "Wake up at 6am and journal for 10 minutes before opening my phone.",
        viewerGender: "male",
        partner: {
            participantId: "participant_pair",
            displayName: "Jordan",
            initial: "J",
            avatarColor: "#2563EB",
            commitment: "No phone for first 30 minutes after waking. Cold shower every morning.",
            gender: "female",
        },
        pairedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: false,
        isCompleted: false,
        totalMessages: 4,
        unreadCount: 1,
        lastMessage: {
            content: "Day 3 check-in — did you journal this morning?",
            senderId: "participant_pair",
            senderName: "Jordan",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            type: "private",
        },
        unreadBroadcasts: 0,
        daysTotal: 14,
        daysElapsed: 2,
        daysRemaining: 12,
        status: "active",
    },
    {
        sessionId: "session_viewer_002",
        linkSlug: "freelance-goal-accountability",
        linkId: "link_accountability_002",
        creator: {
            id: "creator_002",
            name: "Freelance Forward",
            username: "freelanceforward",
            initial: "F",
            avatarColor: "#6366F1",
        },
        challengeTopic: "30-Day Freelance Revenue Goal",
        durationDays: 30,
        checkInFrequency: "every_other_day",
        viewerParticipantId: "participant_viewer_002",
        viewerCommitment: "Close two new client projects worth $2,000 total by end of month.",
        viewerGender: "male",
        partner: {
            participantId: "participant_partner_002",
            displayName: "Priya",
            initial: "P",
            avatarColor: "#166534",
            commitment: "Send 10 cold outreach emails per week and land one new retainer client.",
            gender: "female",
        },
        pairedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: false,
        isCompleted: false,
        totalMessages: 12,
        unreadCount: 3,
        lastMessage: {
            content: "Just sent my 8th outreach this week. How are your client conversations going?",
            senderId: "participant_partner_002",
            senderName: "Priya",
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
            type: "private",
        },
        unreadBroadcasts: 1,
        daysTotal: 30,
        daysElapsed: 8,
        daysRemaining: 22,
        status: "active",
    },
    {
        sessionId: "session_viewer_003",
        linkSlug: "reading-habit-challenge",
        linkId: "link_accountability_003",
        creator: {
            id: "creator_003",
            name: "BookStack Creator",
            username: "bookstackreads",
            initial: "B",
            avatarColor: "#92400E",
        },
        challengeTopic: "21-Day Daily Reading Challenge",
        durationDays: 21,
        checkInFrequency: "daily",
        viewerParticipantId: "participant_viewer_003",
        viewerCommitment: "Read 20 pages every evening before bed. No exceptions.",
        viewerGender: "male",
        partner: {
            participantId: "participant_partner_003",
            displayName: "Sam",
            initial: "S",
            avatarColor: "#B45309",
            commitment: "Read one chapter of a non-fiction book every morning with coffee.",
            gender: "any",
        },
        pairedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: true,
        isCompleted: true,
        totalMessages: 38,
        unreadCount: 0,
        lastMessage: {
            content: "We made it!! 21 days 🎉 This was genuinely helpful.",
            senderId: "participant_partner_003",
            senderName: "Sam",
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            type: "private",
        },
        unreadBroadcasts: 0,
        daysTotal: 21,
        daysElapsed: 21,
        daysRemaining: 0,
        status: "completed",
    },
];

export const mockActivity = [
    { id: "act_1", type: "unlock", description: "⭐ Sponsor video watched on Noton Productivity Setup Guide", timestamp: "2 mins ago", resourceTitle: "" },
    { id: "act_2", type: "unlock", description: "🖱️ Sponsor link clicked on Pro Design System UI Kit", timestamp: "15 mins ago", resourceTitle: "" },
    { id: "act_5", type: "unlock", description: "⭐ Sponsor video watched on Illustration Pack", timestamp: "5 hours ago", resourceTitle: "" },
    { id: "act_7", type: "unlock", description: "🖱️ Sponsor link clicked on Midjourney Prompts", timestamp: "Yesterday", resourceTitle: "" },
    { id: "act_8", type: "creation", description: "Created new link Viral YouTube Thumbnail PSDs", timestamp: "3 days ago", resourceTitle: "" },
    { id: "act_9", type: "unlock", description: "⭐ Sponsor video watched on Pro Design System UI Kit", timestamp: "3 days ago", resourceTitle: "" },
    { id: "act_10", type: "unlock", description: "⭐ Sponsor video watched on Marketing Campaign Template", timestamp: "4 days ago", resourceTitle: "" },
];





export const mockCreatorProfile = { ...currentUser, links: mockLinks.filter(l => l.isActive) };

import type { EmailConfigData } from '../components/dashboard/EmailConfigForm';
import type { SocialConfigData } from '../components/dashboard/SocialConfigForm';
import type { AccountabilityConfigData } from '../components/dashboard/AccountabilityConfigForm';

export interface ExploreResource {
    id: string;
    slug: string;
    title: string;
    creatorName: string;
    creatorHandle: string;
    creatorAvatar: string;
    verified: boolean;
    fileType: string;
    unlockCount: string;
    category: string;
    adSource?: string;
    isCustomSponsor?: boolean;
    sponsorName?: string;
    requiresClick?: boolean;
    isActive?: boolean;
    customAd?: {
        fileName: string;
        fileSize: number;
        fileMimeType: string;
        previewUrl: string;
        redirectUrl: string | null;
        requiresClick: boolean;
        ctaText: string;
        brandName: string;
        skipAfter: number;
        impressions: number;
        videoWatches: number;
        clicks: number;
    };
    description?: string;
    fileSize?: string;
    donateEnabled?: boolean;
    contentMode?: "file";
    unlockType?: "custom_sponsor" | "email_subscribe" | "social_follow" | "accountability";
    emailConfig?: EmailConfigData;
    socialConfig?: SocialConfigData;
    accountabilityConfig?: AccountabilityConfigData;
}

export const mockExploreResources: ExploreResource[] = [
    {
        id: "exp_1",
        slug: "design-system-pro",
        title: "Pro Design System UI Kit",
        creatorName: "Alex Creator",
        creatorHandle: "alexcreator",
        creatorAvatar: "A",
        verified: true,
        fileType: "ZIP",
        unlockCount: "1.2K",
        category: "Templates",
        adSource: "custom",
        requiresClick: true,
        sponsorName: "Figma"
    },
    {
        id: "exp_2",
        slug: "ai-prompt-pack",
        title: "500+ ChatGPT Prompts for Marketing",
        creatorName: "Sarah M.",
        creatorHandle: "sarahmarket",
        creatorAvatar: "S",
        verified: false,
        fileType: "PDF",
        unlockCount: "840",
        category: "Prompts",
        adSource: "custom",
        requiresClick: false,
        sponsorName: "Grammarly",
        unlockType: "email_subscribe",
        emailConfig: {
            newsletterName: "Sarah's Marketing Newsletter",
            newsletterDescription: "Get weekly marketing prompts and insights delivered to your inbox.",
            incentiveText: "Subscribe to unlock these 500 prompts and step up your marketing game.",
            platform: "direct",
            platformDisplayName: "Direct",
            archiveUrl: null,
            confirmationMessage: "Check your inbox to confirm!"
        }
    },
    {
        id: "exp_3",
        slug: "freelance-notion",
        title: "Freelance OS Notion Template",
        creatorName: "Dev Dave",
        creatorHandle: "devdave",
        creatorAvatar: "D",
        verified: true,
        fileType: "ZIP",
        unlockCount: "2.1K",
        category: "Templates",
        adSource: "custom",
        requiresClick: true,
        sponsorName: "Notion"
    },
    {
        id: "exp_4",
        slug: "luts-pack",
        title: "Cinematic Video LUTs Pack",
        creatorName: "Video Creator",
        creatorHandle: "vidcreator",
        creatorAvatar: "V",
        verified: false,
        fileType: "ZIP",
        unlockCount: "350",
        category: "Videos",
        adSource: "custom",
        requiresClick: false,
        sponsorName: "Adobe",
        unlockType: "social_follow",
        socialConfig: {
            followTargets: [
                {
                    id: "target_exp_4_001",
                    type: "platform",
                    platform: "twitter",
                    handle: "vidcreator",
                    profileUrl: "https://twitter.com/vidcreator",
                    customLabel: null, customUrl: null, customIcon: null,
                    instructionText: null,
                }
            ],
            customHeading: "Follow me for daily video editing tips",
            followDescription: "Get the latest insights, free LUTs, and more."
        }
    },
    {
        id: "exp_5",
        slug: "resume-template",
        title: "Modern Minimalist Resume Template",
        creatorName: "Career Coach",
        creatorHandle: "careercoach",
        creatorAvatar: "C",
        verified: false,
        fileType: "DOC",
        unlockCount: "5.4K",
        category: "Guides",
        adSource: "custom",
        requiresClick: true,
        sponsorName: "Canva"
    },
    {
        id: "exp_6",
        slug: "procreate-brushes",
        title: "Watercolor Procreate Brushes",
        creatorName: "Artist Anna",
        creatorHandle: "annaart",
        creatorAvatar: "A",
        verified: true,
        fileType: "ZIP",
        unlockCount: "920",
        category: "Tools",
        adSource: "custom",
        requiresClick: false,
        sponsorName: "Figma",
        unlockType: "accountability",
        accountabilityConfig: {
            topic: "30-Day Drawing Challenge",
            description: "Pair up with another artist to build a daily drawing habit. Share your sketches and stay accountable.",
            commitmentPrompt: "What are you committing to draw every day?",
            durationDays: 30,
            checkInFrequency: "daily",
            guidelines: "Be supportive, share your work honestly.",
            creatorResourceUrl: null,
            creatorResourceLabel: null,
            genderMatchingEnabled: true,
            scheduledMessages: [],
            totalParticipants: 0,
            activePairs: 0,
            completedPairs: 0,
            isAcceptingParticipants: true,
            waitingPool: { male: 0, female: 0, any: 0 }
        }
    },
    {
        id: "exp_7",
        slug: "startup-pitch",
        title: "Startup Pitch Deck Template",
        creatorName: "Founder Joe",
        creatorHandle: "founderjoe",
        creatorAvatar: "F",
        verified: false,
        fileType: "PDF",
        unlockCount: "135",
        category: "Templates",
        adSource: "custom",
        requiresClick: true,
        sponsorName: "Buffer"
    },
    {
        id: "exp_8",
        slug: "code-snippets",
        title: "100 Useful JS Code Snippets",
        creatorName: "JS Ninja",
        creatorHandle: "jsninja",
        creatorAvatar: "J",
        verified: true,
        fileType: "PDF",
        unlockCount: "3.2K",
        category: "Guides",
        adSource: "custom",
        requiresClick: false,
        sponsorName: "Grammarly"
    }
];





