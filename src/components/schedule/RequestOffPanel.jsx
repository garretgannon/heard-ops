import { useState, useEffect } from 'react';
import { X, Clock, Check, XCircle, Plus, Calendar, ArrowLeftRight, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  denied: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const TYPE_CONFIG = {
  time_off: { label: 'Time Off', icon: Calendar, color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  swap: { label: 'Swap Request', icon: ArrowLeftRight, color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  pickup: { label: 'Pickup Request', icon: Package, color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
};

function fmtDate(d) {
  if (!d) return '';
  try {
    const [y, mo, day] = d.split('-');
    const dt = new Date(+y, +mo - 1, +day);
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return d; }
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''} ${ampm}`;
}

function RequestCard({ req, onApprove, onDeny }) {
  const type = req.type || 'time_off';
  const typeConf = TYPE_CONFIG[type] || TYPE_CONFIG.time_off;
  const TypeIcon = typeConf.icon;

  return (
    <div className="rounded-xl border border-border/40 bg-background p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{req.employee_name || req.employee_email}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', typeConf.color)}>
              <TypeIcon className="h-2.5 w-2.5" />
              {typeConf.label}
            </span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize', STATUS_COLORS[req.status])}>
              {req.status}
            </span>
          </div>
        </div>
      </div>

      {/* Time off: date range */}
      {type === 'time_off' && (
        <div className="rounded-lg bg-secondary/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {fmtDate(req.start_date)}
            {req.end_date && req.end_date !== req.start_date && <> → {fmtDate(req.end_date)}</>}
          </p>
          {req.reason && <p className="text-xs text-foreground/70 mt-1 italic">"{req.reason}"</p>}
        </div>
      )}

      {/* Swap: shift context */}
      {type === 'swap' && (
        <div className="rounded-lg bg-secondary/40 px-3 py-2 space-y-1.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Their shift</p>
            <p className="text-xs text-foreground font-semibold">
              {req.shift_role || '—'}{req.shift_date ? ` · ${fmtDate(req.shift_date)}` : ''}
            </p>
            {(req.shift_time) && (
              <p className="text-[11px] text-muted-foreground">{req.shift_time}</p>
            )}
          </div>
          {req.target_employee_email && (
            <div className="border-t border-border/30 pt-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Swap with</p>
              <p className="text-xs text-foreground">{req.target_employee_email}</p>
              {req.offered_shift_date && (
                <p className="text-[11px] text-muted-foreground">Their shift: {fmtDate(req.offered_shift_date)}</p>
              )}
            </div>
          )}
          {req.reason && <p className="text-xs text-foreground/70 italic">"{req.reason}"</p>}
        </div>
      )}

      {/* Pickup: just a note */}
      {type === 'pickup' && (
        <div className="rounded-lg bg-secondary/40 px-3 py-2">
          {req.shift_date && <p className="text-xs text-foreground">{fmtDate(req.shift_date)}{req.shift_role ? ` · ${req.shift_role}` : ''}</p>}
          {req.reason && <p className="text-xs text-foreground/70 mt-1 italic">"{req.reason}"</p>}
        </div>
      )}

      {/* Actions */}
      {req.status === 'pending' && (
        <div className="flex gap-2">
          <button onClick={() => onApprove(req)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/25 transition-colors">
            <Check className="h-3 w-3" />
            {type === 'swap' ? 'Approve Swap' : type === 'pickup' ? 'Approve Pickup' : 'Approve'}
          </button>
          <button onClick={() => onDeny(req)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/25 transition-colors">
            <XCircle className="h-3 w-3" /> Deny
          </button>
        </div>
      )}
    </div>
  );
}

export default function RequestOffPanel({ onClose, employees }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ employee_email: '', employee_name: '', start_date: '', end_date: '', reason: '' });

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.TimeOffRequest.list('-created_date', 100).catch(() => []);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (req) => {
    try {
      await base44.entities.TimeOffRequest.update(req.id, { status: 'approved', reviewed_by: 'Manager' });

      if (req.type === 'swap' && req.shift_id) {
        if (req.target_employee_email && req.offered_shift_id) {
          // Full swap: reassign both shifts
          await Promise.all([
            base44.entities.StaffShift.update(req.shift_id, {
              employee_email: req.target_employee_email,
              offered: false,
            }).catch(() => null),
            base44.entities.StaffShift.update(req.offered_shift_id, {
              employee_email: req.employee_email,
              offered: false,
            }).catch(() => null),
          ]);
          toast.success('Swap approved — shifts reassigned');
        } else {
          // No counter-shift: mark as open for pickup
          await base44.entities.StaffShift.update(req.shift_id, { offered: true }).catch(() => null);
          toast.success('Swap approved — shift marked as open');
        }
      } else if (req.type === 'pickup' && req.shift_id) {
        await base44.entities.StaffShift.update(req.shift_id, {
          employee_email: req.employee_email,
          employee_name: req.employee_name,
          offered: false,
        }).catch(() => null);
        toast.success('Pickup approved');
      } else {
        toast.success('Request approved');
      }

      load();
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleDeny = async (req) => {
    await base44.entities.TimeOffRequest.update(req.id, { status: 'denied', reviewed_by: 'Manager' }).catch(() => null);
    toast.success('Request denied');
    load();
  };

  const handleAdd = async () => {
    if (!form.employee_email || !form.start_date || !form.end_date) { toast.error('Fill in required fields'); return; }
    await base44.entities.TimeOffRequest.create({ ...form, type: 'time_off', status: 'pending', submitted_date: new Date().toISOString() });
    toast.success('Request submitted');
    setShowAdd(false);
    setForm({ employee_email: '', employee_name: '', start_date: '', end_date: '', reason: '' });
    load();
  };

  const filtered = requests.filter(r => r.status === tab);
  const counts = { pending: 0, approved: 0, denied: 0 };
  requests.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-stretch justify-end" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border-l border-border/30 flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Schedule Requests
          </h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto px-4 pt-4 pb-2 scrollbar-hide">
          {['pending', 'approved', 'denied'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize whitespace-nowrap transition-all',
                tab === t ? 'glow-active' : 'border-transparent text-muted-foreground hover:text-foreground glow-interactive')}>
              {t}
              <span className="text-[10px] opacity-70">({counts[t]})</span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && <div className="text-center py-8 text-muted-foreground text-sm">Loading…</div>}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No {tab} requests</p>
            </div>
          )}
          {filtered.map(req => (
            <RequestCard key={req.id} req={req} onApprove={handleApprove} onDeny={handleDeny} />
          ))}
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="border-t border-border/30 p-4 space-y-3 bg-background/50">
            <p className="text-xs font-bold text-foreground">Add Time Off Request</p>
            <select value={form.employee_email} onChange={e => {
              const emp = employees.find(em => em.email === e.target.value);
              setForm(f => ({ ...f, employee_email: e.target.value, employee_name: emp?.name || '' }));
            }} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="">Select employee…</option>
              {employees.map(e => <option key={e.id} value={e.email}>{e.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <input type="text" value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))}
              placeholder="Reason (optional)"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-border text-xs font-bold text-foreground">Cancel</button>
              <button onClick={handleAdd} className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold">Submit</button>
            </div>
          </div>
        )}

        {/* Footer */}
        {!showAdd && (
          <div className="border-t border-border/30 p-4">
            <button onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-bold hover:bg-primary/25 transition-colors">
              <Plus className="h-4 w-4" /> Add Time Off Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
