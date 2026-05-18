import { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { getMicrocopy } from '@/lib/microcopy';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ApprovalCard from '@/components/approval/ApprovalCard';
import DenialReasonDrawer from '@/components/approval/DenialReasonDrawer';
import ApprovalDetailSheet from '@/components/approval/ApprovalDetailSheet';
import ApprovalFilters from '@/components/approval/ApprovalFilters';
import ClearBurst from '@/components/approval/ClearBurst';
import { Flame, Star, Trophy, Zap, Crown, ChefHat, Sparkles, AlertTriangle, Eye, CheckCircle2, Settings, FileText, ClipboardList } from 'lucide-react';
import confetti from 'canvas-confetti';

// ─── Gamification config ──────────────────────────────────────────────────────

const TYPE_POINTS = {
  prep: 10, temperature: 8, maintenance: 15,
  timeoff: 12, beo: 12, vendor: 8, waste: 12,
};

const RANKS = [
  { min: 0,   title: 'Prep Cook',        icon: ChefHat,  color: 'text-slate-400',  glow: 'rgba(148,163,184,0.3)' },
  { min: 50,  title: 'Line Cook',         icon: Flame,    color: 'text-amber-400',  glow: 'rgba(251,191,36,0.3)' },
  { min: 150, title: 'Sous Chef',         icon: Zap,      color: 'text-orange-400', glow: 'rgba(251,146,60,0.35)' },
  { min: 300, title: 'Chef de Cuisine',   icon: Star,     color: 'text-primary',    glow: 'rgba(230,106,31,0.4)' },
  { min: 500, title: 'Executive Chef',    icon: Crown,    color: 'text-yellow-400', glow: 'rgba(250,204,21,0.4)' },
];

const DAILY_GOAL = 10;

function getRank(score) {
  return [...RANKS].reverse().find(r => score >= r.min) || RANKS[0];
}

function getNextRank(score) {
  return RANKS.find(r => r.min > score) || null;
}

function getComboMultiplier(combo) {
  if (combo >= 10) return 3.0;
  if (combo >= 5)  return 2.0;
  if (combo >= 2)  return 1.5;
  return 1.0;
}

function getComboStyle(combo) {
  if (combo >= 10) return { label: 'LEGENDARY', color: 'text-yellow-300', border: 'border-yellow-400/40', bg: 'bg-yellow-400/10', glow: '0 0 24px rgba(250,204,21,0.3)' };
  if (combo >= 5)  return { label: 'ON FIRE',   color: 'text-orange-300', border: 'border-orange-400/40', bg: 'bg-orange-400/12', glow: '0 0 20px rgba(251,146,60,0.3)' };
  if (combo >= 2)  return { label: 'COMBO',     color: 'text-primary',    border: 'border-primary/40',    bg: 'bg-primary/10',    glow: '0 0 16px rgba(230,106,31,0.25)' };
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RankProgressBar({ score }) {
  const rank = getRank(score);
  const next = getNextRank(score);
  const pct = next
    ? Math.round(((score - rank.min) / (next.min - rank.min)) * 100)
    : 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className={cn('uppercase tracking-widest', rank.color)}>{rank.title}</span>
        {next ? (
          <span className="text-muted-foreground">{next.min - score} XP to {next.title}</span>
        ) : (
          <span className="text-yellow-400">MAX RANK</span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, hsl(22,76%,40%), hsl(22,76%,60%))`, boxShadow: `0 0 8px ${rank.glow}` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function DailyDots({ count, goal }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: goal }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.6, opacity: 0.3 }}
          animate={{ scale: i < count ? 1 : 0.7, opacity: i < count ? 1 : 0.25 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
          className={cn(
            'rounded-full transition-all',
            i < count
              ? i === count - 1 ? 'h-2.5 w-2.5 bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'h-2 w-2 bg-green-500/70'
              : 'h-1.5 w-1.5 bg-white/10'
          )}
        />
      ))}
    </div>
  );
}

function XpFloat({ amount, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -60, scale: 1.2 }}
      transition={{ duration: 0.75, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 text-xl font-black text-primary"
      style={{ textShadow: '0 0 12px rgba(230,106,31,0.8)' }}
    >
      +{amount} XP
    </motion.div>
  );
}

function ComboFlash({ combo }) {
  const style = getComboStyle(combo);
  if (!style) return null;

  return (
    <motion.div
      key={combo}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className={cn(
        'flex items-center justify-between rounded-2xl border px-4 py-2.5',
        style.border, style.bg
      )}
      style={{ boxShadow: style.glow }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className={cn('h-4 w-4', style.color)} />
        <span className={cn('text-sm font-black tracking-widest', style.color)}>{style.label}</span>
      </div>
      <span className={cn('text-2xl font-black tabular-nums', style.color)}>
        ×{getComboMultiplier(combo).toFixed(1)}
      </span>
    </motion.div>
  );
}

function ScoreCounter({ score }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={score}
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
        className="text-3xl font-black tabular-nums tracking-tight text-foreground"
        style={{ textShadow: score > 0 ? '0 0 20px rgba(230,106,31,0.4)' : 'none' }}
      >
        {String(score).padStart(4, '0')}
      </motion.span>
    </AnimatePresence>
  );
}

function PointBadge({ approval, combo }) {
  const base = TYPE_POINTS[approval?.approval_type] || 10;
  const mult = getComboMultiplier(combo);
  const total = Math.round(base * mult);
  const isUrgent = approval?.priority === 'high';

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black',
          isUrgent
            ? 'border border-amber-400/40 bg-amber-400/15 text-amber-300'
            : 'border border-primary/30 bg-primary/10 text-primary'
        )}
        style={{ boxShadow: isUrgent ? '0 0 10px rgba(251,191,36,0.2)' : '0 0 8px rgba(230,106,31,0.15)' }}
      >
        <Zap className="h-2.5 w-2.5" />
        {total} XP
        {mult > 1 && <span className="opacity-70">×{mult.toFixed(1)}</span>}
      </div>
      {isUrgent && (
        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-black text-red-400">
          URGENT
        </span>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ApprovalInbox() {
  const [approvals, setApprovals]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [processedToday, setProcessedToday] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [denialDrawer, setDenialDrawer] = useState(null);
  const [detailSheet, setDetailSheet]   = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [emptyApprovalsCopy] = useState(() => getMicrocopy('emptyApprovals', ''));

  // Gamification state
  const [score, setScore]   = useState(0);
  const [combo, setCombo]   = useState(0);
  const [xpFloats, setXpFloats] = useState([]);
  const [rankUp, setRankUp] = useState(null);
  const cardAreaRef = useRef(null);

  useEffect(() => { loadApprovals(); }, []);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const [prepItems, tempLogs, maintenanceReqs, timeOffReqs] = await Promise.all([
        base44.entities.PrepItem.filter({ status: 'pending_review' }).catch(() => []),
        base44.entities.TemperatureLog.filter({ requires_review: true }).catch(() => []),
        base44.entities.MaintenanceRequest.filter({ status: 'pending' }).catch(() => []),
        base44.entities.TimeOffRequest.filter({ status: 'pending' }).catch(() => []),
      ]);

      const all = [
        ...prepItems.map(p => ({ ...p, approval_type: 'prep',        sourceModule: 'PrepItem',           sourceId: p.id })),
        ...tempLogs.map(t  => ({ ...t, approval_type: 'temperature', sourceModule: 'TemperatureLog',     sourceId: t.id })),
        ...maintenanceReqs.map(m => ({ ...m, approval_type: 'maintenance', sourceModule: 'MaintenanceRequest', sourceId: m.id })),
        ...timeOffReqs.map(t => ({ ...t, approval_type: 'timeoff',   sourceModule: 'TimeOffRequest',     sourceId: t.id })),
      ];

      setApprovals(all);
      setCurrentIndex(0);
    } catch {
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const addXp = (approval, newCombo) => {
    const base = TYPE_POINTS[approval?.approval_type] || 10;
    const mult = getComboMultiplier(newCombo);
    const earned = Math.round(base * mult);

    const prevScore = score;
    const nextScore = prevScore + earned;
    const prevRank = getRank(prevScore);
    const nextRank = getRank(nextScore);

    setScore(nextScore);

    const id = Date.now() + Math.random();
    setXpFloats(prev => [...prev, { id, amount: earned }]);

    if (prevRank.title !== nextRank.title) {
      setRankUp(nextRank);
      setTimeout(() => setRankUp(null), 2200);
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.5 }, colors: ['#E66A1F', '#FB923C', '#FCD34D'] });
    }
  };

  const filteredApprovals = useMemo(() => {
    let result = [...approvals];
    if (filter !== 'all') {
      result = result.filter(a => a.approval_type === filter || (filter === 'urgent' && a.priority === 'high'));
    }
    return result;
  }, [approvals, filter]);

  const remaining = filteredApprovals.slice(currentIndex);
  const currentApproval = remaining[0];
  const isComplete = remaining.length === 0;
  const currentPosition = filteredApprovals.length === 0 ? 0 : currentIndex + 1;

  const handleApprove = async () => {
    if (!currentApproval) return;
    try {
      await base44.entities[currentApproval.sourceModule].update(currentApproval.sourceId, {
        approval_status: 'approved',
        approved_by: 'current_user',
        approved_at: new Date().toISOString(),
      });

      const newCombo = combo + 1;
      setCombo(newCombo);
      addXp(currentApproval, newCombo);
      setApprovals(a => a.filter(item => item.id !== currentApproval.id));
      setProcessedToday(p => p + 1);

      if (filteredApprovals.slice(currentIndex + 1).length === 0) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.55 }, colors: ['#22c55e', '#4ade80', '#86efac', '#E66A1F', '#FCD34D'] });
        setShowBurst(true);
        setTimeout(() => { setShowBurst(false); setShowCelebration(true); }, 1100);
      }
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleDeny = () => {
    setDenialDrawer({ approval: currentApproval });
  };

  const handleDenialSubmit = async (reason, notes) => {
    if (!currentApproval) return;
    try {
      await base44.entities[currentApproval.sourceModule].update(currentApproval.sourceId, {
        approval_status: 'denied',
        denied_by: 'current_user',
        denied_at: new Date().toISOString(),
        denial_reason: reason,
        denial_notes: notes,
      });

      setCombo(0);
      setApprovals(a => a.filter(item => item.id !== currentApproval.id));
      setProcessedToday(p => p + 1);
      setDenialDrawer(null);

      if (filteredApprovals.slice(currentIndex + 1).length === 0) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.55 }, colors: ['#22c55e', '#4ade80', '#86efac', '#E66A1F', '#FCD34D'] });
        setShowBurst(true);
        setTimeout(() => { setShowBurst(false); setShowCelebration(true); }, 1100);
      }
    } catch {
      toast.error('Failed to deny approval');
    }
  };

  const rank = getRank(score);
  const RankIcon = rank.icon;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-screen flex flex-col items-center justify-center gap-4 pb-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent"
          style={{ boxShadow: '0 0 24px rgba(230,106,31,0.4)' }}
        />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading queue…</p>
      </div>
    );
  }

  // ── Inbox zero celebration ──────────────────────────────────────────────────
  if (isComplete && showCelebration) {
    return (
      <GameOver
        score={score}
        rank={rank}
        processedToday={processedToday}
        onReset={() => { setCurrentIndex(0); setShowCelebration(false); setScore(0); setCombo(0); loadApprovals(); }}
      />
    );
  }

  // ── Main ────────────────────────────────────────────────────────────────────
  return (
    <div className="app-screen">

      <DesktopPageHeader title="Approvals" subtitle="Review submitted items, requests, and exceptions" />

      {/* ═══════════════════════ DESKTOP ════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col gap-5 pt-14 pb-10">

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'PENDING',      value: approvals.length,                                     Icon: ClipboardList, iconCls: 'text-muted-foreground', circleCls: 'bg-white/[0.05] border-border/30' },
            { label: 'URGENT',       value: approvals.filter(a => a.priority === 'high').length,  Icon: AlertTriangle,  iconCls: 'text-amber-400',        circleCls: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'NEEDS REVIEW', value: approvals.filter(a => a.requires_review).length,      Icon: Eye,            iconCls: 'text-muted-foreground', circleCls: 'bg-white/[0.05] border-border/30' },
          ].map(({ label, value, Icon, iconCls, circleCls }) => (
            <div key={label} className="rounded-2xl border border-border/30 p-5 flex items-center gap-4" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}>
              <div className={`h-12 w-12 rounded-full border flex items-center justify-center shrink-0 ${circleCls}`}>
                <Icon className={`h-5 w-5 ${iconCls}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="text-[30px] font-black text-foreground leading-tight tabular-nums">{value}</p>
              </div>
            </div>
          ))}
          {/* Status card */}
          <div className="rounded-2xl border border-border/30 p-5 flex items-center gap-4" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}>
            <div className="h-12 w-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">STATUS</p>
              <p className={`text-lg font-black leading-tight ${isComplete ? 'text-green-400' : 'text-foreground'}`}>
                {isComplete ? 'All Caught Up' : `${remaining.length} Pending`}
              </p>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <ApprovalFilters currentFilter={filter} onFilterChange={setFilter} />

        {/* 2-column: main content + sidebar */}
        <div className="flex gap-4 items-start">

          {/* Main content */}
          <div className="flex-1">
            {isComplete ? (
              <div className="rounded-2xl border border-border/30 flex flex-col items-center justify-center py-16 px-8 text-center" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}>
                <div className="h-20 w-20 rounded-full border-2 border-green-500/30 flex items-center justify-center mb-6" style={{ background: 'rgba(34,197,94,0.07)' }}>
                  <CheckCircle2 className="h-10 w-10 text-green-400" strokeWidth={1.5} />
                </div>
                <p className="text-[20px] font-black text-foreground mb-2">No approvals to review</p>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Completed checklists, prep photos, temp logs, schedule requests, and manager notes will appear here when they need review.
                </p>
                <div className="flex items-center gap-3 mt-8">
                  <button className="flex items-center gap-2 px-5 h-10 rounded-xl border border-border/40 bg-white/[0.04] text-sm font-semibold text-foreground hover:bg-white/[0.07] transition-all">
                    <FileText className="h-4 w-4" /> View Completed
                  </button>
                  <button className="flex items-center gap-2 px-5 h-10 rounded-xl border border-border/40 bg-white/[0.04] text-sm font-semibold text-foreground hover:bg-white/[0.07] transition-all">
                    <Settings className="h-4 w-4" /> Approval Settings
                  </button>
                </div>
              </div>
            ) : (
              <div ref={cardAreaRef} className="relative">
                <div className="mb-2 flex items-center justify-between px-1">
                  <PointBadge approval={currentApproval} combo={combo} />
                  <span className="text-[10px] font-bold text-muted-foreground">{currentPosition} of {filteredApprovals.length}</span>
                </div>
                <ApprovalCard
                  approval={currentApproval}
                  index={currentPosition}
                  total={filteredApprovals.length}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onViewDetails={() => setDetailSheet(currentApproval)}
                />
                <div className="pointer-events-none absolute inset-0">
                  <AnimatePresence>
                    {xpFloats.map(f => (
                      <XpFloat key={f.id} amount={f.amount} onDone={() => setXpFloats(prev => prev.filter(x => x.id !== f.id))} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Your Progress sidebar */}
          <div className="w-[360px] shrink-0">
            <div className="rounded-2xl border border-border/30 p-5" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-[15px] font-black text-foreground">Your Progress</p>
                <Trophy className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">RANK</p>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-12 w-12 rounded-full border border-border/40 bg-white/[0.05] flex items-center justify-center shrink-0"
                  style={{ boxShadow: score > 0 ? `0 0 14px ${rank.glow}` : 'none' }}
                >
                  <RankIcon className={cn('h-6 w-6', rank.color)} />
                </div>
                <p className={cn('text-[22px] font-black', rank.color)}>{rank.title}</p>
              </div>
              <div className="mb-5">
                <RankProgressBar score={score} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                DAILY GOAL {processedToday}/{DAILY_GOAL}
              </p>
              <DailyDots count={processedToday} goal={DAILY_GOAL} />
              <AnimatePresence>
                {combo >= 2 && (
                  <div className="mt-4">
                    <ComboFlash key={`combo-${combo}`} combo={combo} />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════ MOBILE ═════════════════════════════════════ */}
      <main className="app-page lg:hidden flex min-h-[calc(100vh-150px)] flex-col gap-4">

        {/* HUD */}
        <div
          className="rounded-2xl border border-border/40 p-4"
          style={{
            background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)',
            boxShadow: score > 0 ? `0 0 0 1px rgba(230,106,31,0.15), 0 4px 24px rgba(0,0,0,0.4)` : '0 1px 3px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50" style={{ background: 'rgba(0,0,0,0.3)', boxShadow: score > 0 ? `0 0 12px ${rank.glow}` : 'none' }}>
                <RankIcon className={cn('h-4 w-4', rank.color)} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Rank</p>
                <p className={cn('text-xs font-black leading-tight', rank.color)}>{rank.title}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Score</p>
              <ScoreCounter score={score} />
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Streak</p>
              <div className="flex items-center justify-end gap-1">
                <Flame className={cn('h-4 w-4 transition-colors', combo >= 2 ? 'text-orange-400' : 'text-muted-foreground/40')} style={combo >= 2 ? { filter: 'drop-shadow(0 0 4px rgba(251,146,60,0.6))' } : undefined} />
                <span className={cn('text-2xl font-black tabular-nums', combo >= 2 ? 'text-orange-400' : 'text-muted-foreground/50')}>{combo}</span>
              </div>
            </div>
          </div>
          <div className="mt-3"><RankProgressBar score={score} /></div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-3 w-3 text-muted-foreground/60" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Daily goal {processedToday}/{DAILY_GOAL}</span>
            </div>
            <DailyDots count={processedToday} goal={DAILY_GOAL} />
          </div>
        </div>

        <AnimatePresence>
          {combo >= 2 && <ComboFlash key={`combo-${combo}`} combo={combo} />}
        </AnimatePresence>

        <ApprovalFilters currentFilter={filter} onFilterChange={setFilter} />

        {remaining.length === 0 ? (
          <div className="app-card flex-1 py-12 text-center">
            <div className="status-marker status-marker-lg status-success mx-auto mb-4">0</div>
            <p className="text-sm font-semibold text-muted-foreground">No approvals to review</p>
            {emptyApprovalsCopy && <p className="text-xs text-muted-foreground/40 mt-1.5">{emptyApprovalsCopy}</p>}
          </div>
        ) : (
          <div ref={cardAreaRef} className="relative flex flex-1 flex-col">
            <div className="mb-2 flex items-center justify-between px-1">
              <PointBadge approval={currentApproval} combo={combo} />
              <span className="text-[10px] font-bold text-muted-foreground">{currentPosition} of {filteredApprovals.length}</span>
            </div>
            <ApprovalCard
              approval={currentApproval}
              index={currentPosition}
              total={filteredApprovals.length}
              onApprove={handleApprove}
              onDeny={handleDeny}
              onViewDetails={() => setDetailSheet(currentApproval)}
            />
            <div className="pointer-events-none absolute inset-0">
              <AnimatePresence>
                {xpFloats.map(f => (
                  <XpFloat key={f.id} amount={f.amount} onDone={() => setXpFloats(prev => prev.filter(x => x.id !== f.id))} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Rank-up flash */}
      <AnimatePresence>
        {rankUp && (
          <motion.div
            key="rankup"
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="fixed bottom-32 left-1/2 z-50 -translate-x-1/2"
          >
            <div
              className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-background px-5 py-3"
              style={{ boxShadow: '0 0 40px rgba(230,106,31,0.35), 0 8px 32px rgba(0,0,0,0.6)' }}
            >
              <rankUp.icon className={cn('h-6 w-6', rankUp.color)} style={{ filter: `drop-shadow(0 0 6px ${rankUp.glow})` }} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Rank Up!</p>
                <p className={cn('text-base font-black', rankUp.color)}>{rankUp.title}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {denialDrawer && (
        <DenialReasonDrawer
          approval={denialDrawer.approval}
          onSubmit={handleDenialSubmit}
          onClose={() => setDenialDrawer(null)}
        />
      )}

      {detailSheet && (
        <ApprovalDetailSheet
          approval={detailSheet}
          onApprove={handleApprove}
          onDeny={handleDeny}
          onClose={() => setDetailSheet(null)}
        />
      )}

      <AnimatePresence>
        {showBurst && <ClearBurst key="burst" />}
      </AnimatePresence>
    </div>
  );
}

// ─── Game over / inbox zero screen ────────────────────────────────────────────

function GameOver({ score, rank, processedToday, onReset }) {
  const RankIcon = rank.icon;

  useEffect(() => {
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0 }, colors: ['#E66A1F', '#FCD34D', '#22c55e'] });
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#E66A1F', '#FCD34D', '#22c55e'] });
    }, 200);
  }, []);

  return (
    <div className="app-screen flex items-center justify-center px-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="w-full max-w-sm space-y-5"
      >
        {/* Trophy */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center"
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(230,106,31,0.25) 0%, transparent 70%)', animation: 'pulse 2s ease-in-out infinite' }}
            />
            <div
              className="flex h-full w-full items-center justify-center rounded-full border border-primary/40"
              style={{ background: 'linear-gradient(135deg, rgba(230,106,31,0.2) 0%, rgba(230,106,31,0.08) 100%)', boxShadow: '0 0 40px rgba(230,106,31,0.3)' }}
            >
              <Trophy className="h-10 w-10 text-primary" style={{ filter: 'drop-shadow(0 0 8px rgba(230,106,31,0.6))' }} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Queue Cleared</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight text-foreground">Inbox Zero</h1>
          </motion.div>
        </div>

        {/* Stats card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="overflow-hidden rounded-2xl border border-border/40"
          style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}
        >
          {/* Score banner */}
          <div
            className="border-b border-border/30 px-5 py-4 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(230,106,31,0.12) 0%, rgba(230,106,31,0.04) 100%)' }}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Final Score</p>
            <p
              className="mt-1 text-5xl font-black tabular-nums text-foreground"
              style={{ textShadow: '0 0 30px rgba(230,106,31,0.5)' }}
            >
              {String(score).padStart(4, '0')}
            </p>
          </div>

          {/* Rank + stats row */}
          <div className="grid grid-cols-3 divide-x divide-border/30">
            <div className="flex flex-col items-center gap-1.5 px-3 py-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50"
                style={{ boxShadow: `0 0 16px ${rank.glow}` }}
              >
                <RankIcon className={cn('h-5 w-5', rank.color)} />
              </div>
              <p className={cn('text-center text-[10px] font-black leading-tight', rank.color)}>{rank.title}</p>
              <p className="text-[9px] font-bold text-muted-foreground">Rank</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 px-3 py-4 text-center">
              <p className="text-3xl font-black text-foreground">{processedToday}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Reviewed</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 px-3 py-4 text-center">
              <p className="text-3xl font-black text-green-400" style={{ textShadow: '0 0 12px rgba(34,197,94,0.4)' }}>0</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Remaining</p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          onClick={onReset}
          className="w-full rounded-2xl py-3.5 text-sm font-black text-white transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)',
            boxShadow: '0 0 0 1px rgba(230,106,31,0.4), 0 0 24px rgba(230,106,31,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          Check Again
        </motion.button>
      </motion.div>
    </div>
  );
}

export const hideBase44Index = true;
