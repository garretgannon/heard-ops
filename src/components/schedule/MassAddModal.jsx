import { useState } from 'react';
import { X, Plus, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const ROLES = ['Manager', 'Bartender', 'Server', 'Host', 'Line Cook', 'Prep Cook', 'Dishwasher', 'Busser', 'Food Runner'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MassAddModal({ employees, weekDays, onSave, onClose }) {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [form, setForm] = useState({ start_time: '09:00', end_time: '17:00', role: '', station: '' });

  const toggleEmp = (id) => setSelectedEmployees(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleDay = (i) => setSelectedDays(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  const toggleAllEmps = () => setSelectedEmployees(selectedEmployees.length === employees.length ? [] : employees.map(e => e.id));

  const preview = selectedEmployees.length * selectedDays.length;

  const handleSave = () => {
    const shifts = [];
    selectedEmployees.forEach(empId => {
      const emp = employees.find(e => e.id === empId);
      if (!emp) return;
      selectedDays.forEach(dayIdx => {
        const day = weekDays[dayIdx];
        shifts.push({
          employee_name: emp.name,
          employee_email: emp.email,
          date: format(day, 'yyyy-MM-dd'),
          ...form,
          status: 'draft',
        });
      });
    });
    onSave(shifts);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg card-glass border border-border/50 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/30">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Mass Add Shifts</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Add the same shift to multiple employees and days at once</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Days */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><Calendar className="h-3 w-3" /> Select Days</p>
            <div className="flex gap-2">
              {DAY_LABELS.map((label, i) => (
                <button key={i} onClick={() => toggleDay(i)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${selectedDays.includes(i) ? 'bg-primary border-primary text-white' : 'border-border bg-secondary text-foreground hover:border-primary/50'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Employees */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Select Employees</p>
              <button onClick={toggleAllEmps} className="text-[10px] font-bold text-primary hover:underline">
                {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
              {employees.map(emp => (
                <button key={emp.id} onClick={() => toggleEmp(emp.id)}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg border text-xs font-medium text-left transition-all ${selectedEmployees.includes(emp.id) ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border bg-secondary text-foreground hover:border-primary/30'}`}>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${selectedEmployees.includes(emp.id) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {(emp.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{emp.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Shift details */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Shift Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1">Start Time</label>
                <input type="time" value={form.start_time} onChange={e => setForm(f => ({...f, start_time: e.target.value}))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1">End Time</label>
                <input type="time" value={form.end_time} onChange={e => setForm(f => ({...f, end_time: e.target.value}))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                  <option value="">Select role…</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1">Station (opt)</label>
                <input type="text" value={form.station} onChange={e => setForm(f => ({...f, station: e.target.value}))}
                  placeholder="Station…"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-border/30 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {preview > 0 ? <span className="font-bold text-primary">{preview} shifts</span> : 'No shifts'} will be created
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} disabled={preview === 0}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed">
              Add {preview > 0 ? preview : ''} Shifts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}