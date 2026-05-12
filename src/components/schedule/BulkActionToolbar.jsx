import { motion } from 'framer-motion';
import { Copy, Trash2, X, CheckCircle, GitBranch, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function BulkActionToolbar({ selectedCount, onClear, onCopy, onDuplicate, onDelete, onPublish, onClearUnpublished }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl card-glass border border-border/60 shadow-2xl backdrop-blur-sm">
        {/* Count badge */}
        <div className="px-3 py-1 rounded-lg bg-primary/20 border border-primary/30">
          <p className="text-sm font-bold text-primary">{selectedCount} selected</p>
        </div>

        <div className="w-px h-6 bg-border/40" />

        <button onClick={onCopy} title="Copy shifts"
          className="h-9 px-3 rounded-lg bg-background/50 hover:bg-secondary flex items-center gap-1.5 text-xs font-bold text-blue-400 transition-colors">
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>

        <button onClick={onDuplicate} title="Duplicate shifts"
          className="h-9 px-3 rounded-lg bg-background/50 hover:bg-secondary flex items-center gap-1.5 text-xs font-bold text-purple-400 transition-colors">
          <GitBranch className="h-3.5 w-3.5" /> Duplicate
        </button>

        <button onClick={onPublish} title="Publish selected"
          className="h-9 px-3 rounded-lg bg-background/50 hover:bg-secondary flex items-center gap-1.5 text-xs font-bold text-green-400 transition-colors">
          <CheckCircle className="h-3.5 w-3.5" /> Publish
        </button>

        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} title="Delete selected"
            className="h-9 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center gap-1.5 text-xs font-bold text-red-400 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="h-9 px-3 rounded-lg bg-red-500/20 border border-red-500 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors">
              Confirm ({selectedCount})
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        <div className="w-px h-6 bg-border/40" />

        <button onClick={onClear} title="Clear selection"
          className="h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
}