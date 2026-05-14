import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const STATUSES = ['booked','confirmed','seated','completed','cancelled','no-show'];
const SOURCES = ['phone','website','opentable','resy','toast-tables','walk-in','manual','other'];

export default function ReservationForm({ reservation, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', date: new Date().toISOString().split('T')[0], time: '', partySize: 2,
    area: '', room: '', tableNumber: '', status: 'booked', source: 'phone',
    guestNotes: '', serviceNotes: '', isVIP: false, hasDietaryRestrictions: false,
    dietaryNotes: '', specialOccasion: '', linkedBEOId: '',
    ...reservation,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (reservation?.id) {
        await base44.entities.Reservation.update(reservation.id, form);
      } else {
        await base44.entities.Reservation.create(form);
      }
      haptics.success();
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex max-w-full flex-col overflow-x-hidden bg-background">
      <div className="flex min-w-0 shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button type="button" onClick={onClose} disabled={saving} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center disabled:opacity-50">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-extrabold text-foreground">{reservation ? 'Edit Reservation' : 'New Reservation'}</h2>
        <button type="button" onClick={save} disabled={saving || !form.name.trim()} className="btn-primary h-8 shrink-0 px-4 text-xs disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div className="min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-4 py-4 pb-10 [&_input]:min-w-0 [&_select]:min-w-0 [&_textarea]:min-w-0">
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Reservation name *" className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground font-bold" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <input type="time" value={form.time} onChange={e => set('time', e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground block mb-1">Party Size</label>
            <input type="number" value={form.partySize} onChange={e => set('partySize', parseInt(e.target.value))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground block mb-1">Table #</label>
            <input value={form.tableNumber} onChange={e => set('tableNumber', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input value={form.area} onChange={e => set('area', e.target.value)} placeholder="Area" className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <input value={form.room} onChange={e => set('room', e.target.value)} placeholder="Room" className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground block mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground block mb-1">Source</label>
            <select value={form.source} onChange={e => set('source', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              {SOURCES.map(s => <option key={s} value={s} className="capitalize">{s.replace(/-/g, ' ')}</option>)}
            </select>
          </div>
        </div>
        <input value={form.specialOccasion} onChange={e => set('specialOccasion', e.target.value)} placeholder="Special occasion" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
        <textarea value={form.guestNotes} onChange={e => set('guestNotes', e.target.value)} placeholder="Guest notes" rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none" />
        <textarea value={form.serviceNotes} onChange={e => set('serviceNotes', e.target.value)} placeholder="Service notes (internal)" rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none" />
        <div className="flex flex-wrap gap-4">
          <label className="flex min-w-0 items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={form.isVIP} onChange={e => set('isVIP', e.target.checked)} />
            VIP Guest
          </label>
          <label className="flex min-w-0 items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={form.hasDietaryRestrictions} onChange={e => set('hasDietaryRestrictions', e.target.checked)} />
            Dietary Restrictions
          </label>
        </div>
        {form.hasDietaryRestrictions && (
          <textarea value={form.dietaryNotes} onChange={e => set('dietaryNotes', e.target.value)} placeholder="Dietary notes / restrictions" rows={2} className="w-full px-3 py-2 bg-background border border-red-500/30 rounded-lg text-sm text-foreground resize-none" />
        )}
      </div>
    </div>
  );
}
