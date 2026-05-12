import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Building2, MapPin, Users, Wrench,
  Thermometer, Truck, Shield, Settings, Plus, Trash2, Save, Bell, X, ChevronDown, ChevronUp
} from 'lucide-react';
import SetupProgressCard from '@/components/myrestaurant/SetupProgressCard';
import SectionCard from '@/components/myrestaurant/SectionCard';
import CenteredModal from '@/components/myrestaurant/CenteredModal';

const DEPT_SUGGESTIONS = ['Kitchen', 'FOH', 'Bar', 'Bakery', 'Dish', 'Catering', 'Management', 'Maintenance'];
const EQUIPMENT_CATEGORIES = [
  {
    id: 'sinks', label: 'Sinks',
    types: [
      { value: 'hand-sink', label: 'Hand Sink' },
      { value: '3-compartment-sink', label: '3-Compartment Sink' },
      { value: 'dish-sink', label: 'Dish Sink' },
      { value: 'prep-sink', label: 'Prep Sink' },
    ],
  },
  {
    id: 'dish-machines', label: 'Dish Machines',
    types: [
      { value: 'dish-machine', label: 'Dish Machine' },
      { value: 'glass-washer', label: 'Glass Washer' },
    ],
  },
  {
    id: 'refrigerators', label: 'Refrigerators',
    types: [
      { value: 'walk-in-cooler', label: 'Walk-in Cooler' },
      { value: 'lowboy-cooler', label: 'Low Boy' },
      { value: 'reach-in-cooler', label: 'Upright Reach-in' },
      { value: 'prep-table-cooler', label: 'Prep Table Cooler' },
      { value: 'beer-cooler', label: 'Beer Cooler' },
      { value: 'wine-cooler', label: 'Wine Cooler' },
    ],
  },
  {
    id: 'freezers', label: 'Freezers',
    types: [
      { value: 'walk-in-freezer', label: 'Walk-in Freezer' },
      { value: 'chest-freezer', label: 'Chest Freezer' },
      { value: 'reach-in-freezer', label: 'Upright Reach-in Freezer' },
    ],
  },
  {
    id: 'hot-equipment', label: 'Hot Equipment',
    types: [
      { value: 'fryer', label: 'Fryer' },
      { value: 'flat-top', label: 'Flat Top' },
      { value: 'grill', label: 'Grill' },
      { value: 'oven', label: 'Oven' },
      { value: 'steam-table', label: 'Steam Table' },
      { value: 'hot-holding-cabinet', label: 'Hot Holding Cabinet' },
    ],
  },
  {
    id: 'other', label: 'Other Equipment',
    types: [
      { value: 'ice-machine', label: 'Ice Machine' },
      { value: 'hood-system', label: 'Hood System' },
      { value: 'grease-trap', label: 'Grease Trap' },
      { value: 'hvac', label: 'HVAC' },
      { value: 'water-heater', label: 'Water Heater' },
      { value: 'other', label: 'Other' },
    ],
  },
];
const ALL_EQUIPMENT_TYPES = EQUIPMENT_CATEGORIES.flatMap(c => c.types);
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
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [stations, setStations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [expandedStation, setExpandedStation] = useState(null);
  const [expandedEquipment, setExpandedEquipment] = useState(null);
  const [addingToStation, setAddingToStation] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [itemSearch, setItemSearch] = useState('');
  const emptyForm = { name: '', equipmentType: '', station: '', modelNumber: '', serialNumber: '', vendorId: '', vendorName: '', requiresTemperatureLog: false, requiresCleaningChecklist: false, requiresMaintenanceChecklist: false, inInventory: false, isActive: true, item_ids: [] };
  const [form, setForm] = useState(emptyForm);

  const reload = async () => {
    const [eq, st, vd, pi] = await Promise.all([
      base44.entities.Equipment.list('-updated_date', 200),
      base44.entities.Station.list('name', 100),
      base44.entities.Vendor.list('name', 200).catch(() => []),
      base44.entities.PurchasedItem.list('itemName', 500).catch(() => []),
    ]);
    setEquipment(eq);
    setStations(st);
    setVendors(vd);
    setPurchasedItems(pi.filter(i => i.active !== false));
  };
  useEffect(() => { reload(); }, []);

  const typeLabel = (v) => ALL_EQUIPMENT_TYPES.find(t => t.value === v)?.label || v;
  const COLD_TYPES = ['walk-in-cooler','walk-in-freezer','reach-in-cooler','reach-in-freezer','prep-table-cooler','lowboy-cooler','beer-cooler','wine-cooler','chest-freezer'];

  const save = async () => {
    if (!form.name.trim() || !form.equipmentType) return;
    if (editingId) {
      await base44.entities.Equipment.update(editingId, form);
      setEditingId(null);
    } else {
      await base44.entities.Equipment.create(form);
      setAddingToStation(null);
    }
    setForm(emptyForm);
    reload();
  };

  const cancelForm = () => { setEditingId(null); setAddingToStation(null); setForm(emptyForm); };

  const startEdit = (item) => {
    setEditingId(item.id);
    setAddingToStation(null);
    setExpandedEquipment(null);
    setForm({ name: item.name, equipmentType: item.equipmentType, station: item.station || '', modelNumber: item.modelNumber || '', serialNumber: item.serialNumber || '', vendorId: item.vendorId || '', vendorName: item.vendorName || '', requiresTemperatureLog: !!item.requiresTemperatureLog, requiresCleaningChecklist: !!item.requiresCleaningChecklist, requiresMaintenanceChecklist: !!item.requiresMaintenanceChecklist, inInventory: !!item.inInventory, isActive: item.isActive !== false, item_ids: item.item_ids || [] });
    setExpandedStation(item.station || '__unassigned');
  };

  const del = async (id) => {
    if (!confirm('Delete this equipment?')) return;
    await base44.entities.Equipment.delete(id);
    if (expandedEquipment === id) setExpandedEquipment(null);
    reload();
  };

  const toggleField = async (item, field) => {
    await base44.entities.Equipment.update(item.id, { [field]: !item[field] });
    reload();
  };

  const addItemToEquipment = async (equip, itemId) => {
    const existing = equip.item_ids || [];
    if (existing.includes(itemId)) return;
    await base44.entities.Equipment.update(equip.id, { item_ids: [...existing, itemId] });
    setItemSearch('');
    reload();
  };

  const removeItemFromEquipment = async (equip, itemId) => {
    await base44.entities.Equipment.update(equip.id, { item_ids: (equip.item_ids || []).filter(id => id !== itemId) });
    reload();
  };

  const EquipmentForm = ({ stationName }) => (
    <div className="space-y-3 mt-2 p-3 bg-background border border-border rounded-xl">
      <input autoFocus value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Equipment name *"
        className="w-full px-3 py-2 card-glass border border-border rounded-lg text-sm text-foreground" />
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">Type *</label>
        {EQUIPMENT_CATEGORIES.map(cat => (
          <div key={cat.id}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 mb-1">{cat.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.types.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm(p => ({ ...p, equipmentType: t.value }))}
                  className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-all ${
                    form.equipmentType === t.value ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={form.modelNumber} onChange={e => setForm(p => ({ ...p, modelNumber: e.target.value }))} placeholder="Model #"
          className="w-full px-3 py-2 card-glass border border-border rounded-lg text-sm text-foreground" />
        <input value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} placeholder="Serial #"
          className="w-full px-3 py-2 card-glass border border-border rounded-lg text-sm text-foreground" />
      </div>
      <select value={form.vendorId} onChange={e => {
        const vendor = vendors.find(v => v.id === e.target.value);
        setForm(p => ({ ...p, vendorId: e.target.value, vendorName: vendor?.name || '' }));
      }} className="w-full px-3 py-2 card-glass border border-border rounded-lg text-sm text-foreground">
        <option value="">Select Vendor (optional)</option>
        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
      </select>
      <div className="space-y-1.5">
        {[
          ['requiresTemperatureLog', '🌡️ Requires Temperature Log'],
          ['requiresCleaningChecklist', '🧹 Requires Cleaning Checklist'],
          ['requiresMaintenanceChecklist', '🔧 Requires Maintenance Checklist'],
          ['inInventory', '📦 Tracked in Inventory'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
            {label}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="flex-1 btn-primary text-sm">Save</button>
        <button onClick={cancelForm} className="flex-1 btn-secondary text-sm">Cancel</button>
      </div>
    </div>
  );

  // Group equipment by station
  const stationNames = stations.map(s => s.name);
  const equipmentByStation = {};
  equipment.forEach(item => {
    const key = item.station && stationNames.includes(item.station) ? item.station : '__unassigned';
    if (!equipmentByStation[key]) equipmentByStation[key] = [];
    equipmentByStation[key].push(item);
  });

  const stationGroups = [
    ...stations.map(s => ({ key: s.name, label: s.name, department: s.department, items: equipmentByStation[s.name] || [] })),
    ...(equipmentByStation['__unassigned']?.length ? [{ key: '__unassigned', label: 'Unassigned', department: null, items: equipmentByStation['__unassigned'] }] : []),
  ];

  const summaryTags = (items) => {
    const counts = {};
    items.forEach(i => {
      const cat = EQUIPMENT_CATEGORIES.find(c => c.types.some(t => t.value === i.equipmentType));
      const key = cat?.label || 'Other';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([k, v]) => `${v}× ${k}`);
  };

  return (
    <CenteredModal title="Stations & Equipment" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-4">Each station shows its assigned equipment. Equipment can require temperature logs, cleaning checklists, and be tracked in inventory.</p>

      {stationGroups.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No stations yet. <button onClick={() => { onClose(); navigate('/stations'); }} className="text-primary font-bold hover:underline">Add stations first →</button></p>
        </div>
      )}

      <div className="space-y-2">
        {stationGroups.map(group => {
          const isExpanded = expandedStation === group.key;
          const hasAlerts = group.items.some(i => i.requiresTemperatureLog || i.requiresCleaningChecklist);
          const tags = summaryTags(group.items);
          return (
            <div key={group.key} className="border border-border rounded-xl overflow-hidden">
              {/* Station Header */}
              <button
                onClick={() => setExpandedStation(isExpanded ? null : group.key)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/50 transition-all text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{group.label}</p>
                    {group.department && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">{group.department}</span>}
                    {hasAlerts && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">⚠ Compliance</span>}
                  </div>
                  {tags.length > 0 ? (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{tags.join(' · ')}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">No equipment assigned</p>
                  )}
                </div>
                <span className="text-muted-foreground text-lg">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {/* Expanded Equipment List */}
              {isExpanded && (
                <div className="bg-background/60 px-3 pb-3 space-y-2">
                  {group.items.map(item => {
                    const isDetailOpen = expandedEquipment === item.id;
                    const linkedItems = (item.item_ids || [])
                      .map(id => purchasedItems.find(p => p.id === id))
                      .filter(Boolean);
                    const filteredSearch = itemSearch.trim()
                      ? purchasedItems
                          .filter(p =>
                            p.itemName?.toLowerCase().includes(itemSearch.toLowerCase()) &&
                            !(item.item_ids || []).includes(p.id)
                          )
                          .slice(0, 8)
                      : [];

                    return (
                      <div key={item.id}>
                        {editingId === item.id ? (
                          <EquipmentForm stationName={group.key !== '__unassigned' ? group.key : ''} />
                        ) : (
                          <div className="card-glass border border-border/50 rounded-xl mt-2 overflow-hidden">
                            {/* Clickable summary row */}
                            <button
                              onClick={() => {
                                setExpandedEquipment(isDetailOpen ? null : item.id);
                                setItemSearch('');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                                  {item.inInventory && (
                                    <span className="shrink-0 text-[9px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full font-bold">📦 Inv</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {typeLabel(item.equipmentType)}{item.modelNumber ? ` · ${item.modelNumber}` : ''}
                                  {linkedItems.length > 0 && <span className="ml-1 text-primary/70">{linkedItems.length} item{linkedItems.length !== 1 ? 's' : ''}</span>}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={e => { e.stopPropagation(); startEdit(item); }}
                                  className="text-xs font-bold text-primary px-2 py-1 rounded hover:bg-primary/10"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); del(item.id); }}
                                  className="text-red-400 p-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                {isDetailOpen
                                  ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                                  : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                }
                              </div>
                            </button>

                            {/* Expanded detail panel */}
                            {isDetailOpen && (
                              <div className="border-t border-border/30 px-3 pb-3 pt-3 space-y-4 bg-black/20">

                                {/* Toggle grid */}
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Settings</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {[
                                      { field: 'inInventory',                label: 'In Inventory',  icon: '📦', activeColor: 'border-green-500/50 bg-green-500/10 text-green-300' },
                                      { field: 'requiresTemperatureLog',      label: 'Temp Log',      icon: '🌡️', activeColor: 'border-sky-500/50 bg-sky-500/10 text-sky-300' },
                                      { field: 'requiresCleaningChecklist',   label: 'Cleaning',      icon: '🧹', activeColor: 'border-purple-500/50 bg-purple-500/10 text-purple-300' },
                                      { field: 'requiresMaintenanceChecklist',label: 'Maintenance',   icon: '🔧', activeColor: 'border-amber-500/50 bg-amber-500/10 text-amber-300' },
                                    ].map(({ field, label, icon, activeColor }) => {
                                      const isOn = !!item[field];
                                      return (
                                        <button
                                          key={field}
                                          onClick={() => toggleField(item, field)}
                                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-bold transition-all active:scale-[0.97] ${isOn ? activeColor : 'border-border/40 bg-transparent text-muted-foreground/60 hover:border-border/70'}`}
                                        >
                                          <span>{icon}</span>
                                          <span className="flex-1 text-left">{label}</span>
                                          {/* pill toggle */}
                                          <span className={`relative h-4 w-7 rounded-full border transition-all shrink-0 ${isOn ? 'border-current bg-current/30' : 'border-border/50 bg-transparent'}`}>
                                            <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${isOn ? 'left-3.5' : 'left-0.5'}`} />
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Items stored in this equipment — only when inInventory is on */}
                                {item.inInventory && (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Items stored here</p>

                                    {linkedItems.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {linkedItems.map(pi => (
                                          <span key={pi.id} className="flex items-center gap-1 text-xs bg-primary/10 border border-primary/25 text-foreground rounded-full px-2.5 py-1 font-semibold">
                                            {pi.itemName}
                                            <button
                                              onClick={() => removeItemFromEquipment(item, pi.id)}
                                              className="text-muted-foreground hover:text-red-400 transition-colors ml-0.5"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="relative">
                                      <input
                                        value={itemSearch}
                                        onChange={e => setItemSearch(e.target.value)}
                                        placeholder="Search items to add…"
                                        className="w-full pl-3 pr-3 py-2 card-glass border border-border/50 rounded-lg text-xs text-foreground"
                                      />
                                      {filteredSearch.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-2xl z-20 max-h-44 overflow-y-auto">
                                          {filteredSearch.map(pi => (
                                            <button
                                              key={pi.id}
                                              onClick={() => addItemToEquipment(item, pi.id)}
                                              className="w-full text-left px-3 py-2 text-xs hover:bg-muted/60 transition-colors flex items-center justify-between gap-2"
                                            >
                                              <span className="font-semibold text-foreground">{pi.itemName}</span>
                                              <span className="text-muted-foreground text-[10px] capitalize">{pi.category || ''}</span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {linkedItems.length === 0 && !itemSearch && (
                                      <p className="text-[11px] text-muted-foreground/60 italic">Search above to link inventory items stored here.</p>
                                    )}
                                  </div>
                                )}

                                {/* Vendor + cold-unit temp link */}
                                {item.vendorName && (
                                  <p className="text-[10px] text-muted-foreground">Service vendor: <span className="text-blue-300 font-semibold">{item.vendorName}</span></p>
                                )}
                                {COLD_TYPES.includes(item.equipmentType) && (
                                  <button
                                    onClick={() => { onClose(); navigate('/temperature-dashboard'); }}
                                    className="w-full text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-1.5 rounded-lg font-bold border border-cyan-500/20 hover:bg-cyan-500/15 transition-all text-left"
                                  >
                                    View Temperature History →
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add equipment to this station */}
                  {addingToStation === group.key ? (
                    <EquipmentForm stationName={group.key !== '__unassigned' ? group.key : ''} />
                  ) : (
                    editingId === null && (
                      <button
                        onClick={() => { setAddingToStation(group.key); setForm({ ...emptyForm, station: group.key !== '__unassigned' ? group.key : '' }); }}
                        className="mt-2 w-full h-8 rounded-lg border border-dashed border-border text-xs font-bold text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Equipment to {group.key !== '__unassigned' ? group.label : 'Station'}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {stations.length > 0 && !addingToStation && !editingId && (
        <button onClick={() => { onClose(); navigate('/stations'); }} className="mt-4 w-full btn-secondary text-sm flex items-center justify-center gap-2">
          <Settings className="h-4 w-4" /> Manage Stations
        </button>
      )}
    </CenteredModal>
  );
}

function FoodSafetyModal({ onClose }) {
  const [form, setForm] = useState({
    coolingTwoHourTarget: 70, coolingSixHourTarget: 41,
    coolingRequiresCorrectiveAction: true, coolingRequiresManagerReview: false,
    coolerMin: 34, coolerMax: 41, freezerMin: -10, freezerMax: 0,
    fridgeRequiresCorrectiveAction: true, fridgeRequiresManagerReview: false,
    hotHoldingMin: 135, hotReheatTarget: 165,
    hotRequiresCorrectiveAction: true, hotRequiresManagerReview: false,
  });
  const [saved, setSaved] = useState(false);
  const [existingId, setExistingId] = useState(null);

  useEffect(() => {
    base44.entities.FoodSafetySettings.filter({ key: 'global' }).then(results => {
      if (results.length > 0) { setForm(p => ({ ...p, ...results[0] })); setExistingId(results[0].id); setSaved(true); }
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
      <label className="text-xs font-bold text-muted-foreground block mb-1">{label}{unit ? ` (°${unit})` : ''}</label>
      <input type="number" value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: parseFloat(e.target.value) }))}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
    </div>
  );

  const Toggle = ({ field, label }) => (
    <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
      <input type="checkbox" checked={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.checked }))} className="rounded" />
      {label}
    </label>
  );

  return (
    <CenteredModal title="Food Safety Settings" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">Configure defaults for all 3 temperature log categories.</p>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Cooling Logs</p>
          <p className="text-[10px] text-muted-foreground">Food must cool 135F to 70F (2 hrs) to 41F (6 hrs total)</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="2-Hour Max" field="coolingTwoHourTarget" unit="F" />
            <Field label="6-Hour Max" field="coolingSixHourTarget" unit="F" />
          </div>
          <div className="flex gap-4">
            <Toggle field="coolingRequiresCorrectiveAction" label="Corrective Action Required" />
            <Toggle field="coolingRequiresManagerReview" label="Manager Review" />
          </div>
        </div>
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Refrigerators / Freezers</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Cooler Min" field="coolerMin" unit="F" />
            <Field label="Cooler Max" field="coolerMax" unit="F" />
            <Field label="Freezer Min" field="freezerMin" unit="F" />
            <Field label="Freezer Max" field="freezerMax" unit="F" />
          </div>
          <div className="flex gap-4">
            <Toggle field="fridgeRequiresCorrectiveAction" label="Corrective Action Required" />
            <Toggle field="fridgeRequiresManagerReview" label="Manager Review" />
          </div>
        </div>
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Hot Holding</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Holding Minimum" field="hotHoldingMin" unit="F" />
            <Field label="Reheat Target" field="hotReheatTarget" unit="F" />
          </div>
          <div className="flex gap-4">
            <Toggle field="hotRequiresCorrectiveAction" label="Corrective Action Required" />
            <Toggle field="hotRequiresManagerReview" label="Manager Review" />
          </div>
        </div>
        <button onClick={save} className="w-full btn-primary text-sm flex items-center justify-center gap-2">
          <Save className="h-4 w-4" /> {saved ? 'Update Settings' : 'Save Food Safety Settings'}
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

function EmergencyContactsModal({ onClose }) {
  const [form, setForm] = useState({ primaryName: '', primaryPhone: '', altName: '', altPhone: '', healthDept: '', fireDept: '', police: '', poison: '', gasCompany: '', electricCompany: '', plumber: '', hvac: '' });
  const [existingId, setExistingId] = useState(null);

  useEffect(() => {
    base44.entities.Settings.filter({ key: 'emergency_contacts' }).then(results => {
      if (results.length > 0) { try { setForm(p => ({ ...p, ...JSON.parse(results[0].value || '{}') })); setExistingId(results[0].id); } catch {} }
    });
  }, []);

  const save = async () => {
    const val = JSON.stringify(form);
    if (existingId) { await base44.entities.Settings.update(existingId, { value: val }); }
    else { await base44.entities.Settings.create({ key: 'emergency_contacts', value: val }); }
    onClose();
  };

  const Field = ({ label, field }) => (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{label}</label>
      <input value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={label}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
    </div>
  );

  return (
    <CenteredModal title="Emergency Contacts" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Internal Contacts</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Primary Contact Name" field="primaryName" />
            <Field label="Primary Phone" field="primaryPhone" />
            <Field label="Alternate Contact" field="altName" />
            <Field label="Alternate Phone" field="altPhone" />
          </div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Emergency Services</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Health Department" field="healthDept" />
            <Field label="Fire Department" field="fireDept" />
            <Field label="Police" field="police" />
            <Field label="Poison Control" field="poison" />
          </div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Utilities and Vendors</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Gas Company" field="gasCompany" />
            <Field label="Electric Company" field="electricCompany" />
            <Field label="Plumber" field="plumber" />
            <Field label="HVAC" field="hvac" />
          </div>
        </div>
        <button onClick={save} className="w-full btn-primary text-sm flex items-center justify-center gap-2">
          <Save className="h-4 w-4" /> Save Contacts
        </button>
      </div>
    </CenteredModal>
  );
}

function OperatingInfoModal({ onClose }) {
  const [form, setForm] = useState({ hoursMonFri: '', hoursSat: '', hoursSun: '', seatingCapacity: '', employeeCount: '', licenseNumber: '', permitNumber: '', lastHealthInspection: '', nextHealthInspection: '', liquorLicense: '', taxId: '', openDate: '' });
  const [existingId, setExistingId] = useState(null);

  useEffect(() => {
    base44.entities.Settings.filter({ key: 'operating_info' }).then(results => {
      if (results.length > 0) { try { setForm(p => ({ ...p, ...JSON.parse(results[0].value || '{}') })); setExistingId(results[0].id); } catch {} }
    });
  }, []);

  const save = async () => {
    const val = JSON.stringify(form);
    if (existingId) { await base44.entities.Settings.update(existingId, { value: val }); }
    else { await base44.entities.Settings.create({ key: 'operating_info', value: val }); }
    onClose();
  };

  const Field = ({ label, field, type = 'text' }) => (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{label}</label>
      <input type={type} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={label}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
    </div>
  );

  return (
    <CenteredModal title="Operating Information" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Hours of Operation</p>
          <div className="space-y-2">
            <Field label="Mon - Fri Hours" field="hoursMonFri" />
            <Field label="Saturday Hours" field="hoursSat" />
            <Field label="Sunday Hours" field="hoursSun" />
          </div>
        </div>
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-green-400 uppercase tracking-widest">Capacity and Staffing</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Seating Capacity" field="seatingCapacity" />
            <Field label="Employee Count" field="employeeCount" />
            <Field label="Open Date" field="openDate" type="date" />
          </div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Licenses and Permits</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Business License #" field="licenseNumber" />
            <Field label="Health Permit #" field="permitNumber" />
            <Field label="Liquor License" field="liquorLicense" />
            <Field label="Tax ID" field="taxId" />
            <Field label="Last Inspection" field="lastHealthInspection" type="date" />
            <Field label="Next Inspection" field="nextHealthInspection" type="date" />
          </div>
        </div>
        <button onClick={save} className="w-full btn-primary text-sm flex items-center justify-center gap-2">
          <Save className="h-4 w-4" /> Save Operating Info
        </button>
      </div>
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
    const [depts, areas, stations, jobCodes, equipment, vendors, qrcodes, foodSafety, profileSettings] = await Promise.all([
      base44.entities.Department.list('sortOrder', 100).catch(() => []),
      base44.entities.Area.list('sortOrder', 100).catch(() => []),
      base44.entities.Station.list().catch(() => []),
      base44.entities.JobCode.list().catch(() => []),
      base44.entities.Equipment.list('-updated_date', 100).catch(() => []),
      base44.entities.Vendor.list().catch(() => []),
      base44.entities.QRCode.list().catch(() => []),
      base44.entities.FoodSafetySettings.filter({ key: 'global' }).catch(() => []),
      base44.entities.Settings.filter({ key: 'restaurant_name' }).catch(() => []),
    ]);
    setCounts({ depts: depts.length, areas: areas.length, stations: stations.length, jobCodes: jobCodes.length, equipment: equipment.length, vendors: vendors.length, qrcodes: qrcodes.length, foodSafety: foodSafety.length, profile: profileSettings.filter(s => s.value && s.value.trim()).length });
  };

  useEffect(() => { loadCounts(); }, []);

  const setupSections = [
    { id: 'profile', label: 'Restaurant Profile', complete: counts.profile > 0 },
    { id: 'departments', label: 'Departments', complete: counts.depts > 0 },
    { id: 'jobCodes', label: 'Job Codes', complete: counts.jobCodes > 0 },
    { id: 'layout', label: 'Restaurant Layout', complete: counts.areas > 0 && counts.stations > 0 },
    { id: 'foodSafety', label: 'Food Safety', complete: counts.foodSafety > 0 },
    { id: 'vendors', label: 'Vendors', complete: counts.vendors > 0 },
  ];

  const renderModal = () => {
    switch (modal) {
      case 'profile': return <ProfileModal onClose={() => setModal(null)} onSaved={loadCounts} />;
      case 'departments': return <DepartmentModal onClose={() => { setModal(null); loadCounts(); }} />;
      case 'areas':
      case 'layout': navigate('/restaurant-layout'); setModal(null); return null;
      case 'stations': navigate('/restaurant-layout'); setModal(null); return null;
      case 'jobCodes': return (
        <CenteredModal title="Job Codes" onClose={() => setModal(null)}>
          <p className="text-xs text-muted-foreground mb-3">Manage job codes on the dedicated Job Codes page.</p>
          <button onClick={() => { setModal(null); navigate('/job-codes'); }} className="w-full btn-primary text-sm">Go to Job Codes</button>
        </CenteredModal>
      );
      case 'equipment': navigate('/restaurant-layout'); setModal(null); return null;
      case 'foodSafety': return <FoodSafetyModal onClose={() => { setModal(null); loadCounts(); }} />;
      case 'vendors': return <VendorModal onClose={() => { setModal(null); loadCounts(); }} />;
      case 'qrcodes': return <QRCodeModal onClose={() => { setModal(null); loadCounts(); }} />;
      case 'emergencyContacts': return <EmergencyContactsModal onClose={() => { setModal(null); loadCounts(); }} />;
      case 'operatingInfo': return <OperatingInfoModal onClose={() => { setModal(null); loadCounts(); }} />;
      default: return null;
    }
  };

  return (
    <div className="pb-28 lg:pb-0">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/30">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">My Restaurant</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your restaurant profile, locations, equipment and key information.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/app/overview')} className="h-8 px-3 rounded-lg border border-border card-glass text-xs font-bold text-foreground flex items-center gap-1.5 hover:bg-muted active:scale-95">
            Today's Plan
          </button>
          <button onClick={() => navigate('/notifications')} className="h-8 w-8 rounded-lg border border-border card-glass flex items-center justify-center hover:bg-muted active:scale-95">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden mb-4">
        <h1 className="text-2xl font-extrabold text-foreground">My Restaurant</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Setup and configuration center</p>
      </div>

      {/* Desktop 2-col Card Grid */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4 lg:px-8 lg:py-6">
        {/* Restaurant Profile */}
        <div className="card-glass border border-border/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Restaurant Profile</p>
            <button onClick={() => setModal('profile')} className="h-7 px-2.5 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/80 active:scale-95">Edit</button>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">My Restaurant</p>
              <p className="text-xs text-muted-foreground">Click Edit to add restaurant details</p>
            </div>
          </div>
        </div>

        {/* Restaurant Layout */}
        <div className="card-glass border border-border/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Restaurant Layout</p>
            <button onClick={() => navigate('/restaurant-layout')} className="h-7 px-2.5 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/80 active:scale-95">Manage</button>
          </div>
          <div className="space-y-1.5">
            {[{label:'Areas',count:counts.areas||0},{label:'Stations',count:counts.stations||0},{label:'Equipment',count:counts.equipment||0}].map(i=>(
              <div key={i.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{i.label}</span><span className="font-bold text-foreground">{i.count}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/restaurant-layout')} className="mt-3 text-[10px] font-bold text-primary hover:underline">Open Layout →</button>
        </div>

        {/* Food Safety */}
        <div className="card-glass border border-border/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Food Safety Systems</p>
            <button onClick={() => setModal('foodSafety')} className="h-7 px-2.5 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/80 active:scale-95">Manage</button>
          </div>
          <div className="space-y-1.5">
            {['Temperature Monitoring','Cooling Logs','HACCP Plan','Allergen Tracking'].map(s=>(
              <div key={s} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{s}</span>
                <span className={`font-bold ${counts.foodSafety > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>{counts.foodSafety > 0 ? 'Enabled' : 'Not Set'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="card-glass border border-border/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Emergency Contacts</p>
            <button onClick={() => setModal('emergencyContacts')} className="h-7 px-2.5 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/80 active:scale-95">Edit</button>
          </div>
          <div className="space-y-2">
            {['Primary Contact','Alternate Contact','Health Department','Fire Department','Utilities'].map(c=>(
              <div key={c} className="flex items-center gap-2 text-xs">
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0"><Users className="h-3 w-3 text-muted-foreground" /></div>
                <span className="text-muted-foreground flex-1">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Operating Info */}
        <div className="card-glass border border-border/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Key Operating Information</p>
            <button onClick={() => setModal('operatingInfo')} className="h-7 px-2.5 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/80 active:scale-95">Edit</button>
          </div>
          <div className="space-y-1.5">
            {['Operating Hours','Employee Count','Seating Capacity','License Number','Last Health Inspection'].map(k=>(
              <div key={k} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{k}</span><span className="font-bold text-foreground">—</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <SetupProgressCard sections={setupSections} onContinue={s => setModal(s.id)} />

        <div className="mb-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Restaurant Basics</p>
          <div className="space-y-2">
            <SectionCard icon={Building2} title="Restaurant Profile" description="Name, address, concept type, locations" complete={counts.profile > 0} needsSetup={!counts.profile} onClick={() => setModal('profile')} />
            <SectionCard icon={Building2} title="Operating Info" description="Hours, capacity, licenses, permits, health inspection" onClick={() => setModal('operatingInfo')} />
            <SectionCard icon={Shield} title="Emergency Contacts" description="Primary, health dept, fire, utilities, plumber" onClick={() => setModal('emergencyContacts')} />
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Organization</p>
          <div className="space-y-2">
            <SectionCard icon={Settings} title="Departments" description="Kitchen, FOH, Bar, Management..." count={counts.depts} complete={counts.depts > 0} needsSetup={!counts.depts} onClick={() => setModal('departments')} />
            <SectionCard icon={Users} title="Job Codes" description="Cook, server, bartender, manager..." count={counts.jobCodes} complete={counts.jobCodes > 0} needsSetup={!counts.jobCodes} onClick={() => setModal('jobCodes')} />
            <SectionCard icon={Users} title="Team Structure" description="People hierarchy and role ownership" onClick={() => navigate('/people')} />
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Physical Layout</p>
          <div className="space-y-2">
            <SectionCard icon={MapPin} title="Restaurant Layout" description="Areas, stations, and equipment hierarchy" count={counts.areas} complete={counts.areas > 0 && counts.stations > 0} needsSetup={!counts.areas} onClick={() => navigate('/restaurant-layout')} />
            <SectionCard icon={Thermometer} title="Food Safety Settings" description="Temp targets, PPM ranges, corrective actions" complete={counts.foodSafety > 0} needsSetup={!counts.foodSafety} onClick={() => setModal('foodSafety')} />
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Contacts</p>
          <div className="space-y-2">
            <SectionCard icon={Truck} title="Vendor Directory" description="Food vendors, repair contacts, service numbers" count={counts.vendors} complete={counts.vendors > 0} needsSetup={!counts.vendors} onClick={() => setModal('vendors')} />
          </div>
        </div>
      </div>

      {renderModal()}
    </div>
  );
}

export const hideBase44Index = true;
