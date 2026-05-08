import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DENIAL_REASONS = [
  'Missing info',
  'Wrong quantity',
  'Photo unclear',
  'Needs correction',
  'Not approved',
  'Other',
];

export default function DenialReasonDrawer({ approval, onSubmit, onClose }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    await onSubmit(selectedReason, notes);
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border/30 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/20">
          <h2 className="text-lg font-bold text-foreground">Why deny this?</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[calc(100vh-300px)] overflow-y-auto space-y-4">
          {/* Reason selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Select a reason</label>
            <div className="space-y-1.5">
              {DENIAL_REASONS.map(reason => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border text-left transition-all',
                    selectedReason === reason
                      ? 'border-red-500 bg-red-500/10 text-foreground'
                      : 'border-border hover:bg-secondary text-muted-foreground'
                  )}
                >
                  <div className={cn(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center',
                    selectedReason === reason ? 'border-red-500 bg-red-500' : 'border-border'
                  )}>
                    {selectedReason === reason && <div className="h-2 w-2 bg-white rounded-full" />}
                  </div>
                  <span className="text-sm font-medium">{reason}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Optional notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any additional context for the submitter…"
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/20 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border bg-card text-foreground font-bold text-sm hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!selectedReason || submitting}
            className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-all disabled:opacity-50">
            {submitting ? 'Denying…' : 'Confirm Denial'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}