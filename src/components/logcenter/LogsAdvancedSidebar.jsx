import { X } from 'lucide-react';
import { useState } from 'react';

const LOG_TYPES = [
  'temperature',
  'bathroom',
  'maintenance',
  'incident',
  'employee_note',
  'manager_note',
  'waste',
  'eighty_six',
  'chemical',
  'custom',
];

const STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'flagged', 'needs_review', 'pending'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function LogsAdvancedSidebar({ filters, onApplyFilters, onClearFilters }) {
  const [localFilters, setLocalFilters] = useState(filters || {});

  const handleToggleType = (type) => {
    const types = localFilters.types || [];
    setLocalFilters({
      ...localFilters,
      types: types.includes(type) ? types.filter((t) => t !== type) : [...types, type],
    });
  };

  const handleToggleStatus = (status) => {
    const statuses = localFilters.statuses || [];
    setLocalFilters({
      ...localFilters,
      statuses: statuses.includes(status) ? statuses.filter((s) => s !== status) : [...statuses, status],
    });
  };

  const handleTogglePriority = (priority) => {
    const priorities = localFilters.priorities || [];
    setLocalFilters({
      ...localFilters,
      priorities: priorities.includes(priority) ? priorities.filter((p) => p !== priority) : [...priorities, priority],
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onClearFilters();
  };

  return (
    <div className="w-80 bg-card border-l border-border/20 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/20 px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Filters</h2>
      </div>

      {/* Filters Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Log Types */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Type</h3>
          <div className="space-y-1.5">
            {LOG_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localFilters.types?.includes(type) || false}
                  onChange={() => handleToggleType(type)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors capitalize">
                  {type.replace(/_/g, ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Status</h3>
          <div className="space-y-1.5">
            {STATUSES.map((status) => (
              <label key={status} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localFilters.statuses?.includes(status) || false}
                  onChange={() => handleToggleStatus(status)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors capitalize">
                  {status.replace(/_/g, ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Priority</h3>
          <div className="space-y-1.5">
            {PRIORITIES.map((priority) => (
              <label key={priority} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localFilters.priorities?.includes(priority) || false}
                  onChange={() => handleTogglePriority(priority)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors capitalize">
                  {priority}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Flags */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Flags</h3>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={localFilters.requiresReview || false}
              onChange={(e) => setLocalFilters({ ...localFilters, requiresReview: e.target.checked })}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Requires Review
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group mt-1.5">
            <input
              type="checkbox"
              checked={localFilters.hasPhoto || false}
              onChange={(e) => setLocalFilters({ ...localFilters, hasPhoto: e.target.checked })}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Has Photo
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group mt-1.5">
            <input
              type="checkbox"
              checked={localFilters.openFollowUp || false}
              onChange={(e) => setLocalFilters({ ...localFilters, openFollowUp: e.target.checked })}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Open Follow-up
            </span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-border/20 px-4 py-3 flex gap-2">
        <button
          onClick={handleReset}
          className="flex-1 h-9 rounded-lg border border-border/40 bg-background text-foreground font-semibold text-xs active:scale-95 transition-all hover:bg-muted/20"
        >
          Clear
        </button>
        <button
          onClick={handleApply}
          className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground font-semibold text-xs active:scale-95 transition-all hover:brightness-110"
        >
          Apply
        </button>
      </div>
    </div>
  );
}