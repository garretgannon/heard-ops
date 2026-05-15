import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Bell, CalendarClock, Check, CheckCircle2,
  ClipboardCheck, Flame, ListChecks, RefreshCw,
  Sparkles, Thermometer, Trophy, Users, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { haptics } from '@/utils/haptics';
import DesktopPageHeader from '@/components/DesktopPageHeader';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_CONFIG = [
  { id: 'brief', label: 'Brief', num: '01', icon: Sparkles },
  { id: 'work',  label: 'Work',  num: '02', icon: ClipboardCheck },
  { id: 'close', label: 'Close', num: '03', icon: Trophy },
];

const SHIFT_META = {
  morning:   { label: 'Opening Shift', color: 'text-amber-400' },
  afternoon: { label: 'Midday Shift',  color: 'text-blue-400' },
  evening:   { label: 'Dinner Shift',  color: 'text-primary' },
  night:     { label: 'Closing Shift', color: 'text-purple-400' },
};

const BRIEF_SECTION_IDS = ['preshift', 'eightysix', 'events', 'team', 'comms'];

const cardBg = {
  background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayKey() { return new Date().toISOString().slice(0, 10); }

function currentShiftKey() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 16) return 'afternoon';
  if (h < 23) return 'evening';
  return 'night';
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function safeList(promise) {
  if (!promise) return Promise.resolve([]);
  return promise.catch(() => []);
}

// ─── XP Float ─────────────────────────────────────────────────────────────────

function XpFloat({ amount, onDone }) {
  return createPortal(
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -80, scale: 1.25 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      className="pointer-events-none fixed bottom-40 left-1/2 z-[2000] -translate-x-1/2 text-2xl font-black text-primary"
      style={{ textShadow: '0 0 16px rgba(230,106,31,0.9)' }}
    >
      +{amount} XP
    </motion.div>,
    document.body
  );
}

// ─── Stage pipeline ───────────────────────────────────────────────────────────

function StagePipeline({ active }) {
  const activeIdx = STAGE_CONFIG.findIndex(s => s.id === active);
  return (
    <div className="flex items-center gap-0">
      {STAGE_CONFIG.map((stage, i) => {
        const Icon = stage.icon;
        const isActive = stage.id === active;
        const isDone = i < activeIdx;
        return (
          <div key={stage.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition-all duration-300',
                isActive ? 'border border-primary/50 bg-primary/15 text-primary'
                  : isDone ? 'border border-green-500/30 bg-green-500/8 text-green-400'
                  : 'border border-border/40 bg-transparent text-muted-foreground/50'
              )}
              style={isActive ? { boxShadow: '0 0 12px rgba(230,106,31,0.2)' } : undefined}
            >
              {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              <span className="hidden sm:inline">{stage.label}</span>
              <span className="sm:hidden">{stage.num}</span>
            </div>
            {i < STAGE_CONFIG.length - 1 && (
              <div className={cn('mx-1 h-px w-4 transition-colors', i < activeIdx ? 'bg-green-500/40' : 'bg-border/30')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Brief section (collapsible, tracks if viewed) ────────────────────────────

function BriefSection({ id, icon: Icon, label, count = 0, children, onViewed }) {
  const [open, setOpen] = useState(false);
  const [viewed, setViewed] = useState(false);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    haptics.light();
    if (next && !viewed) {
      setViewed(true);
      onViewed?.(id);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/40" style={cardBg}>
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-2.5">
          <Icon className={cn('h-4 w-4 shrink-0', viewed ? 'text-green-400/70' : 'text-primary')} />
          <span className={cn('text-sm font-black', viewed ? 'text-foreground/70' : 'text-foreground')}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {viewed && <Check className="h-3 w-3 text-green-400/60" />}
          <span className="rounded-full border border-border/30 px-2 py-0.5 text-xs font-black tabular-nums text-muted-foreground">{count}</span>
          <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.18 }}>
            <ArrowRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground/50" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-1 border-t border-border/20 px-4 pb-3 pt-2.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BriefRow({ title, meta }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/20 px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-border/60" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">{title}</p>
        {meta && <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{meta}</p>}
      </div>
    </div>
  );
}

function EmptyBrief({ text }) {
  return <p className="py-1 text-xs text-muted-foreground">{text}</p>;
}

// ─── Task card (checkable) ────────────────────────────────────────────────────

function TaskCard({ item, checked, onToggle }) {
  const label = item.name || item.taskName || item.title || 'Task';
  const sub = [item.station_name || item.station, item.quantity ? `${item.quantity}${item.unit ? ' ' + item.unit : ''}` : ''].filter(Boolean).join(' · ');

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      layout
      className="flex w-full items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left transition-colors active:scale-[0.98]"
      animate={{ borderColor: checked ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)' }}
      style={{
        background: checked
          ? 'rgba(34,197,94,0.06)'
          : 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)',
      }}
    >
      <motion.div
        animate={{
          backgroundColor: checked ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.04)',
          borderColor: checked ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)',
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
      >
        <AnimatePresence mode="wait">
          {checked
            ? <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                <Check className="h-4 w-4 text-green-400" />
              </motion.div>
            : <motion.div key="empty" className="h-3 w-3 rounded border border-border/40" />
          }
        </AnimatePresence>
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-bold leading-snug transition-colors', checked ? 'text-muted-foreground line-through' : 'text-foreground')}>
          {label}
        </p>
        {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
      </div>

      {checked && (
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-black text-green-400">
          <Zap className="h-2.5 w-2.5" /> 5
        </div>
      )}
    </motion.button>
  );
}

// ─── Section wrapper (card group) ─────────────────────────────────────────────

function WorkSection({ icon: Icon, iconColor = 'text-primary', label, done, total, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40" style={cardBg}>
      <div className="flex items-center justify-between border-b border-border/20 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Icon className={cn('h-4 w-4', iconColor)} />
          <span className="text-sm font-black text-foreground">{label}</span>
        </div>
        <span className={cn('text-sm font-black tabular-nums', done === total && total > 0 ? 'text-green-400' : 'text-foreground')}>
          {done}/{total}
        </span>
      </div>
      <div className="space-y-2 px-3 pb-3 pt-3">
        {children}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function StaffShift() {
  const { user } = useCurrentUser();
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStage, setActiveStage] = useState('brief');
  const [data, setData] = useState({
    preShift: null, eightySix: [], events: [],
    announcements: [], staffToday: [],
    prepItems: [], sideworkTasks: [], equipment: [],
  });

  // Brief stage
  const [viewedSections, setViewedSections] = useState(new Set());
  const [briefDone, setBriefDone]           = useState(false);
  const allSectionsViewed = BRIEF_SECTION_IDS.every(id => viewedSections.has(id));

  // Work stage
  const [checkedPrep, setCheckedPrep]       = useState(new Set());
  const [checkedSide, setCheckedSide]       = useState(new Set());
  const [tempInputs, setTempInputs]         = useState({});
  const [loggedTemps, setLoggedTemps]       = useState(new Set());

  // Close stage
  const [closeNote, setCloseNote]   = useState('');
  const [signingOff, setSigningOff] = useState(false);
  const [shiftDone, setShiftDone]   = useState(false);

  // XP
  const [shiftXp, setShiftXp]   = useState(0);
  const [xpFloats, setXpFloats] = useState([]);

  const date  = todayKey();
  const shift = currentShiftKey();
  const meta  = SHIFT_META[shift] || SHIFT_META.evening;
  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const load = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    try {
      const entityShift = shift === 'night' ? 'evening' : shift;

      // Batch 1: briefing data
      const [preShifts, eightySix, beos] = await Promise.all([
        safeList(base44.entities.PreShift?.filter?.({ date, shift: entityShift })),
        safeList(base44.entities.EightySixItem?.filter?.({ is_active: true }, '-created_date', 10)),
        safeList(base44.entities.BEO?.list?.('-eventDate', 5)),
      ]);

      // Batch 2: task data (sequential to avoid rate limit burst)
      const [threads, staff, prepItems, sidework, equip] = await Promise.all([
        safeList(base44.entities.MessageThread?.filter?.({ status: 'open' }, '-created_date', 10)),
        safeList(base44.entities.StaffShift?.filter?.({ date }, 'employee_name', 20)),
        safeList(base44.entities.PrepItem?.filter?.({ date }, 'sort_order', 50)),
        safeList(base44.entities.DailySideWorkTask?.filter?.({ date }, 'sort_order', 30)),
        safeList(base44.entities.Equipment?.filter?.({ isActive: true }, 'name', 50)),
      ]);

      setData({
        preShift: preShifts?.[0] || null,
        eightySix: eightySix.slice(0, 10),
        events: beos.filter(e => !e.eventDate || e.eventDate >= date).slice(0, 8),
        announcements: threads.filter(t => t.type === 'announcement' || t.requires_acknowledgement).slice(0, 6),
        staffToday: staff.slice(0, 24),
        prepItems: prepItems.filter(p => !['completed', 'done'].includes(p.status)),
        sideworkTasks: sidework.filter(s => !['completed', 'done'].includes(s.status)),
        equipment: equip.filter(e => e.temp_enabled || e.requiresTemperatureLog),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addXp = (amount) => {
    setShiftXp(prev => prev + amount);
    const id = Date.now() + Math.random();
    setXpFloats(prev => [...prev, id]);
    setTimeout(() => setXpFloats(prev => prev.filter(x => x !== id)), 1200);
  };

  const markSectionViewed = (id) => setViewedSections(prev => new Set([...prev, id]));

  const acknowledgeBriefing = () => {
    haptics.medium();
    addXp(10);
    setBriefDone(true);
    setActiveStage('work');
    toast.success("Briefing done — let's get to work");
  };

  const togglePrep = async (item) => {
    const was = checkedPrep.has(item.id);
    if (was) {
      setCheckedPrep(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    } else {
      haptics.light();
      setCheckedPrep(prev => new Set([...prev, item.id]));
      addXp(5);
      base44.entities.PrepItem?.update?.(item.id, { status: 'completed' }).catch(() => null);
    }
  };

  const toggleSide = async (item) => {
    const was = checkedSide.has(item.id);
    if (was) {
      setCheckedSide(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    } else {
      haptics.light();
      setCheckedSide(prev => new Set([...prev, item.id]));
      addXp(5);
      base44.entities.DailySideWorkTask?.update?.(item.id, { status: 'completed' }).catch(() => null);
    }
  };

  const logTemp = (eq) => {
    const val = tempInputs[eq.id];
    if (!val || isNaN(Number(val))) return;
    haptics.light();
    addXp(5);
    setLoggedTemps(prev => new Set([...prev, eq.id]));
    setTempInputs(prev => ({ ...prev, [eq.id]: '' }));
    base44.entities.TemperatureLog?.create?.({
      equipment_id: eq.id,
      equipment_name: eq.name,
      temperature: Number(val),
      unit: 'F',
      status: 'logged',
      in_range: true,
    }).catch(() => null);
  };

  const signOff = async () => {
    setSigningOff(true);
    haptics.strong();
    addXp(25);
    await base44.entities.UnifiedLog?.create?.({
      type: 'shift_complete',
      title: `${meta.label} — Staff Sign-Off`,
      description: closeNote || `Shift completed by ${user?.full_name || user?.email}.`,
      status: 'resolved',
      created_by: user?.email,
    }).catch(() => null);
    confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 }, colors: ['#E66A1F', '#FB923C', '#FCD34D'] });
    setShiftDone(true);
    setSigningOff(false);
  };

  const totalTasks = data.prepItems.length + data.sideworkTasks.length + data.equipment.length;
  const doneTasks  = checkedPrep.size + checkedSide.size + loggedTemps.size;
  const progressPct = totalTasks === 0 ? 100 : Math.round((doneTasks / totalTasks) * 100);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent"
          style={{ boxShadow: '0 0 20px rgba(230,106,31,0.35)' }}
        />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading your shift…</p>
      </div>
    );
  }

  return (
    <div className="app-screen">

      <DesktopPageHeader title="Shift" subtitle="Brief, work your tasks, and sign off" />

      {/* Desktop stage nav */}
      <div className="hidden lg:flex items-center gap-1 px-8 py-3 border-b border-border/20 bg-card/30 shrink-0">
        {STAGE_CONFIG.map(stage => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;
          const activeIdx = STAGE_CONFIG.findIndex(s => s.id === activeStage);
          const isDone = STAGE_CONFIG.findIndex(s => s.id === stage.id) < activeIdx;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => { haptics.light(); setActiveStage(stage.id); }}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                isActive ? 'glow-active' : isDone ? 'text-green-400 hover:bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              {stage.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-bold text-primary">{shiftXp} XP</span>
          <span className={cn('text-xs font-bold', progressPct === 100 ? 'text-green-400' : 'text-muted-foreground')}>
            {doneTasks}/{totalTasks} tasks
          </span>
          <button type="button" onClick={() => load({ quiet: true })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 hover:bg-muted transition-all">
            <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── Sticky HUD ── */}
      <div
        className="lg:hidden sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{
          background: 'linear-gradient(180deg, rgba(6,10,16,0.97) 0%, rgba(8,13,20,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 16px rgba(0,0,0,0.5)',
        }}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div>
            <p className={cn('text-[10px] font-black uppercase tracking-[0.2em]', meta.color)}>{greeting()}</p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-foreground">{firstName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-2.5 py-1 text-[11px] font-black text-primary">
              <Zap className="h-3 w-3" />
              {shiftXp} XP
            </div>
            <button
              type="button"
              onClick={() => load({ quiet: true })}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <RefreshCw className={cn('h-4 w-4 text-muted-foreground', refreshing && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Work progress bar */}
        {activeStage === 'work' && (
          <div className="mb-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-muted-foreground">{doneTasks}/{totalTasks} tasks done</span>
              <span className={progressPct === 100 ? 'text-green-400' : 'text-foreground'}>{progressPct}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-black/40">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  background: progressPct === 100
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                    : 'linear-gradient(90deg, hsl(22,76%,38%), hsl(22,76%,55%))',
                  boxShadow: progressPct === 100 ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 6px rgba(230,106,31,0.4)',
                }}
              />
            </div>
          </div>
        )}

        {/* Stage pipeline + tab switcher */}
        <div className="flex items-center justify-between">
          <StagePipeline active={activeStage} />
          <div className="flex gap-1">
            {STAGE_CONFIG.map(stage => (
              <button
                key={stage.id}
                type="button"
                onClick={() => { haptics.light(); setActiveStage(stage.id); }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                  activeStage === stage.id ? 'glow-active' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stage content ── */}
      <div className="app-page max-w-5xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
          >

            {/* ── BRIEF ──────────────────────────────────────────── */}
            {activeStage === 'brief' && (
              <>
                {/* Quick snapshot */}
                <div
                  className="grid grid-cols-3 divide-x divide-border/20 overflow-hidden rounded-2xl border border-border/40"
                  style={cardBg}
                >
                  {[
                    { label: "86'd",  value: data.eightySix.length,  color: data.eightySix.length > 0  ? 'text-red-400'      : 'text-muted-foreground/40' },
                    { label: 'Events', value: data.events.length,     color: data.events.length > 0     ? 'text-amber-400'    : 'text-muted-foreground/40' },
                    { label: 'Tasks',  value: totalTasks,             color: totalTasks > 0             ? 'text-foreground/80' : 'text-muted-foreground/40' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex flex-col items-center justify-center gap-0.5 py-4">
                      <p className={cn('text-2xl font-black tabular-nums', color)}>{value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="lg:grid lg:grid-cols-2 lg:gap-3 space-y-3 lg:space-y-0">
                  {/* Pre-Shift Notes */}
                  <BriefSection id="preshift" icon={Sparkles} label="Manager Notes" count={data.preShift ? 1 : 0} onViewed={markSectionViewed}>
                    {data.preShift ? (
                      <>
                        {data.preShift.specials    && <BriefRow title={data.preShift.specials}        meta="Specials" />}
                        {data.preShift.staffing_notes && <BriefRow title={data.preShift.staffing_notes} meta="Staffing" />}
                        {data.preShift.notes       && <BriefRow title={data.preShift.notes}           meta="Briefing notes" />}
                        {!data.preShift.specials && !data.preShift.staffing_notes && !data.preShift.notes && (
                          <BriefRow title="Pre-shift submitted" meta={`${data.preShift.shift} shift`} />
                        )}
                      </>
                    ) : (
                      <EmptyBrief text="No manager notes yet — check back or ask your manager." />
                    )}
                  </BriefSection>

                  {/* 86'd Items */}
                  <BriefSection id="eightysix" icon={Flame} label="86'd Items" count={data.eightySix.length} onViewed={markSectionViewed}>
                    {data.eightySix.length === 0
                      ? <EmptyBrief text="Nothing 86'd right now." />
                      : data.eightySix.map(item => (
                          <BriefRow key={item.id} title={item.item_name} meta={item.category || item.notes} />
                        ))
                    }
                  </BriefSection>

                  {/* Events */}
                  <BriefSection id="events" icon={CalendarClock} label="Events & Reservations" count={data.events.length} onViewed={markSectionViewed}>
                    {data.events.length === 0
                      ? <EmptyBrief text="No events today." />
                      : data.events.map(item => (
                          <BriefRow key={item.id}
                            title={item.eventName}
                            meta={[item.eventDate, item.startTime, item.room, item.guestCount ? `${item.guestCount} guests` : ''].filter(Boolean).join(' · ')}
                          />
                        ))
                    }
                  </BriefSection>

                  {/* Team */}
                  <BriefSection id="team" icon={Users} label="Your Team Today" count={data.staffToday.length} onViewed={markSectionViewed}>
                    {data.staffToday.length === 0
                      ? <EmptyBrief text="No schedule data yet." />
                      : data.staffToday.slice(0, 14).map(person => (
                          <BriefRow
                            key={person.id}
                            title={person.employee_name || person.name || 'Staff'}
                            meta={[person.role, person.station, person.start_time ? `${person.start_time}–${person.end_time || '?'}` : ''].filter(Boolean).join(' · ')}
                          />
                        ))
                    }
                  </BriefSection>

                  {/* Announcements */}
                  <BriefSection id="comms" icon={Bell} label="Announcements" count={data.announcements.length} onViewed={markSectionViewed}>
                    {data.announcements.length === 0
                      ? <EmptyBrief text="No announcements." />
                      : data.announcements.map(item => (
                          <BriefRow key={item.id} title={item.title} meta={item.body?.slice(0, 100)} />
                        ))
                    }
                  </BriefSection>
                </div>

                {/* Progress tracker */}
                {!briefDone && (
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[11px] font-bold text-muted-foreground">
                      {viewedSections.size}/{BRIEF_SECTION_IDS.length} sections reviewed
                    </p>
                    <div className="flex gap-1">
                      {BRIEF_SECTION_IDS.map(id => (
                        <div
                          key={id}
                          className={cn('h-1 w-6 rounded-full transition-all duration-300', viewedSections.has(id) ? 'bg-green-400/60' : 'bg-border/40')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Acknowledge button */}
                <button
                  type="button"
                  onClick={acknowledgeBriefing}
                  disabled={briefDone || !allSectionsViewed}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-black text-white transition-all active:scale-[0.98]"
                  style={{
                    background: briefDone
                      ? 'linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0.2) 100%)'
                      : allSectionsViewed
                        ? 'linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)'
                        : 'rgba(255,255,255,0.04)',
                    boxShadow: briefDone
                      ? '0 0 0 1px rgba(34,197,94,0.3)'
                      : allSectionsViewed
                        ? '0 0 0 1px rgba(230,106,31,0.4), 0 0 24px rgba(230,106,31,0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
                        : '0 0 0 1px rgba(255,255,255,0.06)',
                    opacity: !briefDone && !allSectionsViewed ? 0.5 : 1,
                  }}
                >
                  {briefDone
                    ? <><CheckCircle2 className="h-5 w-5" />Briefed — Let's Work</>
                    : allSectionsViewed
                      ? <><Check className="h-5 w-5" />I'm Ready — Start My Shift</>
                      : <><Sparkles className="h-5 w-5" />Review all sections to continue</>
                  }
                </button>
              </>
            )}

            {/* ── WORK ───────────────────────────────────────────── */}
            {activeStage === 'work' && (
              <>
                <div className="lg:grid lg:grid-cols-2 lg:gap-3 space-y-3 lg:space-y-0">
                  {/* Prep list */}
                  {data.prepItems.length > 0 && (
                    <WorkSection icon={ClipboardCheck} label="Prep List" done={checkedPrep.size} total={data.prepItems.length}>
                      {data.prepItems.map(item => (
                        <TaskCard
                          key={item.id}
                          item={item}
                          checked={checkedPrep.has(item.id)}
                          onToggle={() => togglePrep(item)}
                        />
                      ))}
                    </WorkSection>
                  )}

                  {/* Sidework */}
                  {data.sideworkTasks.length > 0 && (
                    <WorkSection icon={ListChecks} label="Sidework" done={checkedSide.size} total={data.sideworkTasks.length}>
                      {data.sideworkTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          item={task}
                          checked={checkedSide.has(task.id)}
                          onToggle={() => toggleSide(task)}
                        />
                      ))}
                    </WorkSection>
                  )}

                  {/* Temperature checks */}
                  {data.equipment.length > 0 && (
                    <WorkSection icon={Thermometer} iconColor="text-blue-400" label="Temperature Checks" done={loggedTemps.size} total={data.equipment.length}>
                      {data.equipment.map(eq => {
                        const logged = loggedTemps.has(eq.id);
                        return (
                          <div
                            key={eq.id}
                            className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
                            style={{
                              borderColor: logged ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)',
                              background: logged ? 'rgba(34,197,94,0.06)' : 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                            }}
                          >
                            <motion.div
                              animate={{
                                backgroundColor: logged ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.04)',
                                borderColor: logged ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)',
                              }}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                            >
                              {logged
                                ? <Check className="h-4 w-4 text-green-400" />
                                : <Thermometer className="h-3.5 w-3.5 text-blue-400/70" />
                              }
                            </motion.div>

                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-bold leading-snug', logged ? 'text-muted-foreground line-through' : 'text-foreground')}>
                                {eq.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {eq.equipmentType?.replace(/-/g, ' ') || 'Equipment'}
                              </p>
                            </div>

                            {logged ? (
                              <span className="text-[11px] font-black text-green-400 flex items-center gap-1">
                                <Zap className="h-2.5 w-2.5" /> Logged
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  value={tempInputs[eq.id] || ''}
                                  onChange={e => setTempInputs(prev => ({ ...prev, [eq.id]: e.target.value }))}
                                  onKeyDown={e => e.key === 'Enter' && logTemp(eq)}
                                  placeholder="°F"
                                  className="w-16 rounded-lg border border-border/50 bg-background px-2 py-1.5 text-center text-sm font-bold text-foreground outline-none focus:border-primary/50"
                                />
                                <button
                                  type="button"
                                  onClick={() => logTemp(eq)}
                                  disabled={!tempInputs[eq.id]}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/15 disabled:opacity-40 transition-all active:scale-95"
                                >
                                  <Check className="h-3.5 w-3.5 text-blue-400" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </WorkSection>
                  )}

                  {/* Empty state */}
                  {totalTasks === 0 && (
                    <div
                      className="flex flex-col items-center gap-3 rounded-2xl border border-border/30 py-12 text-center"
                      style={cardBg}
                    >
                      <CheckCircle2 className="h-8 w-8 text-green-400/50" />
                      <p className="text-sm font-bold text-foreground">No tasks assigned yet</p>
                      <p className="text-xs text-muted-foreground">Check back or ask your manager.</p>
                    </div>
                  )}
                </div>

                {/* Close out CTA */}
                {progressPct === 100 ? (
                  <button
                    type="button"
                    onClick={() => { haptics.medium(); setActiveStage('close'); }}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-black text-white active:scale-[0.98] transition-all"
                    style={{
                      background: 'linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)',
                      boxShadow: '0 0 0 1px rgba(230,106,31,0.4), 0 0 24px rgba(230,106,31,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    <Trophy className="h-5 w-5" /> All done — Close Out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { haptics.light(); setActiveStage('close'); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/40 py-3 text-xs font-black text-muted-foreground transition-all"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    Skip to Close-Out
                  </button>
                )}
              </>
            )}

            {/* ── CLOSE ──────────────────────────────────────────── */}
            {activeStage === 'close' && (
              <>
                {/* Shift summary scorecard */}
                <div
                  className="grid grid-cols-3 divide-x divide-border/20 overflow-hidden rounded-2xl border border-border/40"
                  style={cardBg}
                >
                  {[
                    { label: 'Completed', value: doneTasks,             color: doneTasks > 0 ? 'text-green-400' : 'text-muted-foreground/40' },
                    { label: 'Remaining', value: totalTasks - doneTasks, color: totalTasks - doneTasks > 0 ? 'text-amber-400' : 'text-muted-foreground/40' },
                    { label: 'XP Earned', value: shiftXp,               color: shiftXp > 0 ? 'text-primary' : 'text-muted-foreground/40' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex flex-col items-center justify-center gap-0.5 py-4">
                      <p className={cn('text-2xl font-black tabular-nums', color)}>{value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Sign-off card */}
                <div className="overflow-hidden rounded-2xl border border-border/40" style={cardBg}>
                  <div className="flex items-start gap-2.5 border-b border-border/20 px-4 pt-4 pb-3">
                    <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-black text-foreground">Sign Off</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Anything your manager needs to know? +25 XP on completion.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 px-4 pb-4 pt-3">
                    <textarea
                      value={closeNote}
                      onChange={e => setCloseNote(e.target.value)}
                      rows={4}
                      placeholder="Issues, notes, or anything to flag for the next shift… (optional)"
                      disabled={shiftDone}
                      className="w-full resize-none rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={signOff}
                      disabled={signingOff || shiftDone}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white disabled:opacity-60 active:scale-[0.98] transition-all"
                      style={{
                        background: shiftDone
                          ? 'linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0.2) 100%)'
                          : 'linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)',
                        boxShadow: shiftDone
                          ? '0 0 0 1px rgba(34,197,94,0.3)'
                          : '0 0 0 1px rgba(230,106,31,0.35), 0 0 20px rgba(230,106,31,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                      }}
                    >
                      {shiftDone
                        ? <><CheckCircle2 className="h-5 w-5" />Shift Complete — +25 XP</>
                        : signingOff ? 'Signing off…'
                        : <><Trophy className="h-5 w-5" />Complete My Shift</>
                      }
                    </button>
                  </div>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Global XP floats */}
      <AnimatePresence>
        {xpFloats.map(id => (
          <XpFloat key={id} amount={5} onDone={() => setXpFloats(prev => prev.filter(x => x !== id))} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export const hideBase44Index = true;