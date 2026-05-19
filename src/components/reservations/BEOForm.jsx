import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ChevronLeft, Calendar, Users, ConciergeBell, ArrowRight } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { toast } from 'sonner';

const EVENT_TYPES = ['private-dining','banquet','buyout','catering','tasting','meeting','wedding','corporate','holiday-party','other'];
const SERVICE_STYLES = ['plated','buffet','family-style','passed-apps','stations','reception','bar-package','pickup-catering','drop-off-catering','other'];
const STATUSES = ['inquiry','tentative','confirmed','in-production','ready','completed','cancelled'];

const TABS = ['Details','Menu','Prep','Timeline','Dietary','Equipment','Notes'];

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="rounded-2xl border border-border bg-card overflow-hidden">
    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/40">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <span className="text-xs font-bold text-foreground tracking-wide">{title}</span>
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

const FieldLabel = ({ children }) => (
  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{children}</label>
);

export default function BEOForm({ beo, onSave, onClose }) {
  const [tab, setTab] = useState('Details');
  const [form, setForm] = useState({
    eventName: '', eventDate: new Date().toISOString().split('T')[0],
    startTime: '', endTime: '', guestCount: '', room: '', area: '',
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

  const inputCls = 'w-full min-w-0 px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40';
  const selectCls = 'w-full min-w-0 px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/40';

  const Input = ({ field, placeholder, type = 'text' }) => (
    <input
      type={type}
      value={form[field]}
      onChange={e => set(field, e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  );

  const Textarea = ({ field, placeholder, rows = 2 }) => (
    <textarea
      value={form[field]}
      onChange={e => set(field, e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full min-w-0 px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 resize-none"
    />
  );

  return (
    <div className="fixed inset-0 z-[1100] flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="flex-1 text-center text-sm font-extrabold text-foreground">
          {beo ? 'Edit Event' : 'New Event'}
        </h2>
        <div className="h-9 w-9 shrink-0" />
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
      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4">
        {tab === 'Details' && (
          <>
            {/* Event Basics */}
            <SectionCard icon={Calendar} title="Event Basics">
              <div>
                <FieldLabel>Event Name</FieldLabel>
                <Input field="eventName" placeholder="e.g. Smith Wedding Reception" />
              </div>
              <div>
                <FieldLabel>Date</FieldLabel>
                <Input field="eventDate" type="date" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Start Time</FieldLabel>
                  <Input field="startTime" type="time" />
                </div>
                <div>
                  <FieldLabel>End Time</FieldLabel>
                  <Input field="endTime" type="time" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Guest Count</FieldLabel>
                  <Input field="guestCount" type="number" placeholder="0" />
                </div>
                <div>
                  <FieldLabel>Room / Area</FieldLabel>
                  <Input field="room" placeholder="e.g. Main Hall" />
                </div>
              </div>
            </SectionCard>

            {/* Service Details */}
            <SectionCard icon={ConciergeBell} title="Service Details">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Event Type</FieldLabel>
                  <select value={form.eventType} onChange={e => set('eventType', e.target.value)} className={selectCls}>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/-/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className={selectCls}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <FieldLabel>Service Style</FieldLabel>
                <select value={form.serviceStyle} onChange={e => set('serviceStyle', e.target.value)} className={selectCls}>
                  {SERVICE_STYLES.map(s => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
                </select>
              </div>
            </SectionCard>

            {/* Team & Contacts */}
            <SectionCard icon={Users} title="Team & Contacts">
              <div>
                <FieldLabel>Client / Host Name</FieldLabel>
                <Input field="clientName" placeholder="e.g. Jane Smith" />
              </div>
              <div>
                <FieldLabel>Internal Event Owner</FieldLabel>
                <Input field="internalEventOwner" placeholder="Team member name" />
              </div>
              <div>
                <FieldLabel>Event Captain</FieldLabel>
                <Input field="eventCaptain" placeholder="FOH captain" />
              </div>
              <div>
                <FieldLabel>Manager on Duty</FieldLabel>
                <Input field="managerOnDuty" placeholder="Manager name" />
              </div>
            </SectionCard>

            {/* Staffing */}
            <SectionCard icon={Users} title="Staffing">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Servers</FieldLabel>
                  <Input field="serversNeeded" type="number" placeholder="0" />
                </div>
                <div>
                  <FieldLabel>Bartenders</FieldLabel>
                  <Input field="bartendersNeeded" type="number" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Cooks</FieldLabel>
                  <Input field="cooksNeeded" type="number" placeholder="0" />
                </div>
                <div>
                  <FieldLabel>Setup Staff</FieldLabel>
                  <Input field="setupStaffNeeded" type="number" placeholder="0" />
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {tab === 'Menu' && (
          <>
            <button onClick={() => setMenuItems(p => [...p, { itemName: '', course: '', quantity: '', unit: '', notes: '', sortOrder: p.length, _new: true }])}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-1 h-9">
              <Plus className="h-3.5 w-3.5" /> Add Menu Item
            </button>
            {menuItems.filter(i => !i._deleted).map((item, idx) => (
              <div key={idx} className="card-glass max-w-full overflow-hidden rounded-xl border border-border p-3 space-y-2">
                <div className="flex min-w-0 gap-2">
                  <input value={item.itemName} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, itemName: e.target.value, _dirty:true} : x))} placeholder="Item name *" className="flex-1 px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <button onClick={() => setMenuItems(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="shrink-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                  <input value={item.course} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, course: e.target.value, _dirty:true} : x))} placeholder="Course" className="px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <input type="number" value={item.quantity} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty:true} : x))} placeholder="Qty" className="px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <input value={item.unit} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, unit: e.target.value, _dirty:true} : x))} placeholder="Unit" className="px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                </div>
                <input value={item.notes} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, notes: e.target.value, _dirty:true} : x))} placeholder="Notes" className="w-full px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
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
                  <input value={item.prepItem} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, prepItem: e.target.value, _dirty:true} : x))} placeholder="Prep item *" className="flex-1 px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <button onClick={() => setPrepItems(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="shrink-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                  <input type="number" value={item.quantity} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty:true} : x))} placeholder="Qty" className="px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <input value={item.unit} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, unit: e.target.value, _dirty:true} : x))} placeholder="Unit" className="px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <input type="time" value={item.dueTime} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, dueTime: e.target.value, _dirty:true} : x))} className="px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                </div>
                <input value={item.assignedStation} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, assignedStation: e.target.value, _dirty:true} : x))} placeholder="Assigned station" className="w-full px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
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
                <input type="time" value={item.time} onChange={e => setTimeline(p => p.map((x,i) => i===idx ? {...x, time: e.target.value, _dirty:true} : x))} className="w-20 px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground shrink-0" />
                <input value={item.label} onChange={e => setTimeline(p => p.map((x,i) => i===idx ? {...x, label: e.target.value, _dirty:true} : x))} placeholder="Label" className="flex-1 px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
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
                  <input value={item.guestName} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, guestName: e.target.value} : x))} placeholder="Guest name (optional)" className="flex-1 px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <button onClick={() => setDietary(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="shrink-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <input value={item.restriction} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, restriction: e.target.value} : x))} placeholder="Restriction *" className="px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <select value={item.severity} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, severity: e.target.value} : x))} className="px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground">
                    {['preference','intolerance','allergy','life-threatening'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
                <input value={item.menuAdjustment} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, menuAdjustment: e.target.value} : x))} placeholder="Menu adjustment" className="w-full px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
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
                <input value={item.equipmentName} onChange={e => setEquipment(p => p.map((x,i) => i===idx ? {...x, equipmentName: e.target.value, _dirty:true} : x))} placeholder="Equipment" className="flex-1 px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                <input type="number" value={item.quantity} onChange={e => setEquipment(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty:true} : x))} placeholder="Qty" className="w-14 px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground" />
                <button onClick={() => setEquipment(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="shrink-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </>
        )}

        {tab === 'Notes' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">Prep Notes</label>
              <Textarea field="prepNotes" placeholder="Prep and production notes" rows={3} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">Kitchen Notes</label>
              <Textarea field="kitchenNotes" placeholder="Kitchen / firing / plating notes" rows={3} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">FOH Notes</label>
              <Textarea field="fohNotes" placeholder="Service / FOH notes" rows={3} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">Bar Notes</label>
              <Textarea field="barNotes" placeholder="Bar package / beverage notes" rows={3} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">Setup Notes</label>
              <Textarea field="setupNotes" placeholder="Room layout / setup requirements" rows={3} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">Chef Notes</label>
              <Textarea field="chefNotes" placeholder="Chef review notes" rows={2} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-red-400 block mb-1">Manager Notes (Internal)</label>
              <Textarea field="managerNotes" placeholder="Internal manager notes, pricing, client communication" rows={3} />
            </div>
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
          className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-foreground disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={() => { if (form.eventName.trim()) setTab('Menu'); }}
          disabled={!form.eventName.trim()}
          className="flex-1 h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
        >
          Continue to Menu <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
