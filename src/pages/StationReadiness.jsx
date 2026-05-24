import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, AlertTriangle, Clock, Zap,
  AlertCircle
} from 'lucide-react';

const CHECK_TYPE_CONFIG = {
  temperature: { label: 'Temperature', icon: '🌡️', color: 'bg-blue-500/20 text-blue-400' },
  sanitizer: { label: 'Sanitizer PPM', icon: '🧪', color: 'bg-green-500/20 text-green-400' },
  chemical_dilution: { label: 'Chemical Dilution', icon: '🧴', color: 'bg-purple-500/20 text-purple-400' },
  station_readiness: { label: 'Station Readiness', icon: '✅', color: 'bg-amber-500/20 text-amber-400' },
  cooling_progression: { label: 'Cooling Progression', icon: '❄️', color: 'bg-cyan-500/20 text-cyan-400' },
  opening_verification: { label: 'Opening Verification', icon: '🌅', color: 'bg-orange-500/20 text-orange-400' },
  closing_verification: { label: 'Closing Verification', icon: '🌙', color: 'bg-indigo-500/20 text-indigo-400' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/15' },
  in_progress: { label: 'In Progress', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  completed: { label: 'Complete', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/15' },
  failed: { label: 'Failed', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15' },
  overdue: { label: 'Overdue', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/15' },
  escalated: { label: 'Escalated', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/15' },
};

function CheckCard({ check, onUpdate, isManager }) {
  const typeConfig = CHECK_TYPE_CONFIG[check.check_type];
  const statusConfig = STATUS_CONFIG[check.status];
  const Icon = statusConfig.icon;

  const handleComplete = async () => {
    haptics.medium();
    await base44.entities.OperationalCheck.update(check.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: (await base44.auth.me()).email,
    });
    onUpdate?.();
  };

  const handleFail = async () => {
    if (confirm('Mark this check as failed?')) {
      await base44.entities.OperationalCheck.update(check.id, { status: 'failed' });
      onUpdate?.();
    }
  };

  return (
    <div className={cn('bg-card border rounded-lg overflow-hidden transition-all', check.status === 'failed' ? 'border-red-500/40' : check.status === 'completed' ? 'border-green-500/30' : 'border-border')}>
      <div className="p-3">
        <div className="flex items-start gap-3 mb-2">
          <span className="text-2xl">{typeConfig.icon}</span>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">{check.check_name || typeConfig.label}</h3>
            {check.equipment_name && <p className="text-xs text-muted-foreground mt-0.5">📍 {check.equipment_name}</p>}
            {check.station_name && <p className="text-xs text-muted-foreground">🏢 {check.station_name}</p>}
          </div>
          <div className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold', statusConfig.bg)}>
            <Icon className={cn('h-3.5 w-3.5', statusConfig.color)} />
            <span className={statusConfig.color}>{statusConfig.label}</span>
          </div>
        </div>

        {/* Data Display */}
        {check.temperature_value !== undefined && (
          <div className={cn('p-2 rounded-lg text-sm font-bold mb-2', check.temp_status === 'safe' ? 'bg-green-500/15 text-green-400' : check.temp_status === 'warning' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400')}>
            {check.temperature_value}°F {check.temp_min && check.temp_max && `(Safe: ${check.temp_min}-${check.temp_max}°F)`}
          </div>
        )}

        {check.sanitizer_ppm !== undefined && (
          <div className="p-2 rounded-lg bg-green-500/15 text-sm font-bold text-green-400 mb-2">
            {check.sanitizer_ppm} PPM {check.sanitizer_min_ppm && `(Min: ${check.sanitizer_min_ppm})`}
          </div>
        )}

        {check.description && <p className="text-xs text-muted-foreground mb-2">{check.description}</p>}

        {check.status === 'failed' && check.corrective_action_taken && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300 mb-2">
            ⚠️ {check.corrective_action_taken}
          </div>
        )}
      </div>

      {/* Actions */}
      {check.status !== 'completed' && (
        <div className="border-t border-border/50 px-3 py-2 flex gap-2 bg-muted/20">
          <button
            onClick={handleComplete}
            className="flex-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all active:scale-95"
          >
            ✓ Complete
          </button>
          {isManager && (
            <button
              onClick={handleFail}
              className="flex-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all active:scale-95"
            >
              ✗ Failed
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function StationReadiness() {
  const { user, isAdmin } = useCurrentUser();
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');

  const load = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const data = await base44.entities.OperationalCheck.filter(
      { shift_date: today },
      '-created_date',
      200
    ).catch(() => []);
    setChecks(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = checks.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterPhase !== 'all' && c.shift_phase !== filterPhase) return false;
    return true;
  });

  const stats = {
    total: checks.length,
    completed: checks.filter(c => c.status === 'completed').length,
    overdue: checks.filter(c => c.status === 'overdue').length,
    failed: checks.filter(c => c.status === 'failed').length,
  };

  return (
    <div className="pb-28">
      <DesktopPageHeader
        title="Station Readiness"
        subtitle="Operational safety checks and shift preparation"
        actions={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{stats.completed} / {stats.total} complete</span>
            {stats.overdue > 0 && <span className="text-red-400 font-bold">⚠️ {stats.overdue} overdue</span>}
          </div>
        }
      />

      {/* Stats Bar */}
      <div className="bg-card border-b border-border px-4 py-3 grid grid-cols-4 gap-2 lg:mt-14">
        <div className="rounded-lg p-2 text-center" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 24px rgba(0,0,0,0.28)' }}>
          <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
          <p className="text-[9px] text-muted-foreground">Completed</p>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 24px rgba(0,0,0,0.28)' }}>
          <p className="text-2xl font-bold text-amber-400">{stats.total - stats.completed}</p>
          <p className="text-[9px] text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 24px rgba(0,0,0,0.28)' }}>
          <p className="text-2xl font-bold text-orange-400">{stats.overdue}</p>
          <p className="text-[9px] text-muted-foreground">Overdue</p>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 24px rgba(0,0,0,0.28)' }}>
          <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
          <p className="text-[9px] text-muted-foreground">Failed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border-b border-border px-4 py-3 flex gap-2 overflow-x-auto pb-1">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg bg-background border border-border font-semibold text-foreground">
          <option value="all">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg bg-background border border-border font-semibold text-foreground">
          <option value="all">All Phases</option>
          <option value="opening">Opening</option>
          <option value="mid">Mid Shift</option>
          <option value="closing">Closing</option>
        </select>
      </div>

      {/* Checks Grid */}
      <div className="app-page space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading checks…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 card-glass border border-border rounded-xl">
            <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-foreground font-semibold">All done!</p>
            <p className="text-xs text-muted-foreground mt-1">No pending checks for right now</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(check => (
              <CheckCard key={check.id} check={check} onUpdate={load} isManager={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;