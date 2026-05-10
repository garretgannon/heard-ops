import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Activity, TrendingUp, Clock, AlertCircle, CheckSquare } from 'lucide-react';
 import StatusBadge from '@/components/pulse/StatusBadge';

 const PULSE_ICON_URL = 'https://media.base44.com/images/public/69f0c74de6e9ba52961af58a/4d2dcd0d8_HeardOS_pulse_mark.svg';

export default function Pulse() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeAlerts: 0,
    overdueItems: 0,
    completionRate: 0,
    teamOnDuty: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [tasks, logs, approvals, shifts] = await Promise.all([
          base44.entities.GeneratedTask.list('-updated_date', 50).catch(() => []),
          base44.entities.UnifiedLog.list('-created_date', 50).catch(() => []),
          base44.entities.ApprovalQueue.filter({ status: 'pending' }).catch(() => []),
          base44.entities.StaffShift?.list?.('-created_date', 20).catch(() => []),
        ]);

        const overdueCount = tasks.filter((t) => t.status === 'overdue').length;
        const completedCount = tasks.filter((t) => ['completed', 'approved'].includes(t.status)).length;
        const completionPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
        const criticalAlerts = logs.filter((l) => l.priority === 'critical' || l.status === 'open').length;
        const activeShifts = shifts?.filter((s) => s.status === 'active' || s.status === 'in_progress').length || 0;

        setMetrics({
          activeAlerts: criticalAlerts,
          overdueItems: overdueCount,
          completionRate: completionPct,
          teamOnDuty: activeShifts,
          pendingApprovals: approvals?.length || 0,
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to load metrics:', err);
        setLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
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
       <div className="border-b border-border/20 px-4 lg:px-8 py-4 flex items-center gap-3">
         <img src={PULSE_ICON_URL} alt="Pulse" className="h-8 w-8" />
         <div>
           <h1 className="font-bold text-xl">Pulse</h1>
           <p className="text-xs text-muted-foreground">Real-time operational health</p>
         </div>
       </div>

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
              <AlertCircle className="h-4 w-4 text-red-500" />
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

          {/* Pending Approvals */}
          <div onClick={() => navigate('/review-queue')} className="bg-card border border-border rounded-lg p-4 space-y-2 cursor-pointer hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase">Approvals</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.pendingApprovals}</p>
            <p className="text-xs text-muted-foreground">Pending review</p>
          </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 active:scale-95 transition-all">
           Open Tasks
          </button>
          <button onClick={() => navigate('/logs')} className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-bold hover:bg-secondary transition-all">
           View Logs
          </button>
          <button onClick={() => navigate('/team')} className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-bold hover:bg-secondary transition-all">
           Team Status
          </button>
          </div>

        {/* Status Insights Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-muted-foreground px-2">Status Overview</h3>
          <div className="space-y-2.5">
            {metrics.completionRate === 100 && metrics.activeAlerts === 0 ? (
              <StatusBadge status="on_track" label="On Track" />
            ) : (
              <>
                {metrics.activeAlerts > 0 && (
                  <StatusBadge status="attention" label="Attention" />
                )}
                {metrics.overdueItems > 0 && (
                  <StatusBadge status="behind" label="Behind" />
                )}
                {metrics.activeAlerts > 2 && (
                  <StatusBadge status="critical" label="Critical" />
                )}
              </>
            )}
            <StatusBadge status="info" label="Info">Latest update 2 min ago</StatusBadge>
          </div>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;