import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Copy, Archive, Search, ChevronLeft, Save, X, Upload, Download } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import PrepListImportFlow from '@/components/PrepListImportFlow';

function TemplateCard({ template, onEdit, onDuplicate, onArchive }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5 space-y-2.5">
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
        <button onClick={() => onEdit(template.id)} className="flex-1 btn-secondary text-xs h-8">
          <Edit2 className="h-3 w-3 inline mr-1" />
          Edit
        </button>
        <button onClick={() => onDuplicate(template.id)} className="flex-1 btn-secondary text-xs h-8">
          <Copy className="h-3 w-3 inline mr-1" />
          Copy
        </button>
        <button onClick={() => onArchive(template.id)} className="btn-secondary text-xs h-8 px-2">
          <Archive className="h-3 w-3" />
        </button>
      </div>
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
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (template?.id) {
      base44.entities.PrepTemplateItem.filter({ prepTemplateId: template.id }).then(setItems);
    }
  }, [template?.id]);

  const toggleDay = (day) => {
    setRepeatDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b));
  };

  const addItem = () => {
    setItems([...items, { itemName: '', quantity: 1, unit: '', sortOrder: items.length }]);
  };

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;
    setItems(updated);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name || !station || !jobCode) {
      alert('Please fill in template name, station, and job code');
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
      for (const item of items) {
        if (item.id) {
          await base44.entities.PrepTemplateItem.update(item.id, {
            ...item,
            prepTemplateId: templateId
          });
        } else if (item.itemName) {
          await base44.entities.PrepTemplateItem.create({
            ...item,
            prepTemplateId: templateId
          });
        }
      }

      onSave();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
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
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-secondary-text">Items ({items.length})</p>
          <button onClick={addItem} className="text-xs btn-secondary px-2 py-1">
            <Plus className="h-3 w-3 inline mr-1" />
            Add
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="bg-background border border-border rounded-lg p-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.itemName}
                  onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                  className="w-full px-2 py-1 bg-card border border-border rounded text-xs text-foreground"
                />
                <input
                  type="text"
                  placeholder="Due time"
                  value={item.dueTime || ''}
                  onChange={(e) => updateItem(idx, 'dueTime', e.target.value)}
                  className="w-full px-2 py-1 bg-card border border-border rounded text-xs text-foreground"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 bg-card border border-border rounded text-xs text-foreground"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                  className="w-full px-2 py-1 bg-card border border-border rounded text-xs text-foreground"
                />
                <button onClick={() => removeItem(idx)} className="btn-secondary text-xs px-2">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
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
    <div className="pb-24">
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="btn-secondary text-xs h-8 px-2">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Prep Templates</h1>
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
              <button onClick={() => setShowArchived(false)} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${!showArchived ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                Active
              </button>
              <button onClick={() => setShowArchived(true)} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${showArchived ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                Archived
              </button>
              <button
                onClick={() => {
                  haptics.light();
                  const headers = ['itemName','quantity','unit','dueTime','station','jobCode','notes'];
                  const rows = [
                    ['Chop Onions','10','lbs','10:00 AM','Prep','Prep Cook','Dice small'],
                    ['Portion Chicken','20','portions','11:00 AM','Grill','Line Cook','6oz each'],
                    ['Make Soup Base','2','batches','09:00 AM','Hot Line','Cook','See recipe card'],
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
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Template
              </button>
              <button
                onClick={() => { haptics.light(); setShowImport(true); }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1"
              >
                <Upload className="h-3 w-3" />
                Import
              </button>
            </div>
          </>
        )}
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-secondary-text">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-secondary-text text-sm">
            {templates.length === 0 ? 'No templates yet' : 'No templates match'}
          </div>
        ) : (
          filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
            />
          ))
        )}
      </div>

      <button
        onClick={() => setIsCreating(true)}
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
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