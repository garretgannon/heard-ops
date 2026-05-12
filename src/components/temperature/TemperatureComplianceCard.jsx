import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function TemperatureComplianceCard() {
  const [stats, setStats] = useState({
    dueTodayCount: 0,
    completedTodayCount: 0,
    missedCount: 0,
    failedCount: 0,
    needsReviewCount: 0,
    compliancePct: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get all temperature logs today
        const logsToday = await base44.entities.UnifiedLog.filter({ 
          type: 'temperature',
          status: { $nin: ['archived'] },
        }).catch(() => []);
        
        // Get all temperature tasks
        const tasks = await base44.entities.Task.filter({
          type: 'temperature',
        }).catch(() => []);

        // Today's logs
        const todayLogs = logsToday.filter(l => l.created_date?.startsWith(today));
        const completedToday = todayLogs.filter(l => l.status === 'closed' || l.status === 'resolved').length;
        const failedToday = todayLogs.filter(l => l.status === 'flagged' || (l.custom_metadata?.passFail === 'fail')).length;
        const needsReview = logsToday.filter(l => l.requires_review || l.review_status === 'pending').length;

        // Today's tasks
        const todayTasks = tasks.filter(t => t.due_date === today);
        const completedTodayTasks = todayTasks.filter(t => ['complete', 'approved'].includes(t.status)).length;
        const overdueToday = todayTasks.filter(t => t.status === 'overdue').length;

        const completionPct = todayTasks.length > 0 
          ? Math.round((completedTodayTasks / todayTasks.length) * 100) 
          : 100;

        setStats({
          dueTodayCount: todayTasks.length,
          completedTodayCount: completedTodayTasks,
          missedCount: overdueToday,
          failedCount: failedToday,
          needsReviewCount: needsReview,
          compliancePct: completionPct,
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to load temperature stats:', err);
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="card-glass border border-border rounded-xl p-6 h-40 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAlerts = stats.missedCount > 0 || stats.failedCount > 0 || stats.needsReviewCount > 0;

  return (
    <div className={`bg-card border rounded-xl p-6 space-y-4 ${hasAlerts ? 'border-status-critical/30' : 'border-border'}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg text-foreground">Temperature Compliance</h3>
          <p className="text-xs text-muted-foreground mt-1">Today's monitoring status</p>
        </div>
        {hasAlerts && <AlertTriangle className="h-5 w-5 text-status-critical" />}
      </div>

      {/* Main Metric */}
      <div className="bg-background rounded-lg p-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold text-primary">{stats.compliancePct}%</span>
          <span className="text-muted-foreground text-sm">Completion Rate</span>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div 
            className="bg-status-success h-2 rounded-full transition-all"
            style={{ width: `${stats.compliancePct}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <div className="bg-background rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary">{stats.dueTodayCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Due Today</div>
        </div>
        <div className="bg-background rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-status-success">{stats.completedTodayCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Completed</div>
        </div>
        <div className={`bg-background rounded-lg p-3 text-center ${stats.missedCount > 0 ? 'border border-status-behind/30' : ''}`}>
          <div className={`text-2xl font-bold ${stats.missedCount > 0 ? 'text-status-behind' : 'text-muted-foreground'}`}>
            {stats.missedCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Missed</div>
        </div>
        <div className={`bg-background rounded-lg p-3 text-center ${stats.failedCount > 0 ? 'border border-status-critical/30' : ''}`}>
          <div className={`text-2xl font-bold ${stats.failedCount > 0 ? 'text-status-critical' : 'text-muted-foreground'}`}>
            {stats.failedCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Failed</div>
        </div>
        <div className={`bg-background rounded-lg p-3 text-center ${stats.needsReviewCount > 0 ? 'border border-status-review/30' : ''}`}>
          <div className={`text-2xl font-bold ${stats.needsReviewCount > 0 ? 'text-status-review' : 'text-muted-foreground'}`}>
            {stats.needsReviewCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Review</div>
        </div>
      </div>
    </div>
  );
}