import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Building2, MapPin, Users, Wrench, QrCode, LayoutTemplate,
  Thermometer, Truck, Shield, Settings, Plus, Trash2, Save
} from 'lucide-react';
import SetupProgressCard from '@/components/myrestaurant/SetupProgressCard';
import SectionCard from '@/components/myrestaurant/SectionCard';
import CenteredModal from '@/components/myrestaurant/CenteredModal';

const DEPT_SUGGESTIONS = ['Kitchen', 'FOH', 'Bar', 'Bakery', 'Dish', 'Catering', 'Management', 'Maintenance'];
const EQUIPMENT_TYPES = [
  { value: 'dish-machine', label: 'Dish Machine' },
  { value: '3-compartment-sink', label: '3-Compartment Sink' },
  { value: 'walk-in-cooler', label: 'Walk-in Cooler' },
  { value: 'walk-in-freezer', label: 'Walk-in Freezer' },
  { value: 'reach-in-cooler', label: 'Reach-in Cooler' },
  { value: 'reach-in-freezer', label: 'Reach-in Freezer' },
  { value: 'fryer', label: 'Fryer' },
  { value: 'flat-top', label: 'Flat Top' },
  { value: 'grill', label: 'Grill' },
  { value: 'oven', label: 'Oven' },
  { value: 'ice-machine', label: 'Ice Machine' },
  { value: 'steam-table', label: 'Steam Table' },
  { value: 'hot-holding-cabinet', label: 'Hot Holding Cabinet' },
  { value: 'prep-table-cooler', label: 'Prep Table Cooler' },
  { value: 'lowboy-cooler', label: 'Lowboy Cooler' },
  { value: 'beer-cooler', label: 'Beer Cooler' },
  { value: 'wine-cooler', label: 'Wine Cooler' },
  { value: 'soda-gun', label: 'Soda Gun' },
  { value: 'glass-washer', label: 'Glass Washer' },
  { value: 'hood-system', label: 'Hood System' },
  { value: 'grease-trap', label: 'Grease Trap' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'water-heater', label: 'Water Heater' },
  { value: 'hand-sink', label: 'Hand Sink' },
  { value: 'other', label: 'Other' },
];
const VENDOR_CATEGORIES = [
  'Food Vendor','Beverage Vendor','Linen','Chemicals','Dish Machine Service',
  'Refrigeration Repair','Plumbing','Electrical','Hood Cleaning','Pest Control',
  'POS Support','HVAC','General Maintenance','Other'
];
const QR_ITEM_TYPES = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'station', label: 'Station' },
  { value: 'area', label: 'Area' },
  { value: 'temp-log', label: 'Temp Log' },
  { value: 'cleaning-checklist', label: 'Cleaning Checklist' },
  { value: 'prep-list', label: 'Prep List' },
  { value: 'side-work', label: 'Side Work' },
  { value: 'recipe', label: 'Recipe' },
];

function DepartmentModal({ onClose }) {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { base44.entities.Department.list('sortOrder', 50).then(setItems); }, []);

  const save = async () => {
    if (!name.trim()) return;
    await base44.entities.Department.create({ name: name.trim(), isActive: true });
    setName(''); setAdding(false);
    base44.entities.Department.list('sortOrder', 50).then(setItems);
  };
  const del = async (id) => { await base44.entities.Department.delete(id); setItems(p => p.filter(i => i.id !== id)); };

  return (
    <CenteredModal title="Departments" onClose={onClose}>
      <div className="flex flex-wrap gap-2 mb-4">
        {DEPT_SUGGESTIONS.map(s => (
          <button key={s} onClick={() => setName(s)} className="text-xs btn-secondary px-2 py-1">{s}</button>
        ))}
      </div>
      <div className="space-y-2 mb-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5">
            <span className="flex-1 text-sm font-semibold text-foreground">{item.name}</span>
            <button onClick={() => del(item.id)} className="text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="flex gap-2">
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Department name"
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <button onClick={save} className="btn-primary text-sm px-3">Save</button>
          <button onClick={() => setAdding(false)} className="btn-secondary text-sm px-3">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full btn-primary text-sm flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Add Department
        </button>
      )}
    </CenteredModal>
  );
}

function AreaModal({ onClose }) {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', department: '' });

  useEffect(() => { base44.entities.Area.list('sortOrder', 100).then(setItems); }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    await base44.entities.Area.create({ ...form, isActive: true });
    setForm({ name: '', department: '' }); setAdding(false);
    base44.entities.Area.list('sortOrder', 100).then(setItems);
  };
  const del = async (id) => { await base44.entities.Area.delete(id); setItems(p => p.filter(i => i.id !== id)); };

  return (
    <CenteredModal title="Areas" onClose={onClose}>
      <div className="space-y-2 mb-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{item.name}</p>
              {item.department && <p className="text-xs text-muted-foreground">{item.department}</p>}
            </div>
            <button onClick={() => del(item.id)} className="text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="space-y-2">
          <input autoFocus value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Area name (e.g. Line, Prep, Dining Room)"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="Department (optional)"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 btn-primary text-sm">Save</button>
            <button onClick={() => setAdding(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full btn-primary text-sm flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Add Area
        </button>
      )}
    </CenteredModal>
  );
}

function EquipmentModal({ onClose }) {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', equipmentType: '', department: '', area: '', station: '', modelNumber: '', serialNumber: '', requiresTemperatureLog: false, requiresCleaningChecklist: false, requiresMaintenanceChecklist: false, isActive: true });

  useEffect(() => { base44.entities.Equipment.list('-updated_date', 100).then(setItems); }, []);

  const save = async () => {
    if (!form.name.trim() || !form.equipmentType) return;
    await base44.entities.Equipment.create(form);
    setAdding(false);
    setForm({ name: '', equipmentType: '', department: '', area: '', station: '', modelNumber: '', serialNumber: '', requiresTemperatureLog: false, requiresCleaningChecklist: false, requiresMaintenanceChecklist: false, isActive: true });
    base44.entities.Equipment.list('-updated_date', 100).then(setItems);
  };
  const del = async (id) => { await base44.entities.Equipment.delete(id); setItems(p => p.filter(i => i.id !== id)); };
  const typeLabel = (v) => EQUIPMENT_TYPES.find(t => t.value === v)?.label || v;

  return (
    <CenteredModal title="Equipment and Assets" onClose={onClose}>
      {items.length === 0 && !adding && (
        <div className="text-center py-6 mb-4">
          <p className="text-sm text-muted-foreground">No equipment added yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Start by adding your dish machine, walk-in cooler, 3-compartment sink, ice machine, and main cooking equipment.</p>
        </div>
      )}
      <div className="space-y-2 mb-4">
        {items.map(item => (
          <div key={item.id} className="bg-background border border-border rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{typeLabel(item.equipmentType)}{item.station ? ` · ${item.station}` : ''}</p>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.isActive ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </span>
              <button onClick={() => del(item.id)} className="text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {item.requiresTemperatureLog && <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-bold">Temp Log</span>}
              {item.requiresCleaningChecklist && <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-bold">Cleaning</span>}
              {item.requiresMaintenanceChecklist && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">Maintenance</span>}
            </div>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="space-y-3">
          <input autoFocus value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Equipment name *"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <select value={form.equipmentType} onChange={e => setForm(p => ({ ...p, equipmentType: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
            <option value="">Select type *</option>
            {EQUIPMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="Department"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            <input value={form.station} onChange={e => setForm(p => ({ ...p, station: e.target.value }))} placeholder="Station"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.modelNumber} onChange={e => setForm(p => ({ ...p, modelNumber: e.target.value }))} placeholder="Model #"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            <input value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} placeholder="Serial #"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div className="space-y-1.5">
            {[
              ['requiresTemperatureLog', 'Requires Temperature Log'],
              ['requiresCleaningChecklist', 'Requires Cleaning Checklist'],
              ['requiresMaintenanceChecklist', 'Requires Maintenance Checklist'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
                {label}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 btn-primary text-sm">Save Equipment</button>
            <button onClick={() => setAdding(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full btn-primary text-sm flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Add Equipment
        </button>
      )}
    </CenteredModal>
  );
}

function FoodSafetyModal({ onClose }) {
  const [form, setForm] = useState({ coldHoldingMax: 41, hotHoldingMin: 135, walkInCoolerMin: 34, walkInCoolerMax: 41, walkInFreezerMin: -10, walkInFreezerMax: 0, dishMachineFinalRinseTarget: 180, sanitizerMinPPM: 100, sanitizerMaxPPM: 200, requiresCorrectiveAction: true, requiresManagerReview: false });
  const [saved, setSaved] = useState(false);
  const [existingId, setExistingId] = useState(null);

  useEffect(() => {
    base44.entities.FoodSafetySettings.filter({ key: 'global' }).then(results => {
      if (results.length > 0) { setForm(results[0]); setExistingId(results[0].id); setSaved(true); }
    });
  }, []);

  const save = async () => {
    if (existingId) {
      await base44.entities.FoodSafetySettings.update(existingId, form);
    } else {
      const created = await base44.entities.FoodSafetySettings.create({ ...form, key: 'global' });
      setExistingId(created.id);
    }
    setSaved(true);
  };

  const Field = ({ label, field, unit }) => (
    <div>
      <label className="text-xs font-bold text-secondary-text block mb-1">{label}{unit ? ` (${unit})` : ''}</label>
      <input type="number" value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: parseFloat(e.target.value) }))}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
    </div>
  );

  return (
    <CenteredModal title="Food Safety Settings" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">These values are used as defaults for temperature log templates and compliance checks.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cold Holding Max" field="coldHoldingMax" unit="F" />
          <Field label="Hot Holding Min" field="hotHoldingMin" unit="F" />
          <Field label="Walk-in Cooler Min" field="walkInCoolerMin" unit="F" />
          <Field label="Walk-in Cooler Max" field="walkInCoolerMax" unit="F" />
          <Field label="Walk-in Freezer Min" field="walkInFreezerMin" unit="F" />
          <Field label="Walk-in Freezer Max" field="walkInFreezerMax" unit="F" />
          <Field label="Dish Machine Rinse" field="dishMachineFinalRinseTarget" unit="F" />
          <Field label="Sanitizer Min PPM" field="sanitizerMinPPM" />
          <Field label="Sanitizer Max PPM" field="sanitizerMaxPPM" />
        </div>
        <div className="space-y-2">
          {[['requiresCorrectiveAction', 'Requires Corrective Action'], ['requiresManagerReview', 'Requires Manager Review']].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
              {label}
            </label>
          ))}
        </div>
        <button onClick={save} className="w-full btn-primary text-sm flex items-center justify-center gap-2">
          <Save className="h-4 w-4" /> {saved ? 'Update Settings' : 'Save Settings'}
        </button>
      </div>
    </CenteredModal>
  );
}

function VendorModal({ onClose }) {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', contactPerson: '', phone: '', email: '', emergencyPhone: '', notes: '', isActive: true });

  useEffect(() => { base44.entities.Vendor.list('-updated_date', 100).then(setItems); }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    await base44.entities.Vendor.create(form);
    setAdding(false);
    setForm({ name: '', category: '', contactPerson: '', phone: '', email: '', emergencyPhone: '', notes: '', isActive: true });
    base44.entities.Vendor.list('-updated_date', 100).then(setItems);
  };
  const del = async (id) => { await base44.entities.Vendor.delete(id); setItems(p => p.filter(i => i.id !== id)); };

  return (
    <CenteredModal title="Vendor Directory" onClose={onClose}>
      <div className="space-y-2 mb-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5">
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.category}{item.contactPerson ? ` · ${item.contactPerson}` : ''}</p>
            </div>
            <button onClick={() => del(item.id)} className="text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="space-y-2">
          <input autoFocus value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Vendor name *"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
            <option value="">Select category</option>
            {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} placeholder="Contact name"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <input value={form.emergencyPhone} onChange={e => setForm(p => ({ ...p, emergencyPhone: e.target.value }))} placeholder="Emergency phone"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 btn-primary text-sm">Save Vendor</button>
            <button onClick={() => setAdding(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full btn-primary text-sm flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Add Vendor
        </button>
      )}
    </CenteredModal>
  );
}

function QRCodeModal({ onClose }) {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', linkedItemType: '', linkedItemName: '', location: '', isActive: true });

  useEffect(() => { base44.entities.QRCode.list('-updated_date', 100).then(setItems); }, []);

  const save = async () => {
    if (!form.name.trim() || !form.linkedItemType) return;
    await base44.entities.QRCode.create(form);
    setAdding(false);
    setForm({ name: '', linkedItemType: '', linkedItemName: '', location: '', isActive: true });
    base44.entities.QRCode.list('-updated_date', 100).then(setItems);
  };
  const del = async (id) => { await base44.entities.QRCode.delete(id); setItems(p => p.filter(i => i.id !== id)); };

  return (
    <CenteredModal title="QR Codes" onClose={onClose}>
      {items.length === 0 && !adding && (
        <div className="text-center py-6 mb-4">
          <p className="text-sm text-muted-foreground">No QR codes yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Example: Walk-in cooler QR opens temp log. Dish machine QR opens cleaning checklist.</p>
        </div>
      )}
      <div className="space-y-2 mb-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5">
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.linkedItemType}{item.location ? ` · ${item.location}` : ''}</p>
            </div>
            <button onClick={() => del(item.id)} className="text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="space-y-2">
          <input autoFocus value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="QR code name *"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <select value={form.linkedItemType} onChange={e => setForm(p => ({ ...p, linkedItemType: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
            <option value="">Linked to *</option>
            {QR_ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input value={form.linkedItemName} onChange={e => setForm(p => ({ ...p, linkedItemName: e.target.value }))} placeholder="Linked item name"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Physical location"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 btn-primary text-sm">Save QR Code</button>
            <button onClick={() => setAdding(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full btn-primary text-sm flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Add QR Code
        </button>
      )}
    </CenteredModal>
  );
}

function ProfileModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', address: '', phone: '', conceptType: '', locationCount: 1 });
  const [existingId, setExistingId] = useState(null);

  useEffect(() => {
    base44.entities.Settings.filter({ key: 'restaurant_profile' }).then(async results => {
      if (results.length > 0) {
        try { setForm(JSON.parse(results[0].value || '{}')); setExistingId(results[0].id); } catch {}
      } else {
        // Pre-fill name if available
        const nameResults = await base44.entities.Settings.filter({ key: 'restaurant_name' });
        if (nameResults.length > 0) setForm(p => ({ ...p, name: nameResults[0].value || '' }));
      }
    });
  }, []);

  const save = async () => {
    const val = JSON.stringify(form);
    if (existingId) {
      await base44.entities.Settings.update(existingId, { key: 'restaurant_profile', value: val });
    } else {
      await base44.entities.Settings.create({ key: 'restaurant_profile', value: val });
    }
    const nameResults = await base44.entities.Settings.filter({ key: 'restaurant_name' });
    if (nameResults.length > 0) {
      await base44.entities.Settings.update(nameResults[0].id, { value: form.name });
    } else {
      await base44.entities.Settings.create({ key: 'restaurant_name', value: form.name });
    }
    onSaved?.();
    onClose();
  };

  return (
    <CenteredModal title="Restaurant Profile" onClose={onClose}>
      <div className="space-y-3">
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Restaurant name *"
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
        <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Address"
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          <input value={form.locationCount} type="number" onChange={e => setForm(p => ({ ...p, locationCount: parseInt(e.target.value) }))} placeholder="Locations"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
        </div>
        <input value={form.conceptType} onChange={e => setForm(p => ({ ...p, conceptType: e.target.value }))} placeholder="Concept type (e.g. Casual Dining, QSR)"
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
        <button onClick={save} className="w-full btn-primary text-sm flex items-center justify-center gap-2">
          <Save className="h-4 w-4" /> Save Profile
        </button>
      </div>
    </CenteredModal>
  );
}

export default function MyRestaurant() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [modal, setModal] = useState(null);

  const loadCounts = async () => {
    const [depts, areas, stations, jobCodes, equipment, vendors, qrcodes, foodSafety] = await Promise.all([
      base44.entities.Department.list('sortOrder', 100).catch(() => []),
      base44.entities.Area.list('sortOrder', 100).catch(() => []),
      base44.entities.Station.list().catch(() => []),
      base44.entities.JobCode.list().catch(() => []),
      base44.entities.Equipment.list('-updated_date', 100).catch(() => []),
      base44.entities.Vendor.list().catch(() => []),
      base44.entities.QRCode.list().catch(() => []),
      base44.entities.FoodSafetySettings.filter({ key: 'global' }).catch(() => []),
    ]);
    setCounts({ depts: depts.length, areas: areas.length, stations: stations.length, jobCodes: jobCodes.length, equipment: equipment.length, vendors: vendors.length, qrcodes: qrcodes.length, foodSafety: foodSafety.length });
  };

  useEffect(() => { loadCounts(); }, []);

  const setupSections = [
    { id: 'profile', label: 'Restaurant Profile', complete: false },
    { id: 'departments', label: 'Departments', complete: counts.depts > 0 },
    { id: 'areas', label: 'Areas', complete: counts.areas > 0 },
    { id: 'stations', label: 'Stations', complete: counts.stations > 0 },
    { id: 'jobCodes', label: 'Job Codes', complete: counts.jobCodes > 0 },
    { id: 'equipment', label: 'Equipment', complete: counts.equipment > 0 },
    { id: 'foodSafety', label: 'Food Safety', complete: counts.foodSafety > 0 },
    { id: 'vendors', label: 'Vendors', complete: counts.vendors > 0 },
  ];

  const renderModal = () => {
    switch (modal) {
      case 'profile': return <ProfileModal onClose={() => setModal(null)} onSaved={loadCounts} />;
      case 'departments': return <DepartmentModal onClose={() => { setModal(null); loadCounts(); }} />;
      case 'areas': return <AreaModal onClose={() => { setModal(null); loadCounts(); }} />;
      case 'stations': return (
        <CenteredModal title="Stations" onClose={() => setModal(null)}>
          <p className="text-xs text-muted-foreground mb-3">Manage stations on the dedicated Stations page.</p>
          <button onClick={() => { setModal(null); navigate('/stations'); }} className="w-full btn-primary text-sm">Go to Stations</button>
        </CenteredModal>
      );
      case 'jobCodes': return (
        <CenteredModal title="Job Codes" onClose={() => setModal(null)}>
          <p className="text-xs text-muted-foreground mb-3">Manage job codes on the dedicated Job Codes page.</p>
          <button onClick={() => { setModal(null); navigate('/job-codes'); }} className="w-full btn-primary text-sm">Go to Job Codes</button>
        </CenteredModal>
      );
      case 'equipment': return <EquipmentModal onClose={() => { setModal(null); loadCounts(); }} />;
      case 'foodSafety': return <FoodSafetyModal onClose={() => { setModal(null); loadCounts(); }} />;
      case 'vendors': return <VendorModal onClose={() => { setModal(null); loadCounts(); }} />;
      case 'qrcodes': return <QRCodeModal onClose={() => { setModal(null); loadCounts(); }} />;
      default: return null;
    }
  };

  return (
    <div className="pb-28">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-foreground">My Restaurant</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Setup and configuration center</p>
      </div>

      <SetupProgressCard sections={setupSections} onContinue={s => setModal(s.id)} />

      <div className="mb-5">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Restaurant Setup</p>
        <div className="space-y-2">
          <SectionCard icon={Building2} title="Restaurant Profile" description="Name, address, concept type, locations" complete={false} needsSetup onClick={() => setModal('profile')} />
          <SectionCard icon={Settings} title="Departments" description="Kitchen, FOH, Bar, Management..." count={counts.depts} complete={counts.depts > 0} needsSetup={!counts.depts} onClick={() => setModal('departments')} />
          <SectionCard icon={MapPin} title="Areas" description="Line, prep area, dining room, bar..." count={counts.areas} complete={counts.areas > 0} needsSetup={!counts.areas} onClick={() => setModal('areas')} />
          <SectionCard icon={Building2} title="Stations" description="Grill, fry, expo, server alley..." count={counts.stations} complete={counts.stations > 0} needsSetup={!counts.stations} onClick={() => setModal('stations')} />
          <SectionCard icon={Users} title="Job Codes" description="Cook, server, bartender, manager..." count={counts.jobCodes} complete={counts.jobCodes > 0} needsSetup={!counts.jobCodes} onClick={() => setModal('jobCodes')} />
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Equipment and Compliance</p>
        <div className="space-y-2">
          <SectionCard icon={Wrench} title="Equipment and Assets" description="Dish machine, coolers, fryers, ovens..." count={counts.equipment} complete={counts.equipment > 0} needsSetup={!counts.equipment} onClick={() => setModal('equipment')} />
          <SectionCard icon={Thermometer} title="Food Safety Settings" description="Temp targets, PPM ranges, corrective actions" complete={counts.foodSafety > 0} needsSetup={!counts.foodSafety} onClick={() => setModal('foodSafety')} />
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">People</p>
        <div className="space-y-2">
          <SectionCard icon={Users} title="Team Directory" description="View and manage your team members" onClick={() => navigate('/team')} />
          <SectionCard icon={Shield} title="Job Code Assignments" description="Assign job codes to stations" onClick={() => navigate('/job-codes')} />
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Vendors and Contacts</p>
        <div className="space-y-2">
          <SectionCard icon={Truck} title="Vendor Directory" description="Food vendors, repair contacts, emergency numbers" count={counts.vendors} complete={counts.vendors > 0} needsSetup={!counts.vendors} onClick={() => setModal('vendors')} />
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">QR Codes</p>
        <div className="space-y-2">
          <SectionCard icon={QrCode} title="QR Code Setup" description="Link QR codes to equipment, stations, and logs" count={counts.qrcodes} complete={counts.qrcodes > 0} onClick={() => setModal('qrcodes')} />
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Template Setup</p>
        <div className="space-y-2">
          <SectionCard icon={LayoutTemplate} title="Prep Templates" description="Create and manage prep list templates" onClick={() => navigate('/prep-templates')} />
          <SectionCard icon={LayoutTemplate} title="Side Work Templates" description="Create and manage side work templates" onClick={() => navigate('/side-work-templates')} />
          <SectionCard icon={LayoutTemplate} title="Cleaning Templates" description="Create and manage cleaning checklists" onClick={() => navigate('/cleaning-templates')} />
          <SectionCard icon={LayoutTemplate} title="Temperature Log Templates" description="Create and manage temp log templates" onClick={() => navigate('/temp-log-templates')} />
          <SectionCard icon={LayoutTemplate} title="Waste Templates" description="Create and manage waste log templates" onClick={() => navigate('/waste-templates')} />
          <SectionCard icon={LayoutTemplate} title="86 Templates" description="Create and manage 86 log templates" onClick={() => navigate('/86-templates')} />
        </div>
      </div>

      {renderModal()}
    </div>
  );
}

export const hideBase44Index = true;