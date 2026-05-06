import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Settings, Thermometer, Snowflake, Flame, Wind, ChevronRight, AlertTriangle, CheckCircle2, Clock, Plus, X } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const today = () => new Date().toISOString().split('T')[0];

const CORRECTIVE_ACTIONS_COOLING = ['Reheat to 165°F', 'Discard batch', 'Move to shallow pans', 'Ice bath', 'Blast chiller', 'Notify manager'];
const CORRECTIVE_ACTIONS_HOT = ['Reheat to 165°F', 'Discard', 'Replace pan', 'Adjust holding unit', 'Notify manager'];
const CORRECTIVE_ACTIONS_COLD = ['Move product', 'Adjust thermostat', 'Call repair', 'Discard product', 'Notify manager'];

function CategoryCard({ icon: Icon, color, title, due, completed, outOfRange, managerReview, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl p-3.5 text-left active:scale-[0.98] transition-all border ${
        active ? `border-${color}-500/50 bg-${color}-500/10` : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-${color}-500/15`}>
          <Icon className={`h-4 w-4 text-${color}-400`} />
        </div>
        <span className="font-bold text-sm text-foreground">{title}</span>
        {active && <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-${color}-500/20 text-${color}-400`}>Active</span>}
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        <div>
          <p className="text-base font-extrabold text-foreground">{due}</p>
          <p className="text-[9px] text-muted-foreground font-semibold">Due</p>
        </div>
        <div>
          <p className="text-base font-extrabold text-green-400">{completed}</p>
          <p className="text-[9px] text-muted-foreground font-semibold">Done</p>
        </div>
        <div>
          <p className={`text-base font-extrabold ${outOfRange > 0 ? 'text-red-400' : 'text-foreground'}`}>{outOfRange}</p>
          <p className="text-[9px] text-muted-foreground font-semibold">OOR</p>
        </div>
        <div>
          <p className={`text-base font-extrabold ${managerReview > 0 ? 'text-amber-400' : 'text-foreground'}`}>{managerReview}</p>
          <p className="text-[9px] text-muted-foreground font-semibold">Review</p>
        </div>
      </div>
    </button>
  );
}

// ─── Log Entry Modals ──────────────────────────────────────────────────────
function CoolingLogModal({ onClose, onSaved, user }) {
  const [form, setForm] = useState({ foodItem: '', batchId: '', station: '', date: today(), shift: 'all', startTime: '', startTemperature: '', twoHourCheckTime: '', twoHourTemperature: '', sixHourCheckTime: '', sixHourTemperature: '', correctiveAction: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const getStatus = () => {
    const start = parseFloat(form.startTemperature);
    const two = parseFloat(form.twoHourTemperature);
    const six = parseFloat(form.sixHourTemperature);
    if (!start) return 'in_progress';
    if (!form.twoHourTemperature) return 'needs_2hr_check';
    if (two > 70) return 'corrective_action_required';
    if (!form.sixHourTemperature) return 'needs_6hr_check';
    if (six > 41) return 'corrective_action_required';
    return 'passed';
  };

  const save = async () => {
    if (!form.foodItem || !form.startTemperature) return;
    setSaving(true);
    const status = getStatus();
    await base44.entities.CoolingLog.create({ ...form, startTemperature: parseFloat(form.startTemperature), twoHourTemperature: form.twoHourTemperature ? parseFloat(form.twoHourTemperature) : undefined, sixHourTemperature: form.sixHourTemperature ? parseFloat(form.sixHourTemperature) : undefined, status, completedBy: user?.email, completedAt: new Date().toISOString() });
    haptics.success();
    onSaved?.();
    onClose();
    setSaving(false);
  };

  const status = getStatus();
  const failed = status === 'corrective_action_required';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="border-b border-border p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-400" />
            <h2 className="font-bold text-foreground text-sm">New Cooling Log</h2>
          </div>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 text-xs text-blue-300 font-semibold">
            Food must cool: 135°F → 70°F within 2 hrs, then 70°F → 41°F within 4 hrs
          </div>
          <input value={form.foodItem} onChange={e => setForm(p => ({ ...p, foodItem: e.target.value }))} placeholder="Food item *" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.batchId} onChange={e => setForm(p => ({ ...p, batchId: e.target.value }))} placeholder="Batch / prep date" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            <input value={form.station} onChange={e => setForm(p => ({ ...p, station: e.target.value }))} placeholder="Station" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Start Temp *</label>
              <input type="number" value={form.startTemperature} onChange={e => setForm(p => ({ ...p, startTemperature: e.target.value }))} placeholder="°F" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">2-Hr Check Time</label>
              <input type="time" value={form.twoHourCheckTime} onChange={e => setForm(p => ({ ...p, twoHourCheckTime: e.target.value }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className={`text-xs font-bold block mb-1 ${form.twoHourTemperature && parseFloat(form.twoHourTemperature) > 70 ? 'text-red-400' : 'text-muted-foreground'}`}>2-Hr Temp (must be ≤70°F)</label>
              <input type="number" value={form.twoHourTemperature} onChange={e => setForm(p => ({ ...p, twoHourTemperature: e.target.value }))} placeholder="°F" className={`w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground ${form.twoHourTemperature && parseFloat(form.twoHourTemperature) > 70 ? 'border-red-500' : 'border-border'}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">6-Hr Check Time</label>
              <input type="time" value={form.sixHourCheckTime} onChange={e => setForm(p => ({ ...p, sixHourCheckTime: e.target.value }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className={`text-xs font-bold block mb-1 ${form.sixHourTemperature && parseFloat(form.sixHourTemperature) > 41 ? 'text-red-400' : 'text-muted-foreground'}`}>6-Hr Temp (must be ≤41°F)</label>
              <input type="number" value={form.sixHourTemperature} onChange={e => setForm(p => ({ ...p, sixHourTemperature: e.target.value }))} placeholder="°F" className={`w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground ${form.sixHourTemperature && parseFloat(form.sixHourTemperature) > 41 ? 'border-red-500' : 'border-border'}`} />
            </div>
          </div>
          {failed && (
            <div>
              <label className="text-xs font-bold text-red-400 block mb-1">Corrective Action Required *</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {CORRECTIVE_ACTIONS_COOLING.map(a => (
                  <button key={a} onClick={() => setForm(p => ({ ...p, correctiveAction: a }))} className={`text-xs px-2 py-1 rounded-lg border ${form.correctiveAction === a ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-muted border-border text-muted-foreground'}`}>{a}</button>
                ))}
              </div>
              <input value={form.correctiveAction} onChange={e => setForm(p => ({ ...p, correctiveAction: e.target.value }))} placeholder="Or describe corrective action..." className="w-full px-3 py-2 bg-background border border-red-500/30 rounded-lg text-sm text-foreground" />
            </div>
          )}
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" rows="2" />
          <div className={`px-3 py-2 rounded-lg text-xs font-bold ${status === 'passed' ? 'bg-green-500/10 text-green-400' : status === 'corrective_action_required' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
            Status: {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </div>
        <div className="p-4 border-t border-border shrink-0">
          <button onClick={save} disabled={saving} className="w-full btn-primary text-sm">{saving ? 'Saving...' : 'Save Cooling Log'}</button>
        </div>
      </div>
    </div>
  );
}

function RefrigeratorFreezerModal({ equipment, onClose, onSaved, user }) {
  const [selectedEquipment, setSelectedEquipment] = useState(equipment || null);
  const [allEquipment, setAllEquipment] = useState([]);
  const [form, setForm] = useState({ equipmentName: equipment?.name || '', equipmentType: equipment?.equipmentType || '', area: equipment?.area || '', station: equipment?.station || '', date: today(), time: new Date().toTimeString().slice(0, 5), shift: 'all', targetMin: 34, targetMax: 41, recordedTemperature: '', correctiveAction: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const COLD_EQUIPMENT_TYPES = ['walk-in-cooler','walk-in-freezer','reach-in-cooler','reach-in-freezer','prep-table-cooler','lowboy-cooler','beer-cooler','wine-cooler','bar-cooler'];

  useEffect(() => {
    base44.entities.Equipment.list('-updated_date', 100).then(data => {
      setAllEquipment(data.filter(e => COLD_EQUIPMENT_TYPES.includes(e.equipmentType) && e.isActive));
    });
  }, []);

  const selectEquipment = (eq) => {
    setSelectedEquipment(eq);
    const isFreeze = eq.equipmentType?.includes('freezer');
    setForm(p => ({ ...p, equipmentId: eq.id, equipmentName: eq.name, equipmentType: eq.equipmentType, area: eq.area || '', station: eq.station || '', targetMin: isFreeze ? -10 : 34, targetMax: isFreeze ? 0 : 41 }));
  };

  const recorded = parseFloat(form.recordedTemperature);
  const isOutOfRange = !isNaN(recorded) && (recorded < form.targetMin || recorded > form.targetMax);

  const save = async () => {
    if (!form.equipmentName || !form.recordedTemperature) return;
    setSaving(true);
    await base44.entities.RefrigeratorFreezerLog.create({ ...form, recordedTemperature: recorded, isOutOfRange, completedBy: user?.email, completedAt: new Date().toISOString() });
    haptics.success();
    onSaved?.();
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="border-b border-border p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-cyan-400" />
            <h2 className="font-bold text-foreground text-sm">Refrigerator / Freezer Log</h2>
          </div>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {!selectedEquipment && allEquipment.length > 0 && (
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-2">Select Equipment</label>
              <div className="space-y-1.5">
                {allEquipment.map(eq => (
                  <button key={eq.id} onClick={() => selectEquipment(eq)} className="w-full flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2.5 text-left hover:border-primary/40 transition-all">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{eq.name}</p>
                      <p className="text-xs text-muted-foreground">{eq.area}{eq.station ? ` · ${eq.station}` : ''}</p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Or enter manually:</p>
                <input value={form.equipmentName} onChange={e => setForm(p => ({ ...p, equipmentName: e.target.value }))} placeholder="Equipment name *" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
              </div>
            </div>
          )}
          {(selectedEquipment || allEquipment.length === 0) && (
            <>
              {selectedEquipment && <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2 flex items-center justify-between"><span className="text-sm font-bold text-cyan-300">{selectedEquipment.name}</span><button onClick={() => setSelectedEquipment(null)} className="text-xs text-muted-foreground">Change</button></div>}
              {!selectedEquipment && <input value={form.equipmentName} onChange={e => setForm(p => ({ ...p, equipmentName: e.target.value }))} placeholder="Equipment name *" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Target Min (°F)</label>
                  <input type="number" value={form.targetMin} onChange={e => setForm(p => ({ ...p, targetMin: parseFloat(e.target.value) }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Target Max (°F)</label>
                  <input type="number" value={form.targetMax} onChange={e => setForm(p => ({ ...p, targetMax: parseFloat(e.target.value) }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
                </div>
              </div>
              <div>
                <label className={`text-xs font-bold block mb-1 ${isOutOfRange ? 'text-red-400' : 'text-muted-foreground'}`}>
                  Recorded Temperature * {isOutOfRange ? '⚠ OUT OF RANGE' : ''}
                </label>
                <input type="number" value={form.recordedTemperature} onChange={e => setForm(p => ({ ...p, recordedTemperature: e.target.value }))} placeholder={`Target: ${form.targetMin}°F – ${form.targetMax}°F`} className={`w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground ${isOutOfRange ? 'border-red-500' : 'border-border'}`} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Shift</label>
                  <select value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                    <option value="opening">Opening</option>
                    <option value="mid">Mid</option>
                    <option value="closing">Closing</option>
                    <option value="all">All Shifts</option>
                  </select>
                </div>
              </div>
              {isOutOfRange && (
                <div>
                  <label className="text-xs font-bold text-red-400 block mb-1">Corrective Action Required *</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {CORRECTIVE_ACTIONS_COLD.map(a => (
                      <button key={a} onClick={() => setForm(p => ({ ...p, correctiveAction: a }))} className={`text-xs px-2 py-1 rounded-lg border ${form.correctiveAction === a ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-muted border-border text-muted-foreground'}`}>{a}</button>
                    ))}
                  </div>
                  <input value={form.correctiveAction} onChange={e => setForm(p => ({ ...p, correctiveAction: e.target.value }))} placeholder="Describe corrective action..." className="w-full px-3 py-2 bg-background border border-red-500/30 rounded-lg text-sm text-foreground" />
                </div>
              )}
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" rows="2" />
            </>
          )}
        </div>
        <div className="p-4 border-t border-border shrink-0">
          <button onClick={save} disabled={saving || (!selectedEquipment && !form.equipmentName) || !form.recordedTemperature} className="w-full btn-primary text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Log'}</button>
        </div>
      </div>
    </div>
  );
}

function HotHoldingModal({ onClose, onSaved, user }) {
  const [form, setForm] = useState({ foodItem: '', holdingLocation: '', station: '', pan: '', date: today(), time: new Date().toTimeString().slice(0, 5), shift: 'all', targetMin: 135, recordedTemperature: '', correctiveAction: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const recorded = parseFloat(form.recordedTemperature);
  const isOutOfRange = !isNaN(recorded) && recorded < form.targetMin;

  const save = async () => {
    if (!form.foodItem || !form.recordedTemperature) return;
    setSaving(true);
    await base44.entities.HotHoldingLog.create({ ...form, recordedTemperature: recorded, isOutOfRange, completedBy: user?.email, completedAt: new Date().toISOString() });
    haptics.success();
    onSaved?.();
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="border-b border-border p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <h2 className="font-bold text-foreground text-sm">Hot Holding Log</h2>
          </div>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5 text-xs text-orange-300 font-semibold">
            Hot holding minimum: 135°F. If below, reheat to 165°F or discard.
          </div>
          <input value={form.foodItem} onChange={e => setForm(p => ({ ...p, foodItem: e.target.value }))} placeholder="Food item *" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.holdingLocation} onChange={e => setForm(p => ({ ...p, holdingLocation: e.target.value }))} placeholder="Holding location" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            <input value={form.station} onChange={e => setForm(p => ({ ...p, station: e.target.value }))} placeholder="Station" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.pan} onChange={e => setForm(p => ({ ...p, pan: e.target.value }))} placeholder="Pan / batch" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className={`text-xs font-bold block mb-1 ${isOutOfRange ? 'text-red-400' : 'text-muted-foreground'}`}>
              Recorded Temperature * {isOutOfRange ? `⚠ BELOW ${form.targetMin}°F MINIMUM` : ''}
            </label>
            <input type="number" value={form.recordedTemperature} onChange={e => setForm(p => ({ ...p, recordedTemperature: e.target.value }))} placeholder={`Min: ${form.targetMin}°F`} className={`w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground ${isOutOfRange ? 'border-red-500' : 'border-border'}`} />
          </div>
          {isOutOfRange && (
            <div>
              <label className="text-xs font-bold text-red-400 block mb-1">Corrective Action Required *</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {CORRECTIVE_ACTIONS_HOT.map(a => (
                  <button key={a} onClick={() => setForm(p => ({ ...p, correctiveAction: a }))} className={`text-xs px-2 py-1 rounded-lg border ${form.correctiveAction === a ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-muted border-border text-muted-foreground'}`}>{a}</button>
                ))}
              </div>
              <input value={form.correctiveAction} onChange={e => setForm(p => ({ ...p, correctiveAction: e.target.value }))} placeholder="Describe corrective action..." className="w-full px-3 py-2 bg-background border border-red-500/30 rounded-lg text-sm text-foreground" />
            </div>
          )}
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" rows="2" />
        </div>
        <div className="p-4 border-t border-border shrink-0">
          <button onClick={save} disabled={saving} className="w-full btn-primary text-sm">{saving ? 'Saving...' : 'Save Hot Holding Log'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Log History Card ──────────────────────────────────────────────────────
function LogCard({ log, category }) {
  const isOutOfRange = log.isOutOfRange || log.status === 'corrective_action_required' || log.status === 'failed';
  const isPassed = log.status === 'passed' || (!log.isOutOfRange && log.recordedTemperature !== undefined);

  const categoryColors = { cooling: 'blue', refrigerator: 'cyan', hot: 'orange' };
  const color = categoryColors[category] || 'blue';

  return (
    <div className={`bg-card border rounded-xl p-3 ${isOutOfRange ? 'border-red-500/40' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{log.foodItem || log.equipmentName}</p>
          <p className="text-xs text-muted-foreground">{log.station || log.area}{log.holdingLocation ? ` · ${log.holdingLocation}` : ''}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isOutOfRange ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 flex items-center gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" /> OOR
            </span>
          ) : (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> OK
            </span>
          )}
          {log.recordedTemperature !== undefined && (
            <span className={`text-sm font-extrabold ${isOutOfRange ? 'text-red-400' : 'text-foreground'}`}>{log.recordedTemperature}°F</span>
          )}
        </div>
      </div>
      {category === 'cooling' && (
        <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
          {log.startTemperature && <span>Start: <span className="text-foreground font-bold">{log.startTemperature}°F</span></span>}
          {log.twoHourTemperature && <span>2hr: <span className={`font-bold ${log.twoHourTemperature > 70 ? 'text-red-400' : 'text-foreground'}`}>{log.twoHourTemperature}°F</span></span>}
          {log.sixHourTemperature && <span>6hr: <span className={`font-bold ${log.sixHourTemperature > 41 ? 'text-red-400' : 'text-foreground'}`}>{log.sixHourTemperature}°F</span></span>}
        </div>
      )}
      {log.correctiveAction && (
        <div className="mt-1.5 text-xs bg-red-500/10 text-red-300 rounded-lg px-2 py-1 font-semibold">CA: {log.correctiveAction}</div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1">{log.time || ''} {log.completedBy ? `· ${log.completedBy}` : ''}</p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function TempLogs() {
  const navigate = useNavigate();
  const { isAdmin, user } = useCurrentUser();
  const [activeCategory, setActiveCategory] = useState(null);
  const [coolingLogs, setCoolingLogs] = useState([]);
  const [refrigLogs, setRefrigLogs] = useState([]);
  const [hotLogs, setHotLogs] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    const [cooling, refrig, hot] = await Promise.all([
      base44.entities.CoolingLog.filter({ date: today() }).catch(() => []),
      base44.entities.RefrigeratorFreezerLog.filter({ date: today() }).catch(() => []),
      base44.entities.HotHoldingLog.filter({ date: today() }).catch(() => []),
    ]);
    setCoolingLogs(cooling);
    setRefrigLogs(refrig);
    setHotLogs(hot);
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const coolingStats = {
    due: 0, completed: coolingLogs.length,
    outOfRange: coolingLogs.filter(l => l.status === 'failed' || l.status === 'corrective_action_required').length,
    managerReview: coolingLogs.filter(l => l.status === 'manager_review_required').length,
  };
  const refrigStats = {
    due: 0, completed: refrigLogs.length,
    outOfRange: refrigLogs.filter(l => l.isOutOfRange).length,
    managerReview: refrigLogs.filter(l => l.managerReviewedBy === null && l.isOutOfRange).length,
  };
  const hotStats = {
    due: 0, completed: hotLogs.length,
    outOfRange: hotLogs.filter(l => l.isOutOfRange).length,
    managerReview: hotLogs.filter(l => l.managerReviewedBy === null && l.isOutOfRange).length,
  };

  const displayedLogs = activeCategory === 'cooling' ? coolingLogs : activeCategory === 'refrigerator' ? refrigLogs : activeCategory === 'hot' ? hotLogs : [];

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Temperature Logs</h1>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('/temp-log-templates')} className="btn-secondary text-xs h-8 px-2 flex items-center gap-1">
            <Settings className="h-3 w-3" /> Templates
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Category Cards */}
        <div className="space-y-2">
          <CategoryCard icon={Wind} color="blue" title="Cooling Logs" due={coolingStats.due} completed={coolingStats.completed} outOfRange={coolingStats.outOfRange} managerReview={coolingStats.managerReview} active={activeCategory === 'cooling'} onClick={() => setActiveCategory(activeCategory === 'cooling' ? null : 'cooling')} />
          <CategoryCard icon={Snowflake} color="cyan" title="Refrigerators / Freezers" due={refrigStats.due} completed={refrigStats.completed} outOfRange={refrigStats.outOfRange} managerReview={refrigStats.managerReview} active={activeCategory === 'refrigerator'} onClick={() => setActiveCategory(activeCategory === 'refrigerator' ? null : 'refrigerator')} />
          <CategoryCard icon={Flame} color="orange" title="Hot Holding" due={hotStats.due} completed={hotStats.completed} outOfRange={hotStats.outOfRange} managerReview={hotStats.managerReview} active={activeCategory === 'hot'} onClick={() => setActiveCategory(activeCategory === 'hot' ? null : 'hot')} />
        </div>

        {/* Log History for Selected Category */}
        {activeCategory && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {activeCategory === 'cooling' ? "Today's Cooling Logs" : activeCategory === 'refrigerator' ? "Today's Fridge/Freezer Logs" : "Today's Hot Holding Logs"}
              </p>
              <button onClick={() => setModal(activeCategory)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                <Plus className="h-3 w-3" /> New Log
              </button>
            </div>
            {loading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
            ) : displayedLogs.length === 0 ? (
              <div className="text-center py-8 bg-card border border-border rounded-xl">
                <p className="text-sm text-muted-foreground">No logs recorded today</p>
                <button onClick={() => setModal(activeCategory)} className="mt-3 btn-primary text-xs px-4 py-2 flex items-center gap-1 mx-auto">
                  <Plus className="h-3 w-3" /> Add First Log
                </button>
              </div>
            ) : (
              displayedLogs.map(log => <LogCard key={log.id} log={log} category={activeCategory} />)
            )}
          </div>
        )}

        {/* Prompt to select a category */}
        {!activeCategory && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Select a category above to view logs or add a new entry.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setModal(activeCategory || 'cooling')}
        className="fixed bottom-24 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modals */}
      {modal === 'cooling' && <CoolingLogModal user={user} onClose={() => setModal(null)} onSaved={loadLogs} />}
      {modal === 'refrigerator' && <RefrigeratorFreezerModal user={user} onClose={() => setModal(null)} onSaved={loadLogs} />}
      {modal === 'hot' && <HotHoldingModal user={user} onClose={() => setModal(null)} onSaved={loadLogs} />}
    </div>
  );
}

export const hideBase44Index = true;