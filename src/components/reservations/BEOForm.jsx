import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus, Trash2 } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const EVENT_TYPES = ['private-dining','banquet','buyout','catering','tasting','meeting','wedding','corporate','holiday-party','other'];
const SERVICE_STYLES = ['plated','buffet','family-style','passed-apps','stations','reception','bar-package','pickup-catering','drop-off-catering','other'];
const STATUSES = ['inquiry','tentative','confirmed','in-production','ready','completed','cancelled'];

const TABS = ['Details','Menu','Prep','Timeline','Dietary','Equipment','Notes'];

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
    if (!form.eventName.trim()) return;
    setSaving(true);
    let beoId = beo?.id;
    if (beoId) {
      await base44.entities.BEO.update(beoId, form);
    } else {
      const created = await base44.entities.BEO.create(form);
      beoId = created.id;
    }
    // Save sub-entities
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
    setSaving(false);
    onSave();
  };

  const Input = ({ field, placeholder, type = 'text', half }) => (
    <input
      type={type}
      value={form[field]}
      onChange={e => set(field, e.target.value)}
      placeholder={placeholder}
      className={`${half ? '' : 'w-full'} px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground`}
    />
  );

  const Textarea = ({ field, placeholder, rows = 2 }) => (
    <textarea
      value={form[field]}
      onChange={e => set(field, e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none"
    />
  );

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <h2 className="flex-1 text-sm font-extrabold text-foreground">{beo ? 'Edit BEO' : 'New BEO'}</h2>
        <button onClick={save} disabled={saving} className="btn-primary text-xs px-4 h-8">{saving ? 'Saving…' : 'Save'}</button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0 overflow-x-auto border-b border-border bg-card shrink-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 px-3 py-2 text-xs font-bold border-b-2 transition-all ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>{t}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-10">
        {tab === 'Details' && (
          <>
            <Input field="eventName" placeholder="Event name *" />
            <div className="grid grid-cols-2 gap-2">
              <Input field="eventDate" type="date" placeholder="Event date" />
              <div className="flex gap-1">
                <Input field="startTime" type="time" half />
                <Input field="endTime" type="time" half />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input field="guestCount" type="number" placeholder="Guest count" />
              <Input field="room" placeholder="Room / area" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={form.eventType} onChange={e => set('eventType', e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                {EVENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.replace(/-/g, ' ')}</option>)}
              </select>
              <select value={form.serviceStyle} onChange={e => set('serviceStyle', e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                {SERVICE_STYLES.map(s => <option key={s} value={s} className="capitalize">{s.replace(/-/g, ' ')}</option>)}
              </select>
            </div>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.replace(/-/g, ' ')}</option>)}
            </select>
            <Input field="clientName" placeholder="Client / host name" />
            <Input field="internalEventOwner" placeholder="Internal event owner" />
            <div className="grid grid-cols-2 gap-2">
              <Input field="eventCaptain" placeholder="Event captain" />
              <Input field="managerOnDuty" placeholder="Manager on duty" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input field="serversNeeded" type="number" placeholder="Servers needed" />
              <Input field="bartendersNeeded" type="number" placeholder="Bartenders needed" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input field="cooksNeeded" type="number" placeholder="Cooks needed" />
              <Input field="setupStaffNeeded" type="number" placeholder="Setup staff needed" />
            </div>
          </>
        )}

        {tab === 'Menu' && (
          <>
            <button onClick={() => setMenuItems(p => [...p, { itemName: '', course: '', quantity: '', unit: '', notes: '', sortOrder: p.length, _new: true }])}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-1 h-9">
              <Plus className="h-3.5 w-3.5" /> Add Menu Item
            </button>
            {menuItems.filter(i => !i._deleted).map((item, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={item.itemName} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, itemName: e.target.value, _dirty:true} : x))} placeholder="Item name *" className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <button onClick={() => setMenuItems(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <input value={item.course} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, course: e.target.value, _dirty:true} : x))} placeholder="Course" className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <input type="number" value={item.quantity} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty:true} : x))} placeholder="Qty" className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <input value={item.unit} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, unit: e.target.value, _dirty:true} : x))} placeholder="Unit" className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                </div>
                <input value={item.notes} onChange={e => setMenuItems(p => p.map((x,i) => i===idx ? {...x, notes: e.target.value, _dirty:true} : x))} placeholder="Notes" className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
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
              <div key={idx} className="bg-card border border-border rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={item.prepItem} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, prepItem: e.target.value, _dirty:true} : x))} placeholder="Prep item *" className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <button onClick={() => setPrepItems(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <input type="number" value={item.quantity} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty:true} : x))} placeholder="Qty" className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <input value={item.unit} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, unit: e.target.value, _dirty:true} : x))} placeholder="Unit" className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <input type="time" value={item.dueTime} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, dueTime: e.target.value, _dirty:true} : x))} className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                </div>
                <input value={item.assignedStation} onChange={e => setPrepItems(p => p.map((x,i) => i===idx ? {...x, assignedStation: e.target.value, _dirty:true} : x))} placeholder="Assigned station" className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
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
              <div key={idx} className="flex gap-2 items-start">
                <input type="time" value={item.time} onChange={e => setTimeline(p => p.map((x,i) => i===idx ? {...x, time: e.target.value, _dirty:true} : x))} className="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground shrink-0" />
                <input value={item.label} onChange={e => setTimeline(p => p.map((x,i) => i===idx ? {...x, label: e.target.value, _dirty:true} : x))} placeholder="Label" className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                <button onClick={() => setTimeline(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="text-red-400 mt-1.5"><Trash2 className="h-3.5 w-3.5" /></button>
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
              <div key={idx} className="bg-card border border-border rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={item.guestName} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, guestName: e.target.value} : x))} placeholder="Guest name (optional)" className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <button onClick={() => setDietary(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <input value={item.restriction} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, restriction: e.target.value} : x))} placeholder="Restriction *" className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                  <select value={item.severity} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, severity: e.target.value} : x))} className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground">
                    {['preference','intolerance','allergy','life-threatening'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
                <input value={item.menuAdjustment} onChange={e => setDietary(p => p.map((x,i) => i===idx ? {...x, menuAdjustment: e.target.value} : x))} placeholder="Menu adjustment" className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
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
              <div key={idx} className="flex gap-2 items-center">
                <input value={item.equipmentName} onChange={e => setEquipment(p => p.map((x,i) => i===idx ? {...x, equipmentName: e.target.value, _dirty:true} : x))} placeholder="Equipment" className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                <input type="number" value={item.quantity} onChange={e => setEquipment(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty:true} : x))} placeholder="Qty" className="w-14 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                <button onClick={() => setEquipment(p => p.map((x,i) => i===idx ? {...x, _deleted:true} : x))} className="text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
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
    </div>
  );
}