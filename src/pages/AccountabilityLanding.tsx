import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockLinks } from '../lib/mockData';
import { getAvatarColor } from '../lib/utils';

export const AccountabilityLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [commitment, setCommitment] = useState('');
  const [bioExpanded, setBioExpanded] = useState(false);

  // Find the accountability link
  const link = mockLinks.find(l => l.slug === slug && l.unlockType === 'accountability');
  const config = link?.accountabilityConfig;

  // Restore commitment from sessionStorage
  useEffect(() => {
    if (slug) {
      const stored = sessionStorage.getItem(`adgate_acc_${slug}_commitment`);
      if (stored) setCommitment(stored);
    }
  }, [slug]);

  if (!link || !config) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="text-[48px] mb-4">🔗</div>
        <h1 className="text-[22px] font-[900] text-[#111] mb-2">This challenge doesn't exist</h1>
        <p className="text-[14px] font-[700] text-[#888] mb-8 max-w-[360px]">The creator may have removed this accountability challenge.</p>
        <Link to="/" className="px-6 h-[44px] bg-[#E8312A] text-white font-[900] text-[14px] rounded-[14px] flex items-center justify-center">Go Home</Link>
      </div>
    );
  }

  const creatorName = 'Alex Creator';
  const creatorHandle = 'alexcreator';
  const creatorBio = 'Creating tools and resources for designers and developers.';
  const creatorVerified = true;
  const avatarColor = getAvatarColor(creatorHandle);
  const creatorInitial = creatorName[0];

  const canContinue = commitment.trim().length >= 20;

  const handleContinue = () => {
    if (!canContinue || !slug) return;
    sessionStorage.setItem(`adgate_acc_${slug}_commitment`, commitment);
    navigate(`/r/${slug}/match`);
  };

  const freqLabel = config.checkInFrequency === 'daily' ? 'Daily' : config.checkInFrequency === 'every_other_day' ? 'Every 2 days' : 'Weekly';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Nav */}
      <nav className="w-full h-[58px] bg-white flex items-center justify-between px-4 shrink-0" style={{ borderBottom: '1px solid #F0F0F0' }}>
        <Link to="/" className="flex items-center gap-1.5">
          <span className="font-[900] text-[15px] tracking-tight text-[#111]">AdGate</span>
        </Link>
        <Link to="/" className="text-[14px] font-[700] text-[#E8312A] hover:underline">Sign in</Link>
      </nav>

      {/* Creator Identity */}
      <div className="w-full bg-white pt-8 pb-6 px-4 flex flex-col items-center">
        <div className="relative mb-3">
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
            style={{ backgroundColor: avatarColor }}
          >
            <span className="text-[28px] font-[900] text-white">{creatorInitial}</span>
          </div>
          {creatorVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-[#E8312A] flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}
        </div>

        <h2 className="text-[20px] font-[900] text-[#111] text-center">{creatorName}</h2>
        <p className="text-[13px] font-[600] text-[#888] text-center">@{creatorHandle}</p>

        {creatorBio && (
          <p
            className="text-[13px] font-[600] text-[#666] text-center mt-2 max-w-[280px]"
            style={{
              lineHeight: '1.65',
              display: '-webkit-box',
              WebkitLineClamp: bioExpanded ? 999 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {creatorBio}
          </p>
        )}
        {!bioExpanded && creatorBio && creatorBio.length > 80 && (
          <button onClick={() => setBioExpanded(true)} className="text-[12px] font-[600] text-[#888] mt-1 hover:underline">more</button>
        )}

        <div className="w-full max-w-[280px] h-[1px] bg-[#F4F4F4] my-4" />
      </div>

      {/* Campaign Card */}
      <div className="w-full px-4 pb-6">
        <div className="w-full bg-white rounded-[16px] overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          {/* Amber strip */}
          <div className="w-full min-h-[52px] flex items-center justify-center px-4 py-3" style={{ background: 'linear-gradient(135deg, #92400E, #B45309)', borderRadius: '16px 16px 0 0' }}>
            <span className="text-[14px] font-[800] text-white text-center leading-snug">🤝 {config.topic}</span>
          </div>

          <div className="p-5 flex flex-col">
            {/* Description */}
            <p className="text-[14px] font-[600] text-[#444]" style={{ lineHeight: '1.75' }}>{config.description}</p>

            {/* Duration & frequency */}
            <div className="flex items-center gap-0 mt-4">
              <span className="text-[13px] font-[700] text-[#555]">⏱️ {config.durationDays} days</span>
              <span className="mx-3 text-[#CCCCCC]">·</span>
              <span className="text-[13px] font-[700] text-[#555]">Check in {freqLabel.toLowerCase()}</span>
            </div>

            {/* Commitment prompt */}
            <div className="mt-4 rounded-[12px] p-3.5" style={{ backgroundColor: '#FFFBEB' }}>
              <span className="text-[10px] font-[800] text-[#6B6860] uppercase" style={{ letterSpacing: '0.5px' }}>Your commitment:</span>
              <p className="text-[14px] font-[700] text-[#333] mt-1" style={{ lineHeight: '1.5' }}>{config.commitmentPrompt}</p>
            </div>

            {/* Textarea */}
            <div className="mt-4 relative">
              <textarea
                className="w-full h-[100px] rounded-[12px] p-3.5 text-[13px] font-[600] resize-none"
                style={{
                  border: '1.5px solid #E8E8E8',
                  outline: 'none',
                }}
                placeholder="Write your honest commitment here..."
                maxLength={300}
                value={commitment}
                onChange={(e) => setCommitment(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#B45309';
                  e.target.style.boxShadow = '0 0 0 3px rgba(180,83,9,0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E8E8E8';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <span className="text-[11px] text-[#AAA] text-right block mt-1">{commitment.length}/300</span>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-0 text-center" style={{ borderTop: '1px solid #F0F0F0', paddingTop: '16px' }}>
              <div className="flex flex-col items-center" style={{ borderRight: '1px solid #F0F0F0' }}>
                <span className="text-[18px] font-[900] text-[#111]">{config.totalParticipants}</span>
                <span className="text-[10px] text-[#6B6860]">Total joined</span>
              </div>
              <div className="flex flex-col items-center" style={{ borderRight: '1px solid #F0F0F0' }}>
                <span className="text-[18px] font-[900] text-[#111]">{config.activePairs}</span>
                <span className="text-[10px] text-[#6B6860]">Active pairs</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[18px] font-[900] text-[#111]">{config.durationDays} days</span>
                <span className="text-[10px] text-[#6B6860]">Duration</span>
              </div>
            </div>

            {/* Creator resource link */}
            {config.creatorResourceUrl && config.creatorResourceLabel && (
              <a
                href={config.creatorResourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 rounded-[10px] p-3 block"
                style={{ backgroundColor: '#EDFAF3' }}
              >
                <span className="text-[10px] font-[800] text-[#166534] uppercase block">📖 Recommended by {creatorName}:</span>
                <span className="text-[13px] font-[700] text-[#166534] mt-1 flex items-center gap-1">{config.creatorResourceLabel} →</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Continue button */}
      <div className="w-full px-4 pb-8">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full h-[54px] rounded-[14px] text-white text-[16px] font-[900] flex items-center justify-center transition-all"
          style={{
            backgroundColor: '#B45309',
            opacity: canContinue ? 1 : 0.4,
            pointerEvents: canContinue ? 'auto' : 'none',
          }}
        >
          Continue →
        </button>
        <p className="text-[11px] text-[#AAA] text-center mt-3">Next: choose your matching preference.</p>
      </div>
    </div>
  );
};
