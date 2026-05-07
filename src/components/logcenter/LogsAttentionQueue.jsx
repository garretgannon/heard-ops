import { AlertTriangle, AlertCircle, Zap, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

function AttentionItem({ icon: Icon, iconColor, label, count, onView }) {
  if (count === 0) return null;
  return (
    <button
      onClick={onView}
      className="w-full text-left p-2.5 rounded-lg border border-border/40 bg-card/50 hover:bg-muted transition-all active:scale-95 flex items-center gap-2">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-foreground">{label}</p>
        <p className="text-[9px] text-muted-foreground">{count} item{count > 1 ? 's' : ''}</p>
      </div>
      <span className="text-[10px] font-extrabold text-foreground/60 shrink-0">{count}</span>
    </button>
  );
}

export default function LogsAttentionQueue({ logs, onFilterClick, isAdmin }) {
  // Calculate attention items
  const needsReview = logs.filter(l => l.status === 'needs_review' || l.requiresReview).length;
  const failedTemps = logs.filter(l => l.type === 'temperature' && (l.status === 'flagged' || l.status === 'failed')).length;
  const openMaint = logs.filter(l => l.type === 'maintenance' && ['open', 'in_progress'].includes(l.status)).length;
  const incidents = logs.filter(l => l.type === 'incident').length;
  const overdue = logs.filter(l => {
    const daysOld = l.ts ? Math.floor((Date.now() - new Date(l.ts).getTime()) / 86400000) : 0;
    return daysOld > 0 && !['completed', 'approved', 'resolved'].includes(l.status);
  }).length;
  const employeeLogs = isAdmin ? logs.filter(l => l.type === 'employee').length : 0;

  const totalAttention = needsReview + failedTemps + openMaint + incidents + overdue + employeeLogs;

  if (totalAttention === 0) {
    return (
      <div className="bg-card border border-border/40 rounded-xl p-4 text-center">
        <CheckCircle2 className="h-6 w-6 text-green-400 mx-auto mb-2" />
        <p className="text-xs font-bold text-foreground">All Clear</p>
        <p className="text-[10px] text-muted-foreground mt-1">No urgent items</p>
      </div>
    );
  }

  return (
    <div className="bg-card/40 border border-border/40 rounded-xl p-3.5 space-y-2">
      <div className="flex items-center gap-2 pb-2 border-b border-border/20">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">Attention Queue</p>
        {totalAttention > 0 && (
          <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
            {totalAttention}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <AttentionItem
          icon={AlertTriangle}
          iconColor="text-red-400"
          label="Needs Review"
          count={needsReview}
          onView={() => onFilterClick({ requiresReview: true })}
        />
        <AttentionItem
          icon={AlertCircle}
          iconColor="text-blue-400"
          label="Failed Temps"
          count={failedTemps}
          onView={() => onFilterClick({ types: ['temperature'], passFail: 'failed' })}
        />
        <AttentionItem
          icon={Zap}
          iconColor="text-amber-400"
          label="Open Maintenance"
          count={openMaint}
          onView={() => onFilterClick({ types: ['maintenance'], openClosed: 'open' })}
        />
        <AttentionItem
          icon={AlertCircle}
          iconColor="text-pink-400"
          label="Incidents"
          count={incidents}
          onView={() => onFilterClick({ types: ['incident'] })}
        />
        <AttentionItem
          icon={Clock}
          iconColor="text-orange-400"
          label="Overdue"
          count={overdue}
          onView={() => onFilterClick({ openClosed: 'open', datePreset: 'last_7' })}
        />
        {isAdmin && (
          <AttentionItem
            icon={AlertCircle}
            iconColor="text-purple-400"
            label="Employee Logs"
            count={employeeLogs}
            onView={() => onFilterClick({ types: ['employee'] })}
          />
        )}
      </div>
    </div>
  );
}