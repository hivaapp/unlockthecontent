import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockLinks } from '../lib/mockData';
import { useFollowerPairingMatching } from '../hooks/useFollowerPairingMatching';
import { AuthBottomSheet } from '../components/AuthBottomSheet';
import { useAuth } from '../context/AuthContext';

export const FollowerPairingMatching = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [gender, setGender] = useState('any');
  const [commitment, setCommitment] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [authScreen, setAuthScreen] = useState<'signin' | 'signup'>('signin');
  const [statusIdx, setStatusIdx] = useState(0);

  const link = mockLinks.find(l => l.slug === slug && l.unlockType === 'follower_pairing');

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

  const { matchingState, matchedParticipant, matchHoldTimer, formatHoldTimer } = useFollowerPairingMatching(slug || '', gender);

  // Status text rotation during searching
  const statusTexts = [
    `Looking for a ${gender === 'any' ? '' : gender + ' '}participant...`,
    'Checking availability...',
    'Found a match...',
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

  // Handle auth success
  const handleAuthSuccess = () => {
    setShowSignIn(false);
    // Store session info and redirect to chat
    if (slug) {
      sessionStorage.setItem(`adgate_acc_${slug}_session`, 'session_mock_001');
      sessionStorage.setItem(`adgate_acc_${slug}_participant`, 'participant_current');
    }
    navigate('/accountability/chat/session_mock_001');
  };

  useEffect(() => {
    if (isLoggedIn && matchingState === 'found') {
      if (slug) {
        sessionStorage.setItem(`adgate_acc_${slug}_session`, 'session_mock_001');
        sessionStorage.setItem(`adgate_acc_${slug}_participant`, 'participant_current');
      }
      navigate('/accountability/chat/session_mock_001');
    }
  }, [isLoggedIn, matchingState, slug, navigate]);

  if (!link) return null;

  const durationDays = link.followerPairingConfig?.durationDays || 14;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Nav */}
      <nav className="w-full h-[58px] bg-white flex items-center justify-between px-4 shrink-0" style={{ borderBottom: '1px solid #F0F0F0' }}>
        <button onClick={() => navigate(-1)} className="w-[44px] h-[44px] flex items-center justify-center text-[#111] text-[20px]">←</button>
        <Link to="/" className="flex items-center gap-1.5">
          <span className="font-[900] text-[15px] tracking-tight text-[#111]">AdGate</span>
        </Link>
        <div className="w-[44px]" />
      </nav>

      {/* Step indicator */}
      <div className="pt-10 pb-4 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#B45309]" />
          <div className="w-2 h-2 rounded-full bg-[#B45309]" />
          <div className="w-2 h-2 rounded-full" style={{
            backgroundColor: matchingState === 'found' ? '#B45309' : '#E8E8E8',
            transition: 'background-color 2s ease',
          }} />
        </div>
        <span className="text-[11px] font-[700] text-[#888]">Step 3 of 3</span>
      </div>

      {/* State A — Searching */}
      {matchingState === 'searching' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="flex items-center gap-4 mb-6">
            {/* Current user circle */}
            <div className="w-[56px] h-[56px] rounded-full bg-[#B45309] flex items-center justify-center">
              <span className="text-[22px] font-[900] text-white">{commitment[0]?.toUpperCase() || 'Y'}</span>
            </div>

            {/* Connecting dots */}
            <div className="flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#DDD]"
                  style={{
                    animation: `dotPulse 1.2s ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>

            {/* Mystery circle */}
            <div className="w-[56px] h-[56px] rounded-full bg-[#DDDDDD] flex items-center justify-center">
              <span className="text-[22px] font-[900] text-white">?</span>
            </div>
          </div>

          <p className="text-[16px] font-[700] text-[#888] text-center">Matching...</p>
          <p className="text-[13px] font-[600] text-[#BBB] text-center mt-2 h-[20px] transition-opacity">{statusTexts[statusIdx]}</p>
        </div>
      )}

      {/* State B — Match Found */}
      {matchingState === 'found' && matchedParticipant && (
        <div className="flex-1 flex flex-col items-center px-4 py-8" style={{ animation: 'fadeIn 0.4s ease' }}>
          {/* Avatar pair */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-[56px] h-[56px] rounded-full bg-[#B45309] flex items-center justify-center"
              style={{ boxShadow: '0 0 0 4px rgba(34,197,94,0.4)' }}
            >
              <span className="text-[22px] font-[900] text-white">{commitment[0]?.toUpperCase() || 'Y'}</span>
            </div>

            <span className="text-[24px]" style={{ animation: 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>🤝</span>

            <div
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center"
              style={{
                backgroundColor: matchedParticipant.color,
                boxShadow: '0 0 0 4px rgba(34,197,94,0.4)',
                animation: 'scaleReveal 0.3s ease-out',
              }}
            >
              <span className="text-[22px] font-[900] text-white">{matchedParticipant.initial}</span>
            </div>
          </div>

          <h2 className="text-[22px] font-[900] text-[#111] text-center">Match Found! 🎉</h2>

          {/* Match card */}
          <div
            className="w-full mt-6 bg-white rounded-[16px] p-6 flex flex-col items-center"
            style={{
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              animation: 'slideUp 0.5s ease-out 0.4s both',
            }}
          >
            <span className="text-[11px] font-[800] text-[#888] uppercase text-center">Your accountability partner</span>

            <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center mt-4" style={{ backgroundColor: matchedParticipant.color }}>
              <span className="text-[20px] font-[900] text-white">{matchedParticipant.initial}</span>
            </div>

            <h3 className="text-[18px] font-[900] text-[#111] text-center mt-3">{matchedParticipant.displayName}</h3>

            <div className="w-full h-[1px] bg-[#F0F0F0] my-4" />

            <span className="text-[10px] font-[800] text-[#888] uppercase">Their commitment:</span>
            <p className="text-[13px] font-[600] text-[#444] text-center mt-2 italic" style={{ lineHeight: '1.65' }}>
              {matchedParticipant.commitmentStatement}
            </p>

            <div className="w-full h-[1px] bg-[#F0F0F0] my-4" />

            <span className="text-[13px] font-[700] text-[#555] text-center">🤝 {durationDays} days together</span>
            <span className="text-[11px] text-[#AAA] text-center mt-1">Starting when you sign in</span>
          </div>

          {/* Auth prompt card */}
          <div
            className="w-full mt-3 bg-white rounded-[16px] p-5 flex flex-col items-center"
            style={{
              border: '1.5px solid #E8E8E8',
              animation: 'slideUp 0.5s ease-out 0.6s both',
            }}
          >
            <span className="text-[32px] mb-3">🔒</span>
            <h3 className="text-[17px] font-[900] text-[#111] text-center">Sign in to start chatting</h3>
            <p className="text-[13px] font-[600] text-[#666] text-center mt-2 max-w-[280px]" style={{ lineHeight: '1.65' }}>
              Your match is ready. Create an account or sign in to access your private chat.
            </p>

            <div className="w-full flex flex-col gap-[10px] mt-5">
              <button
                onClick={() => { setAuthScreen('signup'); setShowSignIn(true); }}
                className="w-full h-[52px] rounded-[14px] text-white text-[15px] font-[900] flex items-center justify-center"
                style={{ backgroundColor: '#E8312A' }}
              >
                Create Account →
              </button>
              <button
                onClick={() => { setAuthScreen('signin'); setShowSignIn(true); }}
                className="w-full h-[52px] rounded-[14px] text-[#333] text-[15px] font-[800] flex items-center justify-center"
                style={{ border: '1.5px solid #333', backgroundColor: 'white' }}
              >
                Sign In
              </button>
            </div>

            <div className="flex items-center gap-1.5 mt-4">
              <span className="text-[11px] text-[#AAAAAA]">Your match is held for 10 minutes while you sign in.</span>
              <span className="text-[11px] font-[800] text-[#B45309]">{formatHoldTimer(matchHoldTimer)}</span>
            </div>
          </div>
        </div>
      )}

      <AuthBottomSheet 
        isOpen={showSignIn} 
        onClose={() => setShowSignIn(false)} 
        onSuccess={handleAuthSuccess}
        defaultScreen={authScreen}
      />

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
      `}</style>
    </div>
  );
};
