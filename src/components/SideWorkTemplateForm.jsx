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

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    taskName: '',
    description: '',
    dueTime: '',
    shiftPhase: 'anytime',
    priority: 'medium',
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

  const loadItems = async (templateId) => {
    try {
      const data = await base44.entities.SideWorkTemplateItem.filter({
        sideWorkTemplateId: templateId
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
      dueTime: '',
      shiftPhase: 'anytime',
      priority: 'medium',
      requiresPhoto: false,
      requiresManagerReview: false
    });
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim() || !formData.station || !formData.jobCode) {
      alert('Please fill in all required fields');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one side work item');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        itemCount: items.length
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
        
        for (let i = 0; i < items.length; i++) {
          await base44.entities.SideWorkTemplateItem.create({
            sideWorkTemplateId: template.id,
            ...items[i],
            sortOrder: i
          });
        }
      } else {
        // Create new
        const created = await base44.entities.SideWorkTemplate.create(payload);
        
        for (let i = 0; i < items.length; i++) {
          await base44.entities.SideWorkTemplateItem.create({
            sideWorkTemplateId: created.id,
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

      {/* Items Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary-text">Side Work Items</h3>
        
        {items.map((item, idx) => (
          <div key={idx} className="bg-muted/30 rounded-lg p-2 flex gap-2 items-start">
            <GripVertical className="h-4 w-4 text-secondary-text mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0 text-xs space-y-1">
              <p className="font-bold text-foreground truncate">{item.taskName}</p>
              {item.dueTime && <p className="text-muted-foreground">Due: {item.dueTime}</p>}
              {item.requiresPhoto && <span className="inline-block px-1 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[9px] font-bold">Photo</span>}
            </div>
            <button
              onClick={() => handleRemoveItem(idx)}
              className="text-red-400 hover:text-red-300 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Add New Item */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <input
            type="text"
            placeholder="Task name (e.g. Roll silverware)"
            value={newItem.taskName}
            onChange={(e) => setNewItem({ ...newItem, taskName: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
          />

          <textarea
            placeholder="Description (optional)"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
            rows="2"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={newItem.dueTime}
              onChange={(e) => setNewItem({ ...newItem, dueTime: e.target.value })}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            />

            <select
              value={newItem.priority}
              onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <label className="flex items-center gap-2 flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={newItem.requiresPhoto}
                onChange={(e) => setNewItem({ ...newItem, requiresPhoto: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs font-bold text-foreground">Photo</span>
            </label>
            <label className="flex items-center gap-2 flex-1 cursor-pointer">
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
            Add Item
          </button>
        </div>
      </div>

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