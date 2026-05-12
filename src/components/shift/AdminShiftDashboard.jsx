import { useState } from 'react';
import { Plus, AlertCircle, Thermometer, ClipboardList, Users, Activity } from 'lucide-react';
import ShiftMetricsBar from './ShiftMetricsBar';
import ShiftTeamPanel from './ShiftTeamPanel';
import ShiftTasksPanel from './ShiftTasksPanel';
import ShiftNeedsAttentionPanel from './ShiftNeedsAttentionPanel';
import ShiftCategoryProgress from './ShiftCategoryProgress';
import ShiftStationProgress from './ShiftStationProgress';
import UnifiedLogForm from '@/components/UnifiedLogForm';
import UnifiedTaskForm from '@/components/UnifiedTaskForm';

export default function AdminShiftDashboard({ tasks, stats, user, onTaskUpdate }) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);

  // Filter tasks based on selection
  const filteredTasks = selectedEmployee
    ? tasks.filter((t) => t.assigned_employee_id === selectedEmployee.id)
    : selectedMetric
    ? tasks.filter((t) => {
        if (selectedMetric === 'overdue') return t.status === 'overdue';
        if (selectedMetric === 'review') return t.status === 'needs_review';
        if (selectedMetric === 'unable') return t.status === 'unable_to_complete';
        return true;
      })
    : tasks;

  const handleQuickAction = (action) => {
    if (action === 'task') setShowAddTask(true);
    if (action === 'temp') setShowAddLog(true);
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="hidden lg:flex items-start justify-between gap-6 rounded-2xl border border-border/60 bg-card/70 px-6 py-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Shift Command</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Live Shift Control</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage staffing, workload and exceptions in one desktop command view.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center shrink-0">
          <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-2">
            <p className="text-lg font-black text-foreground">{stats.totalCount}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Tasks</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-2">
            <p className="text-lg font-black text-green-400">{stats.completedCount}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Done</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-2">
            <p className="text-lg font-black text-primary">{Math.round((stats.completedCount / Math.max(stats.totalCount, 1)) * 100)}%</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Complete</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap lg:gap-3">
        <button
          onClick={() => setShowAddTask(true)}
          className="h-10 px-3 lg:px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Task
        </button>
        <button
          onClick={() => setShowAddLog(true)}
          className="h-10 px-3 lg:px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Thermometer className="h-4 w-4" /> Temp Log
        </button>
        <button className="h-10 px-3 lg:px-4 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 active:scale-95 transition-all flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4" /> Issue
        </button>
      </div>

      {/* Metrics Bar */}
      <ShiftMetricsBar
        stats={stats}
        tasks={tasks}
        selectedMetric={selectedMetric}
        onMetricClick={setSelectedMetric}
      />

      {/* Main Desktop Grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-3 rounded-2xl border border-border/50 bg-card/50 p-3">
          <div className="mb-2 flex items-center gap-2 px-1 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Team Coverage
          </div>
          <ShiftTeamPanel
            tasks={tasks}
            selectedEmployee={selectedEmployee}
            onSelectEmployee={setSelectedEmployee}
          />
        </div>

        <div className="xl:col-span-9 rounded-2xl border border-border/50 bg-card/50 p-3">
          <div className="mb-2 flex items-center gap-2 px-1 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" /> Task Queue
          </div>
          <ShiftTasksPanel
            tasks={filteredTasks}
            selectedEmployee={selectedEmployee}
            onTaskUpdate={onTaskUpdate}
          />
        </div>
      </div>

      {/* Category & Station Progress */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> By Category
          </div>
          <ShiftCategoryProgress tasks={tasks} />
        </div>
        <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> By Station
          </div>
          <ShiftStationProgress tasks={tasks} />
        </div>
      </div>

      {/* Needs Attention */}
      <ShiftNeedsAttentionPanel tasks={tasks} />

      {/* Modals */}
      {showAddTask && (
        <UnifiedTaskForm onClose={() => setShowAddTask(false)} onSuccess={onTaskUpdate} />
      )}
      {showAddLog && (
        <UnifiedLogForm
          initialType="temperature"
          onClose={() => setShowAddLog(false)}
          onSuccess={onTaskUpdate}
        />
      )}
    </div>
  );
}
