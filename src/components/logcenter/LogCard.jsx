import { CheckCircle2, AlertCircle, Clock, MapPin, Thermometer, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const LOG_TYPE_ICONS = {
  temperature: '🌡️',
  cleaning: '🧹',
  incident: '⚠️',
  maintenance: '🔧',
  waste: '🗑️',
  eighty_six: '🗑️',
  employee_note: '👤',
  manager_note: '📝',
  shift_handoff: '🔄',
  equipment: '⚙️',
  guest_issue: '👥',
  bathroom: '🚽',
  chemical: '🧪',
  custom: '📌',
};

const LOG_TYPE_COLORS = {
  temperature: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  cleaning: 'bg-green-500/15 text-green-400 border-green-500/30',
  incident: 'bg-red-500/15 text-red-400 border-red-500/30',
  maintenance: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  waste: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  eighty_six: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  employee_note: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  manager_note: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  shift_handoff: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
};

const STATUS_CONFIG = {
  open: { icon: '🔴', label: 'Open', color: 'text-red-400' },
  in_progress: { icon: '🟡', label: 'In Progress', color: 'text-yellow-400' },
  resolved: { icon: '✅', label: 'Resolved', color: 'text-green-400' },
  closed: { icon: '⏹️', label: 'Closed', color: 'text-slate-400' },
  flagged: { icon: '🚩', label: 'Flagged', color: 'text-red-500' },
  needs_review: { icon: '👁️', label: 'Review', color: 'text-purple-400' },
  pending: { icon: '⏳', label: 'Pending', color: 'text-blue-400' },
};

export default function LogCard({ log, onOpen, isHighlighted = false }) {
  const typeIcon = LOG_TYPE_ICONS[log.type] || '📌';
  const typeColor = LOG_TYPE_COLORS[log.type] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.open;

  const submittedAt = log.created_date
    ? new Date(log.created_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '—';

  const isNeedsReview = log.status === 'needs_review' || log.requires_review;
  const isNeedsFollowUp = log.follow_up_required;

  return (
    <button
      onClick={() => { haptics.light?.(); onOpen?.(log.id); }}
      className={cn(
        'w-full text-left px-4 py-3 rounded-xl border transition-all active:scale-[0.98]',
        isHighlighted
          ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/40'
          : 'bg-card border-border/40 hover:border-border/60'
      )}
    >
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            {/* Type Icon */}
            <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">{log.title}</h3>
              {log.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{log.description}</p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className={cn('text-xs font-bold px-2 py-1 rounded-full flex-shrink-0', statusConfig.color)}>
            {statusConfig.icon}
          </div>
        </div>

        {/* Details Row */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {/* Location/Equipment */}
          {log.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{log.location}</span>
            </div>
          )}

          {/* Employee */}
          {log.employee_name && (
            <>
              <span>•</span>
              <span>{log.employee_name}</span>
            </>
          )}

          {/* Time */}
          <span>•</span>
          <span>{submittedAt}</span>

          {/* Temperature Value */}
          {log.custom_metadata?.temperatureValue && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Thermometer className="h-3 w-3" />
                {log.custom_metadata.temperatureValue}°{log.custom_metadata.temperatureUnit || 'F'}
              </span>
            </>
          )}
        </div>

        {/* Alert Indicators */}
        {(isNeedsReview || isNeedsFollowUp) && (
          <div className="flex items-center gap-2 text-xs">
            {isNeedsReview && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <AlertCircle className="h-3 w-3" />
                Needs Review
              </span>
            )}
            {isNeedsFollowUp && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Flag className="h-3 w-3" />
                Follow-up
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}