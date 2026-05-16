import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle, Beaker, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  ClipboardCheck, ListChecks, Package, Plus, RefreshCw, Search, Sparkles, Thermometer,
  Wrench, X, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BottomSheet from '@/components/BottomSheet';
import { getEquipmentMeta } from '@/lib/equipmentConfig';

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

// ─── Main Page ────────────────────────────────────────────────────────────────

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

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stations, areas, allEquipment, cleaningTemplateData, inventoryData] = await Promise.all([
        base44.entities.Station.list().catch(() => []),
        base44.entities.Area.list().catch(() => []),
        base44.entities.Equipment.list().catch(() => []),
        base44.entities.CleaningTemplate.list().catch(() => []),
        base44.entities.InventoryItem.list().catch(() => []),
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

  const health = station ? stationHealth(station, equipment) : { color: 'neutral', pct: 0 };
  const tempEquipment = equipment.filter(e => e.temp_enabled || e.requiresTemperatureLog);
  const issueCount = equipment.filter(e => e.requiresMaintenanceChecklist).length;
  const assignedEmployees = station ? stationAssignments(station) : [];

  const attentionItems = station ? [
    !isActive(station) && 'Station is inactive',
    equipment.length === 0 && 'No equipment assigned',
    tempEquipment.some(e => !hasTempSchedule(e)) && `${tempEquipment.filter(e => !hasTempSchedule(e)).length} temp schedule${tempEquipment.filter(e => !hasTempSchedule(e)).length === 1 ? '' : 's'} missing`,
    issueCount > 0 && `${issueCount} maintenance issue${issueCount === 1 ? '' : 's'} flagged`,
  ].filter(Boolean) : [];

  const accentBar = health.color === 'success' ? 'bg-green-500' : health.color === 'warning' ? 'bg-amber-500' : health.color === 'critical' ? 'bg-red-500' : 'bg-slate-600';
  const headerBorderColor = health.color === 'success' ? 'border-green-500/30' : health.color === 'warning' ? 'border-amber-500/30' : health.color === 'critical' ? 'border-red-500/35' : 'border-border/40';
  const headerBg = health.color === 'success' ? 'rgba(34,197,94,0.05)' : health.color === 'warning' ? 'rgba(245,158,11,0.05)' : health.color === 'critical' ? 'rgba(239,68,68,0.07)' : 'transparent';

  const activeWorkflowDef = WORKFLOWS.find(w => w.id === activeWorkflow);

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-background">
      {/* Fixed header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 h-[60px]"
        style={{ background: 'linear-gradient(180deg, rgba(6,10,16,0.97) 0%, rgba(8,13,20,0.95) 100%)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button onClick={() => navigate('/operational-map')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 active:scale-95 transition-all shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-4 w-32 skeleton rounded" />
          ) : (
            <>
              <h1 className="text-base font-black tracking-tight text-foreground leading-none truncate">{station?.name || 'Station'}</h1>
              {area && <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-none">{area.name}</p>}
            </>
          )}
        </div>
        <button onClick={loadData} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 active:scale-95 transition-all shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl overflow-x-hidden px-4 pb-24 pt-[60px] lg:max-w-4xl lg:px-8">
        {loading ? (
          <div className="space-y-4 pt-4">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-16 rounded-2xl" />
            <div className="skeleton h-32 rounded-2xl" />
          </div>
        ) : !station ? null : (
          <div className="space-y-4 pt-4">

            {/* Identity card */}
            <div className={cn('rounded-2xl border p-4', headerBorderColor)} style={{ background: headerBg }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{area?.name || 'Station'}</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">{station.name}</h2>
                  {station.department && <p className="mt-0.5 text-xs text-muted-foreground">{station.department}</p>}
                </div>
                <button type="button" onClick={toggleActive} disabled={saving}
                  className={cn('shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] transition-all',
                    isActive(station) ? 'border-green-500/40 bg-green-500/15 text-green-400' : 'border-border/60 bg-muted/30 text-muted-foreground')}>
                  {saving ? '…' : isActive(station) ? 'Active' : 'Inactive'}
                </button>
              </div>

              {/* Readiness bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-muted-foreground">Setup readiness</span>
                  <span className="font-black tabular-nums text-foreground">{health.pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
                  <div className={cn('h-full rounded-full transition-all duration-700', accentBar)} style={{ width: `${health.pct}%` }} />
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: 'Equipment', value: equipment.length },
                  { label: 'Temp checks', value: tempEquipment.length },
                  { label: 'Issues', value: issueCount, highlight: issueCount > 0 },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(0,0,0,0.3)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                    <p className={cn('text-lg font-black', highlight ? 'text-red-400' : 'text-foreground')}>{value}</p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Attention alerts */}
            {attentionItems.length > 0 && (
              <div className="space-y-1.5">
                {attentionItems.map(item => (
                  <div key={item} className="flex items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <p className="text-xs font-bold text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Assigned employees */}
            {assignedEmployees.length > 0 && (
              <div className="space-y-2">
                <p className="metric-label">Assigned Today</p>
                <div className="flex flex-wrap gap-2">
                  {assignedEmployees.map(e => (
                    <div key={e.name} className="flex items-center gap-2 rounded-full border border-border/40 py-1.5 pl-1.5 pr-3" style={{ background: 'rgba(11,17,24,0.95)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                      <span className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-black text-primary">
                        {e.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-foreground">{e.name}</span>
                      {e.shift && <span className="text-[10px] text-muted-foreground">{e.shift}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow grid */}
            <div>
              <p className="metric-label mb-2">Workflows</p>
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
                {WORKFLOWS.map(({ id: wid, label, icon: WorkflowIcon }) => (
                  <button key={wid} type="button" onClick={() => setActiveWorkflow(wid)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border/40 px-2 py-4 text-center transition-all active:scale-[0.97] hover:border-primary/30"
                    style={cardStyle}>
                    <WorkflowIcon className="h-5 w-5 text-primary/70" />
                    <span className="text-[10px] font-black text-foreground/70">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Workflow bottom sheet */}
      <BottomSheet open={Boolean(activeWorkflow)} onClose={() => setActiveWorkflow(null)} title={activeWorkflowDef?.label || ''} className={cn('max-w-full overflow-hidden', activeWorkflow === 'equipment' && 'min-h-[75vh]')}>
        {activeWorkflow && station && (
          <WorkflowSheetContent
            key={activeWorkflow}
            workflow={activeWorkflow}
            station={station}
            equipment={equipment}
            cleaningTemplates={cleaningTemplates}
            inventoryItems={inventoryItems}
            onEquipmentRefresh={loadData}
          />
        )}
      </BottomSheet>
    </div>
  );
}

export const hideBase44Index = true;
