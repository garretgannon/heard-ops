import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Plus, Trash2, ChevronLeft, Calendar, Users, ConciergeBell, ArrowRight,
  Clock, MapPin, DoorOpen, BadgeCheck, Phone, Gift, Pencil, ChevronDown, Square
} from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EVENT_TYPES = ['private-dining','banquet','buyout','catering','tasting','meeting','wedding','corporate','holiday-party','other'];
const SERVICE_STYLES = ['plated','buffet','family-style','passed-apps','stations','reception','bar-package','pickup-catering','drop-off-catering','other'];
const STATUSES = ['inquiry','tentative','confirmed','in-production','ready','completed','cancelled'];

const EVENT_TYPE_OPTIONS = EVENT_TYPES.map(s => ({ label: s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: s }));
const SERVICE_STYLE_OPTIONS = SERVICE_STYLES.map(s => ({ label: s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: s }));
const STATUS_OPTIONS = STATUSES.map(s => ({ label: s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: s }));

const TABS = ['Details','Menu','Prep','Timeline','Dietary','Equipment','Notes'];

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

const FieldLabel = ({ children }) => (
  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{children}</label>
);

export default function BEOForm({ beo, onSave, onClose }) {
  const [tab, setTab] = useState('Details');
  const [form, setForm] = useState({
    eventName: '', eventDate: new Date().toISOString().split('T')[0],
    startTime: '12:00', endTime: '15:00', guestCount: '', room: '', area: '',
    eventType: 'private-dining', serviceStyle: 'plated', status: 'tentative',
    clientName: '', internalEventOwner: '',
    prepNotes: '', kitchenNotes: '', fohNotes: '', barNotes: '', setupNotes: '',
    dietaryNotes: '', allergenNotes: '', managerNotes: '', chefNotes: '',
    serversNeeded: '', bartendersNeeded: '', cooksNeeded: '', setupStaffNeeded: '',
    eventCaptain: '', managerOnDuty: '',
    ...beo,
  });
  const [menuItems, setMenuItems] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [dietary, setDietary] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (beo?.id) {
      Promise.all([
        base44.entities.BEOMenuItem.filter({ beoId: beo.id }, 'sortOrder').catch(() => []),
        base44.entities.BEOPrepItem.filter({ beoId: beo.id }, 'sortOrder').catch(() => []),
        base44.entities.BEOTimelineItem.filter({ beoId: beo.id }, 'sortOrder').catch(() => []),
        base44.entities.BEODietaryRestriction.filter({ beoId: beo.id }).catch(() => []),
        base44.entities.BEOEquipmentNeed.filter({ beoId: beo.id }).catch(() => []),
      ]).then(([m, p, t, d, e]) => {
        setMenuItems(m); setPrepItems(p); setTimeline(t); setDietary(d); setEquipment(e);
      });
    }
  }, [beo?.id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.eventName.trim()) { toast.error('Event name is required'); return; }
    setSaving(true);
    try {
      let beoId = beo?.id;
      if (beoId) {
        await base44.entities.BEO.update(beoId, form);
      } else {
        const created = await base44.entities.BEO.create(form);
        beoId = created.id;
      }
      for (const item of menuItems) {
        if (item._new) { const { _new, id, ...d } = item; await base44.entities.BEOMenuItem.create({ ...d, beoId }); }
        else if (item._deleted && item.id) { await base44.entities.BEOMenuItem.delete(item.id); }
        else if (item.id && item._dirty) { const { _dirty, _beo, ...d } = item; await base44.entities.BEOMenuItem.update(item.id, d); }
      }
      for (const item of prepItems) {
        if (item._new) { const { _new, id, ...d } = item; await base44.entities.BEOPrepItem.create({ ...d, beoId }); }
        else if (item._deleted && item.id) { await base44.entities.BEOPrepItem.delete(item.id); }
        else if (item.id && item._dirty) { const { _dirty, _beo, ...d } = item; await base44.entities.BEOPrepItem.update(item.id, d); }
      }
      for (const item of timeline) {
        if (item._new) { const { _new, id, ...d } = item; await base44.entities.BEOTimelineItem.create({ ...d, beoId }); }
        else if (item._deleted && item.id) { await base44.entities.BEOTimelineItem.delete(item.id); }
        else if (item.id && item._dirty) { const { _dirty, ...d } = item; await base44.entities.BEOTimelineItem.update(item.id, d); }
      }
      for (const item of dietary) {
        if (item._new) { const { _new, id, ...d } = item; await base44.entities.BEODietaryRestriction.create({ ...d, beoId }); }
        else if (item._deleted && item.id) { await base44.entities.BEODietaryRestriction.delete(item.id); }
      }
      for (const item of equipment) {
        if (item._new) { const { _new, id, ...d } = item; await base44.entities.BEOEquipmentNeed.create({ ...d, beoId }); }
        else if (item._deleted && item.id) { await base44.entities.BEOEquipmentNeed.delete(item.id); }
        else if (item.id && item._dirty) { const { _dirty, ...d } = item; await base44.entities.BEOEquipmentNeed.update(item.id, d); }
      }
      haptics.success();
      onSave();
    } catch {
      toast.error('Failed to save event');
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

  const createdStr = beo?.createdAt 
    ? new Date(beo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const inputCls = 'w-full min-w-0 px-3 py-2.5 liquid-card rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40';

  const Textarea = ({ field, placeholder, rows = 2 }) => (
    <textarea
      value={form[field]}
      onChange={e => set(field, e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full min-w-0 px-3 py-2.5 liquid-card rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 resize-none"
    />
  );

  return (
    <div className="fixed inset-0 z-[1100] flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3 sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/20">
        <button type="button" onClick={onClose} disabled={saving} className="h-9 px-3 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5 text-sm font-semibold text-foreground active:scale-95 transition-all disabled:opacity-50">
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <h2 className="text-[15px] font-extrabold text-foreground tracking-tight">BEOs / Events</h2>
        <div className="w-[72px]" /> {/* Spacer for centering */}
      </div>

      {/* Tab bar */}
      <div className="relative shrink-0 bg-card border-b border-border">
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-3.5 py-2 rounded-full border text-xs font-semibold whitespace-nowrap transition-all ${
                tab === t
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent" />
      </div>

      {/* Scrollable content */}
      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-4 no-scrollbar pb-24">
        {tab === 'Details' && (
          <>
            {/* Event Name */}
            <div className="mb-6">
              <input 
                value={form.eventName} 
                onChange={e => set('eventName', e.target.value)} 
                placeholder="Event Name / Group Name" 
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
                  <p className="text-base font-extrabold text-foreground leading-none capitalize mb-1.5">{form.status.replace(/-/g, ' ')}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[11px] text-green-500 font-semibold tracking-wide">Confirmed</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-border/40 mx-3" />
                <div className="text-right flex flex-col justify-between h-full">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1">Type</p>
                    <div className="flex items-center justify-end gap-1.5">
                      <ConciergeBell className="h-3 w-3 text-primary" />
                      <span className="text-[13px] font-bold text-foreground capitalize leading-none">{form.eventType.replace(/-/g, ' ')}</span>
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
                    <span className="text-sm font-semibold text-foreground truncate">{formatDate(form.eventDate) || 'Select...'}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto shrink-0" />
                  </div>
                  <input type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                </div>
                
                <div className="liquid-card rounded-2xl p-3.5 relative flex flex-col justify-center hover:bg-white/[0.02] transition-colors h-[68px]">
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1.5">Time</span>
                  <div className="flex items-center gap-2 pointer-events-none">
                    <Clock className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">
                      {formatTime(form.startTime)} - {formatTime(form.endTime)}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto shrink-0" />
                  </div>
                  <div className="absolute inset-0 flex opacity-0 cursor-pointer">
                    <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className="w-1/2 h-full" />
                    <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className="w-1/2 h-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <Section title="Event Details">
              <InputRow icon={Users} label="Guest Count" value={form.guestCount} onChange={v => set('guestCount', v)} type="number" placeholder="0" />
              <SelectRow icon={ConciergeBell} label="Event Type" value={form.eventType} options={EVENT_TYPE_OPTIONS} onChange={v => set('eventType', v)} />
              <SelectRow icon={ConciergeBell} label="Service Style" value={form.serviceStyle} options={SERVICE_STYLE_OPTIONS} onChange={v => set('serviceStyle', v)} />
              <SelectRow icon={BadgeCheck} label="Status" value={form.status} options={STATUS_OPTIONS} onChange={v => set('status', v)} border={false} />
            </Section>

            {/* Location */}
            <Section title="Location">
              <InputRow icon={DoorOpen} label="Room" value={form.room} onChange={v => set('room', v)} placeholder="e.g. Main Hall" />
              <InputRow icon={MapPin} label="Area" value={form.area} onChange={v => set('area', v)} placeholder="e.g. Entire Floor" border={false} />
            </Section>

            {/* Team & Contacts */}
            <Section title="Team & Contacts">
              <InputRow icon={Users} label="Client Name" value={form.clientName} onChange={v => set('clientName', v)} placeholder="Host/Client" />
              <InputRow icon={Users} label="Internal Owner" value={form.internalEventOwner} onChange={v => set('internalEventOwner', v)} placeholder="Team Member" />
              <InputRow icon={Users} label="Event Captain" value={form.eventCaptain} onChange={v => set('eventCaptain', v)} placeholder="Captain" />
              <InputRow icon={Users} label="Manager on Duty" value={form.managerOnDuty} onChange={v => set('managerOnDuty', v)} placeholder="Manager" border={false} />
            </Section>

            {/* Staffing Needs */}
            <Section title="Staffing Needs">
              <InputRow icon={Users} label="Servers" value={form.serversNeeded} onChange={v => set('serversNeeded', v)} type="number" />
              <InputRow icon={Users} label="Bartenders" value={form.bartendersNeeded} onChange={v => set('bartendersNeeded', v)} type="number" />
              <InputRow icon={Users} label="Cooks" value={form.cooksNeeded} onChange={v => set('cooksNeeded', v)} type="number" />
              <InputRow icon={Users} label="Setup Staff" value={form.setupStaffNeeded} onChange={v => set('setupStaffNeeded', v)} type="number" border={false} />
            </Section>
          </>
        )}

        {/* ... Keep the rest of the tabs exactly as they were ... */}
        {tab === 'Menu' && (
          <>
            <button onClick={() => setMenuItems(p => [...p, { itemName: '', course: '', quantity: '', unit: '', notes: '', sortOrder: p.length, _new: true }])}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-1 h-9">
              <Plus className="h-3.5 w-3.5" /> Add Menu Item
            </button>
            {menuItems.filter(i => !i._deleted).map((item, idx) => (
              <div key={idx} className="card-glass max-w-full overflow-hidden rounded-xl border border-border p-3 space-y-2">
                <div className="flex min-w-0 gap-2">
                  <input value={item.itemName} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, itemName: e.target.value, _dirty:true} : x))} placeholder="Item name *" className="flex-1 px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                  <button onClick={() => setMenuItems(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="shrink-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                  <input value={item.course} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, course: e.target.value, _dirty:true} : x))} placeholder="Course" className="px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                  <input type="number" value={item.quantity} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty:true} : x))} placeholder="Qty" className="px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                  <input value={item.unit} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, unit: e.target.value, _dirty:true} : x))} placeholder="Unit" className="px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                </div>
                <input value={item.notes} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, notes: e.target.value, _dirty:true} : x))} placeholder="Notes" className="w-full px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
              </div>
            ))}
          </>
        )}

        {tab === 'Prep' && (
          <>
            <button onClick={() => setPrepItems(p => [...p, { prepItem: '', quantity: '', unit: '', dueTime: '', assignedStation: '', status: 'pending', sortOrder: p.length, _new: true }])}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-1 h-9">
              <Plus className="h-3.5 w-3.5" /> Add Prep Item
            </button>
            {prepItems.filter(i => !i._deleted).map((item, idx) => (
              <div key={idx} className="card-glass max-w-full overflow-hidden rounded-xl border border-border p-3 space-y-2">
                <div className="flex min-w-0 gap-2">
                  <input value={item.prepItem} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, prepItem: e.target.value, _dirty:true} : x))} placeholder="Prep item *" className="flex-1 px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                  <button onClick={() => setPrepItems(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="shrink-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                  <input type="number" value={item.quantity} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty:true} : x))} placeholder="Qty" className="px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                  <input value={item.unit} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, unit: e.target.value, _dirty:true} : x))} placeholder="Unit" className="px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                  <input type="time" value={item.dueTime} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, dueTime: e.target.value, _dirty:true} : x))} className="px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                </div>
                <input value={item.assignedStation} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, assignedStation: e.target.value, _dirty:true} : x))} placeholder="Assigned station" className="w-full px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
              </div>
            ))}
          </>
        )}

        {tab === 'Timeline' && (
          <>
            <button onClick={() => setTimeline(p => [...p, { time: '', label: '', description: '', sortOrder: p.length, _new: true }])}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-1 h-9">
              <Plus className="h-3.5 w-3.5" /> Add Timeline Item
            </button>
            {timeline.filter(i => !i._deleted).map((item, idx) => (
              <div key={idx} className="flex min-w-0 gap-2 items-start">
                <input type="time" value={item.time} onChange={e => setTimeline(p => p.map((x,i) => i===idx ? {...x, time: e.target.value, _dirty:true} : x))} className="w-20 px-2 py-2 liquid-card rounded-lg text-xs text-foreground shrink-0" />
                <input value={item.label} onChange={e => setTimeline(p => p.map((x,i) => i===idx ? {...x, label: e.target.value, _dirty:true} : x))} placeholder="Label" className="flex-1 px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                <button onClick={() => setTimeline(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="mt-1.5 shrink-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </>
        )}

        {tab === 'Dietary' && (
          <>
            <button onClick={() => setDietary(p => [...p, { guestName: '', restriction: '', severity: 'allergy', menuAdjustment: '', notes: '', _new: true }])}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-1 h-9">
              <Plus className="h-3.5 w-3.5" /> Add Dietary Restriction
            </button>
            {dietary.filter(i => !i._deleted).map((item, idx) => (
              <div key={idx} className="card-glass max-w-full overflow-hidden rounded-xl border border-border p-3 space-y-2">
                <div className="flex min-w-0 gap-2">
                  <input value={item.guestName} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, guestName: e.target.value} : x))} placeholder="Guest name (optional)" className="flex-1 px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                  <button onClick={() => setDietary(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="shrink-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <input value={item.restriction} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, restriction: e.target.value} : x))} placeholder="Restriction *" className="px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                  <select value={item.severity} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, severity: e.target.value} : x))} className="px-2 py-2 liquid-card rounded-lg text-xs text-foreground">
                    {['preference','intolerance','allergy','life-threatening'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
                <input value={item.menuAdjustment} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, menuAdjustment: e.target.value} : x))} placeholder="Menu adjustment" className="w-full px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">General Dietary Notes</label>
              <Textarea field="dietaryNotes" placeholder="General dietary notes for the event" />
            </div>
          </>
        )}

        {tab === 'Equipment' && (
          <>
            <button onClick={() => setEquipment(p => [...p, { equipmentName: '', quantity: 1, notes: '', status: 'needed', _new: true }])}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-1 h-9">
              <Plus className="h-3.5 w-3.5" /> Add Equipment Need
            </button>
            {equipment.filter(i => !i._deleted).map((item, idx) => (
              <div key={idx} className="flex min-w-0 gap-2 items-center">
                <input value={item.equipmentName} onChange={e => setEquipment(p => p.map((x,i) => i===idx ? {...x, equipmentName: e.target.value, _dirty:true} : x))} placeholder="Equipment" className="flex-1 px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                <input type="number" value={item.quantity} onChange={e => setEquipment(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty:true} : x))} placeholder="Qty" className="w-14 px-2 py-2 liquid-card rounded-lg text-xs text-foreground" />
                <button onClick={() => setEquipment(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="shrink-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </>
        )}

        {tab === 'Notes' && (
          <div className="space-y-6">
            <NoteCard label="Prep Notes" value={form.prepNotes} onChange={v => set('prepNotes', v)} placeholder="Prep and production notes" />
            <NoteCard label="Kitchen Notes" value={form.kitchenNotes} onChange={v => set('kitchenNotes', v)} placeholder="Kitchen / firing / plating notes" />
            <NoteCard label="FOH Notes" value={form.fohNotes} onChange={v => set('fohNotes', v)} placeholder="Service / FOH notes" />
            <NoteCard label="Bar Notes" value={form.barNotes} onChange={v => set('barNotes', v)} placeholder="Bar package / beverage notes" />
            <NoteCard label="Setup Notes" value={form.setupNotes} onChange={v => set('setupNotes', v)} placeholder="Room layout / setup requirements" />
            <NoteCard label="Chef Notes" value={form.chefNotes} onChange={v => set('chefNotes', v)} placeholder="Chef review notes" />
            <NoteCard label="Manager Notes (Internal)" value={form.managerNotes} onChange={v => set('managerNotes', v)} placeholder="Internal manager notes, pricing, client communication" />
          </div>
        )}
      </div>

      {/* Sticky bottom action bar */}
      <div
        className="shrink-0 border-t border-border bg-card px-4 py-3 flex gap-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={save}
          disabled={saving || !form.eventName.trim()}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50"
          style={{ border: '1px solid rgba(255,107,0,0.4)', background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save BEO'}
        </button>
        {tab === 'Details' && (
          <button
            type="button"
            onClick={() => { if (form.eventName.trim()) setTab('Menu'); }}
            disabled={!form.eventName.trim()}
            className="flex-1 h-11 rounded-full bg-primary text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
          >
            Menu <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
