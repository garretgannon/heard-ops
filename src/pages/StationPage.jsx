import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle, Beaker, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  ClipboardCheck, ListChecks, Package, Plus, RefreshCw, Search, Sparkles, Thermometer,
  Wrench, X, BookOpen, Edit2, MapPin, Clock, User, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BottomSheet from '@/components/BottomSheet';
import { getEquipmentMeta } from '@/lib/equipmentConfig';
import StationForm from '@/components/StationForm';

function StationPrepTemplatesSection({ stationId, stationName }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!stationId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const asgns = await base44.entities.StationPrepAssignment
        .filter({ station_id: stationId }).catch(() => []);
      const active = (asgns || []).filter(a => a.active !== false);
      setAssignments(active);

      if (active.length > 0) {
        const templateIds = [...new Set(active.map(a => a.prep_template_id).filter(Boolean))];
        const tmplMap = {};
        await Promise.all(templateIds.map(async tid => {
          try {
            const t = await base44.entities.PrepPlanTemplate?.get?.(tid);
            if (t) tmplMap[tid] = t;
          } catch {}
        }));
        setTemplates(tmplMap);
      }
      setLoading(false);
    })();
  }, [stationId]);

  if (loading) return null;
  if (assignments.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden mt-2">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03]"
      >
        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="flex-1 text-xs font-bold text-foreground">Prep Templates</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">{assignments.length}</span>
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="border-t border-border/30 divide-y divide-border/20">
          {assignments.map(a => {
            const t = templates[a.prep_template_id];
            return (
              <div key={a.id} className="flex items-center gap-2 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{a.template_name || t?.template_name || '—'}</p>
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    {t?.shift && <span className="text-[10px] text-muted-foreground capitalize">{t.shift}</span>}
                    {t?.items?.length > 0 && <span className="text-[10px] text-muted-foreground">{t.items.filter(i => !i.is_header).length} items</span>}
                    {a.override_par != null && <span className="text-[10px] text-primary">Par: {a.override_par}{a.override_unit ? ` ${a.override_unit}` : ''}</span>}
                    {a.override_notes && <span className="text-[10px] text-muted-foreground italic">"{a.override_notes}"</span>}
                  </div>
                </div>
                {a.prep_template_id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/prep-plan-templates/${a.prep_template_id}`)}
                    className="text-[10px] font-bold text-primary hover:underline shrink-0"
                  >
                    Edit →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)",
};

const EQUIPMENT_TYPES = [
  ['dish-machine', 'Dish Machine'], ['3-compartment-sink', '3-Comp Sink'],
  ['hand-sink', 'Hand Sink'], ['prep-sink', 'Prep Sink'],
  ['walk-in-cooler', 'Walk-in Cooler'], ['walk-in-freezer', 'Walk-in Freezer'],
  ['reach-in-cooler', 'Reach-in Cooler'], ['reach-in-freezer', 'Reach-in Freezer'],
  ['prep-table-cooler', 'Prep Table Cooler'], ['lowboy-cooler', 'Lowboy Cooler'],
  ['beer-cooler', 'Beer Cooler'], ['wine-cooler', 'Wine Cooler'],
  ['chest-freezer', 'Chest Freezer'], ['ice-machine', 'Ice Machine'],
  ['fryer', 'Fryer'], ['flat-top', 'Flat Top'], ['grill', 'Grill'],
  ['oven', 'Oven'], ['steam-table', 'Steam Table'],
  ['hot-holding-cabinet', 'Hot Holding'], ['soda-gun', 'Soda Gun'],
  ['glass-washer', 'Glass Washer'], ['hood-system', 'Hood System'],
  ['grease-trap', 'Grease Trap'], ['hvac', 'HVAC'],
  ['water-heater', 'Water Heater'], ['other', 'Other'],
];

const WORKFLOWS = [
  { id: 'prep',      label: 'Prep',      icon: ClipboardCheck },
  { id: 'sidework',  label: 'Sidework',  icon: ListChecks },
  { id: 'temps',     label: 'Temps',     icon: Thermometer },
  { id: 'cleaning',  label: 'Cleaning',  icon: Sparkles },
  { id: 'chemicals', label: 'Chemicals', icon: Beaker },
  { id: 'equipment', label: 'Equipment', icon: Wrench },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isActive = (item) => item?.isActive !== false;

function hasTempSchedule(item) {
  return Boolean(item.required_on_opening || item.required_on_closing || item.temp_check_frequency_minutes);
}

function isEquipmentConfigured(item) {
  return Boolean(
    item.requiresTemperatureLog || item.temp_enabled ||
    item.requiresCleaningChecklist || item.requiresMaintenanceChecklist ||
    item.parInventoryItemId || item.modelNumber || item.serialNumber
  );
}

function stationHealth(station, equipment) {
  if (!isActive(station)) return { color: 'neutral', pct: 0 };
  if (equipment.length === 0) return { color: 'critical', pct: 0 };
  const pct = Math.round((equipment.filter(isEquipmentConfigured).length / equipment.length) * 100);
  if (pct === 100) return { color: 'success', pct: 100 };
  return { color: pct === 0 ? 'critical' : 'warning', pct };
}

function stationAssignments(station) {
  const assignments = station?.assignments || station?.assignedEmployees || station?.assigned_employees || [];
  if (Array.isArray(assignments) && assignments.length > 0) {
    return assignments.map((e, i) => ({
      name: e.name || e.employeeName || e.employee_name || `Assignment ${i + 1}`,
      shift: e.shift || e.shiftTime || '',
    }));
  }
  const assignedName = station?.assignedEmployeeName || station?.assigned_employee_name || station?.assigned_to;
  if (assignedName) return [{ name: assignedName, shift: station?.assignedShift || '' }];
  return [];
}

// ─── EquipmentRow ─────────────────────────────────────────────────────────────

function EquipmentRow({ item, cleaningTemplates, inventoryItems, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  const updateField = async (field, value) => {
    setSaving(true);
    await base44.entities.Equipment.update(item.id, { [field]: value });
    await onRefresh?.();
    setSaving(false);
  };

  const updateFields = async (data) => {
    setSaving(true);
    await base44.entities.Equipment.update(item.id, data);
    await onRefresh?.();
    setSaving(false);
  };

  const addItem = async (itemId) => {
    const existing = item.item_ids || [];
    if (existing.includes(itemId)) return;
    setSaving(true);
    await base44.entities.Equipment.update(item.id, { item_ids: [...existing, itemId] });
    setItemSearch('');
    await onRefresh?.();
    setSaving(false);
  };

  const removeItem = async (itemId) => {
    setSaving(true);
    await base44.entities.Equipment.update(item.id, { item_ids: (item.item_ids || []).filter((id) => id !== itemId) });
    await onRefresh?.();
    setSaving(false);
  };

  const hasTemp = item.temp_enabled || item.requiresTemperatureLog;
  const hasCleaning = item.requiresCleaningChecklist;
  const hasMaint = item.requiresMaintenanceChecklist;
  const hasInventory = !!item.inInventory;
  const meta = getEquipmentMeta(item.equipmentType);
  const Icon = meta.icon;

  const linkedItems = (item.item_ids || []).map((id) => (inventoryItems || []).find((p) => p.id === id)).filter(Boolean);
  const searchResults = itemSearch.trim()
    ? (inventoryItems || []).filter((p) => p.itemName?.toLowerCase().includes(itemSearch.toLowerCase()) && !(item.item_ids || []).includes(p.id)).slice(0, 8)
    : [];

  return (
    <div className="overflow-hidden rounded-xl border border-border/40" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-white/[0.03]">
        <span className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: meta.bg }}>
          <Icon className={cn('h-3.5 w-3.5', meta.iconColor)} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-foreground">{item.name}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {item.equipmentType?.replace(/-/g, ' ') || 'Equipment'}
            {linkedItems.length > 0 && <span className="ml-1.5 text-green-400/70">{linkedItems.length} item{linkedItems.length !== 1 ? 's' : ''}</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasInventory && <Package className="h-3.5 w-3.5 text-green-400" />}
          {hasTemp && <Thermometer className={cn('h-3.5 w-3.5', hasTempSchedule(item) ? 'text-blue-400' : 'text-blue-400/40')} />}
          {hasCleaning && <Sparkles className={cn('h-3.5 w-3.5', item.cleaning_template_id ? 'text-green-400' : 'text-green-400/40')} />}
          {hasMaint && <Wrench className="h-3.5 w-3.5 text-amber-400" />}
        </div>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-border/30 px-3 py-3">
          {/* Inventory */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground"><Package className="h-3.5 w-3.5 text-green-400" />Inventory</span>
              <button type="button" onClick={() => updateField('inInventory', !hasInventory)} className={cn('h-5 w-9 rounded-full border p-0.5 transition-all', hasInventory ? 'border-green-500/50 bg-green-500/20' : 'border-border bg-muted/40')}>
                <span className={cn('block h-3.5 w-3.5 rounded-full bg-foreground transition-transform', hasInventory && 'translate-x-4 bg-green-400')} />
              </button>
            </div>
            {hasInventory && (
              <div className="space-y-2 rounded-lg border border-border/40 p-2.5" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Items stored here</p>
                {linkedItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {linkedItems.map((pi) => (
                      <span key={pi.id} className="flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-foreground">
                        {pi.itemName}
                        <button type="button" onClick={() => removeItem(pi.id)} className="ml-0.5 text-muted-foreground hover:text-red-400"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} placeholder="Search items to add…" className="h-8 w-full rounded-lg border border-border/60 bg-background px-3 text-xs font-semibold text-foreground outline-none focus:border-primary/50" />
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl">
                      {searchResults.map((pi) => (
                        <button key={pi.id} type="button" onClick={() => addItem(pi.id)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-muted/60">
                          <span className="font-semibold text-foreground">{pi.itemName}</span>
                          <span className="capitalize text-muted-foreground">{pi.category || ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {linkedItems.length === 0 && !itemSearch && <p className="text-[10px] italic text-muted-foreground/60">Search above to link items stored here.</p>}
              </div>
            )}
          </div>

          {/* Temp */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground"><Thermometer className="h-3.5 w-3.5 text-blue-400" />Temperatures</span>
              <button type="button" onClick={() => updateField('requiresTemperatureLog', !hasTemp)} className={cn('h-5 w-9 rounded-full border p-0.5 transition-all', hasTemp ? 'border-blue-500/50 bg-blue-500/20' : 'border-border bg-muted/40')}>
                <span className={cn('block h-3.5 w-3.5 rounded-full bg-foreground transition-transform', hasTemp && 'translate-x-4 bg-blue-400')} />
              </button>
            </div>
            {hasTemp && (
              <select value={item.temp_check_frequency_minutes || ''} onChange={(e) => updateField('temp_check_frequency_minutes', e.target.value ? Number(e.target.value) : null)} className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none">
                <option value="">Manual only</option>
                <option value="30">Every 30 min</option>
                <option value="60">Every hour</option>
                <option value="120">Every 2 hours</option>
                <option value="240">Every 4 hours</option>
              </select>
            )}
          </div>

          {/* Cleaning */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground"><Sparkles className="h-3.5 w-3.5 text-green-400" />Cleaning</span>
              <button type="button" onClick={() => updateField('requiresCleaningChecklist', !hasCleaning)} className={cn('h-5 w-9 rounded-full border p-0.5 transition-all', hasCleaning ? 'border-green-500/50 bg-green-500/20' : 'border-border bg-muted/40')}>
                <span className={cn('block h-3.5 w-3.5 rounded-full bg-foreground transition-transform', hasCleaning && 'translate-x-4 bg-green-400')} />
              </button>
            </div>
            {hasCleaning && cleaningTemplates.length > 0 && (
              <select value={item.cleaning_template_id || ''} onChange={(e) => { const t = cleaningTemplates.find((o) => o.id === e.target.value); updateFields({ cleaning_template_id: t?.id || '', cleaning_template_name: t?.name || '' }); }} className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none">
                <option value="">No template linked</option>
                {cleaningTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>

          {/* Maintenance */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-foreground"><Wrench className="h-3.5 w-3.5 text-amber-400" />Maintenance</span>
            <button type="button" onClick={() => updateField('requiresMaintenanceChecklist', !hasMaint)} className={cn('h-5 w-9 rounded-full border p-0.5 transition-all', hasMaint ? 'border-amber-500/50 bg-amber-500/20' : 'border-border bg-muted/40')}>
              <span className={cn('block h-3.5 w-3.5 rounded-full bg-foreground transition-transform', hasMaint && 'translate-x-4 bg-amber-400')} />
            </button>
          </div>

          {saving && <p className="text-[10px] font-bold text-primary">Saving…</p>}
        </div>
      )}
    </div>
  );
}

// ─── AddEquipmentForm ─────────────────────────────────────────────────────────

function AddEquipmentForm({ station, area, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('other');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.Equipment.create({
      name: name.trim(), equipmentType: type,
      area_id: area?.id || station?.area_id || '', area_name: area?.name || station?.area_name || '',
      station_id: station.id, station_name: station.name,
      department: station.department || '', isActive: true,
    });
    await onSave?.();
    setSaving(false);
  };

  const meta = getEquipmentMeta(type);
  const TypeIcon = meta.icon;

  return (
    <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Equipment name" className="h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-base font-semibold text-foreground outline-none focus:border-primary/50" />
      <div className="flex items-center gap-2">
        <span className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center" style={{ background: meta.bg }}>
          <TypeIcon className={cn('h-5 w-5', meta.iconColor)} />
        </span>
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-12 flex-1 rounded-xl border border-border/60 bg-background px-3 text-base font-semibold text-foreground outline-none">
          {EQUIPMENT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={saving || !name.trim()} className="flex-1 rounded-xl bg-primary px-3 py-3 text-sm font-black text-primary-foreground disabled:opacity-50">{saving ? 'Saving…' : 'Add Equipment'}</button>
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-border/60 px-3 py-3 text-sm font-black text-muted-foreground">Cancel</button>
      </div>
    </div>
  );
}

// ─── WorkflowSheetContent ─────────────────────────────────────────────────────

function WorkflowSheetContent({ workflow, station, equipment, cleaningTemplates, inventoryItems, onEquipmentRefresh }) {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingEquipment, setAddingEquipment] = useState(false);

  // Prep / Sidework add form
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');

  // Temps — per-equipment input state
  const [tempInputs, setTempInputs] = useState({});
  const [tempSaving, setTempSaving] = useState({});
  const [tempLogged, setTempLogged] = useState({});
  const [foodSafetySettings, setFoodSafetySettings] = useState(null);

  // Chemicals — all chemicals for search + assigned subset
  const [allChemicals, setAllChemicals] = useState([]);
  const [chemSearch, setChemSearch] = useState('');

  useEffect(() => {
    if (workflow === 'equipment') { setLoading(false); return; }
    loadData();
  }, [workflow, station?.id]);

  useEffect(() => {
    if (workflow !== 'temps' || foodSafetySettings) return;
    base44.entities.FoodSafetySettings.filter({ key: 'global' }).then(results => {
      setFoodSafetySettings(results[0] || {});
    }).catch(() => setFoodSafetySettings({}));
  }, [workflow]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (workflow === 'prep') {
        const items = await base44.entities.PrepItem.list('-updated_date', 200).catch(() => []);
        setData(items.filter(i => i.station_id === station.id || i.station_name === station.name || i.stationId === station.id));
      } else if (workflow === 'sidework') {
        const items = await base44.entities.DailySideWorkTask.list('-updated_date', 200).catch(() => []);
        setData(items.filter(i =>
          (i.station_id === station.id || i.station === station.name || i.station_name === station.name) &&
          (i.date === todayStr || !i.date)
        ));
      } else if (workflow === 'cleaning') {
        const tasks = await base44.entities.GeneratedTask.list('-created_date', 200).catch(() => []);
        setData(tasks.filter(t =>
          (t.task_type === 'cleaning_task' || t.type === 'cleaning_task') &&
          (t.station_id === station.id || t.station_name === station.name || t.stationId === station.id) &&
          (t.due_date === todayStr || t.created_date?.startsWith(todayStr))
        ));
      } else if (workflow === 'chemicals') {
        const chemicals = await base44.entities.Chemical.list().catch(() => []);
        setAllChemicals(chemicals);
        setData(chemicals.filter(c => {
          const stations = c.assigned_stations || c.assignedStations || [];
          return stations.includes(station.id) || stations.includes(station.name) ||
            c.station_id === station.id || c.station_name === station.name;
        }));
      }
    } catch (err) {
      setData([]);
    }
    setLoading(false);
  };

  // ── Prep actions ──────────────────────────────────────────────────────────
  const togglePrepItem = async (item) => {
    const next = item.status === 'completed' ? 'pending' : 'completed';
    setData(prev => prev.map(i => i.id === item.id ? { ...i, status: next } : i));
    await base44.entities.PrepItem.update(item.id, { status: next }).catch(console.error);
  };

  const addPrepItem = async () => {
    if (!newItemName.trim()) return;
    setSaving(true);
    try {
      const created = await base44.entities.PrepItem.create({
        name: newItemName.trim(),
        quantity: newItemQty.trim() ? parseFloat(newItemQty) || newItemQty.trim() : undefined,
        station_name: station.name,
        station_id: station.id,
        status: 'pending',
        allow_all_roles: true,
        due_date: todayStr,
      });
      if (created) setData(prev => [created, ...(prev || [])]);
      setNewItemName(''); setNewItemQty(''); setAddingItem(false);
    } catch (err) {
      console.error('Failed to add prep item:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Sidework actions ──────────────────────────────────────────────────────
  const toggleSideworkTask = async (task) => {
    const next = task.status === 'completed' ? 'pending' : 'completed';
    setData(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    await base44.entities.DailySideWorkTask.update(task.id, { status: next }).catch(console.error);
  };

  const addSideworkTask = async () => {
    if (!newItemName.trim()) return;
    setSaving(true);
    try {
      const created = await base44.entities.DailySideWorkTask.create({
        taskName: newItemName.trim(),
        station_id: station.id,
        station: station.name,
        station_name: station.name,
        date: todayStr,
        status: 'pending',
        allow_all_roles: true,
      });
      if (created) setData(prev => [created, ...(prev || [])]);
      setNewItemName(''); setAddingItem(false);
    } catch (err) {
      console.error('Failed to add sidework task:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Temp actions ──────────────────────────────────────────────────────────
  const FREEZER_TYPES = new Set(['walk-in-freezer','reach-in-freezer','chest-freezer']);
  const COOLER_TYPES  = new Set(['walk-in-cooler','reach-in-cooler','prep-table-cooler','lowboy-cooler','beer-cooler','wine-cooler','ice-machine']);
  const HOT_TYPES     = new Set(['steam-table','hot-holding-cabinet']);

  const getTempThreshold = (eq) => {
    const s = foodSafetySettings || {};
    const t = eq.equipmentType;
    if (FREEZER_TYPES.has(t)) return { min: s.freezerMin ?? -10, max: s.freezerMax ?? 0,  label: 'Freezer range' };
    if (COOLER_TYPES.has(t))  return { min: s.coolerMin  ??  34, max: s.coolerMax  ?? 41, label: 'Cooler range'  };
    if (HOT_TYPES.has(t))     return { min: s.hotHoldingMin ?? 135, max: null,             label: 'Hot holding min' };
    return null;
  };

  const logTemp = async (eq) => {
    const val = tempInputs[eq.id];
    if (!val || isNaN(Number(val))) return;
    setTempSaving(prev => ({ ...prev, [eq.id]: true }));
    const temp = Number(val);
    const threshold = getTempThreshold(eq);
    const in_range = threshold
      ? (threshold.min === null || temp >= threshold.min) && (threshold.max === null || temp <= threshold.max)
      : true;
    await base44.entities.TemperatureLog.create({
      equipment_id: eq.id,
      equipment_name: eq.name,
      equipment_type: eq.equipmentType,
      station_id: station.id,
      station_name: station.name,
      temperature: temp,
      unit: 'F',
      status: in_range ? 'logged' : 'out_of_range',
      in_range,
      min_threshold: threshold?.min ?? null,
      max_threshold: threshold?.max ?? null,
    });
    setTempLogged(prev => ({ ...prev, [eq.id]: { val, in_range, threshold } }));
    setTempInputs(prev => ({ ...prev, [eq.id]: '' }));
    setTempSaving(prev => ({ ...prev, [eq.id]: false }));
  };

  // ── Cleaning actions ──────────────────────────────────────────────────────
  const toggleCleaningTask = async (task) => {
    const next = task.status === 'completed' ? 'pending' : 'completed';
    setData(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    await base44.entities.GeneratedTask.update(task.id, { status: next });
  };

  // ── Chemical actions ──────────────────────────────────────────────────────
  const assignChemical = async (chem) => {
    const existing = chem.assigned_stations || chem.assignedStations || [];
    if (existing.includes(station.id)) return;
    const updated = [...existing, station.id];
    setSaving(true);
    await base44.entities.Chemical.update(chem.id, { assigned_stations: updated });
    const updatedChem = { ...chem, assigned_stations: updated };
    setAllChemicals(prev => prev.map(c => c.id === chem.id ? updatedChem : c));
    setData(prev => [...(prev || []), updatedChem]);
    setChemSearch('');
    setSaving(false);
  };

  const unassignChemical = async (chem) => {
    const existing = chem.assigned_stations || chem.assignedStations || [];
    const updated = existing.filter(s => s !== station.id && s !== station.name);
    setSaving(true);
    await base44.entities.Chemical.update(chem.id, { assigned_stations: updated });
    setData(prev => (prev || []).filter(c => c.id !== chem.id));
    setAllChemicals(prev => prev.map(c => c.id === chem.id ? { ...c, assigned_stations: updated } : c));
    setSaving(false);
  };

  // ── Shared add-item form (Prep / Sidework) ────────────────────────────────
  const renderAddItemForm = (onAdd, placeholder, showQty = false) => (
    <div className="space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
      <input
        value={newItemName}
        onChange={e => setNewItemName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onAdd()}
        placeholder={placeholder}
        autoFocus
        className="h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary/50"
      />
      {showQty && (
        <input
          value={newItemQty}
          onChange={e => setNewItemQty(e.target.value)}
          placeholder="Qty / amount (optional)"
          className="h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
        />
      )}
      <div className="flex gap-2">
        <button type="button" onClick={onAdd} disabled={saving || !newItemName.trim()} className="flex-1 h-10 rounded-lg bg-primary text-xs font-black text-primary-foreground disabled:opacity-50">
          {saving ? 'Adding…' : 'Add'}
        </button>
        <button type="button" onClick={() => { setAddingItem(false); setNewItemName(''); setNewItemQty(''); }} className="flex-1 h-10 rounded-lg border border-border/60 text-xs font-black text-muted-foreground">
          Cancel
        </button>
      </div>
    </div>
  );

  // ── Equipment ─────────────────────────────────────────────────────────────
  if (workflow === 'equipment') {
    return (
      <div className="max-w-full space-y-3 overflow-x-hidden">
        {addingEquipment ? (
          <AddEquipmentForm station={station} area={null} onSave={async () => { await onEquipmentRefresh(); setAddingEquipment(false); }} onCancel={() => setAddingEquipment(false)} />
        ) : (
          <button type="button" onClick={() => setAddingEquipment(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-xs font-black text-primary hover:bg-primary/8">
            <Plus className="h-3.5 w-3.5" /> Add Equipment
          </button>
        )}
        {equipment.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 px-3 py-5 text-center text-xs font-semibold text-muted-foreground">No equipment assigned to this station yet.</div>
        ) : equipment.map(item => (
          <EquipmentRow key={item.id} item={item} cleaningTemplates={cleaningTemplates} inventoryItems={inventoryItems} onRefresh={onEquipmentRefresh} />
        ))}
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-10"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  // ── Prep ──────────────────────────────────────────────────────────────────
  if (workflow === 'prep') {
    const doneCount = (data || []).filter(i => i.status === 'completed').length;
    return (
      <div className="max-w-full space-y-2 overflow-x-hidden">
        {addingItem ? renderAddItemForm(addPrepItem, 'Item name…', true) : (
          <button type="button" onClick={() => setAddingItem(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-xs font-black text-primary hover:bg-primary/8">
            <Plus className="h-3.5 w-3.5" /> Add prep item
          </button>
        )}
        {data && data.length > 0 && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{doneCount}/{data.length} complete</p>
        )}
        {(!data || data.length === 0) && !addingItem && (
          <div className="rounded-xl border border-dashed border-border/50 px-3 py-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground">No prep items for this station</p>
            <p className="text-xs text-muted-foreground mt-1">Add one above or create from the prep list page</p>
          </div>
        )}
        {(data || []).map(item => (
          <button key={item.id} type="button" onClick={() => togglePrepItem(item)} className="flex w-full items-center gap-3 rounded-xl border border-border/40 p-3 text-left active:scale-[0.98] transition-transform" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
            <div className={cn('h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all', item.status === 'completed' ? 'border-green-500 bg-green-500/20' : 'border-border/60')}>
              {item.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-bold transition-all', item.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground')}>
                {item.name || item.itemName || item.item_name || item.title}
              </p>
              {item.quantity && <p className="text-xs text-muted-foreground">{item.quantity} {item.unit || ''}</p>}
            </div>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', item.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground')}>
              {item.status === 'completed' ? 'done' : 'pending'}
            </span>
          </button>
        ))}
        <StationPrepTemplatesSection stationId={station?.id} stationName={station?.name} />
        <button onClick={() => navigate('/tasks?tab=prep')} className="w-full text-xs font-black text-primary text-center py-2">View all prep →</button>
      </div>
    );
  }

  // ── Sidework ──────────────────────────────────────────────────────────────
  if (workflow === 'sidework') {
    const doneCount = (data || []).filter(t => t.status === 'completed').length;
    return (
      <div className="max-w-full space-y-2 overflow-x-hidden">
        {addingItem ? renderAddItemForm(addSideworkTask, 'Task name…') : (
          <button type="button" onClick={() => setAddingItem(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-xs font-black text-primary hover:bg-primary/8">
            <Plus className="h-3.5 w-3.5" /> Add sidework task
          </button>
        )}
        {data && data.length > 0 && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{doneCount}/{data.length} complete</p>
        )}
        {(!data || data.length === 0) && !addingItem && (
          <div className="rounded-xl border border-dashed border-border/50 px-3 py-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground">No sidework tasks for this station today</p>
            <p className="text-xs text-muted-foreground mt-1">Add one above or create from the sidework page</p>
          </div>
        )}
        {(data || []).map(task => (
          <button key={task.id} type="button" onClick={() => toggleSideworkTask(task)} className="flex w-full items-center gap-3 rounded-xl border border-border/40 p-3 text-left active:scale-[0.98] transition-transform" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
            <div className={cn('h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all', task.status === 'completed' ? 'border-green-500 bg-green-500/20' : 'border-border/60')}>
              {task.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-bold transition-all', task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground')}>
                {task.taskName || task.title || task.task_name || task.name}
              </p>
              {task.frequency && <p className="text-xs text-muted-foreground capitalize">{task.frequency}</p>}
            </div>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', task.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground')}>
              {task.status === 'completed' ? 'done' : 'pending'}
            </span>
          </button>
        ))}
        <button onClick={() => navigate('/tasks?tab=sidework')} className="w-full text-xs font-black text-primary text-center py-2">View all sidework →</button>
      </div>
    );
  }

  // ── Temps ─────────────────────────────────────────────────────────────────
  if (workflow === 'temps') {
    const tempEquipment = equipment.filter(e => e.temp_enabled || e.requiresTemperatureLog);
    return (
      <div className="max-w-full space-y-3 overflow-x-hidden">
        {tempEquipment.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 px-3 py-8 text-center">
            <Thermometer className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">No temperature monitoring set up</p>
            <p className="text-xs text-muted-foreground mt-1">Enable temp tracking on equipment via the Equipment tab</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{tempEquipment.length} item{tempEquipment.length !== 1 ? 's' : ''} tracked — tap to log a reading</p>
            {tempEquipment.map(eq => {
              const m = getEquipmentMeta(eq.equipmentType);
              const EqIcon = m.icon;
              const logged = tempLogged[eq.id];
              const threshold = getTempThreshold(eq);
              const rangeLabel = threshold
                ? threshold.max === null
                  ? `Min ${threshold.min}°F`
                  : `${threshold.min}–${threshold.max}°F`
                : null;
              return (
                <div key={eq.id} className={cn('rounded-xl border p-3 space-y-2.5', logged && !logged.in_range ? 'border-red-500/40' : 'border-border/40')} style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: m.bg }}>
                      <EqIcon className={cn('h-4 w-4', m.iconColor)} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{eq.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {hasTempSchedule(eq) ? `Every ${eq.temp_check_frequency_minutes} min` : 'Manual checks'}
                        {rangeLabel && <span className="ml-2 text-muted-foreground/60">· Target {rangeLabel}</span>}
                      </p>
                    </div>
                    {logged && (
                      <span className={cn('text-xs font-black shrink-0', logged.in_range ? 'text-green-400' : 'text-red-400')}>
                        {logged.in_range ? '✓' : '✗'} {logged.val}°F
                      </span>
                    )}
                  </div>
                  {logged && !logged.in_range && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <p className="text-xs font-bold text-red-400">Out of range — corrective action required. Target: {rangeLabel}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={tempInputs[eq.id] || ''}
                      onChange={e => setTempInputs(prev => ({ ...prev, [eq.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && logTemp(eq)}
                      placeholder="Enter °F"
                      className="h-10 flex-1 rounded-lg border border-border/60 bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-blue-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => logTemp(eq)}
                      disabled={tempSaving[eq.id] || !tempInputs[eq.id]}
                      className="h-10 px-4 rounded-lg bg-blue-500/20 border border-blue-500/30 text-xs font-black text-blue-400 disabled:opacity-40 active:scale-95"
                    >
                      {tempSaving[eq.id] ? '…' : 'Log'}
                    </button>
                  </div>
                </div>
              );
            })}
            <button onClick={() => navigate('/temperature-monitoring')} className="w-full text-xs font-black text-primary text-center py-2">View temp dashboard →</button>
          </>
        )}
      </div>
    );
  }

  // ── Cleaning ──────────────────────────────────────────────────────────────
  if (workflow === 'cleaning') {
    const doneCount = (data || []).filter(t => t.status === 'completed').length;
    return (
      <div className="max-w-full space-y-2 overflow-x-hidden">
        {data && data.length > 0 && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{doneCount}/{data.length} complete</p>
        )}
        {(!data || data.length === 0) && (
          <div className="rounded-xl border border-dashed border-border/50 px-3 py-8 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">No cleaning tasks today</p>
            <p className="text-xs text-muted-foreground mt-1">Tasks appear here when generated for this station</p>
          </div>
        )}
        {(data || []).map(task => (
          <button key={task.id} type="button" onClick={() => toggleCleaningTask(task)} className="flex w-full items-center gap-3 rounded-xl border border-border/40 p-3 text-left active:scale-[0.98] transition-transform" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
            <div className={cn('h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all', task.status === 'completed' ? 'border-green-500 bg-green-500/20' : 'border-border/60')}>
              {task.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-bold transition-all', task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground')}>
                {task.taskName || task.title || task.task_name || task.name}
              </p>
              {task.due_date && <p className="text-xs text-muted-foreground">Due: {task.due_date}</p>}
            </div>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', task.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground')}>
              {task.status === 'completed' ? 'done' : 'pending'}
            </span>
          </button>
        ))}
        <button onClick={() => navigate('/cleaning')} className="w-full text-xs font-black text-primary text-center py-2">View cleaning log →</button>
      </div>
    );
  }

  // ── Chemicals ─────────────────────────────────────────────────────────────
  if (workflow === 'chemicals') {
    const assignedIds = new Set((data || []).map(c => c.id));
    const searchResults = chemSearch.trim()
      ? allChemicals.filter(c =>
          !assignedIds.has(c.id) &&
          (c.name || c.chemical_name || '').toLowerCase().includes(chemSearch.toLowerCase())
        ).slice(0, 6)
      : [];

    return (
      <div className="max-w-full space-y-3 overflow-x-hidden">
        {/* Search to assign */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={chemSearch}
            onChange={e => setChemSearch(e.target.value)}
            placeholder="Search chemicals to assign…"
            className="h-10 w-full rounded-xl border border-border/60 bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary/50"
          />
          {chemSearch && (
            <button onClick={() => setChemSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-popover overflow-hidden shadow-xl">
            {searchResults.map(chem => (
              <button key={chem.id} type="button" onClick={() => assignChemical(chem)} disabled={saving}
                className="flex w-full min-w-0 items-center justify-between gap-2 border-b border-border/30 px-4 py-3 text-sm last:border-0 hover:bg-muted/50">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Beaker className="h-4 w-4 text-purple-400 shrink-0" />
                  <span className="min-w-0 break-words font-semibold text-foreground">{chem.name || chem.chemical_name}</span>
                </div>
                <span className="shrink-0 text-xs font-bold text-primary">+ Assign</span>
              </button>
            ))}
          </div>
        )}

        {/* Assigned chemicals */}
        {(!data || data.length === 0) && !chemSearch && (
          <div className="rounded-xl border border-dashed border-border/50 px-3 py-8 text-center">
            <Beaker className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">No chemicals assigned to this station</p>
            <p className="text-xs text-muted-foreground mt-1">Search above to assign chemicals</p>
          </div>
        )}

        {(data || []).length > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{data.length} assigned</p>
            {(data || []).map(chem => (
              <div key={chem.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-border/40 p-3" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
                <div className="h-8 w-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                  <Beaker className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="break-words text-sm font-bold text-foreground">{chem.name || chem.chemical_name}</p>
                  {chem.chemical_type && <p className="text-xs text-muted-foreground capitalize">{chem.chemical_type}</p>}
                  {chem.dilution_ratio && <p className="text-xs text-muted-foreground">{chem.dilution_ratio}</p>}
                </div>
                <button type="button" onClick={() => unassignChemical(chem)} disabled={saving}
                  className="h-7 w-7 rounded-full flex items-center justify-center border border-border/50 bg-muted/30 text-muted-foreground hover:text-red-400 hover:border-red-500/30 active:scale-90 transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </>
        )}

        <button onClick={() => navigate('/chemical-library')} className="w-full text-xs font-black text-primary text-center py-2">View chemical library →</button>
      </div>
    );
  }

  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CircularGauge({ pct, color, size = 80 }) {
  const r = size * 0.41;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  const stroke = color === 'success' ? '#22c55e' : color === 'warning' ? '#f59e0b' : color === 'critical' ? '#ef4444' : '#475569';
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={Math.round(size * 0.09)} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke} strokeWidth={Math.round(size * 0.09)}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <span className="relative font-black tabular-nums text-foreground" style={{ fontSize: Math.round(size * 0.215) }}>{pct}%</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CARD = {
  background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)',
};

export default function StationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [station, setStation] = useState(null);
  const [area, setArea] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [cleaningTemplates, setCleaningTemplates] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Page-level operational data
  const [prepItems, setPrepItems] = useState([]);
  const [sideworkItems, setSideworkItems] = useState([]);
  const [cleaningTasks, setCleaningTasks] = useState([]);
  const [chemicals, setChemicals] = useState([]);
  const [stationIssues, setStationIssues] = useState([]);
  const [tempLogs, setTempLogs] = useState([]);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [
        stations, areas, allEquipment, cleaningTemplateData, inventoryData,
        prepData, sideworkData, cleaningData, chemData, issueData, tempLogData,
      ] = await Promise.all([
        base44.entities.Station.list().catch(() => []),
        base44.entities.Area.list().catch(() => []),
        base44.entities.Equipment.list().catch(() => []),
        base44.entities.CleaningTemplate.list().catch(() => []),
        base44.entities.InventoryItem.list().catch(() => []),
        base44.entities.PrepItem.list('-updated_date', 200).catch(() => []),
        base44.entities.DailySideWorkTask.list('-updated_date', 200).catch(() => []),
        base44.entities.GeneratedTask.list('-created_date', 200).catch(() => []),
        base44.entities.Chemical.list().catch(() => []),
        base44.entities.Issue.filter({ status: 'open' }).catch(() => []),
        base44.entities.TemperatureLog.list('-created_date', 50).catch(() => []),
      ]);

      const s = stations.find(st => st.id === id);
      if (!s) { navigate('/operational-map'); return; }

      const a = areas.find(ar => ar.id === s.area_id || ar.name === s.area_name);
      const eq = allEquipment.filter(e => (e.station_id === id || e.station_name === s.name) && isActive(e));

      setStation(s);
      setArea(a || null);
      setEquipment(eq);
      setCleaningTemplates(cleaningTemplateData.filter(isActive));
      setInventoryItems(inventoryData);

      setPrepItems((prepData || []).filter(i => i.station_id === s.id || i.station_name === s.name));
      setSideworkItems((sideworkData || []).filter(i =>
        (i.station_id === s.id || i.station === s.name || i.station_name === s.name) &&
        (i.date === todayStr || !i.date)
      ));
      setCleaningTasks((cleaningData || []).filter(t =>
        (t.task_type === 'cleaning_task' || t.type === 'cleaning_task') &&
        (t.station_id === s.id || t.station_name === s.name || t.stationId === s.id) &&
        (t.due_date === todayStr || t.created_date?.startsWith(todayStr))
      ));
      setChemicals((chemData || []).filter(c => {
        const ss = c.assigned_stations || c.assignedStations || [];
        return ss.includes(s.id) || ss.includes(s.name) || c.station_id === s.id || c.station_name === s.name;
      }));
      setStationIssues((issueData || []).filter(i =>
        i.location === a?.name || i.location === s.name || i.station_id === s.id || i.station_name === s.name
      ));
      setTempLogs((tempLogData || []).filter(l => l.station_id === s.id || l.station_name === s.name));
    } catch (err) {
      console.error('Failed to load station:', err);
    }
    setLoading(false);
  };

  const toggleActive = async () => {
    if (!station) return;
    setSaving(true);
    await base44.entities.Station.update(station.id, { isActive: !isActive(station) });
    await loadData();
    setSaving(false);
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const health = station ? stationHealth(station, equipment) : { color: 'neutral', pct: 0 };
  const tempEquipment = equipment.filter(e => e.temp_enabled || e.requiresTemperatureLog);
  const maintenanceEquipment = equipment.filter(e => e.requiresMaintenanceChecklist);
  const assignedEmployees = station ? stationAssignments(station) : [];
  const todayStr = new Date().toISOString().split('T')[0];

  const prepDone       = prepItems.filter(i => i.status === 'completed').length;
  const sideworkDone   = sideworkItems.filter(i => i.status === 'completed').length;
  const cleaningDone   = cleaningTasks.filter(t => t.status === 'completed').length;
  const configuredEq   = equipment.filter(isEquipmentConfigured).length;
  const tempWithSched  = tempEquipment.filter(e => hasTempSchedule(e)).length;
  const totalIssues    = stationIssues.length + maintenanceEquipment.length;

  const accentBar = health.color === 'success' ? 'bg-green-500' : health.color === 'warning' ? 'bg-amber-500' : health.color === 'critical' ? 'bg-red-500' : 'bg-slate-600';

  const statusBadgeCls = health.color === 'success'
    ? 'border-green-500/40 bg-green-500/15 text-green-400'
    : health.color === 'warning'
    ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
    : health.color === 'critical'
    ? 'border-red-500/40 bg-red-500/15 text-red-400'
    : 'border-border/60 bg-muted/30 text-muted-foreground';

  const statusLabel = !station || !isActive(station) ? 'Inactive'
    : health.color === 'success' ? 'Active'
    : health.color === 'warning' ? 'Needs Attention'
    : 'Critical';

  const activeWorkflowDef = WORKFLOWS.find(w => w.id === activeWorkflow);

  // Workflow completion data for cards
  const wfData = {
    prep:      { done: prepDone,      total: prepItems.length },
    sidework:  { done: sideworkDone,  total: sideworkItems.length },
    temps:     { done: tempWithSched, total: tempEquipment.length, altLabel: `${tempEquipment.length} tracked` },
    cleaning:  { done: cleaningDone,  total: cleaningTasks.length },
    chemicals: { done: chemicals.length, total: chemicals.length, altLabel: `${chemicals.length} assigned` },
    equipment: { done: configuredEq,  total: equipment.length },
  };

  // Recent activity (temp logs + completed prep today)
  const recentActivity = [
    ...tempLogs.slice(0, 4).map(l => ({
      icon: Thermometer, color: l.in_range === false ? 'text-red-400' : 'text-blue-400',
      title: 'Temp logged', sub: `${l.equipment_name || 'Equipment'}: ${l.temperature}°F`, time: l.created_date,
    })),
    ...prepItems.filter(i => i.status === 'completed' && i.updated_date?.startsWith(todayStr)).slice(0, 3).map(i => ({
      icon: CheckCircle2, color: 'text-green-400',
      title: 'Prep completed', sub: i.name || i.itemName || '', time: i.updated_date,
    })),
  ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 5);

  // 7-day temp compliance
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const tempLogDays = new Set(
    tempLogs.filter(l => l.created_date && new Date(l.created_date) >= sevenDaysAgo)
            .map(l => l.created_date?.split('T')[0])
  ).size;

  // ── Readiness breakdown rows ───────────────────────────────────────────────
  const breakdownRows = [
    { icon: Wrench,        label: 'Equipment',   wfId: 'equipment', done: configuredEq, total: equipment.length,      isCount: false },
    { icon: Thermometer,   label: 'Temp Checks', wfId: 'temps',     done: tempWithSched, total: tempEquipment.length, isCount: false },
    { icon: ClipboardCheck,label: 'Prep',        wfId: 'prep',      done: prepDone,      total: prepItems.length,     isCount: false },
    { icon: ListChecks,    label: 'Sidework',    wfId: 'sidework',  done: sideworkDone,  total: sideworkItems.length, isCount: false },
    { icon: Sparkles,      label: 'Cleaning',    wfId: 'cleaning',  done: cleaningDone,  total: cleaningTasks.length, isCount: false },
    { icon: Beaker,        label: 'Chemicals',   wfId: 'chemicals', done: chemicals.length, total: chemicals.length,  isCount: true },
    { icon: AlertTriangle, label: 'Issues',      wfId: null,        done: 0, total: totalIssues,                      isIssue: true },
  ];

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 h-[60px]"
          style={{ background: 'rgba(6,10,16,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => navigate('/operational-map')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-4 w-40 skeleton rounded flex-1" />
        </header>
        <div className="pt-[72px] lg:pt-8 px-4 lg:px-6 space-y-4">
          <div className="skeleton h-8 w-52 rounded" />
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-5 space-y-4 lg:space-y-0">
            <div className="space-y-4">
              {[160, 48, 120, 200, 160, 140].map((h, i) => <div key={i} className={`skeleton rounded-2xl`} style={{ height: h }} />)}
            </div>
            <div className="hidden lg:block space-y-3">
              {[180, 200, 140, 160].map((h, i) => <div key={i} className={`skeleton rounded-2xl`} style={{ height: h }} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!station) return null;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Mobile fixed header ──────────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 h-[60px]"
        style={{ background: 'rgba(6,10,16,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/operational-map')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 active:scale-95">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black tracking-tight text-foreground leading-none truncate">{station.name}</h1>
          {area && <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-none">{area.name}</p>}
        </div>
        <button onClick={loadData} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 active:scale-95">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="pt-[60px] pb-24 lg:pt-0 lg:pb-12 lg:px-6">

        {/* Desktop page header */}
        <div className="hidden lg:block pt-7 pb-5">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <button onClick={() => navigate('/operational-map')} className="hover:text-foreground transition-colors">Stations</button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">{station.name}</span>
          </nav>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-foreground">{station.name}</h1>
                <button onClick={toggleActive} disabled={saving}
                  className={cn('rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide transition-all', statusBadgeCls)}>
                  {saving ? '…' : statusLabel}
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Station readiness, workflows, equipment, and daily actions</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowEditForm(true)}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border/50 text-xs font-bold text-foreground hover:bg-muted/50 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <Edit2 className="h-3.5 w-3.5" /> Edit Station
              </button>
              <button onClick={() => setActiveWorkflow('equipment')}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border/50 text-xs font-bold text-foreground hover:bg-muted/50 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <Package className="h-3.5 w-3.5" /> Assign Items
              </button>
              <button onClick={() => setActiveWorkflow('prep')}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all"
                style={{ boxShadow: '0 0 14px rgba(230,106,31,0.28)' }}>
                <ClipboardCheck className="h-3.5 w-3.5" /> Start Checklist
              </button>
            </div>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="px-4 lg:px-0 lg:grid lg:grid-cols-[1fr_300px] lg:gap-5 lg:items-start">

          {/* ════ LEFT / MAIN COLUMN ════ */}
          <div className="space-y-4 pt-4 lg:pt-0">

            {/* ── Readiness Hero ───────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border/50 p-4 lg:p-5" style={CARD}>
              <div className="flex items-start gap-4">
                <CircularGauge pct={health.pct} color={health.color} size={88} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-black text-foreground">Setup Readiness</h2>
                    <span className={cn('shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full border', statusBadgeCls)}>
                      {health.color === 'success' ? 'READY' : health.color === 'warning' ? 'ATTENTION' : health.color === 'critical' ? 'CRITICAL' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {health.pct === 100 ? 'All core areas ready to go.' : health.pct === 0 ? 'Setup required before service.' : 'Some areas need attention.'}
                  </p>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/40">
                    <div className={cn('h-full rounded-full transition-all duration-700', accentBar)} style={{ width: `${health.pct}%` }} />
                  </div>
                  {/* Category counts */}
                  <div className="mt-3.5 grid grid-cols-4 gap-x-3 gap-y-2.5">
                    {[
                      { icon: Wrench,         label: 'Equipment',   val: equipment.length === 0 ? '—' : `${configuredEq}/${equipment.length}` },
                      { icon: Thermometer,    label: 'Temp Checks', val: tempEquipment.length === 0 ? '—' : `${tempWithSched}/${tempEquipment.length}` },
                      { icon: ClipboardCheck, label: 'Prep',        val: prepItems.length === 0 ? '—' : `${prepDone}/${prepItems.length}` },
                      { icon: ListChecks,     label: 'Sidework',    val: sideworkItems.length === 0 ? '—' : `${sideworkDone}/${sideworkItems.length}` },
                      { icon: Sparkles,       label: 'Cleaning',    val: cleaningTasks.length === 0 ? '—' : `${cleaningDone}/${cleaningTasks.length}` },
                      { icon: Beaker,         label: 'Chemicals',   val: String(chemicals.length) },
                      { icon: AlertTriangle,  label: 'Issues',      val: String(totalIssues), isIssue: true },
                    ].map(({ icon: Icon, label, val, isIssue }) => (
                      <div key={label} className="flex items-center gap-1.5 min-w-0">
                        <Icon className={cn('h-3.5 w-3.5 shrink-0', isIssue && totalIssues > 0 ? 'text-amber-400' : 'text-muted-foreground/60')} />
                        <div className="min-w-0">
                          <p className={cn('text-xs font-black leading-none', isIssue && totalIssues > 0 ? 'text-amber-400' : 'text-foreground')}>{val}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-none truncate">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Issue Alert ───────────────────────────────────────────────── */}
            {totalIssues > 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{totalIssues} issue{totalIssues !== 1 ? 's' : ''} flagged</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {maintenanceEquipment.length > 0 ? `${maintenanceEquipment.length} maintenance item${maintenanceEquipment.length > 1 ? 's' : ''} require attention.` : 'Review open issues below.'}
                  </p>
                </div>
                <button onClick={() => setActiveWorkflow('equipment')}
                  className="shrink-0 text-xs font-black text-amber-400 border border-amber-500/40 rounded-lg px-3 py-1.5 hover:bg-amber-500/10 transition-all flex items-center gap-1">
                  View <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-green-500/25 bg-green-500/8 px-4 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                <p className="text-xs font-bold text-foreground">No open issues — station is ready for service.</p>
              </div>
            )}

            {/* ── Today's Workflows ─────────────────────────────────────────── */}
            <div>
              <p className="text-sm font-black text-foreground mb-2.5">Today's Workflows</p>
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
                {WORKFLOWS.map(({ id: wid, label, icon: WIcon }) => {
                  const wd = wfData[wid];
                  const hasData = wd && wd.total > 0;
                  const complete = hasData && wd.done === wd.total;
                  const countLabel = wd?.altLabel || (hasData ? `${wd.done}/${wd.total}` : '—');
                  return (
                    <button key={wid} type="button" onClick={() => setActiveWorkflow(wid)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-border/40 px-2 py-3.5 text-center transition-all active:scale-[0.97] hover:border-primary/30 hover:bg-white/[0.02]"
                      style={CARD}>
                      <WIcon className={cn('h-4 w-4', complete ? 'text-green-400' : 'text-primary/70')} />
                      <span className="text-[10px] font-black text-foreground/80 leading-none">{label}</span>
                      <span className={cn('text-[10px] font-bold', complete ? 'text-green-400' : hasData ? 'text-amber-400/80' : 'text-muted-foreground')}>
                        {countLabel}
                      </span>
                      {hasData && (
                        <span className={cn('text-[9px] font-bold leading-none', complete ? 'text-green-400/70' : 'text-muted-foreground')}>
                          {complete ? 'Complete' : 'In Progress'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Readiness Breakdown ───────────────────────────────────────── */}
            <div className="rounded-2xl border border-border/50 overflow-hidden" style={CARD}>
              <div className="px-4 py-3 border-b border-border/30">
                <h3 className="text-sm font-black text-foreground">Readiness Breakdown</h3>
              </div>
              <div className="divide-y divide-border/20">
                {breakdownRows.map(({ icon: Icon, label, wfId, done, total, isCount, isIssue }) => {
                  const ready = isIssue ? totalIssues === 0 : (total > 0 && done === total);
                  const noData = !isIssue && total === 0;
                  const statusPill = isIssue
                    ? (totalIssues === 0 ? { t: 'None', c: 'bg-green-500/15 text-green-400 border-green-500/30' } : { t: `${totalIssues} Open`, c: 'bg-amber-500/15 text-amber-400 border-amber-500/30' })
                    : noData ? { t: 'No Data', c: 'bg-muted/30 text-muted-foreground border-border/30' }
                    : ready ? { t: 'Ready', c: 'bg-green-500/15 text-green-400 border-green-500/30' }
                    : { t: 'Attention', c: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
                  const countStr = isIssue
                    ? (totalIssues > 0 ? `${totalIssues} open` : '0')
                    : isCount ? `${total} assigned`
                    : noData ? '—'
                    : `${done}/${total}`;
                  return (
                    <button key={label} type="button"
                      onClick={() => wfId ? setActiveWorkflow(wfId) : navigate('/issues')}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', isIssue && totalIssues > 0 ? 'text-amber-400' : 'text-muted-foreground/60')} />
                      <span className="flex-1 text-xs font-bold text-foreground">{label}</span>
                      <span className="text-xs font-bold text-muted-foreground mr-2">{countStr}</span>
                      <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border', statusPill.c)}>{statusPill.t}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 ml-1" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Open Issues & Blockers ────────────────────────────────────── */}
            <div className="rounded-2xl border border-border/50 overflow-hidden" style={CARD}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <h3 className="text-sm font-black text-foreground">Open Issues & Blockers</h3>
                {totalIssues > 0 && (
                  <button onClick={() => navigate('/issues')} className="text-xs font-bold text-primary">View all →</button>
                )}
              </div>
              {maintenanceEquipment.map(eq => (
                <button key={eq.id} onClick={() => setActiveWorkflow('equipment')}
                  className="flex w-full items-center gap-3 px-4 py-3 border-b border-border/20 last:border-0 text-left hover:bg-white/[0.02]">
                  <span className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-amber-400" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{eq.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Maintenance required</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-400">Maintenance</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                </button>
              ))}
              {stationIssues.map(issue => {
                const pc = { critical: 'border-red-500/40 bg-red-500/15 text-red-400', high: 'border-red-500/30 bg-red-500/10 text-red-400', medium: 'border-amber-500/30 bg-amber-500/15 text-amber-400', low: 'border-slate-500/30 bg-slate-500/15 text-slate-400' }[issue.priority] || 'border-amber-500/30 bg-amber-500/15 text-amber-400';
                const isHigh = issue.priority === 'critical' || issue.priority === 'high';
                return (
                  <div key={issue.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/20 last:border-0">
                    <span className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', isHigh ? 'bg-red-500/15' : 'bg-amber-500/15')}>
                      <AlertTriangle className={cn('h-4 w-4', isHigh ? 'text-red-400' : 'text-amber-400')} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{issue.title}</p>
                      {issue.notes && <p className="text-[10px] text-muted-foreground truncate">{issue.notes}</p>}
                      {issue.created_date && <p className="text-[10px] text-muted-foreground/50 mt-0.5">Reported {relativeTime(issue.created_date)}</p>}
                    </div>
                    <span className={cn('shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border capitalize', pc)}>{issue.priority || 'Medium'}</span>
                  </div>
                );
              })}
              {totalIssues === 0 && (
                <div className="px-4 py-6 text-center">
                  <CheckCircle2 className="h-6 w-6 text-green-400/40 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-muted-foreground">No blockers. This station is ready for service.</p>
                </div>
              )}
            </div>

            {/* ── Assigned Equipment ────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border/50 overflow-hidden" style={CARD}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <h3 className="text-sm font-black text-foreground">Assigned Equipment</h3>
                <button onClick={() => setActiveWorkflow('equipment')} className="text-xs font-bold text-primary">Manage →</button>
              </div>
              {equipment.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Wrench className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-muted-foreground">No equipment assigned yet.</p>
                  <button onClick={() => setActiveWorkflow('equipment')} className="mt-2 text-xs font-black text-primary">Assign Equipment →</button>
                </div>
              ) : (
                <>
                  {equipment.slice(0, 6).map(eq => {
                    const configured = isEquipmentConfigured(eq);
                    const hasMaint = eq.requiresMaintenanceChecklist;
                    const status = hasMaint ? { t: 'Attention', c: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
                      : configured ? { t: 'Good', c: 'bg-green-500/15 text-green-400 border-green-500/30' }
                      : { t: 'Setup', c: 'bg-muted/30 text-muted-foreground border-border/30' };
                    const meta = getEquipmentMeta(eq.equipmentType);
                    const EqIcon = meta.icon;
                    return (
                      <button key={eq.id} onClick={() => setActiveWorkflow('equipment')}
                        className="flex w-full items-center gap-3 px-4 py-3 border-b border-border/20 last:border-0 text-left hover:bg-white/[0.02]">
                        <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                          <EqIcon className={cn('h-4 w-4', meta.iconColor)} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{eq.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{eq.equipmentType?.replace(/-/g, ' ') || 'Equipment'}</p>
                        </div>
                        <span className={cn('shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border', status.c)}>{status.t}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                      </button>
                    );
                  })}
                  {equipment.length > 6 && (
                    <button onClick={() => setActiveWorkflow('equipment')} className="w-full px-4 py-3 text-xs font-bold text-primary text-center hover:bg-white/[0.02]">
                      +{equipment.length - 6} more →
                    </button>
                  )}
                </>
              )}
            </div>

          </div>

          {/* ════ RIGHT SIDEBAR ════ */}
          <div className="mt-4 lg:mt-0 space-y-3 lg:sticky lg:top-[72px] self-start">

            {/* Station Snapshot */}
            <div className="rounded-2xl border border-border/50 overflow-hidden" style={CARD}>
              <div className="px-4 py-3 border-b border-border/30">
                <h3 className="text-sm font-black text-foreground">Station Snapshot</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <CircularGauge pct={health.pct} color={health.color} size={56} />
                  <div className="min-w-0">
                    <p className={cn('text-base font-black leading-none', health.color === 'success' ? 'text-green-400' : health.color === 'warning' ? 'text-amber-400' : health.color === 'critical' ? 'text-red-400' : 'text-muted-foreground')}>
                      {health.color === 'success' ? 'Ready' : health.color === 'warning' ? 'Needs Setup' : health.color === 'critical' ? 'Critical' : 'Inactive'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{equipment.length} equipment piece{equipment.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Area', value: area?.name || 'Unassigned', icon: MapPin },
                    { label: 'Last updated', value: station.updated_date ? relativeTime(station.updated_date) : 'Unknown', icon: Clock },
                    { label: 'Assigned to', value: assignedEmployees[0]?.name || 'Unassigned', icon: User },
                    { label: 'Opening status', value: isActive(station) ? 'Open & Ready' : 'Inactive', icon: Activity, green: isActive(station) },
                  ].map(({ label, value, icon: Icon, green }) => (
                    <div key={label} className="flex items-start gap-2.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground leading-none">{label}</p>
                        <p className={cn('text-xs font-bold mt-0.5 truncate', green ? 'text-green-400' : 'text-foreground')}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-border/50 overflow-hidden" style={CARD}>
              <div className="px-4 py-3 border-b border-border/30">
                <h3 className="text-sm font-black text-foreground">Quick Actions</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {[
                  { label: 'Open Checklist', icon: ClipboardCheck, onClick: () => setActiveWorkflow('prep'), primary: true },
                  { label: 'Log Temps',      icon: Thermometer,    onClick: () => setActiveWorkflow('temps') },
                  { label: 'Equipment',      icon: Wrench,          onClick: () => setActiveWorkflow('equipment') },
                  { label: 'Resolve Issue',  icon: AlertTriangle,   onClick: () => navigate('/issues') },
                  { label: 'Sidework',       icon: ListChecks,      onClick: () => setActiveWorkflow('sidework') },
                  { label: 'Edit Station',   icon: Edit2,           onClick: () => setShowEditForm(true) },
                ].map(({ label, icon: Icon, onClick, primary }) => (
                  <button key={label} onClick={onClick}
                    className={cn('flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all hover:bg-white/[0.03] active:scale-95',
                      primary ? 'border-primary/40 bg-primary/8 text-primary' : 'border-border/40 text-muted-foreground hover:text-foreground')}>
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] font-bold leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Today's Summary */}
            <div className="rounded-2xl border border-border/50 overflow-hidden" style={CARD}>
              <div className="px-4 py-3 border-b border-border/30">
                <h3 className="text-sm font-black text-foreground">Today's Summary</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {(() => {
                  const incompletePrepItems = prepItems.filter(i => i.status !== 'completed');
                  const incompleteSidework  = sideworkItems.filter(i => i.status !== 'completed');
                  const incompleteTotal     = incompletePrepItems.length + incompleteSidework.length;
                  const nextTask = incompletePrepItems[0] || incompleteSidework[0];
                  return [
                    { label: 'Next task', value: nextTask ? (nextTask.name || nextTask.taskName || 'Pending').slice(0, 16) : 'All done', color: nextTask ? 'text-amber-400' : 'text-green-400' },
                    { label: 'Incomplete', value: String(incompleteTotal), color: incompleteTotal > 0 ? 'text-amber-400' : 'text-green-400' },
                    { label: 'Issues', value: String(totalIssues), color: totalIssues > 0 ? 'text-red-400' : 'text-green-400' },
                    { label: 'Temp checks', value: String(tempEquipment.length), color: 'text-blue-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-2.5" style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <p className={cn('text-sm font-black truncate', color)}>{value}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-border/50 overflow-hidden" style={CARD}>
              <div className="px-4 py-3 border-b border-border/30">
                <h3 className="text-sm font-black text-foreground">Recent Activity</h3>
              </div>
              {recentActivity.length === 0 ? (
                <p className="px-4 py-5 text-xs text-muted-foreground text-center">No recent activity for this station.</p>
              ) : (
                <div className="divide-y divide-border/15">
                  {recentActivity.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-2.5 px-4 py-2.5">
                        <span className="h-6 w-6 rounded-full bg-muted/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className={cn('h-3 w-3', item.color)} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                          {item.sub && <p className="text-[10px] text-muted-foreground truncate">{item.sub}</p>}
                        </div>
                        <span className="text-[10px] text-muted-foreground/50 shrink-0">{relativeTime(item.time)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Compliance — Last 7 Days */}
            <div className="rounded-2xl border border-border/50 overflow-hidden" style={CARD}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <h3 className="text-sm font-black text-foreground">Compliance</h3>
                <span className="text-[10px] text-muted-foreground">Last 7 Days</span>
              </div>
              <div className="p-4 space-y-3">
                {tempEquipment.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5"><Thermometer className="h-3 w-3 text-blue-400" /> Temp Logs</span>
                      <span className="text-xs font-black text-foreground">{tempLogDays}/7</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/30">
                      <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${Math.round((tempLogDays / 7) * 100)}%` }} />
                    </div>
                  </div>
                )}
                {cleaningTasks.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-green-400" /> Cleaning</span>
                      <span className="text-xs font-black text-foreground">{cleaningDone}/{cleaningTasks.length}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/30">
                      <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: cleaningTasks.length > 0 ? `${Math.round((cleaningDone / cleaningTasks.length) * 100)}%` : '0%' }} />
                    </div>
                  </div>
                )}
                {prepItems.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5"><ClipboardCheck className="h-3 w-3 text-primary" /> Prep</span>
                      <span className="text-xs font-black text-foreground">{prepDone}/{prepItems.length}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/30">
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: prepItems.length > 0 ? `${Math.round((prepDone / prepItems.length) * 100)}%` : '0%' }} />
                    </div>
                  </div>
                )}
                {tempEquipment.length === 0 && cleaningTasks.length === 0 && prepItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-1">Compliance history appears once logs are completed.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Edit Station Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="font-bold text-foreground">Edit Station</h2>
              <button onClick={() => setShowEditForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <StationForm station={station} onSave={async () => { await loadData(); setShowEditForm(false); }} onClose={() => setShowEditForm(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Workflow bottom sheet */}
      <BottomSheet open={Boolean(activeWorkflow)} onClose={() => setActiveWorkflow(null)} title={activeWorkflowDef?.label || ''}
        className={cn('max-w-full overflow-hidden', activeWorkflow === 'equipment' && 'min-h-[75vh]')}>
        {activeWorkflow && station && (
          <WorkflowSheetContent key={activeWorkflow} workflow={activeWorkflow} station={station}
            equipment={equipment} cleaningTemplates={cleaningTemplates} inventoryItems={inventoryItems}
            onEquipmentRefresh={loadData} />
        )}
      </BottomSheet>
    </div>
  );
}

export const hideBase44Index = true;
