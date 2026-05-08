import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import DesktopPageHeader from '@/components/DesktopPageHeader';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_TEMPLATE = {
  template_name: '',
  station: '',
  shift: 'any',
  assigned_role: '',
  recurring_days: [],
  department_location: '',
  is_active: true,
  status: 'draft',
  notes: '',
  items: [],
};

const DEFAULT_ITEM = {
  item_name: '',
  par_quantity: '',
  unit: '',
  priority: 'medium',
  requires_photo: false,
  requires_inventory_count: true,
  is_active: true,
};

export default function PrepTemplateBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState(DEFAULT_ITEM);

  useEffect(() => {
    if (id) loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      const data = await base44.entities.PrepPlanTemplate?.get?.(id);
      setTemplate(data || DEFAULT_TEMPLATE);
    } catch (e) {
      toast.error('Failed to load template');
    }
    setLoading(false);
  };

  const addRow = () => {
    if (!newItem.item_name?.trim() || !newItem.par_quantity || !newItem.unit?.trim()) {
      toast.error('Fill in item name, par quantity, and unit');
      return;
    }
    setTemplate(p => ({
      ...p,
      items: [...(p.items || []), { ...newItem, sort_order: (p.items?.length || 0) }],
    }));
    setNewItem(DEFAULT_ITEM);
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addRow();
    }
  };

  const deleteRow = (idx) => {
    setTemplate(p => ({
      ...p,
      items: (p.items || []).filter((_, i) => i !== idx),
    }));
  };

  const duplicateRow = (idx) => {
    const item = template.items[idx];
    setTemplate(p => ({
      ...p,
      items: [...(p.items || []), { ...item, sort_order: (p.items?.length || 0) }],
    }));
  };

  const moveRow = (idx, direction) => {
    const items = [...(template.items || [])];
    if (direction === 'up' && idx > 0) {
      [items[idx], items[idx - 1]] = [items[idx - 1], items[idx]];
    } else if (direction === 'down' && idx < items.length - 1) {
      [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
    }
    setTemplate(p => ({ ...p, items }));
  };

  const toggleRecurringDay = (dayNum) => {
    setTemplate(p => ({
      ...p,
      recurring_days: p.recurring_days.includes(dayNum)
        ? p.recurring_days.filter(d => d !== dayNum)
        : [...p.recurring_days, dayNum].sort(),
    }));
  };

  const handleSave = async () => {
    if (!template.template_name?.trim() || !template.station?.trim() || !template.items || template.items.length === 0) {
      toast.error('Fill in template name, station, and add at least one item');
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        ...template,
        template_name: template.template_name.trim(),
        station: template.station.trim(),
        items: template.items.map((item, idx) => ({ ...item, sort_order: idx })),
      };

      if (id) {
        await base44.entities.PrepPlanTemplate?.update?.(id, saveData);
        toast.success('Template updated');
      } else {
        const created = await base44.entities.PrepPlanTemplate?.create?.(saveData);
        toast.success('Template created');
        navigate(`/prep-plan-templates/${created.id}`);
      }
    } catch (e) {
      toast.error('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground font-bold">Admin only</p>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-background min-h-screen">
      <DesktopPageHeader
        title={id ? 'Edit Prep Template' : 'New Prep Template'}
        subtitle="Build reusable prep templates for your restaurant"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/prep-plan-templates')} className="btn-secondary text-xs h-8 px-3">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-xs h-8 px-4 flex items-center gap-1">
              <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save Template'}
            </button>
          </div>
        }
      />

      <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
        {/* Template Header */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase text-muted-foreground">Template Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">Template Name *</label>
              <input value={template.template_name} onChange={e => setTemplate(p => ({ ...p, template_name: e.target.value }))} placeholder="e.g. Opening Line Prep" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">Station *</label>
              <input value={template.station} onChange={e => setTemplate(p => ({ ...p, station: e.target.value }))} placeholder="e.g. Grill" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">Shift</label>
              <select value={template.shift} onChange={e => setTemplate(p => ({ ...p, shift: e.target.value }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                <option value="opening">Opening</option>
                <option value="mid">Mid</option>
                <option value="closing">Closing</option>
                <option value="any">Any</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">Role</label>
              <input value={template.assigned_role} onChange={e => setTemplate(p => ({ ...p, assigned_role: e.target.value }))} placeholder="e.g. Lead Cook" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">Department / Location</label>
              <input value={template.department_location} onChange={e => setTemplate(p => ({ ...p, department_location: e.target.value }))} placeholder="Optional" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-2">Recurring Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleRecurringDay(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    template.recurring_days.includes(idx)
                      ? 'bg-primary text-white'
                      : 'bg-background border border-border text-foreground hover:border-border/60'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-2">Notes / Instructions</label>
            <textarea value={template.notes} onChange={e => setTemplate(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Check quality before starting shift…" rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={template.is_active} onChange={e => setTemplate(p => ({ ...p, is_active: e.target.checked }))} className="rounded border-border" />
              Active
            </label>
            <select value={template.status} onChange={e => setTemplate(p => ({ ...p, status: e.target.value }))} className="px-3 py-1.5 bg-background border border-border rounded text-xs text-foreground font-bold">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Prep Items Table */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">Prep Items ({template.items?.length || 0})</h3>
          </div>

          {template.items && template.items.length > 0 && (
            <div className="overflow-x-auto border border-border/30 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-background/50">
                    <th className="px-3 py-2 text-left font-bold text-foreground">Item</th>
                    <th className="px-3 py-2 text-left font-bold text-foreground">Par</th>
                    <th className="px-3 py-2 text-left font-bold text-foreground">Unit</th>
                    <th className="px-3 py-2 text-left font-bold text-foreground">Priority</th>
                    <th className="px-3 py-2 text-center font-bold text-foreground">Photo</th>
                    <th className="px-3 py-2 text-center font-bold text-foreground">Count</th>
                    <th className="px-3 py-2 text-center font-bold text-foreground">Active</th>
                    <th className="px-3 py-2 text-center font-bold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {template.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-border/30 hover:bg-background/50">
                      <td className="px-3 py-2 font-semibold text-foreground">{item.item_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.par_quantity}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.unit}</td>
                      <td className="px-3 py-2 text-muted-foreground text-[10px] capitalize">{item.priority || 'medium'}</td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.requires_photo}
                          onChange={e => {
                            const items = [...template.items];
                            items[idx].requires_photo = e.target.checked;
                            setTemplate(p => ({ ...p, items }));
                          }}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.requires_inventory_count}
                          onChange={e => {
                            const items = [...template.items];
                            items[idx].requires_inventory_count = e.target.checked;
                            setTemplate(p => ({ ...p, items }));
                          }}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.is_active}
                          onChange={e => {
                            const items = [...template.items];
                            items[idx].is_active = e.target.checked;
                            setTemplate(p => ({ ...p, items }));
                          }}
                          className="rounded border-border"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Row Form */}
          <div className="bg-background/50 rounded-lg p-4 space-y-3 border border-border/30">
            <p className="text-xs font-bold text-muted-foreground uppercase">Add New Row</p>
            <div className="grid grid-cols-5 gap-2">
              <input value={newItem.item_name} onChange={e => setNewItem(p => ({ ...p, item_name: e.target.value }))} onKeyDown={handleFormKeyDown} placeholder="Item name" className="px-2 py-1.5 bg-card border border-border rounded text-xs text-foreground" />
              <input type="number" value={newItem.par_quantity} onChange={e => setNewItem(p => ({ ...p, par_quantity: e.target.value }))} onKeyDown={handleFormKeyDown} placeholder="Par qty" className="px-2 py-1.5 bg-card border border-border rounded text-xs text-foreground" />
              <input value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} onKeyDown={handleFormKeyDown} placeholder="Unit" className="px-2 py-1.5 bg-card border border-border rounded text-xs text-foreground" />
              <select value={newItem.priority} onChange={e => setNewItem(p => ({ ...p, priority: e.target.value }))} onKeyDown={handleFormKeyDown} className="px-2 py-1.5 bg-card border border-border rounded text-xs text-foreground">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <div className="flex items-center gap-1.5">
                <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                  <input type="checkbox" checked={newItem.requires_photo} onChange={e => setNewItem(p => ({ ...p, requires_photo: e.target.checked }))} className="rounded border-border" />
                  Photo
                </label>
                <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                  <input type="checkbox" checked={newItem.requires_inventory_count} onChange={e => setNewItem(p => ({ ...p, requires_inventory_count: e.target.checked }))} className="rounded border-border" />
                  Count
                </label>
                <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                  <input type="checkbox" checked={newItem.is_active} onChange={e => setNewItem(p => ({ ...p, is_active: e.target.checked }))} className="rounded border-border" />
                  Active
                </label>
              </div>
              <button onClick={addRow} className="ml-auto px-3 py-1.5 bg-primary text-white text-xs font-bold rounded hover:brightness-110 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add Row
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;