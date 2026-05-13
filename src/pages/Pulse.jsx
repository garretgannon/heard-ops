import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, AlertCircle, CheckSquare, Users, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND_ASSETS } from '@/lib/brandAssets';

const PULSE_ICON_URL = BRAND_ASSETS.appIcon;

const METRIC_CONFIG = [
  { key: 'completionRate',   label: 'Completion',   unit: '%', icon: TrendingUp,  color: 'text-green-400',  glow: 'rgba(34,197,94,0.25)',   border: 'border-green-500/25',  bg: 'rgba(34,197,94,0.05)' },
  { key: 'activeAlerts',     label: 'Alerts',       unit: '',  icon: AlertCircle, color: 'text-red-400',    glow: 'rgba(239,68,68,0.25)',    border: 'border-red-500/25',    bg: 'rgba(239,68,68,0.05)', alertWhen: v => v > 0 },
  { key: 'overdueItems',     label: 'Overdue',      unit: '',  icon: Clock,       color: 'text-amber-400',  glow: 'rgba(245,158,11,0.25)',   border: 'border-amber-500/25',  bg: 'rgba(245,158,11,0.05)', alertWhen: v => v > 0 },
  { key: 'teamOnDuty',       label: 'Staff Active', unit: '',  icon: Users,       color: 'text-blue-400',   glow: 'rgba(96,165,250,0.25)',   border: 'border-blue-500/25',   bg: 'rgba(96,165,250,0.05)' },
  { key: 'pendingApprovals', label: 'Approvals',    unit: '',  icon: CheckSquare, color: 'text-primary',    glow: 'rgba(230,106,31,0.3)',    border: 'border-primary/25',    bg: 'rgba(230,106,31,0.05)', alertWhen: v => v > 0, route: '/approvals' },
];

export default function Pulse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({ activeAlerts: 0, overdueItems: 0, completionRate: 0, teamOnDuty: 0, pendingApprovals: 0 });

  const loadMetrics = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    try {
      const [tasks, logs, approvals, shifts] = await Promise.all([
        base44.entities.GeneratedTask.list('-updated_date', 50).catch(() => []),
        base44.entities.UnifiedLog.list('-created_date', 50).catch(() => []),
        base44.entities.ApprovalQueue.filter({ status: 'pending' }).catch(() => []),
        base44.entities.StaffShift?.list?.('-created_date', 20).catch(() => []),
      ]);
      const completedCount = tasks.filter(t => ['completed', 'approved'].includes(t.status)).length;
      setMetrics({
        activeAlerts:     logs.filter(l => l.priority === 'critical' || l.status === 'open').length,
        overdueItems:     tasks.filter(t => t.status === 'overdue').length,
        completionRate:   tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0,
        teamOnDuty:       shifts?.filter(s => ['active','in_progress'].includes(s.status)).length || 0,
        pendingApprovals: approvals?.length || 0,
      });
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(() => loadMetrics({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="app-screen flex flex-col items-center justify-center gap-3 pb-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent"
          style={{ boxShadow: '0 0 20px rgba(230,106,31,0.35)' }}
        />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading pulse…</p>
      </div>
    );
  }

  const isHealthy = metrics.activeAlerts === 0 && metrics.overdueItems === 0;

  return (
    <div className="app-screen">
      <main className="app-page mx-auto max-w-[640px] lg:max-w-6xl space-y-5">

        {/* Header */}
        <header className="flex items-start justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 shrink-0"
              style={{ background: 'rgba(230,106,31,0.1)', boxShadow: '0 0 16px rgba(230,106,31,0.15)' }}
            >
              <img src={PULSE_ICON_URL} alt="Pulse" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <p className="metric-label">Operations</p>
              <h1 className="mt-0.5 text-2xl font-black tracking-tight text-foreground">Pulse</h1>
            </div>
          </div>
          <button
            onClick={() => loadMetrics({ quiet: true })}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <RefreshCw className={cn('h-4 w-4 text-muted-foreground', refreshing && 'animate-spin')} />
          </button>
        </header>

        {/* Health banner */}
        <div
          className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3', isHealthy ? 'border-green-500/30' : 'border-amber-500/30')}
          style={{ background: isHealthy ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)' }}
        >
          <div className={cn('h-2 w-2 rounded-full', isHealthy ? 'bg-green-400' : 'bg-amber-400')}
            style={{ boxShadow: isHealthy ? '0 0 8px rgba(74,222,128,0.7)' : '0 0 8px rgba(251,191,36,0.7)', animation: 'pulse 2s ease-in-out infinite' }} />
          <p className={cn('text-sm font-black', isHealthy ? 'text-green-400' : 'text-amber-400')}>
            {isHealthy ? 'All systems operational' : `${metrics.activeAlerts + metrics.overdueItems} item${metrics.activeAlerts + metrics.overdueItems === 1 ? '' : 's'} need attention`}
          </p>
          <p className="ml-auto text-[10px] font-bold text-muted-foreground">Live</p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {METRIC_CONFIG.map(({ key, label, unit, icon: Icon, color, glow, border, bg, alertWhen, route }) => {
            const value = metrics[key];
            const isAlert = alertWhen?.(value);
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={route ? () => navigate(route) : undefined}
                className={cn('relative overflow-hidden rounded-2xl border p-4 space-y-3', route && 'cursor-pointer active:scale-[0.97] transition-all', isAlert ? border : 'border-border/40')}
                style={{
                  background: isAlert ? bg : 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)',
                  boxShadow: isAlert ? `0 0 20px ${glow}` : '0 1px 3px rgba(0,0,0,0.4)',
                }}
              >
                <div className="flex items-center justify-between">
                  <Icon className={cn('h-4 w-4', isAlert ? color : 'text-muted-foreground/60')}
                    style={isAlert ? { filter: `drop-shadow(0 0 4px ${glow})` } : undefined} />
                  {route && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />}
                </div>
                <div>
                  <p className={cn('text-3xl font-black tabular-nums tracking-tight', isAlert ? color : 'text-foreground')}
                    style={isAlert ? { textShadow: `0 0 20px ${glow}` } : undefined}>
                    {value}{unit}
                  </p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="space-y-2">
          <p className="metric-label px-1">Quick Actions</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Tasks',    sub: 'Staff queue',   path: '/tasks' },
              { label: 'Logs',     sub: 'Activity feed', path: '/logs' },
              { label: 'Team',     sub: 'Who\'s on',     path: '/team' },
            ].map(({ label, sub, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="rounded-xl border border-border/40 px-3 py-3 text-left transition-all active:scale-[0.97]"
                style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}
              >
                <p className="text-sm font-black text-foreground">{label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

export const hideBase44Index = true;
