
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

export const BelowTheFold = ({ onAction }: { onAction?: () => void }) => {
    const [exchangeIdx, setExchangeIdx] = useState(0);
    const [mathType, setMathType] = useState('email');
    const [sponsorDeal, setSponsorDeal] = useState('300');
    const [quoteIdx, setQuoteIdx] = useState(0);
    const [isQuoteFading, setIsQuoteFading] = useState(false);
    
    // Accountability state logic
    const [accDuration, setAccDuration] = useState('14');
    const [accJoinCount, setAccJoinCount] = useState('60');
    const [accTimer, setAccTimer] = useState(0);

    useEffect(() => {
        if (exchangeIdx === 3) { // Accountability state
            const interval = setInterval(() => {
                setAccTimer(prev => prev + 100);
            }, 100);
            return () => clearInterval(interval);
        } else {
            setAccTimer(0);
        }
    }, [exchangeIdx]);

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
        const duration = exchangeIdx === 3 ? 5000 : 3000;
        const exchangeTimer = setTimeout(() => {
            setExchangeIdx(prev => (prev + 1) % UNLOCK_STATES.length);
        }, duration);

        return () => clearTimeout(exchangeTimer);
    }, [exchangeIdx]);

    useEffect(() => {
        const quoteInterval = setInterval(() => {
            setIsQuoteFading(true);
            setTimeout(() => {
                setQuoteIdx(prev => (prev + 1) % QUOTES.length);
                setIsQuoteFading(false);
            }, 300);
        }, 8000);

        return () => clearInterval(quoteInterval);
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
                const durationDays = parseInt(accDuration);
                const joinCount = parseInt(accJoinCount) || 0;
                return (
                    <div className="animate-fadeIn">
                        <div className="assumption-row">
                            <div className="assumption-item">
                                <span className="assumption-label">Challenge Duration</span>
                                <div className="deal-input-container !bg-[#B45309]/10 !border-[#B45309]/20">
                                    <input 
                                        type="text" 
                                        value={accDuration} 
                                        onChange={(e) => setAccDuration(e.target.value)}
                                        className="deal-input !text-[#B45309]" 
                                    />
                                    <span className="deal-prefix !text-[#B45309]/50">days</span>
                                </div>
                            </div>
                            <div className="assumption-item text-right">
                                <span className="assumption-label">People who join</span>
                                <div className="deal-input-container !bg-[#B45309]/10 !border-[#B45309]/20 ml-auto">
                                    <input 
                                        type="text" 
                                        value={accJoinCount} 
                                        onChange={(e) => setAccJoinCount(e.target.value)}
                                        className="deal-input !text-[#B45309]" 
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="math-divider" />
                        
                        <div className="calc-row">
                            <span className="calc-label">Total 1-on-1 Connections</span>
                            <span className="calc-value">{Math.floor(joinCount / 2).toLocaleString()} pairs</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Daily Engagement (avg 85%)</span>
                            <span className="calc-value">{Math.floor(joinCount * durationDays * 0.85).toLocaleString()} check-ins</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Est. Community Messages</span>
                            <span className="calc-value">{Math.floor(joinCount * durationDays * 0.85 * 4).toLocaleString()} messages</span>
                        </div>
                        
                        <div className="math-footer">
                            The math of real accountability. Your audience builds the community. You just set the challenge.
                        </div>
                        <div className="privacy-strip" style={{background: 'transparent', marginTop: '12px', border: 'none', padding: 0}}>
                            <span className="text-[11px]" style={{color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                🔒 You cannot see what pairs say to each other. This is intentional.
                            </span>
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
                            
                            {exchangeIdx === 3 ? (
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1.5 h-[44px] mb-3">
                                        <div className="mini-avatar bg-[#2563EB]">A</div>
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(i => (
                                                <div 
                                                    key={i} 
                                                    className="w-1.5 h-1.5 rounded-full bg-[#B45309] pulse-dot" 
                                                    style={{ 
                                                        animationDelay: `${i * 200}ms`,
                                                        display: accTimer > 1500 ? 'none' : 'block'
                                                    }} 
                                                />
                                            ))}
                                            {accTimer > 1500 && <span className="text-[16px] animate-in zoom-in duration-400">🤝</span>}
                                        </div>
                                        <div 
                                            className="mini-avatar acc-transition-circle" 
                                            style={{ 
                                                background: accTimer > 1500 ? '#B45309' : '#DDDDDD' 
                                            }}
                                        >
                                            {accTimer > 1500 ? 'J' : '?'}
                                        </div>
                                    </div>
                                    <span 
                                        className="text-[11px] font-semibold mb-3 transition-colors duration-300"
                                        style={{ color: accTimer > 1500 ? '#B45309' : '#AAAAAA' }}
                                    >
                                        {accTimer > 1500 ? 'Matched with someone just like them' : 'Looking for a match...'}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div className="avatar-circle bg-[#F0F0F0]">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#AAA49C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    </div>
                                    <div className="bubble-card">I want that free guide.</div>
                                </>
                            )}

                            <div className="exchange-arrow" />
                            <div className="rotating-action-container">
                                {UNLOCK_STATES.map((state, idx) => (
                                    <div 
                                        key={idx}
                                        className={`rotating-card ${state.colorClass}`}
                                        style={{ 
                                            opacity: exchangeIdx === idx ? 1 : 0,
                                            pointerEvents: exchangeIdx === idx ? 'auto' : 'none',
                                            padding: idx === 3 ? '12px' : '12px'
                                        }}
                                    >
                                        {idx === 3 ? (
                                            <div className="flex flex-col items-center">
                                                <span className="action-title" style={{fontWeight: 800}}>🤝 Paired with an accountability partner</span>
                                                <span className="action-subtitle" style={{fontWeight: 600}}>Private chat · {accDuration} days · Daily check-ins</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="action-title">{state.audienceAction}</span>
                                                <span className="action-subtitle">{state.audienceDetails}</span>
                                            </>
                                        )}
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
                            <div className="flex flex-col items-center text-center">
                                <span className="font-extrabold text-[14px] text-[#111]">
                                    {exchangeIdx === 3 ? "🤝 Pairs form automatically" : "🎁 Gets your content free"}
                                </span>
                                <span className="text-[11px] font-semibold text-[#888] mt-1">
                                    {exchangeIdx === 3 ? "No coordination needed" : "No payment. No friction."}
                                </span>
                            </div>
                        </div>

                        <div className="exchange-column">
                            <span className="column-label">For you</span>
                            {exchangeIdx === 3 ? (
                                <div className="flex flex-col gap-2 w-full px-4">
                                    <div className="bg-[#FFFBEB] rounded-[10px] p-3 border border-[#FDE68A]">
                                        <div className="text-[14px] font-black text-[#B45309]">🤝 {Math.floor(parseInt(accJoinCount) / 2)} pairs forming</div>
                                        <div className="text-[11px] font-semibold text-[#B45309]/70">Without you in the room.</div>
                                    </div>
                                    <div className="h-[8px] flex items-center justify-center">
                                        <div className="w-px h-full bg-[#FDE68A]" />
                                    </div>
                                    <div className="bg-[#FFFBEB] rounded-[10px] p-3 border border-[#FDE68A]">
                                        <div className="text-[14px] font-black text-[#B45309]">📣 You guide them</div>
                                        <div className="text-[11px] font-semibold text-[#B45309]/70">Scheduled messages · Full privacy.</div>
                                    </div>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}
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
                        <p className="scenario-description">"I created a 14-day morning routine challenge. People clicked my link, wrote their commitment, chose their matching preference, and got paired instantly with someone similar. I preset four messages that went out automatically. I spent 20 minutes on setup total."</p>
                        <div className="result-pill pill-amber">26 pairs · Gender-matched · 4 auto-messages</div>
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

                <a onClick={scrollToTop} className="card-seven-link mt-8 cursor-pointer">You could be card seven. Create your first link →</a>
            </section>

            {/* Section 3B - Accountability Showcase (NEW) */}
            <section className="section-accountability-showcase">
                <div className="pill-amber-tint">NEW: ACCOUNTABILITY PAIRING</div>
                <h2 className="text-[28px] font-black text-[#111] text-center mb-2">Build a community that actually works.</h2>
                <p className="text-[15px] font-semibold text-[#555] text-center max-w-[600px] mb-8">
                    Stop throwing people into noisy group chats where 90% drift away. 
                    Match them 1-on-1 for higher completion and deeper connection.
                </p>

                <div className="showcase-flow">
                    <div className="flow-step-card">
                        <div className="step-number-pill">STEP 1</div>
                        <div className="step-icon">🛠️</div>
                        <h3 className="step-title">Creator Setup</h3>
                        <p className="step-description">Set a duration (e.g. 14 days) and write 3-5 daily prompts that go out automatically.</p>
                        <div className="detail-tags">
                            <span className="detail-tag">Takes 10 mins</span>
                            <span className="detail-tag">Auto-broadcast</span>
                        </div>
                    </div>
                    <div className="flow-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 md:rotate-0"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </div>
                    <div className="flow-step-card">
                        <div className="step-number-pill">STEP 2</div>
                        <div className="step-icon">🔗</div>
                        <h3 className="step-title">Click & Commit</h3>
                        <p className="step-description">Viewers click your link and write their goal. High friction = High intent participants.</p>
                        <div className="detail-tags">
                            <span className="detail-tag">Commitment wall</span>
                        </div>
                    </div>
                    <div className="flow-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 md:rotate-0"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </div>
                    <div className="flow-step-card">
                        <div className="step-number-pill">STEP 3</div>
                        <div className="step-icon">🤝</div>
                        <h3 className="step-title">Get Paired</h3>
                        <p className="step-description">AdGate matches them 1-on-1 based on preferences (e.g. same gender or timezone).</p>
                        <div className="matching-preview">
                            <div className="avatar-pair pulse">
                                <div className="mini-avatar bg-[#2563EB]">A</div>
                                <span className="text-[12px]">🤝</span>
                                <div className="mini-avatar bg-[#B45309]">J</div>
                            </div>
                        </div>
                    </div>
                    <div className="flow-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 md:rotate-0"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </div>
                    <div className="flow-step-card">
                        <div className="step-number-pill">STEP 4</div>
                        <div className="step-icon">💬</div>
                        <h3 className="step-title">Private Progress</h3>
                        <p className="step-description">They chat 1-on-1 on AdGate to stay on track. You guide the flow via auto-messages.</p>
                        <div className="detail-tags">
                            <span className="detail-tag">End-to-end privacy</span>
                        </div>
                    </div>
                </div>

                <div className="creator-panel-card mt-12">
                    <div className="panel-header">
                        <div className="window-dots">
                            <div style={{background: '#FF5F56'}} />
                            <div style={{background: '#FFBD2E'}} />
                            <div style={{background: '#27C93F'}} />
                        </div>
                        <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest ml-4">Creator Control Panel</span>
                    </div>
                    <div className="panel-content">
                        <div className="panel-left">
                            <div className="panel-label-row">
                                <span className="panel-label">Scheduled Broadcasts</span>
                                <button className="add-btn">+ New</button>
                            </div>
                            <div className="mock-rows">
                                <div className="mock-row">
                                    <div className="day-box">01</div>
                                    <div className="msg-preview">Welcome! Today we start by defining your...</div>
                                    <span className="status-label text-green-600">SENT</span>
                                </div>
                                <div className="mock-row">
                                    <div className="day-box">03</div>
                                    <div className="msg-preview">Check in: Have you contacted your partner...</div>
                                    <span className="status-label text-blue-600">QUEUE</span>
                                </div>
                                <div className="mock-row">
                                    <div className="day-box">07</div>
                                    <div className="msg-preview">Halfway there! Today's prompt is about...</div>
                                    <span className="status-label text-gray-400">DRAFT</span>
                                </div>
                            </div>
                            <div className="info-card mt-4">
                                💡 These messages go to every pair simultaneously. Use them to guide the curriculum without repeating yourself.
                            </div>
                        </div>
                        <div className="panel-right mt-8 md:mt-0">
                            <div className="panel-label-row">
                                <span className="panel-label">Active Pairs</span>
                                <span className="text-[11px] font-bold text-[#B45309]">26 ACTIVE</span>
                            </div>
                            <div className="mock-rows">
                                <div className="pair-row">
                                    <div className="avatar-overlap">
                                        <div className="bg-[#2563EB]" style={{zIndex: 2}}>A</div>
                                        <div className="bg-[#B45309]" style={{marginLeft: '-8px', zIndex: 1}}>M</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold">Alex & Maria</span>
                                            <span className="text-[9px] font-bold text-[#AAA]">DAY 4</span>
                                        </div>
                                        <div className="progress-bar-mini"><div className="progress-fill" style={{width: '30%'}} /></div>
                                    </div>
                                    <div className="check-green icon-circle">✓</div>
                                </div>
                                <div className="pair-row">
                                    <div className="avatar-overlap">
                                        <div className="bg-[#7C3AED]" style={{zIndex: 2}}>S</div>
                                        <div className="bg-[#DB2777]" style={{marginLeft: '-8px', zIndex: 1}}>K</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold">Sam & Kim</span>
                                            <span className="text-[9px] font-bold text-[#AAA]">DAY 4</span>
                                        </div>
                                        <div className="progress-bar-mini"><div className="progress-fill" style={{width: '10%'}} /></div>
                                    </div>
                                    <div className="x-red icon-circle">×</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="privacy-strip">
                        <span className="text-[11px] font-bold text-[#111]">🔒 CREATOR PRIVACY:</span>
                        <span className="text-[11px] font-semibold text-[#555]">You see engagement data, but you can NEVER read private partner chats.</span>
                    </div>
                </div>

                <div className="phone-mockup">
                    <div className="phone-notch" />
                    <div className="phone-screen">
                        <div className="mini-chat-header">
                            <span className="text-[10px] font-black text-[#111]">Daily Morning Routine</span>
                            <span className="text-[8px] font-bold text-[#AAA]">DAY 4 / 14</span>
                            <div className="mini-progress-bar mt-2"><div className="progress-fill" style={{width: '28%'}} /></div>
                        </div>
                        <div className="mini-msg-list">
                            <div className="mini-msg broadcast">
                                <span className="block font-black text-[7px] text-[#B45309] mb-1">📣 CREATOR PROMPT</span>
                                Did you drink 500ml of water before coffee today? Tap below to tell your partner.
                            </div>
                            <div className="mini-msg incoming">
                                I just did it! Feeling much more awake now. How about you?
                            </div>
                            <div className="mini-msg outgoing">
                                About to start. Setting my timer now ⏱️
                            </div>
                        </div>
                        <div className="mini-input-bar">
                            <div className="mini-input-zone">Type a message...</div>
                            <div className="mini-send-btn" />
                        </div>
                    </div>
                </div>

                <div className="acc-comparison-card">
                    <h4 className="text-[14px] font-black text-[#111] mb-3 text-center">Group Chat vs. Accountability Pairs</h4>
                    <div className="comparison-grid">
                        <div className="comp-col">
                            <div className="comp-item">
                                <div className="icon-circle x-red" style={{background: '#FFEBEB', color: '#E11D48'}}>×</div>
                                <span className="text-[11px] font-bold text-[#555]">Bystander Effect</span>
                            </div>
                            <div className="comp-item">
                                <div className="icon-circle x-red" style={{background: '#FFEBEB', color: '#E11D48'}}>×</div>
                                <span className="text-[11px] font-bold text-[#555]">Information Overload</span>
                            </div>
                            <div className="comp-item">
                                <div className="icon-circle x-red" style={{background: '#FFEBEB', color: '#E11D48'}}>×</div>
                                <span className="text-[11px] font-bold text-[#555]">90% Lurker Rate</span>
                            </div>
                        </div>
                        <div className="comp-col">
                            <div className="comp-item">
                                <div className="icon-circle check-green" style={{background: '#EBF5EE', color: '#166534'}}>✓</div>
                                <span className="text-[11px] font-bold text-[#111]">Active Commitment</span>
                            </div>
                            <div className="comp-item">
                                <div className="icon-circle check-green" style={{background: '#EBF5EE', color: '#166534'}}>✓</div>
                                <span className="text-[11px] font-bold text-[#111]">Deep 1-on-1 Focus</span>
                            </div>
                            <div className="comp-item">
                                <div className="icon-circle check-green" style={{background: '#EBF5EE', color: '#166534'}}>✓</div>
                                <span className="text-[11px] font-bold text-[#111]">85% Action Rate</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="acc-testimonial-card">
                    <p className="text-[14px] font-semibold text-[#111] italic mb-4">
                        "I used to run Discord groups but everyone would go silent after 3 days. With AdGate's pairing, my last challenge had an 80% completion rate. The 1-on-1 dynamic makes it impossible to hide."
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center font-black text-[12px]">D</div>
                        <div className="flex flex-col">
                            <span className="text-[12px] font-black">David P.</span>
                            <span className="text-[10px] font-bold text-[#AAA]">Habit Coach (12k followers)</span>
                        </div>
                    </div>
                </div>

                <div className="acc-cta-section">
                    <h3 className="text-[18px] font-black text-[#111] mb-2">Ready to pair your audience?</h3>
                    <div className="acc-btns">
                        <button className="btn-primary-acc" onClick={() => onAction && onAction()}>Create a Challenge &rarr;</button>
                        <button className="btn-secondary-acc">See an example &rarr;</button>
                    </div>
                </div>
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

            {/* Section 7 - Unlock Types Grid */}
            <section className="section-grid" id="unlock-types">
                <div className="container">
                    <h2 className="text-[28px] font-black text-[#111] mb-4">Choose your growth engine.</h2>
                    <p className="text-[15px] font-semibold text-[#666] mb-12">One link. Infinite ways to activate your audience.</p>
                    
                    <div className="types-grid">
                        <div className="grid-card stagger-item">
                            <div className="card-icon bg-[#E8312A]/10 text-[#E8312A]">📧</div>
                            <h3 className="card-title">Email Unlock</h3>
                            <p className="card-desc">The high-intent way to build your list. No secondary tabs. Just clean, fast conversion.</p>
                            <div className="card-footer-note">Best for: Newsletters & Guides</div>
                        </div>
                        <div className="grid-card stagger-item" style={{ borderLeft: '4px solid #2563EB' }}>
                            <div className="card-icon bg-[#2563EB]/10 text-[#2563EB]">🤝</div>
                            <h3 className="card-title">Accountability Unlock</h3>
                            <p className="card-desc">Users commit to a goal and get paired 1-on-1 with another participant to stay on track.</p>
                            <div className="card-footer-note">Best for: Challenges & Habit Building</div>
                        </div>
                        <div className="grid-card stagger-item">
                            <div className="card-icon bg-[#417A55]/10 text-[#417A55]">💰</div>
                            <h3 className="card-title">Sponsor Unlock</h3>
                            <p className="card-desc">Let a brand pay you for every free download. The ultimate win-win-win for you and your audience.</p>
                            <div className="card-footer-note">Best for: High-Traffic Assets</div>
                        </div>
                        <div className="grid-card stagger-item">
                            <div className="card-icon bg-[#A855F7]/10 text-[#A855F7]">🚀</div>
                            <h3 className="card-title">Viral Unlock</h3>
                            <p className="card-desc">Unlock content only after they share with 3 friends. Turn every fan into a 3x multiplier.</p>
                            <div className="card-footer-note">Best for: Templates & Rare Resources</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 8 - Final CTA */}
            <section className="section-final-cta">
                <div className="container">
                    <div className="cta-box stagger-item">
                        <h2 className="text-[32px] md:text-[42px] font-black mb-4">Stop dropping weak links.</h2>
                        <p className="text-[17px] font-semibold opacity-80 mb-6">Start building your AdGate engine today.</p>
                        
                        <div className="flex items-center justify-center gap-6 mb-10 opacity-70">
                            <div className="flex flex-col items-center">
                                <span className="text-[24px] mb-1">🤝</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Accountability</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[24px] mb-1">🎁</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Free Assets</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[24px] mb-1">📈</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Viral Growth</span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <button className="cta-button-main" onClick={() => onAction && onAction()}>Create your first AdGate &rarr;</button>
                            <button className="cta-button-secondary">Talk to a human</button>
                        </div>
                        <p className="mt-8 text-[12px] font-bold opacity-40">No credit card. Free while in early access.</p>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="container flex flex-col md:flex-row justify-between items-center opacity-40">
                    <span className="font-black tracking-tighter text-[20px]">AdGate</span>
                    <div className="flex gap-8 mt-4 md:mt-0 font-bold text-[13px]">
                        <span>Terms</span>
                        <span>Privacy</span>
                        <span>Twitter</span>
                        <span>Support</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};
