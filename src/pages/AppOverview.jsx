import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Radio,
  UserRound,
  Wrench,
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
import ApprovalCard from '@/components/approval/ApprovalCard';
import ApprovalDetailSheet from '@/components/approval/ApprovalDetailSheet';
import DenialReasonDrawer from '@/components/approval/DenialReasonDrawer';
import ClearBurst from '@/components/approval/ClearBurst';
import { AnimatePresence } from 'framer-motion';
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
          style={{ filter: 'drop-shadow(0 0 16px rgba(230, 106, 31, 0.32))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tracking-tight text-foreground">{value}%</span>
        <span className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Ready</span>
      </div>
    </div>
  );
}

function PrepCard({ item }) {
  return (
    <Link to="/tasks?tab=prep" className="glow-interactive relative h-44 w-[154px] shrink-0 overflow-hidden rounded-2xl border border-border/60 card-glass">
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
    <Link to={item.href} className="glow-interactive flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-4 py-3">
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

function StationRow({ station }) {
  const readyColor = station.ready >= 90 ? 'bg-green-500' : station.ready >= 75 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <a
      href="/operational-map"
      className="flex items-center gap-3 overflow-hidden rounded-2xl border border-border/50 px-4 py-3 transition-all active:scale-[0.99]"
      style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}
    >
      <span className={cn('status-marker status-marker-lg shrink-0', station.statusClass)}>{station.ready}%</span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-black text-foreground">{station.name}</p>
          <span className={cn('shrink-0 text-[10px] font-black', station.issueCount > 0 ? 'text-red-400' : 'text-muted-foreground/50')}>
            {station.issueCount > 0 ? `${station.issueCount} issue${station.issueCount === 1 ? '' : 's'}` : 'No issues'}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-black/30">
          <div className={cn('h-full rounded-full transition-all duration-700', readyColor)} style={{ width: `${station.ready}%` }} />
        </div>
        <p className="truncate text-[10px] text-muted-foreground">{station.detail}</p>
      </div>
    </a>
  );
}

export default function AppOverview() {
  const { user } = useCurrentUser();
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

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Single batch — keep to ≤4 calls to stay under rate limits
      const [approvals, prepItems, tasks, recentLogs] = await Promise.all([
        safeFilter(base44.entities.ApprovalQueue, { status: 'pending' }, '-submitted_at', 30),
        safeFilter(base44.entities.PrepItem, {}, '-updated_date', 20),
        safeFilter(base44.entities.GeneratedTask, { status: { $in: ['completed', 'pending', 'in_progress'] } }, '-updated_date', 30),
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
        : { approval_status: 'approved', approved_by: user?.email || 'current_user', approved_at: now };

      await base44.entities[moduleName]?.update?.(approval.sourceId, updateData);
      const remaining = approvalQueue.filter((item) => `${item.sourceModule}:${item.sourceId}` !== `${approval.sourceModule}:${approval.sourceId}`);
      setApprovalQueue(remaining);
      setProcessedApprovals((count) => count + 1);
      setMetrics((current) => ({ ...current, pendingApprovals: Math.max(current.pendingApprovals - 1, 0) }));
      setDetailSheet(null);
      if (remaining.length === 0) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.55 }, colors: ['#22c55e', '#4ade80', '#86efac', '#E66A1F', '#FCD34D'] });
        setShowBurst(true);
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
        : { approval_status: 'denied', denied_by: user?.email || 'current_user', denied_at: now, denial_reason: reason, denial_notes: notes };

      await base44.entities[moduleName]?.update?.(approval.sourceId, updateData);
      const remaining = approvalQueue.filter((item) => `${item.sourceModule}:${item.sourceId}` !== `${approval.sourceModule}:${approval.sourceId}`);
      setApprovalQueue(remaining);
      setProcessedApprovals((count) => count + 1);
      setMetrics((current) => ({ ...current, pendingApprovals: Math.max(current.pendingApprovals - 1, 0) }));
      setDenialDrawer(null);
      setDetailSheet(null);
      if (remaining.length === 0) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.55 }, colors: ['#22c55e', '#4ade80', '#86efac', '#E66A1F', '#FCD34D'] });
        setShowBurst(true);
        setTimeout(() => setShowBurst(false), 1100);
      } else {
        toast.success('Sent back');
      }
    } catch (err) {
      toast.error('Failed to send back approval');
    }
  };

  const hasLiveSignals = metrics.totalTasks > 0 || metrics.pendingApprovals > 0 || metrics.openAlerts > 0 || metrics.equipmentIssues > 0;
  const completedPercent = metrics.totalTasks > 0 ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) : 82;
  const readiness = hasLiveSignals ? Math.max(64, Math.min(94, completedPercent || 82)) : 82;
  const overdueTasks = metrics.totalTasks > 0 ? Math.max(metrics.totalTasks - metrics.completedTasks, 0) : (hasLiveSignals ? 0 : 4);
  const pendingApprovals = hasLiveSignals ? metrics.pendingApprovals : 7;
  const issueCount = metrics.equipmentIssues || metrics.openAlerts || (hasLiveSignals ? 0 : 2);
  const firstName = user?.first_name || user?.full_name?.split(' ')?.[0] || 'Alex';
  const hasApprovalQueue = approvalQueue.length > 0;

  const actions = [
    {
      label: 'Finish Pantry prep',
      detail: 'Ranch and pico are due before 11:00 AM',
      href: '/prep-lists',
      icon: Flame,
      statusClass: 'status-info',
    },
    {
      label: 'Check Lowboy 1 temp',
      detail: 'Last log is close to service window',
      href: '/operational-map',
      icon: Clock3,
      statusClass: 'status-warning',
    },
    {
      label: 'Resolve maintenance issue',
      detail: `${issueCount} open operational ${issueCount === 1 ? 'issue' : 'issues'}`,
      href: '/logs',
      icon: Wrench,
      statusClass: issueCount > 0 ? 'status-critical' : 'status-neutral',
    },
  ];

  const prepQueue = livePrepQueue;
  const activity = liveActivity;

  if (loading) {
    return (
      <div className="app-page max-w-[560px] space-y-5 lg:max-w-6xl">
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
    );
  }

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Overview" />
      <div className="app-page max-w-[560px] space-y-7 lg:max-w-6xl">
        <header className="flex items-start justify-between gap-4 pt-1 lg:hidden">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Morning, {firstName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {metrics.pendingApprovals > 0
                ? `${metrics.pendingApprovals} approval${metrics.pendingApprovals === 1 ? '' : 's'} waiting · ${overdueTasks > 0 ? `${overdueTasks} overdue` : 'tasks on track'}`
                : 'All clear. Keep an eye on prep and temps.'}
            </p>
          </div>
          <LiveClock />
        </header>

        {/* Mobile approval swipe stack */}
        {hasApprovalQueue && (
          <section className="space-y-3 lg:hidden">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Manager Priority</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">Approvals</h2>
                <p className="mt-1 text-sm text-muted-foreground">{approvalQueue.length} waiting</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-foreground">{processedApprovals} cleared</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Today</p>
              </div>
            </div>
            <div className="min-h-[650px] overflow-hidden">
              <ApprovalCard
                approval={currentApproval}
                index={processedApprovals + 1}
                total={processedApprovals + approvalQueue.length}
                onApprove={handleApprove}
                onDeny={() => setDenialDrawer({ approval: currentApproval })}
                onViewDetails={() => setDetailSheet(currentApproval)}
              />
            </div>
          </section>
        )}

        {/* Desktop approval list — compact rows, shown only on lg+ */}
        {hasApprovalQueue && (
          <section className="hidden lg:block space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Manager Priority</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">Approvals</h2>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-foreground">{processedApprovals} cleared today</p>
                <p className="text-[10px] font-bold text-muted-foreground">{approvalQueue.length} waiting</p>
              </div>
            </div>
            <div className="space-y-2">
              {approvalQueue.slice(0, 8).map((approval) => (
                <div key={`${approval.sourceModule}:${approval.sourceId || approval.id}`} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-4 py-3">
                  <span className={cn('status-marker status-marker-md shrink-0',
                    approval.approval_type === 'temperature' ? 'status-warning' :
                    approval.approval_type === 'prep' ? 'status-info' :
                    approval.approval_type === 'maintenance' ? 'status-critical' : 'status-neutral'
                  )}>
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{approval.title || approval.name || 'Approval request'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{(approval.approval_type || '').replace(/_/g, ' ')}{approval.created_by ? ` · ${approval.created_by}` : ''}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(approval)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => { setDenialDrawer({ approval }); setDetailSheet(null); }}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="space-y-7 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-6 lg:space-y-0">
          <div className="space-y-7">
        <section className={cn('relative overflow-hidden rounded-[28px] border border-border/60 bg-card/70 px-5 py-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]', hasApprovalQueue && 'mt-2')}>
          <div className="absolute inset-x-10 top-0 h-24 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col items-center text-center">
            <PulseRing value={readiness} />
            <div className="mt-1 space-y-1">
              <p className="text-lg font-black tracking-tight text-foreground">Readiness</p>
              <p className="mx-auto max-w-[280px] text-sm leading-5 text-muted-foreground">
                Pantry is tracking behind, but service readiness is still recoverable.
              </p>
            </div>
            <div className="mt-5 grid w-full grid-cols-3 gap-2">
              <div className="rounded-2xl border border-border/40 bg-black/25 p-3">
                <p className="text-lg font-black text-primary">{overdueTasks}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Overdue</p>
              </div>
              <div className="rounded-2xl border border-border/40 bg-black/25 p-3">
                <p className="text-lg font-black text-foreground">{pendingApprovals}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Approvals</p>
              </div>
              <div className="rounded-2xl border border-border/40 bg-black/25 p-3">
                <p className="text-lg font-black text-foreground">{issueCount}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Issues</p>
              </div>
            </div>
          </div>
        </section>

        {metrics.openAlerts > 0 && (
          <Link to="/operational-map" className="glow-interactive block rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-start gap-3">
              <span className="status-marker status-marker-md status-info">
                <Radio className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Next Action</p>
                <h2 className="mt-1 text-lg font-black tracking-tight text-foreground">Review open issues</h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{metrics.openAlerts} operational {metrics.openAlerts === 1 ? 'check' : 'checks'} need attention before service.</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
            </div>
          </Link>
        )}

          </div>
          <div className="space-y-7">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black tracking-tight text-foreground">Needs Attention</h2>
            <span className="text-xs font-bold text-muted-foreground">Today</span>
          </div>
          <div className="space-y-2">
            {actions.map((item) => (
              <ActionRow key={item.label} item={item} />
            ))}
          </div>
        </section>

        {prepQueue.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black tracking-tight text-foreground">Prep Queue</h2>
              <Link to="/tasks?tab=prep" className="text-xs font-black text-primary">View all</Link>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {prepQueue.map((item) => (
                <PrepCard key={item.name} item={item} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black tracking-tight text-foreground">Stations</h2>
            <Link to="/operational-map" className="text-xs font-black text-primary">Map</Link>
          </div>
          <Link
            to="/operational-map"
            className="glow-interactive flex items-center justify-between rounded-2xl border border-border/50 bg-card/60 px-4 py-3.5"
          >
            <p className="text-sm font-semibold text-muted-foreground">View station status and equipment on the Operational Map</p>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground ml-3" />
          </Link>
        </section>

        <section className="space-y-3 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black tracking-tight text-foreground">Recent Activity</h2>
            <Link to="/logs" className="text-xs font-black text-primary">Logs</Link>
          </div>
          <div className="app-card space-y-3">
            {activity.length > 0 ? activity.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className={cn('status-marker status-marker-sm', item.statusClass)}>
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{item.label}</p>
                <span className="text-xs font-semibold text-muted-foreground">{item.time}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground py-2">No recent activity logged today.</p>
            )}
          </div>
        </section>
          </div>
        </div>

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