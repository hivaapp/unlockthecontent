import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock, CalendarX, CheckCircle2, CircleDollarSign, Percent, BadgeDollarSign, ChevronDown, ChevronUp } from 'lucide-react';

const PRICING_FAQS = [
    { q: "Is it really free?", a: "Yes. AdGate is 100% free for custom sponsors. You deal directly with your sponsor, and we take exactly $0." },
    { q: "What is a Custom Sponsor link?", a: "A Custom Sponsor link allows you to serve a video ad directly from your own sponsor before your content unlocks. You set the rate directly with your sponsor, and AdGate collects zero commission." },
    { q: "How do I find sponsors for my Custom Sponsor links?", a: "Many creators use existing affiliate links (like Amazon, software programs, or courses) as their custom sponsor. Or, if you have brand deals from platforms like YouTube or Instagram, you can offer 'link sponsorships' as a value-add or standalone package." },
    { q: "Are there any upload or storage fees?", a: "No. You get 100MB of free file storage per resource, and we never charge storage fees or limit your link traffic." },
];

export const Pricing = () => {
    const [isDonateOn, setIsDonateOn] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [customDealAmount, setCustomDealAmount] = useState('500');

    // Set meta tags properly
    useEffect(() => {
        document.title = "AdGate Pricing — 100% Free Custom Sponsor Links";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute("content", "AdGate takes 0%. No monthly fees. No hidden charges. No lock-in.");
        }
    }, []);

    const parsedCustomAmount = parseFloat(customDealAmount) || 0;
    const customDonateAmount = (parsedCustomAmount * 0.05).toFixed(2);
    const customTakeHome = isDonateOn ? (parsedCustomAmount - parseFloat(customDonateAmount)).toFixed(2) : parsedCustomAmount.toFixed(2);

    return (
        <div className="flex flex-col items-center w-full min-h-screen bg-bg selection:bg-brandTint selection:text-brand">
            {/* Hero Section */}
            <div className="w-full max-w-[800px] px-4 pt-12 sm:pt-20 pb-16 flex flex-col items-center text-center animate-fadeIn">
                <div className="h-[36px] bg-[#FFF0EF] border border-[#E8312A] border-opacity-20 px-4 rounded-full flex items-center gap-2 mb-6">
                    <span className="text-[14px]">💰</span>
                    <span className="text-[#E8312A] font-extrabold text-[11px] uppercase tracking-wider">Simple, creator-first pricing</span>
                </div>

                <h1 className="text-[clamp(28px,7vw,42px)] font-black text-[#111] leading-[1.05] tracking-tight mb-4">
                    Completely free. <br className="hidden sm:block" />Keep 100% of your sponsor deals.
                </h1>

                <p className="text-[#666] font-semibold text-[15px] max-w-[450px] mx-auto mb-10 leading-snug">
                    Custom Sponsor links are 100% free. No monthly fees. No hidden charges. No lock-in.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 cursor-default">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#E8312A]" />
                        <span className="text-[13px] font-bold text-[#444]">Free to join</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock size={16} className="text-[#E8312A]" />
                        <span className="text-[13px] font-bold text-[#444]">No upfront cost</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Percent size={16} className="text-[#6366F1]" />
                        <span className="text-[13px] font-bold text-[#444]">0% on sponsor links</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarX size={16} className="text-[#E8312A]" />
                        <span className="text-[13px] font-bold text-[#444]">Cancel anytime</span>
                    </div>
                </div>
            </div>

            {/* The Main Pricing Model Explanation */}
            <div className="w-full bg-[#F6F6F6] py-8 sm:py-12 flex flex-col items-center">
                <div className="w-full max-w-[800px] px-5 sm:px-8 flex flex-col items-center">
                    <h2 className="text-[20px] font-black text-[#111] text-center mb-1">How AdGate Pricing Works</h2>
                    <p className="text-[13px] text-textMid text-center mb-8">Follow the lifecycle of an unlocked resource.</p>

                    <div className="w-full bg-white rounded-[18px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-border flex flex-col">
                        <div className="flex items-start sm:items-center py-4 sm:py-5 border-b border-border gap-4">
                            <div className="text-success mt-1 sm:mt-0"><CheckCircle2 size={24} /></div>
                            <div className="flex-1">
                                <h3 className="text-[14px] font-extrabold text-text mb-1">Creating links</h3>
                                <p className="text-[13px] font-semibold text-textMid leading-relaxed">Upload your file, add your custom sponsor, generate a link. Completely free. Create unlimited links.</p>
                            </div>
                            <div className="h-[26px] px-2.5 bg-success text-white font-extrabold text-[10px] uppercase rounded-full flex items-center tracking-wider">
                                Free
                            </div>
                        </div>

                        <div className="flex items-start sm:items-center py-4 sm:py-5 border-b border-border gap-4">
                            <div className="text-[#F59E0B] mt-1 sm:mt-0"><CircleDollarSign size={24} /></div>
                            <div className="flex-1">
                                <h3 className="text-[14px] font-extrabold text-text mb-1">Earning Ad Revenue</h3>
                                <p className="text-[13px] font-semibold text-textMid leading-relaxed">You negotiate with your sponsor. You collect the money directly from your sponsor.</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[16px] font-black text-[#111]">100%</span>
                                <span className="text-[10px] text-textMid">collected</span>
                            </div>
                        </div>

                        <div className="flex items-start sm:items-center py-4 sm:py-5 border-b border-border gap-4">
                            <div className="text-[#E8312A] mt-1 sm:mt-0"><Percent size={24} /></div>
                            <div className="flex-1">
                                <h3 className="text-[14px] font-extrabold text-text mb-1">Platform Fee</h3>
                                <p className="text-[13px] font-semibold text-textMid leading-relaxed">Because you bring your own sponsor, AdGate takes absolutely zero commission.</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[20px] font-black text-[#6366F1]">0%</span>
                                <span className="text-[10px] text-textMid">fee</span>
                            </div>
                        </div>

                        <div className="flex items-start sm:items-center py-4 sm:py-5 gap-4">
                            <div className="text-success mt-1 sm:mt-0"><BadgeDollarSign size={24} /></div>
                            <div className="flex-1">
                                <h3 className="text-[14px] font-extrabold text-text mb-1">Your Earnings</h3>
                                <p className="text-[13px] font-semibold text-textMid leading-relaxed">You keep 100% of your Custom Sponsor deals.</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[20px] font-black text-success">100%</span>
                                <span className="text-[10px] text-textMid">yours</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-[13px] text-[#888] text-center mt-6">Donate 5% to plant trees? Fully optional. Comes from your earnings, not extra.</p>
                </div>
            </div>

            {/* Visual Math Section */}
            <div className="w-full bg-white py-12 flex flex-col items-center">
                <div className="w-full max-w-[600px] px-5 flex flex-col items-center">
                    <h2 className="text-[20px] font-black text-[#111] text-center mb-6">See Exactly What You Earn</h2>

                    <div className="w-full bg-white rounded-[18px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-border flex flex-col items-center mt-4">
                        <span className="text-[13px] font-bold text-textMid text-center mb-6">Example: You negotiate a $500 sponsorship</span>

                        <div className="w-full flex flex-col gap-2 relative">
                            {/* Custom Row 1 */}
                            <div className="w-full bg-[#F5F3FF] border border-[#DDD6FE] h-[52px] rounded-[14px] px-5 flex items-center justify-between">
                                <span className="text-[14px] font-bold text-[#4C1D95]">Your Sponsorship Deal (100%)</span>
                                <div className="flex items-center gap-1.5 bg-white border border-[#C4B5FD] rounded-[14px] px-3 h-[36px] overflow-hidden focus-within:ring-2 focus-within:ring-[#6366F1]">
                                    <span className="font-black text-[#4C1D95] text-[16px]">$</span>
                                    <input
                                        type="text"
                                        value={customDealAmount}
                                        onChange={(e) => setCustomDealAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                        className="w-[80px] bg-transparent outline-none font-black text-[#4C1D95] text-[16px] text-right"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center -my-2 z-10">
                                <div className="bg-white p-1 pb-1.5"><ChevronDown size={14} className="text-textLight" /></div>
                            </div>

                            {/* Custom Row 2 */}
                            <div className="w-full bg-white border-l-[3px] border-[#6366F1] h-[48px] rounded-r-[14px] shadow-sm border-y border-r border-[#F3F1EC] px-4 flex items-center justify-between">
                                <span className="text-[14px] font-bold text-text">Platform Commission</span>
                                <span className="text-[16px] font-black text-[#4C1D95]">-$0.00</span>
                            </div>

                            {/* Custom Row 3 (Conditional) */}
                            {isDonateOn && (
                                <>
                                    <div className="flex justify-center -my-2 z-10">
                                        <div className="bg-white p-1 pb-1.5"><ChevronDown size={14} className="text-textLight" /></div>
                                    </div>
                                    <div className="w-full bg-white border-l-[3px] border-success h-[48px] rounded-r-[14px] shadow-sm border-y border-r border-[#F3F1EC] px-4 flex items-center justify-between animate-slideDown">
                                        <span className="text-[14px] font-bold text-text">Tree Donation (5% of your deal)</span>
                                        <span className="text-[16px] font-black text-success">- ${customDonateAmount}</span>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-center -my-2 z-10">
                                <div className="bg-white p-1 pb-1.5"><ChevronDown size={14} className="text-textLight" /></div>
                            </div>

                            {/* Custom Row 4 */}
                            <div className="w-full bg-[#EDFAF3] h-[56px] rounded-[12px] px-5 flex items-center justify-between border border-[#D1FADF]">
                                <span className="text-[15px] font-black text-text">Your Final Take Home</span>
                                <span className="text-[22px] font-black text-success">${customTakeHome}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-8">
                            <span className="text-[14px] font-bold text-text">Include tree donation?</span>
                            <button
                                onClick={() => setIsDonateOn(!isDonateOn)}
                                className={`w-[44px] h-[24px] rounded-full p-1 transition-colors relative shrink-0 ${isDonateOn ? 'bg-success' : 'bg-textLight'}`}
                            >
                                <div className={`w-[16px] h-[16px] bg-white rounded-full transition-transform absolute top-1 ${isDonateOn ? 'translate-x-[20px]' : 'translate-x-[0px]'}`} />
                            </button>
                        </div>

                        <p className="text-[11px] text-textMid text-center mt-6">
                            Based on estimated $0.035 CPM per unlock. Actual earnings vary by geography, niche, and ad type.
                        </p>
                    </div>
                </div>
            </div>

            {/* Plan Comparison Section */}
            <div className="w-full bg-white py-12 flex flex-col items-center">
                <div className="w-full max-w-[900px] px-5 flex flex-col items-center">
                    <h2 className="text-[24px] font-black text-[#111] text-center mb-1">Simple, Transparent Pricing</h2>
                    <p className="text-[14px] text-textMid text-center mb-10">Start for free, upgrade when you're ready to scale.</p>

                    <div className="w-full flex flex-col sm:flex-row gap-6 items-stretch justify-center">
                        {/* Free Plan */}
                        <div className="flex-1 bg-white border-2 border-[#E8E8E8] rounded-[18px] p-6 flex flex-col">
                            <h3 className="text-[18px] font-black text-[#111]">Free</h3>
                            <p className="text-[13px] text-textMid mb-6">Perfect for getting started</p>

                            <div className="flex items-baseline mb-2">
                                <span className="text-[24px] font-black text-[#111] -mt-2 self-start">$</span>
                                <span className="text-[48px] font-black text-[#111] leading-none">0</span>
                            </div>
                            <p className="text-[14px] font-bold text-textMid mb-6">forever</p>

                            <div className="w-full h-px bg-border mb-6" />

                            <div className="flex flex-col gap-3 mb-8 flex-1">
                                <div className="flex items-start gap-3">
                                    <Check size={16} className="text-[#333] shrink-0 mt-0.5" />
                                    <span className="text-[13px] font-bold text-[#333]">Unlimited Custom Sponsor links (0% fee)</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check size={16} className="text-[#333] shrink-0 mt-0.5" />
                                    <span className="text-[13px] font-bold text-[#333]">Up to 3 Follower Pairing active challenges</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check size={16} className="text-[#333] shrink-0 mt-0.5" />
                                    <span className="text-[13px] font-bold text-[#333]">100MB file storage per resource</span>
                                </div>
                            </div>

                            <Link to="/" className="w-full h-[48px] bg-white border-2 border-[#E8E8E8] text-[#111] font-black text-[15px] rounded-[14px] flex items-center justify-center hover:bg-[#F8F8F8] transition-colors">
                                Get Started Free
                            </Link>
                        </div>

                        {/* Pro Plan */}
                        <div className="flex-1 bg-white border-[3px] border-brand rounded-[18px] p-6 flex flex-col relative shadow-sm">
                            <div className="absolute top-0 right-6 -translate-y-1/2 bg-brand text-white font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-full">
                                Most Popular
                            </div>
                            <h3 className="text-[18px] font-black text-[#111]">Pro</h3>
                            <p className="text-[13px] text-textMid mb-6">For serious creators scaling their communities</p>

                            <div className="flex items-baseline mb-2">
                                <span className="text-[24px] font-black text-[#111] -mt-2 self-start">$</span>
                                <span className="text-[48px] font-black text-[#111] leading-none">10</span>
                                <span className="text-[16px] font-bold text-textMid ml-1">/mo</span>
                            </div>
                            <p className="text-[14px] font-bold text-textMid mb-6">billed monthly</p>

                            <div className="w-full h-px bg-border mb-6" />

                            <div className="flex flex-col gap-3 mb-8 flex-1">
                                <div className="flex items-start gap-3">
                                    <Check size={16} className="text-brand shrink-0 mt-0.5" />
                                    <span className="text-[13px] font-black text-[#111]">Unlimited Follower Pairing challenges</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check size={16} className="text-[#333] shrink-0 mt-0.5" />
                                    <span className="text-[13px] font-bold text-[#333]">Advanced custom sponsor targeting</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check size={16} className="text-[#333] shrink-0 mt-0.5" />
                                    <span className="text-[13px] font-bold text-[#333]">1GB file storage per resource</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check size={16} className="text-[#333] shrink-0 mt-0.5" />
                                    <span className="text-[13px] font-bold text-[#333]">Priority email support</span>
                                </div>
                            </div>

                            <Link to="/" className="w-full h-[48px] bg-brand text-white font-black text-[15px] rounded-[14px] flex items-center justify-center hover:bg-brandHover transition-colors shadow-md">
                                Upgrade to Pro
                            </Link>
                        </div>
                    </div>

                    <p className="text-[13px] text-textMid text-center mt-8">Includes the tree planting donation option on all plans. 🌱</p>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="w-full bg-white py-12 flex flex-col items-center">
                <div className="w-full max-w-[600px] px-5">
                    <h2 className="text-[20px] font-black text-[#111] mb-8 text-center">Pricing FAQs</h2>

                    <div className="flex flex-col gap-3">
                        {PRICING_FAQS.map((faq, idx) => (
                            <div key={idx} className="bg-white border border-border rounded-[16px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                                <button
                                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surfaceAlt transition-colors"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                >
                                    <span className="font-black text-[15px] text-text pr-4">{faq.q}</span>
                                    {openFaq === idx ? <ChevronUp size={20} className="text-textMid min-w-[20px]" /> : <ChevronDown size={20} className="text-textMid min-w-[20px]" />}
                                </button>
                                {openFaq === idx && (
                                    <div className="px-5 pb-4 pt-1 text-[14px] font-semibold text-textMid leading-relaxed">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="w-full bg-[#0F4C2A] py-[48px] flex flex-col items-center">
                <div className="w-full max-w-[600px] px-5 flex flex-col items-center text-center">
                    <div className="text-[48px] mb-4">🌳</div>
                    <h2 className="text-[24px] font-black text-white mb-2">Start earning today. It's free.</h2>
                    <p className="text-[14px] font-bold text-white/70 mb-8">Custom ads: 100% yours. 0% risk. 0% Commission.</p>
                    <Link to="/" className="w-full sm:w-[200px] h-[52px] bg-[#E8312A] text-white font-extrabold text-[15px] rounded-[14px] flex items-center justify-center hover:bg-[#C42823] transition-colors shadow-sm">
                        Create Your First Link
                    </Link>
                </div>
            </div>

            {/* Standard Footer */}
            <footer className="w-full bg-white border-t border-border py-12 px-4 flex flex-col items-center">
                <div className="w-full max-w-[1000px] flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-80">
                        <div className="w-6 h-6 rounded-[14px] bg-text text-white flex items-center justify-center font-black text-[10px] leading-none shrink-0">
                            AG
                        </div>
                        <span className="font-black text-[16px] tracking-tight text-text">AdGate</span>
                    </div>

                    <div className="flex items-center gap-6 text-[13px] font-bold text-textMid">
                        <Link to="/explore" className="hover:text-text transition-colors">Explore</Link>
                        <Link to="/terms" className="hover:text-text transition-colors">Terms of Service</Link>
                        <Link to="/privacy" className="hover:text-text transition-colors">Privacy Policy</Link>
                        <Link to="/contact" className="hover:text-text transition-colors">Contact</Link>
                    </div>

                    <div className="text-[12px] font-bold text-textLight">
                        © {new Date().getFullYear()} AdGate Inc. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};
