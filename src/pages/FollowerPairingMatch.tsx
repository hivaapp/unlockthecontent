import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockLinks } from '../lib/mockData';

type GenderOption = 'male' | 'female' | 'any';

export const FollowerPairingMatch = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<GenderOption | null>(null);

  const link = mockLinks.find(l => l.slug === slug && l.unlockType === 'follower_pairing');

  // Check commitment exists
  useEffect(() => {
    if (slug) {
      const commitment = sessionStorage.getItem(`adgate_acc_${slug}_commitment`);
      if (!commitment) {
        navigate(`/r/${slug}`, { replace: true });
      }
      const stored = sessionStorage.getItem(`adgate_acc_${slug}_gender`);
      if (stored) setSelected(stored as GenderOption);
    }
  }, [slug, navigate]);

  if (!link) {
    navigate(`/r/${slug}`, { replace: true });
    return null;
  }

  const waitingCount = 3 + Math.floor(Math.random() * 10); // 3-12

  const handleNext = () => {
    if (!selected || !slug) return;
    sessionStorage.setItem(`adgate_acc_${slug}_gender`, selected);
    navigate(`/r/${slug}/matching`);
  };

  const cards: { id: GenderOption; emoji: string; bg: string; title: string; subtitle: string }[] = [
    { id: 'male', emoji: '👨', bg: '#EFF6FF', title: 'Male', subtitle: 'Match with a male participant' },
    { id: 'female', emoji: '👩', bg: '#FDF2F8', title: 'Female', subtitle: 'Match with a female participant' },
    { id: 'any', emoji: '🤝', bg: '#FFFBEB', title: 'Anyone', subtitle: 'Match with whoever is available first' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Nav */}
      <nav className="w-full h-[58px] bg-white flex items-center justify-between px-4 shrink-0" style={{ borderBottom: '1px solid #F0F0F0' }}>
        <button onClick={() => navigate(-1)} className="w-[44px] h-[44px] flex items-center justify-center text-[#111] text-[20px]">←</button>
        <Link to="/" className="flex items-center gap-1.5">
          <span className="font-[900] text-[15px] tracking-tight text-[#111]">AdGate</span>
        </Link>
        <Link to="/" className="text-[14px] font-[700] text-[#E8312A] hover:underline">Sign in</Link>
      </nav>

      {/* Step indicator */}
      <div className="pt-10 pb-4 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#B45309]" />
          <div className="w-2 h-2 rounded-full bg-[#B45309]" />
          <div className="w-2 h-2 rounded-full bg-[#E8E8E8]" />
        </div>
        <span className="text-[11px] font-[700] text-[#888]">Step 2 of 3</span>
      </div>

      {/* Headline */}
      <div className="px-4 flex flex-col items-center mt-4">
        <h1 className="text-[22px] font-[900] text-[#111] text-center max-w-[300px]" style={{ lineHeight: '1.25' }}>
          Who would you like to be paired with?
        </h1>
        <p className="text-[14px] font-[600] text-[#888] text-center max-w-[300px] mt-2" style={{ lineHeight: '1.6' }}>
          We match you with a recent member who shares your preference.
        </p>
      </div>

      {/* Gender cards */}
      <div className="w-full px-4 mt-8 flex flex-col gap-3">
        {cards.map(card => {
          const isSelected = selected === card.id;
          return (
            <button
              key={card.id}
              onClick={() => setSelected(card.id)}
              className="w-full rounded-[14px] p-5 flex items-center gap-4 transition-all"
              style={{
                backgroundColor: 'white',
                border: isSelected ? '1.5px solid #B45309' : '1.5px solid #E8E8E8',
                boxShadow: isSelected ? '0 0 0 3px rgba(180,83,9,0.12)' : 'none',
                opacity: selected && !isSelected ? 0.6 : 1,
              }}
            >
              <div className="w-[44px] h-[44px] rounded-[10px] flex items-center justify-center text-[20px] shrink-0" style={{ backgroundColor: card.bg }}>
                {card.emoji}
              </div>
              <div className="flex-1 text-left">
                <span className="text-[16px] font-[900] text-[#111] block">{card.title}</span>
                <span className="text-[12px] font-[600] text-[#888] block">{card.subtitle}</span>
              </div>
              <div
                className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                style={{
                  border: isSelected ? 'none' : '2px solid #E8E8E8',
                  backgroundColor: isSelected ? '#B45309' : 'transparent',
                }}
              >
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 6L5 8L9 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Availability indicator */}
      <div className="w-full px-4 mt-6">
        <div className="w-full rounded-[10px] p-3 flex items-center gap-3" style={{ backgroundColor: '#FAFAFA' }}>
          <div className="relative shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <div
              className="absolute inset-0 w-2 h-2 rounded-full bg-[#22C55E]"
              style={{ animation: 'accPulse 2s infinite' }}
            />
          </div>
          <span className="text-[13px] font-[600] text-[#555]">{waitingCount} people waiting to be matched right now</span>
        </div>
        <p className="text-[11px] text-[#AAAAAA] text-center mt-3">
          You will be matched based on the most recently available member.
        </p>
      </div>

      {/* Next button */}
      <div className="w-full px-4 mt-8 pb-8">
        <button
          onClick={handleNext}
          disabled={!selected}
          className="w-full h-[54px] rounded-[14px] text-white text-[16px] font-[900] flex items-center justify-center transition-all"
          style={{
            backgroundColor: '#B45309',
            opacity: selected ? 1 : 0.4,
            pointerEvents: selected ? 'auto' : 'none',
          }}
        >
          Find My Match →
        </button>
      </div>

      <style>{`
        @keyframes accPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
