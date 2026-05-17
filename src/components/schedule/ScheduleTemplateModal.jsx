import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, LayoutTemplate, Trash2, Play, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, getDay } from 'date-fns';

const STORAGE_KEY = 'heardos_schedule_templates';

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveTemplates(templates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export default function ScheduleTemplateModal({ isOpen, onClose, weekShifts = [], weekDays = [], onApply }) {
  const [templates, setTemplates] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    if (isOpen) setTemplates(loadTemplates());
  }, [isOpen]);

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    if (weekShifts.length === 0) return;

    const templateShifts = weekShifts.map(s => ({
      dayOfWeek: getDay(new Date(s.date + 'T12:00:00')),
      employee_name: s.employee_name,
      employee_email: s.employee_email,
      role: s.role,
      station: s.station,
      area: s.area,
      start_time: s.start_time,
      end_time: s.end_time,
      notes: s.notes,
    }));

    const newTemplate = {
      id: crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      shiftCount: templateShifts.length,
      shifts: templateShifts,
    };

    const updated = [newTemplate, ...templates];
    setTemplates(updated);
    saveTemplates(updated);
    setSaveName('');
  };

  const handleDelete = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const handleApply = async (template) => {
    if (!weekDays.length) return;
    setApplying(template.id);
    const shifts = template.shifts.map(s => {
      const targetDay = weekDays.find(d => getDay(d) === s.dayOfWeek);
      if (!targetDay) return null;
      return {
        date: format(targetDay, 'yyyy-MM-dd'),
        employee_name: s.employee_name,
        employee_email: s.employee_email,
        role: s.role,
        station: s.station,
        area: s.area,
        start_time: s.start_time,
        end_time: s.end_time,
        notes: s.notes,
        status: 'draft',
      };
    }).filter(Boolean);
    await onApply?.(shifts);
    setApplying(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Schedule Templates</p>
                  <p className="text-[11px] text-muted-foreground">Save and reuse weekly layouts</p>
                </div>
              </div>
              <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Save current week */}
            <div className="px-5 py-4 border-b border-border/30 bg-muted/20">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Save This Week</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder={`e.g. "Friday Night Layout"`}
                  className="flex-1 h-8 rounded-lg border border-border/50 bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim() || weekShifts.length === 0}
                  className={cn(
                    'h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0',
                    saveName.trim() && weekShifts.length > 0
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </button>
              </div>
              {weekShifts.length === 0 && (
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">No shifts this week to save.</p>
              )}
              {weekShifts.length > 0 && (
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">{weekShifts.length} shift{weekShifts.length !== 1 ? 's' : ''} will be saved.</p>
              )}
            </div>

            {/* Saved templates */}
            <div className="max-h-72 overflow-y-auto">
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">No templates yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Save a week above to reuse it later.</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {templates.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 rounded-xl border border-border/40 px-3 py-2.5 bg-background/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t.shiftCount} shifts · saved {format(new Date(t.savedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleApply(t)}
                        disabled={applying === t.id}
                        className="h-7 px-2.5 rounded-lg bg-primary/15 text-primary text-[11px] font-bold flex items-center gap-1 hover:bg-primary/25 transition-colors shrink-0"
                      >
                        {applying === t.id
                          ? <div className="h-3 w-3 border border-primary border-t-transparent rounded-full animate-spin" />
                          : <Play className="h-3 w-3" />
                        }
                        Apply
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
