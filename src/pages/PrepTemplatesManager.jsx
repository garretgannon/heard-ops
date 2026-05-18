import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Copy, Archive, Search, ChevronLeft, Save, X, Upload, Download, Camera, ChefHat } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import PrepListImportFlow from '@/components/PrepListImportFlow';
import { toast } from 'sonner';

function TemplateCard({ template, onEdit, onDuplicate, onArchive }) {
  return (
    <div className="card-glass border border-border rounded-lg p-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-bold text-sm text-foreground">{template.name}</p>
          <p className="text-xs text-secondary-text mt-0.5">
            {template.station} • {template.jobCode}
          </p>
        </div>
        <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${template.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
          {template.isActive ? 'Active' : 'Archived'}
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>Shift: {template.shift}</p>
        <p>Days: {template.repeatDays?.join(', ') || 'All'}</p>
        <p>{template.itemCount || 0} items</p>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={() => onEdit(template.id)} className="flex-1 btn-secondary text-xs h-10">
          <Edit2 className="h-3 w-3 inline mr-1" />
          Edit
        </button>
        <button onClick={() => onDuplicate(template.id)} className="flex-1 btn-secondary text-xs h-10">
          <Copy className="h-3 w-3 inline mr-1" />
          Copy
        </button>
        <button onClick={() => onArchive(template.id)} className="btn-secondary text-xs h-10 px-2">
          <Archive className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

const UNITS = ['lbs','oz','kg','g','portions','each','batches','gallons','quarts','cups','tbsp','tsp','bags','cases','pans','trays','slices','pieces','servings','liters','ml','other'];

const BLANK_ITEM = () => ({ itemName: '', quantity: 1, unit: 'lbs', priority: 'medium', jobCode: 'Prep Cook', notes: '', sortOrder: 0, photoRequired: false, chefApprovalRequired: false });

function BulkItemEntry({ items, onChange, recipes = [] }) {
  const rowRefs = useRef([]);
  const [activePickerIdx, setActivePickerIdx] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const addRow = useCallback((afterIdx) => {
    const updated = [
      ...items.slice(0, afterIdx + 1),
      BLANK_ITEM(),
      ...items.slice(afterIdx + 1),
    ];
    onChange(updated);
    setTimeout(() => {
      rowRefs.current[afterIdx + 1]?.querySelector('[data-field="name"]')?.focus();
    }, 30);
  }, [items, onChange]);

  const removeRow = (idx) => {
    if (items.length === 1) { onChange([BLANK_ITEM()]); return; }
    onChange(items.filter((_, i) => i !== idx));
    setTimeout(() => {
      rowRefs.current[Math.max(0, idx - 1)]?.querySelector('[data-field="name"]')?.focus();
    }, 30);
  };

  const handleNameKeyDown = (e, idx) => {
    if (e.key === 'Enter') { e.preventDefault(); addRow(idx); }
    if (e.key === 'Backspace' && items[idx].itemName === '' && items.length > 1) { e.preventDefault(); removeRow(idx); }
  };

  const handleEnter = (e, idx) => {
    if (e.key === 'Enter') { e.preventDefault(); addRow(idx); }
  };

  return (
    <div className="space-y-0.5">
      <div className="grid grid-cols-[1fr_60px_108px_76px_26px_26px_28px] gap-1.5 px-1 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Item Name</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Qty</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unit</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Priority</span>
        <span title="Photo required" className="flex items-center justify-center"><Camera className="h-3 w-3 text-muted-foreground/50" /></span>
        <span title="Chef approval required" className="flex items-center justify-center"><ChefHat className="h-3 w-3 text-muted-foreground/50" /></span>
        <span />
      </div>
      {items.map((item, idx) => {
        const isDup = items.some((other, i) => i !== idx && other.itemName.trim().toLowerCase() === item.itemName.trim().toLowerCase() && item.itemName.trim());
        const q = (activePickerIdx === idx ? pickerSearch : item.itemName).toLowerCase();
        const filteredRecipes = activePickerIdx === idx ? recipes.filter(r => !pickerSearch || r.name.toLowerCase().includes(pickerSearch.toLowerCase())).slice(0, 6) : [];
        return (
        <div key={idx} ref={el => rowRefs.current[idx] = el} className="grid grid-cols-[1fr_60px_108px_76px_26px_26px_28px] gap-1.5 items-center">
          <div className="relative">
            <input
              data-field="name"
              type="text"
              placeholder="Item name…"
              value={item.itemName}
              onChange={e => { updateItem(idx, 'itemName', e.target.value); if (activePickerIdx !== idx) { setActivePickerIdx(idx); setPickerSearch(e.target.value); } else { setPickerSearch(e.target.value); } }}
              onFocus={() => { setActivePickerIdx(idx); setPickerSearch(item.itemName); }}
              onBlur={() => setTimeout(() => setActivePickerIdx(null), 150)}
              onKeyDown={e => handleNameKeyDown(e, idx)}
              className={`w-full h-10 px-2.5 bg-background border rounded-lg text-xs text-foreground focus:outline-none ${isDup ? 'border-amber-500/60' : item.linked_recipe_id ? 'border-primary/50' : 'border-border focus:border-primary'}`}
              autoComplete="off"
            />
            {isDup && <span className="absolute right-1.5 top-1 text-[9px] text-amber-400 font-bold">DUP</span>}
            {activePickerIdx === idx && recipes.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-0.5 max-h-36 overflow-y-auto rounded-lg border border-border/60 bg-card shadow-lg">
                {filteredRecipes.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onMouseDown={() => { updateItem(idx, 'itemName', r.name); updateItem(idx, 'linked_recipe_id', r.id); setActivePickerIdx(null); setTimeout(() => rowRefs.current[idx]?.querySelector('[data-field="qty"]')?.focus(), 30); }}
                    className="w-full px-2.5 py-2 text-left text-xs hover:bg-muted/60 border-b border-border/20 last:border-0 flex items-center justify-between gap-1"
                  >
                    <span className="font-semibold text-foreground truncate">📖 {r.name}</span>
                    <span className="text-[9px] text-muted-foreground shrink-0 capitalize">{r.category || ''}</span>
                  </button>
                ))}
                {filteredRecipes.length === 0 && pickerSearch.length >= 2 && (
                  <p className="px-2.5 py-2 text-xs text-muted-foreground">No matching recipes</p>
                )}
              </div>
            )}
          </div>
          <input
            data-field="qty"
            type="number"
            min="0"
            step="0.5"
            value={item.quantity}
            onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || '')}
            onKeyDown={e => handleEnter(e, idx)}
            className="w-full h-10 px-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none text-center"
          />
          <select
            data-field="unit"
            value={item.unit || 'lbs'}
            onChange={e => updateItem(idx, 'unit', e.target.value)}
            onKeyDown={e => handleEnter(e, idx)}
            className="w-full h-10 px-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none"
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select
            data-field="priority"
            value={item.priority || 'medium'}
            onChange={e => updateItem(idx, 'priority', e.target.value)}
            onKeyDown={e => handleEnter(e, idx)}
            className="w-full h-10 px-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Med</option>
            <option value="low">🔵 Low</option>
          </select>
          <button
            onClick={() => updateItem(idx, 'photoRequired', !item.photoRequired)}
            tabIndex={-1}
            title="Require completion photo"
            className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${item.photoRequired ? 'text-primary bg-primary/15' : 'text-muted-foreground/30 hover:text-muted-foreground'}`}
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => updateItem(idx, 'chefApprovalRequired', !item.chefApprovalRequired)}
            tabIndex={-1}
            title="Require chef approval"
            className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${item.chefApprovalRequired ? 'text-emerald-400 bg-emerald-500/15' : 'text-muted-foreground/30 hover:text-muted-foreground'}`}
          >
            <ChefHat className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => removeRow(idx)} tabIndex={-1} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        );
      })}
      <button onClick={() => addRow(items.length - 1)} className="w-full h-10 mt-1 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Add item <span className="text-[10px] opacity-60">(or press Enter on any row)</span>
      </button>
    </div>
  );
}

function TemplateForm({ template, onSave, onCancel }) {
  const [name, setName] = useState(template?.name || '');
  const [station, setStation] = useState(template?.station || '');
  const [jobCode, setJobCode] = useState(template?.jobCode || '');
  const [shift, setShift] = useState(template?.shift || 'all');
  const [repeatDays, setRepeatDays] = useState(template?.repeatDays || [1, 2, 3, 4, 5]);
  const [repeatType, setRepeatType] = useState(template?.repeatType || 'weekly');
  const [requiresPhoto, setRequiresPhoto] = useState(template?.requiresPhoto || false);
  const [requiresManagerReview, setRequiresManagerReview] = useState(template?.requiresManagerReview || false);
  const [notes, setNotes] = useState(template?.notes || '');
  const [items, setItems] = useState([BLANK_ITEM()]);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    if (template?.id) {
      base44.entities.PrepTemplateItem.filter({ prepTemplateId: template.id }).then(loaded => {
        setItems(loaded.length > 0 ? loaded : [BLANK_ITEM()]);
      });
    }
    base44.entities.Recipe.list('name', 200).catch(() => []).then(r => setRecipes(r.filter(x => x.status !== 'archived')));
  }, [template?.id]);

  const toggleDay = (day) => {
    setRepeatDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b));
  };



  const handleSave = async () => {
    if (!name || !station || !jobCode) {
      toast.error('Please fill in template name, station, and job code');
      return;
    }

    try {
      let templateId = template?.id;
      if (!templateId) {
        const newTemplate = await base44.entities.PrepTemplate.create({
          name,
          station,
          jobCode,
          shift,
          repeatDays,
          repeatType,
          requiresPhoto,
          requiresManagerReview,
          notes,
          itemCount: items.length,
          isActive: true
        });
        templateId = newTemplate.id;
      } else {
        await base44.entities.PrepTemplate.update(templateId, {
          name,
          station,
          jobCode,
          shift,
          repeatDays,
          repeatType,
          requiresPhoto,
          requiresManagerReview,
          notes,
          itemCount: items.length
        });
      }

      // Save items
      const names = items.filter(i => i.itemName.trim()).map(i => i.itemName.trim().toLowerCase());
      const hasDups = names.some((n, i) => names.indexOf(n) !== i);
      if (hasDups) { toast.error('Duplicate item names found. Please fix before saving.'); return; }
      for (const item of items) {
        if (item.id) {
          await base44.entities.PrepTemplateItem.update(item.id, { ...item, prepTemplateId: templateId });
        } else if (item.itemName) {
          await base44.entities.PrepTemplateItem.create({ ...item, prepTemplateId: templateId });
        }
      }

      onSave();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    }
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="card-glass border border-border rounded-lg p-4 space-y-4">
      <input
        type="text"
        placeholder="Template Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Station"
          value={station}
          onChange={(e) => setStation(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
        />
        <input
          type="text"
          placeholder="Job Code"
          value={jobCode}
          onChange={(e) => setJobCode(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select value={shift} onChange={(e) => setShift(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
          <option value="all">All Shifts</option>
          <option value="opening">Opening</option>
          <option value="mid">Mid</option>
          <option value="closing">Closing</option>
        </select>
        <select value={repeatType} onChange={(e) => setRepeatType(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
          <option value="once">One Time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      {repeatType === 'weekly' && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-secondary-text">Repeat on:</p>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => toggleDay(idx)}
                className={`text-[10px] font-bold py-1.5 rounded-md transition-all ${
                  repeatDays.includes(idx) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-secondary-text">
          <input type="checkbox" checked={requiresPhoto} onChange={(e) => setRequiresPhoto(e.target.checked)} className="mr-2" />
          Requires Photo
        </label>
        <label className="text-xs font-bold text-secondary-text">
          <input type="checkbox" checked={requiresManagerReview} onChange={(e) => setRequiresManagerReview(e.target.checked)} className="mr-2" />
          Requires Manager Review
        </label>
      </div>

      <textarea
        placeholder="Notes / Instructions"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
        rows={3}
      />

      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-secondary-text">Items ({items.filter(i => i.itemName).length})</p>
          <span className="text-[10px] text-muted-foreground">Tab between fields · Enter for new row</span>
        </div>
        <BulkItemEntry items={items} onChange={setItems} recipes={recipes} />
      </div>

      <div className="flex gap-2 pt-4">
        <button onClick={handleSave} className="flex-1 btn-primary text-sm h-10 flex items-center justify-center gap-2">
          <Save className="h-4 w-4" />
          Save Template
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm h-10 flex items-center justify-center gap-2">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PrepTemplatesManager() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.PrepTemplate.list('-updated_date', 100);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
    setLoading(false);
  };

  const filtered = templates.filter(t => {
    if (showArchived && t.isActive) return false;
    if (!showArchived && !t.isActive) return false;
    return t.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = (id) => {
    const template = templates.find(t => t.id === id);
    setEditingTemplate(template);
  };

  const handleDuplicate = async (id) => {
    haptics.light();
    const template = templates.find(t => t.id === id);
    if (!template) return;

    const { id: _, ...templateData } = template;
    const newTemplate = await base44.entities.PrepTemplate.create({
      ...templateData,
      name: `${template.name} (Copy)`,
    });

    const items = await base44.entities.PrepTemplateItem.filter({ prepTemplateId: id });
    for (const item of items) {
      const { id: __, ...itemData } = item;
      await base44.entities.PrepTemplateItem.create({
        ...itemData,
        prepTemplateId: newTemplate.id,
      });
    }

    loadTemplates();
  };

  const handleArchive = async (id) => {
    haptics.light();
    const template = templates.find(t => t.id === id);
    await base44.entities.PrepTemplate.update(id, { isActive: !template.isActive });
    loadTemplates();
  };

  return (
    <div className="app-screen">
      <DesktopPageHeader
        title="Prep Templates"
        subtitle="Create reusable prep list templates"
        actions={
          <button onClick={() => setIsCreating(true)} className="btn-primary text-xs h-10 px-3 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Template
          </button>
        }
      />
      <div className="lg:hidden bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="btn-secondary text-xs h-10 px-2">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Prep Templates</h1>
        </div>

        {!editingTemplate && !isCreating && (
          <>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowArchived(false)} className={`text-xs font-bold px-3 py-2 rounded-lg ${!showArchived ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                Active
              </button>
              <button onClick={() => setShowArchived(true)} className={`text-xs font-bold px-3 py-2 rounded-lg ${showArchived ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                Archived
              </button>
              <button
                onClick={() => {
                  haptics.light();
                  const headers = ['itemName','quantity','unit','priority','jobCode','notes'];
                  const rows = [
                    ['Chop Onions','10','lbs','high','Prep Cook','Dice small'],
                    ['Portion Chicken','20','portions','medium','Line Cook','6oz each'],
                    ['Make Soup Base','2','batches','low','Cook','See recipe card'],
                  ];
                  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'prep_items_import_template.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs font-bold px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Template
              </button>
              <button
                onClick={() => { haptics.light(); setShowImport(true); }}
                className="text-xs font-bold px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1"
              >
                <Upload className="h-3 w-3" />
                Import
              </button>
            </div>
          </>
        )}
      </div>

      <div className="app-page">
        {loading ? (
          <div className="text-center py-8 text-secondary-text">Loading...</div>
        ) : filtered.length === 0 ? (
          templates.length === 0 ? (
            <div className="flex flex-col items-center text-center py-16 px-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <ChefHat className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-[18px] font-black text-foreground mb-2">No prep templates yet</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-7 max-w-[280px]">
                Templates define what each station preps each shift — item, quantity, unit, and who's responsible. Create one to start generating daily prep tasks.
              </p>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-black text-white active:scale-[0.97] transition-all"
                  style={{
                    background: 'linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)',
                    boxShadow: '0 0 0 1px rgba(230,106,31,0.35), 0 0 16px rgba(230,106,31,0.15)',
                  }}
                >
                  <Plus className="h-4 w-4" /> Create Template
                </button>
                <button
                  onClick={() => setShowImport(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-semibold text-foreground active:scale-[0.97] transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'transparent' }}
                >
                  <Upload className="h-4 w-4" /> Import from CSV
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-secondary-text text-sm">No templates match</div>
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setIsCreating(true)}
        className="lg:hidden fixed bottom-20 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
      >
        <Plus className="h-5 w-5" />
      </button>

      {(editingTemplate || isCreating) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="bg-card border-b border-border p-4 flex items-center justify-between sticky top-0">
              <h2 className="font-bold text-foreground">{editingTemplate ? 'Edit Template' : 'Create Prep Template'}</h2>
              <button onClick={() => { setEditingTemplate(null); setIsCreating(false); }} className="text-secondary-text hover:text-foreground">✕</button>
            </div>
            <div className="p-4">
              <TemplateForm
                template={editingTemplate}
                onSave={() => { setEditingTemplate(null); setIsCreating(false); loadTemplates(); }}
                onCancel={() => { setEditingTemplate(null); setIsCreating(false); }}
              />
            </div>
          </div>
        </div>
      )}

      <PrepListImportFlow
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportComplete={() => { loadTemplates(); setShowImport(false); }}
      />
    </div>
  );
}

export const hideBase44Index = true;