import { useEffect, useRef, useState } from 'react';
import './BelowTheFold.css';

interface CreatorType {
    id: string;
    label: string;
    icon: string;
    lockItems: string[];
    unlockIcon1: string;
    unlockType1: string;
    unlockColor1: string;
    unlockIcon2?: string;
    unlockType2?: string;
    unlockColor2?: string;
    reason: string;
    primaryUnlock: string;
}

const CREATOR_TYPES: CreatorType[] = [
    {
        id: 'designer', label: 'Designer', icon: '🎨',
        lockItems: ['📄 UI kit PDF', '🎨 Figma component files', '📸 Design system screenshots'],
        unlockIcon1: '📧', unlockType1: 'Email', unlockColor1: '#166534',
        unlockIcon2: '👥', unlockType2: 'Follow', unlockColor2: '#2563EB',
        reason: 'Designers share on social — use follow gates to grow all your platforms at once.',
        primaryUnlock: 'social_follow'
    },
    {
        id: 'developer', label: 'Developer', icon: '💻',
        lockItems: ['📄 Code templates', '🛠️ CLI tools', '✂️ Snippet packs', '📦 Boilerplates'],
        unlockIcon1: '👥', unlockType1: 'Follow', unlockColor1: '#2563EB',
        reason: 'Your audience is on YouTube and Twitter. Grow both from one resource.',
        primaryUnlock: 'social_follow'
    },
    {
        id: 'educator', label: 'Educator', icon: '📚',
        lockItems: ['📝 Course outlines', '📖 Study guides', '🧠 Frameworks', '📄 Worksheets'],
        unlockIcon1: '📧', unlockType1: 'Email', unlockColor1: '#166534',
        unlockIcon2: '🤝', unlockType2: 'Pairing', unlockColor2: '#92400E',
        reason: 'Build your pre-launch list now. Run pairing challenges to prove your methods work.',
        primaryUnlock: 'email_subscribe'
    },
    {
        id: 'coach', label: 'Coach', icon: '🏋️',
        lockItems: ['🚫 No file needed'],
        unlockIcon1: '🤝', unlockType1: 'Follower Pairing', unlockColor1: '#92400E',
        reason: 'Your value is accountability structures. Pairing does that better than any PDF can.',
        primaryUnlock: 'follower_pairing'
    },
    {
        id: 'photographer', label: 'Photographer', icon: '📸',
        lockItems: ['🏔️ Extended shoots', '🖼️ Raw galleries', '🎞️ Behind-the-scenes content'],
        unlockIcon1: '📧', unlockType1: 'Email', unlockColor1: '#166534',
        reason: 'People who want your premium work will subscribe. These become your highest-value list segment.',
        primaryUnlock: 'email_subscribe'
    },
    {
        id: 'writer', label: 'Writer', icon: '✍️',
        lockItems: ['📄 Templates', '📁 Swipe files', '📝 Prompt packs', '🧠 Writing frameworks'],
        unlockIcon1: '📧', unlockType1: 'Email', unlockColor1: '#166534',
        reason: 'Writers build with email. Every free resource you give away becomes a subscriber.',
        primaryUnlock: 'email_subscribe'
    },
    {
        id: 'filmmaker', label: 'Filmmaker', icon: '🎬',
        lockItems: ['🎥 Extended cuts', '🎬 BTS footage', '📚 Tutorial series', '🎨 Grade presets'],
        unlockIcon1: '⭐', unlockType1: 'Sponsor', unlockColor1: '#4338CA',
        unlockIcon2: '📧', unlockType2: 'Email', unlockColor2: '#166534',
        reason: 'Premium video content is perfect for sponsor gates — attentive viewers who opted in.',
        primaryUnlock: 'custom_sponsor'
    },
    {
        id: 'freelancer', label: 'Freelancer', icon: '💼',
        lockItems: ['📄 Proposal templates', '✍️ Client email scripts', '🧮 Rate calculators'],
        unlockIcon1: '📧', unlockType1: 'Email', unlockColor1: '#166534',
        unlockIcon2: '🤝', unlockType2: 'Pairing', unlockColor2: '#92400E',
        reason: 'Build a list of freelancers. Run a revenue challenge. Both grow your credibility and community.',
        primaryUnlock: 'email_subscribe'
    }
];

export const BelowTheFold = ({ onStartPro }: { onStartPro?: () => void }) => {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [selectedType, setSelectedType] = useState<CreatorType>(CREATOR_TYPES[0]);

    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('btf-revealed');
                }
            });
        }, { threshold: 0.15 });

        const targets = document.querySelectorAll('.btf-reveal');
        targets.forEach((t) => observerRef.current?.observe(t));

        return () => observerRef.current?.disconnect();
    }, []);

    const scrollToGenerator = (unlockType?: string) => {
        if (unlockType) {
            window.dispatchEvent(new CustomEvent('SELECT_UNLOCK_TYPE', { detail: unlockType }));
        }
        const generationArea = document.getElementById('generator');
        if (generationArea) {
             generationArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
             window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="btf-root text-text bg-bg selection:bg-brandTint selection:text-brand">
            {/* ── Section 1: The Honest Exchange ── */}
            <section className="bg-surface py-[80px] lg:py-[96px] w-full flex flex-col items-center border-t border-border">
                <div className="w-full max-w-[1140px] px-6 lg:px-8 btf-reveal">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 w-full max-w-[800px] mx-auto">
                        
                        {/* Item 1 — The Creator */}
                        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col items-center w-full lg:w-[200px]">
                            <div className="w-[64px] h-[64px] bg-text rounded-full flex items-center justify-center text-white text-[14px] font-[800]">
                                You
                            </div>
                            <span className="text-[12px] font-[800] text-textLight uppercase tracking-[0.5px] mt-2">
                                You
                            </span>
                            <div className="relative w-[40px] h-[40px] mt-4">
                                <div className="absolute top-0 left-0 w-[28px] h-[28px] bg-surfaceAlt border border-border rounded-[4px] flex items-center justify-center text-[12px] transform -rotate-6 z-10">📄</div>
                                <div className="absolute top-2 left-3 w-[28px] h-[28px] bg-surfaceAlt border border-border rounded-[4px] flex items-center justify-center text-[12px] transform rotate-3 z-20">📸</div>
                                <div className="absolute top-4 left-0 w-[28px] h-[28px] bg-surfaceAlt border border-border rounded-[4px] flex items-center justify-center text-[12px] transform -rotate-3 z-30">🎬</div>
                            </div>
                        </div>

                        {/* Connecting element 1 */}
                        <div className="flex flex-col items-center justify-center gap-1">
                            <span className="hidden lg:block text-border text-[32px] font-[300] leading-none">→</span>
                            <span className="block lg:hidden text-border text-[32px] font-[300] leading-none">↓</span>
                            <span className="text-[11px] font-[700] text-textLight">locks it</span>
                        </div>

                        {/* Item 2 — The Lock */}
                        <div className="bg-text rounded-lg p-6 flex flex-col items-center w-full lg:w-[200px]">
                            <div className="text-[48px] leading-none">🔒</div>
                            <span className="text-[16px] font-[900] text-white mt-3 text-center">Free to unlock</span>
                            <span className="text-[13px] text-white/50 text-center mt-1">No payment. Ever.</span>
                        </div>

                        {/* Connecting element 2 */}
                        <div className="flex flex-col items-center justify-center gap-1">
                            <span className="hidden lg:block text-border text-[32px] font-[300] leading-none">→</span>
                            <span className="block lg:hidden text-border text-[32px] font-[300] leading-none">↓</span>
                            <span className="text-[11px] font-[700] text-textLight">unlocks it by</span>
                        </div>

                        {/* Item 3 — The Follower */}
                        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col items-center w-full lg:w-[200px]">
                            <div className="w-[64px] h-[64px] bg-success rounded-full flex items-center justify-center text-white text-[14px] font-[800]">
                                Them
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <div className="bg-surfaceAlt text-textMid rounded-[10px] h-[24px] flex items-center justify-center px-2 text-[10px] font-[700] whitespace-nowrap">📧 Subscribe</div>
                                <div className="bg-surfaceAlt text-textMid rounded-[10px] h-[24px] flex items-center justify-center px-2 text-[10px] font-[700] whitespace-nowrap">👥 Follow</div>
                                <div className="bg-surfaceAlt text-textMid rounded-[10px] h-[24px] flex items-center justify-center px-2 text-[10px] font-[700] whitespace-nowrap">⭐ Watch</div>
                                <div className="bg-surfaceAlt text-textMid rounded-[10px] h-[24px] flex items-center justify-center px-2 text-[10px] font-[700] whitespace-nowrap">🤝 Pair</div>
                            </div>
                        </div>

                    </div>
                    
                    <div className="mt-8">
                        <p className="text-[15px] font-[700] text-textMid text-center w-full block">
                            Your followers get your content free. You get something that lasts.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Section 2: Four Ways In Four Cards ── */}
            <section className="bg-bg py-[80px] lg:py-[96px] w-full flex flex-col items-center">
                <div className="w-full max-w-[1140px] px-6 lg:px-8 btf-reveal">
                    
                    <h2 className="text-[11px] font-[800] text-textLight uppercase tracking-[0.8px] text-center mb-0">How creators grow</h2>
                    <h3 className="text-[36px] lg:text-[44px] font-[900] text-text leading-[1.2] text-center mt-[12px] mb-[40px]">
                        Pick your growth engine.
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[12px] md:gap-[16px]">
                        
                        {/* Email Card */}
                        <div className="flex flex-col bg-surface rounded-lg overflow-hidden border border-[#E6E2D9] h-auto btf-reveal btf-stagger-1">
                            <div className="bg-[#166534] h-[56px] px-[20px] flex items-center gap-[12px] shrink-0">
                                <div className="w-[36px] h-[36px] bg-surface/20 rounded-full flex items-center justify-center text-[20px] shrink-0">📧</div>
                                <div className="flex flex-col pt-0.5">
                                    <span className="text-[14px] font-[900] text-white leading-none">Email</span>
                                    <span className="text-[11px] text-white/75 mt-1 leading-[1.2]">They join your email list.</span>
                                </div>
                            </div>
                            <div className="p-[20px] bg-surface flex-1">
                                <span className="text-[10px] font-[800] text-textLight uppercase block mb-1">You set up:</span>
                                <p className="text-[14px] font-[700] text-textMid leading-[1.5]">Your newsletter name and the content they unlock.</p>
                            </div>
                            <div className="p-[16px] bg-[#EDFAF3] border-t border-[#BBF7D0] shrink-0">
                                <span className="text-[10px] font-[800] text-[#166534] uppercase block mb-1">You get:</span>
                                <p className="text-[13px] font-[800] text-[#166534] truncate">A confirmed new subscriber you own.</p>
                            </div>
                        </div>

                        {/* Follow Card */}
                        <div className="flex flex-col bg-surface rounded-lg overflow-hidden border border-[#E6E2D9] h-auto btf-reveal btf-stagger-2">
                            <div className="bg-[#1E3A8A] h-[56px] px-[20px] flex items-center gap-[12px] shrink-0">
                                <div className="w-[36px] h-[36px] bg-surface/20 rounded-full flex items-center justify-center text-[20px] shrink-0">👥</div>
                                <div className="flex flex-col pt-0.5">
                                    <span className="text-[14px] font-[900] text-white leading-none">Follow</span>
                                    <span className="text-[11px] text-white/75 mt-1 leading-[1.2]">They follow your social channels.</span>
                                </div>
                            </div>
                            <div className="p-[20px] bg-surface flex-1">
                                <span className="text-[10px] font-[800] text-textLight uppercase block mb-1">You set up:</span>
                                <p className="text-[14px] font-[700] text-textMid leading-[1.5]">Your social profiles — up to 6 platforms.</p>
                            </div>
                            <div className="p-[16px] bg-[#EFF6FF] border-t border-[#BFDBFE] shrink-0">
                                <span className="text-[10px] font-[800] text-[#1E3A8A] uppercase block mb-1">You get:</span>
                                <p className="text-[13px] font-[800] text-[#1E3A8A] truncate">Cross-platform audience growth quickly.</p>
                            </div>
                        </div>

                        {/* Sponsor Card */}
                        <div className="flex flex-col bg-surface rounded-lg overflow-hidden border border-[#E6E2D9] h-auto btf-reveal btf-stagger-3">
                            <div className="bg-[#4338CA] h-[56px] px-[20px] flex items-center gap-[12px] shrink-0">
                                <div className="w-[36px] h-[36px] bg-surface/20 rounded-full flex items-center justify-center text-[20px] shrink-0">⭐</div>
                                <div className="flex flex-col pt-0.5">
                                    <span className="text-[14px] font-[900] text-white leading-none">Sponsor</span>
                                    <span className="text-[11px] text-white/75 mt-1 leading-[1.2]">They watch your sponsor's ad.</span>
                                </div>
                            </div>
                            <div className="p-[20px] bg-surface flex-1">
                                <span className="text-[10px] font-[800] text-textLight uppercase block mb-1">You set up:</span>
                                <p className="text-[14px] font-[700] text-textMid leading-[1.5]">Your sponsor's video ad and their website link.</p>
                            </div>
                            <div className="p-[16px] bg-[#F5F3FF] border-t border-[#DDD6FE] shrink-0">
                                <span className="text-[10px] font-[800] text-[#4338CA] uppercase block mb-1">You get:</span>
                                <p className="text-[13px] font-[800] text-[#4338CA] truncate">100% of the ad revenue with verified views.</p>
                            </div>
                        </div>

                        {/* Pairing Card */}
                        <div className="flex flex-col bg-surface rounded-lg overflow-hidden border border-[#E6E2D9] h-auto btf-reveal btf-stagger-4">
                            <div className="bg-[#92400E] h-[56px] px-[20px] flex items-center gap-[12px] shrink-0">
                                <div className="w-[36px] h-[36px] bg-surface/20 rounded-full flex items-center justify-center text-[20px] shrink-0">🤝</div>
                                <div className="flex flex-col pt-0.5">
                                    <span className="text-[14px] font-[900] text-white leading-none">Pairing</span>
                                    <span className="text-[11px] text-white/75 mt-1 leading-[1.2]">They join a community challenge.</span>
                                </div>
                            </div>
                            <div className="p-[20px] bg-surface flex-1">
                                <span className="text-[10px] font-[800] text-textLight uppercase block mb-1">You set up:</span>
                                <p className="text-[14px] font-[700] text-textMid leading-[1.5]">A topic, a commitment prompt, and a timeframe. No files needed.</p>
                            </div>
                            <div className="p-[16px] bg-[#FFFBEB] border-t border-[#FDE68A] shrink-0">
                                <span className="text-[10px] font-[800] text-[#92400E] uppercase block mb-1">You get:</span>
                                <p className="text-[13px] font-[800] text-[#92400E] truncate">An engaged, accountable community.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── Section 3: Real Numbers, Real Creators ── */}
            <section className="bg-surface py-[80px] lg:py-[96px] w-full flex flex-col items-center">
                <div className="w-full max-w-[1140px] px-6 lg:px-8 btf-reveal">
                    
                    <h2 className="text-[11px] font-[800] text-textLight uppercase tracking-[0.8px] text-center mb-0">Real Creator Results</h2>
                    <h3 className="text-[36px] lg:text-[44px] font-[900] text-text leading-[1.2] text-center mt-[12px] mb-[40px]">
                        The growth you can expect.
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px]">
                        
                        {/* Story 1 */}
                        <div className="bg-surface border border-[var(--border)] rounded-[16px] p-[24px] lg:min-h-[200px] flex flex-col justify-between btf-reveal btf-stagger-1">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[40px] h-[40px] bg-[#EDFAF3] text-[#166534] font-[800] flex items-center justify-center rounded-full text-[16px]">P</div>
                                        <div>
                                            <div className="text-[14px] font-[800] text-text leading-none">Priya</div>
                                            <div className="text-[11px] font-[600] text-textMid mt-1">UX Designer</div>
                                        </div>
                                    </div>
                                    <div className="bg-[#EDFAF3] text-[#166534] text-[10px] font-[800] px-2 py-1 rounded-[10px]">Email</div>
                                </div>
                                <span className="text-[11px] font-[800] text-textLight uppercase block mb-1">Before:</span>
                                <p className="text-[13px] font-[600] text-textMid line-height-[1.65]">800 saves on every Figma kit post. Zero emails to show for it.</p>
                            </div>
                            <div className="border-t border-[#F4F4F4] mt-[16px] pt-[16px]">
                                <span className="text-[11px] font-[800] text-[#166534] uppercase block mb-1">After one month:</span>
                                <p className="text-[16px] font-[900] text-text leading-[1.3]">1,400 subscribers from 2 resources.</p>
                            </div>
                        </div>

                        {/* Story 2 */}
                        <div className="bg-surface border border-[var(--border)] rounded-[16px] p-[24px] lg:min-h-[200px] flex flex-col justify-between btf-reveal btf-stagger-2">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[40px] h-[40px] bg-[#EFF6FF] text-[#1E3A8A] font-[800] flex items-center justify-center rounded-full text-[16px]">A</div>
                                        <div>
                                            <div className="text-[14px] font-[800] text-text leading-none">Arjun</div>
                                            <div className="text-[11px] font-[600] text-textMid mt-1">Developer</div>
                                        </div>
                                    </div>
                                    <div className="bg-[#EFF6FF] text-[#1E3A8A] text-[10px] font-[800] px-2 py-1 rounded-[10px]">Follow</div>
                                </div>
                                <span className="text-[11px] font-[800] text-textLight uppercase block mb-1">Before:</span>
                                <p className="text-[13px] font-[600] text-textMid line-height-[1.65]">Free Python scripts getting 400 GitHub stars. Other platforms stayed flat.</p>
                            </div>
                            <div className="border-t border-[#F4F4F4] mt-[16px] pt-[16px]">
                                <span className="text-[11px] font-[800] text-[#2563EB] uppercase block mb-1">After one month:</span>
                                <p className="text-[16px] font-[900] text-text leading-[1.3]">900 new YouTube subscribers, 700 on Twitter — from one resource.</p>
                            </div>
                        </div>

                        {/* Story 3 */}
                        <div className="bg-surface border border-[var(--border)] rounded-[16px] p-[24px] lg:min-h-[200px] flex flex-col justify-between btf-reveal btf-stagger-3">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[40px] h-[40px] bg-[#F5F3FF] text-[#4338CA] font-[800] flex items-center justify-center rounded-full text-[16px]">N</div>
                                        <div>
                                            <div className="text-[14px] font-[800] text-text leading-none">Neha</div>
                                            <div className="text-[11px] font-[600] text-textMid mt-1">Lifestyle Creator</div>
                                        </div>
                                    </div>
                                    <div className="bg-[#F5F3FF] text-[#4338CA] text-[10px] font-[800] px-2 py-1 rounded-[10px]">Sponsor</div>
                                </div>
                                <span className="text-[11px] font-[800] text-textLight uppercase block mb-1">Before:</span>
                                <p className="text-[13px] font-[600] text-textMid line-height-[1.65]">A brand deal with no way to prove her audience actually watched it.</p>
                            </div>
                            <div className="border-t border-[#F4F4F4] mt-[16px] pt-[16px]">
                                <span className="text-[11px] font-[800] text-[#6366F1] uppercase block mb-1">After one month:</span>
                                <p className="text-[16px] font-[900] text-text leading-[1.3]">Sponsor report sent in one tap. Rebooking confirmed.</p>
                            </div>
                        </div>

                        {/* Story 4 */}
                        <div className="bg-surface border border-[var(--border)] rounded-[16px] p-[24px] lg:min-h-[200px] flex flex-col justify-between btf-reveal btf-stagger-4">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[40px] h-[40px] bg-[#FFFBEB] text-[#92400E] font-[800] flex items-center justify-center rounded-full text-[16px]">R</div>
                                        <div>
                                            <div className="text-[14px] font-[800] text-text leading-none">Rohan</div>
                                            <div className="text-[11px] font-[600] text-textMid mt-1">Fitness Creator</div>
                                        </div>
                                    </div>
                                    <div className="bg-[#FFFBEB] text-[#92400E] text-[10px] font-[800] px-2 py-1 rounded-[10px]">Pairing</div>
                                </div>
                                <span className="text-[11px] font-[800] text-textLight uppercase block mb-1">Before:</span>
                                <p className="text-[13px] font-[600] text-textMid line-height-[1.65]">21-day workout series. Same people commented 'fell off' every week.</p>
                            </div>
                            <div className="border-t border-[#F4F4F4] mt-[16px] pt-[16px]">
                                <span className="text-[11px] font-[800] text-[#B45309] uppercase block mb-1">After one month:</span>
                                <p className="text-[16px] font-[900] text-text leading-[1.3]">68 pairs formed. First time most of them finished anything.</p>
                            </div>
                        </div>

                    </div>

                </div>
            </section>

            {/* ── Section 4: The One-Line Dark Strip ── */}
            <section className="bg-text py-[64px] px-6 w-full flex items-center justify-center text-center">
                <div className="w-full max-w-[640px] btf-reveal">
                    <h2 className="text-[26px] lg:text-[32px] font-[900] text-white leading-[1.4] m-0">
                        Stop giving your content away for likes. Start trading it for real audience growth.
                    </h2>
                </div>
            </section>

            {/* ── Section 5: Follower Pairing — The Visual Story ── */}
            <section className="bg-[#FFFBEB] py-[80px] lg:py-[96px] w-full flex flex-col items-center">
                <div className="w-full max-w-[1140px] px-6 lg:px-8 btf-reveal">
                    
                    <div className="flex justify-center mb-[12px]">
                        <span className="bg-[#FDE68A] text-[#92400E] px-4 py-1 rounded-[20px] text-[11px] font-[800] uppercase tracking-[0.8px]">Follower Pairing</span>
                    </div>
                    <h2 className="text-[36px] lg:text-[44px] font-[900] text-text leading-[1.2] text-center max-w-[480px] mx-auto m-0">
                        Most people fail alone. Your followers won't.
                    </h2>
                    <p className="text-[15px] font-[600] text-textMid text-center max-w-[400px] leading-[1.65] mt-[12px] mx-auto">
                        No file needed. You create a challenge. They pair up and support each other every day.
                    </p>

                    {/* Visual Journey */}
                    <div className="mt-[40px] flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-[12px] lg:gap-2">
                        
                        {/* Step 1 */}
                        <div className="bg-surface border border-[#FDE68A] rounded-[12px] p-[16px] text-center w-full lg:w-[160px] flex flex-col items-center">
                            <span className="text-[32px] block">✏️</span>
                            <span className="text-[14px] font-[800] text-text mt-2 block">You write a challenge</span>
                            <span className="text-[12px] font-[600] text-textMid mt-2 block">Topic + commitment question + duration.</span>
                        </div>
                        <span className="text-[24px] text-[#FDE68A] block lg:hidden font-[300]">↓</span>
                        <span className="text-[24px] text-[#FDE68A] hidden lg:flex items-center justify-center font-[300]">→</span>

                        {/* Step 2 */}
                        <div className="bg-surface border border-[#FDE68A] rounded-[12px] p-[16px] text-center w-full lg:w-[160px] flex flex-col items-center">
                            <span className="text-[32px] block">👆</span>
                            <span className="text-[14px] font-[800] text-text mt-2 block">They click your link</span>
                            <span className="text-[12px] font-[600] text-textMid mt-2 block">They read the challenge and write their personal commitment.</span>
                        </div>
                        <span className="text-[24px] text-[#FDE68A] block lg:hidden font-[300]">↓</span>
                        <span className="text-[24px] text-[#FDE68A] hidden lg:flex items-center justify-center font-[300]">→</span>

                        {/* Step 3 */}
                        <div className="bg-surface border border-[#FDE68A] rounded-[12px] p-[16px] text-center w-full lg:w-[160px] flex flex-col items-center">
                            <span className="text-[32px] block">🤝</span>
                            <span className="text-[14px] font-[800] text-text mt-2 block">They get matched</span>
                            <span className="text-[12px] font-[600] text-textMid mt-2 block">Paired instantly with someone starting the same journey.</span>
                        </div>
                        <span className="text-[24px] text-[#FDE68A] block lg:hidden font-[300]">↓</span>
                        <span className="text-[24px] text-[#FDE68A] hidden lg:flex items-center justify-center font-[300]">→</span>

                        {/* Step 4 */}
                        <div className="bg-surface border border-[#FDE68A] rounded-[12px] p-[16px] text-center w-full lg:w-[160px] flex flex-col items-center">
                            <span className="text-[32px] block">💬</span>
                            <span className="text-[14px] font-[800] text-text mt-2 block">They chat privately</span>
                            <span className="text-[12px] font-[600] text-textMid mt-2 block">Daily check-ins with their partner. <span className="text-[#B45309] font-[700] text-[11px]">You cannot read it.</span></span>
                        </div>
                        <span className="text-[24px] text-[#FDE68A] block lg:hidden font-[300]">↓</span>
                        <span className="text-[24px] text-[#FDE68A] hidden lg:flex items-center justify-center font-[300]">→</span>

                        {/* Step 5 */}
                        <div className="bg-surface border border-[#FDE68A] rounded-[12px] p-[16px] text-center w-full lg:w-[160px] flex flex-col items-center">
                            <span className="text-[32px] block">📣</span>
                            <span className="text-[14px] font-[800] text-text mt-2 block">You guide them</span>
                            <span className="text-[12px] font-[600] text-textMid mt-2 block">Your pre-written messages go out automatically on set days.</span>
                        </div>

                    </div>

                    {/* Evidence Box */}
                    <div className="mt-[40px] w-full max-w-[480px] mx-auto bg-surface border border-[#FDE68A] rounded-[16px] p-[20px] flex flex-col sm:flex-row items-center sm:items-stretch gap-[20px]">
                        <div className="flex flex-col items-center sm:items-end justify-center w-full sm:w-[140px] shrink-0 text-center sm:text-right">
                            <span className="text-[48px] font-[900] text-[#B45309] leading-none mb-1 block">68</span>
                            <span className="text-[13px] font-[600] text-textMid block">pairs formed</span>
                        </div>
                        <div className="flex flex-col justify-center border-t-2 sm:border-t-0 sm:border-l-2 border-[#FDE68A] w-full sm:w-auto pt-[20px] sm:pt-0 sm:pl-[20px] gap-1">
                            <span className="text-[15px] font-[800] text-text">25 minutes setup.</span>
                            <span className="text-[13px] font-[600] text-textMid">4 messages written upfront.</span>
                            <span className="text-[13px] font-[600] text-textMid">0 hours of daily facilitation.</span>
                        </div>
                    </div>
                    <p className="text-[12px] font-[600] text-textLight italic text-center mt-[12px]">— Rohan, Fitness Creator</p>

                </div>
            </section>

            {/* ── Section 6: Three Things That Are True ── */}
            <section className="bg-surface py-[80px] lg:py-[96px] w-full flex flex-col items-center">
                <div className="w-full max-w-[1140px] px-6 lg:px-8">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
                        
                        <div className="bg-surface border border-[var(--border)] rounded-[16px] p-[24px] flex flex-col btf-reveal btf-stagger-1 lg:min-h-[160px]">
                            <span className="text-[64px] font-[900] text-border leading-none block mb-4">01</span>
                            <span className="text-[20px] font-[900] text-text block mb-2 leading-[1.2]">Your followers never pay a dime.</span>
                            <p className="text-[13px] font-[600] text-textMid line-height-[1.75]">
                                They just take one action to unlock your content. The cost is their attention or email, not their wallet. That’s why conversion rates stay through the roof compared to paid content.
                            </p>
                        </div>

                        <div className="bg-surface border border-[var(--border)] rounded-[16px] p-[24px] flex flex-col btf-reveal btf-stagger-2 lg:min-h-[160px]">
                            <span className="text-[64px] font-[900] text-border leading-none block mb-4">02</span>
                            <span className="text-[20px] font-[900] text-text block mb-2 leading-[1.2]">You own your audience completely.</span>
                            <p className="text-[13px] font-[600] text-textMid line-height-[1.75]">
                                We don't steal your emails, hijack your followers, or take a cut of your sponsorships. We just give you the lock. Every follower and subscriber is 100% yours to keep.
                            </p>
                        </div>

                        <div className="bg-surface border border-[var(--border)] rounded-[16px] p-[24px] flex flex-col btf-reveal btf-stagger-3 lg:min-h-[160px]">
                            <span className="text-[64px] font-[900] text-border leading-none block mb-4">03</span>
                            <span className="text-[20px] font-[900] text-text block mb-2 leading-[1.2]">Create a link in under a minute.</span>
                            <p className="text-[13px] font-[600] text-textMid line-height-[1.75]">
                                Upload your content, choose how to unlock it, and get your link. Share it everywhere — it works flawlessly on Twitter, YouTube, Instagram, and LinkedIn.
                            </p>
                        </div>

                    </div>

                </div>
            </section>

            {/* ── Section 7: Creator Type Matcher ── */}
            <section className="bg-bg py-[80px] lg:py-[96px] w-full flex flex-col items-center">
                <div className="w-full max-w-[1140px] px-6 lg:px-8 btf-reveal">
                    
                    <h2 className="text-[11px] font-[800] text-textLight uppercase tracking-[0.8px] text-center mb-0">Find your fit</h2>
                    <h3 className="text-[36px] lg:text-[44px] font-[900] text-text leading-[1.2] text-center mt-[12px] mb-0">
                        See yourself in one of these?
                    </h3>

                    {/* Scrollable Pills */}
                    <div className="mt-[24px] btf-scroll-pills pl-0">
                        {CREATOR_TYPES.map(cat => (
                            <button 
                                key={cat.id} 
                                className={`btf-pill shrink-0 ${selectedType.id === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedType(cat)}
                            >
                                {cat.label} {cat.icon}
                            </button>
                        ))}
                    </div>

                    {/* Result Card */}
                    <div className="mt-[24px] w-full max-w-[640px] mx-auto bg-surface border border-[var(--border)] rounded-[16px] p-[24px] transition-all duration-200 ease-in-out">
                        <div className="flex flex-col md:flex-row gap-[24px]">
                            
                            {/* Left Col */}
                            <div className="flex-1 flex flex-col">
                                <span className="text-[11px] font-[800] text-textLight uppercase block mb-3">What to lock</span>
                                <div className="flex flex-col gap-2">
                                    {selectedType.lockItems.map((item, idx) => (
                                        <div key={idx} className="text-[14px] font-[700] text-textMid">{item}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Col */}
                            <div className="flex-1 flex flex-col border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0 md:pl-[24px]">
                                <span className="text-[11px] font-[800] text-textLight uppercase block mb-3">Unlock with</span>
                                
                                {/* Recommended type strip */}
                                <div className="w-full flex items-center gap-2 mb-2">
                                    <span className="text-[24px] leading-none block">{selectedType.unlockIcon1}</span>
                                    <span className="text-[16px] font-[900]" style={{ color: selectedType.unlockColor1 }}>{selectedType.unlockType1}</span>
                                </div>
                                {selectedType.unlockIcon2 && selectedType.unlockType2 && (
                                    <div className="w-full flex items-center gap-2 mb-2">
                                        <span className="text-[24px] leading-none block">{selectedType.unlockIcon2}</span>
                                        <span className="text-[16px] font-[900]" style={{ color: selectedType.unlockColor2 }}>{selectedType.unlockType2}</span>
                                    </div>
                                )}

                                <p className="text-[13px] font-[600] text-textMid leading-[1.5]">
                                    {selectedType.reason}
                                </p>
                            </div>
                        </div>

                        {/* CTA Link */}
                        <div className="mt-[24px] border-t border-[var(--border)] pt-[16px]">
                            <button 
                                onClick={() => scrollToGenerator(selectedType.primaryUnlock)}
                                className="text-[13px] font-[700] text-brand hover:underline bg-transparent p-0 m-0 border-none cursor-pointer"
                            >
                                Create this link →
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            {/* ── Section 8: Pricing — Dead Simple ── */}
            <section className="bg-surface py-[80px] lg:py-[96px] w-full flex flex-col items-center">
                <div className="w-full max-w-[1140px] px-6 lg:px-8 btf-reveal">
                    
                    <h2 className="text-[11px] font-[800] text-textLight uppercase tracking-[0.8px] text-center mb-0">Pricing</h2>
                    <h3 className="text-[36px] lg:text-[44px] font-[900] text-text leading-[1.2] text-center mt-[12px] mb-[12px]">
                        Almost everything is free.
                    </h3>
                    <p className="text-[15px] font-[600] text-textMid text-center max-w-[440px] mx-auto m-0 mb-[40px]">
                        The only paid feature is running large Follower Pairing campaigns.
                    </p>

                    <div className="w-full max-w-[700px] mx-auto flex flex-col md:flex-row gap-[16px]">
                        
                        {/* Free Card */}
                        <div className="flex-1 bg-surface border border-[var(--border)] rounded-[16px] p-[28px] flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className="text-[52px] font-[900] text-text leading-none">$0</span>
                                <span className="text-[16px] font-[600] text-textLight leading-none mt-4">/forever</span>
                            </div>
                            <div className="w-full h-[1px] bg-border my-[16px]"></div>
                            
                            <div className="flex flex-col gap-3 flex-1 mb-[20px]">
                                <div className="flex items-center gap-2">
                                    <svg className="w-[18px] h-[18px] text-[#166534] shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    <span className="text-[14px] font-[700] text-textMid">Unlimited Lock Content links</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-[18px] h-[18px] text-[#166534] shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    <span className="text-[14px] font-[700] text-textMid">Email, Follow and Sponsor unlock types</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-[18px] h-[18px] text-[#166534] shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    <span className="text-[14px] font-[700] text-textMid">0% commission on sponsor deals</span>
                                </div>
                                <div className="flex items-center gap-2 bg-[#FFFBEB] rounded-[8px] p-1.5 -mx-2">
                                    <svg className="w-[18px] h-[18px] text-[#166534] shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    <span className="text-[14px] font-[700] text-textMid">1 Follower Pairing campaign</span>
                                </div>
                                <div className="flex items-center gap-2 bg-[#FFFBEB] rounded-[8px] p-1.5 -mx-2">
                                    <svg className="w-[18px] h-[18px] text-[#166534] shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    <span className="text-[14px] font-[700] text-textMid">Up to 10 pairs per campaign</span>
                                </div>
                            </div>
                            
                            <button onClick={() => scrollToGenerator()} className="w-full h-[48px] bg-text text-white font-[900] text-[14px] rounded-[12px]">
                                Start free →
                            </button>
                        </div>

                        {/* Pro Card */}
                        <div className="flex-1 bg-text rounded-[16px] p-[28px] flex flex-col relative">
                            <div className="absolute top-[28px] right-[28px] bg-brand text-white text-[10px] font-[900] tracking-[1px] h-[20px] px-[10px] rounded-[6px] flex items-center">
                                PRO
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[52px] font-[900] text-white leading-none">$10</span>
                                <span className="text-[16px] text-white/50 leading-none mt-4">/month</span>
                            </div>
                            <div className="w-full h-[1px] bg-surface/10 my-[16px]"></div>
                            
                            <div className="flex flex-col gap-3 flex-1 mb-[20px]">
                                <div className="flex items-center gap-2">
                                    <svg className="w-[18px] h-[18px] text-brand shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    <span className="text-[14px] font-[700] text-white">Everything in Free</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-[18px] h-[18px] text-brand shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    <span className="text-[14px] font-[700] text-white">5 Follower Pairing campaigns</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-[18px] h-[18px] text-brand shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    <span className="text-[14px] font-[700] text-white">Unlimited pairs per campaign</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-[18px] h-[18px] text-brand shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    <span className="text-[14px] font-[700] text-white">Completion reward assets</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-[18px] h-[18px] text-brand shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    <span className="text-[14px] font-[700] text-white">Full pairing analytics</span>
                                </div>
                            </div>
                            
                            <button onClick={() => onStartPro ? onStartPro() : scrollToGenerator()} className="w-full h-[48px] bg-surface text-text font-[900] text-[14px] rounded-[12px] mt-[20px]">
                                Start Pro →
                            </button>
                            <span className="text-[11px] text-white/40 text-center block mt-3">Cancel anytime.</span>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── Section 9: Final CTA ── */}
            <section className="bg-brand py-[96px] w-full flex flex-col items-center">
                <div className="w-full max-w-[560px] px-6 text-center btf-reveal">
                    
                    <h2 className="text-[36px] lg:text-[48px] font-[900] text-white leading-[1.2] m-0">
                        Your content is already good enough.
                    </h2>
                    <h3 className="text-[20px] font-[600] text-white/80 mt-[12px] mb-0">
                        Now make it work for you.
                    </h3>
                    
                    <button 
                        onClick={() => scrollToGenerator()}
                        className="bg-surface text-brand h-[56px] w-[200px] mt-[32px] rounded-[16px] text-[18px] font-[900] transition-transform active:scale-95"
                    >
                        Create a free link →
                    </button>
                    
                    <div className="flex flex-wrap items-center justify-center gap-[24px] mt-[16px]">
                        <span className="text-[12px] font-[600] text-white/60">No credit card</span>
                        <span className="text-[12px] font-[600] text-white/60">·</span>
                        <span className="text-[12px] font-[600] text-white/60">Free forever</span>
                        <span className="text-[12px] font-[600] text-white/60">·</span>
                        <span className="text-[12px] font-[600] text-white/60">Takes 5 minutes</span>
                    </div>

                </div>
            </section>
        </div>
    );
};
