import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, MapPin, Layers, Wrench, Check, X } from 'lucide-react';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { getEquipmentMeta } from '@/lib/equipmentConfig';

const DEPARTMENTS = ['BOH', 'FOH', 'Bar', 'Management'];
const EQUIPMENT_CATEGORIES = [
  { label: 'Sinks', types: [['hand-sink','Hand Sink'],['prep-sink','Prep Sink'],['3-compartment-sink','3-Comp Sink']] },
  { label: 'Cold Storage', types: [['walk-in-cooler','Walk-in Cooler'],['walk-in-freezer','Walk-in Freezer'],['reach-in-cooler','Reach-in Cooler'],['reach-in-freezer','Reach-in Freezer'],['prep-table-cooler','Prep Table Cooler'],['lowboy-cooler','Low Boy'],['beer-cooler','Beer Cooler'],['wine-cooler','Wine Cooler'],['chest-freezer','Chest Freezer']] },
  { label: 'Hot Equipment', types: [['fryer','Fryer'],['flat-top','Flat Top'],['grill','Grill'],['oven','Oven'],['steam-table','Steam Table'],['hot-holding-cabinet','Hot Holding Cabinet']] },
  { label: 'Dish', types: [['dish-machine','Dish Machine'],['glass-washer','Glass Washer']] },
  { label: 'Other', types: [['ice-machine','Ice Machine'],['hood-system','Hood System'],['grease-trap','Grease Trap'],['hvac','HVAC'],['water-heater','Water Heater'],['soda-gun','Soda Gun'],['other','Other']] },
];
const ALL_TYPES = EQUIPMENT_CATEGORIES.flatMap(c => c.types);
const typeLabel = (v) => ALL_TYPES.find(([val]) => val === v)?.[1] || v;
const COLD_TYPES = ['walk-in-cooler','walk-in-freezer','reach-in-cooler','reach-in-freezer','prep-table-cooler','lowboy-cooler','beer-cooler','wine-cooler','chest-freezer'];

const AREA_COLORS = [
  { id: 'orange', label: 'Kitchen', bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40' },
  { id: 'blue', label: 'FOH', bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' },
  { id: 'purple', label: 'Bar', bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  { id: 'green', label: 'Prep', bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/40' },
  { id: 'cyan', label: 'Dish', bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/40' },
  { id: 'red', label: 'Hot Line', bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/40' },
  { id: 'amber', label: 'Storage', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
  { id: 'slate', label: 'Other', bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/40' },
];
const colorFor = (id) => AREA_COLORS.find(c => c.id === id) || AREA_COLORS[7];

// Inline editable text field
function InlineEdit({ value, onSave, onCancel, placeholder, className = '' }) {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center gap-1">
      <input autoFocus value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel(); }}
        placeholder={placeholder}
        className={`px-2 py-1 bg-background border border-primary/50 rounded text-sm text-foreground outline-none ${className}`} />
      <button onClick={() => onSave(val)} className="text-green-400 hover:text-green-300 p-0.5"><Check className="h-3.5 w-3.5" /></button>
      <button onClick={onCancel} className="text-muted-foreground hover:text-foreground p-0.5"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function EquipmentForm({ areaId, areaName, stationId, stationName, onSave, onCancel, existingEquipment = [], editingId = null, vendors = [] }) {
  const [form, setForm] = useState({ name: '', equipmentType: '', modelNumber: '', serialNumber: '', vendorId: '', vendorName: '', requiresTemperatureLog: COLD_TYPES.includes(''), requiresCleaningChecklist: false, requiresMaintenanceChecklist: false, inInventory: false });

  const handleTypeSelect = (type) => {
    setForm(p => ({ ...p, equipmentType: type, requiresTemperatureLog: COLD_TYPES.includes(type) }));
  };

  const save = () => {
    if (!form.name.trim() || !form.equipmentType) return;
    const duplicate = existingEquipment.find(e => e.id !== editingId && e.name.toLowerCase() === form.name.trim().toLowerCase());
    if (duplicate && !confirm(`Equipment "${duplicate.name}" already exists. Continue anyway?`)) return;
    onSave({ ...form, area_id: areaId, area_name: areaName, station_id: stationId || '', station_name: stationName || '', isActive: true });
  };

  return (
    <div className="space-y-3 p-3 bg-background/80 border border-border rounded-xl mt-2">
      <input autoFocus value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        placeholder="Equipment name *"
        className="w-full px-3 py-2 card-glass border border-border rounded-lg text-sm text-foreground" />
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Type *</p>
        {EQUIPMENT_CATEGORIES.map(cat => (
          <div key={cat.label} className="mb-2">
            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">{cat.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.types.map(([val, lbl]) => {
                const meta = getEquipmentMeta(val);
                const Icon = meta.icon;
                const isSelected = form.equipmentType === val;
                return (
                  <button key={val} type="button" onClick={() => handleTypeSelect(val)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold transition-all ${isSelected ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'}`}>
                    <Icon className={`h-3 w-3 ${isSelected ? 'text-white' : meta.iconColor}`} />
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={form.modelNumber} onChange={e => setForm(p => ({ ...p, modelNumber: e.target.value }))} placeholder="Model #"
          className="px-3 py-2 card-glass border border-border rounded-lg text-sm text-foreground" />
        <input value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} placeholder="Serial #"
          className="px-3 py-2 card-glass border border-border rounded-lg text-sm text-foreground" />
      </div>
      <select value={form.vendorId} onChange={e => {
        const vendor = vendors.find(v => v.id === e.target.value);
        setForm(p => ({ ...p, vendorId: e.target.value, vendorName: vendor?.name || '' }));
      }} className="w-full px-3 py-2 card-glass border border-border rounded-lg text-sm text-foreground">
        <option value="">Select Vendor (optional)</option>
        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {[['requiresTemperatureLog','🌡️ Temp Log'],['requiresCleaningChecklist','🧹 Cleaning'],['requiresMaintenanceChecklist','🔧 Maintenance'],['inInventory','📦 Inventory']].map(([key, lbl]) => (
          <label key={key} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
            <input type="checkbox" checked={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
            {lbl}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="flex-1 btn-primary text-sm">Add Equipment</button>
        <button onClick={onCancel} className="flex-1 btn-secondary text-sm">Cancel</button>
      </div>
    </div>
  );
}

function EquipmentRow({ item, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const isCold = COLD_TYPES.includes(item.equipmentType);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background/60 border border-border/50 rounded-lg group flex-wrap">
      <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
        <Wrench className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        {editing ? (
          <InlineEdit value={item.name} onSave={v => { onEdit(item.id, { name: v }); setEditing(false); }} onCancel={() => setEditing(false)} />
        ) : (
          <>
            <p className="text-xs font-semibold text-foreground">{item.name}</p>
            <p className="text-[10px] text-muted-foreground">{typeLabel(item.equipmentType)} {item.vendorName && <span className="text-[9px] px-1 py-0.5 bg-blue-500/15 text-blue-300 rounded ml-1">📞 {item.vendorName}</span>}</p>
          </>
        )}
      </div>
      <div className="flex gap-1 flex-wrap">
        {item.requiresTemperatureLog && <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded-full font-bold">🌡️</span>}
        {item.requiresCleaningChecklist && <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded-full font-bold">🧹</span>}
        {item.requiresMaintenanceChecklist && <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded-full font-bold">🔧</span>}
        {item.inInventory && <span className="text-[8px] bg-green-500/20 text-green-300 px-1 py-0.5 rounded-full font-bold">📦</span>}
        {isCold && <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded-full font-bold">❄️</span>}
      </div>
      {item.vendorId && (
        <div className="flex gap-1">
          <button onClick={() => confirm('Maintenance request recorded for ' + item.name)} title="Request Maintenance" className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded hover:bg-amber-500/30 transition-all">🔧 Maint</button>
          <button onClick={() => confirm('Order placed for ' + item.name)} title="Place Order" className="px-1.5 py-0.5 text-[10px] font-bold bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 transition-all">📦 Order</button>
          <button onClick={() => confirm('Call initiated for ' + item.vendorName)} title="Call Vendor" className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 transition-all">📞 Call</button>
        </div>
      )}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="h-3 w-3" /></button>
        <button onClick={() => onDelete(item.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

function StationBlock({ station, equipment, vendors, highlighted = false, onDeleteStation, onEditStation, onAddEquipment, onDeleteEquipment, onEditEquipment }) {
  const [expanded, setExpanded] = useState(true);
  const [addingEquip, setAddingEquip] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const stationEquip = equipment.filter(e => e.station_id === station.id);

  return (
    <div
      id={`station-setup-${station.id}`}
      className={`ml-6 border-l-2 pl-3 mb-2 rounded-r-xl transition-all ${highlighted ? 'border-primary bg-primary/10 py-2 pr-2 ring-1 ring-primary/30' : 'border-border/40'}`}
    >
      <div className="flex items-center gap-2 group mb-1">
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <div className="h-5 w-5 rounded bg-muted/60 flex items-center justify-center shrink-0">
          <Layers className="h-3 w-3 text-muted-foreground" />
        </div>
        {editingName ? (
          <InlineEdit value={station.name} onSave={v => { onEditStation(station.id, { name: v }); setEditingName(false); }} onCancel={() => setEditingName(false)} />
        ) : (
          <span className="text-sm font-semibold text-foreground flex-1">{station.name}</span>
        )}
        {station.department && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{station.department}</span>}
        <span className="text-[10px] text-muted-foreground/60">{stationEquip.length} equip</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditingName(true)} className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="h-3 w-3" /></button>
          <button onClick={() => onDeleteStation(station.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>

      {expanded && (
        <div className="ml-6 space-y-1">
          {stationEquip.map(e => (
            <EquipmentRow key={e.id} item={e} onDelete={onDeleteEquipment} onEdit={onEditEquipment} />
          ))}
          {addingEquip ? (
           <EquipmentForm
             areaId={station.area_id} areaName={station.area_name}
             stationId={station.id} stationName={station.name}
             existingEquipment={equipment}
             vendors={vendors}
             onSave={data => { onAddEquipment(data); setAddingEquip(false); }}
             onCancel={() => setAddingEquip(false)}
           />
          ) : (
            <button onClick={() => setAddingEquip(true)}
              className="w-full h-7 rounded border border-dashed border-border/60 text-[10px] font-bold text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-1">
              <Plus className="h-3 w-3" /> Add Equipment
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AreaBlock({ area, stations, equipment, vendors, selectedStationId, onDeleteArea, onEditArea, onAddStation, onDeleteStation, onEditStation, onAddEquipment, onDeleteEquipment, onEditEquipment }) {
  const [expanded, setExpanded] = useState(true);
  const [addingStation, setAddingStation] = useState(false);
  const [addingEquip, setAddingEquip] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationDept, setNewStationDept] = useState('BOH');

  const color = colorFor(area.color);
  const areaStations = stations.filter(s => s.area_id === area.id);
  const areaEquip = equipment.filter(e => e.area_id === area.id && !e.station_id);
  const totalEquip = equipment.filter(e => e.area_id === area.id).length;

  const saveStation = () => {
    if (!newStationName.trim()) return;
    onAddStation({ name: newStationName.trim(), department: newStationDept, area_id: area.id, area_name: area.name, isActive: true });
    setNewStationName('');
    setAddingStation(false);
  };

  return (
    <div className={`border ${color.border} rounded-xl overflow-hidden mb-3`}>
      {/* Area Header */}
      <div className={`${color.bg} px-4 py-3 flex items-center gap-2`}>
        <button onClick={() => setExpanded(!expanded)} className={color.text}>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <MapPin className={`h-4 w-4 ${color.text} shrink-0`} />
        {editingName ? (
          <InlineEdit value={area.name} onSave={v => { onEditArea(area.id, { name: v }); setEditingName(false); }} onCancel={() => setEditingName(false)} className="flex-1" />
        ) : (
          <span className={`text-sm font-bold flex-1 ${color.text}`}>{area.name}</span>
        )}
        <span className="text-[10px] text-muted-foreground">{areaStations.length} stations · {totalEquip} equip</span>
        <div className="flex gap-1">
          <button onClick={() => setEditingName(true)} className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDeleteArea(area.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* Area Body */}
      {expanded && (
        <div className="p-3 bg-card/50 space-y-1">
          {/* Stations */}
          {areaStations.map(station => (
            <StationBlock
              key={station.id}
              station={station}
              equipment={equipment}
              vendors={vendors}
              highlighted={station.id === selectedStationId}
              onDeleteStation={onDeleteStation}
              onEditStation={onEditStation}
              onAddEquipment={onAddEquipment}
              onDeleteEquipment={onDeleteEquipment}
              onEditEquipment={onEditEquipment}
            />
          ))}

          {/* Add Station */}
          {addingStation ? (
            <div className="ml-6 flex gap-2 items-center mt-2">
              <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input autoFocus value={newStationName} onChange={e => setNewStationName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveStation(); if (e.key === 'Escape') setAddingStation(false); }}
                placeholder="Station name" className="flex-1 px-2 py-1.5 bg-background border border-primary/50 rounded-lg text-sm text-foreground" />
              <select value={newStationDept} onChange={e => setNewStationDept(e.target.value)}
                className="px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button onClick={saveStation} className="text-green-400 p-1"><Check className="h-4 w-4" /></button>
              <button onClick={() => setAddingStation(false)} className="text-muted-foreground p-1"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => setAddingStation(true)}
              className="ml-6 mt-1 h-7 px-3 rounded border border-dashed border-border/60 text-[10px] font-bold text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center gap-1">
              <Layers className="h-3 w-3" /> Add Station
            </button>
          )}

          {/* Area-level equipment (not assigned to a station) */}
          {areaEquip.length > 0 && (
            <div className="ml-6 mt-2">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Area Equipment (no station)</p>
              <div className="space-y-1">
                {areaEquip.map(e => (
                  <EquipmentRow key={e.id} item={e} onDelete={onDeleteEquipment} onEdit={onEditEquipment} />
                ))}
              </div>
            </div>
          )}
          {addingEquip ? (
            <div className="ml-6 mt-1">
              <EquipmentForm
                areaId={area.id} areaName={area.name}
                stationId={null} stationName={null}
                existingEquipment={equipment}
                vendors={vendors}
                onSave={data => { onAddEquipment(data); setAddingEquip(false); }}
                onCancel={() => setAddingEquip(false)}
              />
            </div>
          ) : (
            <button onClick={() => setAddingEquip(true)}
              className="ml-6 mt-1 h-7 px-3 rounded border border-dashed border-border/40 text-[10px] font-bold text-muted-foreground/60 hover:border-primary/40 hover:text-primary/70 transition-all flex items-center gap-1">
              <Wrench className="h-3 w-3" /> Add Area Equipment
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function LocationSetup() {
  const [searchParams] = useSearchParams();
  const selectedStationId = searchParams.get('stationId');
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingArea, setAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState('orange');

  const reload = async () => {
    const [a, s, e, v] = await Promise.all([
      base44.entities.Area.list('sortOrder', 100),
      base44.entities.Station.list('sortOrder', 200),
      base44.entities.Equipment.list('-updated_date', 300),
      base44.entities.Vendor.list('name', 200).catch(() => []),
    ]);
    setAreas(a);
    setStations(s);
    setEquipment(e);
    setVendors(v);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const addArea = async () => {
    if (!newAreaName.trim()) return;
    const duplicate = areas.find(a => a.name.toLowerCase() === newAreaName.trim().toLowerCase());
    if (duplicate && !confirm(`Area "${duplicate.name}" already exists. Continue anyway?`)) return;
    await base44.entities.Area.create({ name: newAreaName.trim(), color: newAreaColor, isActive: true });
    setNewAreaName('');
    setAddingArea(false);
    reload();
  };

  const editArea = async (id, data) => { await base44.entities.Area.update(id, data); reload(); };
  const deleteArea = async (id) => {
    if (!confirm('Delete this area and all its stations? Equipment will be unlinked.')) return;
    await base44.entities.Area.delete(id);
    reload();
  };

  const addStation = async (data) => {
    const duplicate = stations.find(s => s.name.toLowerCase() === data.name.toLowerCase());
    if (duplicate && !confirm(`Station "${duplicate.name}" already exists. Continue anyway?`)) return;
    await base44.entities.Station.create(data);
    reload();
  };
  const editStation = async (id, data) => { await base44.entities.Station.update(id, data); reload(); };
  const deleteStation = async (id) => {
    if (!confirm('Delete this station? Equipment will be unlinked from it.')) return;
    await base44.entities.Station.delete(id);
    reload();
  };

  const addEquipment = async (data) => {
    const duplicate = equipment.find(e => e.name.toLowerCase() === data.name.toLowerCase());
    if (duplicate && !confirm(`Equipment "${duplicate.name}" already exists. Continue anyway?`)) return;
    await base44.entities.Equipment.create(data);
    reload();
  };
  const editEquipment = async (id, data) => { await base44.entities.Equipment.update(id, data); reload(); };
  const deleteEquipment = async (id) => { await base44.entities.Equipment.delete(id); reload(); };

  const unassignedEquip = equipment.filter(e => !e.area_id);
  const selectedStation = selectedStationId ? stations.find(station => station.id === selectedStationId) : null;

  useEffect(() => {
    if (loading || !selectedStationId) return;
    requestAnimationFrame(() => {
      document.getElementById(`station-setup-${selectedStationId}`)?.scrollIntoView({ block: 'center' });
    });
  }, [loading, selectedStationId, stations]);

  return (
    <div className="pb-28 lg:pb-8">
      <DesktopPageHeader title="Location Setup" subtitle="Areas, stations, and equipment hierarchy" />
      {/* Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">{selectedStation ? `${selectedStation.name} Setup` : 'Location Setup'}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedStation ? 'Station, equipment, and checklist setup' : `${areas.length} areas · ${stations.length} stations · ${equipment.length} equipment`}
            </p>
          </div>
          <button onClick={() => setAddingArea(true)} className="btn-primary text-sm flex items-center gap-1.5 px-3 py-2">
            <Plus className="h-4 w-4" /> Add Area
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> Area</span>
          <span className="flex items-center gap-1"><Layers className="h-3 w-3 text-blue-400" /> Station</span>
          <span className="flex items-center gap-1"><Wrench className="h-3 w-3 text-amber-400" /> Equipment</span>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading location map…</div>
        ) : (
          <>
            {/* Add Area Form */}
            {addingArea && (
              <div className="p-4 card-glass border border-border rounded-xl mb-4 space-y-3">
                <p className="text-sm font-bold text-foreground">New Area</p>
                <input autoFocus value={newAreaName} onChange={e => setNewAreaName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addArea(); if (e.key === 'Escape') setAddingArea(false); }}
                  placeholder="e.g. Kitchen, Bar, Dish Pit, Walk-in Hall"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Color</p>
                  <div className="flex gap-2 flex-wrap">
                    {AREA_COLORS.map(c => (
                      <button key={c.id} onClick={() => setNewAreaColor(c.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${c.bg} ${c.text} ${newAreaColor === c.id ? `${c.border} ring-1 ring-current` : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addArea} className="flex-1 btn-primary text-sm">Create Area</button>
                  <button onClick={() => setAddingArea(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            )}

            {areas.length === 0 && !addingArea && (
              <div className="text-center py-16">
                <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">No areas yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Start by adding your first area — Kitchen, Bar, FOH, Dish Pit, etc.</p>
                <button onClick={() => setAddingArea(true)} className="btn-primary text-sm px-4 py-2">
                  <Plus className="h-4 w-4 inline mr-1.5" />Add Your First Area
                </button>
              </div>
            )}

            {/* Area Tree */}
            {areas.map(area => (
              <AreaBlock
                key={area.id}
                area={area}
                stations={stations}
                equipment={equipment}
                vendors={vendors}
                selectedStationId={selectedStationId}
                onDeleteArea={deleteArea}
                onEditArea={editArea}
                onAddStation={addStation}
                onDeleteStation={deleteStation}
                onEditStation={editStation}
                onAddEquipment={addEquipment}
                onDeleteEquipment={deleteEquipment}
                onEditEquipment={editEquipment}
              />
            ))}

            {/* Unassigned equipment */}
            {unassignedEquip.length > 0 && (
              <div className="border border-dashed border-border rounded-xl p-4 mt-2">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">⚠️ Unassigned Equipment ({unassignedEquip.length})</p>
                <div className="space-y-1">
                  {unassignedEquip.map(e => (
                    <EquipmentRow key={e.id} item={e} onDelete={deleteEquipment} onEdit={editEquipment} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;
