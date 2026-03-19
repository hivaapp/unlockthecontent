import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLinkBySlug } from '../services/linksService';
import { getWaitingCount } from '../services/followerPairingService';
import { AuthBottomSheet } from '../components/AuthBottomSheet';
import { useAuth } from '../context/AuthContext';

type GenderOption = 'male' | 'female' | 'any';

export const FollowerPairingMatch = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [selected, setSelected] = useState<GenderOption | null>(null);
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [waitingCount, setWaitingCount] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [authScreen, setAuthScreen] = useState<'signin' | 'signup'>('signup');

  // Load link data
  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const data = await getLinkBySlug(slug);
        if (!data || data.mode !== 'follower_pairing') {
          navigate(`/r/${slug}`, { replace: true });
          return;
        }
        setLink(data);
        // Get waiting count
        const count = await getWaitingCount(data.id);
        setWaitingCount(count);
      } catch {
        navigate(`/r/${slug}`, { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, navigate]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-3 rounded-full" style={{ border: '3px solid #E6E2D9', borderTopColor: '#D97757', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!link) return null;

  const handleNext = () => {
    if (!selected || !slug) return;
    sessionStorage.setItem(`adgate_acc_${slug}_gender`, selected);

    // If already logged in, go straight to matching
    if (isLoggedIn) {
      navigate(`/r/${slug}/matching`);
      return;
    }

    // Otherwise, prompt to sign in / create account
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    // After successful auth, navigate to matching page
    // which will now handle everything since user is authenticated
    if (slug) {
      navigate(`/r/${slug}/matching`);
    }
  };

  const cards: { id: GenderOption; emoji: string; bg: string; title: string; subtitle: string }[] = [
    { id: 'male', emoji: '👨', bg: '#EFF6FF', title: 'Male', subtitle: 'Match with a male participant' },
    { id: 'female', emoji: '👩', bg: '#FDF2F8', title: 'Female', subtitle: 'Match with a female participant' },
    { id: 'any', emoji: '🤝', bg: '#FFFBEB', title: 'Anyone', subtitle: 'Match with whoever is available first' },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center" style={{ fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif' }}>
      {/* Nav */}
      <nav className="w-full h-[58px] bg-surface flex items-center justify-between px-4 shrink-0" style={{ borderBottom: '1px solid #E6E2D9' }}>
        <button onClick={() => navigate(-1)} className="w-[44px] h-[44px] flex items-center justify-center text-text text-[20px]">←</button>
        <Link to="/" className="flex items-center gap-1.5">
          <span className="font-[900] text-[15px] tracking-tight text-text">UnlockTheContent</span>
        </Link>
        {isLoggedIn ? (
          <div className="w-[44px]" />
        ) : (
          <button
            onClick={() => { setAuthScreen('signin'); setShowAuth(true); }}
            className="text-[14px] font-[700] text-brand hover:underline"
          >
            Sign in
          </button>
        )}
      </nav>

      {/* Step indicator */}
      <div className="pt-10 pb-4 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-brand" />
          <div className="w-2 h-2 rounded-full bg-brand" />
          <div className="w-2 h-2 rounded-full bg-border" />
        </div>
        <span className="text-[11px] font-[700] text-textMid">Step 2 of 3</span>
      </div>

      {/* Headline */}
      <div className="px-4 flex flex-col items-center mt-4">
        <h1 className="text-[22px] font-[900] text-text text-center max-w-[300px]" style={{ lineHeight: '1.25' }}>
          Who would you like to be paired with?
        </h1>
        <p className="text-[14px] font-[600] text-textMid text-center max-w-[300px] mt-2" style={{ lineHeight: '1.6' }}>
          We match you with a recent member who shares your preference.
        </p>
      </div>

      {/* Gender cards */}
      <div className="w-full px-4 mt-8 flex flex-col gap-3 max-w-[500px]">
        {cards.map(card => {
          const isSelected = selected === card.id;
          return (
            <button
              key={card.id}
              onClick={() => setSelected(card.id)}
              className="w-full rounded-[14px] p-5 flex items-center gap-4 transition-all"
              style={{
                backgroundColor: 'white',
                border: isSelected ? '1.5px solid #D97757' : '1.5px solid #E6E2D9',
                boxShadow: isSelected ? '0 0 0 3px rgba(217,119,87,0.12)' : 'none',
                opacity: selected && !isSelected ? 0.6 : 1,
              }}
            >
              <div className="w-[44px] h-[44px] rounded-[10px] flex items-center justify-center text-[20px] shrink-0" style={{ backgroundColor: card.bg }}>
                {card.emoji}
              </div>
              <div className="flex-1 text-left">
                <span className="text-[16px] font-[900] text-text block">{card.title}</span>
                <span className="text-[12px] font-[600] text-textMid block">{card.subtitle}</span>
              </div>
              <div
                className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                style={{
                  border: isSelected ? 'none' : '2px solid #E6E2D9',
                  backgroundColor: isSelected ? '#D97757' : 'transparent',
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
      {waitingCount > 0 && (
        <div className="w-full px-4 mt-6 max-w-[500px]">
          <div className="w-full rounded-[10px] p-3 flex items-center gap-3" style={{ backgroundColor: '#FAF9F7' }}>
            <div className="relative shrink-0">
              <div className="w-2 h-2 rounded-full bg-success" />
              <div
                className="absolute inset-0 w-2 h-2 rounded-full bg-success"
                style={{ animation: 'accPulse 2s infinite' }}
              />
            </div>
            <span className="text-[13px] font-[600] text-textMid">{waitingCount} {waitingCount === 1 ? 'person' : 'people'} waiting to be matched right now</span>
          </div>
          <p className="text-[11px] text-textLight text-center mt-3">
            You will be matched based on the most recently available member.
          </p>
        </div>
      )}

      {/* Next button */}
      <div className="w-full px-4 mt-8 pb-8 max-w-[500px]">
        <button
          onClick={handleNext}
          disabled={!selected}
          className="w-full h-[54px] rounded-[14px] text-white text-[16px] font-[900] flex items-center justify-center transition-all"
          style={{
            backgroundColor: '#D97757',
            opacity: selected ? 1 : 0.4,
            pointerEvents: selected ? 'auto' : 'none',
          }}
        >
          {isLoggedIn ? 'Find My Match →' : 'Continue →'}
        </button>
        {!isLoggedIn && selected && (
          <p className="text-[11px] text-textLight text-center mt-3">
            You'll need to sign in to get matched.
          </p>
        )}
      </div>

      {/* Auth Bottom Sheet */}
      <AuthBottomSheet
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
        defaultScreen={authScreen}
        contextualMessage="Sign in to get matched with an accountability partner and start your challenge."
      />

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
