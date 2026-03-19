import { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Share2, ArrowDownRight, Download, TrendingUp, Eye, Unlock, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { socialIcons } from '../../assets/socialIcons';
import { useToast } from '../../context/ToastContext';
import {
  getEmailLinkAnalytics,
  getSponsorAnalytics,
  getSocialAnalytics,
  getPairingAnalytics,
  getGenericLinkAnalytics,
} from '../../services/analyticsService';
import { getSubscriberList, exportSubscribersCSV } from '../../services/emailSubscribeService';
import type { DashboardLink } from './tabs/LinksTab';

interface AnalyticsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  link: DashboardLink;
}

// ── Mini sparkline bar chart ──────────────────────────────────────────────────
const SparkChart = ({ data, color = '#D97757' }: { data: Record<string, number>; color?: string }) => {
  const days = 14;
  const bars: { date: string; val: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().substring(0, 10);
    bars.push({ date: key, val: data[key] || 0 });
  }

  const max = Math.max(...bars.map(b => b.val), 1);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-[3px] h-[48px]">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-500"
            style={{
              height: `${Math.max(4, (b.val / max) * 100)}%`,
              backgroundColor: b.val > 0 ? color : '#E6E2D9',
              opacity: b.val > 0 ? (0.4 + 0.6 * (b.val / max)) : 0.4,
            }}
            title={`${b.date}: ${b.val}`}
          />
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-[10px] font-semibold text-textLight">14 days ago</span>
        <span className="text-[10px] font-semibold text-textLight">Today</span>
      </div>
    </div>
  );
};

// ── Stat pill ──────────────────────────────────────────────────────────────────
const StatPill = ({
  label, value, sub, icon: Icon, color = '#21201C', bg = '#F3F1EC',
}: {
  label: string; value: string | number; sub?: string;
  icon?: React.FC<any>; color?: string; bg?: string;
}) => (
  <div className="rounded-[14px] border border-border p-4 flex flex-col gap-1" style={{ backgroundColor: bg }}>
    <div className="flex items-center gap-1.5">
      {Icon && <Icon size={12} style={{ color }} />}
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#6B6860' }}>{label}</span>
    </div>
    <span className="text-[26px] font-black leading-none" style={{ color }}>{value}</span>
    {sub && <span className="text-[11px] font-semibold text-textLight">{sub}</span>}
  </div>
);

// ── Conversion bar ─────────────────────────────────────────────────────────────
const ConversionBar = ({ rate, label = 'Conversion rate' }: { rate: string; label?: string }) => {
  const pct = parseFloat(rate);
  const good = pct >= 30;
  return (
    <div className="flex flex-col gap-2 p-4 rounded-[14px] border border-border bg-white">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-textMid">{label}</span>
        <span className="text-[18px] font-black" style={{ color: good ? '#417A55' : '#A0622A' }}>{rate}%</span>
      </div>
      <div className="w-full h-[8px] bg-surfaceAlt rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: good ? '#417A55' : '#D97757' }}
        />
      </div>
      <span className="text-[11px] font-semibold text-textLight">
        {good ? '✓ Great conversion rate' : 'Consider improving your hook to boost conversions'}
      </span>
    </div>
  );
};

// ── Section header ─────────────────────────────────────────────────────────────
const SectionHeader = ({ emoji, title }: { emoji: string; title: string }) => (
  <h3 className="text-[15px] font-black text-text flex items-center gap-2 mb-3">
    <span>{emoji}</span> {title}
  </h3>
);

// ══════════════════════════════════════════════════════════════════════════════
//   MAIN ANALTYICS SHEET
// ══════════════════════════════════════════════════════════════════════════════

export const AnalyticsSheet = ({ isOpen, onClose, link }: AnalyticsSheetProps) => {
  const unlockType = link.unlockType;
  const mode       = (link as any)._raw?.mode || link.mode;

  const isPairing  = mode === 'follower_pairing';
  const isSocial   = unlockType === 'social_follow';
  const isEmail    = unlockType === 'email_subscribe';
  const isSponsor  = unlockType === 'custom_sponsor';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Analytics">
      <div className="flex flex-col gap-6 pb-6 pt-2 px-1">
        {isPairing && <PairingAnalytics link={link} />}
        {isSocial  && <SocialAnalytics  link={link} />}
        {isEmail   && <EmailAnalytics   link={link} />}
        {isSponsor && <SponsorAnalytics link={link} />}
        {!isPairing && !isSocial && !isEmail && !isSponsor && (
          <GenericAnalytics link={link} />
        )}
      </div>
    </BottomSheet>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//   EMAIL ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

const EmailAnalytics = ({ link }: { link: DashboardLink }) => {
  const [data, setData]             = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getEmailLinkAnalytics(link.id),
      getSubscriberList(link.id, { pageSize: 30 }),
    ]).then(([analytics, sub]) => {
      setData(analytics);
      setSubscribers(sub.subscribers);
    }).catch(console.error).finally(() => setLoading(false));
  }, [link.id]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportSubscribersCSV(link.id, link.title);
      showToast({ message: `Exported ${data?.totalSubscribers} subscribers`, type: 'success' });
    } catch (err: any) {
      showToast({ message: err.message, type: 'error' });
    } finally { setExporting(false); }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StatPill label="Total Views" value={(data?.totalViews || 0).toLocaleString()} icon={Eye} bg="#F3F1EC" />
        <StatPill label="Subscribers" value={(data?.totalSubscribers || 0).toLocaleString()} icon={Users} color="#417A55" bg="#EBF5EE" />
        <StatPill label="This Week" value={`+${data?.thisWeekSubscribers || 0}`} icon={TrendingUp} color="#D97757" bg="#FAF0EB" />
        <StatPill label="Conversion" value={`${data?.conversionRate || '0.0'}%`} icon={Unlock} color={parseFloat(data?.conversionRate || '0') >= 30 ? '#417A55' : '#A0622A'} bg={parseFloat(data?.conversionRate || '0') >= 30 ? '#EBF5EE' : '#FDF4EC'} />
      </div>

      {/* Conversion bar */}
      <ConversionBar rate={data?.conversionRate || '0.0'} label="Views → Subscribers" />

      {/* Spark chart */}
      <div className="flex flex-col gap-2">
        <SectionHeader emoji="📈" title="Daily Subscribers (30 days)" />
        <SparkChart data={data?.dailyChart || {}} color="#417A55" />
      </div>

      {/* Subscriber list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionHeader emoji="📧" title="Recent Subscribers" />
          <button
            onClick={handleExport}
            disabled={exporting || (data?.totalSubscribers || 0) === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-border bg-white text-[12px] font-bold text-text hover:bg-surfaceAlt disabled:opacity-50 transition-colors"
          >
            <Download size={13} />
            {exporting ? 'Exporting…' : 'CSV'}
          </button>
        </div>
        {subscribers.length === 0 ? (
          <EmptyState message="No subscribers yet — share your link to start growing your list." />
        ) : (
          <div className="flex flex-col">
            {subscribers.map((sub: any, i) => (
              <div key={sub.id} className={`flex items-center justify-between px-3 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-text">{sub.email}</span>
                  <span className="text-[11px] font-semibold text-textLight mt-0.5">
                    {new Date(sub.subscribed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {sub.content_accessed && (
                  <span className="text-[10px] font-bold text-success bg-successBg px-2 py-1 rounded-full uppercase tracking-wide">
                    Unlocked
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//   SOCIAL FOLLOW ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

const SocialAnalytics = ({ link }: { link: DashboardLink }) => {
  const [data, setData]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const targets = (link.socialConfig?.followTargets as any[] | undefined) || [];

  useEffect(() => {
    getSocialAnalytics(link.id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [link.id]);

  if (loading) return <LoadingSkeleton />;

  const views   = data?.totalViews   || 0;
  const unlocks = data?.totalUnlocks || 0;

  // Build a per-target funnel: distribute drop-off evenly across steps
  const buildFunnel = () => {
    if (!targets.length) return [];
    let current = views;
    const dropPerStep = targets.length > 0 ? (views - unlocks) / targets.length : 0;
    return targets.map((t: any, i: number) => {
      const reached = Math.round(current);
      const completed = i === targets.length - 1 ? unlocks : Math.max(unlocks, Math.round(current - dropPerStep));
      const rate = reached > 0 ? Math.round((completed / reached) * 100) : 0;
      current = completed;
      return { ...t, reached, completed, rate };
    });
  };

  const funnel = buildFunnel();

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatPill label="Total Views" value={views.toLocaleString()} icon={Eye} bg="#F3F1EC" />
        <StatPill label="Completions" value={unlocks.toLocaleString()} icon={Unlock} color="#417A55" bg="#EBF5EE" />
        <StatPill label="This Week" value={`+${data?.thisWeekViews || 0}`} icon={TrendingUp} color="#D97757" bg="#FAF0EB" />
        <StatPill label="Conversion" value={`${data?.conversionRate || '0.0'}%`} icon={Share2} color={parseFloat(data?.conversionRate || '0') >= 30 ? '#417A55' : '#A0622A'} bg={parseFloat(data?.conversionRate || '0') >= 30 ? '#EBF5EE' : '#FDF4EC'} />
      </div>

      <ConversionBar rate={data?.conversionRate || '0.0'} label="Views → Completions" />

      {/* Daily chart */}
      <div className="flex flex-col gap-2">
        <SectionHeader emoji="📈" title="Daily Views (14 days)" />
        <SparkChart data={data?.dailyChart || {}} color="#6366F1" />
      </div>

      {/* Per-target funnel */}
      {funnel.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionHeader emoji="🎯" title="Step Completion Funnel" />
          <div className="flex flex-col gap-3">
            {funnel.map((t: any, idx: number) => (
              <div key={t.id || idx} className="bg-white rounded-[14px] border border-border p-4 flex flex-col gap-3 relative">
                {idx < funnel.length - 1 && (
                  <div className="absolute left-7 bottom-[-14px] w-[2px] h-[14px] bg-border z-10" />
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surfaceAlt flex items-center justify-center border border-border/60 overflow-hidden p-1.5 shrink-0">
                      {t.type === 'custom'
                        ? <span className="text-[16px]">{t.customIcon || '🔗'}</span>
                        : <img src={socialIcons[t.platform as keyof typeof socialIcons]} className="w-full h-full object-contain" alt="" />
                      }
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-text leading-tight">
                        {t.type === 'custom' ? t.customLabel : t.instructionText || `Follow on ${t.platform}`}
                      </div>
                      <div className="text-[11px] font-semibold text-textMid">
                        {t.type === 'custom' ? t.customUrl : t.handle}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-black text-text">{t.completed.toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-textLight uppercase tracking-wider">completed</div>
                  </div>
                </div>
                {/* Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-textMid">{t.reached.toLocaleString()} reached</span>
                    <span className={t.rate >= 50 ? 'text-success' : 'text-warning'}>{t.rate}%</span>
                  </div>
                  <div className="w-full h-[6px] bg-surfaceAlt rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${t.rate}%`, backgroundColor: t.rate >= 50 ? '#417A55' : '#D97757' }}
                    />
                  </div>
                </div>
                {t.rate < 50 && t.reached > 3 && (
                  <div className="bg-warningBg border border-warning/20 rounded-[8px] p-2 flex items-start gap-1.5">
                    <ArrowDownRight size={13} className="text-warning mt-0.5 shrink-0" />
                    <span className="text-[11px] font-semibold text-warning leading-snug">
                      High drop-off here — consider simplifying the instruction.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//   SPONSOR ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

const SponsorAnalytics = ({ link }: { link: DashboardLink }) => {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSponsorAnalytics(link.id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [link.id]);

  if (loading) return <LoadingSkeleton />;

  const sponsorConfig = (link as any)._raw?.sponsor_config;
  const hasVideo      = !!sponsorConfig?.video_file;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatPill label="Total Views" value={(data?.totalViews || 0).toLocaleString()} icon={Eye} bg="#F3F1EC" />
        <StatPill label="Ad Completions" value={(data?.totalUnlocks || 0).toLocaleString()} icon={CheckCircle2} color="#417A55" bg="#EBF5EE" />
        <StatPill label="This Week" value={`+${data?.thisWeekViews || 0}`} icon={TrendingUp} color="#D97757" bg="#FAF0EB" />
        <StatPill label="Completion Rate" value={`${data?.conversionRate || '0.0'}%`} icon={Unlock} color={parseFloat(data?.conversionRate || '0') >= 40 ? '#417A55' : '#A0622A'} bg={parseFloat(data?.conversionRate || '0') >= 40 ? '#EBF5EE' : '#FDF4EC'} />
      </div>

      <ConversionBar rate={data?.conversionRate || '0.0'} label="Views → Ad Completions" />

      {/* Spark chart */}
      <div className="flex flex-col gap-2">
        <SectionHeader emoji="📈" title="Daily Views (14 days)" />
        <SparkChart data={data?.dailyChart || {}} color="#8B5CF6" />
      </div>

      {/* Ad details */}
      {sponsorConfig && (
        <div className="flex flex-col gap-3">
          <SectionHeader emoji="📢" title="Ad Details" />
          <div className="bg-white rounded-[14px] border border-border p-4 flex flex-col gap-3">

            {/* Brand */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-textMid uppercase tracking-wide mb-0.5">Brand</div>
                <div className="text-[15px] font-black text-text">{sponsorConfig.brand_name}</div>
              </div>
              {sponsorConfig.requires_click ? (
                <span className="text-[10px] font-bold text-success bg-successBg px-2 py-1 rounded-full uppercase tracking-wide">Click required</span>
              ) : (
                <span className="text-[10px] font-bold text-textMid bg-surfaceAlt px-2 py-1 rounded-full uppercase tracking-wide">View-only</span>
              )}
            </div>

            {/* Skip + CTA */}
            <div className="flex gap-3">
              <div className="flex-1 bg-surfaceAlt rounded-[10px] p-3">
                <div className="text-[10px] font-bold text-textMid uppercase tracking-wide mb-1">Skip After</div>
                <div className="text-[16px] font-black text-text">{sponsorConfig.skip_after_seconds}s</div>
              </div>
              <div className="flex-1 bg-surfaceAlt rounded-[10px] p-3">
                <div className="text-[10px] font-bold text-textMid uppercase tracking-wide mb-1">CTA Label</div>
                <div className="text-[14px] font-bold text-text truncate">{sponsorConfig.cta_button_label || 'Visit Sponsor'}</div>
              </div>
            </div>

            {/* Video */}
            {hasVideo && (
              <div className="flex items-center gap-2 bg-surfaceAlt rounded-[10px] p-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <span className="text-[14px]">🎬</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-textMid">Ad Video</span>
                  <span className="text-[12px] font-bold text-text truncate">{sponsorConfig.video_file?.original_name || 'Video uploaded'}</span>
                </div>
                <span className="text-[10px] font-bold text-success bg-successBg px-2 py-1 rounded-full ml-auto">Active</span>
              </div>
            )}

            {/* Website */}
            {sponsorConfig.brand_website && (
              <a
                href={sponsorConfig.brand_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-bold text-brand hover:underline flex items-center gap-1"
              >
                🔗 {sponsorConfig.brand_website}
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//   ACCOUNTABILITY / PAIRING ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

const PairingAnalytics = ({ link }: { link: DashboardLink }) => {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPairingAnalytics(link.id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [link.id]);

  if (loading) return <LoadingSkeleton />;

  const pc     = data?.pairingConfig;
  const msgs   = data?.scheduledMessages || [];
  const pool   = data?.waitingPool || { male: 0, female: 0, any: 0 };
  const views  = link.views || 0;
  const matched = (pc?.active_pairs || 0) + (pc?.completed_pairs || 0);

  return (
    <>
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatPill label="Total Views" value={views.toLocaleString()} icon={Eye} bg="#F3F1EC" />
        <StatPill label="Participants" value={(pc?.total_participants || 0).toLocaleString()} icon={Users} color="#6366F1" bg="#EEF2FF" />
        <StatPill label="Active Pairs" value={(pc?.active_pairs || 0).toLocaleString()} icon={CheckCircle2} color="#417A55" bg="#EBF5EE" />
        <StatPill label="Completed" value={(pc?.completed_pairs || 0).toLocaleString()} icon={TrendingUp} color="#D97757" bg="#FAF0EB" />
      </div>

      {/* Funnel */}
      {views > 0 && (
        <div className="flex flex-col gap-3">
          <SectionHeader emoji="📊" title="Participation Funnel" />
          <div className="flex flex-col gap-0">
            {[
              { label: 'Landing views',      val: views,                  color: '#21201C' },
              { label: 'Joined campaign',    val: pc?.total_participants || 0, color: '#6366F1' },
              { label: 'Matched with pair',  val: matched,                color: '#2563EB' },
              { label: 'Completed challenge', val: pc?.completed_pairs || 0, color: '#417A55' },
            ].map((step, idx, arr) => {
              const pct     = views > 0 ? Math.round((step.val / views) * 100) : 0;
              const dropOff = idx > 0 ? arr[idx - 1].val - step.val : 0;
              const dropPct = idx > 0 && arr[idx - 1].val > 0
                ? Math.round((dropOff / arr[idx - 1].val) * 100) : 0;
              return (
                <div key={idx} className="relative">
                  <div
                    className="flex items-center justify-between py-3 px-3 rounded-[10px] mb-0.5"
                    style={{ borderLeft: `3px solid ${step.color}`, background: '#FAFAF9' }}
                  >
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-text">{step.label}</span>
                      {idx > 0 && dropPct > 10 && (
                        <span className="text-[11px] font-semibold text-error flex items-center gap-1 mt-0.5">
                          <ArrowDownRight size={10} /> -{dropOff} ({dropPct}% drop)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[16px] font-black text-text">{step.val.toLocaleString()}</span>
                      <span className="text-[12px] font-bold text-textLight">{pct}%</span>
                    </div>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="w-[1px] h-2 bg-border ml-5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spark chart */}
      <div className="flex flex-col gap-2">
        <SectionHeader emoji="📈" title="Daily Views (14 days)" />
        <SparkChart data={data?.dailyChart || {}} color="#6366F1" />
      </div>

      {/* Waiting pool */}
      <div className="flex flex-col gap-3">
        <SectionHeader emoji="⏳" title="Waiting for Match" />
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: 'male',   label: 'Male',   emoji: '👨', bg: '#EFF6FF', color: '#1D4ED8' },
            { k: 'female', label: 'Female', emoji: '👩', bg: '#FDF2F8', color: '#9D174D' },
            { k: 'any',    label: 'Any',    emoji: '🤝', bg: '#FFFBEB', color: '#92400E' },
          ].map(g => (
            <div key={g.k} className="rounded-[12px] p-3 flex flex-col items-center border border-border" style={{ background: g.bg }}>
              <span className="text-[20px] mb-1">{g.emoji}</span>
              <span className="text-[20px] font-black leading-none mb-0.5" style={{ color: g.color }}>
                {(pool as any)[g.k] || 0}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: g.color }}>{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled messages */}
      {msgs.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionHeader emoji="📅" title="Scheduled Messages" />
          <div className="flex flex-col gap-2">
            {msgs.map((msg: any) => (
              <div
                key={msg.id}
                className="flex items-center justify-between px-3 py-3 rounded-[10px] border border-border bg-white"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col items-center shrink-0 w-8">
                    <span className="text-[12px] font-black text-brand">D{msg.day_number}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-text truncate">{msg.content}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {msg.delivered_count > 0 && (
                    <span className="text-[10px] font-bold text-textMid">{msg.delivered_count}×</span>
                  )}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${msg.is_sent ? 'bg-successBg text-success' : 'bg-warningBg text-warning'}`}>
                    {msg.is_sent ? '✓ Sent' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[11px] font-semibold text-textMid text-center">
            {msgs.filter((m: any) => m.is_sent).length} of {msgs.length} messages delivered
          </div>
        </div>
      )}

      {/* Campaign status */}
      <div className="flex items-center justify-between p-4 rounded-[14px] border border-border bg-white">
        <div className="flex items-center gap-2">
          {pc?.is_accepting ? (
            <CheckCircle2 size={16} className="text-success" />
          ) : (
            <AlertCircle size={16} className="text-warning" />
          )}
          <span className="text-[13px] font-bold text-text">
            {pc?.is_accepting ? 'Accepting new joiners' : 'Campaign is closed'}
          </span>
        </div>
        <span className="text-[12px] font-bold text-textMid">
          {pc?.duration_days}d campaign
        </span>
      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//   GENERIC ANALYTICS (fallback)
// ══════════════════════════════════════════════════════════════════════════════

const GenericAnalytics = ({ link }: { link: DashboardLink }) => {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGenericLinkAnalytics(link.id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [link.id]);

  if (loading) return <LoadingSkeleton />;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatPill label="Total Views"  value={(data?.totalViews  || 0).toLocaleString()} icon={Eye}    bg="#F3F1EC" />
        <StatPill label="Completions"  value={(data?.totalUnlocks || 0).toLocaleString()} icon={Unlock} color="#417A55" bg="#EBF5EE" />
        <StatPill label="This Week"    value={`+${data?.thisWeekViews || 0}`} icon={TrendingUp} color="#D97757" bg="#FAF0EB" />
        <StatPill label="Conversion"   value={`${data?.conversionRate || '0.0'}%`} icon={Clock} color="#6B6860" bg="#F3F1EC" />
      </div>
      <ConversionBar rate={data?.conversionRate || '0.0'} />
      <div className="flex flex-col gap-2">
        <SectionHeader emoji="📈" title="Daily Views (14 days)" />
        <SparkChart data={data?.dailyChart || {}} color="#D97757" />
      </div>
    </>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="flex flex-col gap-4 animate-pulse">
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-[72px] bg-surfaceAlt rounded-[14px]" />
      ))}
    </div>
    <div className="h-[72px] bg-surfaceAlt rounded-[14px]" />
    <div className="h-[80px] bg-surfaceAlt rounded-[14px]" />
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center p-6 bg-surfaceAlt rounded-[14px] border border-border border-dashed">
    <span className="text-[13px] font-semibold text-textMid">{message}</span>
  </div>
);
