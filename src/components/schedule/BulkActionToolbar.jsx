import { motion } from 'framer-motion';
import { Copy, Trash2, Move, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const BULK_ACTIONS = [
  { label: 'Copy', icon: Copy, color: 'text-blue-400' },
  { label: 'Paste', icon: Copy, color: 'text-green-400' },
  { label: 'Move', icon: Move, color: 'text-purple-400' },
  { label: 'Change Time', icon: Clock, color: 'text-amber-400' },
  { label: 'Delete', icon: Trash2, color: 'text-red-400' },
];

export default function BulkActionToolbar({ selectedCount, onClear, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/50 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/20 border border-primary/30">
          <p className="text-sm font-bold text-primary">{selectedCount} selected</p>
        </div>

        <div className="w-px h-6 bg-border/30" />

        <div className="flex items-center gap-2">
          {BULK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAction?.()}
                className="h-9 w-9 rounded-lg bg-background/50 hover:bg-secondary flex items-center justify-center transition-colors"
                title={action.label}
              >
                <Icon className={cn('h-4 w-4', action.color)} />
              </motion.button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-border/30" />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClear}
          className="h-9 w-9 rounded-lg bg-background/50 hover:bg-secondary flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </motion.button>
      </div>
    </motion.div>
  );
}