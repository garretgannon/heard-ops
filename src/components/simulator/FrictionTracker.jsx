import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { useSimulator } from '@/lib/SimulatorContext';

const ISSUE_TYPES = [
  { id: 'confusing', label: 'Confusing Step', color: 'text-amber-400 bg-amber-500/20' },
  { id: 'broken', label: 'Broken Button', color: 'text-red-400 bg-red-500/20' },
  { id: 'missing', label: 'Missing Data', color: 'text-orange-400 bg-orange-500/20' },
  { id: 'wording', label: 'Unclear Wording', color: 'text-yellow-400 bg-yellow-500/20' },
  { id: 'steps', label: 'Too Many Steps', color: 'text-purple-400 bg-purple-500/20' },
  { id: 'layout', label: 'Bad Layout', color: 'text-pink-400 bg-pink-500/20' },
  { id: 'permission', label: 'Permission Issue', color: 'text-blue-400 bg-blue-500/20' },
];

const SEVERITIES = [
  { id: 'low', label: 'Low', color: 'bg-yellow-500/20 text-yellow-300' },
  { id: 'medium', label: 'Medium', color: 'bg-orange-500/20 text-orange-300' },
  { id: 'high', label: 'High', color: 'bg-red-500/20 text-red-300' },
];

export default function FrictionTracker({ onClose }) {
  const { frictionNotes, addFrictionNote, removeFrictionNote } = useSimulator();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    page: '',
    type: 'confusing',
    severity: 'medium',
    note: '',
    status: 'open',
  });

  const handleAddFriction = () => {
    if (formData.note.trim()) {
      addFrictionNote({
        ...formData,
        timestamp: new Date().toLocaleTimeString(),
      });
      setFormData({ page: '', type: 'confusing', severity: 'medium', note: '', status: 'open' });
      setShowForm(false);
    }
  };

  const getTypeColor = (type) => {
    return ISSUE_TYPES.find(t => t.id === type)?.color || '';
  };

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
            <h2 className="text-lg font-bold text-foreground">Friction Log</h2>
            <p className="text-xs text-muted-foreground mt-1">{frictionNotes.length} issues logged</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add button */}
        <div className="border-b border-border bg-background p-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full px-4 py-2.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-sm border border-amber-500/30 hover:bg-amber-500/30 transition-all"
          >
            + Log Friction Point
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-border bg-background p-4 space-y-3"
          >
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Page / Step</label>
              <input
                type="text"
                value={formData.page}
                onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                placeholder="e.g., Restaurant Type Selection"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Issue Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {ISSUE_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {SEVERITIES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Notes</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Describe the issue..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm placeholder-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground text-sm font-bold hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFriction}
                className="flex-1 px-3 py-2 rounded-lg bg-amber-500/30 text-amber-300 text-sm font-bold hover:bg-amber-500/40 transition-all"
              >
                Log Issue
              </button>
            </div>
          </motion.div>
        )}

        {/* Issues list */}
        <div className="p-4 space-y-3">
          {frictionNotes.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">No friction points logged yet</p>
          ) : (
            frictionNotes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-300 mb-1">{note.page}</p>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${getTypeColor(note.type)}`}>
                        {ISSUE_TYPES.find(t => t.id === note.type)?.label}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${SEVERITIES.find(s => s.id === note.severity)?.color}`}>
                        {SEVERITIES.find(s => s.id === note.severity)?.label}
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/80 mb-2">{note.note}</p>
                    <p className="text-xs text-muted-foreground opacity-50">{note.timestamp}</p>
                  </div>
                  <button
                    onClick={() => removeFrictionNote(note.id)}
                    className="text-muted-foreground hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Summary */}
        {frictionNotes.length > 0 && (
          <div className="sticky bottom-0 border-t border-border bg-background p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Summary</p>
            <div className="space-y-1 text-xs">
              {['high', 'medium', 'low'].map(sev => {
                const count = frictionNotes.filter(n => n.severity === sev).length;
                return (
                  <p key={sev} className={SEVERITIES.find(s => s.id === sev)?.color}>
                    {SEVERITIES.find(s => s.id === sev)?.label}: <span className="font-bold">{count}</span>
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}