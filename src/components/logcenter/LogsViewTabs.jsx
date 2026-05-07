import { haptics } from '@/utils/haptics';

const VIEW_OPTIONS = [
  { id: 'feed', label: 'Feed' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'review', label: 'Review' },
];

export default function LogsViewTabs({ activeView, onViewChange }) {
  return (
    <div className="w-full px-4 py-2 border-b border-border/20 bg-background overflow-x-hidden box-border">
      <div className="flex gap-2 w-full">
        {VIEW_OPTIONS.map((view) => (
          <button
            key={view.id}
            onClick={() => { haptics.light?.(); onViewChange(view.id); }}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
              activeView === view.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-card border border-border/40 text-muted-foreground hover:border-border/60'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}