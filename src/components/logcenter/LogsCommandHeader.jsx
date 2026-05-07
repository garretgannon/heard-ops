import { Plus, Search } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function LogsCommandHeader({ onSearch, onQuickAdd, searchQuery }) {
  return (
    <div className="sticky top-0 z-30 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-sm border-b border-border/20 px-4 py-3 lg:px-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-xl font-extrabold text-foreground">Logs</h1>
        <button
          onClick={() => { haptics.light?.(); onQuickAdd?.(); }}
          className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-all hover:brightness-110"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search employee, area, type, date..."
          value={searchQuery}
          onChange={(e) => onSearch?.(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/40 bg-card text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}