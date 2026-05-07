import { VISIBILITY_LABELS } from '@/lib/logVisibility';

export default function VisibilityBadge({ level }) {
  const config = VISIBILITY_LABELS[level] || VISIBILITY_LABELS.team_log;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${config.color}`}>
      {config.label}
    </span>
  );
}