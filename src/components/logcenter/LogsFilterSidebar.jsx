import { X } from 'lucide-react';
import { useState } from 'react';

const LOG_TYPES = [
  'temperature',
  'cleaning',
  'maintenance',
  'incident',
  'waste',
  'eighty_six',
  'employee_note',
  'manager_note',
  'shift_handoff',
  'prep',
  'sidework',
];

const STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'flagged', 'needs_review'];

export default function LogsFilterSidebar({ filters, onFilterChange, isOpen, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters || {});

  const handleTypeToggle = (type) => {
    const types = localFilters.types || [];
    setLocalFilters({
      ...localFilters,
      types: types.includes(type) ? types.filter((t) => t !== type) : [...types, type],
    });
  };

  const handleStatusToggle = (status) => {
    const statuses = localFilters.statuses || [];
    setLocalFilters({
      ...localFilters,
      statuses: statuses.includes(status) ? statuses.filter((s) => s !== status) : [...statuses, status],
    });
  };

  const handleApply = () => {
    onFilterChange?.(localFilters);
  };

  const handleClear = () => {
    setLocalFilters({});
    onFilterChange?.({});
  };

  // Desktop sidebar
  return (
    <div className="hidden lg:flex flex-col w-80 bg-card border-l border-border/20 overflow-y-auto max-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border/20 px-4 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Filters</h2>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        {/* Log Types */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Log Type</h3>
          <div className="space-y-2">
            {LOG_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localFilters.types?.includes(type) || false}
                  onChange={() => handleTypeToggle(type)}
                  className="w-4 h-4 rounded border border-border/40 bg-background cursor-pointer accent-primary"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors capitalize">
                  {type.replace(/_/g, ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Status</h3>
          <div className="space-y-2">
            {STATUSES.map((status) => (
              <label key={status} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localFilters.statuses?.includes(status) || false}
                  onChange={() => handleStatusToggle(status)}
                  className="w-4 h-4 rounded border border-border/40 bg-background cursor-pointer accent-primary"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors capitalize">
                  {status.replace(/_/g, ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={localFilters.requiresReview || false}
              onChange={(e) => setLocalFilters({ ...localFilters, requiresReview: e.target.checked })}
              className="w-4 h-4 rounded border border-border/40 bg-background cursor-pointer accent-primary"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Requires Review
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={localFilters.hasPhoto || false}
              onChange={(e) => setLocalFilters({ ...localFilters, hasPhoto: e.target.checked })}
              className="w-4 h-4 rounded border border-border/40 bg-background cursor-pointer accent-primary"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Has Photo
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={localFilters.openFollowUp || false}
              onChange={(e) => setLocalFilters({ ...localFilters, openFollowUp: e.target.checked })}
              className="w-4 h-4 rounded border border-border/40 bg-background cursor-pointer accent-primary"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Open Follow-up
            </span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-card border-t border-border/20 px-4 py-3 flex gap-2">
        <button
          onClick={handleClear}
          className="flex-1 h-10 rounded-lg border border-border/40 bg-background text-foreground font-semibold text-sm active:scale-95 transition-all hover:bg-muted/20"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-all hover:brightness-110"
        >
          Apply
        </button>
      </div>
    </div>
  );
}