import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus, GripVertical } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHIFTS = [
  { value: 'opening', label: 'Opening' },
  { value: 'mid', label: 'Mid' },
  { value: 'closing', label: 'Closing' },
  { value: 'all', label: 'All Shifts' }
];
const FREQUENCIES = [
  { value: 'every-shift', label: 'Every Shift' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'custom', label: 'Custom' }
];
const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];
const SHIFT_PHASES = [
  { value: 'start', label: 'Start of Shift' },
  { value: 'mid', label: 'Mid Shift' },
  { value: 'end', label: 'End of Shift' },
  { value: 'anytime', label: 'Anytime' }
];

export default function CleaningTemplateForm({ template, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    department: 'BOH',
    area: '',
    station: '',
    jobCode: '',
    shift: 'all',
    repeatType: 'weekly',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    frequency: 'daily',
    isActive: true,
    requiresPhoto: false,
    requiresManagerReview: false,
    notes: ''
  });

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    taskName: '',
    description: '',
    area: '',
    station: '',
    jobCode: '',
    dueTime: '',
    shiftPhase: 'anytime',
    frequency: 'daily',
    priority: 'normal',
    suppliesNeeded: '',
    safetyNotes: '',
    instructions: '',
    requiresPhoto: false,
    requiresManagerReview: false
  });
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState([]);
  const [jobCodes, setJobCodes] = useState([]);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        department: template.department,
        area: template.area,
        station: template.station,
        jobCode: template.jobCode,
        shift: template.shift,
        repeatType: template.repeatType,
        repeatDays: template.repeatDays || [],
        frequency: template.frequency,
        isActive: template.isActive,
        requiresPhoto: template.requiresPhoto,
        requiresManagerReview: template.requiresManagerReview,
        notes: template.notes || ''
      });
      loadItems(template.id);
    }
    loadStationsAndCodes();
  }, [template]);

  const loadItems = async (templateId) => {
    try {
      const data = await base44.entities.CleaningTemplateItem.filter({
        cleaningTemplateId: templateId
      });
      setItems(data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
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

  const handleAddItem = () => {
    if (!newItem.taskName.trim()) return;
    
    setItems([
      ...items,
      {
        ...newItem,
        sortOrder: items.length
      }
    ]);
    setNewItem({
      taskName: '',
      description: '',
      area: '',
      station: '',
      jobCode: '',
      dueTime: '',
      shiftPhase: 'anytime',
      frequency: 'daily',
      priority: 'normal',
      suppliesNeeded: '',
      safetyNotes: '',
      instructions: '',
      requiresPhoto: false,
      requiresManagerReview: false
    });
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim() || !formData.area || !formData.station || !formData.jobCode) {
      alert('Please fill in all required fields');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one cleaning task item');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        itemCount: items.length
      };

      if (template) {
        await base44.entities.CleaningTemplate.update(template.id, payload);
        
        const oldItems = await base44.entities.CleaningTemplateItem.filter({
          cleaningTemplateId: template.id
        });
        for (const item of oldItems) {
          if (item.id) {
            await base44.entities.CleaningTemplateItem.delete(item.id);
          }
        }
        
        for (let i = 0; i < items.length; i++) {
          await base44.entities.CleaningTemplateItem.create({
            cleaningTemplateId: template.id,
            ...items[i],
            sortOrder: i
          });
        }
      } else {
        const created = await base44.entities.CleaningTemplate.create(payload);
        
        for (let i = 0; i < items.length; i++) {
          await base44.entities.CleaningTemplateItem.create({
            cleaningTemplateId: created.id,
            ...items[i],
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
      <div className="space-y-3 bg-muted/30 rounded-lg p-3">
        <input
          type="text"
          placeholder="Template name (e.g. Closing Line Cleaning)"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
        />

        <select
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
        >
          <option value="FOH">Front of House</option>
          <option value="BOH">Back of House</option>
        </select>

        <input
          type="text"
          placeholder="Area (e.g. Cook Line)"
          value={formData.area}
          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
        />

        <select
          value={formData.station}
          onChange={(e) => setFormData({ ...formData, station: e.target.value })}
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
        >
          <option value="">Select Station</option>
          {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>

        <select
          value={formData.jobCode}
          onChange={(e) => setFormData({ ...formData, jobCode: e.target.value })}
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
        >
          <option value="">Select Job Code</option>
          {jobCodes.map(j => <option key={j.id} value={j.name}>{j.name}</option>)}
        </select>

        <select
          value={formData.shift}
          onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
        >
          {SHIFTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
        >
          {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
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
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
          rows="2"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary-text">Cleaning Task Items</h3>
        
        {items.map((item, idx) => (
          <div key={idx} className="bg-muted/30 rounded-lg p-2 flex gap-2 items-start">
            <GripVertical className="h-4 w-4 text-secondary-text mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0 text-xs space-y-1">
              <p className="font-bold text-foreground truncate">{item.taskName}</p>
              {item.description && <p className="text-muted-foreground text-[9px]">{item.description}</p>}
              {item.dueTime && <p className="text-muted-foreground text-[9px]">Due: {item.dueTime}</p>}
              <div className="flex gap-1 flex-wrap">
                {item.priority === 'critical' && <span className="px-1 py-0.5 bg-red-500/20 text-red-300 rounded text-[9px] font-bold">Critical</span>}
                {item.priority === 'high' && <span className="px-1 py-0.5 bg-orange-500/20 text-orange-300 rounded text-[9px] font-bold">High</span>}
                {item.requiresPhoto && <span className="px-1 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[9px] font-bold">Photo</span>}
              </div>
            </div>
            <button
              onClick={() => handleRemoveItem(idx)}
              className="text-red-400 hover:text-red-300 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <input
            type="text"
            placeholder="Task name (e.g. Degrease flat top)"
            value={newItem.taskName}
            onChange={(e) => setNewItem({ ...newItem, taskName: e.target.value })}
            className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
          />

          <textarea
            placeholder="Description (optional)"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
            rows="1"
          />

          <input
            type="time"
            value={newItem.dueTime}
            onChange={(e) => setNewItem({ ...newItem, dueTime: e.target.value })}
            className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={newItem.priority}
              onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}
              className="px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
            >
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>

            <select
              value={newItem.frequency}
              onChange={(e) => setNewItem({ ...newItem, frequency: e.target.value })}
              className="px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
            >
              {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <textarea
            placeholder="Supplies needed (optional)"
            value={newItem.suppliesNeeded}
            onChange={(e) => setNewItem({ ...newItem, suppliesNeeded: e.target.value })}
            className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
            rows="1"
          />

          <textarea
            placeholder="Safety notes (optional)"
            value={newItem.safetyNotes}
            onChange={(e) => setNewItem({ ...newItem, safetyNotes: e.target.value })}
            className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
            rows="1"
          />

          <textarea
            placeholder="Instructions (optional)"
            value={newItem.instructions}
            onChange={(e) => setNewItem({ ...newItem, instructions: e.target.value })}
            className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
            rows="1"
          />

          <div className="flex gap-2">
            <label className="flex items-center gap-1 flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={newItem.requiresPhoto}
                onChange={(e) => setNewItem({ ...newItem, requiresPhoto: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs font-bold text-foreground">Photo</span>
            </label>
            <label className="flex items-center gap-1 flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={newItem.requiresManagerReview}
                onChange={(e) => setNewItem({ ...newItem, requiresManagerReview: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs font-bold text-foreground">Manager review</span>
            </label>
          </div>

          <button
            onClick={handleAddItem}
            className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1 h-8"
          >
            <Plus className="h-3 w-3" />
            Add Task Item
          </button>
        </div>
      </div>

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