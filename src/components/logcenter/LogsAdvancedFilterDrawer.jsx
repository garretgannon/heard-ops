import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import LogsFilterSidebar from './LogsFilterSidebar';

export default function LogsAdvancedFilterDrawer({ isOpen, onClose, filters, onFiltersChange, currentUser }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const empty = {
      types: [],
      statuses: [],
      priorities: [],
      datePreset: '',
      dateFrom: '',
      dateTo: '',
      createdBy: '',
      assignedTo: '',
      role: '',
      station: '',
      area: '',
      equipment: '',
      employee: '',
      requiresReview: false,
      hasPhoto: false,
      assignedToMe: false,
      openClosed: '',
      passFail: '',
    };
    setLocalFilters(empty);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full sm:w-96 bg-card border-l border-border z-50 flex flex-col transition-transform duration-300 overflow-hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/40">
          <h2 className="font-bold text-foreground">Advanced Filters</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <LogsFilterSidebar
            filters={localFilters}
            onChange={setLocalFilters}
            currentUser={currentUser}
          />
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border/40 px-4 py-3 bg-card/50 space-y-2">
          <button
            onClick={handleApply}
            className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all">
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="w-full h-9 rounded-lg border border-border bg-card text-foreground font-bold text-sm active:scale-95 transition-all hover:bg-muted">
            Reset
          </button>
        </div>
      </div>
    </>
  );
}