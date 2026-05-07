import { List, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

export default function LogsViewToggle({ view, onViewChange }) {
  return (
    <div className="px-4 lg:px-8 py-3 flex items-center gap-2 border-b border-border/20">
      <button
        onClick={() => { haptics.light?.(); onViewChange?.('list'); }}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-sm transition-all active:scale-95',
          view === 'list'
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-border/40 bg-card text-muted-foreground hover:border-border/60'
        )}
      >
        <List className="h-4 w-4" />
        List
      </button>

      <button
        onClick={() => { haptics.light?.(); onViewChange?.('calendar'); }}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-sm transition-all active:scale-95',
          view === 'calendar'
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-border/40 bg-card text-muted-foreground hover:border-border/60'
        )}
      >
        <Calendar className="h-4 w-4" />
        Calendar
      </button>
    </div>
  );
}