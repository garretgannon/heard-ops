import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { AlertCircle, CheckCircle2, TrendingUp, Users, Zap } from 'lucide-react';

export default function AppOverview() {
  const { user } = useCurrentUser();
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
      const [tasks, approvals, alerts, equipment] = await Promise.all([
        base44.entities.GeneratedTask?.filter?.({ status: { $in: ['completed', 'pending', 'in_progress'] } }, '-updated_date', 100).catch(() => []),
        base44.entities.ApprovalQueue?.filter?.({ status: 'pending' }, '-submitted_at', 50).catch(() => []),
        base44.entities.OperationalCheck?.filter?.({ status: { $in: ['failed', 'overdue'] } }, '-updated_date', 50).catch(() => []),
        base44.entities.Equipment?.filter?.({ isActive: true }, '', 50).catch(() => []),
      ]);

      const completed = (tasks || []).filter(t => t.status === 'completed').length;
      const total = (tasks || []).length;

      setMetrics({
        completedTasks: completed,
        totalTasks: total,
        pendingApprovals: (approvals || []).length,
        openAlerts: (alerts || []).length,
        equipmentIssues: (equipment || []).filter(e => e.temp_enabled && e.isActive).length,
      });
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
    setLoading(false);
  };

  const completionPercent = metrics.totalTasks > 0 ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-600 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="border-b border-border/30 px-4 md:px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Overview</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Today's operational snapshot</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <p className="text-sm font-bold text-foreground">{user?.full_name || 'Manager'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Completion Score */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Shift Completion</p>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="mb-4">
              <p className="text-4xl font-extrabold text-foreground">{completionPercent}%</p>
              <p className="text-xs text-muted-foreground mt-1">{metrics.completedTasks} of {metrics.totalTasks} tasks complete</p>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Approvals Pending</p>
              <Zap className={`h-5 w-5 ${metrics.pendingApprovals > 0 ? 'text-amber-500' : 'text-green-500'}`} />
            </div>
            <p className="text-4xl font-extrabold text-foreground">{metrics.pendingApprovals}</p>
            <p className="text-xs text-muted-foreground mt-1">Items waiting for review</p>
            {metrics.pendingApprovals > 0 && (
              <button className="mt-4 w-full px-3 py-2 bg-primary/15 text-primary rounded-lg text-xs font-bold hover:bg-primary/25 transition-colors">
                Review Queue →
              </button>
            )}
          </div>

          {/* Alerts */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Alerts</p>
              <AlertCircle className={`h-5 w-5 ${metrics.openAlerts > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
            <p className="text-4xl font-extrabold text-foreground">{metrics.openAlerts}</p>
            <p className="text-xs text-muted-foreground mt-1">Issues needing attention</p>
            {metrics.openAlerts > 0 && (
              <button className="mt-4 w-full px-3 py-2 bg-red-500/15 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/25 transition-colors">
                View Alerts →
              </button>
            )}
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Equipment Status */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <p className="text-sm font-bold text-foreground">Equipment Health</p>
            </div>
            <p className="text-lg text-muted-foreground mb-3">{metrics.equipmentIssues} items monitored</p>
            <p className="text-xs text-muted-foreground">Temperature logs and maintenance tracked</p>
          </div>

          {/* Staff Status */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-purple-500" />
              <p className="text-sm font-bold text-foreground">Team Status</p>
            </div>
            <p className="text-lg text-muted-foreground mb-3">View shift assignments</p>
            <button className="w-full px-3 py-2 bg-purple-500/15 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-500/25 transition-colors">
              Go to Schedule →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="px-4 py-2 bg-blue-500/15 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/25 transition-colors">
              View Logs
            </button>
            <button className="px-4 py-2 bg-green-500/15 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/25 transition-colors">
              Start Shift
            </button>
            <button className="px-4 py-2 bg-amber-500/15 text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-500/25 transition-colors">
              Review Tasks
            </button>
            <button className="px-4 py-2 bg-purple-500/15 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-500/25 transition-colors">
              Team Directory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;