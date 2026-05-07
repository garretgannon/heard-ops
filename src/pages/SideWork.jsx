import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Settings, Bell, CalendarDays, CheckCircle2, Clock, AlertTriangle, ChevronRight, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const statusStyle = (status) => {
  const map = {
    approved: { label: 'Done', cls: 'bg-green-500/20 text-green-400' },
    completed: { label: 'Done', cls: 'bg-green-500/20 text-green-400' },
    in_progress: { label: 'In Progress', cls: 'bg-blue-500/20 text-blue-400' },
    overdue: { label: 'Overdue', cls: 'bg-red-500/20 text-red-400' },
    pending: { label: 'Not Started', cls: 'bg-muted text-muted-foreground' },
  };
  return map[status] || { label: 'Not Started', cls: 'bg-muted text-muted-foreground' };
};

export default function SideWork() {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Tasks');
  const todayStr = new Date().toISOString().split('T')[0];
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    loadTasks();
    const unsub = base44.entities.SideWorkAssignment.subscribe(() => loadTasks());
    return () => unsub?.();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const data = await base44.entities.SideWorkAssignment.filter({ date: todayStr }).catch(() => []);
    setTasks(data);
    setLoading(false);
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => ['completed','approved'].includes(t.status)).length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const myTasks = tasks.filter(t => t.assigned_to_name === user?.full_name || t.assigned_to === user?.email);

  // Zones
  const zones = tasks.reduce((acc, t) => {
    const zone = t.role || t.zone || 'General';
    if (!acc[zone]) acc[zone] = { total: 0, done: 0 };
    acc[zone].total++;
    if (['completed','approved'].includes(t.status)) acc[zone].done++;
    return acc;
  }, {});

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'All Tasks') return true;
    const zone = t.role || t.zone || 'General';
    return zone === activeTab;
  });

  const zoneTabs = ['All Tasks', ...Object.keys(zones)];

  return (
    <div className="pb-24 lg:pb-0">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/30">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Side Work</h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <span className="text-[10px]">📅</span> {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/today')} className="h-8 px-3 rounded-lg border border-border bg-card text-xs font-bold text-foreground flex items-center gap-1.5 hover:bg-muted active:scale-95">
            <CalendarDays className="h-3.5 w-3.5 text-primary" /> Today's Plan
          </button>
          <button className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted active:scale-95">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border p-4 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Side Work</h1>
        {isAdmin && (
          <button onClick={() => navigate('/side-work-templates')} className="btn-secondary text-xs h-8 px-2 flex items-center gap-1">
            <Settings className="h-3 w-3" /> Templates
          </button>
        )}
      </div>

      {/* Desktop Overview Row */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-3 lg:px-8 lg:py-4 border-b border-border/30">
        {[
          { label: 'Completion', value: `${completionPct}%`, sub: `${doneTasks} of ${totalTasks} tasks`, color: completionPct >= 70 ? 'text-primary' : 'text-amber-400', hasBar: true },
          { label: 'Overdue', value: overdueTasks, sub: 'Tasks', color: overdueTasks > 0 ? 'text-red-400' : 'text-foreground' },
          { label: 'Due Today', value: tasks.filter(t => ['pending','in_progress'].includes(t.status)).length, sub: 'Tasks', color: 'text-amber-400' },
          { label: 'Done Today', value: doneTasks, sub: 'Tasks', color: 'text-green-400' },
          { label: 'Assigned To Me', value: myTasks.length, sub: 'Tasks', color: 'text-foreground' },
        ].map(({ label, value, sub, color, hasBar }) => (
          <div key={label} className="bg-card border border-border/60 rounded-xl px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
            {hasBar && (
              <div className="h-1 bg-muted rounded-full overflow-hidden mt-1.5 mb-1">
                <div className="h-full bg-primary rounded-full" style={{ width: `${completionPct}%` }} />
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-[200px_1fr_260px] lg:gap-0 lg:items-start min-h-[calc(100vh-200px)]">
        {/* LEFT: Zones */}
        <div className="border-r border-border/30 px-4 py-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Zones</p>
          <div className="space-y-2">
            {Object.entries(zones).map(([zone, stats]) => {
              const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
              return (
                <button key={zone} onClick={() => { haptics.light(); setActiveTab(zone); }} className={cn('w-full text-left bg-card border rounded-xl px-3 py-2.5 space-y-1.5 active:scale-[0.98] transition-all', activeTab === zone ? 'border-primary/40' : 'border-border/60')}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">{zone}</p>
                    <span className="text-xs font-bold text-foreground">{pct}%</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', pct === 100 ? 'bg-green-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
            {Object.keys(zones).length === 0 && <p className="text-xs text-muted-foreground">No zones yet</p>}
          </div>
          <button onClick={() => navigate('/more')} className="w-full text-[10px] font-bold text-primary hover:underline flex items-center justify-center gap-1">
            View All Zones <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* CENTER: Side Work Checklist */}
        <div className="px-5 py-4 space-y-3 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Side Work Checklist</p>
          </div>
          {/* Zone tabs */}
          <div className="flex gap-1 flex-wrap">
            {zoneTabs.slice(0, 6).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all', activeTab === tab ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border')}>
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-24"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No side work tasks today</p>
              {isAdmin && <button onClick={() => navigate('/side-work-templates')} className="mt-3 btn-primary text-xs px-4 py-2 flex items-center gap-1 mx-auto">Add from Templates</button>}
            </div>
          ) : (
            <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-8 px-3 py-2" />
                    {['Task','Zone','Due','Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredTasks.map(task => {
                    const st = statusStyle(task.status);
                    return (
                      <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={['completed','approved'].includes(task.status)} readOnly className="rounded border-border" />
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-xs font-bold text-foreground">{task.task_name}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{task.role || task.zone || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{task.due_time || 'Today'}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', st.cls)}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <button onClick={() => navigate('/more')} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
            View All Tasks <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* RIGHT: Support */}
        <div className="border-l border-border/30 px-4 py-4 space-y-4">
          {/* Overdue Tasks */}
          {overdueTasks > 0 && (
            <div className="bg-card border border-red-500/30 rounded-xl p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Overdue Tasks</p>
              <div className="space-y-1.5">
                {tasks.filter(t => t.status === 'overdue').slice(0, 4).map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs">
                    <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="flex-1 text-foreground truncate">{t.task_name}</span>
                    <span className="text-[10px] text-red-400 font-bold shrink-0">Overdue</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-2 text-[10px] font-bold text-primary hover:underline">View All Overdue →</button>
            </div>
          )}
          {/* My Assignments */}
          <div className="bg-card border border-border/60 rounded-xl p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">My Assignments</p>
            {myTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tasks assigned to you</p>
            ) : (
              <div className="space-y-1.5">
                {myTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs">
                    <CheckSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-foreground truncate">{t.task_name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{t.due_time || 'Today'}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="w-full mt-2 text-[10px] font-bold text-primary hover:underline">View All Assigned →</button>
          </div>
          {/* Manager Review / Notes */}
          <div className="bg-card border border-border/60 rounded-xl p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Manager Review / Notes</p>
            <p className="text-xs text-muted-foreground italic">No notes yet.</p>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="lg:hidden px-4 py-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-secondary-text">
            <p className="text-sm">Side work assignments will appear here</p>
            <p className="text-xs mt-2 text-muted-foreground">Create templates to auto-generate daily tasks</p>
          </div>
        ) : (
          tasks.map(task => {
            const st = statusStyle(task.status);
            return (
              <div key={task.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3">
                <input type="checkbox" checked={['completed','approved'].includes(task.status)} readOnly className="rounded border-border mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{task.task_name}</p>
                  <p className="text-xs text-muted-foreground">{task.role || task.zone}</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', st.cls)}>{st.label}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;