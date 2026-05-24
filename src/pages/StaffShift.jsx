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
import { ShiftMobileGuide, ShiftStageNav } from '@/components/shift/ShiftWorkflowShell';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_CONFIG = [
  { id: 'brief', label: 'Brief', num: '01', icon: Sparkles, description: 'Read the manager notes, 86 items, events, and team updates.' },
  { id: 'work',  label: 'Work',  num: '02', icon: ClipboardCheck, description: 'Complete prep, sidework, and temperature checks assigned to you.' },
  { id: 'close', label: 'Close', num: '03', icon: Trophy, description: 'Leave a quick note and sign off when your shift is done.' },
];

const SHIFT_META = {
  morning:   { label: 'Opening Shift', color: 'text-amber-400' },
  afternoon: { label: 'Midday Shift',  color: 'text-blue-400' },
  evening:   { label: 'Dinner Shift',  color: 'text-primary' },
  night:     { label: 'Closing Shift', color: 'text-purple-400' },
};

const BRIEF_SECTION_IDS = ['preshift', 'eightysix', 'events', 'team', 'comms'];

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
      style={{ textShadow: '0 0 8px rgba(255,107,0,0.4)' }}
    >
      +{amount} XP
    </motion.div>,
    document.body
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
    <div className="ops-panel">
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
    <div className="ops-panel-soft flex items-start gap-3 px-3 py-2.5">
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
          : 'hsl(var(--card))',
        boxShadow: 'none',
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
    <div className="ops-panel">
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

      const preShifts  = await safeList(base44.entities.PreShift?.filter?.({ date, shift: entityShift }));
      const eightySix  = await safeList(base44.entities.EightySixItem?.filter?.({ is_active: true }, '-created_date', 10));
      const beos       = await safeList(base44.entities.BEO?.list?.('-eventDate', 5));
      const threads    = [];
      const staff      = await safeList(base44.entities.StaffShift?.filter?.({ date }, 'employee_name', 20));
      const prepItems  = await safeList(base44.entities.PrepItem?.filter?.({ date }, 'sort_order', 50));
      const sidework   = await safeList(base44.entities.DailySideWorkTask?.filter?.({ date }, 'sort_order', 30));
      const equip      = await safeList(base44.entities.Equipment?.filter?.({ isActive: true }, 'name', 50));

      setData({
        preShift: preShifts?.find(p => p.status === 'published') || null,
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
    confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 }, colors: ['#FF6B00', '#FB923C', '#FCD34D'] });
    setShiftDone(true);
    setSigningOff(false);
  };

  const totalTasks = data.prepItems.length + data.sideworkTasks.length + data.equipment.length;
  const doneTasks  = checkedPrep.size + checkedSide.size + loggedTemps.size;
  const progressPct = totalTasks === 0 ? 100 : Math.round((doneTasks / totalTasks) * 100);
  const staffNextAction = (() => {
    if (activeStage === 'brief') {
      if (briefDone) {
        return {
          label: 'Start your work',
          detail: 'Briefing is complete. Move into prep, sidework, and checks.',
          icon: ClipboardCheck,
          tone: 'text-primary',
          onClick: () => setActiveStage('work'),
        };
      }
      return {
        label: allSectionsViewed ? 'Start your shift' : 'Review the briefing',
        detail: allSectionsViewed
          ? 'You have reviewed every section. Acknowledge to begin work.'
          : `${viewedSections.size}/${BRIEF_SECTION_IDS.length} sections reviewed before work starts.`,
        icon: Sparkles,
        tone: allSectionsViewed ? 'text-primary' : 'text-muted-foreground',
        onClick: allSectionsViewed ? acknowledgeBriefing : undefined,
      };
    }

    if (activeStage === 'work') {
      if (totalTasks === 0) {
        return {
          label: 'No assigned tasks',
          detail: 'Nothing is assigned yet. You can check back or close out.',
          icon: CheckCircle2,
          tone: 'text-green-400',
          onClick: () => setActiveStage('close'),
        };
      }
      if (progressPct === 100) {
        return {
          label: 'Close out your shift',
          detail: 'All assigned work is complete. Finish with a sign-off note.',
          icon: Trophy,
          tone: 'text-primary',
          onClick: () => setActiveStage('close'),
        };
      }
      return {
        label: 'Complete the next task',
        detail: `${totalTasks - doneTasks} item${totalTasks - doneTasks !== 1 ? 's' : ''} left across prep, sidework, and checks.`,
        icon: ClipboardCheck,
        tone: 'text-primary',
      };
    }

    return {
      label: shiftDone ? 'Shift complete' : 'Complete sign-off',
      detail: shiftDone ? 'You are all set.' : 'Add any handoff notes and complete your shift.',
      icon: Trophy,
      tone: shiftDone ? 'text-green-400' : 'text-primary',
    };
  })();

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent"
          style={{ boxShadow: '0 0 12px rgba(255,107,0,0.18)' }}
        />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading your shift…</p>
      </div>
    );
  }

  return (
    <div className="app-screen">

      <DesktopPageHeader title="Shift" subtitle="Brief, work your tasks, and sign off" />

      <ShiftStageNav
        stages={STAGE_CONFIG}
        activeStage={activeStage}
        onStageChange={(id) => { haptics.light(); setActiveStage(id); }}
        className="hidden lg:flex border-b border-border/20 bg-card/30 px-8 py-3"
        trailing={
          <>
            <span className="text-xs font-bold text-primary">{shiftXp} XP</span>
            <span className={cn('text-xs font-bold', progressPct === 100 ? 'text-green-400' : 'text-muted-foreground')}>
              {doneTasks}/{totalTasks} tasks
            </span>
            <button type="button" onClick={() => load({ quiet: true })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 transition-all">
              <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', refreshing && 'animate-spin')} />
            </button>
          </>
        }
      />

      <ShiftMobileGuide
        eyebrow={greeting()}
        title={firstName}
        stages={STAGE_CONFIG}
        activeStage={activeStage}
        onStageChange={(id) => { haptics.light(); setActiveStage(id); }}
        onRefresh={() => load({ quiet: true })}
        refreshing={refreshing}
        nextAction={activeStage === 'brief' && !briefDone && !allSectionsViewed ? undefined : staffNextAction}
        progress={activeStage === 'work' ? {
          label: `${doneTasks}/${totalTasks} tasks done`,
          value: progressPct,
          complete: progressPct === 100,
        } : undefined}
      />

      {/* ── Stage content ── */}
      <div className="app-page">
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
                {/* Published briefing banner */}
                {data.preShift ? (
                  <div className="ops-panel flex items-center gap-3 border-primary/25 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-primary">Pre-Shift Briefing Ready</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {data.preShift.published_by ? `Published by ${data.preShift.published_by}` : 'Published by management'}
                        {data.preShift.published_at
                          ? ` · ${new Date(data.preShift.published_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                          : ''}
                      </p>
                    </div>
                    <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary" />
                  </div>
                ) : (
                  <div className="ops-panel flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/40">
                      <Sparkles className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-muted-foreground">No briefing published yet</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60">Your manager hasn't published today's briefing.</p>
                    </div>
                  </div>
                )}

                {/* Quick snapshot */}
                <div className="ops-panel grid grid-cols-3 divide-x divide-border/20">
                  {[
                    { label: "86'd",  value: data.eightySix.length,  color: data.eightySix.length > 0  ? 'text-foreground' : 'text-muted-foreground/40' },
                    { label: 'Events', value: data.events.length,     color: data.events.length > 0     ? 'text-foreground' : 'text-muted-foreground/40' },
                    { label: 'Tasks',  value: totalTasks,             color: totalTasks > 0             ? 'text-foreground/80' : 'text-muted-foreground/40' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex flex-col items-center justify-center gap-0.5 py-4">
                      <p className={cn('text-2xl font-black tabular-nums', color)}>{value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="lg:grid lg:grid-cols-2 lg:gap-3 space-y-3 lg:space-y-0">
                  {/* Pre-Shift Notes — manager published content */}
                  <BriefSection
                    id="preshift"
                    icon={Sparkles}
                    label="Manager Briefing"
                    count={data.preShift ? [data.preShift.notes, data.preShift.specials, data.preShift.staffing_notes, data.preShift.sidework_priorities, data.preShift.prep_needs].filter(Boolean).length : 0}
                    onViewed={markSectionViewed}
                  >
                    {data.preShift ? (
                      <div className="space-y-1.5">
                        {data.preShift.notes              && <BriefRow title={data.preShift.notes}              meta="Talking Points" />}
                        {data.preShift.specials            && <BriefRow title={data.preShift.specials}            meta="Specials" />}
                        {data.preShift.staffing_notes      && <BriefRow title={data.preShift.staffing_notes}      meta="Staffing & Roles" />}
                        {data.preShift.sidework_priorities && <BriefRow title={data.preShift.sidework_priorities} meta="Sidework Priorities" />}
                        {data.preShift.prep_needs          && <BriefRow title={data.preShift.prep_needs}          meta="Prep Needs" />}
                        {data.preShift.issues              && <BriefRow title={data.preShift.issues}              meta="Issues / Cleaning" />}
                        {data.preShift.beverage_notes      && <BriefRow title={data.preShift.beverage_notes}      meta="Beverage Notes" />}
                        {data.preShift.bar_prep_notes      && <BriefRow title={data.preShift.bar_prep_notes}      meta="Bar Prep" />}
                        {![data.preShift.notes, data.preShift.specials, data.preShift.staffing_notes].some(Boolean) && (
                          <BriefRow title="Briefing published" meta={`${data.preShift.shift} shift`} />
                        )}
                      </div>
                    ) : (
                      <EmptyBrief text="No briefing published yet — check back before service." />
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
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-black transition-all active:scale-[0.98]"
                  style={{
                    background: briefDone
                      ? 'rgba(34,197,94,0.15)'
                      : allSectionsViewed
                        ? 'hsl(var(--primary))'
                        : 'rgba(255,255,255,0.04)',
                    border: briefDone
                      ? '1px solid rgba(34,197,94,0.3)'
                      : allSectionsViewed
                        ? '1px solid hsl(var(--primary))'
                        : '1px solid rgba(255,255,255,0.06)',
                    color: briefDone
                      ? 'rgb(74, 222, 128)'
                      : allSectionsViewed
                        ? '#fff'
                        : 'rgba(255,255,255,0.4)',
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
                            className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors border-border"
                            style={{
                              background: logged ? 'rgba(34,197,94,0.06)' : 'hsl(var(--card))',
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
                    <div className="ops-panel flex flex-col items-center gap-3 py-12 text-center">
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
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-black text-white bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all"
                  >
                    <Trophy className="h-5 w-5" /> All done — Close Out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { haptics.light(); setActiveStage('close'); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/40 py-3 text-xs font-black text-muted-foreground bg-secondary/35 active:scale-95 transition-all"
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
                <div className="ops-panel grid grid-cols-3 divide-x divide-border/20">
                  {[
                    { label: 'Completed', value: doneTasks,             color: doneTasks > 0 ? 'text-foreground' : 'text-muted-foreground/40' },
                    { label: 'Remaining', value: totalTasks - doneTasks, color: totalTasks - doneTasks > 0 ? 'text-primary' : 'text-muted-foreground/40' },
                    { label: 'XP Earned', value: shiftXp,               color: shiftXp > 0 ? 'text-foreground' : 'text-muted-foreground/40' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex flex-col items-center justify-center gap-0.5 py-4">
                      <p className={cn('text-2xl font-black tabular-nums', color)}>{value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Sign-off card */}
                <div className="ops-panel">
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
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black disabled:opacity-60 active:scale-[0.98] transition-all"
                      style={{
                        background: shiftDone
                          ? 'rgba(34,197,94,0.15)'
                          : 'hsl(var(--primary))',
                        border: shiftDone
                          ? '1px solid rgba(34,197,94,0.3)'
                          : '1px solid hsl(var(--primary))',
                        color: shiftDone
                          ? 'rgb(74, 222, 128)'
                          : '#fff',
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