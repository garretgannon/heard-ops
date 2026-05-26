import { X } from 'lucide-react';
import { useState } from 'react';
import { haptics } from '@/utils/haptics';

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

export default function AdvancedFilterSheet({ isOpen, onClose, filters, onApplyFilters }) {
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

  const handleApply = () => {
    haptics.medium?.();
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    haptics.light?.();
    setLocalFilters({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end box-border">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="liquid-card relative w-screen max-w-full rounded-t-2xl max-h-[80vh] overflow-y-auto overflow-x-hidden box-">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border/20 px-4 py-4 flex items-center justify-between w-full box-border">
          <h2 className="text-lg font-bold text-foreground">Advanced Filters</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-6 w-full box-border">
          {/* Log Types */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">Log Type</h3>
            <div className="space-y-2">
              {LOG_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localFilters.types?.includes(type) || false}
                    onChange={() => handleToggleType(type)}
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
            <h3 className="text-sm font-bold text-foreground mb-2">Status</h3>
            <div className="space-y-2">
              {STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localFilters.statuses?.includes(status) || false}
                    onChange={() => handleToggleStatus(status)}
                    className="w-4 h-4 rounded border border-border/40 bg-background cursor-pointer accent-primary"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors capitalize">
                    {status.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Requires Review */}
          <div>
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
          </div>

          {/* Has Photo */}
          <div>
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
          </div>

          {/* Open Follow-up */}
          <div>
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
        <div className="sticky bottom-0 bg-card border-t border-border/20 px-4 py-3 flex gap-2 w-full box-border">
          <button
            onClick={handleReset}
            className="flex-1 h-11 rounded-lg border border-border/40 bg-background text-foreground font-semibold text-sm active:scale-95 transition-all hover:bg-muted/20"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-all hover:brightness-110"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}