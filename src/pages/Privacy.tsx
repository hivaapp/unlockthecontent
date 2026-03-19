import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Privacy = () => {
    useEffect(() => {
        document.title = "Privacy Policy — UnlockTheContent";
    }, []);

    const sections = [
        {
            id: 'information-collect',
            title: '1. Information We Collect',
            content: 'We collect information you provide directly to us when creating an account, such as your name, email address, and payout details. We also automatically collect some usage data, such as IP addresses, device types, and interaction metrics with the links generated on our platform.'
        },
        {
            id: 'how-use',
            title: '2. How We Use Your Information',
            content: 'We use the collected information to provide, maintain, and improve our services. This includes processing payouts, personalizing user experience, and communicating essential platform updates or security notices.'
        },
        {
            id: 'ad-networks',
            title: '3. Ad Networks and Third Parties',
            content: 'UnlockTheContent allows you to serve Custom sponsor creatives. We securely store and deliver these creatives without injecting our own third-party ad trackers. Any tracking is limited to the redirect URLs and analytics that you actively configure.'
        },
        {
            id: 'cookies',
            title: '4. Cookies and Tracking',
            content: 'We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent, although some platform features may become unavailable.'
        },
        {
            id: 'data-retention',
            title: '5. Data Retention',
            content: 'We retain your personal data only for as long as necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.'
        },
        {
            id: 'rights',
            title: '6. Your Rights and Contact',
            content: 'Depending on your location, you may have rights to access, update, or delete the information we have on you. If you wish to be informed what personal data we hold about you and if you want it to be removed from our systems, please contact us.'
        }
    ];

    return (
        <div className="w-full min-h-screen bg-bg">
            <div className="w-full max-w-[680px] mx-auto px-6 sm:px-8 pt-12 pb-24">
                <Link to="/" className="text-[13px] font-bold text-textMid hover:text-text transition-colors flex items-center gap-1 mb-8">
                    ← Back to Home
                </Link>

                <h1 className="text-[32px] font-black text-[#111] mb-2">Privacy Policy</h1>
                <p className="text-[13px] font-bold text-textMid mb-12">Last updated: January 15, 2025</p>

                <div className="bg-white border border-border rounded-[16px] p-6 mb-12 shadow-sm">
                    <h2 className="text-[15px] font-black text-text mb-4">Table of Contents</h2>
                    <ul className="flex flex-col gap-3">
                        {sections.map(section => (
                            <li key={section.id}>
                                <a href={`#${section.id}`} className="text-[14px] font-bold text-textMid hover:text-brand transition-colors">
                                    {section.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col gap-10">
                    {sections.map((section) => (
                        <div key={section.id} id={section.id} className="scroll-mt-24">
                            <h3 className="text-[18px] font-extrabold text-[#111] mb-4 border-l-[3px] border-[#E8312A] pl-3">
                                {section.title}
                            </h3>
                            <p className="text-[15px] font-semibold text-[#444] leading-[1.8]">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 pt-8 border-t border-border">
                    <p className="text-[13px] font-bold text-textMid">
                        Questions about privacy? Contact us at legal@unlockthecontent.io
                    </p>
                </div>
            </div>
        </div>
    );
};
