
import { useState, useEffect, useRef } from 'react';

import './BelowTheFold.css';

const UNLOCK_STATES = [
    {
        type: 'email',
        audienceAction: '📧 Subscribes to your newsletter',
        audienceDetails: 'Enters their email · Confirms subscription',
        creatorReward: '📧 +1 Subscriber',
        creatorDetails: 'Owned. Permanent. Algorithm-proof.',
        colorClass: 'state-email'
    },
    {
        type: 'social',
        audienceAction: '👥 Follows your account',
        audienceDetails: 'Taps follow · Confirms on honor',
        creatorReward: '👥 +1 Follower',
        creatorDetails: 'Pre-qualified. Already wants your content.',
        colorClass: 'state-social'
    },
    {
        type: 'sponsor',
        audienceAction: "⭐ Watches your sponsor's video",
        audienceDetails: 'Views full ad · Optionally clicks through',
        creatorReward: '💰 +$[amount]',
        creatorDetails: '100% of your sponsor deal. Zero commission.',
        colorClass: 'state-sponsor'
    },
    {
        type: 'accountability',
        audienceAction: '🤝 Joins your challenge',
        audienceDetails: 'Commits to a goal · Gets a partner',
        creatorReward: '🤝 +1 Challenge participant',
        creatorDetails: 'Community proof. Real outcomes.',
        colorClass: 'state-accountability'
    }
];

const QUOTES = [
    {
        text: "The moment I switched my free Notion templates to an email gate I realized I had been building someone else's platform for two years. My email list went from 200 to 1,400 in four months. The templates did not change. Just where the value went.",
        creator: "Notion template creator · 14,000 TikTok followers",
        colorClass: 'state-email',
        accentColor: '#166534'
    },
    {
        text: "I had 6,000 Instagram followers and no email list. Not a single one. Three follow-gate links changed that. Now I have 900 email subscribers and I am not stressed about the algorithm anymore.",
        creator: "Freelance photographer · Based in Berlin",
        colorClass: 'state-social',
        accentColor: '#1D4ED8'
    },
    {
        text: "My first sponsor deal through AdGate was $150. I was nervous they would not pay. AdGate showed them the impression report and they paid within a week and asked for a second campaign.",
        creator: "Dev tools YouTuber · 3,200 subscribers",
        colorClass: 'state-sponsor',
        accentColor: '#6D28D9'
    }
];

export const BelowTheFold = () => {
    const [exchangeIdx, setExchangeIdx] = useState(0);
    const [mathType, setMathType] = useState('email');
    const [sponsorDeal, setSponsorDeal] = useState('300');
    const [quoteIdx, setQuoteIdx] = useState(0);
    const [isQuoteFading, setIsQuoteFading] = useState(false);

    // Intersection Observer for scroll animations
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    if (entry.target.getAttribute('data-stagger-group')) {
                        const items = entry.target.querySelectorAll('.stagger-item');
                        items.forEach((item, idx) => {
                            setTimeout(() => {
                                (item as HTMLElement).style.opacity = '1';
                                (item as HTMLElement).style.transform = 'translateY(0)';
                                (item as HTMLElement).style.transition = 'opacity 400ms ease-out, transform 400ms ease-out';
                            }, idx * 100);
                        });
                    }
                }
            });
        }, { threshold: 0.15 });

        const targets = document.querySelectorAll('.reveal-on-scroll, .pop-in, [data-stagger-group]');
        targets.forEach(t => observerRef.current?.observe(t));

        return () => observerRef.current?.disconnect();
    }, []);

    // Rotations
    useEffect(() => {
        const exchangeInterval = setInterval(() => {
            setExchangeIdx(prev => (prev + 1) % UNLOCK_STATES.length);
        }, 3000);

        const quoteInterval = setInterval(() => {
            setIsQuoteFading(true);
            setTimeout(() => {
                setQuoteIdx(prev => (prev + 1) % QUOTES.length);
                setIsQuoteFading(false);
            }, 300);

        }, 8000);

        return () => {
            clearInterval(exchangeInterval);
            clearInterval(quoteInterval);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderMathCard = () => {
        switch (mathType) {
            case 'email':
                return (
                    <div className="animate-fadeIn">
                        <div className="assumption-row">
                            <div className="assumption-item">
                                <span className="assumption-label">Monthly link shares</span>
                                <span className="assumption-value">4</span>
                            </div>
                            <div className="assumption-item text-right">
                                <span className="assumption-label">Avg. conversion rate</span>
                                <span className="assumption-value">60%</span>
                            </div>
                        </div>
                        <div className="math-divider" />
                        <div className="calc-row">
                            <span className="calc-label">Monthly resource accesses</span>
                            <span className="calc-value">~800</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">New email subscribers (60%)</span>
                            <span className="calc-value">~480</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Email list value (@ $1/sub/mo)</span>
                            <span className="calc-value">~$480/mo</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Annual email list value</span>
                            <span className="calc-value">~$5,760/yr</span>
                        </div>
                        <div className="math-footer">
                            Your email list grows every time you share a link — even while you sleep.
                        </div>
                    </div>
                );
            case 'social':
                return (
                    <div className="animate-fadeIn">
                        <div className="assumption-row">
                            <div className="assumption-item">
                                <span className="assumption-label">Monthly link shares</span>
                                <span className="assumption-value">4</span>
                            </div>
                            <div className="assumption-item text-right">
                                <span className="assumption-label">Avg. conversion</span>
                                <span className="assumption-value">70%</span>
                            </div>
                        </div>
                        <div className="math-divider" />
                        <div className="calc-row">
                            <span className="calc-label">Monthly resource accesses</span>
                            <span className="calc-value">~800</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">New followers (70%)</span>
                            <span className="calc-value">~560</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Followers after 6 months</span>
                            <span className="calc-value">~3,360</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Estimated reach of one post (8%)</span>
                            <span className="calc-value">~270 people</span>
                        </div>
                        <div className="math-footer">
                            Every resource you share converts downloaders into followers — permanently.
                        </div>
                    </div>
                );
            case 'sponsor':
                const val = parseInt(sponsorDeal) || 0;
                return (
                    <div className="animate-fadeIn">
                        <div className="assumption-row">
                            <div className="assumption-item">
                                <span className="assumption-label">Deal value</span>
                                <div className="deal-input-container">
                                    <span className="deal-prefix">$</span>
                                    <input 
                                        type="number" 
                                        className="deal-input"
                                        value={sponsorDeal}
                                        onChange={(e) => setSponsorDeal(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="assumption-item text-right">
                                <span className="assumption-label">Campaign duration</span>
                                <span className="assumption-value">30 days</span>
                            </div>
                        </div>
                        <div className="math-divider" />
                        <div className="calc-row">
                            <span className="calc-label">Your deal value</span>
                            <span className="calc-value">${val}</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">AdGate commission</span>
                            <span className="calc-value" style={{color: '#417A55'}}>$0</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">You keep</span>
                            <span className="calc-value" style={{color: '#417A55', fontSize: '15px'}}>${val}</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">With tree donation (5%)</span>
                            <span className="calc-value" style={{color: '#417A55'}}>${Math.round(val * 0.95)} 🌱</span>
                        </div>
                        <div className="math-footer">
                            Sponsor deals up to $500/month are 100% yours. No negotiation needed.
                        </div>
                    </div>
                );
            case 'accountability':
                return (
                    <div className="animate-fadeIn">
                        <div className="assumption-row">
                            <div className="assumption-item">
                                <span className="assumption-label">Challenge duration</span>
                                <span className="assumption-value">14 days</span>
                            </div>
                            <div className="assumption-item text-right">
                                <span className="assumption-label">Participants joined</span>
                                <span className="assumption-value">~60</span>
                            </div>
                        </div>
                        <div className="math-divider" />
                        <div className="calc-row">
                            <span className="calc-label">Pairs formed</span>
                            <span className="calc-value">~30</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Check-ins per pair (1/day)</span>
                            <span className="calc-value">~14 each</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Total community check-ins</span>
                            <span className="calc-value">~420</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Your time facilitating</span>
                            <span className="calc-value">~0 hours</span>
                        </div>
                        <div className="math-footer">
                            You create the structure once. Your community does the work. You get the reputation.
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="below-the-fold">
            {/* Section 1 - The Exchange */}
            <section className="section-exchange reveal-on-scroll">
                <span className="section-label">How it works for your audience</span>
                <h2 className="section-headline">Your audience gets it free. You build something real.</h2>
                
                <div className="exchange-card mt-8">
                    <div className="exchange-columns">
                        <div className="exchange-column">
                            <span className="column-label">For your audience</span>
                            <div className="avatar-circle bg-[#F0F0F0]">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#AAA49C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                            <div className="bubble-card">I want that free guide.</div>
                            <div className="exchange-arrow" />
                            <div className="rotating-action-container">
                                {UNLOCK_STATES.map((state, idx) => (
                                    <div 
                                        key={idx}
                                        className={`rotating-card ${state.colorClass}`}
                                        style={{ 
                                            opacity: exchangeIdx === idx ? 1 : 0,
                                            pointerEvents: exchangeIdx === idx ? 'auto' : 'none'
                                        }}
                                    >
                                        <span className="action-title">{state.audienceAction}</span>
                                        <span className="action-subtitle">{state.audienceDetails}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="dot-indicators">
                                {UNLOCK_STATES.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setExchangeIdx(idx)}
                                        className={`dot ${exchangeIdx === idx ? 'active ' + UNLOCK_STATES[idx].colorClass : ''}`} 
                                    />
                                ))}
                            </div>
                            <div className="exchange-arrow mt-3" />
                            <div className="flex flex-col items-center">
                                <span className="font-extrabold text-[14px] text-[#111]">🎁 Gets your content free</span>
                                <span className="text-[11px] font-semibold text-[#888] mt-1">No payment. No friction.</span>
                            </div>
                        </div>

                        <div className="exchange-column">
                            <span className="column-label">For you</span>
                            <div className="avatar-circle bg-[#E8312A]">
                                <span className="text-white font-black text-[16px]">C</span>
                            </div>
                            <div style={{height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <span className="text-[#AAA49C] text-[10px] uppercase font-extrabold tracking-wider">You receive:</span>
                            </div>
                            <div className="exchange-arrow" style={{opacity: 0}} />
                            <div className="rotating-action-container">
                                {UNLOCK_STATES.map((state, idx) => (
                                    <div 
                                        key={idx}
                                        className={`rotating-card ${state.colorClass}`}
                                        style={{ 
                                            opacity: exchangeIdx === idx ? 1 : 0,
                                            pointerEvents: exchangeIdx === idx ? 'auto' : 'none',
                                            background: 'transparent'
                                        }}
                                    >
                                        <span className="action-title" style={{fontSize: '16px'}}>{state.creatorReward}</span>
                                        <span className="action-subtitle">{state.creatorDetails}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="exchange-footer">
                        One link. One action. One real result every time someone clicks it.
                    </div>
                </div>
            </section>

            {/* Section 2 - Numbers */}
            <section className="section-numbers">
                <h2 className="section-headline numbers-headline reveal-on-scroll">The real math behind your link.</h2>
                <p className="numbers-subtitle reveal-on-scroll">Pick a type. See what one month looks like.</p>

                <div className="type-selector-pills">
                    <button onClick={() => setMathType('email')} className={`pill ${mathType === 'email' ? 'active state-email' : ''}`}>📧 Email</button>
                    <button onClick={() => setMathType('social')} className={`pill ${mathType === 'social' ? 'active state-social' : ''}`}>👥 Follow</button>
                    <button onClick={() => setMathType('sponsor')} className={`pill ${mathType === 'sponsor' ? 'active state-sponsor' : ''}`}>⭐ Sponsor</button>
                    <button onClick={() => setMathType('accountability')} className={`pill ${mathType === 'accountability' ? 'active state-accountability' : ''}`}>🤝 Accountability</button>
                </div>

                <div className="math-card reveal-on-scroll">
                    {renderMathCard()}
                </div>
                <p className="fine-print reveal-on-scroll">Estimates based on industry averages. Results vary by niche and audience quality.</p>
            </section>

            {/* Section 3 - Scenarios */}
            <section className="section-scenarios">
                <span className="section-label">Who uses AdGate</span>
                <h2 className="section-headline mb-4">See yourself here.</h2>
                
                <div className="scenario-stack" data-stagger-group="true">
                    {/* Card 1 */}
                    <div className="scenario-card stagger-item">
                        <div className="card-header">
                            <div className="avatar-circle bg-[#E6F4EA] text-[#417A55] font-black" style={{marginBottom: 0}}>S</div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-[14px]">Sarah</span>
                                <span className="type-badge badge-email mt-1">📧 Email Subscribe</span>
                            </div>
                        </div>
                        <p className="scenario-description">"I write a weekly productivity newsletter. I used to post free templates and get nothing back. Now every template I share adds subscribers. Last month I added 340 people to my list from four links. That is more than my last three months of Instagram posting combined."</p>
                        <div className="result-pill pill-green">+340 subscribers in one month</div>
                    </div>

                    {/* Card 2 */}
                    <div className="scenario-card stagger-item">
                        <div className="card-header">
                            <div className="avatar-circle bg-[#E8F0FE] text-[#1D4ED8] font-black" style={{marginBottom: 0}}>M</div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-[14px]">Marcus</span>
                                <span className="type-badge badge-social mt-1">👥 Social Follow</span>
                            </div>
                        </div>
                        <p className="scenario-description">"I make Figma UI kits and share them free. Before AdGate I was getting 200 downloads a week and zero new followers from it. Now every download is a follow. I gained 1,200 Instagram followers in six weeks from files I already had. I did not make any new content."</p>
                        <div className="result-pill pill-blue">+1,200 followers in 6 weeks</div>
                    </div>

                    {/* Card 3 */}
                    <div className="scenario-card stagger-item">
                        <div className="card-header">
                            <div className="avatar-circle bg-[#FFFBEB] text-[#B45309] font-black" style={{marginBottom: 0}}>A</div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-[14px]">Amara</span>
                                <span className="type-badge badge-accountability mt-1">🤝 Accountability</span>
                            </div>
                        </div>
                        <p className="scenario-description">"I help freelancers raise their rates. Everyone knows what to do — they just do not do it. I ran a 14-day rate-raising accountability challenge. 52 people joined. 26 pairs formed. I got 14 messages in my DMs saying it worked. I spent maybe 20 minutes setting it up."</p>
                        <div className="result-pill pill-amber">26 pairs · 0 hours of facilitation</div>
                    </div>

                    {/* Card 4 */}
                    <div className="scenario-card stagger-item">
                        <div className="card-header">
                            <div className="avatar-circle bg-[#F5F3FF] text-[#6D28D9] font-black" style={{marginBottom: 0}}>D</div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-[14px]">Dev</span>
                                <span className="type-badge badge-sponsor mt-1">⭐ Custom Sponsor</span>
                            </div>
                        </div>
                        <p className="scenario-description">"I have 4,000 YouTube subscribers and I landed my first sponsorship — $200 for a 30-day campaign. I uploaded their video to AdGate and locked my prompt pack behind it. The sponsor got a proper campaign report. I kept the full $200. They came back for a second campaign."</p>
                        <div className="result-pill pill-purple">$200 kept · Sponsor renewed</div>
                    </div>

                    {/* Card 5 */}
                    <div className="scenario-card stagger-item">
                        <div className="card-header">
                            <div className="avatar-circle bg-[#FFF1F2] text-[#E11D48] font-black" style={{marginBottom: 0}}>L</div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-[14px]">Lena</span>
                                <span className="type-badge badge-premium mt-1">🔒 Premium Media</span>
                            </div>
                        </div>
                        <p className="scenario-description">"I do street photography and I was just posting everything for free. I locked my extended shoot — 40 raw files — behind an email gate. 180 people subscribed to get it. I now have an email list of photographers who specifically wanted my extended work. My print shop email converts at 12%."</p>
                        <div className="result-pill pill-green">180 subscribers · 12% print shop conversion</div>
                    </div>

                    {/* Card 6 */}
                    <div className="scenario-card stagger-item">
                        <div className="card-header">
                            <div className="avatar-circle bg-[#E6F4EA] text-[#417A55] font-black" style={{marginBottom: 0}}>R</div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-[14px]">Raj</span>
                                <span className="type-badge badge-email mt-1">📧 Email Subscribe</span>
                            </div>
                        </div>
                        <p className="scenario-description">"I am launching a UX course in three months. I started building my email list now with free mini-lessons on AdGate. I have 600 subscribers already. These are people who showed up, entered their email, and confirmed. When I launch they will actually open my email."</p>
                        <div className="result-pill pill-green">600 warm subscribers before launch</div>
                    </div>
                </div>

                <a onClick={scrollToTop} className="card-seven-link mt-8">You could be card seven. Create your first link →</a>
            </section>

            {/* Section 4 - Truths */}
            <section className="section-truths" data-stagger-group="true">
                <span className="section-label">Why it works</span>
                <div className="truth-card stagger-item">
                    <span className="truth-number">01</span>
                    <h3 className="truth-heading">Viewers never pay.</h3>
                    <p className="truth-body">Every unlock type on AdGate is free for the viewer. They subscribe, follow, or watch — they do not spend money. This removes the biggest barrier to accessing your content. The conversion rate on free actions is 3 to 5 times higher than on paid content. More people access it. More people share it. Your link spreads further.</p>
                </div>
                <div className="truth-card stagger-item">
                    <span className="truth-number">02</span>
                    <h3 className="truth-heading">You own the outcome.</h3>
                    <p className="truth-body">The subscriber you capture is on your email list — not AdGate's. The follower you gain is on your social account — not AdGate's. The sponsor deal you earn goes directly to you. AdGate is the mechanism that makes the exchange happen. The result belongs to you entirely. If you stop using AdGate tomorrow you keep everything you built.</p>
                </div>
                <div className="truth-card stagger-item">
                    <span className="truth-number">03</span>
                    <h3 className="truth-heading">Every share builds something.</h3>
                    <p className="truth-body">Most creator links are one-time events. Someone clicks, reads, leaves. An AdGate link compounds. Every time someone shares your link another viewer completes an action that grows your audience. The resource you created once keeps working. A link you created six months ago is still adding subscribers or followers today.</p>
                </div>
            </section>

            {/* Section 5 - Comparison */}
            <section className="section-comparison reveal-on-scroll" data-stagger-group="true">
                <div className="comparison-card">
                    <div className="comparison-header">
                        <div className="comp-col-label comp-col-1"></div>
                        <div className="comp-col-label comp-col-2">Without AdGate</div>
                        <div className="comp-col-label comp-col-3">With AdGate</div>
                    </div>
                    {/* Rows */}
                    {[
                        { label: "When someone downloads your free resource", without: "They take it and leave. You have nothing.", with: "They subscribe, follow, or watch. You gain something." },
                        { label: "When you share your content on social media", without: "Traffic goes to the platform. You get views.", with: "Traffic goes to AdGate. You get subscribers or followers." },
                        { label: "When a brand sponsors your content", without: "You manage tracking manually. Spreadsheets. Screenshots.", with: "AdGate tracks it. One-tap sponsor report. Zero commission." },
                        { label: "When you want to build community", without: "You post and hope people engage. Algorithm dependent.", with: "Accountability pairs form automatically from your audience." },
                        { label: "What you own after 6 months", without: "Follower counts on platforms you do not control.", with: "An email list, a follower base, and sponsor relationships you own." }
                    ].map((row, idx) => (
                        <div key={idx} className="comp-row stagger-item">
                            <div className="comp-cell comp-cell-label">{row.label}</div>
                            <div className="comp-row-values flex-1 flex">
                                <div className="comp-cell comp-cell-without">{row.without}</div>
                                <div className="comp-cell comp-cell-with">{row.with}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="comp-note">AdGate links are free to create. No subscription. No credit card.</p>
            </section>

            {/* Section 6 - Quotes */}
            <section className="section-quote reveal-on-scroll">
                <div className="quote-card">
                    <div className="quote-icon">"</div>
                    <div className="quote-content" style={{ opacity: isQuoteFading ? 0 : 1 }}>
                        <p className="quote-text">{QUOTES[quoteIdx].text}</p>
                        <span className="quote-creator" style={{ color: QUOTES[quoteIdx].accentColor }}>{QUOTES[quoteIdx].creator}</span>
                    </div>
                    <div className="dot-indicators mt-6" style={{ justifyContent: 'center' }}>
                        {QUOTES.map((q, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setQuoteIdx(idx)}
                                className={`dot ${quoteIdx === idx ? 'active' : ''}`}
                                style={{ background: quoteIdx === idx ? q.accentColor : '#E8E8E8' }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 7 - Types Grid */}
            <section className="section-types">
                <span className="section-label">Four ways to unlock</span>
                <h2 className="section-headline">Choose based on your goal.</h2>
                <div className="types-grid" data-stagger-group="true">
                    <div className="type-card stagger-item" style={{ borderLeftColor: '#166534' }}>
                        <span className="type-emoji">📧</span>
                        <h3 className="type-card-title text-[#166534]">Email Subscribe</h3>
                        <span className="use-when">Use when:</span>
                        <p className="type-card-body">You want to grow a newsletter list and build an audience you own.</p>
                        <div className="type-card-footer text-[#166534]">0% fee · Free forever</div>
                    </div>
                    <div className="type-card stagger-item" style={{ borderLeftColor: '#1D4ED8' }}>
                        <span className="type-emoji">👥</span>
                        <h3 className="type-card-title text-[#1D4ED8]">Social Follow</h3>
                        <span className="use-when">Use when:</span>
                        <p className="type-card-body">You want to grow your social accounts with an audience that already wants your content.</p>
                        <div className="type-card-footer text-[#1D4ED8]">0% fee · Multiple accounts</div>
                    </div>
                    <div className="type-card stagger-item" style={{ borderLeftColor: '#6D28D9' }}>
                        <span className="type-emoji">⭐</span>
                        <h3 className="type-card-title text-[#6D28D9]">Custom Sponsor</h3>
                        <span className="use-when">Use when:</span>
                        <p className="type-card-body">You have a brand deal and want to deliver it professionally and keep 100%.</p>
                        <div className="type-card-footer text-[#6D28D9]">0% commission under $500/mo</div>
                    </div>
                    <div className="type-card stagger-item" style={{ borderLeftColor: '#B45309' }}>
                        <span className="type-emoji">🤝</span>
                        <h3 className="type-card-title text-[#B45309]">Accountability Pair</h3>
                        <span className="use-when">Use when:</span>
                        <p className="type-card-body">You want to help your audience take real action — no file needed, just a pairing system.</p>
                        <div className="type-card-footer text-[#B45309]">0% fee · No file needed</div>
                    </div>
                </div>
            </section>

            {/* Section 8 - Final CTA */}
            <section className="section-cta">
                <h2 className="cta-headline">Your next piece of content should build something.</h2>
                <p className="cta-subtitle">Create a free link in two minutes.</p>
                <button onClick={scrollToTop} className="cta-button">
                    Start for free →
                </button>
                <div className="trust-items">
                    <span>No credit card</span>
                    <div className="trust-dot" />
                    <span>Free to start</span>
                    <div className="trust-dot" />
                    <span>Your audience unlocks for free</span>
                </div>
            </section>
        </div>
    );
};
