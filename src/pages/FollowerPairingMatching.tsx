import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFollowerPairingMatching } from '../hooks/useFollowerPairingMatching';
import { useAuth } from '../context/AuthContext';

export const FollowerPairingMatching = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, currentUser } = useAuth();
  const [gender, setGender] = useState('any');
  const [commitment, setCommitment] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);

  // Load stored session data
  useEffect(() => {
    if (!slug) return;
    const storedGender = sessionStorage.getItem(`adgate_acc_${slug}_gender`);
    const storedCommitment = sessionStorage.getItem(`adgate_acc_${slug}_commitment`);
    if (!storedGender || !storedCommitment) {
      navigate(`/r/${slug}`, { replace: true });
      return;
    }
    setGender(storedGender);
    setCommitment(storedCommitment);
  }, [slug, navigate]);

  // Auth guard — user must be logged in to be on this page
  useEffect(() => {
    if (!isLoggedIn) {
      // Redirect back to gender selection page where auth will be prompted
      navigate(`/r/${slug}/match`, { replace: true });
    }
  }, [isLoggedIn, slug, navigate]);

  const {
    matchingState,
    matchedParticipant,
    sessionId,
    participantId,
    linkData,
    handleRematch,
  } = useFollowerPairingMatching(slug || '', gender);

  // Status text rotation during searching
  const statusTexts = [
    `Looking for a ${gender === 'any' ? '' : gender + ' '}participant...`,
    'Checking availability...',
    'Almost there...',
  ];

  useEffect(() => {
    if (matchingState !== 'searching') return;
    const int = setInterval(() => {
      setStatusIdx(prev => Math.min(prev + 1, 2));
    }, 2000);
    return () => clearInterval(int);
  }, [matchingState]);

  // Handle match expiry
  useEffect(() => {
    if (matchingState === 'expired') {
      navigate(`/r/${slug}/match`, { replace: true });
    }
  }, [matchingState, navigate, slug]);

  // Handle Accept: navigate to chat
  const handleAccept = () => {
    if (!sessionId || !slug) return;
    setIsAccepting(true);
    sessionStorage.setItem(`adgate_acc_${slug}_session`, sessionId);
    if (participantId) {
      sessionStorage.setItem(`adgate_acc_${slug}_participant`, participantId);
    }
    navigate(`/chats/${sessionId}`);
  };

  // Handle Rematch
  const onRematch = async () => {
    setStatusIdx(0);
    await handleRematch();
  };

  const durationDays = linkData?.pairing_config?.duration_days || 14;

  // Get trust score label
  const getTrustLabel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: '#16A34A' };
    if (score >= 80) return { label: 'Great', color: '#2563EB' };
    if (score >= 60) return { label: 'Good', color: '#D97757' };
    return { label: 'New', color: '#6B6860' };
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center" style={{ fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif' }}>
      {/* Nav */}
      <nav className="w-full h-[58px] bg-surface flex items-center justify-between px-4 shrink-0" style={{ borderBottom: '1px solid #E6E2D9' }}>
        <button onClick={() => navigate(-1)} className="w-[44px] h-[44px] flex items-center justify-center text-text text-[20px]">←</button>
        <Link to="/" className="flex items-center gap-1.5">
          <span className="font-[900] text-[15px] tracking-tight text-text">AdGate</span>
        </Link>
        <div className="w-[44px]" />
      </nav>

      {/* Step indicator */}
      <div className="pt-10 pb-4 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-brand" />
          <div className="w-2 h-2 rounded-full bg-brand" />
          <div className="w-2 h-2 rounded-full" style={{
            backgroundColor: matchingState === 'found' ? '#D97757' : '#E6E2D9',
            transition: 'background-color 2s ease',
          }} />
        </div>
        <span className="text-[11px] font-[700] text-textMid">Step 3 of 3</span>
      </div>

      {/* State A — Searching */}
      {(matchingState === 'searching' || matchingState === 'releasing') && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="flex items-center gap-4 mb-6">
            {/* Current user circle */}
            <div className="w-[56px] h-[56px] rounded-full bg-brand flex items-center justify-center">
              <span className="text-[22px] font-[900] text-white">{currentUser?.initial || commitment[0]?.toUpperCase() || 'Y'}</span>
            </div>

            {/* Connecting dots */}
            <div className="flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-border"
                  style={{
                    animation: `dotPulse 1.2s ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>

            {/* Mystery circle */}
            <div className="w-[56px] h-[56px] rounded-full bg-border flex items-center justify-center">
              <span className="text-[22px] font-[900] text-white">?</span>
            </div>
          </div>

          <p className="text-[16px] font-[700] text-textMid text-center">
            {matchingState === 'releasing' ? 'Finding a new partner...' : 'Matching...'}
          </p>
          <p className="text-[13px] font-[600] text-textLight text-center mt-2 h-[20px] transition-opacity">
            {matchingState === 'releasing' ? 'Looking for other available members...' : statusTexts[statusIdx]}
          </p>
        </div>
      )}

      {/* State B — Match Found */}
      {matchingState === 'found' && matchedParticipant && (
        <div className="flex-1 flex flex-col items-center px-4 py-8 max-w-[500px] w-full" style={{ animation: 'fadeIn 0.4s ease' }}>
          {/* Avatar pair */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-[56px] h-[56px] rounded-full bg-brand flex items-center justify-center"
              style={{ boxShadow: '0 0 0 4px rgba(65,122,85,0.3)' }}
            >
              <span className="text-[22px] font-[900] text-white">{currentUser?.initial || commitment[0]?.toUpperCase() || 'Y'}</span>
            </div>

            <span className="text-[24px]" style={{ animation: 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>🤝</span>

            <div
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center"
              style={{
                backgroundColor: matchedParticipant.color,
                boxShadow: '0 0 0 4px rgba(65,122,85,0.3)',
                animation: 'scaleReveal 0.3s ease-out',
              }}
            >
              <span className="text-[22px] font-[900] text-white">{matchedParticipant.initial}</span>
            </div>
          </div>

          <h2 className="text-[22px] font-[900] text-text text-center">Match Found! 🎉</h2>

          {/* Match card */}
          <div
            className="w-full mt-6 bg-surface rounded-[16px] p-6 flex flex-col items-center"
            style={{
              border: '1px solid #E6E2D9',
              animation: 'slideUp 0.5s ease-out 0.4s both',
            }}
          >
            <span className="text-[11px] font-[800] text-textMid uppercase text-center">Your accountability partner</span>

            <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center mt-4" style={{ backgroundColor: matchedParticipant.color }}>
              <span className="text-[20px] font-[900] text-white">{matchedParticipant.initial}</span>
            </div>

            <h3 className="text-[18px] font-[900] text-text text-center mt-3">{matchedParticipant.displayName}</h3>

            {/* Trust Score */}
            {matchedParticipant.trustScore !== undefined && (
              <div className="flex items-center gap-2 mt-2">
                <div className="h-[24px] px-[10px] rounded-[20px] flex items-center gap-1" style={{ backgroundColor: 'rgba(37,99,235,0.1)' }}>
                  <span className="text-[11px] font-[900]" style={{ color: getTrustLabel(matchedParticipant.trustScore).color }}>
                    ⭐ {matchedParticipant.trustScore} · {getTrustLabel(matchedParticipant.trustScore).label}
                  </span>
                </div>
              </div>
            )}

            {/* Partner's commitment */}
            {matchedParticipant.commitmentStatement && (
              <>
                <div className="w-full h-[1px] bg-border my-4" />
                <span className="text-[10px] font-[800] text-textMid uppercase">Their commitment:</span>
                <p className="text-[13px] font-[600] text-textMid text-center mt-2 italic" style={{ lineHeight: '1.65' }}>
                  "{matchedParticipant.commitmentStatement}"
                </p>
              </>
            )}

            <div className="w-full h-[1px] bg-border my-4" />

            <span className="text-[13px] font-[700] text-textMid text-center">🤝 {durationDays} days together</span>
          </div>

          {/* Accept / Rematch buttons */}
          <div
            className="w-full flex flex-col gap-[10px] mt-6"
            style={{ animation: 'slideUp 0.5s ease-out 0.6s both' }}
          >
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full h-[52px] rounded-[14px] text-white text-[15px] font-[900] flex items-center justify-center transition-all"
              style={{ backgroundColor: '#D97757' }}
            >
              {isAccepting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                  <span>Setting up chat...</span>
                </div>
              ) : (
                'Accept Match & Start Chatting →'
              )}
            </button>
            <button
              onClick={onRematch}
              disabled={isAccepting}
              className="w-full h-[52px] rounded-[14px] text-text text-[15px] font-[800] flex items-center justify-center transition-all"
              style={{ border: '1px solid #E6E2D9', backgroundColor: 'white', opacity: isAccepting ? 0.5 : 1 }}
            >
              🔄 Find Another Partner
            </button>
          </div>

          {/* Info note */}
          <p className="text-[11px] text-textLight text-center mt-4 max-w-[300px]" style={{ lineHeight: '1.6' }}>
            Once you accept, you'll be able to message each other. You can access your chats anytime from the Chats section.
          </p>
        </div>
      )}

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleReveal {
          0% { transform: scale(0.6); }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes slideUp {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
