import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus } from 'lucide-react';
import { haptics } from '@/utils/haptics';

function BulkTaskEntry({ items, onChange }) {
  const rowRefs = useRef([]);

  const update = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const addRow = useCallback((afterIdx) => {
    const updated = [
      ...items.slice(0, afterIdx + 1),
      { taskName: '', priority: 'medium', shiftPhase: 'anytime', dueTime: '' },
      ...items.slice(afterIdx + 1),
    ];
    onChange(updated);
    setTimeout(() => {
      rowRefs.current[afterIdx + 1]?.querySelector('[data-field="name"]')?.focus();
    }, 30);
  }, [items, onChange]);

  const removeRow = (idx) => {
    if (items.length === 1) { onChange([{ taskName: '', priority: 'medium', shiftPhase: 'anytime', dueTime: '' }]); return; }
    onChange(items.filter((_, i) => i !== idx));
    setTimeout(() => {
      rowRefs.current[Math.max(0, idx - 1)]?.querySelector('[data-field="name"]')?.focus();
    }, 30);
  };

  return (
    <div className="border-t border-border pt-4 space-y-0.5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-secondary-text">Tasks ({items.filter(i => i.taskName).length})</p>
        <span className="text-[10px] text-muted-foreground">Tab between fields · Enter for new row</span>
      </div>
      <div className="grid grid-cols-[1fr_80px_76px_28px] gap-1.5 px-1 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Task Name</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Due Time</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Priority</span>
        <span />
      </div>
      {items.map((item, idx) => (
        <div key={idx} ref={el => rowRefs.current[idx] = el} className="grid grid-cols-[1fr_80px_76px_28px] gap-1.5 items-center">
          <input
            data-field="name"
            type="text"
            placeholder="Task name…"
            value={item.taskName}
            onChange={e => update(idx, 'taskName', e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addRow(idx); }
              if (e.key === 'Backspace' && item.taskName === '' && items.length > 1) { e.preventDefault(); removeRow(idx); }
            }}
            className="w-full h-8 px-2.5 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none"
            autoComplete="off"
          />
          <input
            type="time"
            value={item.dueTime || ''}
            onChange={e => update(idx, 'dueTime', e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRow(idx); } }}
            className="w-full h-8 px-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none"
          />
          <select
            value={item.priority || 'medium'}
            onChange={e => update(idx, 'priority', e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRow(idx); } }}
            className="w-full h-8 px-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Med</option>
            <option value="low">🔵 Low</option>
          </select>
          <button onClick={() => removeRow(idx)} tabIndex={-1} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button onClick={() => addRow(items.length - 1)} className="w-full h-8 mt-1 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Add task <span className="text-[10px] opacity-60">(or press Enter on any row)</span>
      </button>
    </div>
  );
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHIFTS = [
  { value: 'opening', label: 'Opening' },
  { value: 'mid', label: 'Mid' },
  { value: 'closing', label: 'Closing' },
  { value: 'all', label: 'All Shifts' }
];
const SHIFT_PHASES = [
  { value: 'start', label: 'Start of Shift' },
  { value: 'mid', label: 'Mid Shift' },
  { value: 'end', label: 'End of Shift' },
  { value: 'anytime', label: 'Anytime' }
];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function SideWorkTemplateForm({ template, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    department: 'FOH',
    station: '',
    jobCode: '',
    shift: 'all',
    repeatType: 'weekly',
    repeatDays: [1, 2, 3, 4, 5],
    isActive: true,
    requiresPhoto: false,
    requiresManagerReview: false,
    notes: ''
  });

  const [items, setItems] = useState([{ taskName: '', priority: 'medium', shiftPhase: 'anytime', dueTime: '' }]);
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState([]);
  const [jobCodes, setJobCodes] = useState([]);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        department: template.department,
        station: template.station,
        jobCode: template.jobCode,
        shift: template.shift,
        repeatType: template.repeatType,
        repeatDays: template.repeatDays || [],
        isActive: template.isActive,
        requiresPhoto: template.requiresPhoto,
        requiresManagerReview: template.requiresManagerReview,
        notes: template.notes || ''
      });
      loadItems(template.id);
    }
    loadStationsAndCodes();
  }, [template]);

  const BLANK_ITEM = () => ({ taskName: '', priority: 'medium', shiftPhase: 'anytime', dueTime: '' });

  const loadItems = async (templateId) => {
    try {
      const data = await base44.entities.SideWorkTemplateItem.filter({
        sideWorkTemplateId: templateId
      });
      setItems(data.length > 0 ? data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) : [BLANK_ITEM()]);
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  const loadStationsAndCodes = async () => {
    try {
      const [stationData, codeData] = await Promise.all([
        base44.entities.Station.list('-updated_date', 100).catch(() => []),
        base44.entities.JobCode.list('-updated_date', 100).catch(() => [])
      ]);
      setStations(stationData.filter(s => s.isActive));
      setJobCodes(codeData.filter(j => j.isActive));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };



  const handleSaveTemplate = async () => {
    if (!formData.name.trim() || !formData.station || !formData.jobCode) {
      alert('Please fill in all required fields');
      return;
    }

    const validItems = items.filter(i => i.taskName?.trim());
    if (validItems.length === 0) {
      alert('Please add at least one side work item');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        itemCount: validItems.length
      };

      if (template) {
        // Update existing
        await base44.entities.SideWorkTemplate.update(template.id, payload);
        
        // Delete old items and add new ones
        const oldItems = await base44.entities.SideWorkTemplateItem.filter({
          sideWorkTemplateId: template.id
        });
        for (const item of oldItems) {
          if (item.id) {
            await base44.entities.SideWorkTemplateItem.delete(item.id);
          }
        }
        
        for (let i = 0; i < validItems.length; i++) {
          await base44.entities.SideWorkTemplateItem.create({
            sideWorkTemplateId: template.id,
            ...validItems[i],
            sortOrder: i
          });
        }
      } else {
        const created = await base44.entities.SideWorkTemplate.create(payload);
        for (let i = 0; i < validItems.length; i++) {
          await base44.entities.SideWorkTemplateItem.create({
            sideWorkTemplateId: created.id,
            ...validItems[i],
            sortOrder: i
          });
        }
      }

      haptics.success();
      onSave?.();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Template Details */}
      <div className="space-y-3 bg-muted/30 rounded-lg p-3">
        <input
          type="text"
          placeholder="Template name (e.g. Closing Server Side Work)"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
        />

        <select
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
        >
          <option value="FOH">Front of House</option>
          <option value="BOH">Back of House</option>
        </select>

        <select
          value={formData.station}
          onChange={(e) => setFormData({ ...formData, station: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
        >
          <option value="">Select Station</option>
          {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>

        <select
          value={formData.jobCode}
          onChange={(e) => setFormData({ ...formData, jobCode: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
        >
          <option value="">Select Job Code</option>
          {jobCodes.map(j => <option key={j.id} value={j.name}>{j.name}</option>)}
        </select>

        <select
          value={formData.shift}
          onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
        >
          {SHIFTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <div>
          <label className="text-xs font-bold text-secondary-text mb-2 block">Days of Week</label>
          <div className="grid grid-cols-4 gap-1">
            {DAYS.map((day, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const newDays = formData.repeatDays.includes(idx)
                    ? formData.repeatDays.filter(d => d !== idx)
                    : [...formData.repeatDays, idx];
                  setFormData({ ...formData, repeatDays: newDays });
                }}
                className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                  formData.repeatDays.includes(idx)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-secondary-text'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <label className="flex items-center gap-2 flex-1 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requiresPhoto}
              onChange={(e) => setFormData({ ...formData, requiresPhoto: e.target.checked })}
              className="rounded"
            />
            <span className="text-xs font-bold text-foreground">Photo required</span>
          </label>
          <label className="flex items-center gap-2 flex-1 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requiresManagerReview}
              onChange={(e) => setFormData({ ...formData, requiresManagerReview: e.target.checked })}
              className="rounded"
            />
            <span className="text-xs font-bold text-foreground">Manager review</span>
          </label>
        </div>

        <textarea
          placeholder="Notes / Instructions"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
          rows="2"
        />
      </div>

      {/* Items Section — spreadsheet style */}
      <BulkTaskEntry items={items} onChange={setItems} />

      {/* Save Button */}
      <button
        onClick={handleSaveTemplate}
        disabled={loading}
        className="w-full btn-primary py-3 font-bold rounded-lg"
      >
        {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
      </button>
    </div>
  );
}