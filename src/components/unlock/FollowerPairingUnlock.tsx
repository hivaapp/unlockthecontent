import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatorRow from '../shared/CreatorRow';
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
  const [waitingCount, setWaitingCount] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [guidelinesExpanded, setGuidelinesExpanded] = useState(false);
  const [pulseBtn, setPulseBtn] = useState(false);

  const config = link?.pairing_config;
  const creator = link?.creator;

  useEffect(() => {
    if (slug) {
      const isParticipant = sessionStorage.getItem(`adgate_acc_${slug}_participant`);
      if (isParticipant) {
        setHasJoined(true);
      }
      const storedCommitment = sessionStorage.getItem(`adgate_acc_${slug}_commitment`);
      if (storedCommitment) setCommitment(storedCommitment);
    }
    if (link?.id) {
      getWaitingCount(link.id).then(setWaitingCount).catch(() => {});
    }
  }, [slug, link?.id]);

  const canContinue = commitment.trim().length >= 20;

  useEffect(() => {
    if (canContinue) {
      setPulseBtn(true);
      const timer = setTimeout(() => setPulseBtn(false), 200);
      return () => clearTimeout(timer);
    }
  }, [canContinue]);

  if (!config || !creator) {
    return (
      <div className="w-full max-w-[560px] mx-auto px-[20px] pb-[100px] flex flex-col pt-6 md:grid md:grid-cols-[340px_1fr] md:gap-[32px] md:max-w-[900px] md:items-start">
         <div className="w-full h-[240px] rounded-[20px] bg-[#F3F1EC] animate-pulse mb-4 md:mb-0"></div>
         <div className="w-full max-w-[560px] h-[200px] rounded-[12px] bg-[#F3F1EC] animate-pulse flex items-center gap-3 px-4">
            <div className="w-[40px] h-[40px] rounded-full bg-[#E8E8E8] shrink-0"></div>
            <div className="flex flex-col gap-2 w-full">
              <div className="w-[120px] h-[12px] bg-[#E8E8E8] rounded-md"></div>
              <div className="w-[80px] h-[10px] bg-[#E8E8E8] rounded-md"></div>
            </div>
         </div>
      </div>
    );
  }

  const formatLargeNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  const isAccepting = config.is_accepting !== false;

  const handleContinue = () => {
    if (!canContinue || !slug || !isAccepting) return;
    setIsLeaving(true);
    setTimeout(() => {
      sessionStorage.setItem(`adgate_acc_${slug}_commitment`, commitment);
      navigate(`/r/${slug}/match`);
    }, 300);
  };

  const handleGoToChat = () => {
    setIsLeaving(true);
    setTimeout(() => {
      navigate(`/r/${slug}/chat`);
    }, 300);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommitment(e.target.value);
  };

  const freqLabel = config.check_in_frequency === 'daily'
    ? '📅 Check in daily'
    : config.check_in_frequency === 'every_other_day'
      ? '📅 Check in every 2 days'
      : '📅 Check in weekly';

  return (
    <div className={`w-full mx-auto px-[20px] pb-[100px] max-w-[560px] md:max-w-[900px] md:grid md:grid-cols-[340px_1fr] md:gap-[32px] md:items-start transition-all duration-300 ${isLeaving ? '-translate-x-full opacity-0' : ''}`}>

      {/* LEFT COLUMN / TOP ON MOBILE */}
      <div className="flex flex-col md:sticky md:top-[24px]">
        
        {/* DESKTOP CREATOR HEADER */}
        <div className="hidden md:flex flex-col items-center mb-6 text-center">
          <div 
             className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-3 shrink-0"
             style={{ backgroundColor: creator?.avatar_color || '#D97757' }}
          >
             <span className="text-[28px] font-[900] text-white">{creator?.initial || creator?.name?.[0] || '?'}</span>
          </div>
          <h2 className="text-[20px] font-[900] text-[#111] leading-tight flex items-center justify-center flex-wrap">
            {creator?.name}
            {creator?.is_verified && <span className="ml-1 text-[16px]">✓</span>}
          </h2>
          <p className="text-[14px] font-[600] text-[#888] mt-1">@{creator?.username}</p>
          {creator?.bio && (
             <p className="text-[14px] font-[600] text-[#555] mt-3 line-clamp-3 leading-relaxed">
               {creator.bio}
             </p>
          )}
        </div>

        {/* HERO CARD (Section 1) */}
        <div className="fp-animate-1 w-full rounded-[20px] p-5 mb-4 shadow-none" style={{
           background: 'linear-gradient(to bottom, #FEF3C7, #FFFBEB)',
           border: '2px solid #FDE68A'
        }}>
           <div className="flex justify-center mb-3">
             <span className="px-3 py-1 bg-[#FDE68A] text-[#B45309] text-[11px] font-bold uppercase tracking-wide rounded-full">
               🤝 Accountability Challenge
             </span>
           </div>
           
           <h1 className="text-[24px] font-[900] text-[#111] text-center mb-2 line-clamp-2 leading-tight">
             {config?.topic}
           </h1>
           
           <p className="text-[14px] font-[600] text-[#555] text-center line-clamp-3 mb-5" style={{ lineHeight: 1.65 }}>
             {config?.description}
           </p>
           
           <div className="flex w-full items-center justify-between border-t border-[#FDE68A] pt-4 pb-4">
             <div className="flex flex-col items-center flex-1 border-r border-[#FDE68A]">
               <span className="text-[20px] font-[900] text-[#B45309]">
                 {config?.total_participants === 0 ? 'Be the first!' : formatLargeNumber(config?.total_participants || 0)}
               </span>
               <span className="text-[11px] font-[700] uppercase text-[#888] mt-1">Participants</span>
             </div>
             
             <div className="flex flex-col items-center flex-1 border-r border-[#FDE68A]">
               <span className="text-[20px] font-[900] text-[#B45309]">
                 {config?.active_pairs === 0 ? 'Launching' : formatLargeNumber(config?.active_pairs || 0)}
               </span>
               <span className="text-[11px] font-[700] uppercase text-[#888] mt-1">Active Pairs</span>
             </div>
             
             <div className="flex flex-col items-center flex-1">
               <span className="text-[20px] font-[900] text-[#B45309]">
                 {config?.duration_days} days
               </span>
               <span className="text-[11px] font-[700] uppercase text-[#888] mt-1">Duration</span>
             </div>
           </div>

           <div className="flex justify-center mt-1">
             <span className="text-[12px] font-[600] text-[#888]">
               {freqLabel}
             </span>
           </div>
        </div>

        {/* CREATOR ROW (Section 2) - Hidden on Desktop */}
        <div className="fp-animate-2 md:hidden mt-[16px]">
          <CreatorRow creator={creator} />
        </div>

        {/* HOW IT WORKS (Section 3) - Stacked vertically on Desktop */}
        <div className="fp-animate-3 hidden md:flex flex-col mt-4 gap-4 px-2">
          <div className="flex items-center gap-4">
            <span className="text-[24px]">✍️</span>
            <div className="flex flex-col border-l-[2px] border-[#B45309] pl-3">
              <span className="text-[12px] font-[800] text-[#B45309] uppercase tracking-wide">Commit</span>
              <span className="text-[12px] font-[600] text-[#555]">Write your goal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[24px] grayscale opacity-70">🤝</span>
            <div className="flex flex-col border-l-[2px] border-[#E8E8E8] pl-3">
              <span className="text-[12px] font-[800] text-[#111] uppercase tracking-wide">Get Paired</span>
              <span className="text-[12px] font-[600] text-[#888]">Meet your partner</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[24px] grayscale opacity-70">🏆</span>
            <div className="flex flex-col border-l-[2px] border-[#E8E8E8] pl-3">
              <span className="text-[12px] font-[800] text-[#111] uppercase tracking-wide">Complete</span>
              <span className="text-[12px] font-[600] text-[#888]">Earn your reward</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex flex-col w-full md:pt-[24px]">

        {/* HOW IT WORKS (Section 3) - Horizontal strip on Mobile */}
        <div className="fp-animate-3 md:hidden flex items-start justify-between w-full mb-8 relative px-2 mt-2">
           {/* Connecting line */}
           <div className="absolute top-[12px] left-[15%] right-[15%] h-[1px] bg-[#E6E2D9] z-0">
              <div className="h-full bg-[#B45309] w-1/2"></div>
           </div>
           
           <div className="flex flex-col items-center z-10 w-1/3 px-1 text-center" style={{ background: '#FAF9F7' }}>
             <span className="text-[24px] mb-1 leading-none rounded-full bg-[#FAF9F7]">✍️</span>
             <span className="text-[12px] font-[800] text-[#B45309] mt-1">Commit</span>
             <span className="text-[11px] font-[600] text-[#888]">Write your goal</span>
           </div>
           <div className="flex flex-col items-center z-10 w-1/3 px-1 text-center grayscale opacity-80" style={{ background: '#FAF9F7' }}>
             <span className="text-[24px] mb-1 leading-none rounded-full bg-[#FAF9F7]">🤝</span>
             <span className="text-[12px] font-[800] text-[#111] mt-1">Get Paired</span>
             <span className="text-[11px] font-[600] text-[#888]">Meet your partner</span>
           </div>
           <div className="flex flex-col items-center z-10 w-1/3 px-1 text-center grayscale opacity-80" style={{ background: '#FAF9F7' }}>
             <span className="text-[24px] mb-1 leading-none rounded-full bg-[#FAF9F7]">🏆</span>
             <span className="text-[12px] font-[800] text-[#111] mt-1">Complete</span>
             <span className="text-[11px] font-[600] text-[#888]">Earn your reward</span>
           </div>
        </div>

        {/* Section header on desktop */}
        <h2 className="hidden md:block text-[22px] font-[900] text-[#111] mb-5 fp-animate-4">Join The Challenge</h2>

        {hasJoined ? (
          /* ALREADY JOINED STATE */
          <div className="fp-animate-4 w-full bg-white rounded-[16px] p-6 text-center" style={{ border: '1px solid #E6E2D9' }}>
            <div className="text-[32px] mb-3">🎉</div>
            <h3 className="text-[18px] font-[900] text-[#111] mb-2">You're already in!</h3>
            <p className="text-[14px] font-[600] text-[#555] mb-6">You have joined this challenge in your current session.</p>
            <button
              onClick={handleGoToChat}
              className="w-full h-[52px] rounded-[14px] text-white text-[15px] font-[900] flex items-center justify-center transition-all bg-[#000] hover:bg-[#222]"
            >
              Go to Your Chat →
            </button>
          </div>
        ) : (
          /* COMMITMENT FORM (Section 4) */
          <div className="fp-animate-4 flex flex-col w-full">
            {!isAccepting && (
              <div className="bg-[#FDF4EC] text-[#A0622A] p-4 rounded-[12px] mb-4 text-[14px] font-[600] text-center border border-[#FDE68A]">
                The creator has paused new entries for this challenge.
              </div>
            )}
            
            <div className="w-full bg-white rounded-[16px] p-[20px]" style={{ border: '1px solid #E6E2D9' }}>
               <div className="mb-4">
                 <h3 className="text-[11px] uppercase font-[800] text-[#B45309] border-l-[3px] border-[#B45309] pl-[10px] leading-tight mb-2">
                   YOUR COMMITMENT
                 </h3>
                 <p className="text-[15px] font-[700] text-[#111] leading-snug">
                   {config?.commitment_prompt || "What specific goal will you commit to for this challenge?"}
                 </p>
               </div>

               <div className="relative mb-3 flex flex-col">
                 <textarea
                   className="w-full min-h-[120px] rounded-[12px] p-[14px] text-[15px] font-[500] text-[#111] resize-y placeholder:text-[#AAA49C] focus:outline-none transition-colors"
                   style={{ border: '1.5px solid #E8E8E8' }}
                   placeholder="Write your honest commitment here..."
                   maxLength={300}
                   value={commitment}
                   onChange={handleTextareaChange}
                   onFocus={(e) => {
                     if (!isAccepting) return;
                     (e.target as HTMLTextAreaElement).style.borderColor = '#B45309';
                   }}
                   onBlur={(e) => {
                     if (!isAccepting) return;
                     (e.target as HTMLTextAreaElement).style.borderColor = '#E8E8E8';
                   }}
                   disabled={!isAccepting}
                 />
                 <span className={`text-[11px] font-[700] text-right mt-1.5 ${commitment.length >= 250 ? 'text-[#B45309]' : 'text-[#888]'}`}>
                   {commitment.length}/300
                 </span>
               </div>

               {/* Guidelines Section */}
               {config?.guidelines && (
                 <div className="mt-1 mb-4 rounded-[10px] overflow-hidden" style={{ border: '1px solid #E6E2D9' }}>
                   <button 
                     onClick={() => setGuidelinesExpanded(!guidelinesExpanded)}
                     className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-[#FAF9F7] transition-colors"
                   >
                     <span className="text-[13px] font-[700] text-[#111]">📋 Challenge Guidelines</span>
                     <span className="text-[12px] text-[#888]">{guidelinesExpanded ? '▲' : '▼'}</span>
                   </button>
                   {guidelinesExpanded && (
                     <div className="px-4 pb-4 pt-1 text-[13px] font-[500] text-[#555] leading-relaxed border-t border-[#E6E2D9]">
                       {config.guidelines}
                     </div>
                   )}
                 </div>
               )}

               {/* Creator Resource */}
               {config?.creator_resource_url && config?.creator_resource_label && (
                 <a
                   href={config.creator_resource_url}
                   target="_blank"
                   rel="noreferrer"
                   className="mt-1 mb-4 rounded-[10px] p-3 flex items-center justify-between transition-colors group"
                   style={{ backgroundColor: '#FAF9F7', border: '1px solid #E6E2D9' }}
                 >
                   <div className="flex flex-col">
                     <span className="text-[10px] font-[800] text-[#6B6860] uppercase tracking-wide mb-0.5">Creator Resource</span>
                     <span className="text-[13px] font-[700] text-[#111] flex items-center gap-1.5">
                       <span>🔗</span> {config.creator_resource_label}
                     </span>
                   </div>
                   <span className="text-[#888] group-hover:text-[#111] transition-colors">↗</span>
                 </a>
               )}

               {/* Continue Button */}
               {!isAccepting ? (
                 <button
                   disabled
                   className="w-full h-[52px] rounded-[14px] text-[#AAAAAA] bg-[#F0F0F0] text-[15px] font-[900] flex items-center justify-center gap-2 cursor-not-allowed mt-2"
                 >
                   <span>🔒</span> Campaign Closed
                 </button>
               ) : (
                 <button
                   onClick={handleContinue}
                   disabled={!canContinue}
                   className={`relative w-full h-[52px] rounded-[14px] flex items-center justify-center transition-all duration-300 transform outline-none outline-0 mt-2 ${
                     canContinue 
                       ? 'cursor-pointer active:scale-95' 
                       : 'cursor-not-allowed'
                   } ${pulseBtn ? 'animate-[pulseActive_200ms_ease-out]' : ''}`}
                   style={{
                     background: canContinue ? 'linear-gradient(to right, #B45309, #92400E)' : '#F0F0F0',
                     border: 'none',
                   }}
                 >
                   <span className={`text-[15px] font-[900] truncate px-3 leading-tight ${canContinue ? 'text-white' : 'text-[#AAAAAA]'}`}>
                     Continue → Next: Choose your matching preference
                   </span>
                 </button>
               )}
               
               <div className="mt-4 flex justify-center">
                 <p className="text-[11px] font-[600] text-[#888] flex items-center gap-1">
                   <span>🔒</span> Your commitment is only visible to your accountability partner
                 </p>
               </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fpFadeUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseActive {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .fp-animate-1 { animation: fpFadeUp 400ms ease-out 0ms both; }
        .fp-animate-2 { animation: fpFadeUp 400ms ease-out 100ms both; }
        .fp-animate-3 { animation: fpFadeUp 400ms ease-out 200ms both; }
        .fp-animate-4 { animation: fpFadeUp 400ms ease-out 300ms both; }
      `}} />
    </div>
  );
};
