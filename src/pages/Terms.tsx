import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Terms = () => {
    useEffect(() => {
        document.title = "Terms of Service — UnlockTheContent";
    }, []);

    const sections = [
        {
            id: 'acceptance',
            title: '1. Acceptance of Terms',
            content: 'By accessing and using UnlockTheContent, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. We reserve the right to update or modify these terms at any time without prior notice.'
        },
        {
            id: 'description',
            title: '2. Description of Service',
            content: 'UnlockTheContent provides a platform that allows creators to monetize their digital content, including but not limited to files, links, and documents, by requiring users to view advertisements before accessing the content. We do not host your original content but facilitate the monetization layer.'
        },
        {
            id: 'creator-responsibilities',
            title: '3. Creator Accounts and Responsibilities',
            content: 'As a creator on UnlockTheContent, you are responsible for maintaining the confidentiality of your account credentials. You must ensure that all content you share through our platform complies with our content guidelines and does not violate any local, state, or international laws.'
        },
        {
            id: 'ad-revenue',
            title: '4. Ad Revenue and Payouts',
            content: 'UnlockTheContent operates as a free tool for creators to serve their own sponsor configurations. You keep 100% of your negotiated deals and UnlockTheContent charges a 0% fee. We do not collect or process ad revenue on your behalf.'
        },
        {
            id: 'content-guidelines',
            title: '5. Content Guidelines and Prohibited Content',
            content: 'Creators may not use UnlockTheContent to distribute illegal, offensive, copyrighted without permission, or defamatory material. We reserve the right to suspend or terminate accounts that repeatedly violate these guidelines. All content must adhere to our acceptable use policy.'
        },
        {
            id: 'custom-sponsors',
            title: '6. Custom Sponsor Ads and Third-Party Content',
            content: 'When utilizing the Custom Sponsor feature, creators are solely responsible for ensuring they have the rights to use the sponsor\'s creatives and branding. UnlockTheContent is not party to any agreements between creators and their custom sponsors.'
        },
        {
            id: 'intellectual-property',
            title: '7. Intellectual Property',
            content: 'You retain all ownership rights to the content you link through UnlockTheContent. By using our service, you grant us a limited license to display the metadata and thumbnails associated with your links for the purpose of operating the platform.'
        },
        {
            id: 'limitation-liability',
            title: '8. Limitation of Liability',
            content: 'UnlockTheContent is provided "as is" without any warranties. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including but not limited to lost profits or data loss.'
        }
    ];

    return (
        <div className="w-full min-h-screen bg-bg">
            <div className="w-full max-w-[680px] mx-auto px-6 sm:px-8 pt-12 pb-24">
                <Link to="/" className="text-[13px] font-bold text-textMid hover:text-text transition-colors flex items-center gap-1 mb-8">
                    ← Back to Home
                </Link>

                <h1 className="text-[32px] font-black text-[#111] mb-2">Terms of Service</h1>
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
                        Questions about these terms? Contact us at legal@unlockthecontent.io
                    </p>
                </div>
            </div>
        </div>
    );
};
