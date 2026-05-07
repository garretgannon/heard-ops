import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import MobileModalWrapper from '@/components/MobileModalWrapper';

export default function TemperatureMonitoringForm({ item, onClose, onSuccess }) {
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || '',
    type: item?.type || 'refrigerator',
    location: item?.location || '',
    station: item?.station || '',
    assigned_role: item?.assigned_role || '',
    assigned_employee_id: item?.assigned_employee_id || '',
    assigned_employee_name: item?.assigned_employee_name || '',
    min_temperature: item?.min_temperature || 33,
    max_temperature: item?.max_temperature || 41,
    check_frequency_hours: item?.check_frequency_hours || 2,
    shift_assignment: item?.shift_assignment || 'all_day',
    status: item?.status || 'active',
    grace_period_minutes: item?.grace_period_minutes || 15,
    corrective_action_required: item?.corrective_action_required !== false,
    manager_review_required: item?.manager_review_required !== false,
    notes: item?.notes || '',
  });

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.location.trim() || !formData.assigned_role.trim()) {
      toast.error('Name, location, and role are required');
      return;
    }

    setSaving(true);
    try {
      if (item) {
        await base44.entities.MonitoredTemperatureItem.update(item.id, formData);
      } else {
        await base44.entities.MonitoredTemperatureItem.create({
          ...formData,
          created_by: user?.email,
        });
      }
      onSuccess?.();
    } catch (err) {
      toast.error('Failed to save item');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-border text-foreground font-bold text-sm hover:bg-secondary active:scale-95 transition-all">
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 disabled:opacity-50 active:scale-95 transition-all"
      >
        {saving ? 'Saving...' : item ? 'Update' : 'Create'}
      </button>
    </>
  );

  return (
    <MobileModalWrapper
      isOpen={true}
      onClose={onClose}
      title={item ? 'Edit Temperature Item' : 'Add Temperature Item'}
      footer={footer}
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
            Equipment Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Walk-In Cooler"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="refrigerator">Refrigerator</option>
            <option value="freezer">Freezer</option>
            <option value="hot_holding">Hot Holding</option>
            <option value="cooling_log">Cooling Log</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Kitchen"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Station */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Station</label>
          <input
            type="text"
            value={formData.station}
            onChange={(e) => setFormData({ ...formData, station: e.target.value })}
            placeholder="e.g., Prep"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Assigned Role */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
            Assigned Role <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.assigned_role}
            onChange={(e) => setFormData({ ...formData, assigned_role: e.target.value })}
            placeholder="e.g., Kitchen Lead"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Temperature Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Min Temp (°F)</label>
            <input
              type="number"
              step="0.1"
              value={formData.min_temperature}
              onChange={(e) => setFormData({ ...formData, min_temperature: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Max Temp (°F)</label>
            <input
              type="number"
              step="0.1"
              value={formData.max_temperature}
              onChange={(e) => setFormData({ ...formData, max_temperature: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Check Frequency */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Check Frequency (Hours)</label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={formData.check_frequency_hours}
            onChange={(e) => setFormData({ ...formData, check_frequency_hours: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Shift */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Shift</label>
          <select
            value={formData.shift_assignment}
            onChange={(e) => setFormData({ ...formData, shift_assignment: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all_day">All Day</option>
            <option value="opening">Opening</option>
            <option value="mid">Mid</option>
            <option value="closing">Closing</option>
          </select>
        </div>

        {/* Grace Period */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Grace Period (Minutes)</label>
          <input
            type="number"
            min="0"
            value={formData.grace_period_minutes}
            onChange={(e) => setFormData({ ...formData, grace_period_minutes: parseInt(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Checkboxes */}
        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.corrective_action_required}
            onChange={(e) => setFormData({ ...formData, corrective_action_required: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm text-foreground">Corrective action required on failure</span>
        </label>

        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.manager_review_required}
            onChange={(e) => setFormData({ ...formData, manager_review_required: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm text-foreground">Manager review required on failure</span>
        </label>
      </div>
    </MobileModalWrapper>
  );
}