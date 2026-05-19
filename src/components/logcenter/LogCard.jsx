import { AlertCircle, Flag, MapPin, Thermometer } from 'lucide-react';
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
  temperature: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  cleaning: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  incident: 'bg-red-500/15 text-red-400 border-red-500/30',
  maintenance: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  waste: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  eighty_six: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  employee_note: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  manager_note: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
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
        'w-full text-left px-4 py-2.5 rounded-lg border transition-all active:scale-95 box-border overflow-hidden',
        isHighlighted
          ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/40'
          : 'bg-card border-border/30 hover:border-border/50'
      )}
    >
      <div className="space-y-2">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Type Icon */}
            <span className="text-base flex-shrink-0 mt-0.5">{typeIcon}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">{log.title}</h3>
              {log.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{log.description}</p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0', statusConfig.color)}>
            {statusConfig.icon}
          </div>
        </div>

        {/* Details Row */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 overflow-hidden">
          {/* Location/Equipment */}
          {log.location && (
           <div className="flex items-center gap-1 flex-shrink-0">
             <MapPin className="h-3 w-3 flex-shrink-0" />
             <span className="truncate">{log.location}</span>
           </div>
          )}

          {/* Employee */}
          {log.employee_name && (
           <>
             <span className="flex-shrink-0">•</span>
             <span className="truncate flex-shrink-0">{log.employee_name}</span>
           </>
          )}

          {/* Time */}
          <span className="flex-shrink-0">•</span>
          <span className="flex-shrink-0">{submittedAt}</span>

          {/* Temperature Value */}
          {log.custom_metadata?.temperature_reading && (
           <>
             <span className="flex-shrink-0">•</span>
             <span className={`flex items-center gap-1 flex-shrink-0 font-semibold ${
               log.custom_metadata.temperature_reading >= log.custom_metadata.min_temperature &&
               log.custom_metadata.temperature_reading <= log.custom_metadata.max_temperature
                 ? 'text-green-400'
                 : 'text-red-400'
             }`}>
               <Thermometer className="h-3 w-3 flex-shrink-0" />
               <span className="truncate">{log.custom_metadata.temperature_reading}°F</span>
             </span>
           </>
          )}
          {log.custom_metadata?.min_temperature && !log.custom_metadata?.temperature_reading && (
           <>
             <span className="flex-shrink-0">•</span>
             <span className="text-xs text-muted-foreground/60">Range: {log.custom_metadata.min_temperature}–{log.custom_metadata.max_temperature}°F</span>
           </>
          )}
        </div>

        {/* Alert Indicators */}
        {(isNeedsReview || isNeedsFollowUp) && (
          <div className="flex items-center gap-1.5 text-[10px]">
            {isNeedsReview && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <AlertCircle className="h-2.5 w-2.5" />
                Review
              </span>
            )}
            {isNeedsFollowUp && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Flag className="h-2.5 w-2.5" />
                Follow-up
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}