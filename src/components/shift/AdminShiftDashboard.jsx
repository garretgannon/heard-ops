import { useState } from 'react';
import { Plus, Zap, AlertCircle, Thermometer, Settings } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setShowAddTask(true)}
          className="h-10 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Task
        </button>
        <button
          onClick={() => setShowAddLog(true)}
          className="h-10 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Thermometer className="h-4 w-4" /> Temp Log
        </button>
        <button className="h-10 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 active:scale-95 transition-all flex items-center gap-1.5">
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

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left: Team */}
        <div>
          <ShiftTeamPanel
            tasks={tasks}
            selectedEmployee={selectedEmployee}
            onSelectEmployee={setSelectedEmployee}
          />
        </div>

        {/* Middle: Tasks */}
        <div className="col-span-2">
          <ShiftTasksPanel
            tasks={filteredTasks}
            selectedEmployee={selectedEmployee}
            onTaskUpdate={onTaskUpdate}
          />
        </div>
      </div>

      {/* Category & Station Progress */}
      <div className="grid grid-cols-2 gap-4">
        <ShiftCategoryProgress tasks={tasks} />
        <ShiftStationProgress tasks={tasks} />
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