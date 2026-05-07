import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import MobileModalWrapper from '@/components/MobileModalWrapper';

const TASK_TYPES = [
  { id: 'prep', label: 'Prep', color: 'orange' },
  { id: 'sidework', label: 'Side Work', color: 'blue' },
  { id: 'temperature', label: 'Temperature Log', color: 'cyan' },
  { id: 'cleaning', label: 'Cleaning', color: 'green' },
  { id: 'waste', label: 'Waste / 86', color: 'red' },
  { id: 'maintenance', label: 'Maintenance', color: 'yellow' },
  { id: 'incident', label: 'Incident', color: 'red' },
  { id: 'employee_note', label: 'Employee Note', color: 'purple' },
  { id: 'manager_note', label: 'Manager Note', color: 'indigo' },
  { id: 'custom', label: 'Custom Task', color: 'slate' },
];

const STATUSES = [
  'not_started',
  'in_progress',
  'complete',
  'needs_review',
  'overdue',
  'unable_to_complete',
];

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function UnifiedTaskForm({ initialType, onClose, onSuccess }) {
  const { user } = useCurrentUser();
  const [taskType, setTaskType] = useState(initialType || 'prep');
  const [formData, setFormData] = useState({
    type: initialType || 'prep',
    title: '',
    description: '',
    assigned_role: '',
    assigned_employee_name: '',
    station: '',
    due_time: '',
    due_date: '',
    status: 'not_started',
    priority: 'medium',
    photo_required: false,
    manager_review_required: false,
    visibility: 'team_only',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Task.create({
        ...formData,
        created_by_user: user?.email,
        type: taskType,
      });
      toast.success(`${TASK_TYPES.find(t => t.id === taskType)?.label || 'Task'} created`);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error('Failed to create task');
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
        className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Create Task'}
      </button>
    </>
  );

  return (
    <MobileModalWrapper
      isOpen={true}
      onClose={onClose}
      title="New Task"
      footer={footer}
    >
      {/* Type Selection */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Task Type</label>
        <div className="grid grid-cols-2 gap-2">
          {TASK_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => { setTaskType(t.id); setFormData({ ...formData, type: t.id }); }}
              className={cn(
                'p-2 rounded-lg border text-xs font-bold whitespace-nowrap transition-all active:scale-95',
                taskType === t.id
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
        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Task title"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add notes"
          rows="3"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Assignment */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Role</label>
          <input
            type="text"
            value={formData.assigned_role}
            onChange={(e) => setFormData({ ...formData, assigned_role: e.target.value })}
            placeholder="e.g., Kitchen Lead"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
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
      </div>

      {/* Scheduling */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Due Date</label>
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Due Time</label>
          <input
            type="time"
            value={formData.due_time}
            onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Priority & Status */}
      <div className="grid grid-cols-2 gap-3">
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
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 min-h-11">
          <input
            type="checkbox"
            checked={formData.photo_required}
            onChange={(e) => setFormData({ ...formData, photo_required: e.target.checked })}
            className="w-5 h-5 cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">Photo required</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 min-h-11">
          <input
            type="checkbox"
            checked={formData.manager_review_required}
            onChange={(e) => setFormData({ ...formData, manager_review_required: e.target.checked })}
            className="w-5 h-5 cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">Requires manager review</span>
        </label>
      </div>
    </MobileModalWrapper>
  );
}