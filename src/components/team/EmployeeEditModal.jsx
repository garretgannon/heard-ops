import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EmployeeEditModal({ employee, onClose, onSave }) {
  const [formData, setFormData] = useState(employee || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.full_name?.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.User.update(employee.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        birthday: formData.birthday,

        department: formData.department,
        rate_of_pay: formData.rate_of_pay,
        start_date: formData.start_date,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        role: formData.role,
      });
      toast.success('Employee updated');
      onSave?.();
      onClose();
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ duration: 0.2, type: 'spring', damping: 25 }}
          className="w-full lg:w-full lg:max-w-md h-[90vh] lg:h-[95vh] bg-card border border-border rounded-t-2xl lg:rounded-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-border/30 shrink-0">
            <h2 className="text-lg font-bold text-foreground">Edit Employee</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-4 flex-1 overflow-y-auto">
            {/* Personal Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Personal Information</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Employee Number</label>
                <input
                  type="text"
                  value={formData.employee_number || `EMP-${formData.id?.slice(0, 4).toUpperCase() || 'N/A'}`}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-border bg-secondary text-muted-foreground text-sm opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-border bg-secondary text-muted-foreground text-sm opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Birthday</label>
                <input
                  type="date"
                  value={formData.birthday || ''}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3 pt-3 border-t border-border/20">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Address</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Street Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    maxLength="2"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Employment */}
            <div className="space-y-3 pt-3 border-t border-border/20">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Employment</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Department</label>
                <select
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Department</option>
                  <option value="FOH">FOH</option>
                  <option value="BOH">BOH</option>
                  <option value="Bar">Bar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Rate of Pay</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate_of_pay || ''}
                  onChange={(e) => setFormData({ ...formData, rate_of_pay: e.target.value })}
                  placeholder="15.50"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Role</label>
                <select
                  value={formData.role || 'user'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="user">Staff</option>
                  <option value="admin">Manager</option>
                  <option value="busser">Busser</option>
                </select>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-3 pt-3 border-t border-border/20">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Emergency Contact</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Name</label>
                <input
                  type="text"
                  value={formData.emergency_contact_name || ''}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone || ''}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Relationship</label>
                <input
                  type="text"
                  value={formData.emergency_contact_relationship || ''}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                  placeholder="e.g., Parent, Spouse"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 lg:px-6 py-3 border-t border-border/30 flex gap-2 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}