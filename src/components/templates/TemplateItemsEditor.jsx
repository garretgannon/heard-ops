import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const ITEM_DEFAULTS = {
  prep: { title: '', quantity: '', unit: '', par_level: '', recipe_link: '' },
  sidework: { title: '', description: '' },
  cleaning: { title: '', cleaning_chemical: '', cleaning_frequency: 'Daily' },
  temperature: { title: '' },
  waste_86: { title: '', waste_reason: '', waste_quantity: '', waste_unit: '', waste_cost_impact: '' },
  opening: { title: '' },
  closing: { title: '' },
  handoff: { title: '', handoff_question: '' },
  beo_event: { title: '', beo_task_notes: '' },
  custom: { title: '', description: '' },
};

export default function TemplateItemsEditor({ items, onChange, templateType }) {
  const addItem = () => {
    const defaults = ITEM_DEFAULTS[templateType] || { title: '', description: '' };
    onChange([...items, { ...defaults, _localId: Date.now() }]);
  };

  const updateItem = (idx, field, value) => {
    const updated = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    onChange(updated);
  };

  const removeItem = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-muted-foreground uppercase">Items / Tasks</label>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Item
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground italic px-1">No items yet. Click "Add Item" to start building this template.</p>
      )}

      <div className="space-y-2">
        {items.map((item, idx) => (
          <ItemRow
            key={item._localId || item.id || idx}
            item={item}
            idx={idx}
            templateType={templateType}
            onChange={updateItem}
            onRemove={removeItem}
          />
        ))}
      </div>
    </div>
  );
}

function ItemRow({ item, idx, templateType, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg bg-card/60 overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <input
          type="text"
          value={item.title}
          onChange={e => onChange(idx, 'title', e.target.value)}
          placeholder="Item name..."
          className="flex-1 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-[10px] font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
        >
          {expanded ? 'Less' : 'More'}
        </button>
        <button type="button" onClick={() => onRemove(idx)} className="text-red-500/60 hover:text-red-500 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded type-specific fields */}
      {expanded && (
        <div className="border-t border-border/40 px-3 py-3 space-y-2 bg-background/40">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Description / Notes</label>
            <textarea
              value={item.description || ''}
              onChange={e => onChange(idx, 'description', e.target.value)}
              rows={2}
              className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {templateType === 'prep' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Qty</label>
                <input type="number" value={item.quantity || ''} onChange={e => onChange(idx, 'quantity', e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Unit</label>
                <input type="text" value={item.unit || ''} onChange={e => onChange(idx, 'unit', e.target.value)} placeholder="lbs, oz…"
                  className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Par Level</label>
                <input type="number" value={item.par_level || ''} onChange={e => onChange(idx, 'par_level', e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {templateType === 'cleaning' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Chemical / Tool</label>
                <input type="text" value={item.cleaning_chemical || ''} onChange={e => onChange(idx, 'cleaning_chemical', e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Frequency</label>
                <input type="text" value={item.cleaning_frequency || ''} onChange={e => onChange(idx, 'cleaning_frequency', e.target.value)} placeholder="Daily, Weekly…"
                  className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {templateType === 'waste_86' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Reason</label>
                <input type="text" value={item.waste_reason || ''} onChange={e => onChange(idx, 'waste_reason', e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Cost Impact ($)</label>
                <input type="number" value={item.waste_cost_impact || ''} onChange={e => onChange(idx, 'waste_cost_impact', e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {templateType === 'handoff' && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Required Question</label>
              <input type="text" value={item.handoff_question || ''} onChange={e => onChange(idx, 'handoff_question', e.target.value)} placeholder="What needs to be communicated?"
                className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary" />
            </div>
          )}

          {templateType === 'beo_event' && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Event Task Notes</label>
              <textarea value={item.beo_task_notes || ''} onChange={e => onChange(idx, 'beo_task_notes', e.target.value)} rows={2}
                className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary resize-none" />
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={item.requires_photo || false} onChange={e => onChange(idx, 'requires_photo', e.target.checked)} className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-muted-foreground">Photo</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={item.requires_manager_review || false} onChange={e => onChange(idx, 'requires_manager_review', e.target.checked)} className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-muted-foreground">Manager Review</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={item.is_critical || false} onChange={e => onChange(idx, 'is_critical', e.target.checked)} className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-muted-foreground">Critical</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}