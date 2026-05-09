import { Thermometer, Wrench, AlertTriangle, Wind, Recycle, User, FileText, Eye } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const TYPE_CONFIG = {
  temperature: {
    icon: Thermometer,
    iconColor: 'text-red-400',
    bubbleBg: 'bg-red-500/10',
  },
  maintenance: {
    icon: Wrench,
    iconColor: 'text-amber-400',
    bubbleBg: 'bg-amber-500/10',
  },
  incident: {
    icon: AlertTriangle,
    iconColor: 'text-orange-400',
    bubbleBg: 'bg-orange-500/10',
  },
  cleaning: {
    icon: Wind,
    iconColor: 'text-cyan-400',
    bubbleBg: 'bg-cyan-500/10',
  },
  waste: {
    icon: Recycle,
    iconColor: 'text-emerald-400',
    bubbleBg: 'bg-emerald-500/10',
  },
  employee: {
    icon: User,
    iconColor: 'text-blue-400',
    bubbleBg: 'bg-blue-500/10',
  },
  manager_note: {
    icon: FileText,
    iconColor: 'text-blue-400',
    bubbleBg: 'bg-blue-500/10',
  },
  bathroom: {
    icon: Eye,
    iconColor: 'text-teal-400',
    bubbleBg: 'bg-teal-500/10',
  },
};

const STATUS_CONFIG = {
  open:           { label: 'Open',           style: 'bg-red-500/10 text-red-400 border-red-500/20' },
  flagged:        { label: 'Flagged',        style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  resolved:       { label: 'Resolved',       style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  failed:         { label: 'Failed',         style: 'bg-red-500/10 text-red-400 border-red-500/20' },
  pending_review: { label: 'Review',         style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  in_progress:    { label: 'In Progress',    style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  closed:         { label: 'Closed',         style: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function LogInboxCard({ log, onOpen }) {
  const config = TYPE_CONFIG[log.type] || TYPE_CONFIG.manager_note;
  const Icon = config.icon;
  const status = STATUS_CONFIG[log.status] || { label: log.status || 'Unknown', style: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };

  const meta = [log.location, log.employee_name].filter(Boolean).join(' · ');

  return (
    <button
      onClick={() => { haptics.light?.(); onOpen?.(log.id); }}
      className="w-full text-left flex items-center gap-3.5 px-4 py-3.5 rounded-[18px] bg-[#0D1520] border border-white/[0.06] hover:border-white/[0.10] hover:bg-[#111b28] active:scale-[0.98] transition-all duration-150"
    >
      {/* Icon Bubble */}
      <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${config.bubbleBg}`}>
        <Icon className={`h-4 w-4 ${config.iconColor}`} strokeWidth={1.75} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-white leading-snug truncate">{log.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {meta && <span className="text-xs text-slate-500 truncate">{meta}</span>}
          {meta && <span className="text-slate-600 text-xs">·</span>}
          <span className="text-xs text-slate-600 flex-shrink-0">{formatTime(log.created_date)}</span>
        </div>
      </div>

      {/* Status Pill */}
      <div className={`flex-shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${status.style}`}>
        {status.label}
      </div>
    </button>
  );
}