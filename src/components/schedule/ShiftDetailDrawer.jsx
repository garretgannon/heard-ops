import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, MapPin, DollarSign, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ShiftDetailDrawer({ shift, employees, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    start_time: shift.start_time || '',
    end_time: shift.end_time || '',
    station: shift.station || '',
    role: shift.role || '',
    notes: shift.notes || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.StaffShift.update(shift.id, formData);
      toast.success('Shift saved');
      onUpdate?.();
      setIsEditing(false);
    } catch (e) {
      toast.error('Failed to save shift');
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end"
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-card border-l border-border/30 flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-border/30 bg-card p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Shift Details</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Employee */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Employee</p>
            <div className="p-4 rounded-lg bg-card border border-border/30">
              <p className="font-bold text-foreground text-lg">{shift.employee_name || shift.employeeName}</p>
              <p className="text-sm text-muted-foreground capitalize mt-1">{shift.role}</p>
            </div>
          </div>

          {/* Time */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Time</p>
            <div className="space-y-3">
              {isEditing ? (
                <>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                  />
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                  />
                </>
              ) : (
                <div className="flex items-center gap-3 text-foreground">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{formData.start_time} — {formData.end_time}</p>
                    <p className="text-sm text-muted-foreground">8 hours</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Station */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Station</p>
            {isEditing ? (
              <input
                type="text"
                value={formData.station}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                placeholder="Station"
              />
            ) : (
              <div className="flex items-center gap-3 text-foreground">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p className="font-semibold">{formData.station || 'Not assigned'}</p>
              </div>
            )}
          </div>

          {/* Labor Cost */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Labor Cost</p>
            <div className="flex items-center gap-3 text-foreground">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <p className="font-semibold">$120</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Notes</p>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
              placeholder="Add notes..."
              rows="3"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 border-t border-border/30 bg-card p-6 space-y-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all"
              >
                Edit Shift
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-lg border border-border hover:bg-secondary text-foreground font-bold text-sm transition-all"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="w-full px-4 py-2.5 rounded-lg border border-border text-foreground font-bold text-sm transition-all"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}