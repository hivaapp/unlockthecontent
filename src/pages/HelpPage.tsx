import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Mail } from 'lucide-react';

const FAQS = [
    { q: "How do I create my first link?", a: "Go to your dashboard or the homepage, upload a file or enter a prompt, select your ad settings, and click 'Generate Shareable Link'. Copy the resulting link and share it anywhere." },
    { q: "When will I receive my payout?", a: "Payouts are automatically sent weekly to your connected Stripe account for all balances over $10. It typically takes 2-3 business days to arrive in your bank account." },
    { q: "How do I connect Stripe?", a: "Navigate to the Account Settings tab in your dashboard, select 'Connected Stripe Account', and click the 'Connect with Stripe' button to follow the setup flow." },
    { q: "What is a Custom Sponsor link?", a: "A custom sponsor link lets you show your own sponsor's content instead of network ads. You negotiate the rate directly with your sponsor, and AdGate takes 0% commission on these unlock clicks." },
    { q: "Why was my payout lower than expected?", a: "Your payout might reflect the 5% platform fee (for network ads) and any optional 5% tree donations you enabled. Adjust your settings in the dashboard if needed." },
    { q: "How do I report a technical issue?", a: "Use the Contact Us page to report bugs. Select 'Bug Report' from the subject dropdown, and include as much detail as possible so our team can resolve it quickly." }
];

export const HelpPage = () => {
    useEffect(() => {
        document.title = "Help Center — AdGate";
    }, []);

    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const categories = [
        { icon: '🚀', name: 'Getting Started', count: '4 articles' },
        { icon: '💰', name: 'Earning & Payouts', count: '6 articles' },
        { icon: '✨', name: 'Custom Sponsors', count: '3 articles' },
        { icon: '👀', name: 'Viewer Experience', count: '4 articles' },
        { icon: '⚙️', name: 'Account & Settings', count: '5 articles' },
        { icon: '🔧', name: 'Technical Issues', count: '2 articles' }
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Full search coming soon');
    };

    return (
        <div className="w-full min-h-screen bg-bg">
            {/* Hero */}
            <div className="w-full bg-surface py-16 border-b border-border text-center">
                <div className="max-w-[800px] mx-auto px-4">
                    <h1 className="text-[28px] font-black text-text mb-2">Help Center</h1>
                    <p className="text-[15px] font-bold text-textMid mb-8">Find answers to common questions about AdGate.</p>

                    <form onSubmit={handleSearch} className="max-w-[500px] mx-auto">
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            className="w-[calc(100%-32px)] sm:w-full h-[52px] rounded-[16px] border border-border px-5 text-[15px] shadow-sm focus:outline-none focus:border-brand transition-colors"
                        />
                    </form>
                </div>
            </div>

            <div className="max-w-[800px] mx-auto px-4 py-16">
                {/* Categories */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="bg-white rounded-[14px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-border hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="text-[32px] mb-3">{cat.icon}</div>
                            <h3 className="text-[14px] font-[800] text-text mb-0.5">{cat.name}</h3>
                            <span className="text-[12px] text-textMid font-bold">{cat.count}</span>
                        </div>
                    ))}
                </div>

                {/* FAQs */}
                <div className="mb-16">
                    <h2 className="text-[20px] font-black text-text mb-6">Quick Answers</h2>
                    <div className="flex flex-col gap-3">
                        {FAQS.map((faq, idx) => (
                            <div key={idx} className="bg-white border border-border rounded-[16px] overflow-hidden">
                                <button
                                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surfaceAlt transition-colors"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                >
                                    <span className="font-black text-[15px] text-text pr-4">{faq.q}</span>
                                    {openFaq === idx ? <ChevronUp size={20} className="text-textMid min-w-[20px]" /> : <ChevronDown size={20} className="text-textMid min-w-[20px]" />}
                                </button>
                                {openFaq === idx && (
                                    <div className="px-5 pb-4 pt-1 text-[14px] font-bold text-textMid leading-relaxed">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Still Need Help */}
                <div className="bg-white border border-border rounded-[16px] p-8 text-center flex flex-col items-center shadow-sm">
                    <div className="w-12 h-12 bg-surfaceAlt rounded-full flex items-center justify-center mb-4">
                        <Mail className="text-textMid" size={24} />
                    </div>
                    <h3 className="text-[18px] font-black text-text mb-2">Still need help?</h3>
                    <p className="text-[14px] font-bold text-textMid mb-6">Our support team is always ready to assist you.</p>
                    <Link to="/contact" className="h-[44px] px-6 bg-brand text-white font-black text-[14px] rounded-[14px] flex items-center justify-center hover:bg-brand-hover transition-colors shadow-sm">
                        Contact Us
                    </Link>
                </div>
            </div>
        </div>
    );
};
