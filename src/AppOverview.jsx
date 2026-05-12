import { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';
import TaskVisual from '@/components/TaskVisual';
import ApprovalCard from '@/components/approval/ApprovalCard';
import ApprovalDetailSheet from '@/components/approval/ApprovalDetailSheet';
import DenialReasonDrawer from '@/components/approval/DenialReasonDrawer';

const PREP_IMAGES = {
  ranch: '/demo-prep/ranch.svg',
  pico: '/demo-prep/pico.svg',
  romaine: '/demo-prep/romaine.svg',
  guac: '/demo-prep/guacamole.svg',
};

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
    <a href="/prep-lists" className="glow-interactive relative h-44 w-[154px] shrink-0 overflow-hidden rounded-2xl border border-border/60 card-glass">
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
    </a>
  );
}

function ActionRow({ item }) {
  const Icon = item.icon;
  return (
    <a href={item.href} className="glow-interactive flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-4 py-3">
      <span className={cn('status-marker status-marker-md shrink-0', item.statusClass)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black tracking-tight text-foreground">{item.label}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.detail}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </a>
  );
}

function StationRow({ station }) {
  return (
    <a href="/operational-map" className="glow-interactive flex items-center gap-3 rounded-2xl border border-border/50 bg-black/20 px-4 py-3">
      <span className={cn('status-marker status-marker-lg shrink-0', station.statusClass)}>{station.ready}%</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-foreground">{station.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{station.detail}</p>
      </div>
      <span className={cn('text-xs font-black', station.issueCount > 0 ? 'text-primary' : 'text-muted-foreground')}>
        {station.issueCount} issues
      </span>
    </a>
  );
}

export default function AppOverview() {
  const { user } = useCurrentUser();
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [processedApprovals, setProcessedApprovals] = useState(0);
  const [denialDrawer, setDenialDrawer] = useState(null);
  const [detailSheet, setDetailSheet] = useState(null);
  const [metrics, setMetrics] = useState({
    completedTasks: 0,
    totalTasks: 0,
    pendingApprovals: 0,
    openAlerts: 0,
    equipmentIssues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [tasks, approvals, prepItems, tempLogs, maintenanceReqs, timeOffReqs, alerts, equipment] = await Promise.all([
        safeFilter(base44.entities.GeneratedTask, { status: { $in: ['completed', 'pending', 'in_progress'] } }, '-updated_date', 100),
        safeFilter(base44.entities.ApprovalQueue, { status: 'pending' }, '-submitted_at', 50),
        safeFilter(base44.entities.PrepItem, { status: 'pending_review' }, '-updated_date', 50),
        safeFilter(base44.entities.TemperatureLog, { requires_review: true }, '-updated_date', 50),
        safeFilter(base44.entities.MaintenanceRequest, { status: 'pending' }, '-updated_date', 50),
        safeFilter(base44.entities.TimeOffRequest, { status: 'pending' }, '-updated_date', 50),
        safeFilter(base44.entities.OperationalCheck, { status: { $in: ['failed', 'overdue'] } }, '-updated_date', 50),
        safeFilter(base44.entities.Equipment, { isActive: true }, '', 50),
      ]);

      const allApprovals = uniqueApprovals([
        ...(approvals || []).map(normalizeApprovalQueueItem),
        ...(prepItems || []).map(p => ({ ...p, approval_type: 'prep', sourceModule: 'PrepItem', sourceId: p.id })),
        ...(tempLogs || []).map(t => ({ ...t, approval_type: 'temperature', sourceModule: 'TemperatureLog', sourceId: t.id })),
        ...(maintenanceReqs || []).map(m => ({ ...m, approval_type: 'maintenance', sourceModule: 'MaintenanceRequest', sourceId: m.id })),
        ...(timeOffReqs || []).map(t => ({ ...t, approval_type: 'timeoff', sourceModule: 'TimeOffRequest', sourceId: t.id })),
      ]);

      const completed = (tasks || []).filter((task) => task.status === 'completed').length;
      const total = (tasks || []).length;

      setApprovalQueue(allApprovals);
      setMetrics({
        completedTasks: completed,
        totalTasks: total,
        pendingApprovals: allApprovals.length,
        openAlerts: (alerts || []).length,
        equipmentIssues: (equipment || []).filter((item) => item.temp_enabled && item.isActive).length,
      });
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
    setLoading(false);
  };

  const currentApproval = approvalQueue[0];

  const handleApprove = async () => {
    if (!currentApproval) return;

    try {
      const now = new Date().toISOString();
      const moduleName = currentApproval.sourceModule;
      const updateData = moduleName === 'ApprovalQueue'
        ? { status: 'approved', approved_by_email: user?.email || user?.created_by || 'current_user', approved_at: now }
        : { approval_status: 'approved', approved_by: user?.email || 'current_user', approved_at: now };

      await base44.entities[moduleName]?.update?.(currentApproval.sourceId, updateData);
      setApprovalQueue((items) => items.filter((item) => item.id !== currentApproval.id));
      setProcessedApprovals((count) => count + 1);
      setMetrics((current) => ({ ...current, pendingApprovals: Math.max(current.pendingApprovals - 1, 0) }));
      setDetailSheet(null);
      toast.success('Approved');
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleDenialSubmit = async (reason, notes) => {
    if (!currentApproval) return;

    try {
      const now = new Date().toISOString();
      const moduleName = currentApproval.sourceModule;
      const updateData = moduleName === 'ApprovalQueue'
        ? { status: 'denied', approved_by_email: user?.email || user?.created_by || 'current_user', approved_at: now, denial_reason: [reason, notes].filter(Boolean).join(': ') }
        : { approval_status: 'denied', denied_by: user?.email || 'current_user', denied_at: now, denial_reason: reason, denial_notes: notes };

      await base44.entities[moduleName]?.update?.(currentApproval.sourceId, updateData);
      setApprovalQueue((items) => items.filter((item) => item.id !== currentApproval.id));
      setProcessedApprovals((count) => count + 1);
      setMetrics((current) => ({ ...current, pendingApprovals: Math.max(current.pendingApprovals - 1, 0) }));
      setDenialDrawer(null);
      setDetailSheet(null);
      toast.success('Sent back');
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

  const prepQueue = [
    { name: 'Ranch', assignee: 'Maya Chen', due: '10:30', progress: 38, statusClass: 'status-info', image: PREP_IMAGES.ranch },
    { name: 'Pico de Gallo', assignee: 'Andre Ruiz', due: '11:00', progress: 0, statusClass: 'status-warning', image: PREP_IMAGES.pico },
    { name: 'Cut Romaine', assignee: 'Jess Morgan', due: '11:30', progress: 0, statusClass: 'status-neutral', image: PREP_IMAGES.romaine },
    { name: 'Guacamole', assignee: 'Taylor Kim', due: '12:00', progress: 0, statusClass: 'status-critical', image: PREP_IMAGES.guac },
  ];

  const stations = [
    { name: 'Kitchen', ready: 82, detail: '5 crew assigned, Pantry behind', issueCount: 2, statusClass: 'status-info' },
    { name: 'Bar', ready: 76, detail: '2 crew assigned, opening checks due', issueCount: 1, statusClass: 'status-warning' },
    { name: 'Dining Room', ready: 90, detail: '3 crew assigned, service ready', issueCount: 0, statusClass: 'status-success' },
  ];

  const activity = [
    { label: 'Maya started Ranch', time: '4 min ago', statusClass: 'status-info' },
    { label: 'Lowboy 1 temp logged', time: '12 min ago', statusClass: 'status-success' },
    { label: 'Waste entry submitted', time: '18 min ago', statusClass: 'status-neutral' },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="app-screen">
      <div className="app-page max-w-[560px] space-y-7">
        <header className="pt-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Morning, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Dinner prep is moving. Pantry needs attention.</p>
        </header>

        {hasApprovalQueue && (
          <section className="space-y-3">
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

        <section className={cn('relative overflow-hidden rounded-[28px] border border-border/60 bg-card/70 px-5 py-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]', hasApprovalQueue && 'mt-2')}>
          <div className="absolute inset-x-10 top-0 h-24 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col items-center text-center">
            <PulseRing value={readiness} />
            <div className="mt-1 space-y-1">
              <p className="text-lg font-black tracking-tight text-foreground">Operational pulse is steady</p>
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

        <a href="/operational-map" className="glow-interactive block rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <span className="status-marker status-marker-md status-info">
              <Radio className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Next Best Action</p>
              <h2 className="mt-1 text-lg font-black tracking-tight text-foreground">Open Pantry station</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">Ranch is in progress and pico has not started. Both are due before lunch setup.</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
          </div>
        </a>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black tracking-tight text-foreground">What Needs Me</h2>
            <span className="text-xs font-bold text-muted-foreground">Today</span>
          </div>
          <div className="space-y-2">
            {actions.map((item) => (
              <ActionRow key={item.label} item={item} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black tracking-tight text-foreground">Prep Queue</h2>
            <a href="/prep-lists" className="text-xs font-black text-primary">View all</a>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {prepQueue.map((item) => (
              <PrepCard key={item.name} item={item} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black tracking-tight text-foreground">Stations</h2>
            <a href="/operational-map" className="text-xs font-black text-primary">Map</a>
          </div>
          <div className="space-y-2">
            {stations.map((station) => (
              <StationRow key={station.name} station={station} />
            ))}
          </div>
        </section>

        <section className="space-y-3 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black tracking-tight text-foreground">Activity Pulse</h2>
            <a href="/logs" className="text-xs font-black text-primary">Logs</a>
          </div>
          <div className="app-card space-y-3">
            {activity.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className={cn('status-marker status-marker-sm', item.statusClass)}>
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{item.label}</p>
                <span className="text-xs font-semibold text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </section>

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
      </div>
    </div>
  );
}

export const hideBase44Index = true;
