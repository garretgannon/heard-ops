import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BulkParEditorModal({ station, shift, onClose, onSave }) {
  const [templates, setTemplates] = useState([]);
  const [edited, setEdited] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [station, shift]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.PrepPlanTemplate?.filter?.({ is_active: true, station, shift }).catch(() => []);
      setTemplates(data || []);
      setEdited({});
    } catch (e) {
      toast.error('Failed to load templates');
    }
    setLoading(false);
  };

  const updatePar = (templateId, field, value) => {
    setEdited(prev => ({
      ...prev,
      [templateId]: { ...prev[templateId], [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(edited);
      await Promise.all(
        updates.map(([templateId, changes]) =>
          base44.entities.PrepPlanTemplate.update(templateId, changes)
        )
      );
      toast.success(`Updated ${updates.length} templates`);
      onSave?.();
      onClose();
    } catch (e) {
      toast.error('Failed to save changes');
    }
    setSaving(false);
  };

  const hasChanges = Object.keys(edited).length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center">
      <div className="w-full lg:w-[600px] bg-card border border-border rounded-t-2xl lg:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-foreground">Bulk Edit Par Quantities</h2>
            <p className="text-xs text-muted-foreground">{station} · {shift} shift</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No templates found for this station</div>
          ) : (
            <div className="space-y-3">
              {templates.map(template => {
                const changes = edited[template.id] || {};
                const defaultPar = changes.default_par !== undefined ? changes.default_par : template.default_par;
                const minPar = changes.minimum_par !== undefined ? changes.minimum_par : template.minimum_par;
                const batchSize = changes.batch_size !== undefined ? changes.batch_size : template.batch_size;
                const isDirty = template.id in edited;

                return (
                  <div key={template.id} className={`border rounded-lg p-3 transition-all ${isDirty ? 'bg-primary/10 border-primary/40' : 'border-border bg-muted/20'}`}>
                    <p className="font-semibold text-sm text-foreground mb-2">{template.item_name}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Par</label>
                        <input
                          type="number"
                          value={defaultPar || ''}
                          onChange={e => updatePar(template.id, 'default_par', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm font-bold text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Min</label>
                        <input
                          type="number"
                          value={minPar || ''}
                          onChange={e => updatePar(template.id, 'minimum_par', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm font-bold text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Batch</label>
                        <input
                          type="number"
                          value={batchSize || ''}
                          onChange={e => updatePar(template.id, 'batch_size', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm font-bold text-foreground"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">{template.unit}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary text-xs h-10"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex-1 btn-primary text-xs h-10 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : `Save Changes`}
          </button>
        </div>
      </div>
    </div>
  );
}