import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import MobileModalWrapper from '@/components/MobileModalWrapper';

const LOG_TYPES = [
  { id: 'temperature', label: 'Temperature' },
  { id: 'bathroom', label: 'Bathroom Check' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'incident', label: 'Incident' },
  { id: 'employee_note', label: 'Employee Note' },
  { id: 'manager_note', label: 'Manager Note' },
  { id: 'waste', label: 'Waste' },
  { id: 'eighty_six', label: '86 Item' },
  { id: 'chemical', label: 'Chemical' },
  { id: 'custom', label: 'Custom Log' },
];

const MANAGER_LOG_TYPES = [
  { id: 'sales_notes', label: 'Sales Notes' },
  { id: 'guest_notes', label: 'Guest Notes' },
  { id: 'cash_log', label: 'Cash Log' },
  { id: 'employee_calendar', label: 'Employee Calendar' },
  { id: 'incident_report', label: 'Incident Report' },
  { id: 'other', label: 'Other' },
];

const STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'flagged', 'needs_review'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function UnifiedLogForm({ initialType, onClose, onSuccess }) {
  const { user } = useCurrentUser();
  const [logType, setLogType] = useState(initialType || 'temperature');
  const isManagerLog = logType === 'manager_note';
  const [managerLogType, setManagerLogType] = useState('');
  const [titleEdited, setTitleEdited] = useState(false);
  const [formData, setFormData] = useState({
    type: initialType || 'temperature',
    title: '',
    description: '',
    location: '',
    employee_name: '',
    status: 'open',
    priority: 'medium',
    visibility: 'team_log',
    manager_only: false,
    follow_up_required: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (isManagerLog && !managerLogType) {
      toast.error('Manager log type is required');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Log title is required');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.UnifiedLog.create({
        ...formData,
        created_by: user?.email,
        type: logType,
        location: isManagerLog ? '' : formData.location,
        custom_metadata: isManagerLog ? { manager_log_type: managerLogType } : formData.custom_metadata,
      });
      toast.success(`${LOG_TYPES.find(t => t.id === logType)?.label || 'Log'} recorded`);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error('Failed to record log');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getFormTitle = () => {
    const titles = {
      temperature: 'Log Temperature',
      maintenance: 'Report Maintenance',
      incident: 'Report Incident',
      waste: 'Log Waste / 86',
      employee_note: 'Add Employee Note',
      manager_note: 'Add Manager Note',
      bathroom: 'Bathroom Check',
      custom: 'Add Log',
    };
    return titles[logType] || 'New Log Entry';
  };

  const footer = (
    <>
      <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-border text-foreground font-bold text-sm hover:bg-secondary active:scale-95 transition-all">
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save Log'}
      </button>
    </>
  );

  return (
    <MobileModalWrapper
      isOpen={true}
      onClose={onClose}
      title={getFormTitle()}
      footer={footer}
    >
      {!initialType && (
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Log Type</label>
          <div className="grid grid-cols-2 gap-2">
            {LOG_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setLogType(t.id); setFormData({ ...formData, type: t.id }); }}
                className={cn(
                  'p-2 rounded-lg border text-xs font-bold whitespace-nowrap transition-all active:scale-95',
                  logType === t.id
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isManagerLog && (
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
            Manager Log Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MANAGER_LOG_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setManagerLogType(t.id);
                  if (!titleEdited || !formData.title.trim()) {
                    setFormData({ ...formData, title: t.label });
                  }
                }}
                className={cn(
                  'p-2 rounded-lg border text-xs font-bold whitespace-nowrap transition-all active:scale-95',
                  managerLogType === t.id
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => {
            setTitleEdited(true);
            setFormData({ ...formData, title: e.target.value });
          }}
          placeholder="Log entry title"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Details</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add details about the incident, observation, or action taken"
          rows="3"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Location & Employee */}
      <div className={cn("grid gap-3", isManagerLog ? "grid-cols-1" : "grid-cols-2")}>
        {!isManagerLog && (
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Walk-in cooler"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Employee</label>
          <input
            type="text"
            value={formData.employee_name}
            onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
            placeholder="Name involved"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Status & Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Visibility</label>
        <select
          value={formData.visibility}
          onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="team_log">Team Log (All staff)</option>
          <option value="manager_only">Manager Only</option>
          <option value="assigned_roles_only">Assigned Roles Only</option>
          <option value="private">Private</option>
        </select>
      </div>

      {/* Follow-up */}
      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 min-h-11">
        <input
          type="checkbox"
          checked={formData.follow_up_required}
          onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
          className="rounded border-border w-5 h-5 cursor-pointer"
        />
        <span className="text-sm text-muted-foreground">Follow-up required</span>
      </label>
    </MobileModalWrapper>
  );
}
