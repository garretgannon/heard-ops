import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'shift_note', label: 'Shift Note', icon: '📝' },
  { id: 'incident', label: 'Incident', icon: '⚠️' },
  { id: 'guest_issue', label: 'Guest Issue', icon: '👥' },
  { id: 'team_note', label: 'Team Note', icon: '👨‍💼' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'waste', label: '86 / Waste', icon: '🗑️' },
  { id: 'prep_issue', label: 'Prep Issue', icon: '🍳' },
];

const SHIFTS = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'night', label: 'Night' },
];

const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' },
];

export default function FloatingManagerLogButton() {
  const { user } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'shift_note',
    shift: 'evening',
    notes: '',
    priority: 'medium',
  });

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Enter a title');
      return;
    }
    
    setSaving(true);
    try {
      await base44.entities.UnifiedLog.create({
        type: 'manager_note',
        title: form.title,
        description: form.notes,
        priority: form.priority,
        status: 'open',
        created_by: user?.email,
        custom_metadata: {
          category: form.category,
          shift: form.shift,
          logged_by_name: user?.full_name,
        },
      });
      toast.success('Log entry added');
      setIsOpen(false);
      setForm({ title: '', category: 'shift_note', shift: 'evening', notes: '', priority: 'medium' });
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-90 transition-transform z-40 lg:bottom-8"
        title="Quick add manager log"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setIsOpen(false)} />
          <div className="relative w-full bg-card border-t border-border rounded-t-2xl max-h-[90vh] overflow-y-auto z-10">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Quick Log Entry</h2>
              <button
                onClick={() => setIsOpen(false)}
                disabled={saving}
                className="h-8 w-8 rounded-lg hover:bg-muted disabled:opacity-50"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4 pb-8">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="What happened?"
                  className="w-full h-10 px-3 mt-1 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Category *</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setForm({ ...form, category: cat.id })}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all',
                        form.category === cat.id
                          ? 'bg-primary/15 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:border-border/80'
                      )}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shift & Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Shift *</label>
                  <select
                    value={form.shift}
                    onChange={e => setForm({ ...form, shift: e.target.value })}
                    className="w-full h-9 px-2 mt-1 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {SHIFTS.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full h-9 px-2 mt-1 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full px-3 py-2 mt-1 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={saving || !form.title.trim()}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Add Log Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}