import { useNavigate } from 'react-router-dom';
import MetricsCards from './MetricsCards';
import DesktopGridLayout from './DesktopGridLayout';
import ActivityFeed from './ActivityFeed';
import TeamSnapshot from './TeamSnapshot';

export default function DesktopOverviewDashboard({
  stats,
  priorities,
  alerts,
  tasks,
  logs,
  onQuickAction,
  nextDueItem,
}) {
  const navigate = useNavigate();

  const handleMetricClick = (metricKey) => {
    if (metricKey === 'prep') navigate('/tasks?tab=prep');
    else if (metricKey === 'sidework') navigate('/tasks?tab=sidework');
    else if (metricKey === 'temperature') navigate('/logs?type=temperature');
    else if (metricKey === 'review') navigate('/logs?view=review');
    else if (metricKey === 'incidents') navigate('/logs?type=incident');
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <MetricsCards stats={stats} priorities={priorities} onMetricClick={handleMetricClick} />

      {/* 3-Column Grid */}
      <DesktopGridLayout
        stats={stats}
        tasks={tasks}
        logs={logs}
        onQuickAction={onQuickAction}
      />

      {/* Activity Feed & Team Snapshot */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <ActivityFeed logs={logs} tasks={tasks} />
        </div>
        <TeamSnapshot />
      </div>
    </div>
  );
}
