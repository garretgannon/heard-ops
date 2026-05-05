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
const CATEGORIES = [
  { value: 'walk-in-cooler', label: 'Walk-in Cooler' },
  { value: 'walk-in-freezer', label: 'Walk-in Freezer' },
  { value: 'reach-in-cooler', label: 'Reach-in Cooler' },
  { value: 'reach-in-freezer', label: 'Reach-in Freezer' },
  { value: 'prep-table', label: 'Prep Table' },
  { value: 'hot-holding', label: 'Hot Holding' },
  { value: 'cold-holding', label: 'Cold Holding' },
  { value: 'cook-temperature', label: 'Cook Temperature' },
  { value: 'reheat-temperature', label: 'Reheat Temperature' },
  { value: 'cooling-log', label: 'Cooling Log' },
  { value: 'dishwasher', label: 'Dishwasher' },
  { value: 'bar-cooler', label: 'Bar Cooler' },
  { value: 'other', label: 'Other' }
];
const FREQUENCIES = [
  { value: 'once-per-shift', label: 'Once per Shift' },
  { value: 'twice-per-shift', label: 'Twice per Shift' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'every-2-hours', label: 'Every 2 Hours' },
  { value: 'every-4-hours', label: 'Every 4 Hours' },
  { value: 'custom', label: 'Custom' }
];

export default function TemperatureLogTemplateForm({ template, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    station: '',
    jobCode: '',
    shift: 'all',
    repeatType: 'weekly',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    isActive: true,
    requiresPhoto: false,
    requiresManagerReview: false,
    requiresCorrectiveAction: true,
    notes: ''
  });

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    checkName: '',
    equipmentName: '',
    category: 'walk-in-cooler',
    targetMin: '',
    targetMax: '',
    unit: 'F',
    station: '',
    jobCode: '',
    dueTime: '',
    shiftPhase: 'anytime',
    frequency: 'once-per-shift',
    instructions: '',
    correctiveActionInstructions: '',
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
        area: template.area,
        station: template.station,
        jobCode: template.jobCode,
        shift: template.shift,
        repeatType: template.repeatType,
        repeatDays: template.repeatDays || [],
        isActive: template.isActive,
        requiresPhoto: template.requiresPhoto,
        requiresManagerReview: template.requiresManagerReview,
        requiresCorrectiveAction: template.requiresCorrectiveAction,
        notes: template.notes || ''
      });
      loadItems(template.id);
    }
    loadStationsAndCodes();
  }, [template]);

  const loadItems = async (templateId) => {
    try {
      const data = await base44.entities.TemperatureLogTemplateItem.filter({
        temperatureLogTemplateId: templateId
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
    if (!newItem.checkName.trim() || !newItem.equipmentName.trim()) return;
    
    setItems([
      ...items,
      {
        ...newItem,
        sortOrder: items.length
      }
    ]);
    setNewItem({
      checkName: '',
      equipmentName: '',
      category: 'walk-in-cooler',
      targetMin: '',
      targetMax: '',
      unit: 'F',
      station: '',
      jobCode: '',
      dueTime: '',
      shiftPhase: 'anytime',
      frequency: 'once-per-shift',
      instructions: '',
      correctiveActionInstructions: '',
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
      alert('Please add at least one temperature check item');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        itemCount: items.length
      };

      if (template) {
        await base44.entities.TemperatureLogTemplate.update(template.id, payload);
        
        const oldItems = await base44.entities.TemperatureLogTemplateItem.filter({
          temperatureLogTemplateId: template.id
        });
        for (const item of oldItems) {
          if (item.id) {
            await base44.entities.TemperatureLogTemplateItem.delete(item.id);
          }
        }
        
        for (let i = 0; i < items.length; i++) {
          await base44.entities.TemperatureLogTemplateItem.create({
            temperatureLogTemplateId: template.id,
            ...items[i],
            sortOrder: i
          });
        }
      } else {
        const created = await base44.entities.TemperatureLogTemplate.create(payload);
        
        for (let i = 0; i < items.length; i++) {
          await base44.entities.TemperatureLogTemplateItem.create({
            temperatureLogTemplateId: created.id,
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
          placeholder="Template name (e.g. AM Kitchen Temperature Checks)"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
        />

        <input
          type="text"
          placeholder="Area (e.g. Kitchen)"
          value={formData.area}
          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
        />

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
          <label className="flex items-center gap-2 flex-1 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requiresCorrectiveAction}
              onChange={(e) => setFormData({ ...formData, requiresCorrectiveAction: e.target.checked })}
              className="rounded"
            />
            <span className="text-xs font-bold text-foreground">Corrective action</span>
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

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary-text">Temperature Check Items</h3>
        
        {items.map((item, idx) => (
          <div key={idx} className="bg-muted/30 rounded-lg p-2 flex gap-2 items-start">
            <GripVertical className="h-4 w-4 text-secondary-text mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0 text-xs space-y-1">
              <p className="font-bold text-foreground truncate">{item.checkName}</p>
              <p className="text-muted-foreground text-[9px]">{item.equipmentName}</p>
              {item.targetMin || item.targetMax ? (
                <p className="text-muted-foreground text-[9px]">
                  {item.targetMin || '−'}°{item.unit} to {item.targetMax || '∞'}°{item.unit}
                </p>
              ) : null}
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

        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <input
            type="text"
            placeholder="Check name (e.g. Walk-in cooler)"
            value={newItem.checkName}
            onChange={(e) => setNewItem({ ...newItem, checkName: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
          />

          <input
            type="text"
            placeholder="Equipment name (e.g. Unit #1)"
            value={newItem.equipmentName}
            onChange={(e) => setNewItem({ ...newItem, equipmentName: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
          />

          <select
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-bold text-secondary-text">Min (°F/C)</label>
              <input
                type="number"
                placeholder="Min"
                value={newItem.targetMin}
                onChange={(e) => setNewItem({ ...newItem, targetMin: e.target.value ? parseFloat(e.target.value) : '' })}
                className="w-full px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-secondary-text">Max (°F/C)</label>
              <input
                type="number"
                placeholder="Max"
                value={newItem.targetMax}
                onChange={(e) => setNewItem({ ...newItem, targetMax: e.target.value ? parseFloat(e.target.value) : '' })}
                className="w-full px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-secondary-text">Unit</label>
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="w-full px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground"
              >
                <option value="F">Fahrenheit</option>
                <option value="C">Celsius</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={newItem.dueTime}
              onChange={(e) => setNewItem({ ...newItem, dueTime: e.target.value })}
              className="px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground"
            />

            <select
              value={newItem.frequency}
              onChange={(e) => setNewItem({ ...newItem, frequency: e.target.value })}
              className="px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground"
            >
              {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <textarea
            placeholder="Instructions (optional)"
            value={newItem.instructions}
            onChange={(e) => setNewItem({ ...newItem, instructions: e.target.value })}
            className="w-full px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground"
            rows="1"
          />

          <textarea
            placeholder="Corrective action instructions (optional)"
            value={newItem.correctiveActionInstructions}
            onChange={(e) => setNewItem({ ...newItem, correctiveActionInstructions: e.target.value })}
            className="w-full px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground"
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
            Add Check Item
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