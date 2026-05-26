import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  X, Calendar, Clock, Users, MapPin, DoorOpen, BadgeCheck, 
  Phone, Gift, Pencil, ChevronDown, ChevronLeft, Save, Square
} from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUSES = ['booked','confirmed','seated','completed','cancelled','no-show'];
const SOURCES = ['phone','website','opentable','resy','toast-tables','walk-in','manual','other'];

const STATUS_OPTIONS = STATUSES.map(s => ({ label: s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: s }));
const SOURCE_OPTIONS = SOURCES.map(s => ({ label: s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: s }));

function Section({ title, children }) {
  return (
    <div className="mb-6">
      {title && <h3 className="text-[13px] font-extrabold text-foreground mb-3 px-1">{title}</h3>}
      <div className="liquid-card rounded-2xl overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}

function SelectRow({ icon: Icon, label, value, options, onChange, border = true }) {
  const displayValue = options.find(o => o.value === value)?.label || value || 'Select...';
  return (
    <div className={cn("relative flex items-center justify-between py-3.5 px-4 hover:bg-white/[0.02] transition-colors", border && "border-b border-border/40")}>
      <div className="flex items-center gap-3 pointer-events-none shrink-0">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/60" />}
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2 pointer-events-none justify-end flex-1 min-w-0 pl-4">
        <span className="text-sm font-semibold text-foreground truncate">{displayValue}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      </div>
      <select 
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="" disabled>Select {label}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function InputRow({ icon: Icon, label, value, onChange, type = "text", placeholder, border = true }) {
  return (
    <div className={cn("relative flex items-center justify-between py-3 px-4 hover:bg-white/[0.02] transition-colors", border && "border-b border-border/40")}>
      <div className="flex items-center gap-3 shrink-0">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/60" />}
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-right bg-transparent text-sm font-semibold text-foreground focus:outline-none placeholder:text-muted-foreground/30 min-w-0 ml-4 py-0.5"
      />
    </div>
  );
}

function NoteCard({ label, value, onChange, placeholder }) {
  return (
    <div className="liquid-card rounded-xl p-4 mb-3 relative group border border-border/20">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full bg-transparent text-sm text-foreground/90 focus:outline-none resize-none placeholder:text-muted-foreground/30 leading-relaxed block"
      />
    </div>
  );
}

export default function ReservationForm({ reservation, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', date: new Date().toISOString().split('T')[0], time: '12:30', partySize: 2,
    area: 'Main Dining Room', room: 'Main Room', tableNumber: 'TBD', status: 'booked', source: 'phone',
    guestNotes: '', serviceNotes: '', specialOccasion: '',
    ...reservation,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (reservation?.id) {
        await base44.entities.Reservation.update(reservation.id, form);
      } else {
        await base44.entities.Reservation.create(form);
      }
      haptics.success();
      onSave();
    } catch {
      toast.error('Failed to save reservation');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    try {
      const [y, m, day] = d.split('-');
      return `${m}/${day}/${y}`;
    } catch { return d; }
  };

  const formatTime = (t) => {
    if (!t) return '';
    try {
      const [h, m] = t.split(':');
      const d = new Date();
      d.setHours(h, m);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch { return t; }
  };

  const createdStr = reservation?.createdAt 
    ? new Date(reservation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[1100] flex max-w-full flex-col overflow-x-hidden bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3 sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/20">
        <button type="button" onClick={onClose} className="h-9 px-3 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5 text-sm font-semibold text-foreground active:scale-95 transition-all">
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <h2 className="text-[15px] font-extrabold text-foreground tracking-tight">BEOs / Events</h2>
        <div className="w-[72px]" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar pb-24">
        
        {/* Name input as a title */}
        <div className="mb-6">
          <input 
            value={form.name} 
            onChange={e => set('name', e.target.value)} 
            placeholder="Event Name / Guest Name" 
            className="w-full bg-transparent text-2xl font-extrabold text-foreground placeholder:text-muted-foreground/30 focus:outline-none px-1"
          />
        </div>

        {/* Hero Card */}
        <div className="liquid-card rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div className="h-[52px] w-[52px] rounded-[14px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 flex justify-between items-center">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1">Status</p>
              <p className="text-base font-extrabold text-foreground leading-none capitalize mb-1.5">{form.status}</p>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-[11px] text-green-500 font-semibold tracking-wide">Confirmed</span>
              </div>
            </div>
            <div className="w-px h-10 bg-border/40 mx-3" />
            <div className="text-right flex flex-col justify-between h-full">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1">Source</p>
                <div className="flex items-center justify-end gap-1.5">
                  <Phone className="h-3 w-3 text-primary" />
                  <span className="text-[13px] font-bold text-foreground capitalize leading-none">{form.source}</span>
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mb-0.5">Created</p>
                <p className="text-[10px] text-muted-foreground font-medium leading-none">{createdStr}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="mb-6">
          <h3 className="text-[13px] font-extrabold text-foreground mb-3 px-1">Date & Time</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="liquid-card rounded-2xl p-3.5 relative flex flex-col justify-center hover:bg-white/[0.02] transition-colors h-[68px]">
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1.5">Date</span>
              <div className="flex items-center gap-2 pointer-events-none">
                <Calendar className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span className="text-sm font-semibold text-foreground truncate">{formatDate(form.date) || 'Select...'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto shrink-0" />
              </div>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
            </div>
            
            <div className="liquid-card rounded-2xl p-3.5 relative flex flex-col justify-center hover:bg-white/[0.02] transition-colors h-[68px]">
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1.5">Time</span>
              <div className="flex items-center gap-2 pointer-events-none">
                <Clock className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span className="text-sm font-semibold text-foreground truncate">{formatTime(form.time) || 'Select...'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto shrink-0" />
              </div>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
            </div>
          </div>
        </div>

        {/* Party & Location */}
        <Section title="Party & Location">
          <InputRow icon={Users} label="Party Size" value={form.partySize} onChange={v => set('partySize', v)} type="number" />
          <InputRow icon={Square} label="Table #" value={form.tableNumber} onChange={v => set('tableNumber', v)} placeholder="TBD" />
          <InputRow icon={MapPin} label="Area" value={form.area} onChange={v => set('area', v)} placeholder="Main Dining Room" />
          <InputRow icon={DoorOpen} label="Room" value={form.room} onChange={v => set('room', v)} placeholder="Main Room" border={false} />
        </Section>

        {/* Details */}
        <Section title="Details">
          <SelectRow icon={BadgeCheck} label="Status" value={form.status} options={STATUS_OPTIONS} onChange={v => set('status', v)} />
          <SelectRow icon={Phone} label="Source" value={form.source} options={SOURCE_OPTIONS} onChange={v => set('source', v)} />
          <InputRow icon={Gift} label="Special Occasion" value={form.specialOccasion} onChange={v => set('specialOccasion', v)} placeholder="Anniversary" border={false} />
        </Section>

        {/* Notes */}
        <div className="mb-8">
          <h3 className="text-[13px] font-extrabold text-foreground mb-3 px-1">Notes</h3>
          <NoteCard label="Guest Notes" value={form.guestNotes} onChange={v => set('guestNotes', v)} placeholder="Prefers quiet area..." />
          <NoteCard label="Service Notes (Internal)" value={form.serviceNotes} onChange={v => set('serviceNotes', v)} placeholder="Seat by window if possible..." />
        </div>

        {/* Save Button Area */}
        <div className="mt-8 flex justify-end px-1">
          <button
            onClick={save}
            disabled={saving || !form.name.trim()}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ border: '1px solid rgba(255,107,0,0.4)', background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Reservation'}
          </button>
        </div>

      </div>
    </div>
  );
}
