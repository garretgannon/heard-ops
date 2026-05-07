import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

const STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'flagged', 'needs_review'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function UnifiedLogForm({ initialType, onClose, onSuccess }) {
  const { user } = useCurrentUser();
  const [logType, setLogType] = useState(initialType || 'temperature');
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

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full lg:max-w-lg max-h-[90vh] bg-card border border-border rounded-t-2xl lg:rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/30 shrink-0">
          <h2 className="text-lg font-bold text-foreground">{getFormTitle()}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Log Type</label>
            <div className="grid grid-cols-2 gap-2">
              {LOG_TYPES.filter(t => !initialType || t.id === initialType).map(t => (
                <button
                  key={t.id}
                  onClick={() => { setLogType(t.id); setFormData({ ...formData, type: t.id }); }}
                  className={cn(
                    'p-2 rounded-lg border text-xs font-bold whitespace-nowrap transition-all',
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

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Log entry title"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Location & Employee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Walk-in cooler"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Employee</label>
              <input
                type="text"
                value={formData.employee_name}
                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                placeholder="Name involved"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Visibility & Options */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Visibility</label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="team_log">Team Log (All staff)</option>
              <option value="manager_only">Manager Only</option>
              <option value="assigned_roles_only">Assigned Roles Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Follow-up */}
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
            <input
              type="checkbox"
              checked={formData.follow_up_required}
              onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
              className="rounded border-border"
            />
            <span className="text-sm text-muted-foreground">Follow-up required</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-border/30 shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-foreground font-bold text-sm hover:bg-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Log'}
          </button>
        </div>
      </div>
    </div>
  );
}