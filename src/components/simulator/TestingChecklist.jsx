import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useSimulator } from '@/lib/SimulatorContext';

export default function TestingChecklist({ onClose }) {
  const { checklistItems, updateChecklistItem } = useSimulator();
  const checkedCount = checklistItems.filter(i => i.checked).length;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed right-0 top-0 h-screen w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Testing Checklist</h2>
            <p className="text-xs text-muted-foreground mt-1">{checkedCount} / {checklistItems.length} completed</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 border-b border-border">
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(checkedCount / checklistItems.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Checklist items */}
        <div className="p-6 space-y-3">
          {checklistItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-lg border p-4 transition-all cursor-pointer ${
                item.checked
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-background border-border hover:border-border/50'
              }`}
            >
              {/* Checkbox and text */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => updateChecklistItem(item.id, { checked: e.target.checked })}
                  className="mt-1 h-5 w-5 rounded cursor-pointer accent-green-500"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${item.checked ? 'text-green-300 line-through' : 'text-foreground'}`}>
                    {item.text}
                  </p>
                </div>
              </div>

              {/* Notes field */}
              <textarea
                value={item.notes || ''}
                onChange={(e) => updateChecklistItem(item.id, { notes: e.target.value })}
                placeholder="Add notes..."
                className="mt-3 w-full p-2 rounded-lg liquid-card text-xs text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                rows={2}
              />
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div className="sticky bottom-0 border-t border-border bg-background p-6 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Summary</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>✓ Completed: <span className="font-bold text-foreground">{checkedCount}</span></p>
            <p>→ Pending: <span className="font-bold text-foreground">{checklistItems.length - checkedCount}</span></p>
          </div>
        </div>
      </motion.div>
    </>
  );
}