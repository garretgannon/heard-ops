import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { BarChart2, CheckCircle2, ClipboardList, Thermometer, Wrench } from 'lucide-react';
import DesktopPageHeader from '@/components/DesktopPageHeader';

const today = () => new Date().toISOString().split('T')[0];
const thisWeekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

function MetricTile({ label, value, sub, color = 'text-foreground' }) {
  return (
    <div className="rounded-2xl border border-border/40 p-4 space-y-1" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
      <p className={cn('text-2xl font-black tabular-nums', color)}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SectionCard({ eyebrow, title, children }) {
  return (
    <section className="rounded-2xl border border-border/50 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}
    >
      <div className="px-4 py-3 border-b border-border/30">
        <p className="metric-label">{eyebrow}</p>
        {title && <h2 className="mt-0.5 text-base font-black text-foreground">{title}</h2>}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [tasks, prepItems, tempLogs, maintenance, approvals, logs] = await Promise.all([
          base44.entities.GeneratedTask?.list?.('-updated_date', 200).catch(() => []),
          base44.entities.PrepItem?.list?.('-updated_date', 100).catch(() => []),
          base44.entities.TemperatureLog?.list?.('-created_date', 200).catch(() => []),
          base44.entities.MaintenanceRequest?.list?.('-updated_date', 50).catch(() => []),
          base44.entities.ApprovalQueue?.list?.('-submitted_at', 100).catch(() => []),
          base44.entities.UnifiedLog?.list?.('-created_date', 200).catch(() => []),
        ]);

        const todayStr = today();
        const weekStart = thisWeekStart();

        const todayTasks = (tasks || []).filter(t => t.due_date === todayStr || t.created_date?.startsWith(todayStr));
        const completedToday = todayTasks.filter(t => t.status === 'completed').length;
        const totalToday = todayTasks.length;

        const weekTasks = (tasks || []).filter(t => t.updated_date >= weekStart || t.created_date >= weekStart);
        const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;
        const weekTotal = weekTasks.length;

        const prepComplete = (prepItems || []).filter(p => p.status === 'completed').length;
        const prepTotal = (prepItems || []).length;

        const tempTotal = (tempLogs || []).length;
        const tempInRange = (tempLogs || []).filter(t => t.in_range || t.status === 'pass' || t.approval_status === 'approved').length;

        const openMaintenance = (maintenance || []).filter(m => m.status === 'pending' || m.status === 'open').length;
        const resolvedMaintenance = (maintenance || []).filter(m => m.status === 'resolved' || m.status === 'closed').length;

        const pendingApprovals = (approvals || []).filter(a => a.status === 'pending').length;
        const approvedCount = (approvals || []).filter(a => a.status === 'approved').length;

        const todayLogs = (logs || []).filter(l => l.created_date?.startsWith(todayStr)).length;

        const tasksByType = {};
        (tasks || []).forEach(t => {
          const type = t.task_type || 'other';
          if (!tasksByType[type]) tasksByType[type] = { total: 0, done: 0 };
          tasksByType[type].total++;
          if (t.status === 'completed') tasksByType[type].done++;
        });

        setData({
          completedToday, totalToday,
          weekCompleted, weekTotal,
          prepComplete, prepTotal,
          tempTotal, tempInRange,
          openMaintenance, resolvedMaintenance,
          pendingApprovals, approvedCount,
          todayLogs,
          tasksByType,
        });
      } catch (err) {
        console.error('Failed to load reports:', err);
      }
      setLoading(false);
    })();
  }, []);

  const pct = (a, b) => b > 0 ? `${Math.round((a / b) * 100)}%` : '—';

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Reports" subtitle="Today's operational summary" />
      <main className="app-page space-y-6 pb-28">
        <header className="pt-1 lg:hidden">
          <p className="metric-label">Operations</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Today's operational summary.</p>
        </header>

        <div className="lg:mt-0">{loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
            </div>
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-border/50 py-16 text-center">
            <p className="text-sm text-muted-foreground">No data available yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricTile
                label="Tasks today"
                value={`${data.completedToday}/${data.totalToday}`}
                sub={pct(data.completedToday, data.totalToday) + ' complete'}
                color={data.completedToday === data.totalToday && data.totalToday > 0 ? 'text-green-400' : 'text-foreground'}
              />
              <MetricTile
                label="Prep items"
                value={`${data.prepComplete}/${data.prepTotal}`}
                sub={pct(data.prepComplete, data.prepTotal) + ' complete'}
              />
              <MetricTile
                label="Temp checks"
                value={data.tempTotal}
                sub={data.tempInRange > 0 ? `${data.tempInRange} in range` : 'logged today'}
                color={data.tempTotal > 0 ? 'text-blue-400' : 'text-muted-foreground'}
              />
              <MetricTile
                label="Open issues"
                value={data.openMaintenance + data.pendingApprovals}
                sub={`${data.pendingApprovals} approval${data.pendingApprovals !== 1 ? 's' : ''} pending`}
                color={data.openMaintenance + data.pendingApprovals > 0 ? 'text-amber-400' : 'text-green-400'}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <SectionCard eyebrow="This Week" title="Task completion">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{data.weekCompleted} of {data.weekTotal} tasks completed</span>
                    <span className="text-sm font-black text-foreground">{pct(data.weekCompleted, data.weekTotal)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: data.weekTotal > 0 ? `${Math.round((data.weekCompleted / data.weekTotal) * 100)}%` : '0%' }}
                    />
                  </div>
                  {Object.entries(data.tasksByType).length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {Object.entries(data.tasksByType).slice(0, 6).map(([type, counts]) => (
                        <div key={type} className="flex items-center justify-between rounded-xl border border-border/30 px-3 py-2" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
                          <span className="text-xs text-muted-foreground capitalize">{type.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-black text-foreground">{counts.done}/{counts.total}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>

              <div className="space-y-4">
                <SectionCard eyebrow="Compliance" title="Temperature logs">
                  <div className="space-y-2">
                    {data.tempTotal > 0 ? (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="status-marker status-marker-md status-info"><Thermometer className="h-4 w-4" /></span>
                          <div>
                            <p className="text-sm font-black text-foreground">{data.tempTotal} checks logged</p>
                            <p className="text-xs text-muted-foreground">{data.tempInRange} in acceptable range</p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/30 overflow-hidden mt-2">
                          <div className="h-full rounded-full bg-blue-500 transition-all duration-700"
                            style={{ width: `${Math.round((data.tempInRange / data.tempTotal) * 100)}%` }} />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No temperature logs today.</p>
                    )}
                  </div>
                </SectionCard>

                <SectionCard eyebrow="Maintenance" title="Open requests">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={cn('status-marker status-marker-md', data.openMaintenance > 0 ? 'status-warning' : 'status-success')}>
                        <Wrench className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-black text-foreground">{data.openMaintenance} open</p>
                        <p className="text-xs text-muted-foreground">{data.resolvedMaintenance} resolved total</p>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>

            <SectionCard eyebrow="Approvals" title="Queue status">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className={cn('status-marker status-marker-md', data.pendingApprovals > 0 ? 'status-warning' : 'status-success')}>
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-foreground">{data.pendingApprovals} pending</p>
                    <p className="text-xs text-muted-foreground">{data.approvedCount} approved</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="status-marker status-marker-md status-neutral">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-foreground">{data.todayLogs} log{data.todayLogs !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">submitted today</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </>
        )}</div>
      </main>
    </div>
  );
}

export const hideBase44Index = true;
