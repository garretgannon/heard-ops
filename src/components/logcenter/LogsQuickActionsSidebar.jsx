import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Wrench, Thermometer, Plus } from 'lucide-react';
import { LOG_TYPES } from '@/components/activity-logs/logConfig';

export default function LogsQuickActionsSidebar({ logs, onLogClick, onCreateLog, currentUser }) {
  const { needsReview, openMaintenance, failedTemps } = useMemo(() => {
    const nr = logs.filter(l => l.requiresReview).slice(0, 5);
    const om = logs.filter(l => l.type === 'maintenance' && l.status === 'open').slice(0, 5);
    const ft = logs.filter(l => l.type === 'temperature' && l.status === 'flagged').slice(0, 5);
    return { needsReview: nr, openMaintenance: om, failedTemps: ft };
  }, [logs]);

  const QuickSection = ({ icon: Icon, title, count, items, color }) => (
    <div className="border-t border-border/40 pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-xs font-bold text-foreground uppercase tracking-widest">{title}</span>
        <span className="ml-auto h-5 px-1.5 rounded-full bg-primary/20 text-primary text-[9px] font-extrabold flex items-center">{count}</span>
      </div>
      {items.length > 0 ? (
        <div className="space-y-1">
          {items.map(log => (
            <button
              key={log.id}
              onClick={() => onLogClick(log)}
              className="w-full text-left px-2.5 py-2 rounded-lg bg-card/70 hover:bg-card border border-border/40 hover:border-primary/40 transition-all active:scale-95">
              <p className="text-[10px] font-bold text-foreground line-clamp-1">{log.title}</p>
              <p className="text-[9px] text-muted-foreground">{log.subtitle || log.person}</p>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[9px] text-muted-foreground italic">None</p>
      )}
    </div>
  );

  const quickCreateTypes = [
    { id: 'temperature', icon: Thermometer, label: 'Temp Log' },
    { id: 'waste', icon: '🗑️', label: 'Waste' },
    { id: 'cleaning', icon: '🧹', label: 'Cleaning' },
    { id: 'issue', icon: AlertTriangle, label: 'Issue' },
  ];

  return (
    <div className="w-72 border-l border-border/40 overflow-y-auto p-4 space-y-0 bg-card/50">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h3>

      {/* Quick Create buttons */}
      <div className="grid grid-cols-2 gap-2 pb-3 border-b border-border/40">
        {quickCreateTypes.map(type => {
          const Icon = typeof type.icon === 'string' ? null : type.icon;
          return (
            <button
              key={type.id}
              onClick={onCreateLog}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-[10px] font-bold transition-all active:scale-95">
              {Icon ? <Icon className="h-3.5 w-3.5" /> : <span className="text-sm">{type.icon}</span>}
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Needs Review */}
      <QuickSection
        icon={AlertTriangle}
        title="Needs Review"
        count={needsReview.length}
        items={needsReview}
        color="text-purple-400"
      />

      {/* Open Maintenance */}
      <QuickSection
        icon={Wrench}
        title="Maintenance"
        count={openMaintenance.length}
        items={openMaintenance}
        color="text-amber-400"
      />

      {/* Failed Temps */}
      <QuickSection
        icon={Thermometer}
        title="Failed Temps"
        count={failedTemps.length}
        items={failedTemps}
        color="text-red-400"
      />
    </div>
  );
}