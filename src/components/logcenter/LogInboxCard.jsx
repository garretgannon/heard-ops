import { Thermometer, Wrench, AlertTriangle, Droplet, Users, FileText, Eye, Trash2, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { haptics } from '@/utils/haptics';

const LOG_TYPE_CONFIG = {
  temperature: { icon: Thermometer, label: 'Temperature', color: 'bg-purple-500/15 border-purple-500/30' },
  maintenance: { icon: Wrench, label: 'Maintenance', color: 'bg-orange-500/15 border-orange-500/30' },
  incident: { icon: AlertTriangle, label: 'Incident', color: 'bg-red-500/15 border-red-500/30' },
  waste: { icon: Droplet, label: 'Waste/86', color: 'bg-amber-500/15 border-amber-500/30' },
  cleaning: { icon: FileText, label: 'Cleaning', color: 'bg-cyan-500/15 border-cyan-500/30' },
  manager_note: { icon: Users, label: 'Manager Note', color: 'bg-blue-500/15 border-blue-500/30' },
  bathroom: { icon: Eye, label: 'Bathroom', color: 'bg-teal-500/15 border-teal-500/30' },
  employee: { icon: Users, label: 'Employee', color: 'bg-green-500/15 border-green-500/30' },
};

export default function LogInboxCard({ log, onOpen, onSwipeRight, onSwipeLeft, onMoreClick }) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const config = LOG_TYPE_CONFIG[log.type] || LOG_TYPE_CONFIG.manager_note;
  const Icon = config.icon;

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    if (touchStart - touchEnd > 100) {
      // Swiped left
      haptics.medium?.();
      onSwipeLeft?.();
    } else if (touchEnd - touchStart > 100) {
      // Swiped right
      haptics.medium?.();
      onSwipeRight?.();
    }
  };

  const statusColor = {
    open: 'bg-red-500/20 text-red-400',
    flagged: 'bg-amber-500/20 text-amber-400',
    resolved: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
  }[log.status] || 'bg-slate-500/20 text-slate-400';

  return (
    <button
      onClick={() => onOpen?.(log.id)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`w-full text-left border rounded-xl p-3.5 transition-all active:scale-95 ${config.color} hover:border-border/60 cursor-pointer group`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="h-5 w-5 text-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground truncate">{log.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.description}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                haptics.light?.();
                onMoreClick?.(log);
              }}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-background/50 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {log.location && <span className="truncate">{log.location}</span>}
              {log.employee_name && <span className="text-foreground/70">•</span>}
              {log.employee_name && <span className="truncate">{log.employee_name}</span>}
            </div>
            <div className="flex items-center gap-1">
              {log.temperature && <span className="px-2 py-0.5 bg-background/50 rounded text-xs text-foreground font-semibold">{log.temperature}°F</span>}
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor}`}>{log.status}</span>
            </div>
          </div>

          {/* Timestamp */}
          <p className="text-[10px] text-muted-foreground/60 mt-1.5">
            {new Date(log.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </button>
  );
}