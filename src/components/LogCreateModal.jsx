import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, X, Save, Loader2 } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const LOG_TYPES = [
  { id: 'manager', label: 'Manager Note', color: 'bg-blue-500', desc: 'General shift note or observation' },
  { id: 'issue', label: 'Issue / Incident', color: 'bg-red-500', desc: 'Equipment, safety, or operational issue' },
  { id: 'waste', label: 'Waste Entry', color: 'bg-amber-500', desc: 'Waste linked to prep or purchased items' },
  { id: 'eighty_six', label: '86 Item', color: 'bg-orange-500', desc: '86 linked menu, ingredient, or prep item' },
  { id: 'cooling_temp', label: 'Cooling Temp', color: 'bg-cyan-500', desc: 'Ad hoc cooling check for a prepped batch' },
  { id: 'maintenance', label: 'Maintenance', color: 'bg-purple-500', desc: 'Equipment repair or maintenance request' },
];

const MANAGER_LOG_TYPES = [
  { id: 'sales_notes', label: 'Sales Notes' },
  { id: 'guest_notes', label: 'Guest Notes' },
  { id: 'cash_log', label: 'Cash Log' },
  { id: 'employee_calendar', label: 'Employee Calendar' },
  { id: 'incident_report', label: 'Incident Report' },
  { id: 'other', label: 'Other' },
];

const INITIAL_FORM = {
  title: '',
  manager_log_type: '',
  notes: '',
  priority: 'medium',
  department: 'BOH',
  location: '',
  quantity: 1,
  unit: 'each',
  temperature: '',
  estimatedCost: '',
  reason: 'Other',
  linkedType: '',
  linkedId: '',
};

const itemLabel = (item) => item.name || item.itemName || item.ingredientName || item.taskName || item.item_name || 'Untitled item';
const normalizeReason = (reason) => String(reason || 'other').toLowerCase().replace(/\//g, '_').replace(/\s+/g, '_');

function buildLinkedOptions(type, data) {
  if (type === 'waste') {
    return [
      ...data.prepItems.map(item => ({ type: 'prep_item', id: item.id, label: itemLabel(item), unit: item.unit || '', cost: '' })),
      ...data.purchasedItems.map(item => ({ type: 'purchased_item', id: item.id, label: itemLabel(item), unit: item.inventoryUnit || item.purchaseUnit || '', cost: item.unitCost || item.costPerRecipeUnit || '' })),
    ];
  }

  if (type === 'eighty_six') {
    return [
      ...data.recipes.map(item => ({ type: 'recipe', id: item.id, label: itemLabel(item), unit: item.yieldUnit || '' })),
      ...data.recipeIngredients.map(item => ({ type: 'recipe_ingredient', id: item.id, label: itemLabel(item), unit: item.unit || '' })),
      ...data.prepItems.map(item => ({ type: 'prep_item', id: item.id, label: itemLabel(item), unit: item.unit || '' })),
    ];
  }

  if (type === 'cooling_temp') {
    return data.prepItems.map(item => ({ type: 'prep_item', id: item.id, label: itemLabel(item), unit: item.unit || '' }));
  }

  return [];
}

async function uploadFiles(files) {
  const uploader = base44.integrations?.Core?.UploadFile || base44.integrations?.UploadFile;
  const list = Array.from(files || []);
  if (list.length === 0) return [];

  const uploads = await Promise.all(list.map(async (file) => {
    if (!uploader) return URL.createObjectURL(file);
    const result = await uploader({ file });
    return result?.file_url || result?.url || '';
  }));

  return uploads.filter(Boolean);
}

export default function LogCreateModal({ onClose, onCreated }) {
  const { user } = useCurrentUser();
  const [type, setType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState([]);
  const [linkData, setLinkData] = useState({ prepItems: [], purchasedItems: [], recipes: [], recipeIngredients: [] });

  React.useEffect(() => {
    document.body.classList.add('modal-open');
    const handleTouchMove = (e) => {
      const scrollable = e.target.closest('[data-scrollable]');
      if (!scrollable) e.preventDefault();
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  React.useEffect(() => {
    if (!type) return;
    const needsLinks = ['waste', 'eighty_six', 'cooling_temp'].includes(type);
    if (!needsLinks) return;

    Promise.all([
      base44.entities.PrepItem.list('-updated_date', 100).catch(() => []),
      base44.entities.PurchasedItem.list('-updated_date', 100).catch(() => []),
      base44.entities.Recipe.list('-updated_date', 100).catch(() => []),
      base44.entities.RecipeIngredient.list('-updated_date', 200).catch(() => []),
    ]).then(([prepItems, purchasedItems, recipes, recipeIngredients]) => {
      setLinkData({ prepItems, purchasedItems, recipes, recipeIngredients });
    });
  }, [type]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const linkedOptions = buildLinkedOptions(type, linkData);
  const linkedItem = linkedOptions.find(option => `${option.type}:${option.id}` === form.linkedId);

  const handleSave = async () => {
    const linkedRequired = ['waste', 'eighty_six', 'cooling_temp'].includes(type);
    if (!type) return;
    if (linkedRequired && !linkedItem) return;
    if (type === 'manager' && !form.manager_log_type) return;
    if (type === 'cooling_temp' && !form.temperature) return;
    if (!linkedRequired && !form.title.trim()) return;

    setSaving(true);
    haptics.medium();

    try {
      const photoUrls = await uploadFiles(files);
      const title = linkedItem?.label || form.title;
      const now = new Date().toISOString();

      if (type === 'manager') {
        await base44.entities.UnifiedLog.create({
          type: 'manager_note',
          title: form.title,
          description: form.notes,
          priority: form.priority,
          status: 'needs_review',
          requires_review: true,
          created_by: user?.email,
          photo_urls: photoUrls,
          attachment_urls: photoUrls,
          custom_metadata: {
            department: form.department,
            manager_log_type: form.manager_log_type,
            logged_by_name: user?.full_name || user?.email,
            photo_urls: photoUrls,
          },
        });
      } else if (type === 'issue') {
        await base44.entities.Issue.create({
          title: form.title,
          description: form.notes,
          notes: form.notes,
          priority: form.priority,
          department: form.department,
          location: form.location,
          status: 'open',
          category: 'other',
          source: 'manual',
          created_by_email: user?.email,
          photo_urls: photoUrls,
        });
      } else if (type === 'waste') {
        const log = await base44.entities.LogEntry.create({
          log_type: 'compliance_log',
          completed_by_email: user?.email,
          completed_at: now,
          notes: form.notes,
          photo_urls: photoUrls,
          submitted_values: {
            kind: 'waste',
            linked_type: linkedItem.type,
            linked_id: linkedItem.id,
            quantity: parseFloat(form.quantity) || 1,
            unit: form.unit || linkedItem.unit,
            estimated_cost: parseFloat(form.estimatedCost || linkedItem.cost) || 0,
            reason: form.reason,
          },
        });
        await base44.entities.LogWasteDetail.create({
          logId: log.id,
          itemName: title,
          quantity: parseFloat(form.quantity) || 1,
          unit: form.unit || linkedItem.unit,
          reason: normalizeReason(form.reason),
          estimatedCost: parseFloat(form.estimatedCost || linkedItem.cost) || 0,
          linkedPrepItemId: linkedItem.type === 'prep_item' ? linkedItem.id : '',
          linkedPurchasedItemId: linkedItem.type === 'purchased_item' ? linkedItem.id : '',
        });
      } else if (type === 'eighty_six') {
        const linkedFields = {
          linked_recipe_id: linkedItem.type === 'recipe' ? linkedItem.id : '',
          linked_recipe_ingredient_id: linkedItem.type === 'recipe_ingredient' ? linkedItem.id : '',
          linked_prep_item_id: linkedItem.type === 'prep_item' ? linkedItem.id : '',
        };
        await base44.entities.EightySixItem.create({
          item_name: title,
          reason: form.reason,
          area_menu_category: linkedItem.type,
          date_time_started: now,
          logged_by: user?.full_name || user?.email,
          quantity: parseFloat(form.quantity) || 0,
          unit: form.unit || linkedItem.unit,
          notes: form.notes,
          status: 'active',
          photo_url: photoUrls[0] || '',
          photo_urls: photoUrls,
          ...linkedFields,
        });
        const log = await base44.entities.LogEntry.create({
          log_type: 'compliance_log',
          completed_by_email: user?.email,
          completed_at: now,
          notes: form.notes,
          photo_urls: photoUrls,
          submitted_values: { kind: 'eighty_six', linked_type: linkedItem.type, linked_id: linkedItem.id },
        });
        await base44.entities.LogEightySixDetail.create({
          logId: log.id,
          itemName: title,
          reason: form.reason,
          linkedRecipeId: linkedItem.type === 'recipe' ? linkedItem.id : '',
          linkedRecipeIngredientId: linkedItem.type === 'recipe_ingredient' ? linkedItem.id : '',
          linkedPrepItemId: linkedItem.type === 'prep_item' ? linkedItem.id : '',
        });
      } else if (type === 'cooling_temp') {
        const temperature = parseFloat(form.temperature);
        const log = await base44.entities.LogEntry.create({
          log_type: 'temperature_check',
          completed_by_email: user?.email,
          completed_at: now,
          notes: form.notes,
          photo_urls: photoUrls,
          source_task_id: linkedItem.id,
          submitted_values: {
            kind: 'cooling_check',
            linked_type: linkedItem.type,
            linked_id: linkedItem.id,
            temperature,
            quantity: parseFloat(form.quantity) || 1,
            unit: form.unit || linkedItem.unit,
          },
        });
        await base44.entities.LogTemperatureDetail.create({
          logId: log.id,
          temperatureCategory: 'cooling_check',
          linkedPrepItemId: linkedItem.id,
          temperatureValue: temperature,
          temperatureUnit: 'F',
          coolingStage: 'ad_hoc',
          passFail: 'pending',
          correctiveAction: form.notes,
        });
        await base44.entities.CoolingLog.create({
          prepItemId: linkedItem.id,
          foodItem: title,
          batchId: new Date().toISOString().slice(0, 10),
          date: new Date().toISOString().slice(0, 10),
          startTime: new Date().toTimeString().slice(0, 5),
          startTemperature: temperature,
          status: 'in_progress',
          completedBy: user?.email,
          completedAt: now,
          photo_urls: photoUrls,
          notes: form.notes,
        });
      } else if (type === 'maintenance') {
        await base44.entities.MaintenanceRequest.create({
          title: form.title,
          description: form.notes,
          priority: form.priority === 'critical' ? 'urgent' : form.priority,
          location: form.location,
          status: 'open',
          reported_by: user?.full_name || user?.email,
          photo_url: photoUrls[0] || '',
          photo_urls: photoUrls,
        }).catch(() =>
          base44.entities.Issue.create({
            title: `[Maintenance] ${form.title}`,
            description: form.notes,
            notes: form.notes,
            priority: form.priority,
            location: form.location,
            status: 'open',
            category: 'equipment',
            source: 'manual',
            created_by_email: user?.email,
            photo_urls: photoUrls,
          })
        );
      }

      haptics.success?.();
      onCreated?.();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const selectedType = LOG_TYPES.find(logType => logType.id === type);
  const showLinkedItem = ['waste', 'eighty_six', 'cooling_temp'].includes(type);
  const showQuantity = ['waste', 'eighty_six', 'cooling_temp'].includes(type);
  const showAttachment = ['manager', 'issue', 'maintenance', 'eighty_six', 'cooling_temp'].includes(type);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="w-[min(95vw,500px)] sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl border border-border flex flex-col max-h-[90vh]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-card">
          <h2 className="font-bold text-foreground">New Log Entry</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground active:scale-90">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" data-scrollable>
          <div className="p-4 space-y-4">
            {!type ? (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Select Log Type</p>
                {LOG_TYPES.map(logType => (
                  <button
                    key={logType.id}
                    onClick={() => {
                      setType(logType.id);
                      setForm(INITIAL_FORM);
                      setFiles([]);
                    }}
                    className="w-full flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 hover:border-primary/40 active:scale-[0.98] transition-all text-left"
                  >
                    <div className={`h-3 w-3 rounded-full shrink-0 ${logType.color}`} />
                    <div>
                      <p className="text-sm font-bold text-foreground">{logType.label}</p>
                      <p className="text-xs text-muted-foreground">{logType.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-3 w-3 rounded-full shrink-0 ${selectedType?.color}`} />
                  <p className="text-sm font-bold text-foreground">{selectedType?.label}</p>
                  <button onClick={() => setType(null)} className="ml-auto text-xs text-primary font-bold">Change</button>
                </div>

                {type === 'manager' && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Log Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {MANAGER_LOG_TYPES.map(logType => (
                        <button
                          key={logType.id}
                          type="button"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            manager_log_type: logType.id,
                            title: prev.title || logType.label,
                          }))}
                          className={`rounded-lg border px-3 py-2 text-left text-xs font-bold transition-all ${
                            form.manager_log_type === logType.id
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-border bg-background text-muted-foreground'
                          }`}
                        >
                          {logType.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!showLinkedItem && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Title *</label>
                    <input
                      type="text"
                      placeholder="Enter title..."
                      value={form.title}
                      onChange={e => set('title', e.target.value)}
                      className="w-full h-9 px-3 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}

                {showLinkedItem && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">
                      {type === 'waste' ? 'Waste Item *' : type === 'eighty_six' ? '86 Item *' : 'Cooling Prep Item *'}
                    </label>
                    <select
                      value={form.linkedId}
                      onChange={e => {
                        const option = linkedOptions.find(item => `${item.type}:${item.id}` === e.target.value);
                        setForm(prev => ({ ...prev, linkedId: e.target.value, linkedType: option?.type || '', unit: option?.unit || prev.unit, estimatedCost: option?.cost || prev.estimatedCost }));
                      }}
                      className="w-full h-9 px-2 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">Select linked item</option>
                      {linkedOptions.map(option => (
                        <option key={`${option.type}:${option.id}`} value={`${option.type}:${option.id}`}>{option.label} · {option.type.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                )}

                {showQuantity && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">Quantity</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={form.quantity}
                        onChange={e => set('quantity', e.target.value)}
                        className="w-full h-9 px-3 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">Unit</label>
                      <input
                        type="text"
                        placeholder="lbs, each..."
                        value={form.unit}
                        onChange={e => set('unit', e.target.value)}
                        className="w-full h-9 px-3 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {type === 'cooling_temp' && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Temperature *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Temp in F"
                      value={form.temperature}
                      onChange={e => set('temperature', e.target.value)}
                      className="w-full h-9 px-3 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}

                {(type === 'waste' || type === 'eighty_six') && (
                  <div className="grid grid-cols-2 gap-2">
                    {type === 'waste' && (
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Est. Cost ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={form.estimatedCost}
                          onChange={e => set('estimatedCost', e.target.value)}
                          className="w-full h-9 px-3 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    )}
                    <div className={type === 'eighty_six' ? 'col-span-2' : ''}>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">Reason</label>
                      <select
                        value={form.reason}
                        onChange={e => set('reason', e.target.value)}
                        className="w-full h-9 px-2 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none"
                      >
                        {(type === 'waste' ? ['Expired', 'Overproduction', 'Dropped', 'Contaminated', 'Trimming/Prep', 'Temperature Abuse', 'Other'] : ['Out of stock', 'Quality issue', 'Prep shortage', 'Vendor shortage', 'Other']).map(reason => (
                          <option key={reason}>{reason}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {(type === 'issue' || type === 'maintenance' || type === 'manager') && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">Priority</label>
                      <select
                        value={form.priority}
                        onChange={e => set('priority', e.target.value)}
                        className="w-full h-9 px-2 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">Department</label>
                      <select
                        value={form.department}
                        onChange={e => set('department', e.target.value)}
                        className="w-full h-9 px-2 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="BOH">BOH</option>
                        <option value="FOH">FOH</option>
                        <option value="Bar">Bar</option>
                        <option value="Management">Management</option>
                      </select>
                    </div>
                  </div>
                )}

                {(type === 'issue' || type === 'maintenance') && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Location / Area</label>
                    <input
                      type="text"
                      placeholder="e.g. Walk-in Cooler, Line 2..."
                      value={form.location}
                      onChange={e => set('location', e.target.value)}
                      className="w-full h-9 px-3 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}

                {showAttachment && (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-3 text-xs font-bold text-muted-foreground transition-all hover:border-primary/50 hover:text-primary">
                    <Camera className="h-4 w-4" />
                    {files.length ? `${files.length} file${files.length === 1 ? '' : 's'} attached` : 'Attach photo/file'}
                    <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
                  </label>
                )}

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Notes</label>
                  <textarea
                    placeholder="Details, context, follow-up needed..."
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
