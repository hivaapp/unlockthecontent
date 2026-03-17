import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvatarColor } from '../../lib/utils';
import { getWaitingCount } from '../../services/followerPairingService';

interface FollowerPairingUnlockProps {
  link: any;
  slug?: string;
  currentUser?: any;
  isLoggedIn?: boolean;
  sessionKey?: string;
  onUnlockSuccess?: () => void;
  onComplete?: () => void;
}

export const FollowerPairingUnlock = ({ link, slug }: FollowerPairingUnlockProps) => {
  const navigate = useNavigate();
  const [commitment, setCommitment] = useState('');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);

  const config = link?.pairing_config;
  const creator = link?.creator;

  // Restore commitment from sessionStorage
  useEffect(() => {
    if (slug) {
      const stored = sessionStorage.getItem(`adgate_acc_${slug}_commitment`);
      if (stored) setCommitment(stored);
    }
  }, [slug]);

  // Fetch waiting count
  useEffect(() => {
    if (link?.id) {
      getWaitingCount(link.id).then(setWaitingCount).catch(() => {});
    }
  }, [link?.id]);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-[36px] mb-4">🤝</div>
        <p className="text-[14px] font-[600] text-textMid">Loading challenge details...</p>
      </div>
    );
  }

  const creatorName = creator?.name || 'Creator';
  const creatorHandle = creator?.username || '';
  const creatorBio = creator?.bio || '';
  const creatorVerified = creator?.is_verified || false;
  const avatarColor = creator?.avatar_color || getAvatarColor(creatorHandle);
  const creatorInitial = creator?.initial || creatorName[0];

  const canContinue = commitment.trim().length >= 20;

  const handleContinue = () => {
    if (!canContinue || !slug) return;
    sessionStorage.setItem(`adgate_acc_${slug}_commitment`, commitment);
    navigate(`/r/${slug}/match`);
  };

  const freqLabel = config.check_in_frequency === 'daily'
    ? 'Daily'
    : config.check_in_frequency === 'every_other_day'
      ? 'Every 2 days'
      : 'Weekly';

  return (
    <div className="flex flex-col w-full">
      {/* Creator Identity */}
      <div className="flex flex-col items-center pt-4 pb-3">
        <div className="relative mb-2">
          <div
            className="w-[56px] h-[56px] rounded-full flex items-center justify-center"
            style={{ backgroundColor: avatarColor }}
          >
            <span className="text-[22px] font-[900] text-white">{creatorInitial}</span>
          </div>
          {creatorVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] rounded-full bg-brand flex items-center justify-center">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}
        </div>

        <h2 className="text-[17px] font-[900] text-text text-center">{creatorName}</h2>
        <p className="text-[12px] font-[600] text-textMid text-center">@{creatorHandle}</p>

        {creatorBio && (
          <p
            className="text-[12px] font-[600] text-textMid text-center mt-1.5 max-w-[260px]"
            style={{
              lineHeight: '1.6',
              display: '-webkit-box',
              WebkitLineClamp: bioExpanded ? 999 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {creatorBio}
          </p>
        )}
        {!bioExpanded && creatorBio.length > 80 && (
          <button onClick={() => setBioExpanded(true)} className="text-[11px] font-[600] text-textMid mt-0.5 hover:underline">more</button>
        )}
      </div>

      {/* Campaign header strip */}
      <div className="w-full min-h-[44px] flex items-center justify-center px-3 py-2 rounded-t-[12px]" style={{ background: '#92400E' }}>
        <span className="text-[13px] font-[800] text-white text-center leading-snug">🤝 {config.topic}</span>
      </div>

      {/* Campaign details */}
      <div className="p-4 flex flex-col" style={{ borderLeft: '1px solid #E6E2D9', borderRight: '1px solid #E6E2D9', borderBottom: '1px solid #E6E2D9', borderRadius: '0 0 12px 12px' }}>
        <p className="text-[13px] font-[600] text-textMid" style={{ lineHeight: '1.7' }}>{config.description}</p>

        <div className="flex items-center gap-0 mt-3">
          <span className="text-[12px] font-[700] text-text">⏱️ {config.duration_days} days</span>
          <span className="mx-2 text-border">·</span>
          <span className="text-[12px] font-[700] text-text">Check in {freqLabel.toLowerCase()}</span>
        </div>

        {/* Commitment prompt */}
        <div className="mt-3 rounded-[10px] p-3" style={{ backgroundColor: '#FFFBEB' }}>
          <span className="text-[10px] font-[800] text-textMid uppercase" style={{ letterSpacing: '0.5px' }}>Your commitment:</span>
          <p className="text-[13px] font-[700] text-text mt-1" style={{ lineHeight: '1.5' }}>{config.commitment_prompt}</p>
        </div>

        {/* Textarea */}
        <div className="mt-3 relative">
          <textarea
            className="w-full h-[84px] rounded-[10px] p-3 text-[13px] font-[600] resize-none"
            style={{
              border: '1.5px solid #E6E2D9',
              outline: 'none',
            }}
            placeholder="Write your honest commitment here..."
            maxLength={300}
            value={commitment}
            onChange={(e) => setCommitment(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = '#D97757';
              e.target.style.boxShadow = '0 0 0 3px rgba(217,119,87,0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E6E2D9';
              e.target.style.boxShadow = 'none';
            }}
          />
          <span className="text-[10px] text-textLight text-right block mt-0.5">{commitment.length}/300</span>
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-3 gap-0 text-center" style={{ borderTop: '1px solid #E6E2D9', paddingTop: '12px' }}>
          <div className="flex flex-col items-center" style={{ borderRight: '1px solid #E6E2D9' }}>
            <span className="text-[16px] font-[900] text-text">{config.total_participants}</span>
            <span className="text-[10px] text-textMid">Total joined</span>
          </div>
          <div className="flex flex-col items-center" style={{ borderRight: '1px solid #E6E2D9' }}>
            <span className="text-[16px] font-[900] text-text">{config.active_pairs}</span>
            <span className="text-[10px] text-textMid">Active pairs</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[16px] font-[900] text-text">{config.duration_days} days</span>
            <span className="text-[10px] text-textMid">Duration</span>
          </div>
        </div>

        {/* Creator resource link */}
        {config.creator_resource_url && config.creator_resource_label && (
          <a
            href={config.creator_resource_url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 rounded-[8px] p-2.5 block"
            style={{ backgroundColor: '#EBF5EE' }}
          >
            <span className="text-[10px] font-[800] text-success uppercase block">📖 Recommended by {creatorName}:</span>
            <span className="text-[12px] font-[700] text-success mt-0.5 flex items-center gap-1">{config.creator_resource_label} →</span>
          </a>
        )}

        {/* Waiting indicator */}
        {waitingCount > 0 && (
          <div className="mt-3 rounded-[8px] p-2.5 flex items-center gap-2" style={{ backgroundColor: '#FAF9F7' }}>
            <div className="relative shrink-0">
              <div className="w-2 h-2 rounded-full bg-success" />
              <div
                className="absolute inset-0 w-2 h-2 rounded-full bg-success"
                style={{ animation: 'accPulse 2s infinite' }}
              />
            </div>
            <span className="text-[12px] font-[600] text-textMid">{waitingCount} {waitingCount === 1 ? 'person' : 'people'} waiting to be matched</span>
          </div>
        )}
      </div>

      {/* Continue button */}
      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full h-[44px] rounded-[10px] text-white text-[14px] font-[900] flex items-center justify-center mt-4 transition-all"
        style={{
          backgroundColor: '#D97757',
          opacity: canContinue ? 1 : 0.4,
          pointerEvents: canContinue ? 'auto' : 'none',
        }}
      >
        Continue →
      </button>
      <p className="text-[11px] text-textLight text-center mt-2">Next: choose your matching preference.</p>

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
