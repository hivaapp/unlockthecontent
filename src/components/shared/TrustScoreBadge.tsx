/**
 * TrustScoreBadge — Displays a user's trust score as a colored badge.
 *
 * Sizes:
 *   sm  — compact dot + number (inline, for lists / message headers)
 *   md  — number + label pill (for cards, profile headers)
 *   lg  — large number, label, and progress bar (for account page)
 */

interface TrustScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

interface BandInfo {
  label: string;
  color: string;
  bg: string;
  dotColor: string;
}

const getBand = (score: number): BandInfo => {
  if (score >= 90) return { label: 'Excellent', color: '#417A55', bg: '#EBF5EE', dotColor: '#417A55' };
  if (score >= 75) return { label: 'Good',      color: '#2563EB', bg: '#EFF6FF', dotColor: '#2563EB' };
  if (score >= 55) return { label: 'Fair',       color: '#A0622A', bg: '#FDF4EC', dotColor: '#D97706' };
  if (score >= 35) return { label: 'Poor',       color: '#C4663F', bg: '#FAF0EB', dotColor: '#D97757' };
  return                   { label: 'Very Poor',  color: '#C0392B', bg: '#FDECEA', dotColor: '#C0392B' };
};

export const TrustScoreBadge = ({ score, size = 'md' }: TrustScoreBadgeProps) => {
  const band = getBand(score);

  // ── sm: compact inline badge ──
  if (size === 'sm') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          borderRadius: '6px',
          backgroundColor: band.bg,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: band.dotColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: band.color,
            lineHeight: 1,
          }}
        >
          {score}
        </span>
      </span>
    );
  }

  // ── md: pill with number + label ──
  if (size === 'md') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '8px',
          backgroundColor: band.bg,
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: band.dotColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: band.color,
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: band.color,
            opacity: 0.8,
            lineHeight: 1,
          }}
        >
          {band.label}
        </span>
      </span>
    );
  }

  // ── lg: full display with progress bar ──
  const progressPct = Math.min(100, Math.max(0, score));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
      }}
    >
      {/* Score + Label row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            fontSize: '28px',
            fontWeight: 900,
            color: band.color,
            lineHeight: 1,
            letterSpacing: '-0.5px',
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: band.color,
            opacity: 0.85,
          }}
        >
          {band.label}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          backgroundColor: '#E6E2D9',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            borderRadius: '3px',
            backgroundColor: band.dotColor,
            transition: 'width 0.6s ease-out',
          }}
        />
      </div>

      {/* Scale labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#AAA49C' }}>0</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#AAA49C' }}>100</span>
      </div>
    </div>
  );
};

export { getBand };
export default TrustScoreBadge;
