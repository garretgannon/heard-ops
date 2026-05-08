import { useState, useEffect } from 'react';
import { X, Clock, Check, XCircle, Plus, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const STATUS_COLORS = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  denied: 'bg-red-500/20 text-red-300 border-red-500/30',
};

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

  const updateStatus = async (id, status) => {
    await base44.entities.TimeOffRequest.update(id, { status, reviewed_by: 'Manager' });
    toast.success(status === 'approved' ? 'Request approved' : 'Request denied');
    load();
  };

  const handleAdd = async () => {
    if (!form.employee_email || !form.start_date || !form.end_date) { toast.error('Fill in required fields'); return; }
    await base44.entities.TimeOffRequest.create({ ...form, status: 'pending', submitted_date: new Date().toISOString() });
    toast.success('Request submitted');
    setShowAdd(false);
    setForm({ employee_email: '', employee_name: '', start_date: '', end_date: '', reason: '' });
    load();
  };

  const filtered = requests.filter(r => r.status === tab);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-stretch justify-end" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border-l border-border/30 flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Time Off Requests</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/30">
          {['pending', 'approved', 'denied'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-bold capitalize transition-colors ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {t}
              <span className={`ml-1 text-[10px] ${tab === t ? 'text-primary' : 'text-muted-foreground'}`}>
                ({requests.filter(r => r.status === t).length})
              </span>
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
            <div key={req.id} className="rounded-xl border border-border/40 bg-background p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-bold text-foreground">{req.employee_name || req.employee_email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {req.start_date} {req.end_date !== req.start_date ? `→ ${req.end_date}` : ''}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[req.status]}`}>{req.status}</span>
              </div>
              {req.reason && <p className="text-xs text-muted-foreground mb-3 italic">"{req.reason}"</p>}
              {req.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(req.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/25 transition-colors">
                    <Check className="h-3 w-3" /> Approve
                  </button>
                  <button onClick={() => updateStatus(req.id, 'denied')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/25 transition-colors">
                    <XCircle className="h-3 w-3" /> Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="border-t border-border/30 p-4 space-y-3 bg-background/50">
            <p className="text-xs font-bold text-foreground">New Request</p>
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
              <Plus className="h-4 w-4" /> New Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}