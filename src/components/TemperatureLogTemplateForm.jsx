import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { Wind, Snowflake, Flame } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHIFTS = [{ value: 'opening', label: 'Opening' }, { value: 'mid', label: 'Mid' }, { value: 'closing', label: 'Closing' }, { value: 'all', label: 'All Shifts' }];
const FREQUENCIES = [{ value: 'once-per-shift', label: 'Once / Shift' }, { value: 'twice-per-shift', label: 'Twice / Shift' }, { value: 'hourly', label: 'Hourly' }, { value: 'every-2-hours', label: 'Every 2 Hrs' }, { value: 'every-4-hours', label: 'Every 4 Hrs' }];

const CATEGORIES = [
  { value: 'cooling-log', label: 'Cooling Log', icon: Wind, color: 'blue', description: 'Track food cooling from 135°F to 41°F over 6 hours' },
  { value: 'refrigerator-freezer', label: 'Refrigerator / Freezer', icon: Snowflake, color: 'cyan', description: 'Cold storage equipment temperature checks' },
  { value: 'hot-holding', label: 'Hot Holding', icon: Flame, color: 'orange', description: 'Hot food holding checks (min 135°F)' },
];

const defaultForm = {
  name: '', category: '', station: '', jobCode: '', shift: 'all',
  repeatType: 'weekly', repeatDays: [0,1,2,3,4,5,6],
  isActive: true, requiresPhoto: false, requiresManagerReview: false, requiresCorrectiveAction: true, notes: '',
  // cooling-specific
  twoHourTarget: 70, sixHourTarget: 41, foodItem: '',
  // fridge/freezer-specific
  equipmentId: '', equipmentName: '', equipmentType: '', area: '', targetMin: 34, targetMax: 41, frequency: 'once-per-shift',
  // hot holding-specific
  holdingLocation: '', hotTargetMin: 135,
};

export default function TemperatureLogTemplateForm({ template, onSave }) {
  const [form, setForm] = useState(defaultForm);
  const [stations, setStations] = useState([]);
  const [jobCodes, setJobCodes] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);

  const COLD_TYPES = ['walk-in-cooler','walk-in-freezer','reach-in-cooler','reach-in-freezer','prep-table-cooler','lowboy-cooler','beer-cooler','wine-cooler','bar-cooler'];

  useEffect(() => {
    Promise.all([
      base44.entities.Station.list('-updated_date', 100).catch(() => []),
      base44.entities.JobCode.list('-updated_date', 100).catch(() => []),
      base44.entities.Equipment.list('-updated_date', 100).catch(() => []),
    ]).then(([s, j, e]) => {
      setStations(s.filter(x => x.isActive));
      setJobCodes(j.filter(x => x.isActive));
      setEquipment(e.filter(x => COLD_TYPES.includes(x.equipmentType) && x.isActive));
    });
    if (template) {
      setForm({ ...defaultForm, ...template });
    }
  }, [template]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const selectEquipment = (eq) => {
    const isFreeze = eq.equipmentType?.includes('freezer');
    setForm(p => ({ ...p, equipmentId: eq.id, equipmentName: eq.name, equipmentType: eq.equipmentType, area: eq.area || '', station: eq.station || '', targetMin: isFreeze ? -10 : 34, targetMax: isFreeze ? 0 : 41 }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category) { alert('Name and category are required'); return; }
    setLoading(true);
    const payload = { ...form };
    if (template) {
      await base44.entities.TemperatureLogTemplate.update(template.id, payload);
    } else {
      await base44.entities.TemperatureLogTemplate.create(payload);
    }
    haptics.success();
    onSave?.();
    setLoading(false);
  };

  const sel = form.category;

  return (
    <div className="space-y-4 pb-4">
      {/* Category Picker */}
      {!template && (
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Select Category *</label>
          <div className="space-y-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button key={cat.value} onClick={() => set('category', cat.value)}
                  className={`w-full flex items-center gap-3 rounded-xl p-3 border text-left transition-all ${form.category === cat.value ? `border-${cat.color}-500/50 bg-${cat.color}-500/10` : 'border-border bg-card'}`}>
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-${cat.color}-500/15 shrink-0`}>
                    <Icon className={`h-4 w-4 text-${cat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sel && (
        <>
          {/* Name */}
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Template name *" className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" />

          {/* Cooling-specific fields */}
          {sel === 'cooling-log' && (
            <div className="space-y-2 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Cooling Log Settings</p>
              <input value={form.foodItem} onChange={e => set('foodItem', e.target.value)} placeholder="Food item or product group (e.g. Chicken Stock)" className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">2-Hr Target Max (°F)</label>
                  <input type="number" value={form.twoHourTarget} onChange={e => set('twoHourTarget', parseFloat(e.target.value))} className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">6-Hr Target Max (°F)</label>
                  <input type="number" value={form.sixHourTarget} onChange={e => set('sixHourTarget', parseFloat(e.target.value))} className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" />
                </div>
              </div>
            </div>
          )}

          {/* Fridge/Freezer-specific fields */}
          {sel === 'refrigerator-freezer' && (
            <div className="space-y-2 bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Equipment Settings</p>
              {equipment.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Link to Equipment (optional)</label>
                  <select value={form.equipmentId} onChange={e => { const eq = equipment.find(x => x.id === e.target.value); if (eq) selectEquipment(eq); else set('equipmentId', ''); }} className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground">
                    <option value="">Select equipment or enter manually</option>
                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                  </select>
                </div>
              )}
              <input value={form.equipmentName} onChange={e => set('equipmentName', e.target.value)} placeholder="Equipment name" className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Target Min (°F)</label>
                  <input type="number" value={form.targetMin} onChange={e => set('targetMin', parseFloat(e.target.value))} className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Target Max (°F)</label>
                  <input type="number" value={form.targetMax} onChange={e => set('targetMax', parseFloat(e.target.value))} className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" />
                </div>
              </div>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground">
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          )}

          {/* Hot Holding-specific fields */}
          {sel === 'hot-holding' && (
            <div className="space-y-2 bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Hot Holding Settings</p>
              <input value={form.foodItem} onChange={e => set('foodItem', e.target.value)} placeholder="Food item (e.g. Chicken, Soup, Rice)" className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" />
              <input value={form.holdingLocation} onChange={e => set('holdingLocation', e.target.value)} placeholder="Holding location (e.g. Steam table, Hot box)" className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" />
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Minimum Holding Temp (°F)</label>
                <input type="number" value={form.hotTargetMin} onChange={e => set('hotTargetMin', parseFloat(e.target.value))} className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" />
              </div>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground">
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          )}

          {/* Shared: Station, Job Code, Shift */}
          <div className="grid grid-cols-2 gap-2">
            <select value={form.station} onChange={e => set('station', e.target.value)} className="px-3 py-2 liquid-card rounded-lg text-sm text-foreground">
              <option value="">Station</option>
              {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <select value={form.jobCode} onChange={e => set('jobCode', e.target.value)} className="px-3 py-2 liquid-card rounded-lg text-sm text-foreground">
              <option value="">Job Code</option>
              {jobCodes.map(j => <option key={j.id} value={j.name}>{j.name}</option>)}
            </select>
          </div>
          <select value={form.shift} onChange={e => set('shift', e.target.value)} className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground">
            {SHIFTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Days of Week */}
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-2">Days of Week</label>
            <div className="flex gap-1">
              {DAYS.map((day, idx) => (
                <button key={idx} onClick={() => {
                  const days = form.repeatDays.includes(idx) ? form.repeatDays.filter(d => d !== idx) : [...form.repeatDays, idx];
                  set('repeatDays', days);
                }} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${form.repeatDays.includes(idx) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-3 flex-wrap">
            {[['requiresPhoto', 'Photo'], ['requiresManagerReview', 'Manager Review'], ['requiresCorrectiveAction', 'Corrective Action']].map(([key, label]) => (
              <label key={key} className="flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer">
                <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} className="rounded" />
                {label}
              </label>
            ))}
          </div>

          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes / instructions (optional)" className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" rows="2" />

          <button onClick={handleSave} disabled={loading} className="w-full btn-primary py-3 font-bold rounded-lg">
            {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </button>
        </>
      )}
    </div>
  );
}