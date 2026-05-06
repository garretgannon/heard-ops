import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

export default function Step5OperationalAlerts({ onComplete }) {
  const [alerts, setAlerts] = useState([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [equipment, tempLogs, maintenanceIssues] = await Promise.all([
          base44.entities.Equipment.filter({ isActive: true }).catch(() => []),
          base44.entities.TemperatureLog.list('-logged_at', 5).catch(() => []),
          base44.entities.Issue.filter({ priority: 'critical' }).catch(() => []),
        ]);

        const allAlerts = [];
        tempLogs.filter(t => t.is_above_range || t.is_below_range).forEach(t => {
          allAlerts.push({ type: 'temp', severity: 'critical', title: `Temperature Alert - ${t.location_name}`, value: `${t.temperature}°F` });
        });
        maintenanceIssues.slice(0, 3).forEach(m => {
          allAlerts.push({ type: 'maintenance', severity: 'high', title: m.title, value: m.priority });
        });
        setAlerts(allAlerts.slice(0, 8));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleComplete = () => {
    haptics.medium?.();
    onComplete(5, { alertsReviewed: true, criticalCount: alerts.filter(a => a.severity === 'critical').length });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Operational Alerts</h2>
        <p className="text-xs text-secondary-text">Critical system and facility issues</p>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
          <p className="text-sm font-bold text-green-400">All clear</p>
          <p className="text-xs text-secondary-text mt-1">No critical alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={cn(
                'bg-card border-l-4 border border-border rounded-lg p-2.5',
                alert.severity === 'critical' ? 'border-l-red-500' : 'border-l-amber-500'
              )}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400')} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">{alert.title}</p>
                  {alert.value && <p className="text-[9px] text-secondary-text mt-0.5">{alert.value}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-3 mt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => {
              haptics.light?.();
              setAcknowledged(e.target.checked);
            }}
            className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
          <span className="text-xs text-foreground font-semibold">
            I acknowledge all operational alerts and have noted critical items.
          </span>
        </label>

        <button
          onClick={handleComplete}
          disabled={!acknowledged}
          className={cn(
            'w-full h-9 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all',
            acknowledged
              ? 'bg-primary text-primary-foreground active:scale-95'
              : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
          )}
        >
          <Check className="h-4 w-4" />
          Continue
        </button>
      </div>
    </div>
  );
}