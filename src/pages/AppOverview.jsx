import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import {
  Activity,
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Flame,
  Radio,
  Rocket,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';

function useLiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function LiveClock() {
  const time = useLiveClock();
  const hours = time.getHours();
  const period = hours >= 12 ? 'PM' : 'AM';
  const display = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const meal = hours < 11 ? 'Breakfast' : hours < 15 ? 'Lunch service' : hours < 17 ? 'Mid-shift' : 'Dinner service';
  return (
    <div className="text-right">
      <p className="text-base font-black tabular-nums text-foreground">{display}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{meal}</p>
    </div>
  );
}
import { cn } from '@/lib/utils';
import TaskVisual from '@/components/TaskVisual';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import ApprovalDetailSheet from '@/components/approval/ApprovalDetailSheet';
import DenialReasonDrawer from '@/components/approval/DenialReasonDrawer';
import ClearBurst from '@/components/approval/ClearBurst';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const PREP_IMAGES = {
  ranch: '/demo-prep/ranch.svg',
  pico: '/demo-prep/pico.svg',
  romaine: '/demo-prep/romaine.svg',
  guac: '/demo-prep/guacamole.svg',
};

function demoPhotoFor(name = '') {
  const n = name.toLowerCase();
  if (n.includes('ranch')) return PREP_IMAGES.ranch;
  if (n.includes('pico') || n.includes('salsa')) return PREP_IMAGES.pico;
  if (n.includes('romaine') || n.includes('lettuce')) return PREP_IMAGES.romaine;
  if (n.includes('guac')) return PREP_IMAGES.guac;
  return null;
}

const APPROVAL_QUEUE_TYPES = {
  temperature_log: 'temperature',
  prep_completion: 'prep',
  maintenance_request: 'maintenance',
  incident_report: 'employee',
  waste_log: 'waste',
  shift_handoff: 'employee',
  task_exception: 'employee',
};

const safeFilter = (entity, filter, sort, limit) => (
  entity?.filter?.(filter, sort, limit)?.catch?.(() => []) || Promise.resolve([])
);

// Simple in-memory cache to prevent rate-limit bursts on re-mounts
const _metricsCache = { data: null, ts: 0 };
const CACHE_TTL_MS = 30_000; // 30 seconds

function normalizeApprovalQueueItem(item) {
  const type = APPROVAL_QUEUE_TYPES[item.submission_type] || 'employee';

  return {
    ...item,
    approval_type: type,
    sourceModule: 'ApprovalQueue',
    sourceId: item.id,
    title: item.summary || 'Approval request',
    description: item.summary || '',
    name: item.summary || 'Approval request',
    created_by: item.submitted_by_name || item.submitted_by_email,
    created_date: item.submitted_at,
    location: item.location || item.station_name,
  };
}

function uniqueApprovals(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.sourceModule}:${item.sourceId || item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function PulseRing({ value }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative h-44 w-44 shrink-0">
      <svg className="h-44 w-44 -rotate-90" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          className="transition-all duration-700"
          style={{ filter: 'drop-shadow(0 0 16px rgba(255, 107, 0, 0.32))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tracking-tight text-foreground">{value}%</span>
        <span className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Stations</span>
      </div>
    </div>
  );
}

function PrepCard({ item }) {
  return (
    <Link to="/tasks?tab=prep" className="glow-interactive relative h-44 w-[154px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card">
      <TaskVisual type="prep" name={item.name} imageUrl={item.image} className="h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
      <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
        <span className={cn('status-marker status-marker-md', item.statusClass)}>{item.progress}%</span>
        <span className="rounded-full bg-black/45 px-2 py-1 text-[10px] font-black text-white/85 backdrop-blur-sm">{item.due}</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <p className="truncate text-base font-black tracking-tight text-white">{item.name}</p>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/70">
          <UserRound className="h-3 w-3" />
          <span className="truncate">{item.assignee}</span>
        </div>
      </div>
    </Link>
  );
}

function ActionRow({ item }) {
  const Icon = item.icon;
  return (
    <Link to={item.href} className="liquid-card liquid-card-interactive flex items-center gap-3 px-4 py-3">
      <span className={cn('status-marker status-marker-md shrink-0', item.statusClass)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black tracking-tight text-foreground">{item.label}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.detail}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function GlanceRow({ icon: Icon, label, value, detail, href, progress, valueColor }) {
  return (
    <Link to={href} className="ops-row group">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {detail && <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>}
        {progress !== undefined && (
          <div className="mt-1.5 h-1 bg-muted/60 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </div>
        )}
      </div>
      <span className={cn('text-sm font-black', valueColor || 'text-foreground')}>{value}</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}


const SWIPE_TYPE_MAP = {
  prep:        { label: 'Prep Change',       statusClass: 'status-warning'  },
  temperature: { label: 'Temperature Alert', statusClass: 'status-info'     },
  maintenance: { label: 'Maintenance',       statusClass: 'status-warning'  },
  employee:    { label: 'Employee Log',      statusClass: 'status-info'     },
  waste:       { label: 'Waste / 86',        statusClass: 'status-critical' },
  schedule:    { label: 'Schedule',          statusClass: 'status-info'     },
  timeoff:     { label: 'Time Off',          statusClass: 'status-success'  },
  trade:       { label: 'Shift Trade',       statusClass: 'status-info'     },
};

function SwipeApprovalCard({ approval, index, total, onApprove, onDeny, onViewDetails }) {
  const [drag, setDrag] = useState(0);

  const type = SWIPE_TYPE_MAP[approval.approval_type] || { label: 'Review', statusClass: 'status-info' };
  const title = approval.name || approval.title || approval.summary || type.label;
  const subtitle = approval.description || approval.summary || '';
  const statusClass = approval.priority === 'high' ? 'status-critical' : type.statusClass;

  const imageUrl = [
    approval.photo_url, approval.completion_photo_url, approval.image_url, approval.master_photo_url,
  ].find(v => typeof v === 'string' && v.trim()) || '';

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 60 || info.velocity.x > 500) onApprove?.();
    else if (info.offset.x < -60 || info.velocity.x < -500) onDeny?.();
    setDrag(0);
  };

  const showApproveStamp = drag > 40;
  const showDenyStamp = drag < -40;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Direction hints */}
      <div className="flex shrink-0 items-center justify-between">
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest transition-all duration-150',
          showDenyStamp ? 'bg-red-500/25 text-red-300' : 'text-muted-foreground/35'
        )}>
          <X className="h-3 w-3" /> Send Back
        </div>
        <span className="text-[11px] font-bold text-muted-foreground">{index} of {total}</span>
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest transition-all duration-150',
          showApproveStamp ? 'bg-green-500/25 text-green-300' : 'text-muted-foreground/35'
        )}>
          Approve <Check className="h-3 w-3" />
        </div>
      </div>

      {/* Tinder card — full bleed, no background */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        dragMomentum={false}
        onDrag={(_, info) => setDrag(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        style={{ rotate: drag * 0.032 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="relative flex-1 touch-pan-y cursor-grab overflow-hidden rounded-3xl active:cursor-grabbing"
      >
        <TaskVisual type="task" name={title} imageUrl={imageUrl} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/10" />

        {/* Color tint on swipe */}
        <div className={cn(
          'absolute inset-0 rounded-3xl transition-colors duration-100',
          showApproveStamp ? 'bg-green-500/12' : showDenyStamp ? 'bg-red-500/12' : ''
        )} />

        {/* Tinder stamps */}
        {showApproveStamp && (
          <div className="absolute left-6 top-10 -rotate-12 rounded-2xl px-4 py-2"
            style={{ border: '3px solid rgba(74,222,128,0.45)' }}>
            <span className="text-lg font-black uppercase tracking-[0.18em] text-green-400">Approve</span>
          </div>
        )}
        {showDenyStamp && (
          <div className="absolute right-6 top-10 rotate-12 rounded-2xl px-4 py-2"
            style={{ border: '3px solid rgba(248,113,113,0.85)' }}>
            <span className="text-lg font-black uppercase tracking-[0.18em] text-red-400">Deny</span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <span className={cn('status-pill bg-black/50 backdrop-blur-sm', statusClass)}>{type.label}</span>
          {imageUrl && (
            <div className="flex items-center gap-1 rounded-full bg-green-500/25 px-2.5 py-1 backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3 text-green-400" />
              <span className="text-[10px] font-black text-green-300">Verified</span>
            </div>
          )}
        </div>

        {/* Bottom content overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-20">
          <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-5 text-white/65">{subtitle}</p>}
          {approval.submitted_by_name && (
            <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/45">
              From {approval.submitted_by_name}
            </p>
          )}
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="grid shrink-0 grid-cols-2 gap-3">
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onDeny}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-extrabold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 transition-all active:scale-[0.97]"
        >
          <X className="h-4 w-4" /> Send Back
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onApprove}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-extrabold text-green-400 border border-green-500/30 bg-green-500/15 hover:bg-green-500/20 transition-all active:scale-[0.97]"
        >
          <Check className="h-4 w-4" /> Approve
        </button>
      </div>
    </div>
  );
}

export default function AppOverview() {
  const { user, isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [processedApprovals, setProcessedApprovals] = useState(0);
  const [denialDrawer, setDenialDrawer] = useState(null);
  const [detailSheet, setDetailSheet] = useState(null);
  const [showBurst, setShowBurst] = useState(false);
  const [metrics, setMetrics] = useState({
    completedTasks: 0,
    totalTasks: 0,
    pendingApprovals: 0,
    openAlerts: 0,
    equipmentIssues: 0,
  });
  const [loading, setLoading] = useState(true);
  const [livePrepQueue, setLivePrepQueue] = useState([]);
  const [liveActivity, setLiveActivity] = useState([]);
  const [setupProgress, setSetupProgress] = useState(null);
  const [setupDismissed, setSetupDismissed] = useState(() => {
    try { return sessionStorage.getItem('setup_banner_dismissed') === 'true'; } catch { return false; }
  });
  const [showApprovalDeck, setShowApprovalDeck] = useState(false);

  useEffect(() => {
    // Wait until isAdmin is resolved (not undefined) before fetching
    if (isAdmin === undefined || isAdmin === null) return;
    const init = async () => {
      await loadMetrics();
      if (isAdmin) await loadSetupProgress();
    };
    init();
  }, [isAdmin]);

  const loadSetupProgress = async () => {
    try {
      const [stations, employees, roles] = await Promise.all([
        base44.entities.Station.list('name', 1).catch(() => []),
        base44.entities.Employee.list('name', 1).catch(() => []),
        base44.entities.Role.list('name', 1).catch(() => []),
      ]);
      const checks = [
        { label: 'Areas & Stations', done: stations.length >= 3, link: '/restaurant-setup-wizard' },
        { label: 'Team Members', done: employees.length >= 3, link: '/people' },
        { label: 'Roles', done: roles.length >= 4, link: '/team-structure-wizard' },
      ];
      const completedCount = checks.filter(c => c.done).length;
      if (completedCount < checks.length) {
        setSetupProgress({ checks, completedCount, total: checks.length });
      }
    } catch { /* silent */ }
  };

  const loadMetrics = async () => {
    // Return cached data if fresh enough
    if (_metricsCache.data && Date.now() - _metricsCache.ts < CACHE_TTL_MS) {
      const c = _metricsCache.data;
      setApprovalQueue(c.approvalQueue);
      setMetrics(c.metrics);
      setLivePrepQueue(c.prepQueue);
      setLiveActivity(c.activity);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [approvals, prepItems, tasks, recentLogs] = await Promise.all([
        safeFilter(base44.entities.ApprovalQueue, { status: 'pending' }, '-submitted_at', 30),
        safeFilter(base44.entities.PrepItem, {}, '-updated_date', 20),
        safeFilter(base44.entities.GeneratedTask, {}, '-updated_date', 30),
        base44.entities.UnifiedLog?.list?.('-created_date', 10).catch(() => []),
      ]);

      const pendingPrep = (prepItems || []).filter(p => p.status === 'pending_review');

      const allApprovals = uniqueApprovals([
        ...(approvals || []).map(normalizeApprovalQueueItem),
        ...(pendingPrep).map(p => ({ ...p, approval_type: 'prep', sourceModule: 'PrepItem', sourceId: p.id, photo_url: p.photo_url || demoPhotoFor(p.name) })),
      ]);

      const completed = (tasks || []).filter((task) => task.status === 'completed').length;
      const total = (tasks || []).length;
      const overdue = (tasks || []).filter(t => t.status === 'overdue').length;

      setApprovalQueue(allApprovals);
      setMetrics({
        completedTasks: completed,
        totalTasks: total,
        pendingApprovals: allApprovals.length,
        openAlerts: overdue,
        equipmentIssues: overdue,
      });

      const prepQueue = (prepItems || [])
        .filter(p => p.status !== 'completed' && p.status !== 'approved')
        .slice(0, 5)
        .map(p => ({
          name: p.name || 'Prep item',
          assignee: p.assigned_to_name || p.assigned_employee_name || '—',
          due: p.due_time || p.due_by || '',
          progress: p.quantity ? Math.round(((p.completed_qty || 0) / p.quantity) * 100) : 0,
          statusClass: p.status === 'overdue' ? 'status-critical' : p.status === 'in_progress' ? 'status-info' : 'status-warning',
          image: demoPhotoFor(p.name),
        }));
      setLivePrepQueue(prepQueue);

      const activity = (recentLogs || []).slice(0, 5).map(log => ({
        label: log.summary || log.title || log.log_type || 'Activity',
        time: log.created_date ? new Date(log.created_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
        statusClass: log.severity === 'critical' ? 'status-critical' : log.severity === 'warning' ? 'status-warning' : 'status-success',
      }));
      setLiveActivity(activity);

      // Cache results
      _metricsCache.data = { approvalQueue: allApprovals, metrics: { completedTasks: completed, totalTasks: total, pendingApprovals: allApprovals.length, openAlerts: overdue, equipmentIssues: overdue }, prepQueue, activity };
      _metricsCache.ts = Date.now();
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
    setLoading(false);
  };

  const currentApproval = approvalQueue[0];

  const handleApprove = async (specificApproval) => {
    const approval = specificApproval || currentApproval;
    if (!approval) return;

    try {
      const now = new Date().toISOString();
      const moduleName = approval.sourceModule;
      const updateData = moduleName === 'ApprovalQueue'
        ? { status: 'approved', approved_by_email: user?.email || user?.created_by || 'current_user', approved_at: now }
        : { status: 'completed', approval_status: 'approved', approved_by: user?.email || 'current_user', approved_at: now };

      await base44.entities[moduleName]?.update?.(approval.sourceId, updateData);
      const remaining = approvalQueue.filter((item) => `${item.sourceModule}:${item.sourceId}` !== `${approval.sourceModule}:${approval.sourceId}`);
      setApprovalQueue(remaining);
      setProcessedApprovals((count) => count + 1);
      setMetrics((current) => ({ ...current, pendingApprovals: Math.max(current.pendingApprovals - 1, 0) }));
      setDetailSheet(null);
      if (remaining.length === 0) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.55 }, colors: ['#22c55e', '#4ade80', '#86efac', '#FF6B00', '#FCD34D'] });
        setShowBurst(true);
        setShowApprovalDeck(false);
        setTimeout(() => setShowBurst(false), 1100);
      } else {
        toast.success('Approved');
      }
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleDenialSubmit = async (reason, notes) => {
    const approval = denialDrawer?.approval || currentApproval;
    if (!approval) return;

    try {
      const now = new Date().toISOString();
      const moduleName = approval.sourceModule;
      const updateData = moduleName === 'ApprovalQueue'
        ? { status: 'denied', approved_by_email: user?.email || user?.created_by || 'current_user', approved_at: now, denial_reason: [reason, notes].filter(Boolean).join(': ') }
        : { status: 'denied', approval_status: 'denied', denied_by: user?.email || 'current_user', denied_at: now, denial_reason: reason, denial_notes: notes };

      await base44.entities[moduleName]?.update?.(approval.sourceId, updateData);
      const remaining = approvalQueue.filter((item) => `${item.sourceModule}:${item.sourceId}` !== `${approval.sourceModule}:${approval.sourceId}`);
      setApprovalQueue(remaining);
      setProcessedApprovals((count) => count + 1);
      setMetrics((current) => ({ ...current, pendingApprovals: Math.max(current.pendingApprovals - 1, 0) }));
      setDenialDrawer(null);
      setDetailSheet(null);
      if (remaining.length === 0) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.55 }, colors: ['#22c55e', '#4ade80', '#86efac', '#FF6B00', '#FCD34D'] });
        setShowBurst(true);
        setShowApprovalDeck(false);
        setTimeout(() => setShowBurst(false), 1100);
      } else {
        toast.success('Sent back');
      }
    } catch (err) {
      toast.error('Failed to send back approval');
    }
  };

  const hasLiveSignals = metrics.totalTasks > 0 || metrics.pendingApprovals > 0 || metrics.openAlerts > 0 || metrics.equipmentIssues > 0;
  const completedPercent = metrics.totalTasks > 0 ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) : 0;
  const readiness = hasLiveSignals ? Math.max(64, Math.min(94, completedPercent)) : 0;
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (readiness / 100) * ringCircumference;
  const overdueTasks = metrics.totalTasks > 0 ? Math.max(metrics.totalTasks - metrics.completedTasks, 0) : 0;
  const pendingApprovals = metrics.pendingApprovals;
  const issueCount = metrics.equipmentIssues || metrics.openAlerts || 0;
  const firstName = user?.first_name || user?.full_name?.split(' ')?.[0] || 'there';
  const hasApprovalQueue = approvalQueue.length > 0;

  const prepQueue = livePrepQueue;
  const activity = liveActivity;

  const taskPct = metrics.totalTasks > 0 ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) : 0;
  const behindPrep = livePrepQueue.filter(p => p.progress < 50);
  const dynamicActions = (() => {
    const items = [];
    if (overdueTasks > 0) items.push({ label: `${overdueTasks} overdue task${overdueTasks !== 1 ? 's' : ''}`, detail: 'Need completion before service', href: '/tasks', icon: AlertCircle, statusClass: 'status-critical' });
    if (pendingApprovals > 0) items.push({ label: `${pendingApprovals} approval${pendingApprovals !== 1 ? 's' : ''} waiting`, detail: 'Pending your review', href: '/app/overview', icon: ClipboardList, statusClass: 'status-warning' });
    if (issueCount > 0) items.push({ label: `${issueCount} open operational issue${issueCount !== 1 ? 's' : ''}`, detail: 'Requires attention', href: '/logs', icon: Wrench, statusClass: 'status-critical' });
    if (behindPrep.length > 0) items.push({ label: `${behindPrep.length} prep item${behindPrep.length !== 1 ? 's' : ''} behind`, detail: behindPrep.slice(0, 2).map(p => p.name).join(', '), href: '/tasks?tab=prep', icon: Flame, statusClass: 'status-warning' });
    if (items.length < 2) items.push({ label: 'Review prep queue', detail: `${livePrepQueue.length} active item${livePrepQueue.length !== 1 ? 's' : ''}`, href: '/tasks?tab=prep', icon: Flame, statusClass: 'status-info' });
    if (items.length < 2) items.push({ label: 'Check operational map', detail: 'Monitor stations and equipment', href: '/operational-map', icon: Clock3, statusClass: 'status-neutral' });
    return items.slice(0, 5);
  })();

  if (loading) {
    return (
      <div className="app-screen">
        <div className="ops-page ops-stack">
          <div className="pt-1 space-y-2">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-4 w-72" />
          </div>
          <div className="skeleton h-64 w-full rounded-2xl" />
          <div className="space-y-3">
            <div className="skeleton h-5 w-32" />
            {[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Dashboard" subtitle="Operations overview" />
      <div className="ops-page ops-stack">

        {/* Setup progress banner — admin only, hides when complete or dismissed */}
        {isAdmin && setupProgress && !setupDismissed && (
          <section className="liquid-card liquid-card-interactive flex items-center gap-4 px-4 py-3">
            <div className="ops-icon-box ops-icon-box-accent shrink-0">
              <Rocket className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                Setup {setupProgress.completedCount}/{setupProgress.total} complete
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 flex-1 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.round((setupProgress.completedCount / setupProgress.total) * 100)}%` }}
                  />
                </div>
                {setupProgress.checks.filter(c => !c.done).slice(0, 1).map(c => (
                  <button key={c.link} onClick={() => navigate(c.link)} className="text-[11px] font-bold text-primary whitespace-nowrap hover:underline">
                    Add {c.label} →
                  </button>
                ))}
                <button onClick={() => navigate('/setup-journey')} className="text-[11px] font-bold text-muted-foreground whitespace-nowrap hover:text-foreground">
                  Full checklist
                </button>
              </div>
            </div>
            <button
              onClick={() => { setSetupDismissed(true); try { sessionStorage.setItem('setup_banner_dismissed', 'true'); } catch {} }}
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </section>
        )}

        {/* ── Mobile layout ─────────────────────────────────────── */}
        <div className="space-y-3 lg:hidden">

          {/* Page title */}
          <div className="px-1 pb-1">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-[32px] font-black tracking-tight text-foreground leading-none mt-1">Today</h1>
          </div>

          {/* 1 ── Shift Pulse Card */}
          <section className="liquid-card flex items-center gap-4 px-4 py-4">
            {/* Pulse SVG icon */}
            <div className="shrink-0 h-[68px] w-[68px]">
              <svg viewBox="0 0 68 68" className="h-full w-full">
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i * 360) / 24;
                  const rad = (angle * Math.PI) / 180;
                  const isMajor = i % 6 === 0;
                  const isMid = i % 3 === 0;
                  const r1 = 32;
                  const r2 = isMajor ? 25 : isMid ? 27 : 28.5;
                  return (
                    <line
                      key={i}
                      x1={34 + r2 * Math.cos(rad)} y1={34 + r2 * Math.sin(rad)}
                      x2={34 + r1 * Math.cos(rad)} y2={34 + r1 * Math.sin(rad)}
                      stroke="#FF6B00"
                      strokeWidth={isMajor ? 2 : 1}
                      strokeLinecap="round"
                      opacity={isMajor ? 1 : isMid ? 0.7 : 0.4}
                    />
                  );
                })}
                {/* HeardOS logo — inline so it renders transparent */}
                <g style={{ filter: 'drop-shadow(0 0 2px rgba(255,107,0,0.3))' }}>
                  {/* Left dot */}
                  <circle cx="17" cy="34" r="1.8" fill="#FF6B00" />
                  {/* Left medium bar */}
                  <line x1="23" y1="27" x2="23" y2="41" stroke="#FF6B00" strokeWidth="3" strokeLinecap="round" />
                  {/* H left leg */}
                  <line x1="29" y1="22" x2="29" y2="46" stroke="#FF6B00" strokeWidth="3.5" strokeLinecap="round" />
                  {/* H crossbar */}
                  <line x1="29" y1="34" x2="39" y2="34" stroke="#FF6B00" strokeWidth="3.5" strokeLinecap="round" />
                  {/* H right leg */}
                  <line x1="39" y1="22" x2="39" y2="46" stroke="#FF6B00" strokeWidth="3.5" strokeLinecap="round" />
                  {/* Right medium bar */}
                  <line x1="45" y1="27" x2="45" y2="41" stroke="#FF6B00" strokeWidth="3" strokeLinecap="round" />
                  {/* Right dot */}
                  <circle cx="51" cy="34" r="1.8" fill="#FF6B00" />
                </g>
              </svg>
            </div>

            {/* Text + bar */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-black text-white leading-snug">
                Shift pulse: <span style={{ color: 'rgba(255,107,0,0.75)' }}>{readiness}%</span> on track
              </p>
              {/* Progress bar */}
              <div className="relative mt-2.5 h-2 rounded-full overflow-visible" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${readiness}%`, transition: 'width 0.7s ease' }}
                />
                <div
                  className="absolute top-1/2 h-3.5 w-3.5 rounded-full -translate-y-1/2 border-2 border-white bg-primary"
                  style={{ left: `calc(${readiness}% - 7px)`, transition: 'left 0.7s ease' }}
                />
              </div>
              {/* Meta */}
              <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                {issueCount > 0 ? `${issueCount} temp log${issueCount !== 1 ? 's' : ''} overdue` : 'Temp logs current'}
                {pendingApprovals > 0 ? ` · ${pendingApprovals} approval${pendingApprovals !== 1 ? 's' : ''} waiting` : ''}
              </p>
            </div>
          </section>

          {/* 2 ── 2×2 Metric Grid */}
          <section className="grid grid-cols-2 gap-3">

            {/* Shift Readiness */}
            <Link to="/operational-map" className="liquid-card p-4 flex flex-col gap-3 active:scale-[0.97] transition-transform">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Shift Readiness</span>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              </div>
              <div>
                <p className="text-[30px] font-black text-foreground leading-none">{readiness}%</p>
                <p className="text-[11px] text-muted-foreground mt-1">Ready</p>
              </div>
              {/* Segmented bar */}
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-1.5 flex-1 rounded-full"
                    style={{ background: i < Math.round(readiness / 10) ? '#FF6B00' : 'rgba(255,255,255,0.12)', boxShadow: i < Math.round(readiness / 10) ? '0 0 3px rgba(255,107,0,0.25)' : 'none' }} />
                ))}
              </div>
              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-1">
                <div className="rounded-2xl py-1.5 text-center bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-extrabold text-green-400">{metrics.completedTasks}</p>
                  <p className="text-[9px] font-medium text-muted-foreground/75 mt-0.5">Done</p>
                </div>
                <div className="rounded-2xl py-1.5 text-center bg-primary/10 border border-primary/20">
                  <p className="text-sm font-extrabold text-primary">{pendingApprovals}</p>
                  <p className="text-[9px] font-medium text-muted-foreground/75 mt-0.5">Pending</p>
                </div>
                <div className={cn(
                  "rounded-2xl py-1.5 text-center border transition-colors",
                  issueCount > 0 ? "bg-red-500/10 border-red-500/20" : "bg-muted/30 border-border"
                )}>
                  <p className={cn('text-sm font-extrabold', issueCount > 0 ? 'text-red-400' : 'text-muted-foreground/40')}>{issueCount}</p>
                  <p className="text-[9px] font-medium text-muted-foreground/75 mt-0.5">Issues</p>
                </div>
              </div>
            </Link>

            {/* Prep Progress */}
            <Link to="/tasks" className="liquid-card p-4 flex flex-col gap-3 active:scale-[0.97] transition-transform">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Prep Progress</span>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              </div>
              {/* Donut + label */}
              <div className="flex items-center gap-3">
                <div className="relative h-[52px] w-[52px] shrink-0">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                    <circle cx="26" cy="26" r="20" fill="none" stroke="#FF6B00" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 20}
                      strokeDashoffset={2 * Math.PI * 20 * (1 - taskPct / 100)}
                      style={{ filter: 'drop-shadow(0 0 3px rgba(255,107,0,0.35))', transition: 'stroke-dashoffset 0.7s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-black text-foreground">{taskPct}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{overdueTasks > 0 ? 'Behind' : 'On Track'}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">Prep tasks<br/>completed</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-primary">{metrics.completedTasks} of {metrics.totalTasks || 0} tasks</p>
                <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${taskPct}%`, background: '#FF6B00', boxShadow: '0 0 4px rgba(255,107,0,0.4)', transition: 'width 0.7s ease' }} />
                </div>
              </div>
            </Link>

            {/* Compliance */}
            <Link to="/logs" className="liquid-card p-4 flex flex-col gap-3 active:scale-[0.97] transition-transform">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Compliance</span>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              </div>
              {/* Donut + label */}
              {(() => {
                const compliancePct = issueCount === 0 ? 98 : Math.max(72, 98 - issueCount * 6);
                const complianceColor = issueCount === 0 ? '#22c55e' : '#f59e0b';
                return (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="relative h-[52px] w-[52px] shrink-0">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 52 52">
                          <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                          <circle cx="26" cy="26" r="20" fill="none" stroke={complianceColor} strokeWidth="5" strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 20}
                            strokeDashoffset={2 * Math.PI * 20 * (1 - compliancePct / 100)}
                            style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[11px] font-black text-foreground">{compliancePct}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">{issueCount === 0 ? 'Compliant' : 'Review Needed'}</p>
                        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                          {issueCount === 0 ? 'All critical checks' : `${issueCount} open issue${issueCount !== 1 ? 's' : ''}`}<br/>
                          {issueCount === 0 ? 'up to date' : 'unresolved'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                      <p className="text-[10px] text-muted-foreground">{issueCount === 0 ? 'All checks passed' : 'Action needed'}</p>
                    </div>
                  </>
                );
              })()}
            </Link>

            {/* Reservations / BEOs */}
            <Link to="/reservations" className="liquid-card p-4 flex flex-col gap-2 active:scale-[0.97] transition-transform">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground leading-tight">Reservations / BEOs</span>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              </div>
              <div className="flex items-center gap-3 py-1">
                <div>
                  <p className="text-2xl font-black text-foreground">0</p>
                  <p className="text-[10px] text-muted-foreground">Reservations</p>
                </div>
                <div className="w-px h-8 bg-white/10 shrink-0" />
                <div>
                  <p className="text-2xl font-black text-foreground">0</p>
                  <p className="text-[10px] text-muted-foreground">BEOs</p>
                </div>
              </div>
              {/* Bar chart */}
              <div className="mt-auto">
                <div className="flex items-end gap-1 h-7">
                  {[30, 55, 40, 85, 20].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm transition-all"
                      style={{ height: `${h}%`, background: i === 3 ? '#FF6B00' : 'rgba(255,255,255,0.14)', boxShadow: i === 3 ? '0 0 6px rgba(255,107,0,0.4)' : 'none' }} />
                  ))}
                </div>
                <div className="flex mt-1">
                  {['9A','12P','3P','6P','9P'].map(l => (
                    <span key={l} className="flex-1 text-center text-[8px] text-muted-foreground/50">{l}</span>
                  ))}
                </div>
              </div>
            </Link>

          </section>

          {/* 3 ── Approvals action banner — always visible */}
          {(() => {
            const count = approvalQueue.length;
            const isClear  = count === 0;
            const isCrit   = count > 5;
            const accent   = isClear ? '#22c55e' : isCrit ? '#ef4444' : '#FF6B00';
            const accentBg = isClear ? 'rgba(34,197,94,0.06)'  : isCrit ? 'rgba(239,68,68,0.08)'  : 'rgba(255,107,0,0.08)';
            const accentBd = isClear ? 'rgba(34,197,94,0.16)'  : isCrit ? 'rgba(239,68,68,0.25)'  : 'rgba(255,107,0,0.28)';
            const accentGl = isClear ? 'rgba(34,197,94,0.05)'  : isCrit ? 'rgba(239,68,68,0.08)'  : 'rgba(255,107,0,0.08)';
            const btnGlow  = isClear ? 'rgba(34,197,94,0.20)'  : isCrit ? 'rgba(239,68,68,0.35)'  : 'rgba(255,107,0,0.35)';
            const label    = isClear ? 'All clear' : `${count} approval${count !== 1 ? 's' : ''} waiting`;
            const sub      = isClear
              ? 'No pending approvals right now'
              : approvalQueue.slice(0, 2).map(a => a.title || a.name || 'Approval').join(' · ');
            const btnLabel = isClear ? 'All Clear' : 'Review Now';
            return (
              <section>
                <button
                  onClick={() => !isClear && setShowApprovalDeck(true)}
                  disabled={isClear}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:scale-[0.98] transition-all text-left disabled:active:scale-100"
                  style={{ background: accentBg, border: `1px solid ${accentBd}`, boxShadow: `0 0 24px ${accentGl}` }}
                >
                  <div className="relative shrink-0">
                    <ClipboardList className="h-8 w-8" style={{ color: accent }} />
                    {!isClear && <AlertCircle className="absolute -bottom-1 -right-1 h-4 w-4" style={{ color: accent }} />}
                    {isClear && <CheckCircle2 className="absolute -bottom-1 -right-1 h-4 w-4 text-green-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>
                  </div>
                  <span
                    className="shrink-0 px-4 py-2 rounded-2xl text-xs font-black text-white whitespace-nowrap"
                    style={{ background: accent, boxShadow: `0 0 16px ${btnGlow}` }}
                  >
                    {btnLabel}
                  </span>
                </button>
              </section>
            );
          })()}

        </div>

        {/* ── Desktop layout ─────────────────────────────────────── */}
        <div className="hidden lg:block space-y-6 lg:!mt-0">

              {/* Greeting row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="ops-kicker">Command Center</p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Morning, {firstName}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {pendingApprovals > 0 ? `${pendingApprovals} approval${pendingApprovals !== 1 ? 's' : ''} waiting` : 'Approvals clear'}{overdueTasks > 0 ? ` · ${overdueTasks} task${overdueTasks !== 1 ? 's' : ''} overdue` : ' · tasks on track'}
                  </p>
                </div>
                <LiveClock />
              </div>

              {/* KPI strip */}
              <div className="ops-metric-grid">
                {/* Readiness */}
                <div className="ops-metric-card ops-metric-card-accent">
                  <div className="ops-metric-topline">
                    <span className="ops-icon-box ops-icon-box-accent">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <span className="ops-kicker text-primary/70">Shift</span>
                  </div>
                  <div>
                    <p className="ops-metric-value text-primary">{readiness}%</p>
                    <p className="ops-metric-label">Station Readiness</p>
                  </div>
                  <div className="ops-progress-track bg-primary/20">
                    <div className="ops-progress-fill bg-primary" style={{ width: `${readiness}%` }} />
                  </div>
                </div>

                {/* Tasks */}
                <Link to="/tasks" className="ops-metric-card liquid-card-interactive block">
                  <div className="ops-metric-topline">
                    <span className="ops-icon-box">
                      <CheckCircle2 className={cn('h-3.5 w-3.5', overdueTasks > 0 ? 'text-amber-400' : 'text-green-400')} />
                    </span>
                    <span className={cn('ops-kicker', overdueTasks > 0 ? 'text-amber-400/70' : 'text-green-400/70')}>
                      {overdueTasks > 0 ? 'Behind' : 'On track'}
                    </span>
                  </div>
                  <div>
                    <p className={cn('ops-metric-value', overdueTasks > 0 ? 'text-amber-400' : 'text-foreground')}>
                      {metrics.completedTasks}<span className="text-lg text-muted-foreground/60 font-semibold">/{metrics.totalTasks || '—'}</span>
                    </p>
                    <p className="ops-metric-label">Tasks Complete</p>
                  </div>
                  <div className="ops-progress-track">
                    <div className={cn('ops-progress-fill', overdueTasks > 0 ? 'bg-amber-400' : 'bg-green-400')} style={{ width: `${taskPct}%` }} />
                  </div>
                </Link>

                {/* Approvals */}
                <div className="ops-metric-card">
                  <div className="ops-metric-topline">
                    <span className="ops-icon-box">
                      <Bell className={cn('h-3.5 w-3.5', pendingApprovals > 0 ? 'text-foreground' : 'text-muted-foreground')} />
                    </span>
                    <span className="ops-kicker text-muted-foreground/70">
                      {pendingApprovals === 0 ? 'Clear' : 'Waiting'}
                    </span>
                  </div>
                  <div>
                    <p className={cn('ops-metric-value', pendingApprovals > 0 ? 'text-foreground' : 'text-muted-foreground/30')}>{pendingApprovals}</p>
                    <p className="ops-metric-label">Pending Approvals</p>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{processedApprovals > 0 ? `${processedApprovals} cleared today` : 'Awaiting review'}</p>
                </div>

                {/* Issues */}
                <Link to="/logs" className="ops-metric-card liquid-card-interactive block">
                  <div className="ops-metric-topline">
                    <span className="ops-icon-box">
                      <AlertCircle className={cn('h-3.5 w-3.5', issueCount > 0 ? 'text-red-400' : 'text-muted-foreground')} />
                    </span>
                    <span className={cn('ops-kicker', issueCount > 0 ? 'text-red-400/70' : 'text-muted-foreground/70')}>
                      {issueCount === 0 ? 'Clear' : 'Alert'}
                    </span>
                  </div>
                  <div>
                    <p className={cn('ops-metric-value', issueCount > 0 ? 'text-red-400' : 'text-muted-foreground/30')}>{issueCount}</p>
                    <p className="ops-metric-label">Open Issues</p>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{issueCount === 0 ? 'No active alerts' : 'Needs resolution'}</p>
                </Link>
              </div>

              {/* Two-col: main + glance panel */}
              <div className="grid grid-cols-[1fr_296px] xl:grid-cols-[1fr_340px] 2xl:grid-cols-[1fr_380px] gap-5 items-start">

                {/* Main column */}
                <div className="space-y-5">

                  {/* Approvals */}
                  {hasApprovalQueue ? (
                    <section className="space-y-3">
                      <div className="ops-section-header">
                        <div>
                          <p className="ops-kicker text-primary">Manager Priority</p>
                          <h2 className="ops-section-title mt-0.5">Approvals</h2>
                        </div>
                        <span className="ops-section-meta">
                          {approvalQueue.length} waiting{processedApprovals > 0 ? ` · ${processedApprovals} cleared` : ''}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {approvalQueue.slice(0, 8).map((approval) => (
                          <div key={`${approval.sourceModule}:${approval.sourceId || approval.id}`}
                            className="liquid-card flex items-center gap-3 px-3 py-2.5">
                            <span className={cn('status-marker status-marker-sm shrink-0',
                              approval.approval_type === 'temperature' ? 'status-warning' :
                              approval.approval_type === 'prep' ? 'status-info' :
                              approval.approval_type === 'maintenance' ? 'status-critical' : 'status-neutral'
                            )}>
                              <CheckCircle2 className="h-3 w-3" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-foreground">{approval.title || approval.name || 'Approval request'}</p>
                              <p className="text-xs text-muted-foreground capitalize">{(approval.approval_type || '').replace(/_/g, ' ')}{approval.created_by ? ` · ${approval.created_by}` : ''}</p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => handleApprove(approval)} className="text-xs font-bold px-2.5 py-1 rounded-2xl bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">Approve</button>
                              <button onClick={() => { setDenialDrawer({ approval }); setDetailSheet(null); }} className="text-xs font-bold px-2.5 py-1 rounded-2xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Deny</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <div className="liquid-card liquid-card-success flex items-center gap-3 px-5 py-4">
                      <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                      <div>
                        <p className="text-sm font-black text-foreground">Approval Queue Clear</p>
                        <p className="text-xs text-muted-foreground">{processedApprovals > 0 ? `${processedApprovals} cleared today.` : 'No pending approvals.'}</p>
                      </div>
                    </div>
                  )}

                  {/* Needs Attention */}
                  <section className="space-y-3">
                    <div className="ops-section-header">
                      <h2 className="ops-section-title">Needs Attention</h2>
                      <span className="ops-section-meta">Today</span>
                    </div>
                    <div className="space-y-2">
                      {dynamicActions.map((item) => <ActionRow key={item.label} item={item} />)}
                    </div>
                  </section>

                  {/* Prep Queue */}
                  {prepQueue.length > 0 && (
                    <section className="space-y-3">
                      <div className="ops-section-header">
                        <h2 className="ops-section-title">Prep Queue</h2>
                        <Link to="/tasks?tab=prep" className="text-xs font-black text-primary">View all</Link>
                      </div>
                      <div className="space-y-2">
                        {prepQueue.slice(0, 4).map((item) => (
                          <Link key={item.name} to="/tasks?tab=prep"
                            className="liquid-card liquid-card-interactive flex items-center gap-3 px-3 py-2.5">
                            <span className={cn('status-marker status-marker-sm shrink-0', item.statusClass)} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.assignee} · {item.progress}%</p>
                            </div>
                            <div className="w-16 h-1 bg-muted/60 rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress}%` }} />
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Glance panel */}
                <div className="sticky top-[120px] space-y-4">

                  {/* Today at a Glance */}
                  <div className="liquid-card">
                    <div className="px-4 py-3 border-b border-border/30">
                      <h2 className="text-sm font-black text-foreground">Today at a Glance</h2>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="divide-y divide-border/20">
                      <GlanceRow
                        icon={CheckCircle2}
                        label="Duties"
                        value={`${metrics.completedTasks}/${metrics.totalTasks || 0}`}
                        detail={`${taskPct}% complete`}
                        href="/tasks"
                        progress={taskPct}
                      />
                      <GlanceRow
                        icon={Bell}
                        label="Pending Approvals"
                        value={pendingApprovals}
                        detail={pendingApprovals === 0 ? 'Queue clear' : 'Waiting for review'}
                        href="/app/overview"
                        valueColor={pendingApprovals > 0 ? 'text-foreground' : 'text-muted-foreground/40'}
                      />
                      <GlanceRow
                        icon={Flame}
                        label="Prep Behind"
                        value={behindPrep.length || 0}
                        detail={behindPrep.length > 0 ? behindPrep.slice(0, 2).map(p => p.name).join(', ') : 'All on track'}
                        href="/tasks?tab=prep"
                        valueColor={behindPrep.length > 0 ? 'text-amber-400' : 'text-muted-foreground/40'}
                      />
                      <GlanceRow
                        icon={Activity}
                        label="Logs Today"
                        value={activity.length}
                        detail={activity.length > 0 ? 'Recent entries logged' : 'Nothing logged yet'}
                        href="/logs"
                        valueColor={activity.length > 0 ? 'text-foreground' : 'text-muted-foreground/40'}
                      />
                      <GlanceRow
                        icon={AlertCircle}
                        label="Open Issues"
                        value={issueCount}
                        detail={issueCount === 0 ? 'No active alerts' : 'Needs attention'}
                        href="/logs"
                        valueColor={issueCount > 0 ? 'text-red-400' : 'text-muted-foreground/40'}
                      />
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="liquid-card">
                    <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                      <h2 className="text-sm font-black text-foreground">Recent Activity</h2>
                      <Link to="/logs" className="text-xs font-black text-primary">View all</Link>
                    </div>
                    {activity.length > 0 ? (
                      <div className="divide-y divide-border/20">
                        {activity.map((item) => (
                          <div key={item.label} className="flex items-start gap-3 px-4 py-3">
                            <span className={cn('status-marker status-marker-sm mt-0.5 shrink-0', item.statusClass)}>
                              <CheckCircle2 className="h-3 w-3" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground leading-tight truncate">{item.label}</p>
                              {item.time && <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-4 text-xs text-muted-foreground">No activity logged today.</p>
                    )}
                  </div>

                  {/* Quick links */}
                  <div className="liquid-card">
                    <div className="px-4 py-3 border-b border-border/30">
                      <h2 className="text-sm font-black text-foreground">Quick Access</h2>
                    </div>
                    <div className="divide-y divide-border/20">
                      {[
                        { label: 'Operational Map', href: '/operational-map', icon: Radio },
                        { label: 'Prep & Tasks', href: '/tasks', icon: Flame },
                        { label: 'Manager Logs', href: '/logs', icon: ClipboardList },
                        { label: 'Team', href: '/team', icon: UserRound },
                      ].map(({ label, href, icon: Icon }) => (
                        <Link key={label} to={href} className="ops-row py-2.5 group">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-semibold text-foreground flex-1">{label}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
        </div>

        {/* ── Approval Deck Overlay — mobile only ─────────────────── */}
        {showApprovalDeck && hasApprovalQueue && (
          <div
            className="fixed inset-0 z-50 flex flex-col lg:hidden"
            style={{ background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(16px)' }}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4"
              style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Manager Priority</p>
                <h2 className="mt-0.5 text-lg font-black text-foreground">
                  Approvals <span className="font-bold text-muted-foreground">· {approvalQueue.length} waiting</span>
                </h2>
              </div>
              <button
                onClick={() => setShowApprovalDeck(false)}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.08] transition-colors hover:bg-white/[0.12]"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>

            {/* Card */}
            <div
              className="flex flex-1 flex-col px-5 py-4"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              <SwipeApprovalCard
                approval={currentApproval}
                index={processedApprovals + 1}
                total={processedApprovals + approvalQueue.length}
                onApprove={handleApprove}
                onDeny={() => { setShowApprovalDeck(false); setDenialDrawer({ approval: currentApproval }); }}
                onViewDetails={() => { setShowApprovalDeck(false); setDetailSheet(currentApproval); }}
              />
            </div>
          </div>
        )}

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
            onDeny={() => setDenialDrawer({ approval: detailSheet })}
            onClose={() => setDetailSheet(null)}
          />
        )}

        <AnimatePresence>
          {showBurst && <ClearBurst key="burst" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const hideBase44Index = true;