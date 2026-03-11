import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/* ─── Scroll-fade hook ──────────────────────────────────────────────── */
function useFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { el.style.opacity = '1'; return; }
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 400ms ease-out ${delay}ms, transform 400ms ease-out ${delay}ms`;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}

/* ─── Section label pill ────────────────────────────────────────────── */
const SectionLabel = ({ children, dark = false }: { children: string; dark?: boolean }) => (
  <div className={`h-[28px] px-4 rounded-[20px] flex items-center justify-center mb-6 self-center ${dark ? 'bg-white/10' : 'bg-[#F6F6F6]'}`}>
    <span className={`text-[11px] font-[800] uppercase tracking-[0.8px] ${dark ? 'text-white/60' : 'text-[#555]'}`}>{children}</span>
  </div>
);

/* ─── Amber pill ────────────────────────────────────────────────────── */
const AmberLabel = ({ children }: { children: string }) => (
  <div className="h-[28px] px-4 rounded-[20px] flex items-center justify-center mb-6 self-center bg-[#FFFBEB] border border-[#FDE68A]">
    <span className="text-[11px] font-[800] uppercase tracking-[0.8px] text-[#B45309]">{children}</span>
  </div>
);

/* ─── Footer ────────────────────────────────────────────────────────── */
const Footer = () => (
  <footer className="w-full bg-white border-t border-[#E6E2D9] py-12 px-4 flex flex-col items-center">
    <div className="w-full max-w-[1000px] flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-2 opacity-80">
        <div className="w-6 h-6 rounded-[6px] bg-[#21201C] text-white flex items-center justify-center font-black text-[10px] leading-none shrink-0">AG</div>
        <span className="font-black text-[16px] tracking-tight text-[#21201C]">AdGate</span>
      </div>
      <div className="flex items-center gap-6 text-[13px] font-bold text-[#6B6860]">
        <Link to="/explore" className="hover:text-[#21201C] transition-colors">Explore</Link>
        <Link to="/pricing" className="hover:text-[#21201C] transition-colors">Pricing</Link>
        <Link to="/terms" className="hover:text-[#21201C] transition-colors">Terms</Link>
        <Link to="/privacy" className="hover:text-[#21201C] transition-colors">Privacy</Link>
        <Link to="/contact" className="hover:text-[#21201C] transition-colors">Contact</Link>
      </div>
      <div className="text-[12px] font-bold text-[#AAA49C]">© {new Date().getFullYear()} AdGate Inc.</div>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════ */
export const HowItWorks = () => {
  const navigate = useNavigate();
  const [showBackTop, setShowBackTop] = useState(false);
  const [activeNode, setActiveNode] = useState<number | null>(null);

  /* SEO */
  useEffect(() => {
    document.title = 'How AdGate Works — Creator Guide';
    const m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute('content', 'You create content. Your followers unlock it free. You both win. See exactly how AdGate works in under 5 minutes.');
  }, []);

  /* Back-to-top fade */
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 800);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Section refs for staggered fade */
  const heroRef = useFadeIn(0);
  const s2Ref = useFadeIn(0);
  const s3Ref = useFadeIn(0);
  const s4Ref = useFadeIn(0);
  const s5Ref = useFadeIn(0);
  const s6Ref = useFadeIn(0);
  const s7Ref = useFadeIn(0);
  const s8Ref = useFadeIn(0);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleCTA = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF9F7]" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────── */}
      <section className="w-full bg-white pt-16 pb-20 flex flex-col items-center text-center px-6">
        <div ref={heroRef} className="w-full flex flex-col items-center">
          <SectionLabel>How AdGate works</SectionLabel>

          <h1 className="font-[900] text-[#111] leading-[1.15] text-center max-w-[520px]"
            style={{ fontSize: 'clamp(36px, 5vw, 52px)', marginTop: 16 }}>
            You create content. Your followers unlock it free. You both win.
          </h1>

          {/* Three icons row */}
          <div className="flex items-center justify-center gap-3 mt-8 max-w-[480px] w-full mx-auto">
            {/* Item 1 */}
            <div className="flex flex-col items-center gap-2">
              <span style={{ fontSize: 40 }}>📄</span>
              <span className="text-[13px] font-[700] text-[#555]">You create</span>
            </div>
            {/* Arrow */}
            <span className="text-[20px] text-[#DDD] font-bold select-none">→</span>
            {/* Item 2 */}
            <div className="flex flex-col items-center gap-2">
              <span style={{ fontSize: 40 }}>🔒</span>
              <span className="text-[13px] font-[700] text-[#555]">They unlock</span>
            </div>
            {/* Arrow */}
            <span className="text-[20px] text-[#DDD] font-bold select-none">→</span>
            {/* Item 3 */}
            <div className="flex flex-col items-center gap-2">
              <span style={{ fontSize: 40 }}>🌱</span>
              <span className="text-[13px] font-[700] text-[#555]">You both grow</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleCTA}
            className="mt-8 h-[52px] px-7 rounded-[14px] text-white font-[900] text-[16px] transition-colors"
            style={{ background: '#E8312A', minWidth: 220 }}
            onMouseOver={e => (e.currentTarget.style.background = '#C42823')}
            onMouseOut={e => (e.currentTarget.style.background = '#E8312A')}
          >
            Create your first link — it's free →
          </button>
        </div>
      </section>

      {/* ── SECTION 2 — THE CORE MECHANIC ────────────────────────────── */}
      <section className="w-full py-20 px-6" style={{ background: '#111' }}>
        <div ref={s2Ref} className="w-full max-w-[1140px] mx-auto flex flex-col items-center">
          <h2 className="font-[900] text-white text-center max-w-[400px]"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            The exchange is simple.
          </h2>
          <p className="text-center text-[16px] font-[600] mt-3 max-w-[480px] leading-[1.65]"
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            Your followers get your content free. You get something permanent in return.
          </p>

          {/* Exchange visual */}
          <div className="w-full max-w-[800px] mt-10 flex flex-col md:flex-row items-center gap-4 md:gap-0">

            {/* Left — Creator */}
            <div className="flex flex-col items-center md:flex-1">
              <span className="text-[11px] font-[800] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.8px' }}>You</span>
              <div className="bg-white rounded-[16px] p-5 w-full max-w-[220px] flex flex-col items-center">
                <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-[24px]" style={{ background: '#F6F6F6' }}>📄</div>
                <span className="text-[13px] font-[700] text-[#333] mt-2">Your content</span>
                <span className="text-[10px] font-[600] text-[#AAA] mt-0.5">PDF · Video · Photos · Guide</span>
                <div className="flex items-center gap-1 mt-4">
                  <span className="text-[20px]">🔒</span>
                  <span className="text-[11px] font-[700]" style={{ color: '#E8312A' }}>Locked</span>
                </div>
              </div>
            </div>

            {/* Center arrow */}
            <div className="flex flex-col items-center py-2 md:w-20">
              <span className="hidden md:block text-[28px] font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
              <span className="md:hidden text-[28px] font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>↓</span>
              <span className="text-[10px] font-[700] mt-1 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>unlocks it</span>
            </div>

            {/* Right — Follower */}
            <div className="flex flex-col items-center md:flex-1">
              <span className="text-[11px] font-[800] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.8px' }}>Your follower</span>
              <div className="bg-white rounded-[16px] p-5 w-full max-w-[220px] flex flex-col items-center">
                <div className="grid grid-cols-2 gap-2 w-full">
                  {[
                    { emoji: '📧', label: 'Subscribes' },
                    { emoji: '👥', label: 'Follows' },
                    { emoji: '⭐', label: 'Watches ad' },
                    { emoji: '🤝', label: 'Joins challenge' },
                  ].map(pill => (
                    <div key={pill.label} className="h-9 rounded-[14px] flex items-center gap-1.5 px-3" style={{ background: '#F6F6F6' }}>
                      <span className="text-[14px]">{pill.emoji}</span>
                      <span className="text-[12px] font-[700] text-[#333]">{pill.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] font-[700] text-center mt-3" style={{ color: '#888' }}>
                  Gets your content instantly. Free.
                </p>
              </div>
            </div>
          </div>

          {/* Result card */}
          <div className="flex flex-col md:flex-row items-center gap-4 mt-8 px-6 py-4 rounded-[14px] max-w-[480px] w-full"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-[28px]">✅</span>
            <p className="text-[14px] font-[600] text-white leading-[1.6] text-center md:text-left">
              You get a subscriber, follower, sponsor revenue, or a community of people doing the work together — permanently.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — TWO PATHS ────────────────────────────────────── */}
      <section className="w-full py-20 px-6 bg-white">
        <div ref={s3Ref} className="w-full max-w-[1140px] mx-auto flex flex-col items-center">
          <SectionLabel>Two ways to use AdGate</SectionLabel>
          <h2 className="font-[900] text-[#111] text-center max-w-[480px] leading-[1.25]"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            Do you have content to share — or habits to build?
          </h2>

          <div className="w-full max-w-[900px] mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Card 1 — Lock Content */}
            <div className="rounded-[20px] p-8 flex flex-col" style={{ background: '#FFF', border: '2px solid #111' }}>
              <span className="text-[40px]">🔒</span>
              <h3 className="text-[22px] font-[900] text-[#111] mt-2">Lock Content</h3>
              <p className="text-[14px] font-[600] text-[#888] mt-2 leading-[1.6]">You have a file, video, or resource.</p>
              <div className="my-5 border-t border-[#F0F0F0]" />
              <div className="flex flex-col gap-3">
                {[
                  { dot: '#22C55E', text: 'Share a PDF and grow your email list.' },
                  { dot: '#3B82F6', text: 'Share a resource and grow your social accounts.' },
                  { dot: '#A855F7', text: 'Share locked content and earn from your sponsor deal.' },
                ].map(r => (
                  <div key={r.text} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.dot }} />
                    <span className="text-[13px] font-[700] text-[#333]">{r.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[12px] p-4" style={{ background: '#111' }}>
                <div className="text-[10px] font-[800] text-white uppercase tracking-wide">Best for:</div>
                <div className="text-[12px] font-[600] mt-1 leading-[1.5]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Designers, educators, writers, photographers, developers.
                </div>
              </div>
            </div>

            {/* Card 2 — Follower Pairing */}
            <div className="rounded-[20px] p-8 flex flex-col" style={{ background: '#111' }}>
              <span className="text-[40px]">🤝</span>
              <h3 className="text-[22px] font-[900] text-white mt-2">Follower Pairing</h3>
              <p className="text-[14px] font-[600] mt-2 leading-[1.6]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                No file needed. You have knowledge and a method.
              </p>
              <div className="my-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
              <div className="flex flex-col gap-3">
                {[
                  'Create a challenge your followers join.',
                  'They get paired with a partner automatically.',
                  'They hold each other accountable. You guide them.',
                ].map(text => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#D97757' }} />
                    <span className="text-[13px] font-[700] text-white">{text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[12px] p-4" style={{ background: '#B45309' }}>
                <div className="text-[10px] font-[800] text-white uppercase tracking-wide">Best for:</div>
                <div className="text-[12px] font-[600] mt-1 leading-[1.5]" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Coaches, fitness creators, productivity educators, habit builders.
                </div>
              </div>
            </div>
          </div>

          <Link to="/use-cases"
            className="mt-5 text-[13px] font-[700] transition-colors"
            style={{ color: '#E8312A' }}>
            Not sure which? See use cases →
          </Link>
        </div>
      </section>

      {/* ── SECTION 4 — LOCK CONTENT THREE TYPES ────────────────────── */}
      <section className="w-full py-20 px-6" style={{ background: '#FAFAFA' }}>
        <div ref={s4Ref} className="w-full max-w-[1140px] mx-auto flex flex-col items-center">
          <AmberLabel>Lock Content — three unlock types</AmberLabel>
          <h2 className="font-[900] text-[#111] text-center max-w-[480px]"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            Choose what your followers do to unlock it.
          </h2>

          <div className="w-full mt-10 flex flex-col gap-6">

            {/* Type 1 — Email Subscribe */}
            <TypeBlock
              delay={0}
              setupBg="#EDFAF3"
              setupEmoji="📧"
              setupTitle="Email Subscribe"
              setupTitleColor="#166534"
              setupDesc="You upload your content and add your newsletter name. That's the whole setup."
              setupDescColor="#166534"
              setupPreview={
                <div className="bg-white rounded-[10px] p-3 mt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-[700] text-[#888]">Newsletter name</span>
                    <span className="text-[11px] font-[700] text-[#166534]">✓</span>
                  </div>
                  <div className="h-7 bg-[#EDFAF3] rounded-md px-2 flex items-center">
                    <span className="text-[11px] font-[600] text-[#333]">Weekly Design Tips</span>
                  </div>
                  <div className="h-7 mt-1 bg-[#F6F6F6] rounded-md px-2 flex items-center gap-2">
                    <span className="text-[13px]">📄</span>
                    <span className="text-[11px] font-[600] text-[#333]">Figma UI Kit.pdf ✓</span>
                  </div>
                </div>
              }
              journeyLabel="What your follower sees:"
              steps={[
                'Clicks your link. Sees your file and your newsletter description.',
                'Types their email. Taps Subscribe.',
                'Gets your file immediately. Free.',
                'Receives your newsletter going forward.',
              ]}
              resultBg="#166534"
              resultEmoji="📧"
              resultTitle="A confirmed email subscriber."
              resultSub="On your platform. Yours to keep. Not AdGate's."
              feeLabel="0% fee"
              feeSub="No commission on subscribers."
            />

            {/* Type 2 — Social Follow */}
            <TypeBlock
              delay={80}
              setupBg="#EFF6FF"
              setupEmoji="👥"
              setupTitle="Social Follow"
              setupTitleColor="#2563EB"
              setupDesc="List up to 6 social accounts. Your followers complete each follow in sequence."
              setupDescColor="#2563EB"
              setupPreview={
                <div className="bg-white rounded-[10px] p-3 mt-4 flex flex-col gap-2">
                  {[
                    { icon: '📸', label: '@yourhandle', platform: 'Instagram' },
                    { icon: '▶️', label: '@yourchannel', platform: 'YouTube' },
                    { icon: '💬', label: 'discord.gg/server', platform: 'Discord' },
                  ].map(r => (
                    <div key={r.platform} className="h-7 bg-[#EFF6FF] rounded-md px-2 flex items-center gap-2">
                      <span className="text-[13px]">{r.icon}</span>
                      <span className="text-[11px] font-[600] text-[#333]">{r.label}</span>
                      <span className="ml-auto text-[11px] font-[700] text-[#22C55E]">✓</span>
                    </div>
                  ))}
                  <div className="h-7 border border-dashed border-[#93C5FD] rounded-md px-2 flex items-center">
                    <span className="text-[11px] font-[600] text-[#3B82F6]">+ Add more</span>
                  </div>
                </div>
              }
              journeyLabel="What your follower sees:"
              steps={[
                'Clicks your link. Sees what file they are unlocking.',
                'Follows your first account. Confirms.',
                'Follows each account in sequence. Progress shown.',
                'Gets your file after the final follow.',
              ]}
              resultBg="#1E3A8A"
              resultEmoji="👥"
              resultTitle="A follower on every account you listed."
              resultSub="All at once. From one resource."
              feeLabel="0% fee"
              feeSub="No commission on follows."
            />

            {/* Type 3 — Custom Sponsor */}
            <TypeBlock
              delay={160}
              setupBg="#F5F3FF"
              setupEmoji="⭐"
              setupTitle="Custom Sponsor"
              setupTitleColor="#6366F1"
              setupDesc="Upload your sponsor's video and add their website link. AdGate tracks everything and generates your campaign report."
              setupDescColor="#6366F1"
              setupPreview={
                <div className="bg-white rounded-[10px] p-3 mt-4 flex flex-col gap-2">
                  <div className="h-16 bg-[#111] rounded-md flex items-center justify-center relative overflow-hidden">
                    <span className="text-[20px]">▶️</span>
                    <span className="absolute top-1.5 right-2 text-[10px] font-[700] text-white/70">Sponsor video ✓</span>
                  </div>
                  <div className="h-7 bg-[#F5F3FF] rounded-md px-2 flex items-center gap-2">
                    <span className="text-[11px] font-[600] text-[#333]">sponsor.com ✓</span>
                  </div>
                  <div className="h-7 bg-[#F5F3FF] rounded-md px-2 flex items-center gap-2">
                    <span className="text-[11px] font-[600] text-[#333]">Try it free ✓</span>
                  </div>
                </div>
              }
              journeyLabel="What your follower sees:"
              steps={[
                'Clicks your link. Sees a video player.',
                "Watches your sponsor's video.",
                'Sees a CTA button to visit the sponsor.',
                'Gets your content unlocked.',
              ]}
              resultBg="#4338CA"
              resultEmoji="💰"
              resultTitle="100% of your sponsor deal."
              resultSub="Plus a verified campaign report to send them."
              feeLabel="0% under $500/mo · 3% above"
              feeSub="Our only fee — only if you scale."
            />
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — FOLLOWER PAIRING DEEP DIVE ───────────────────── */}
      <section className="w-full py-20 px-6 bg-white">
        <div ref={s5Ref} className="w-full max-w-[1140px] mx-auto flex flex-col items-center">
          <AmberLabel>Follower Pairing</AmberLabel>
          <h2 className="font-[900] text-[#111] text-center max-w-[520px] leading-[1.2]"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            You set it up once. Your followers show up for each other every day.
          </h2>

          {/* Timeline */}
          <div className="w-full mt-12">
            {/* Desktop — horizontal */}
            <div className="hidden md:flex relative w-full items-start">
              {/* Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5" style={{ background: '#F0F0F0' }} />

              {[
                {
                  emoji: '✏️', title: 'You configure',
                  desc: 'Write your challenge topic, a commitment question, and how many days it runs. Take 20 minutes.',
                  example: 'Topic: 14-Day Morning Routine',
                },
                {
                  emoji: '👆', title: 'They click your link',
                  desc: 'They see your challenge description and write their personal commitment in a text box.',
                  example: 'Commit: Wake up at 6am and journal for 10 minutes.',
                },
                {
                  emoji: '🤝', title: 'They get paired',
                  desc: 'They choose a matching preference. AdGate finds the most recently available partner. Match happens instantly.',
                  example: null,
                  visual: (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-[800] text-blue-600">A</div>
                      <span className="text-[14px]">🤝</span>
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-[11px] font-[800] text-green-600">J</div>
                    </div>
                  ),
                },
                {
                  emoji: '💬', title: 'Private daily chat',
                  desc: 'Only the two of them can see their chat. Your scheduled messages arrive automatically. The privacy makes it honest.',
                  example: null,
                  note: '🔒 You cannot read their chat. This is intentional.',
                },
                {
                  emoji: '✅', title: 'Challenge complete',
                  desc: 'The chat closes. Both partners get a celebration screen. You get the data.',
                  stat: '68 pairs · 21 days · 0 hours of facilitation',
                },
              ].map((node, i) => (
                <div key={i} className="flex-1 flex flex-col items-center px-2" style={{ zIndex: 1 }}>
                  <button
                    onClick={() => setActiveNode(activeNode === i ? null : i)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[20px] border-2 transition-all duration-200 shrink-0"
                    style={{
                      borderColor: activeNode === i ? '#B45309' : '#E8E8E8',
                      background: activeNode === i ? '#FFFBEB' : 'white',
                    }}
                  >
                    {node.emoji}
                  </button>

                  <div className="mt-4 w-full max-w-[180px] rounded-[12px] p-4 transition-all" style={{ border: '1.5px solid #F0F0F0', background: 'white' }}>
                    <div className="text-[13px] font-[900] text-[#111]">{node.title}</div>
                    <div className="text-[12px] font-[600] text-[#666] leading-[1.6] mt-1">{node.desc}</div>
                    {node.example && (
                      <div className="mt-2 rounded-[8px] p-2" style={{ background: '#FFFBEB' }}>
                        <span className="text-[10px] font-[700] text-[#B45309]">{node.example}</span>
                      </div>
                    )}
                    {node.visual && node.visual}
                    {node.note && (
                      <div className="mt-2 rounded-[8px] p-2" style={{ background: '#F6F6F6', borderLeft: '3px solid #B45309' }}>
                        <span className="text-[10px] font-[700] text-[#B45309]">{node.note}</span>
                      </div>
                    )}
                    {node.stat && (
                      <div className="mt-2 text-[10px] font-[800] text-[#B45309]">{node.stat}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile — vertical */}
            <div className="md:hidden flex flex-col relative">
              <div className="absolute top-0 bottom-0 left-5 w-0.5" style={{ background: '#F0F0F0' }} />
              {[
                { emoji: '✏️', title: 'You configure', desc: 'Write your challenge topic, a commitment question, and how many days it runs. Take 20 minutes.', example: 'Topic: 14-Day Morning Routine' },
                { emoji: '👆', title: 'They click your link', desc: 'They see your challenge and write their personal commitment.', example: 'Commit: Wake up at 6am and journal for 10 minutes.' },
                { emoji: '🤝', title: 'They get paired', desc: 'AdGate finds the most recently available partner. Match happens instantly.' },
                { emoji: '💬', title: 'Private daily chat', desc: 'Only the two of them can see their chat. Your scheduled messages arrive automatically.', note: '🔒 You cannot read their chat. This is intentional.' },
                { emoji: '✅', title: 'Challenge complete', desc: 'The chat closes. Both partners get a celebration screen. You get the data.', stat: '68 pairs · 21 days · 0 hours of facilitation' },
              ].map((node, i) => (
                <div key={i} className="flex gap-4 mb-6 relative">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-[#E8E8E8] flex items-center justify-center text-[18px] shrink-0 z-10" style={{ background: 'white' }}>
                    {node.emoji}
                  </div>
                  <div className="flex-1 rounded-[12px] p-4" style={{ border: '1.5px solid #F0F0F0', background: 'white' }}>
                    <div className="text-[13px] font-[900] text-[#111]">{node.title}</div>
                    <div className="text-[12px] font-[600] text-[#666] leading-[1.6] mt-1">{node.desc}</div>
                    {'example' in node && node.example && (
                      <div className="mt-2 rounded-[8px] p-2" style={{ background: '#FFFBEB' }}>
                        <span className="text-[10px] font-[700] text-[#B45309]">{node.example}</span>
                      </div>
                    )}
                    {'note' in node && node.note && (
                      <div className="mt-2 rounded-[8px] p-2" style={{ background: '#F6F6F6', borderLeft: '3px solid #B45309' }}>
                        <span className="text-[10px] font-[700] text-[#B45309]">{node.note}</span>
                      </div>
                    )}
                    {'stat' in node && node.stat && (
                      <div className="mt-2 text-[10px] font-[800] text-[#B45309]">{node.stat}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time investment card */}
          <div className="mt-8 w-full max-w-[560px] rounded-[16px] p-6" style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
            <div className="text-[18px] font-[900] text-[#111]">What this costs you.</div>
            <div className="mt-4 flex flex-col gap-3">
              {[
                { label: 'Time to set up:', value: '~20 minutes' },
                { label: 'Messages to write:', value: '3 to 5 (sent automatically)' },
                { label: 'Daily time to manage:', value: 'Zero' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-[13px] font-[600] text-[#888]">{r.label}</span>
                  <span className="text-[14px] font-[900] text-[#111]">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#FDE68A]">
              <p className="text-[14px] font-[700] text-[#B45309] text-center">
                You build the structure once. Your followers do the rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — FOLLOWER EXPERIENCE ─────────────────────────── */}
      <section className="w-full py-20 px-6" style={{ background: '#FAFAFA' }}>
        <div ref={s6Ref} className="w-full max-w-[1140px] mx-auto flex flex-col items-center">
          <SectionLabel>What your followers experience</SectionLabel>
          <h2 className="font-[900] text-[#111] text-center max-w-[440px] leading-[1.2]"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            They never pay. The exchange is always fair.
          </h2>

          <div className="w-full max-w-[900px] mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                emoji: '📧', label: 'Email Subscribe',
                iconBg: '#EDFAF3', titleColor: '#166534', borderColor: '#166534',
                quote: 'I wanted the template anyway. Giving my email is a fair trade. I can unsubscribe if the newsletter is not good.',
                gets: 'Your content instantly. A newsletter they opted into.',
                delay: 0,
              },
              {
                emoji: '👥', label: 'Social Follow',
                iconBg: '#EFF6FF', titleColor: '#2563EB', borderColor: '#2563EB',
                quote: "I already like this creator's content. Following their other accounts takes 90 seconds and I get the resource free. Feels like a good deal.",
                gets: 'Your content. Follows only on accounts they chose to follow.',
                delay: 80,
              },
              {
                emoji: '⭐', label: 'Custom Sponsor',
                iconBg: '#F5F3FF', titleColor: '#6366F1', borderColor: '#6366F1',
                quote: 'Watching a 60-second video to get a free resource is the same as a YouTube ad. Except here I chose to be here.',
                gets: 'Your content. A sponsor message they opted into seeing.',
                delay: 160,
              },
              {
                emoji: '🤝', label: 'Follower Pairing',
                iconBg: '#FFFBEB', titleColor: '#B45309', borderColor: '#B45309',
                quote: 'I get a real person who is going through the same thing as me. Someone is actually waiting to hear from me today.',
                gets: 'A partner. A structure. A reason to show up.',
                delay: 240,
              },
            ].map(card => (
              <ExperienceCard key={card.label} {...card} />
            ))}
          </div>

          <p className="mt-6 text-[14px] font-[700] text-center max-w-[420px]" style={{ color: '#888' }}>
            A good exchange feels fair because it is fair. That is why AdGate converts.
          </p>
        </div>
      </section>

      {/* ── SECTION 7 — OWNERSHIP ────────────────────────────────────── */}
      <section className="w-full py-20 px-6 bg-white">
        <div ref={s7Ref} className="w-full max-w-[1140px] mx-auto flex flex-col items-center">
          <SectionLabel>Ownership</SectionLabel>
          <h2 className="font-[900] text-[#111] text-center max-w-[440px]"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            Everything you build here belongs to you.
          </h2>

          <div className="w-full max-w-[800px] mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                bg: '#EDFAF3', emoji: '📧', title: 'Your email list',
                desc: 'Goes directly to your email platform. If you ever leave AdGate, every subscriber stays yours.',
              },
              {
                bg: '#EFF6FF', emoji: '👥', title: 'Your social following',
                desc: 'Followers land on your Instagram, YouTube, or wherever. AdGate creates the gate — your platform owns the relationship.',
              },
              {
                bg: '#F5F3FF', emoji: '💰', title: 'Your sponsor revenue',
                desc: 'Paid directly to you. Zero commission under $500 per month. Your brand relationship is yours to keep.',
              },
              {
                bg: '#FFFBEB', emoji: '🤝', title: 'Your community outcomes',
                desc: 'Pairing results, completion rates, and participant numbers are your proof that your teaching creates real change.',
              },
            ].map(item => (
              <div key={item.title} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[20px] shrink-0" style={{ background: item.bg }}>
                  {item.emoji}
                </div>
                <div>
                  <div className="text-[15px] font-[900] text-[#111]">{item.title}</div>
                  <div className="text-[13px] font-[600] text-[#888] mt-1 leading-[1.6]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full max-w-[800px] mt-8 pt-6 text-center" style={{ borderTop: '1px solid #F0F0F0' }}>
            <p className="text-[16px] font-[800] text-[#111]">AdGate is a tool. The audience is yours.</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 8 — FINAL CTA ────────────────────────────────────── */}
      <section className="w-full py-24 px-6 flex flex-col items-center text-center" style={{ background: '#E8312A' }}>
        <div ref={s8Ref} className="w-full flex flex-col items-center">
          <h2 className="font-[900] text-white text-center max-w-[480px] leading-[1.2]"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
            Ready to make your content work harder?
          </h2>
          <p className="mt-3 text-[16px] font-[600] max-w-[360px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Create your first link in under five minutes. Free forever.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 items-center">
            <button
              onClick={handleCTA}
              className="h-[54px] font-[900] text-[16px] rounded-[14px] transition-colors"
              style={{ background: 'white', color: '#E8312A', width: 220 }}
              onMouseOver={e => (e.currentTarget.style.background = '#FFF0EF')}
              onMouseOut={e => (e.currentTarget.style.background = 'white')}
            >
              Get started free →
            </button>
            <Link to="/pricing"
              className="h-[54px] font-[700] text-[15px] rounded-[14px] flex items-center justify-center transition-colors text-white"
              style={{ border: '2px solid rgba(255,255,255,0.4)', width: 160 }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              See pricing
            </Link>
          </div>

          <p className="mt-4 text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            No credit card · Takes 5 minutes · Free forever
          </p>
        </div>
      </section>

      <Footer />

      {/* Back to top */}
      <button
        onClick={scrollTop}
        aria-label="Back to top"
        className="fixed bottom-24 right-5 w-11 h-11 rounded-full bg-white flex items-center justify-center transition-all duration-300 z-50"
        style={{
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          opacity: showBackTop ? 1 : 0,
          pointerEvents: showBackTop ? 'auto' : 'none',
          transform: showBackTop ? 'translateY(0)' : 'translateY(8px)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 14V6M10 6L6 10M10 6L14 10" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

/* ─── TypeBlock — reusable section-4 component ──────────────────────── */
interface TypeBlockProps {
  delay: number;
  setupBg: string;
  setupEmoji: string;
  setupTitle: string;
  setupTitleColor: string;
  setupDesc: string;
  setupDescColor: string;
  setupPreview: React.ReactNode;
  journeyLabel: string;
  steps: string[];
  resultBg: string;
  resultEmoji: string;
  resultTitle: string;
  resultSub: string;
  feeLabel: string;
  feeSub: string;
}

const TypeBlock = ({
  delay, setupBg, setupEmoji, setupTitle, setupTitleColor, setupDesc, setupDescColor,
  setupPreview, journeyLabel, steps, resultBg, resultEmoji, resultTitle, resultSub,
  feeLabel, feeSub,
}: TypeBlockProps) => {
  const ref = useFadeIn(delay);
  return (
    <div ref={ref} className="w-full rounded-[20px] overflow-hidden flex flex-col md:flex-row"
      style={{ border: '1.5px solid #F0F0F0' }}>

      {/* Setup */}
      <div className="md:w-[35%] p-7 flex flex-col" style={{ background: setupBg }}>
        <span className="text-[32px]">{setupEmoji}</span>
        <div className="text-[18px] font-[900] mt-2" style={{ color: setupTitleColor }}>{setupTitle}</div>
        <p className="text-[13px] font-[600] mt-2 leading-[1.65]" style={{ color: setupDescColor, opacity: 0.85 }}>{setupDesc}</p>
        {setupPreview}
      </div>

      {/* Journey */}
      <div className="md:w-[40%] p-7 flex flex-col" style={{ background: 'white', borderLeft: '1px solid #F0F0F0', borderTop: '1px solid #F0F0F0' }}>
        <div className="text-[11px] font-[800] uppercase tracking-wide mb-4" style={{ color: '#AAA' }}>{journeyLabel}</div>
        <div className="flex flex-col relative">
          {/* Vertical connector */}
          <div className="absolute left-3 top-4 bottom-4 w-px" style={{ background: '#F0F0F0' }} />
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 mb-4 relative">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-[800] text-[#555] shrink-0 z-10"
                style={{ background: '#F6F6F6' }}>
                {i + 1}
              </div>
              <span className="text-[13px] font-[600] text-[#333] leading-[1.6] pt-0.5">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Result */}
      <div className="md:w-[25%] p-7 flex flex-col items-center justify-between" style={{ background: resultBg }}>
        <div className="flex flex-col items-center text-center">
          <div className="text-[11px] font-[800] uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>You get</div>
          <span className="text-[40px]">{resultEmoji}</span>
          <div className="text-[16px] font-[900] text-white mt-2 leading-tight">{resultTitle}</div>
          <div className="text-[12px] font-[600] mt-2 leading-[1.5]" style={{ color: 'rgba(255,255,255,0.65)' }}>{resultSub}</div>
        </div>
        <div className="mt-6 w-full rounded-[8px] p-3 text-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="text-[12px] font-[800] text-white">{feeLabel}</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{feeSub}</div>
        </div>
      </div>
    </div>
  );
};

/* ─── ExperienceCard ─────────────────────────────────────────────────── */
interface ExperienceCardProps {
  emoji: string;
  label: string;
  iconBg: string;
  titleColor: string;
  borderColor: string;
  quote: string;
  gets: string;
  delay: number;
}

const ExperienceCard = ({ emoji, label, iconBg, titleColor, borderColor, quote, gets, delay }: ExperienceCardProps) => {
  const ref = useFadeIn(delay);
  return (
    <div ref={ref} className="rounded-[16px] p-6 flex flex-col" style={{ background: 'white', border: '1.5px solid #F0F0F0' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[8px] flex items-center justify-center text-[22px]" style={{ background: iconBg }}>
          {emoji}
        </div>
        <span className="text-[14px] font-[900]" style={{ color: titleColor }}>{label}</span>
      </div>
      <div className="mt-4 pl-4 italic text-[14px] font-[600] text-[#555] leading-[1.75]"
        style={{ borderLeft: `3px solid ${borderColor}` }}>
        "{quote}"
      </div>
      <div className="mt-4">
        <div className="text-[11px] font-[800] uppercase tracking-wide text-[#AAA] mb-1">What they get:</div>
        <div className="text-[13px] font-[700] text-[#333]">{gets}</div>
      </div>
    </div>
  );
};
