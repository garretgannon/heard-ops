import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Settings, Search, Bell, CalendarDays, ChevronRight, AlertTriangle, Clock, CheckCircle2, Filter, X, Save } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import PrepTaskCard from '@/components/PrepTaskCard';

function PrepListGroup({ group, tasks, onTaskStatusChange }) {
  const stationTasks = tasks.filter(t => t.station === group.station && t.date === group.date);
  const completedCount = stationTasks.filter(t => ['completed', 'approved'].includes(t.status)).length;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-foreground">{group.date}</h3>
        <div className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-500/20 text-amber-300">{completedCount}/{stationTasks.length}</div>
      </div>
      <div className="space-y-2">
        {stationTasks.map(task => <PrepTaskCard key={task.id} task={task} onStatusChange={onTaskStatusChange} />)}
      </div>
    </div>
  );
}

const statusBadge = (status) => {
  const map = {
    approved: { label: 'COMPLETE', cls: 'bg-green-500/20 text-green-400' },
    completed: { label: 'COMPLETE', cls: 'bg-green-500/20 text-green-400' },
    in_progress: { label: 'IN PROG', cls: 'bg-blue-500/20 text-blue-400' },
    overdue: { label: 'OVERDUE', cls: 'bg-red-500/20 text-red-400' },
    pending_review: { label: 'REVIEW', cls: 'bg-purple-500/20 text-purple-400' },
  };
  return map[status] || { label: 'NOT STARTED', cls: 'bg-muted text-muted-foreground' };
};

export default function PrepLists() {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterTab, setFilterTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showAddStation, setShowAddStation] = useState(false);
  const [newStation, setNewStation] = useState({ name: '', shift: 'all', jobCode: 'Prep Cook' });
  const [addingStation, setAddingStation] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    loadTasks();
    const unsub = base44.entities.DailyPrepTask.subscribe(() => loadTasks());
    return () => unsub?.();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.DailyPrepTask.filter({ date: todayStr });
      setTasks(data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const grouped = tasks.reduce((acc, task) => {
    const key = `${task.date} - ${task.station}`;
    if (!acc[key]) acc[key] = { date: task.date, station: task.station, items: [], completedCount: 0, itemCount: 0 };
    acc[key].items.push(task);
    acc[key].itemCount++;
    if (['completed', 'approved'].includes(task.status)) acc[key].completedCount++;
    return acc;
  }, {});

  const stations = [...new Set(tasks.map(t => t.station))].sort();
  const filtered = Object.values(grouped).filter(g => {
    const matchStation = !filterStation || g.station === filterStation;
    const matchSearch = !search || g.station.toLowerCase().includes(search.toLowerCase());
    return matchStation && matchSearch;
  });

  // Desktop stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => ['completed','approved'].includes(t.status)).length;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  const reviewCount = tasks.filter(t => t.status === 'pending_review').length;
  const notStartedCount = tasks.filter(t => !t.status || t.status === 'pending').length;

  // Filter tasks for center queue
  const queueTasks = tasks.filter(t => {
    if (filterTab === 'Overdue') return t.status === 'overdue';
    if (filterTab === 'Due Today') return ['pending','in_progress'].includes(t.status);
    if (filterTab === 'Due Tomorrow') return false;
    return true;
  }).filter(t => !filterStation || t.station === filterStation)
    .filter(t => !search || t.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-24 lg:pb-0">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/30">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Prep</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage prep tasks, track progress, and ensure your kitchen is ready for service.</p>
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
      <div className="lg:hidden bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-foreground">Prep Lists</h1>
          {isAdmin && (
            <button onClick={() => navigate('/prep-templates')} className="btn-secondary text-xs h-8 px-2 flex items-center gap-1">
              <Settings className="h-3 w-3" /> Templates
            </button>
          )}
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
        </div>
      </div>

      {/* Desktop KPI Band */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-3 lg:px-8 lg:py-4 border-b border-border/30">
        {[
          { label: 'PREP COMPLETION', value: `${completionPct}%`, sub: completionPct >= 70 ? 'On track' : 'Behind', color: completionPct >= 70 ? 'text-primary' : 'text-amber-400' },
          { label: 'OVERDUE ITEMS', value: overdueCount, sub: overdueCount > 0 ? 'Needs attention' : 'All clear', color: overdueCount > 0 ? 'text-red-400' : 'text-foreground' },
          { label: 'PENDING REVIEW', value: reviewCount, sub: 'Awaiting review', color: reviewCount > 0 ? 'text-purple-400' : 'text-foreground' },
          { label: 'NOT STARTED', value: notStartedCount, sub: 'Stations not started', color: notStartedCount > 0 ? 'text-amber-400' : 'text-foreground' },
          { label: 'LOW STOCK INGREDIENTS', value: 0, sub: 'Below par levels', color: 'text-foreground' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card border border-border/60 rounded-xl px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
            <div className="flex items-center gap-1 mt-1">
              {label === 'PREP COMPLETION' && (
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${completionPct}%` }} />
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Needs Attention Strip */}
      {overdueCount > 0 && (
        <div className="hidden lg:flex items-center gap-3 px-8 py-2.5 bg-amber-500/5 border-b border-amber-500/20">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Needs Attention</span>
          {tasks.filter(t => t.status === 'overdue').slice(0,3).map(t => (
            <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold">{t.name} is overdue</span>
          ))}
          <button onClick={() => navigate('/prep-templates')} className="ml-auto h-7 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 active:scale-95">
            View All Prep <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Desktop 3-Col Layout */}
      <div className="hidden lg:grid lg:grid-cols-[220px_1fr_260px] lg:gap-0 lg:items-start min-h-[calc(100vh-200px)]">
        {/* LEFT: Stations */}
        <div className="border-r border-border/30 px-4 py-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stations</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stations..." className="w-full h-7 pl-7 pr-2 bg-card border border-border rounded-lg text-[11px] text-foreground" />
          </div>
          <div className="flex flex-wrap gap-1">
            {['All Stations', 'In Progress', 'Not Started', 'Complete'].map(f => (
              <button key={f} onClick={() => setFilterStation(f === 'All Stations' ? '' : f)} className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all', filterStation === (f === 'All Stations' ? '' : f) ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border')}>
                {f}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            {filtered.map(group => {
              const pct = group.itemCount > 0 ? Math.round((group.completedCount / group.itemCount) * 100) : 0;
              return (
                <button key={`${group.date}-${group.station}`} onClick={() => { haptics.light(); setFilterStation(group.station); }} className={cn('w-full text-left bg-card border rounded-xl px-3 py-2.5 space-y-1.5 active:scale-[0.98] transition-all hover:border-border', filterStation === group.station ? 'border-primary/40' : 'border-border/60')}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground truncate">{group.station}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{group.completedCount}/{group.itemCount}</span>
                      <span className="text-[10px] font-bold text-foreground">{pct}%</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-primary' : 'bg-amber-500')} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{group.completedCount} complete</p>
                </button>
              );
            })}
          </div>
          {isAdmin && (
            <button onClick={() => { haptics.light(); setShowAddStation(true); }} className="w-full h-8 rounded-lg border border-dashed border-border text-xs font-bold text-muted-foreground flex items-center justify-center gap-1.5 hover:border-primary/40 hover:text-primary transition-all">
              <Plus className="h-3.5 w-3.5" /> Add Station
            </button>
          )}
        </div>

        {/* CENTER: Prep Queue */}
        <div className="px-5 py-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Prep Queue</p>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span>Sort by: Due Time</span>
            </div>
          </div>
          {/* Filter tabs */}
          <div className="flex gap-1">
            {['All', 'Overdue', 'Due Today', 'Due Tomorrow'].map(tab => (
              <button key={tab} onClick={() => setFilterTab(tab)} className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all', filterTab === tab ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border')}>
                {tab}{tab === 'Overdue' && overdueCount > 0 ? ` (${overdueCount})` : tab === 'Due Today' && notStartedCount > 0 ? ` (${notStartedCount + tasks.filter(t=>t.status==='in_progress').length})` : ''}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-24"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : queueTasks.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No prep tasks</p>
              {isAdmin && <button onClick={() => navigate('/prep-templates')} className="mt-3 btn-primary text-xs px-4 py-2 flex items-center gap-1 mx-auto"><Plus className="h-3.5 w-3.5" />Add from Templates</button>}
            </div>
          ) : (
            <div className="space-y-1.5">
              {queueTasks.map(task => {
                const st = statusBadge(task.status);
                return (
                  <div key={task.id} className="bg-card border border-border/60 rounded-xl px-3 py-2.5 flex items-center gap-3 hover:border-border transition-all">
                    <input type="checkbox" checked={['completed','approved'].includes(task.status)} onChange={() => {}} className="rounded border-border shrink-0" readOnly />
                    <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{task.name}</p>
                      <p className="text-[10px] text-muted-foreground">{task.station}</p>
                      <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden w-24">
                        <div className={cn('h-full rounded-full bg-primary')} style={{ width: `${task.quantity && task.completed_qty ? Math.min(100, Math.round((task.completed_qty / task.quantity) * 100)) : 0}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', st.cls)}>{st.label}</span>
                      {task.due_time && <p className="text-[10px] text-muted-foreground">{task.due_time}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom buttons */}
          <div className="flex gap-2 pt-2">
            <button onClick={() => navigate('/prep-templates')} className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95">
              Assign Prep
            </button>
            <button onClick={() => navigate('/prep-templates')} className="h-9 px-4 rounded-lg border border-border bg-card text-xs font-bold text-foreground flex items-center gap-1.5 hover:bg-muted active:scale-95">
              View All Prep <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT: Support */}
        <div className="border-l border-border/30 px-4 py-4 space-y-4">
          {/* Manager Review */}
          {reviewCount > 0 && (
            <div className="bg-card border border-border/60 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manager Review</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">{reviewCount} items</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{reviewCount} items awaiting review</p>
              <button onClick={() => navigate('/prep-templates')} className="w-full h-7 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/80 active:scale-95">Review All</button>
            </div>
          )}
          {/* Photo Review */}
          <div className="bg-card border border-border/60 rounded-xl p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Photo Review</p>
            <p className="text-xs text-muted-foreground mb-2">0 pending · 0 flagged</p>
            <button onClick={() => navigate('/more')} className="w-full h-7 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/80 active:scale-95">View Photo Review</button>
          </div>
          {/* Prep Notes */}
          <div className="bg-card border border-border/60 rounded-xl p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Prep Notes</p>
            <textarea className="w-full h-16 px-2.5 py-2 bg-background border border-border rounded-lg text-xs text-foreground resize-none placeholder:text-muted-foreground" placeholder="Add a note for your team..." />
            <button className="w-full mt-2 h-7 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/80 active:scale-95">Add Note</button>
          </div>
        </div>
      </div>

      {/* Add Station Modal */}
      {showAddStation && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-foreground">Add Station</h2>
              <button onClick={() => setShowAddStation(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Station Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Grill, Sauté, Cold Station"
                  value={newStation.name}
                  onChange={e => setNewStation(s => ({ ...s, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Shift</label>
                <select value={newStation.shift} onChange={e => setNewStation(s => ({ ...s, shift: e.target.value }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                  <option value="all">All Shifts</option>
                  <option value="opening">Opening</option>
                  <option value="mid">Mid</option>
                  <option value="closing">Closing</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Default Job Code</label>
                <input
                  type="text"
                  placeholder="Prep Cook"
                  value={newStation.jobCode}
                  onChange={e => setNewStation(s => ({ ...s, jobCode: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-border">
              <button onClick={() => setShowAddStation(false)} className="flex-1 h-9 rounded-lg border border-border bg-card text-sm font-bold text-foreground hover:bg-muted active:scale-95">Cancel</button>
              <button
                disabled={!newStation.name.trim() || addingStation}
                onClick={async () => {
                  setAddingStation(true);
                  haptics.medium();
                  await base44.entities.PrepTemplate.create({
                    name: `${newStation.name.trim()} Prep`,
                    station: newStation.name.trim(),
                    jobCode: newStation.jobCode || 'Prep Cook',
                    shift: newStation.shift,
                    isActive: true,
                    repeatType: 'weekly',
                    repeatDays: [1,2,3,4,5],
                    itemCount: 0,
                  });
                  setAddingStation(false);
                  setShowAddStation(false);
                  setNewStation({ name: '', shift: 'all', jobCode: 'Prep Cook' });
                  navigate('/prep-templates');
                }}
                className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {addingStation ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="h-4 w-4" /> Create</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Content */}
      <div className="lg:hidden p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-secondary-text">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-secondary-text text-sm">No prep lists for today</div>
        ) : (
          filtered.map(group => (
            <div key={`${group.date}-${group.station}`}>
              <p className="text-xs font-bold text-secondary-text mb-2 uppercase tracking-wider">{group.station}</p>
              <PrepListGroup group={group} tasks={tasks} onTaskStatusChange={loadTasks} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;