import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function TemperatureLogForm({ onSave, loading }) {
  const [form, setForm] = useState({ location: '', temperature: '', is_above_range: false, is_below_range: false, corrective_action: '' });
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    base44.entities.Equipment.list('-updated_date', 50).then(data => {
      setLocations([...new Set(data.map(e => e.area || e.station).filter(Boolean))]);
    }).catch(() => setLocations([]));
  }, []);

  const handleSave = () => {
    if (!form.location || form.temperature === '') {
      alert('Please fill in location and temperature');
      return;
    }
    base44.entities.TemperatureLog.create({
      location_name: form.location,
      temperature: parseFloat(form.temperature),
      is_above_range: form.is_above_range,
      is_below_range: form.is_below_range,
      corrective_action: form.corrective_action,
      logged_at: new Date().toISOString(),
    }).then(onSave);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Location / Equipment *</label>
        <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="">Select location...</option>
          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Temperature (°F) *</label>
          <input type="number" step="0.1" placeholder="38" value={form.temperature}
            onChange={e => setForm({ ...form, temperature: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div className="flex flex-col gap-2 pt-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_above_range} onChange={e => setForm({ ...form, is_above_range: e.target.checked })} />
            <span className="text-xs font-bold text-foreground">Above range</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_below_range} onChange={e => setForm({ ...form, is_below_range: e.target.checked })} />
            <span className="text-xs font-bold text-foreground">Below range</span>
          </label>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Corrective Action (if needed)</label>
        <textarea placeholder="Describe action taken..." value={form.corrective_action}
          onChange={e => setForm({ ...form, corrective_action: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Temperature Log'}
      </button>
    </div>
  );
}