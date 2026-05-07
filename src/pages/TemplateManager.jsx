import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import MobileModalWrapper from '@/components/MobileModalWrapper';

const TEMPLATE_TYPES = [
  { id: 'prep', label: 'Prep Lists' },
  { id: 'sidework', label: 'Side Work' },
  { id: 'cleaning', label: 'Cleaning Checklists' },
  { id: 'temperature', label: 'Temperature Logs' },
  { id: 'waste_86', label: 'Waste / 86 Logs' },
  { id: 'maintenance', label: 'Maintenance Checks' },
  { id: 'opening_checklist', label: 'Opening Checklists' },
  { id: 'closing_checklist', label: 'Closing Checklists' },
  { id: 'shift_handoff', label: 'Shift Handoffs' },
  { id: 'beo_event', label: 'Event/BEO Task Lists' },
];

const RECURRENCE_OPTIONS = [
  { id: 'daily', label: 'Every Day' },
  { id: 'weekly', label: 'Specific Days' },
  { id: 'every_shift', label: 'Every Shift' },
  { id: 'on_demand', label: 'On Demand' },
];

export default function TemplateManager() {
  const { user, isAdmin } = useCurrentUser();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await base44.entities.Template.list('-created_date', 100);
      setTemplates(data);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load templates');
      console.error(err);
      setLoading(false);
    }
  };

  const handleToggleActive = async (template) => {
    try {
      await base44.entities.Template.update(template.id, {
        is_active: !template.is_active,
      });
      setTemplates(prev =>
        prev.map(t => t.id === template.id ? { ...t, is_active: !t.is_active } : t)
      );
      toast.success(template.is_active ? 'Template disabled' : 'Template enabled');
    } catch (err) {
      toast.error('Failed to update template');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    try {
      await base44.entities.Template.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const filteredTemplates = filter === 'all'
    ? templates
    : templates.filter(t => t.template_type === filter);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="pb-20 bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold">Templates</h1>
            <p className="text-xs text-muted-foreground mt-1">Manage operational templates</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setSelectedTemplate(null); setActiveModal('create'); }}
              className="h-10 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-bold transition-all',
              filter === 'all'
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            All
          </button>
          {TEMPLATE_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-bold transition-all',
                filter === t.id
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template List */}
      <div className="px-4 py-6 space-y-3 max-w-2xl">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No templates yet</p>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-card border border-border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground">{template.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[11px] font-bold uppercase px-2 py-1 rounded bg-primary/10 text-primary">
                      {TEMPLATE_TYPES.find(t => t.id === template.template_type)?.label}
                    </span>
                    {template.assigned_role && (
                      <span className="text-[11px] font-bold uppercase px-2 py-1 rounded bg-muted text-muted-foreground">
                        {template.assigned_role}
                      </span>
                    )}
                    {template.assigned_station && (
                      <span className="text-[11px] font-bold uppercase px-2 py-1 rounded bg-muted text-muted-foreground">
                        {template.assigned_station}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Recurrence: <strong>{RECURRENCE_OPTIONS.find(r => r.id === template.recurrence_type)?.label}</strong>
                    {template.due_time && ` • Due: ${template.due_time}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleToggleActive(template)}
                        className="p-2 rounded-lg hover:bg-muted transition-all"
                      >
                        {template.is_active ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => { setSelectedTemplate(template); setActiveModal('edit'); }}
                        className="p-2 rounded-lg hover:bg-muted transition-all"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {activeModal && (
        <TemplateFormModal
          template={selectedTemplate}
          isNew={activeModal === 'create'}
          onClose={() => { setActiveModal(null); setSelectedTemplate(null); }}
          onSuccess={() => { setActiveModal(null); setSelectedTemplate(null); loadTemplates(); }}
        />
      )}
    </div>
  );
}

function TemplateFormModal({ template, isNew, onClose, onSuccess }) {
  const { user } = useCurrentUser();
  const [formData, setFormData] = useState(template || {
    name: '',
    template_type: 'prep',
    assigned_role: '',
    assigned_station: '',
    recurrence_type: 'daily',
    recurrence_days: [],
    due_time: '',
    priority: 'medium',
    photo_required: false,
    manager_review_required: false,
    visibility: 'team_only',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await base44.entities.Template.create({
          ...formData,
          created_by: user?.email,
        });
        toast.success('Template created');
      } else {
        await base44.entities.Template.update(template.id, formData);
        toast.success('Template updated');
      }
      onSuccess();
    } catch (err) {
      toast.error('Failed to save template');
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
        {saving ? 'Saving...' : isNew ? 'Create' : 'Update'}
      </button>
    </>
  );

  return (
    <MobileModalWrapper
      isOpen={true}
      onClose={onClose}
      title={isNew ? 'New Template' : 'Edit Template'}
      footer={footer}
    >
      {/* Name */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
          Template Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Morning Prep"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Type */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Template Type</label>
        <select
          value={formData.template_type}
          onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {TEMPLATE_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Role & Station */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Assigned Role</label>
          <input
            type="text"
            value={formData.assigned_role}
            onChange={(e) => setFormData({ ...formData, assigned_role: e.target.value })}
            placeholder="e.g., Kitchen Lead"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Station/Area</label>
          <input
            type="text"
            value={formData.assigned_station}
            onChange={(e) => setFormData({ ...formData, assigned_station: e.target.value })}
            placeholder="e.g., Prep"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Recurrence */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Recurrence</label>
        <select
          value={formData.recurrence_type}
          onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {RECURRENCE_OPTIONS.map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Due Time & Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Due Time</label>
          <input
            type="time"
            value={formData.due_time || ''}
            onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {['low', 'medium', 'high', 'critical'].map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Checkboxes */}
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
          <span className="text-sm text-muted-foreground">Manager review required</span>
        </label>
      </div>
    </MobileModalWrapper>
  );
}

export const hideBase44Index = true;