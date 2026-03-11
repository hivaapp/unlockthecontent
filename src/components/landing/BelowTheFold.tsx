
import { useEffect, useRef } from 'react';
import './BelowTheFold.css';

export const BelowTheFold = () => {
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('btf-revealed');
                    }
                });
            },
            { threshold: 0.1 }
        );

        const targets = document.querySelectorAll('.btf-reveal');
        targets.forEach((t) => observerRef.current?.observe(t));

        return () => observerRef.current?.disconnect();
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="btf-root">

            {/* ── SECTION 1 — HERO ─────────────────────────────────────────── */}
            <section className="btf-hero btf-reveal">
                <h1 className="btf-hero-headline">
                    Lock your best content. Your followers unlock it free. You build something real.
                </h1>
                <p className="btf-hero-subtitle">
                    Lock videos, photos, files, or run a challenge. Your followers unlock everything free by subscribing, following, or watching your sponsor's ad.
                </p>
                <div className="btf-hero-buttons">
                    <button
                        onClick={scrollToTop}
                        className="btf-btn-primary"
                    >
                        Create your first link — it's free
                    </button>
                    <a
                        href="#how-it-works"
                        className="btf-btn-secondary"
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        See how it works ↓
                    </a>
                </div>
                <p className="btf-hero-trust">Free to start · No credit card · 4 unlock types</p>
            </section>

            {/* ── SECTION 2 — ONE-LINE EXPLANATION ─────────────────────────── */}
            <section className="btf-oneliner btf-reveal">
                <p className="btf-oneliner-main">
                    Your follower does one small thing. You get something real in return. They get your content for free.
                </p>
                <div className="btf-oneliner-divider" />
                <p className="btf-oneliner-alt">
                    Or skip the content entirely. Give your followers something harder to find than information — a partner who shows up for them every day.
                </p>
            </section>

            {/* ── SECTION 3 — HOW IT WORKS ─────────────────────────────────── */}
            <section className="btf-how btf-reveal" id="how-it-works">
                <span className="btf-label">How it works</span>
                <h2 className="btf-how-headline">Three steps. One link.</h2>

                <div className="btf-steps">
                    {/* Card 1 */}
                    <div className="btf-step-card btf-step-card--red">
                        <span className="btf-step-num">1</span>
                        <span className="btf-step-who">You</span>
                        <h3 className="btf-step-title">Upload a file, write a guide, or create a challenge.</h3>
                        <p className="btf-step-desc">
                            A premium photo shoot, an exclusive video, a PDF guide, a template, a prompt pack — anything your audience finds valuable. Lock it behind the action that grows your audience. Or skip the file entirely and run an accountability pairing challenge.
                        </p>
                        <div className="btf-file-pills">
                            {['🎬 Exclusive video', '📸 Premium photos', '📄 PDF guide', '📊 Template', '🎨 Figma file', '🤝 Challenge'].map((p) => (
                                <span key={p} className="btf-file-pill">{p}</span>
                            ))}
                        </div>
                        <div className="btf-media-highlight">
                            <span className="btf-media-highlight-icon">🔒</span>
                            <span className="btf-media-highlight-text">Lock videos and photos your followers can only access after completing your chosen action — email subscribe, follow, or sponsor watch.</span>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="btf-step-card btf-step-card--blue">
                        <span className="btf-step-num">2</span>
                        <span className="btf-step-who">You</span>
                        <h3 className="btf-step-title">Choose what your follower does to unlock it.</h3>
                        <p className="btf-step-desc">Pick the action that grows something you care about right now.</p>

                        <div className="btf-unlock-rows">
                            {[
                                { icon: '📧', bg: '#EDFAF3', name: 'Email Subscribe', benefit: 'They join your newsletter', tag: 'Own your list' },
                                { icon: '👥', bg: '#EFF6FF', name: 'Social Follow', benefit: 'They follow your account', tag: 'Grow following' },
                                { icon: '⭐', bg: '#F5F3FF', name: 'Custom Sponsor', benefit: "They watch your sponsor's video", tag: 'Earn 100%' },
                                { icon: '🤝', bg: '#FFFBEB', name: 'Accountability Pair', benefit: 'They get paired with a partner', tag: 'Build community' },
                            ].map((row, i) => (
                                <div key={i} className="btf-unlock-row">
                                    <div className="btf-unlock-icon" style={{ background: row.bg }}>{row.icon}</div>
                                    <div className="btf-unlock-info">
                                        <span className="btf-unlock-name">{row.name}</span>
                                        <span className="btf-unlock-benefit">{row.benefit}</span>
                                    </div>
                                    <span className="btf-unlock-tag">{row.tag}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="btf-step-card btf-step-card--green">
                        <span className="btf-step-num">3</span>
                        <span className="btf-step-who btf-step-who--green">Your follower</span>
                        <h3 className="btf-step-title">Completes the action. Gets your content instantly. Free.</h3>
                        <p className="btf-step-desc">
                            No payment. No signup wall unless you need one. They do the one thing you chose and get immediate access. You get a subscriber, a follower, a sponsor impression, or a paired participant.
                        </p>
                        <div className="btf-outcome-row">
                            You earn → a subscriber, follower, sponsor revenue, or paired community member.
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECTION 4 — FOUR UNLOCK TYPES ────────────────────────────── */}
            <section className="btf-types btf-reveal">
                <span className="btf-label">Four unlock types</span>
                <h2 className="btf-types-headline">Pick the one that fits what you are building.</h2>

                <div className="btf-types-list">
                    {/* Email */}
                    <div className="btf-type-card">
                        <div className="btf-type-header">
                            <div className="btf-type-icon" style={{ background: '#EDFAF3' }}>📧</div>
                            <span className="btf-type-name" style={{ color: '#166534' }}>Email Subscribe</span>
                            <span className="btf-type-fee btf-type-fee--green">0% fee</span>
                        </div>
                        <div className="btf-type-divider" />
                        <div className="btf-type-side">
                            <span className="btf-side-label">What you set up:</span>
                             <p className="btf-side-desc">Your newsletter name, a description, and your locked content — a PDF, a premium photo set, an exclusive video, or any file up to the upload limit.</p>
                        </div>
                        <div className="btf-type-side">
                            <span className="btf-side-label">What your follower does:</span>
                            <p className="btf-side-desc">Enters their email and confirms. Gets your content immediately.</p>
                        </div>
                        <div className="btf-type-earn btf-type-earn--green">
                            📧 A confirmed email subscriber — owned by you, not AdGate.
                        </div>
                    </div>

                    {/* Social */}
                    <div className="btf-type-card">
                        <div className="btf-type-header">
                            <div className="btf-type-icon" style={{ background: '#EFF6FF' }}>👥</div>
                            <span className="btf-type-name" style={{ color: '#2563EB' }}>Social Follow</span>
                            <span className="btf-type-fee btf-type-fee--blue">0% fee</span>
                        </div>
                        <div className="btf-type-divider" />
                        <div className="btf-type-side">
                            <span className="btf-side-label">What you set up:</span>
                            <p className="btf-side-desc">Your social handle, a heading you write, and up to 6 accounts to follow — including custom links.</p>
                        </div>
                        <div className="btf-type-side">
                            <span className="btf-side-label">What your follower does:</span>
                            <p className="btf-side-desc">Follows each of your accounts in sequence, confirms, and gets your content.</p>
                        </div>
                        <div className="btf-type-earn btf-type-earn--blue">
                            👥 A follower on every account you included — pre-qualified and interested.
                        </div>
                    </div>

                    {/* Sponsor */}
                    <div className="btf-type-card">
                        <div className="btf-type-header">
                            <div className="btf-type-icon" style={{ background: '#F5F3FF' }}>⭐</div>
                            <span className="btf-type-name" style={{ color: '#6366F1' }}>Custom Sponsor</span>
                            <span className="btf-type-fee btf-type-fee--purple">0% commission</span>
                        </div>
                        <div className="btf-type-divider" />
                        <div className="btf-type-side">
                            <span className="btf-side-label">What you set up:</span>
                             <p className="btf-side-desc">Your sponsor's video, their link, a CTA label, and your locked content — including premium videos or photo galleries your audience only sees after watching.</p>
                        </div>
                        <div className="btf-type-side">
                            <span className="btf-side-label">What your follower does:</span>
                            <p className="btf-side-desc">Watches your sponsor's video. Optionally visits their site. Gets your content free.</p>
                        </div>
                        <div className="btf-type-earn btf-type-earn--purple">
                            💰 100% of your sponsor deal. AdGate generates the campaign report for you.
                        </div>
                    </div>

                    {/* Accountability */}
                    <div className="btf-type-card">
                        <div className="btf-type-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            <div className="btf-type-icon" style={{ background: '#FFFBEB' }}>🤝</div>
                            <span className="btf-type-name" style={{ color: '#92400E' }}>Follower Pairing</span>
                            <span className="btf-type-fee btf-type-fee--amber">No file needed</span>
                        </div>
                        <div className="btf-type-divider" />
                        <div className="btf-type-side">
                            <span className="btf-side-label">What you set up:</span>
                             <p className="btf-side-desc">Your followers already know what to do — they follow you because your content teaches them. What stops them is doing it alone. Create a challenge around your core practice. Set a duration, write a commitment question, and preset a few messages that go out automatically. Your followers pair up with each other and implement your teaching together. You become the creator who actually changed someone's behavior — not just informed it.</p>
                        </div>
                        <div className="btf-type-side">
                            <span className="btf-side-label">What your follower experiences:</span>
                            <p className="btf-side-desc">They join your challenge, write what they personally commit to, and get matched with another follower who is starting the same journey. They share their progress daily in a private chat. When it gets hard — and it will — their partner is there. Not a group chat where no one is responsible. One specific person who is expecting to hear from them today.</p>
                        </div>
                        <div className="btf-type-earn btf-type-earn--amber">
                            🤝 Followers who implemented your teaching together — the strongest proof your work creates real results.
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECTION 5 — USE CASES ─────────────────────────────────────── */}
            <section className="btf-usecases btf-reveal">
                <span className="btf-label">Who uses AdGate</span>
                <h2 className="btf-usecases-headline">See if this sounds like you.</h2>

                <div className="btf-uc-list">
                    {[
                        {
                            border: '#166534',
                            type: 'Newsletter Creator',
                            situation: 'You give away free templates but get nothing back from them.',
                            how: 'Gate each template behind an email subscription. Every download adds a subscriber to your list. The template does not change — just where the value goes.',
                            pill: '📧 Passive list growth from content you already have',
                            pillClass: 'btf-uc-pill--green',
                        },
                        {
                            border: '#2563EB',
                            type: 'Designer',
                            situation: 'You share free Figma files and UI kits that hundreds of people download.',
                            how: 'Add a follow gate. Anyone who downloads has to follow your Instagram or YouTube first. You can add up to six accounts in one link — they follow all of them in sequence.',
                            pill: '👥 Every download becomes a follower',
                            pillClass: 'btf-uc-pill--blue',
                        },
                        {
                            border: '#6366F1',
                            type: 'Creator With A Brand Deal',
                            situation: 'You have a sponsor paying you to reach your audience but you are managing it manually.',
                            how: 'Upload their video to AdGate. Lock your most valuable resource behind it. AdGate tracks every impression and generates a one-tap campaign report. Your sponsor sees real verified data.',
                            pill: '⭐ Zero commission · Professional sponsor reports',
                            pillClass: 'btf-uc-pill--purple',
                        },
                        {
                            border: '#92400E',
                            type: 'Coach or Educator',
                            situation: 'You teach something your audience genuinely wants to do. They watch your content, feel motivated, then fall back into the same patterns three days later.',
                            how: 'The problem was never knowledge — it was doing it alone. Create a 14-day accountability challenge around your core practice. Your followers click your link, write their personal commitment, choose who they want to be matched with, and get paired instantly with another follower starting the same journey. They share their progress every day in a private chat. When one struggles the other pulls them forward. You write four messages upfront that go out automatically — a welcome, two check-ins, a final day note. The chat between your paired followers is private — you cannot read it. That privacy is what makes it honest. You find out it worked from the DMs you get afterwards.',
                            pill: '🤝 Followers who grew together — because of a structure you built once',
                            pillClass: 'btf-uc-pill--amber',
                        },
                        {
                            border: '#E8312A',
                            type: 'Video Creator or Photographer',
                            situation: 'You produce premium content — extended shoots, behind-the-scenes footage, exclusive video series — and you are either giving it away free or sitting on it unused.',
                            how: 'Lock your premium videos or full photo sets behind an email gate or social follow. Your most engaged audience — the ones who specifically seek your extended work — subscribe or follow to access it. You keep producing the public content that brings people in. The premium content converts them into subscribers or followers permanently. One shoot. Two audiences.',
                            pill: '🔒 Premium media turns your best work into audience growth',
                            pillClass: 'btf-uc-pill--red',
                        },
                        {
                            border: '#166534',
                            type: 'Course Creator Preparing A Launch',
                            situation: 'You are launching a course in three months and you have almost no email list.',
                            how: 'Create three or four free mini-resources — a worksheet, a checklist, a framework. Gate each one behind an email subscription. The subscribers you capture over the next three months are your warm launch audience. They already know your teaching before you ask them to buy.',
                            pill: '📧 Warm launch audience built months before you ask for anything',
                            pillClass: 'btf-uc-pill--green',
                        },
                    ].map((uc, i) => (
                        <div
                            key={i}
                            className="btf-uc-card"
                            style={{ borderLeftColor: uc.border }}
                        >
                            <span className="btf-uc-type">{uc.type}</span>
                            <h3 className="btf-uc-situation">{uc.situation}</h3>
                            <p className="btf-uc-how">{uc.how}</p>
                            <span className={`btf-uc-pill ${uc.pillClass}`}>{uc.pill}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── SECTION 6 — ACCOUNTABILITY DETAIL ───────────────────────── */}
            <section className="btf-accountability btf-reveal">
                <span className="btf-label btf-label--amber">Follower Pairing — explained simply</span>
                <h2 className="btf-accountability-headline">
                    Most people fail at new habits for one reason — they are doing it alone.
                </h2>
                <p className="btf-accountability-sub">
                    Follower pairing gives your followers what no piece of content can — a specific person who is expecting to hear from them today. You create the structure. They show up for each other.
                </p>

                <div className="btf-acc-cards">
                    {/* Creator card */}
                    <div className="btf-acc-card">
                        <span className="btf-acc-card-header">What you do as the creator</span>
                        <div className="btf-acc-steps">
                            {[
                                { title: 'Write your challenge topic', desc: "One sentence describing what participants will work on together. E.g. 'Build a morning reading habit for 14 days.'" },
                                { title: 'Write the commitment question', desc: "One question each participant answers when joining. E.g. 'What specific habit will you commit to?'" },
                                { title: 'Choose the duration', desc: '7, 14, 21, or 30 days. The chat link between pairs expires automatically when time is up.' },
                                { title: 'Write your scheduled messages', desc: 'Write 3 to 5 messages upfront that go to all pairs on specific days. Day 1 welcome, midpoint check-in, final day message. Takes 20 minutes.' },
                                { title: 'Share your link', desc: 'That is it. You share the link. Everything else is automatic.' },
                            ].map((step, i) => (
                                <div key={i} className="btf-acc-step">
                                    <span className="btf-acc-step-num">{i + 1}</span>
                                    <div>
                                        <span className="btf-acc-step-title">{step.title}</span>
                                        <p className="btf-acc-step-desc">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="btf-acc-bottom-strip">
                            You cannot see what pairs say to each other. Their chat is private. This is what makes it work.
                        </div>
                    </div>

                    {/* Follower card */}
                    <div className="btf-acc-card">
                        <span className="btf-acc-card-header">What your follower experiences</span>
                        <div className="btf-acc-steps">
                            {[
                                { title: 'Clicks your link', desc: 'Sees your challenge description, your creator profile, and the commitment question.' },
                                { title: 'Writes their commitment', desc: 'Answers your commitment question honestly. This becomes visible to their partner.' },
                                { title: 'Chooses a matching preference', desc: 'Male, female, or anyone. Gets matched with the most recently available person who fits.' },
                                { title: 'Signs in or creates an account', desc: 'Required to access the private chat. Their match is held for 10 minutes while they do this.' },
                                { title: 'Chats privately with their partner', desc: 'Private chat only they can see. Your scheduled messages arrive automatically. Chat expires when the challenge ends.' },
                            ].map((step, i) => (
                                <div key={i} className="btf-acc-step">
                                    <span className="btf-acc-step-num">{i + 1}</span>
                                    <div>
                                        <span className="btf-acc-step-title">{step.title}</span>
                                        <p className="btf-acc-step-desc">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="btf-acc-bottom-strip">
                            No app to download. No community to join. Just two people helping each other show up.
                        </div>
                    </div>
                </div>

                {/* Honest note */}
                <div className="btf-acc-note">
                    <p className="btf-acc-note-q">Why one partner beats a group chat every time.</p>
                    <p className="btf-acc-note-body">
                        In a group chat of 50 people most people post twice then disappear. Nobody is waiting specifically for them. Nobody notices when they go quiet. In a one-to-one pair there is no hiding. One specific person wrote their commitment. One specific person is checking in today. That direct personal expectation — knowing someone is waiting for you — is the mechanism that creates consistency. It is not motivational. It is structural. AdGate builds the structure. Your followers do the rest.
                    </p>
                </div>
            </section>

            {/* ── SECTION 7 — WHAT YOU OWN ──────────────────────────────────── */}
            <section className="btf-own btf-reveal">
                <span className="btf-label">What you actually own</span>
                <h2 className="btf-own-headline">Everything you build here belongs to you.</h2>

                <div className="btf-own-grid">
                    {[
                        {
                            emoji: '📧',
                            title: 'Your email list',
                            desc: 'Subscribers go to your platform — ConvertKit, Beehiiv, Mailchimp, or directly downloadable from AdGate. If you stop using AdGate you keep every email.',
                        },
                        {
                            emoji: '👥',
                            title: 'Your social following',
                            desc: 'Followers land on your Instagram, YouTube, or wherever you send them. AdGate creates the gate — your platform owns the relationship.',
                        },
                        {
                            emoji: '🔒',
                            title: 'Your premium content value',
                            desc: `Videos and photos you lock retain their value — they do not get devalued by being free everywhere. Viewers who unlock them are your most engaged audience segment. Their email addresses and follows are worth more than a casual visitor's.`,
                        },
                        {
                            emoji: '🤝',
                            title: 'Your community reputation',
                            desc: 'Accountability challenge results, participant counts, and completion rates are your story to tell. AdGate just makes it happen.',
                        },
                    ].map((card, i) => (
                        <div key={i} className="btf-own-card">
                            <span className="btf-own-emoji">{card.emoji}</span>
                            <h3 className="btf-own-title">{card.title}</h3>
                            <p className="btf-own-desc">{card.desc}</p>
                        </div>
                    ))}
                </div>
                <p className="btf-own-tagline">AdGate is a tool. The audience is yours.</p>
            </section>

            {/* ── SECTION 8 — COMPARISON ────────────────────────────────────── */}
            <section className="btf-compare btf-reveal">
                <h2 className="btf-compare-headline">What changes when you add a link gate.</h2>

                <div className="btf-compare-card">
                    {/* Header */}
                    <div className="btf-compare-header">
                        <div className="btf-compare-col btf-compare-col--without">
                            <span className="btf-compare-col-label">Without AdGate</span>
                        </div>
                        <div className="btf-compare-col btf-compare-col--with">
                            <span className="btf-compare-col-label" style={{ color: '#E8312A' }}>With AdGate</span>
                        </div>
                    </div>

                    {[
                        {
                            topic: 'When someone downloads your free resource',
                            without: 'They leave. You have nothing to show for it.',
                            with: 'They subscribe, follow, or join. You gain something permanent.',
                        },
                        {
                            topic: 'When you post a sponsor mention',
                            without: 'You track clicks in a spreadsheet and screenshot analytics.',
                            with: 'AdGate tracks it. One-tap report. Zero commission.',
                        },
                        {
                            topic: 'When you want followers to implement what you teach',
                            without: 'You post a call to action. Some try. Most do not. You never find out why.',
                            with: 'You run a pairing challenge. Each follower has a partner expecting them to show up. The implementation rate is structurally higher — not because you motivated them better but because they are not alone.',
                        },
                        {
                            topic: 'When you want your audience to take action',
                            without: 'You post a motivational caption and hope.',
                            with: 'You run a pairing challenge. Real accountability. Real outcomes.',
                        },
                        {
                            topic: 'What you own after 6 months',
                            without: "Follower counts on platforms you do not control.",
                            with: 'An email list, social accounts you own, and sponsor relationships.',
                        },
                    ].map((row, i) => (
                        <div key={i} className="btf-compare-row">
                            <div className="btf-compare-topic">{row.topic}</div>
                            <div className="btf-compare-values">
                                <div className="btf-compare-without">{row.without}</div>
                                <div className="btf-compare-with">{row.with}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── SECTION 9 — FINAL CTA ─────────────────────────────────────── */}
            <section className="btf-cta btf-reveal">
                <h2 className="btf-cta-headline">Create your first link. It takes two minutes.</h2>
                <p className="btf-cta-subtitle">Free forever for email and follow gates. Zero commission on your first sponsor deal.</p>
                <button className="btf-cta-button" onClick={scrollToTop}>
                    Get started for free →
                </button>
                <div className="btf-cta-trust">
                    <span>No credit card</span>
                    <span className="btf-trust-dot" />
                    <span>Your audience unlocks for free</span>
                    <span className="btf-trust-dot" />
                    <span>Cancel anytime</span>
                </div>
            </section>
        </div>
    );
};
