import { Plus } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function LogsCommandHeader({ onQuickAdd }) {
  return (
    <div className="sticky top-0 z-20 bg-background border-b border-border/20 px-4 py-3 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Operations and compliance</p>
        </div>
        <button
          onClick={() => { haptics.light?.(); onQuickAdd?.(); }}
          className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-all hover:brightness-110 flex-shrink-0"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}