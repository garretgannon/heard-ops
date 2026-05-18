import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle, AlertTriangle, ArrowRight, BarChart3, BookOpen,
  Calendar, CalendarClock, ChefHat, CheckCircle2, ChevronRight, ClipboardCheck,
  ClipboardList, Clock, FileStack, Flame, Layers, Package,
  RefreshCw, Settings, Store, TrendingDown, Upload, Users, Wine, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import BulkParEditorModal from '@/components/prep/BulkParEditorModal';
import DesktopPageHeader from '@/components/DesktopPageHeader';

const ALLOWED_ROLES = ['admin', 'manager', 'chef', 'kitchen_lead'];

const cardBg = {
  background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)',
};

// Station display config — used if Station entity is empty
const FALLBACK_STATIONS = [
  { id: 'grill',    name: 'Grill',    Icon: Flame,         color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  { id: 'fry',      name: 'Fry',      Icon: Layers,        color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  { id: 'prep',     name: 'Prep',     Icon: ChefHat,       color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  { id: 'pantry',   name: 'Pantry',   Icon: Package,       color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  { id: 'bar',      name: 'Bar',      Icon: Wine,          color: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/20' },
  { id: 'banquets', name: 'Banquets', Icon: Users,         color: 'text-primary',    bg: 'bg-primary/10',    border: 'border-primary/20' },
];

const STATION_COLORS = [
  { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  { color: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/20' },
  { color: 'text-primary',    bg: 'bg-primary/10',    border: 'border-primary/20' },
  { color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20' },
  { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
];

const STATION_ICONS = [Flame, Layers, ChefHat, Package, Wine, Users, Store, BarChart3];

function initials(name) {
  return (name || '').split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
}

function fmtSession(session) {
  const dt = session.created_date || session.date;
  if (!dt) return null;
  try {
    return format(parseISO(dt.includes('T') ? dt : `${dt}T00:00:00`), 'EEE, MMM d · h:mm a');
  } catch { return dt; }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusCard({ label, value, sub, icon: Icon, iconClass, border, bg, action }) {
  return (
    <div className={cn('flex flex-col gap-2 rounded-2xl border p-3.5', border)} style={{ background: bg }}>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <div className={cn('h-6 w-6 rounded-lg flex items-center justify-center shrink-0', iconClass)}>
          <Icon className="h-3 w-3" />
        </div>
      </div>
      <div>
        <p className="text-lg font-black text-foreground leading-none">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{sub}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className={cn('flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-[11px] font-black transition-all active:scale-[0.97]', action.className)}
          style={action.style}
        >
          {action.icon && <action.icon className="h-3 w-3" />}
          {action.label}
        </button>
      )}
    </div>
  );
}

function StationCard({ station, index, belowPar, tasks, assigned }) {
  const sc   = STATION_COLORS[index % STATION_COLORS.length];
  const Icon = STATION_ICONS[index % STATION_ICONS.length];
  const hasProblem = belowPar > 0 || tasks > 0;

  return (
    <div
      className={cn('rounded-xl border p-3 flex flex-col gap-2', hasProblem ? sc.border : 'border-border/30')}
      style={cardBg}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={cn('h-5 w-5 rounded-md flex items-center justify-center', sc.bg)}>
            <Icon className={cn('h-2.5 w-2.5', sc.color)} />
          </div>
          <p className="text-xs font-black text-foreground">{station.name || station}</p>
        </div>
      </div>

      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          <TrendingDown className={cn('h-2.5 w-2.5', belowPar > 0 ? 'text-red-400' : 'text-muted-foreground/30')} />
          <span className={cn('text-[11px] font-bold', belowPar > 0 ? 'text-foreground' : 'text-muted-foreground/50')}>
            {belowPar} item{belowPar !== 1 ? 's' : ''} below par
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ClipboardCheck className={cn('h-2.5 w-2.5', tasks > 0 ? 'text-primary' : 'text-muted-foreground/30')} />
          <span className={cn('text-[11px] font-bold', tasks > 0 ? 'text-foreground' : 'text-muted-foreground/50')}>
            {tasks} task{tasks !== 1 ? 's' : ''} to complete
          </span>
        </div>
      </div>

      <div className="pt-0.5 border-t border-border/20">
        <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Assigned to</p>
        {assigned ? (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary shrink-0">
              {initials(assigned.employee_name)}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-foreground truncate">{assigned.employee_name}</p>
              <p className="text-[9px] text-muted-foreground truncate capitalize">{(assigned.role || '').replace(/_/g, ' ')}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-border/30 flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground">—</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Unassigned</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SmartInputRow({ icon: Icon, label, value, status = 'ok' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border/15 last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] font-bold text-foreground text-right">{value}</span>
        <div className={cn(
          'h-4 w-4 rounded-full flex items-center justify-center shrink-0',
          status === 'ok'      ? 'bg-green-500/15' :
          status === 'warning' ? 'bg-amber-500/15' :
          'bg-border/30'
        )}>
          {status === 'ok'
            ? <CheckCircle2 className="h-2.5 w-2.5 text-green-400" />
            : status === 'warning'
              ? <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
              : <Clock className="h-2.5 w-2.5 text-muted-foreground/40" />
          }
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PrepPlanning() {
  const { user, isAdmin } = useCurrentUser();
  const navigate = useNavigate();

  const [countSessions, setCountSessions] = useState([]);
  const [prepPlans,     setPrepPlans]     = useState([]);
  const [prepTasks,     setPrepTasks]     = useState([]);
  const [templates,     setTemplates]     = useState([]);
  const [stations,      setStations]      = useState([]);
  const [events,        setEvents]        = useState([]);
  const [eightySix,     setEightySix]     = useState([]);
  const [staff,         setStaff]         = useState([]);
  const [handoffs,      setHandoffs]      = useState([]);
  const [receivingIssues, setReceivingIssues] = useState([]);

  const [loading,       setLoading]       = useState(true);
  const [bulkEditOpen,  setBulkEditOpen]  = useState(false);
  const [today]                           = useState(new Date());

  const isAllowed = isAdmin || ALLOWED_ROLES.includes(user?.role);
  const todayStr  = today.toISOString().split('T')[0];
  const dayLabel  = format(today, "EEE, MMM d");

  useEffect(() => {
    if (!isAllowed) return;
    loadData();
  }, [isAllowed]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [counts, plans, tasks, tmplts, stns, evts, e86, stf, hof, recvIss] = await Promise.all([
        base44.entities.PrepInventoryCount?.list?.('-created_date', 30).catch(() => []),
        base44.entities.PrepPlan?.list?.('-created_date', 20).catch(() => []),
        base44.entities.DailyPrepTask?.list?.('-created_date', 300).catch(() => []),
        base44.entities.PrepPlanTemplate?.filter?.({ is_active: true }).catch(() => []),
        base44.entities.Station?.list?.().catch(() => []),
        base44.entities.BEO?.list?.('-eventDate', 10).catch(() => []),
        base44.entities.EightySixItem?.filter?.({ is_active: true }).catch(() => []),
        base44.entities.StaffShift?.filter?.({ date: todayStr }).catch(() => []),
        base44.entities.ShiftHandoff?.list?.('-created_date', 5).catch(() => []),
        base44.entities.ReceivingIssue?.list?.('-created_date', 20).catch(() => []),
      ]);
      setCountSessions(counts || []);
      setPrepPlans(plans || []);
      setPrepTasks(tasks || []);
      setTemplates(tmplts || []);
      setStations((stns || []).filter(s => s.isActive !== false));
      setEvents(evts || []);
      setEightySix(e86 || []);
      setStaff(stf || []);
      setHandoffs(hof || []);
      setReceivingIssues(recvIss || []);
    } catch {
      toast.error('Failed to load prep planning data');
    }
    setLoading(false);
  };

  const startCount = async () => {
    haptics.medium();
    try {
      const tmplts = await base44.entities.PrepPlanTemplate?.filter?.({ is_active: true }).catch(() => []);
      if (!tmplts?.length) {
        toast.error('No active prep templates — set up templates first');
        return;
      }
    } catch {}
    navigate('/prep-count');
  };

  // ── Derived data ────────────────────────────────────────────────────────────

  const todayCount  = useMemo(() => countSessions.find(c => c.date === todayStr), [countSessions, todayStr]);
  const todayPlan   = useMemo(() => prepPlans.find(p => p.date === todayStr), [prepPlans, todayStr]);
  const todayEvents = useMemo(() => events.filter(e => e.eventDate === todayStr), [events, todayStr]);
  const todayTasks  = useMemo(() => prepTasks.filter(t => !t.date || t.date === todayStr), [prepTasks, todayStr]);

  const belowParItems = useMemo(() => {
    if (todayPlan?.items) {
      return todayPlan.items.filter(i => Number(i.final_prep_quantity || i.required_quantity || 0) > 0);
    }
    // Fallback: compare last count session against par levels from templates
    if (!todayCount || !templates.length) return [];
    const onHandMap = {};
    (todayCount.items || []).forEach(i => {
      onHandMap[(i.item_name || '').toLowerCase()] = Number(i.on_hand_quantity || 0);
    });
    return templates.filter(t => {
      const par  = Number(t.par_quantity || t.required_quantity || 0);
      const hand = onHandMap[(t.item_name || '').toLowerCase()] ?? null;
      return par > 0 && hand !== null && hand < par;
    });
  }, [todayPlan, todayCount, templates]);

  const belowParByStation = useMemo(() => {
    const map = {};
    belowParItems.forEach(item => {
      const s = (item.station || 'general').toLowerCase();
      map[s] = (map[s] || 0) + 1;
    });
    return map;
  }, [belowParItems]);

  const tasksByStation = useMemo(() => {
    const map = {};
    todayTasks.forEach(t => {
      const s = (t.station || 'general').toLowerCase();
      map[s] = (map[s] || 0) + 1;
    });
    return map;
  }, [todayTasks]);

  const todayGuestTotal = todayEvents.reduce((s, e) => s + (Number(e.guestCount) || 0), 0);
  const openReceiving   = receivingIssues.filter(i => i.status === 'open' || i.credit_requested > 0);
  const lastSession     = countSessions[0];

  // Station list: real entity data or fallback
  const displayStations = useMemo(() => {
    if (stations.length > 0) {
      return stations
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .slice(0, 8)
        .map((s, i) => ({
          id:   (s.name || s.id || '').toLowerCase(),
          name: s.name || `Station ${i + 1}`,
          _raw: s,
        }));
    }
    return FALLBACK_STATIONS.map(s => ({ id: s.id, name: s.name }));
  }, [stations]);

  // Assign staff to stations
  function getAssignedStaff(stationId, stationName) {
    return staff.find(s =>
      (s.station || '').toLowerCase().includes(stationId) ||
      (s.station || '').toLowerCase().includes((stationName || '').toLowerCase()) ||
      (s.position || '').toLowerCase().includes(stationId)
    );
  }

  // Needs Attention list
  const attentionItems = useMemo(() => {
    const items = [];
    if (belowParItems.length > 0) {
      const stationsAffected = new Set(belowParItems.map(i => i.station).filter(Boolean)).size;
      items.push({
        id: 'below_par',
        icon: TrendingDown,
        color: 'text-red-400',
        title: `${belowParItems.length} item${belowParItems.length !== 1 ? 's' : ''} below par`,
        sub:   stationsAffected > 0 ? `Across ${stationsAffected} station${stationsAffected !== 1 ? 's' : ''}` : 'Check par levels',
        action: 'Review',
        onAction: () => todayPlan ? navigate(`/prep-plan/${todayPlan.id}`) : toast.info('Submit a count to generate a plan'),
      });
    }
    if (!todayCount) {
      items.push({
        id: 'no_count',
        icon: AlertCircle,
        color: 'text-amber-400',
        title: 'Count not started',
        sub:   'Start count to generate prep plan',
        action: 'Start Count',
        onAction: startCount,
      });
    }
    if (todayEvents.length > 0) {
      const evt = todayEvents[0];
      items.push({
        id: 'beo',
        icon: CalendarClock,
        color: 'text-blue-400',
        title: `${todayEvents.length} BEO${todayEvents.length !== 1 ? 's' : ''} today`,
        sub:   evt.guestCount ? `${evt.guestCount} guests at ${evt.startTime || 'TBD'}` : evt.eventName,
        action: 'View Details',
        onAction: () => navigate('/reservations-beos'),
      });
    }
    if (openReceiving.length > 0) {
      items.push({
        id: 'receiving',
        icon: AlertTriangle,
        color: 'text-amber-400',
        title: `${openReceiving.length} receiving issue${openReceiving.length !== 1 ? 's' : ''} open`,
        sub:   'Vendor shortages may affect prep',
        action: 'Review',
        onAction: () => navigate('/receiving'),
      });
    }
    return items;
  }, [belowParItems, todayCount, todayEvents, openReceiving, todayPlan]);

  // ── Access denied ────────────────────────────────────────────────────────────

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-bold text-foreground">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-1">
            Available to admins, managers, chefs, and kitchen leads.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent"
        style={{ boxShadow: '0 0 20px rgba(230,106,31,0.35)' }}
      />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading prep data…</p>
    </div>
  );

  // ── Actions config ──────────────────────────────────────────────────────────
  const ACTIONS = [
    {
      icon: ClipboardList, label: 'Review Plan', sub: 'View and adjust your prep plan',
      color: 'text-blue-400', border: 'border-blue-500/25', bg: 'rgba(96,165,250,0.06)',
      onClick: () => { haptics.light(); todayPlan ? navigate(`/prep-plan/${todayPlan.id}`) : toast.info('No plan yet — submit a count first'); },
    },
    {
      icon: FileStack, label: 'Templates', sub: 'Manage prep templates and production guides',
      color: 'text-primary', border: 'border-primary/25', bg: 'rgba(230,106,31,0.06)',
      onClick: () => { haptics.light(); navigate('/prep-plan-templates'); },
    },
    {
      icon: Settings, label: 'Bulk Edit Pars', sub: 'Update par levels across items',
      color: 'text-teal-400', border: 'border-teal-500/25', bg: 'rgba(20,184,166,0.06)',
      onClick: () => { haptics.light(); setBulkEditOpen(true); },
    },
    {
      icon: BookOpen, label: 'Prep Items', sub: 'Manage items, recipes, and build cards',
      color: 'text-green-400', border: 'border-green-500/25', bg: 'rgba(34,197,94,0.06)',
      onClick: () => { haptics.light(); navigate('/tasks?tab=prep'); },
    },
    {
      icon: Upload, label: 'Import Prep List', sub: 'Import from PDF, CSV, or vendor list',
      color: 'text-amber-400', border: 'border-amber-500/25', bg: 'rgba(245,158,11,0.06)',
      onClick: () => { haptics.light(); navigate('/prep-plan-templates/new'); },
    },
    {
      icon: Zap, label: 'Generated Tasks', sub: 'View and assign prep tasks',
      color: 'text-primary', border: 'border-primary/20', bg: 'rgba(230,106,31,0.05)',
      onClick: () => { haptics.light(); navigate('/tasks?tab=prep'); },
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app-screen">
      <DesktopPageHeader title="Prep Planning" subtitle="Plan production and set par levels" />

      <div className="app-page lg:!pt-4">

        {/* ── MOBILE ONLY ───────────────────────────────────────────────── */}
        <div className="lg:hidden px-1 pt-2 pb-8 space-y-5">

          {/* Date pill */}
          <div
            className="flex items-center gap-1.5 rounded-full border border-border/40 px-3 py-1.5 w-fit"
            style={cardBg}
          >
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[12px] font-semibold text-muted-foreground">{dayLabel}</span>
          </div>

          {/* Start Count hero card */}
          <div
            className="rounded-2xl p-4 space-y-4"
            style={{
              background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)',
              border: '1px solid rgba(230,106,31,0.35)',
              boxShadow: '0 0 24px rgba(230,106,31,0.08)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[11px] text-muted-foreground font-medium">Today's prep count</p>
                <h2 className="text-[22px] font-black text-foreground leading-tight">Start Count</h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Count today's par levels to generate prep tasks.
                </p>
              </div>
              <div
                className="h-11 w-11 rounded-full shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(230,106,31,0.15)', border: '1px solid rgba(230,106,31,0.3)' }}
              >
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
            </div>
            <button
              onClick={startCount}
              className="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-[15px] font-black text-white active:scale-[0.97] transition-all"
              style={{
                background: 'linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)',
                boxShadow: '0 0 0 1px rgba(230,106,31,0.35), 0 0 20px rgba(230,106,31,0.18)',
              }}
            >
              <Zap className="h-4 w-4" />
              Start Count
            </button>
          </div>

          {/* Today's Overview */}
          <div className="space-y-3">
            <h2 className="text-[16px] font-black text-foreground">Today's Overview</h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-border/30 p-3 flex flex-col gap-2.5" style={cardBg}>
                <CheckCircle2 className={cn('h-5 w-5', belowParItems.length > 0 ? 'text-amber-400' : 'text-green-400')} />
                <div>
                  <p className="text-[20px] font-black text-foreground leading-none">{belowParItems.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Below Par</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/30 p-3 flex flex-col gap-2.5" style={cardBg}>
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[20px] font-black text-foreground leading-none">{todayTasks.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Tasks to Generate</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/30 p-3 flex flex-col gap-2.5" style={cardBg}>
                <Calendar className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-[20px] font-black text-foreground leading-none">
                    {todayEvents.length > 0 ? todayEvents.length : 'None'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">BEO Impact</p>
                </div>
              </div>
            </div>
          </div>

          {/* Station Prep Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-black text-foreground">Station Prep Status</h2>
              <button
                onClick={() => { haptics.light(); navigate('/operational-map'); }}
                className="text-[13px] font-bold text-primary"
              >
                View All
              </button>
            </div>
            <div className="rounded-2xl border border-border/30 overflow-hidden" style={cardBg}>
              {displayStations.map((station, i) => {
                const sc   = STATION_COLORS[i % STATION_COLORS.length];
                const Icon = STATION_ICONS[i % STATION_ICONS.length];
                const bp   = belowParByStation[(station.id || '').toLowerCase()] || 0;
                const tsk  = tasksByStation[(station.id || '').toLowerCase()] || 0;
                const bad  = bp > 0 || tsk > 0;
                return (
                  <button
                    key={station.id}
                    onClick={() => { haptics.light(); navigate('/operational-map'); }}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-3.5 text-left active:bg-white/[0.03] transition-colors',
                      i > 0 && 'border-t border-border/20'
                    )}
                  >
                    <div className={cn('h-9 w-9 rounded-full flex items-center justify-center shrink-0', sc.bg)}>
                      <Icon className={cn('h-[18px] w-[18px]', sc.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-foreground">{station.name}</p>
                      <p className="text-[12px] text-muted-foreground">{bp} below par • {tsk} tasks</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <span className={cn('text-[12px] font-semibold', bad ? 'text-primary' : 'text-green-400')}>
                        {bad ? 'Needs Attention' : 'On Track'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── DESKTOP ONLY ──────────────────────────────────────────────── */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_290px] lg:gap-5">

          {/* ══ LEFT: Main content ══════════════════════════════════════════ */}
          <div className="space-y-4">

            {/* Today's Status — 5 cards */}
            <section>
              <p className="metric-label px-1 mb-2">Today's Status</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">

                {/* Count */}
                <StatusCard
                  label="Count"
                  value={todayCount ? 'Submitted' : 'Not Done'}
                  sub={todayCount ? `${todayCount.shift || ''} shift` : 'No count today yet'}
                  icon={todayCount ? CheckCircle2 : AlertCircle}
                  iconClass={todayCount ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}
                  border={todayCount ? 'border-green-500/30' : 'border-amber-500/30'}
                  bg={todayCount ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)'}
                  action={!todayCount ? {
                    label: 'Start Count', icon: Zap,
                    onClick: startCount,
                    className: 'border-amber-500/30 text-amber-400',
                    style: { background: 'rgba(245,158,11,0.08)' },
                  } : {
                    label: 'View', icon: ArrowRight,
                    onClick: () => navigate(`/prep-count/${todayCount.id}`),
                    className: 'border-green-500/25 text-green-400',
                    style: { background: 'rgba(34,197,94,0.06)' },
                  }}
                />

                {/* Prep Plan */}
                <StatusCard
                  label="Prep Plan"
                  value={todayPlan ? 'Ready' : 'Pending'}
                  sub={todayPlan ? `Status: ${todayPlan.status}` : 'Generate a plan after your count is complete.'}
                  icon={todayPlan ? CheckCircle2 : Clock}
                  iconClass={todayPlan ? 'bg-blue-500/15 text-blue-400' : 'bg-border/20 text-muted-foreground/40'}
                  border={todayPlan ? 'border-blue-500/30' : 'border-border/40'}
                  bg={todayPlan ? 'rgba(96,165,250,0.06)' : 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)'}
                  action={todayPlan ? {
                    label: 'Review Plan', icon: ArrowRight,
                    onClick: () => navigate(`/prep-plan/${todayPlan.id}`),
                    className: 'border-blue-500/25 text-blue-400',
                    style: { background: 'rgba(96,165,250,0.06)' },
                  } : undefined}
                />

                {/* Below Par */}
                <StatusCard
                  label="Below Par"
                  value={belowParItems.length > 0 ? `${belowParItems.length} Items` : '0 Items'}
                  sub={belowParItems.length > 0 ? `Across ${new Set(belowParItems.map(i => i.station).filter(Boolean)).size || '—'} stations` : 'All items at par'}
                  icon={belowParItems.length > 0 ? TrendingDown : CheckCircle2}
                  iconClass={belowParItems.length > 0 ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}
                  border={belowParItems.length > 0 ? 'border-red-500/25' : 'border-border/40'}
                  bg={belowParItems.length > 0 ? 'rgba(239,68,68,0.05)' : 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)'}
                  action={belowParItems.length > 0 ? {
                    label: 'View Details', icon: ArrowRight,
                    onClick: () => todayPlan ? navigate(`/prep-plan/${todayPlan.id}`) : toast.info('Submit a count to see par details'),
                    className: 'border-red-500/25 text-red-400',
                    style: { background: 'rgba(239,68,68,0.05)' },
                  } : undefined}
                />

                {/* Tasks Generated */}
                <StatusCard
                  label="Tasks Generated"
                  value={todayTasks.length > 0 ? `${todayTasks.length}` : '0'}
                  sub={todayTasks.length > 0 ? 'Tasks across stations' : 'No tasks yet'}
                  icon={todayTasks.length > 0 ? Zap : ClipboardList}
                  iconClass={todayTasks.length > 0 ? 'bg-primary/15 text-primary' : 'bg-border/20 text-muted-foreground/40'}
                  border={todayTasks.length > 0 ? 'border-primary/25' : 'border-border/40'}
                  bg="linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)"
                />

                {/* BEO / Event Impact */}
                <StatusCard
                  label="BEO / Event Impact"
                  value={todayEvents.length > 0 ? `${todayEvents.length} Event${todayEvents.length !== 1 ? 's' : ''}` : 'None Today'}
                  sub={todayGuestTotal > 0 ? `${todayGuestTotal} guests · ${todayEvents[0]?.eventName || 'Dinner'}` : todayEvents.length > 0 ? todayEvents[0]?.eventName : 'No events today'}
                  icon={CalendarClock}
                  iconClass={todayEvents.length > 0 ? 'bg-cyan-500/15 text-cyan-400' : 'bg-border/20 text-muted-foreground/40'}
                  border={todayEvents.length > 0 ? 'border-cyan-500/25' : 'border-border/40'}
                  bg={todayEvents.length > 0 ? 'rgba(6,182,212,0.05)' : 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)'}
                  action={todayEvents.length > 0 ? {
                    label: 'View Details', icon: ArrowRight,
                    onClick: () => navigate('/reservations-beos'),
                    className: 'border-cyan-500/25 text-cyan-400',
                    style: { background: 'rgba(6,182,212,0.05)' },
                  } : undefined}
                />
              </div>
            </section>

            {/* Station Prep Status */}
            <section>
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="metric-label">Station Prep Status</p>
                <button
                  onClick={() => { haptics.light(); navigate('/operational-map'); }}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  View Station Breakdown <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {displayStations.length === 0 ? (
                <div className="rounded-2xl border border-border/30 py-8 text-center" style={cardBg}>
                  <Store className="h-6 w-6 text-muted-foreground/25 mx-auto mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">No stations configured</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Set up kitchen stations to see status here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2">
                  {displayStations.map((station, i) => (
                    <StationCard
                      key={station.id}
                      station={station}
                      index={i}
                      belowPar={belowParByStation[(station.id || station.name || '').toLowerCase()] || 0}
                      tasks={tasksByStation[(station.id || station.name || '').toLowerCase()] || 0}
                      assigned={getAssignedStaff(station.id, station.name)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Actions */}
            <section>
              <p className="metric-label px-1 mb-2">Actions</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACTIONS.map(({ icon: Icon, label, sub, color, border, bg, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className={cn('flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left active:scale-[0.97] transition-all', border)}
                    style={{ background: bg, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                  >
                    <Icon className={cn('h-4 w-4', color)} />
                    <div>
                      <p className={cn('text-sm font-black', color)}>{label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Needs Attention + Tips */}
            <div className="grid sm:grid-cols-2 gap-3">

              {/* Needs Attention */}
              <section>
                <p className="metric-label px-1 mb-2">Needs Attention</p>
                {attentionItems.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 px-4 py-3.5" style={{ background: 'rgba(34,197,94,0.05)' }}>
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm font-black text-green-400">All clear</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">No prep issues detected.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attentionItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/40 px-3.5 py-3"
                        style={cardBg}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <item.icon className={cn('h-3.5 w-3.5 shrink-0', item.color)} />
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-foreground truncate">{item.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{item.sub}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => { haptics.light(); item.onAction(); }}
                          className="shrink-0 flex items-center gap-0.5 text-[11px] font-black text-primary hover:text-primary/80 transition-colors"
                        >
                          {item.action} <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Prep Tips */}
              <section>
                <p className="metric-label px-1 mb-2">Prep Planning Tips</p>
                <div className="rounded-2xl border border-border/40 overflow-hidden" style={cardBg}>
                  {[
                    { icon: Clock,    title: 'Start your count early',    sub: 'Counting early gives you more time to prep and adjust.' },
                    { icon: BarChart3, title: 'Check your pars',          sub: 'Par levels drive accurate prep planning and waste control.' },
                    { icon: Calendar, title: 'Review BEO details',        sub: 'BEOs impact prep quantities and timing.' },
                  ].map(({ icon: Icon, title, sub }, i) => (
                    <div key={i} className={cn('flex items-start gap-3 px-4 py-3', i > 0 && 'border-t border-border/20')}>
                      <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-foreground">{title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* Footer breadcrumb */}
            <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40 px-1 pb-1">
              <Zap className="h-3 w-3" />
              Prep Planning connects your counts, pars, events, and stations to help your team prep smarter and serve better.
            </p>

          </div>

          {/* ══ RIGHT: Sidebar ═══════════════════════════════════════════════ */}
          <div className="space-y-4">

            {/* Recent Sessions */}
            <section>
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="metric-label">Recent Sessions</p>
                {countSessions.length > 0 && (
                  <button
                    onClick={() => { haptics.light(); navigate('/prep-count'); }}
                    className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    View All
                  </button>
                )}
              </div>

              {countSessions.length === 0 ? (
                <div className="rounded-2xl border border-border/30 p-5 text-center" style={cardBg}>
                  <ChefHat className="h-7 w-7 text-muted-foreground/20 mx-auto mb-2.5" />
                  <p className="text-sm font-black text-foreground">No prep sessions yet</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Start a count to compare on-hand amounts against par levels and generate station prep tasks.
                  </p>
                  <button
                    onClick={startCount}
                    className="mt-3.5 flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-black text-white active:scale-[0.97] transition-all"
                    style={{
                      background: 'linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)',
                      boxShadow: '0 0 0 1px rgba(230,106,31,0.35), 0 0 12px rgba(230,106,31,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                  >
                    <Zap className="h-3.5 w-3.5" /> Start Count
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {countSessions.slice(0, 6).map(session => {
                    const itemCount  = (session.items || []).length;
                    const sessionFmt = fmtSession(session);
                    const countedBy  = session.counted_by || session.created_by || 'Unknown';
                    return (
                      <button
                        key={session.id}
                        onClick={() => { haptics.light(); navigate(`/prep-count/${session.id}`); }}
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border/40 px-3 py-2.5 text-left active:scale-[0.98] transition-all hover:border-border/60"
                        style={cardBg}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-foreground truncate">{sessionFmt}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{countedBy}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {itemCount > 0 && (
                            <div className="text-right">
                              <p className="text-[11px] font-black text-foreground">{itemCount}</p>
                              <p className="text-[9px] text-muted-foreground">counted</p>
                            </div>
                          )}
                          <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                        </div>
                      </button>
                    );
                  })}
                  {countSessions.length > 6 && (
                    <button
                      onClick={() => navigate('/prep-count')}
                      className="w-full rounded-xl border border-border/30 py-2.5 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:border-border/50 transition-all"
                      style={cardBg}
                    >
                      View All Sessions
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Smart Inputs */}
            <section>
              <p className="metric-label px-1 mb-2">Smart Inputs</p>
              <div className="rounded-2xl border border-border/40 px-4 py-1" style={cardBg}>
                <SmartInputRow
                  icon={Calendar}
                  label="Reservations"
                  value={todayGuestTotal > 0 ? `${todayGuestTotal} covers today` : 'No cover data'}
                  status={todayGuestTotal > 0 ? 'ok' : 'none'}
                />
                <SmartInputRow
                  icon={CalendarClock}
                  label="BEOs / Events"
                  value={todayEvents.length > 0 ? `${todayEvents.length} event${todayEvents.length !== 1 ? 's' : ''} · ${todayGuestTotal} guests` : 'No events today'}
                  status={todayEvents.length > 0 ? 'ok' : 'none'}
                />
                <SmartInputRow
                  icon={Flame}
                  label="86 / Out of Stock"
                  value={eightySix.length > 0 ? `${eightySix.length} item${eightySix.length !== 1 ? 's' : ''}` : 'Nothing 86\'d'}
                  status={eightySix.length > 0 ? 'warning' : 'ok'}
                />
                <SmartInputRow
                  icon={BarChart3}
                  label="Par Levels"
                  value={templates.length > 0 ? 'All stations set' : 'Not configured'}
                  status={templates.length > 0 ? 'ok' : 'warning'}
                />
                <SmartInputRow
                  icon={ClipboardCheck}
                  label="Previous Count"
                  value={lastSession ? fmtSession(lastSession) || 'Available' : 'No sessions yet'}
                  status={lastSession ? 'ok' : 'none'}
                />
                <SmartInputRow
                  icon={Store}
                  label="Receiving"
                  value={openReceiving.length > 0 ? `${openReceiving.length} item${openReceiving.length !== 1 ? 's' : ''} shorted` : 'No open issues'}
                  status={openReceiving.length > 0 ? 'warning' : 'ok'}
                />
                <SmartInputRow
                  icon={TrendingDown}
                  label="Business Level"
                  value={
                    todayGuestTotal > 100 ? 'High' :
                    todayGuestTotal > 50  ? 'Moderate' :
                    todayGuestTotal > 0   ? 'Light' :
                    'Not set'
                  }
                  status={todayGuestTotal > 0 ? 'ok' : 'none'}
                />
                <SmartInputRow
                  icon={ClipboardList}
                  label="Handoff Notes"
                  value={handoffs.length > 0 ? `${handoffs.length} note${handoffs.length !== 1 ? 's' : ''} to review` : 'No recent notes'}
                  status={handoffs.length > 0 ? 'warning' : 'none'}
                />
              </div>
              {(templates.length > 0 || lastSession) && (
                <button
                  onClick={() => { haptics.light(); navigate('/prep-plan-templates'); }}
                  className="mt-2 w-full rounded-xl border border-border/30 py-2 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:border-border/50 transition-all"
                  style={cardBg}
                >
                  View All Inputs
                </button>
              )}
            </section>

          </div>
        </div>
      </div>

      {bulkEditOpen && (
        <BulkParEditorModal
          station="Prep"
          shift="opening"
          onClose={() => setBulkEditOpen(false)}
          onSave={loadData}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;
