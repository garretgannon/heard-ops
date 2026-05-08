import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Activity, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import DesktopPageHeader from '@/components/DesktopPageHeader';

export default function Pulse() {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeAlerts: 0,
    overdueItems: 0,
    completionRate: 0,
    teamOnDuty: 0,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [tasks, logs] = await Promise.all([
          base44.entities.Task.list('-updated_date', 50).catch(() => []),
          base44.entities.UnifiedLog.list('-created_date', 50).catch(() => []),
        ]);

        const overdueCount = tasks.filter((t) => t.status === 'overdue').length;
        const completedCount = tasks.filter((t) => ['complete', 'approved'].includes(t.status)).length;
        const completionPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
        const alertCount = logs.filter((l) => l.status === 'open' || l.requires_review).length;

        setMetrics({
          activeAlerts: alertCount,
          overdueItems: overdueCount,
          completionRate: completionPct,
          teamOnDuty: tasks.length > 0 ? Math.ceil(tasks.length / 5) : 0,
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to load metrics:', err);
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-32 bg-background min-h-screen">
      <DesktopPageHeader title="Pulse" subtitle="Real-time operational health" />

      <div className="px-4 py-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        {/* Operational Health Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Completion Rate */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-xs font-bold text-muted-foreground uppercase">Completion</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.completionRate}%</p>
            <p className="text-xs text-muted-foreground">Tasks on track</p>
          </div>

          {/* Active Alerts */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-xs font-bold text-muted-foreground uppercase">Alerts</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.activeAlerts}</p>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </div>

          {/* Overdue Items */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-bold text-muted-foreground uppercase">Overdue</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.overdueItems}</p>
            <p className="text-xs text-muted-foreground">Tasks behind</p>
          </div>

          {/* Team Active */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-bold text-muted-foreground uppercase">Team</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.teamOnDuty}</p>
            <p className="text-xs text-muted-foreground">Staff active</p>
          </div>
        </div>

        {/* Insights Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase text-muted-foreground">Operational Insights</h3>
          <div className="space-y-3">
            {metrics.activeAlerts > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-red-600">{metrics.activeAlerts} items need attention</p>
                  <p className="text-xs text-red-500/80">Check Logs tab for details</p>
                </div>
              </div>
            )}
            {metrics.overdueItems > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Clock className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-amber-600">{metrics.overdueItems} tasks overdue</p>
                  <p className="text-xs text-amber-500/80">Prioritize completion immediately</p>
                </div>
              </div>
            )}
            {metrics.completionRate === 100 && metrics.activeAlerts === 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Activity className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-green-600">All systems operational</p>
                  <p className="text-xs text-green-500/80">Restaurant running smoothly</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;