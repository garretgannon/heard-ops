import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle,
  Beaker,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Droplets,
  ListChecks,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Thermometer,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BottomSheet from '@/components/BottomSheet';

// ─── Workflows ───────────────────────────────────────────────────────────────

const WORKFLOWS = [
  { id: 'prep',      label: 'Prep',      icon: ClipboardCheck, route: '/tasks?tab=prep' },
  { id: 'sidework',  label: 'Sidework',  icon: ListChecks,     route: '/tasks?tab=sidework' },
  { id: 'breakdown', label: 'Closing',   icon: Droplets,       route: '/tasks?tab=sidework' },
  { id: 'temps',     label: 'Temps',     icon: Thermometer,    route: '/temperature-dashboard' },
  { id: 'cleaning',  label: 'Cleaning',  icon: Sparkles,       route: '/cleaning' },
  { id: 'chemicals', label: 'Chemicals', icon: Beaker,         route: '/chemical-library' },
];

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

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const isActive = (item) => item?.isActive !== false;

function normalizeText(v) { return String(v || '').trim().toLowerCase(); }

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

function stationReadinessPct(station, stationEquipment) {
  if (!isActive(station)) return 0;
  if (stationEquipment.length === 0) return 0;
  return Math.round((stationEquipment.filter(isEquipmentConfigured).length / stationEquipment.length) * 100);
}

function stationNeedsSetup(station, stationEquipment) {
  return stationReadinessPct(station, stationEquipment) < 100;
}

function stationNeedsAttention(station, stationEquipment) {
  const tempEquipment = stationEquipment.filter((item) => item.temp_enabled || item.requiresTemperatureLog);
  return stationNeedsSetup(station, stationEquipment) ||
    tempEquipment.some((item) => !hasTempSchedule(item));
}

function stationHealth(station, equipment) {
  if (!isActive(station)) return { status: 'inactive', color: 'neutral', pct: 0 };
  const pct = stationReadinessPct(station, equipment);
  if (pct === 100) return { status: 'ready', color: 'success', pct: 100 };
  if (pct === 0) return { status: 'setup', color: 'critical', pct: 0 };
  return { status: 'setup', color: 'warning', pct };
}

function matchesSearch(station, stationEquipment, query) {
  if (!query) return true;
  return [station.name, station.department, station.area_name, ...stationEquipment.map((e) => e.name)]
    .some((v) => normalizeText(v).includes(query));
}

function stationAssignments(station) {
  const assignments = station?.assignments || station?.assignedEmployees || station?.assigned_employees || [];
  if (Array.isArray(assignments) && assignments.length > 0) {
    return assignments.map((e, i) => ({
      name: e.name || e.employeeName || e.employee_name || `Assignment ${i + 1}`,
      role: e.role || e.jobCode || station.department || 'Station',
      shift: e.shift || e.shiftTime || '',
    }));
  }
  const assignedName = station?.assignedEmployeeName || station?.assigned_employee_name || station?.assigned_to;
  if (assignedName) return [{ name: assignedName, role: station?.assignedRole || station?.department || 'Station', shift: station?.assignedShift || '' }];
  return [];
}

// ─── Station mini card (inside area grid) ─────────────────────────────────────

function StationMiniCard({ station, equipment, selected, onClick }) {
  const { status, color, pct } = stationHealth(station, equipment);
  const issueCount = equipment.filter((e) => e.requiresMaintenanceChecklist).length;
  const tempCount = equipment.filter((e) => e.temp_enabled || e.requiresTemperatureLog).length;

  const borderColor = color === 'success' ? 'border-green-500/40' : color === 'warning' ? 'border-amber-500/40' : color === 'critical' ? 'border-red-500/50' : 'border-border/40';
  const accentBar  = color === 'success' ? 'bg-green-500' : color === 'warning' ? 'bg-amber-500' : color === 'critical' ? 'bg-red-500' : 'bg-slate-600';
  const iconColor  = color === 'success' ? 'text-green-400' : color === 'warning' ? 'text-amber-400' : color === 'critical' ? 'text-red-400' : 'text-muted-foreground/50';
  const StatusIcon = status === 'ready' ? CheckCircle2 : status === 'issues' ? AlertTriangle : status === 'setup' ? Wrench : X;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-2 overflow-hidden rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.97]',
        selected
          ? 'border-primary/40 bg-primary/8'
          : cn('border-border/40 bg-black/25 hover:border-border/60', borderColor.replace('border-', 'hover:border-'))
      )}
      style={selected ? { boxShadow: '0 0 0 1px rgba(230,106,31,0.25), 0 0 16px rgba(230,106,31,0.12)' } : undefined}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="truncate text-xs font-black text-foreground leading-tight">{station.name}</p>
        <StatusIcon className={cn('h-3.5 w-3.5 shrink-0 mt-px', iconColor)} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black tabular-nums text-foreground">{pct}%</span>
          <span className="text-[10px] font-bold text-muted-foreground">{equipment.length} equip</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-black/40">
          <div className={cn('h-full rounded-full transition-all duration-700', accentBar)} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {(tempCount > 0 || issueCount > 0) && (
        <div className="flex items-center gap-1.5">
          {tempCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-400/80">
              <Thermometer className="h-2.5 w-2.5" />{tempCount}
            </span>
          )}
          {issueCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-400">
              <AlertTriangle className="h-2.5 w-2.5" />{issueCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Area card ────────────────────────────────────────────────────────────────

function AreaCard({ area, stations, stationEquipmentFor, selectedStationId, onSelectStation }) {
  const [collapsed, setCollapsed] = useState(false);
  const needsAttentionCount = stations.filter((s) => stationNeedsAttention(s, stationEquipmentFor(s))).length;
  const allReady = needsAttentionCount === 0;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border/50"
      style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5"
      >
        <div className="flex items-center gap-2.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="text-sm font-black tracking-tight text-foreground">{area.name}</span>
          <span className="text-[10px] font-bold text-muted-foreground">{stations.length} station{stations.length === 1 ? '' : 's'}</span>
        </div>
        <div className="flex items-center gap-2">
          {needsAttentionCount > 0 ? (
            <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-400">
              <AlertTriangle className="h-2.5 w-2.5" />
              {needsAttentionCount} need attention
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full border border-green-500/25 bg-green-500/8 px-2 py-0.5 text-[10px] font-black text-green-400">
              <CheckCircle2 className="h-2.5 w-2.5" />
              All ready
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', collapsed && '-rotate-90')} />
        </div>
      </button>

      {!collapsed && (
        <div className="grid grid-cols-2 gap-2 border-t border-border/30 px-3 pb-3 pt-3 sm:grid-cols-3">
          {stations.map((station) => (
            <StationMiniCard
              key={station.id}
              station={station}
              equipment={stationEquipmentFor(station)}
              selected={station.id === selectedStationId}
              onClick={() => onSelectStation(station.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Equipment config row (inside detail sheet) ───────────────────────────────

function EquipmentRow({ item, station, area, cleaningTemplates, maintenanceTemplates, inventoryItems, onRefresh }) {
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

  const linkedItems = (item.item_ids || [])
    .map((id) => (inventoryItems || []).find((p) => p.id === id))
    .filter(Boolean);

  const searchResults = itemSearch.trim()
    ? (inventoryItems || [])
        .filter((p) => p.itemName?.toLowerCase().includes(itemSearch.toLowerCase()) && !(item.item_ids || []).includes(p.id))
        .slice(0, 8)
    : [];

  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-black/20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-all hover:bg-white/[0.03]"
      >
        <span className="status-marker status-marker-sm status-neutral shrink-0">
          <Wrench className="h-3 w-3" />
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

          {/* Inventory toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Package className="h-3.5 w-3.5 text-green-400" />Inventory
              </span>
              <button
                type="button"
                onClick={() => updateField('inInventory', !hasInventory)}
                className={cn('h-5 w-9 rounded-full border p-0.5 transition-all', hasInventory ? 'border-green-500/50 bg-green-500/20' : 'border-border bg-muted/40')}
              >
                <span className={cn('block h-3.5 w-3.5 rounded-full bg-foreground transition-transform', hasInventory && 'translate-x-4 bg-green-400')} />
              </button>
            </div>

            {/* Items stored in this equipment */}
            {hasInventory && (
              <div className="space-y-2 rounded-lg border border-border/40 bg-black/20 p-2.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Items stored here</p>

                {linkedItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {linkedItems.map((pi) => (
                      <span key={pi.id} className="flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-foreground">
                        {pi.itemName}
                        <button
                          type="button"
                          onClick={() => removeItem(pi.id)}
                          className="ml-0.5 text-muted-foreground transition-colors hover:text-red-400"
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
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search items to add…"
                    className="h-8 w-full rounded-lg border border-border/60 bg-background px-3 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl">
                      {searchResults.map((pi) => (
                        <button
                          key={pi.id}
                          type="button"
                          onClick={() => addItem(pi.id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs transition-colors hover:bg-muted/60"
                        >
                          <span className="font-semibold text-foreground">{pi.itemName}</span>
                          <span className="capitalize text-muted-foreground">{pi.category || ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {linkedItems.length === 0 && !itemSearch && (
                  <p className="text-[10px] italic text-muted-foreground/60">Search above to link items stored in this equipment.</p>
                )}
              </div>
            )}
          </div>

          {/* Temp toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground"><Thermometer className="h-3.5 w-3.5 text-blue-400" />Temperatures</span>
              <button
                type="button"
                onClick={() => updateField('requiresTemperatureLog', !hasTemp)}
                className={cn('h-5 w-9 rounded-full border p-0.5 transition-all', hasTemp ? 'border-blue-500/50 bg-blue-500/20' : 'border-border bg-muted/40')}
              >
                <span className={cn('block h-3.5 w-3.5 rounded-full bg-foreground transition-transform', hasTemp && 'translate-x-4 bg-blue-400')} />
              </button>
            </div>
            {hasTemp && (
              <select
                value={item.temp_check_frequency_minutes || ''}
                onChange={(e) => updateField('temp_check_frequency_minutes', e.target.value ? Number(e.target.value) : null)}
                className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none"
              >
                <option value="">Manual only</option>
                <option value="30">Every 30 min</option>
                <option value="60">Every hour</option>
                <option value="120">Every 2 hours</option>
                <option value="240">Every 4 hours</option>
              </select>
            )}
          </div>

          {/* Cleaning toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground"><Sparkles className="h-3.5 w-3.5 text-green-400" />Cleaning</span>
              <button
                type="button"
                onClick={() => updateField('requiresCleaningChecklist', !hasCleaning)}
                className={cn('h-5 w-9 rounded-full border p-0.5 transition-all', hasCleaning ? 'border-green-500/50 bg-green-500/20' : 'border-border bg-muted/40')}
              >
                <span className={cn('block h-3.5 w-3.5 rounded-full bg-foreground transition-transform', hasCleaning && 'translate-x-4 bg-green-400')} />
              </button>
            </div>
            {hasCleaning && cleaningTemplates.length > 0 && (
              <select
                value={item.cleaning_template_id || ''}
                onChange={(e) => {
                  const t = cleaningTemplates.find((o) => o.id === e.target.value);
                  updateFields({ cleaning_template_id: t?.id || '', cleaning_template_name: t?.name || '' });
                }}
                className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none"
              >
                <option value="">No template linked</option>
                {cleaningTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>

          {/* Maintenance toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground"><Wrench className="h-3.5 w-3.5 text-amber-400" />Maintenance</span>
              <button
                type="button"
                onClick={() => updateField('requiresMaintenanceChecklist', !hasMaint)}
                className={cn('h-5 w-9 rounded-full border p-0.5 transition-all', hasMaint ? 'border-amber-500/50 bg-amber-500/20' : 'border-border bg-muted/40')}
              >
                <span className={cn('block h-3.5 w-3.5 rounded-full bg-foreground transition-transform', hasMaint && 'translate-x-4 bg-amber-400')} />
              </button>
            </div>
          </div>

          {saving && <p className="text-[10px] font-bold text-primary">Saving…</p>}
        </div>
      )}
    </div>
  );
}

// ─── Add equipment inline form ─────────────────────────────────────────────────

function AddEquipmentForm({ station, area, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('other');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.Equipment.create({
      name: name.trim(), equipmentType: type,
      area_id: area?.id || station.area_id || '', area_name: area?.name || station.area_name || '',
      station_id: station.id, station_name: station.name,
      department: station.department || '', isActive: true,
    });
    await onSave?.();
    setSaving(false);
  };

  return (
    <div className="space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
      <input
        value={name} onChange={(e) => setName(e.target.value)} placeholder="Equipment name"
        className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
      />
      <select
        value={type} onChange={(e) => setType(e.target.value)}
        className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-xs font-semibold text-foreground outline-none"
      >
        {EQUIPMENT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={saving || !name.trim()}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground disabled:opacity-50"
        >{saving ? 'Saving…' : 'Add Equipment'}</button>
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-lg border border-border/60 px-3 py-2 text-xs font-black text-muted-foreground"
        >Cancel</button>
      </div>
    </div>
  );
}

// ─── Station detail sheet (no tabs, single scroll) ───────────────────────────

function StationDetailSheet({ station, area, equipment, cleaningTemplates, maintenanceTemplates, inventoryItems, open, onClose, onRefresh }) {
  const navigate = useNavigate();
  const [addingEquipment, setAddingEquipment] = useState(false);
  const [equipmentExpanded, setEquipmentExpanded] = useState(true);
  const [workflowsExpanded, setWorkflowsExpanded] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setAddingEquipment(false); }, [station?.id, open]);

  if (!station) return null;

  const { status, color, pct } = stationHealth(station, equipment);
  const tempEquipment = equipment.filter((e) => e.temp_enabled || e.requiresTemperatureLog);
  const issueCount = equipment.filter((e) => e.requiresMaintenanceChecklist).length;
  const configuredCount = equipment.filter(isEquipmentConfigured).length;
  const assignedEmployees = stationAssignments(station);

  const attentionItems = [
    !isActive(station) && 'Station is inactive',
    equipment.length === 0 && 'No equipment assigned',
    tempEquipment.some((e) => !hasTempSchedule(e)) && `${tempEquipment.filter((e) => !hasTempSchedule(e)).length} temp schedule${tempEquipment.filter((e) => !hasTempSchedule(e)).length === 1 ? '' : 's'} missing`,
    issueCount > 0 && `${issueCount} maintenance issue${issueCount === 1 ? '' : 's'} flagged`,
  ].filter(Boolean);

  const headerBorderColor = color === 'success' ? 'border-green-500/30' : color === 'warning' ? 'border-amber-500/30' : color === 'critical' ? 'border-red-500/35' : 'border-border/40';
  const headerBg = color === 'success' ? 'rgba(34,197,94,0.05)' : color === 'warning' ? 'rgba(245,158,11,0.05)' : color === 'critical' ? 'rgba(239,68,68,0.07)' : 'transparent';
  const accentBar = color === 'success' ? 'bg-green-500' : color === 'warning' ? 'bg-amber-500' : color === 'critical' ? 'bg-red-500' : 'bg-slate-600';

  const toggleActive = async () => {
    setSaving(true);
    await base44.entities.Station.update(station.id, { isActive: !isActive(station) });
    await onRefresh?.();
    setSaving(false);
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="space-y-4 pb-2">

        {/* Header */}
        <div
          className={cn('rounded-2xl border p-4', headerBorderColor)}
          style={{ background: headerBg }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="metric-label">{area?.name || 'Station'}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">{station.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{station.department || 'Operations'}</p>
            </div>
            <button
              type="button"
              onClick={toggleActive}
              disabled={saving}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] transition-all',
                isActive(station) ? 'border-green-500/40 bg-green-500/15 text-green-400' : 'border-border/60 bg-muted/30 text-muted-foreground'
              )}
            >
              {saving ? '…' : isActive(station) ? 'Active' : 'Inactive'}
            </button>
          </div>

          {/* Readiness bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-muted-foreground">Setup readiness</span>
              <span className="font-black tabular-nums text-foreground">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
              <div className={cn('h-full rounded-full transition-all duration-700', accentBar)} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Metrics row */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Equipment', value: equipment.length },
              { label: 'Temp checks', value: tempEquipment.length },
              { label: 'Issues', value: issueCount, highlight: issueCount > 0 },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="rounded-xl bg-black/20 p-2.5 text-center">
                <p className={cn('text-lg font-black', highlight ? 'text-red-400' : 'text-foreground')}>{value}</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Attention items */}
        {attentionItems.length > 0 && (
          <div className="space-y-1.5">
            {attentionItems.map((item) => (
              <div key={item} className="flex items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-xs font-bold text-foreground">{item}</p>
              </div>
            ))}
          </div>
        )}

        {/* Assigned today */}
        {assignedEmployees.length > 0 && (
          <div className="space-y-2">
            <p className="metric-label">Assigned Today</p>
            <div className="flex flex-wrap gap-2">
              {assignedEmployees.map((e) => (
                <div key={e.name} className="flex items-center gap-2 rounded-full border border-border/50 bg-black/25 py-1.5 pl-1.5 pr-3">
                  <span className="status-marker status-marker-sm status-neutral">{e.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}</span>
                  <span className="text-xs font-bold text-foreground">{e.name}</span>
                  {e.shift && <span className="text-[10px] text-muted-foreground">{e.shift}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment section */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setEquipmentExpanded((e) => !e)}
            className="flex w-full items-center justify-between gap-3"
          >
            <p className="metric-label">Equipment ({equipment.length})</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground">{configuredCount}/{equipment.length} configured</span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !equipmentExpanded && '-rotate-90')} />
            </div>
          </button>

          {equipmentExpanded && (
            <div className="space-y-2">
              {addingEquipment ? (
                <AddEquipmentForm
                  station={station} area={area}
                  onSave={async () => { await onRefresh?.(); setAddingEquipment(false); }}
                  onCancel={() => setAddingEquipment(false)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingEquipment(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-xs font-black text-primary transition-all hover:bg-primary/8"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Equipment
                </button>
              )}

              {equipment.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 px-3 py-5 text-center text-xs font-semibold text-muted-foreground">
                  No equipment assigned to this station yet.
                </div>
              ) : (
                equipment.map((item) => (
                  <EquipmentRow
                    key={item.id}
                    item={item}
                    station={station}
                    area={area}
                    cleaningTemplates={cleaningTemplates}
                    maintenanceTemplates={maintenanceTemplates}
                    inventoryItems={inventoryItems}
                    onRefresh={onRefresh}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Workflows */}
        {(() => {
          const stationWorkflows = WORKFLOWS.filter(({ id }) => {
            if (id === 'temps')     return tempEquipment.length > 0;
            if (id === 'cleaning')  return equipment.some((e) => e.requiresCleaningChecklist);
            if (id === 'breakdown') return equipment.some((e) => e.requiresMaintenanceChecklist);
            return equipment.length > 0; // prep, sidework, chemicals — only if station has any equipment
          });

          if (stationWorkflows.length === 0) return null;

          return (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setWorkflowsExpanded((e) => !e)}
                className="flex w-full items-center justify-between gap-3"
              >
                <p className="metric-label">Jump to workflow</p>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !workflowsExpanded && '-rotate-90')} />
              </button>

              {workflowsExpanded && (
                <div className="grid grid-cols-3 gap-2">
                  {stationWorkflows.map(({ id, label, icon: Icon, route }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        onClose?.();
                        navigate(route, { state: { stationId: station.id, stationName: station.name, areaId: area?.id, areaName: area?.name } });
                      }}
                      className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-black/20 px-2 py-3 text-center transition-all active:scale-[0.97] hover:border-primary/25 hover:bg-primary/5"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] font-black text-muted-foreground">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </BottomSheet>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OperationalMap() {
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [cleaningTemplates, setCleaningTemplates] = useState([]);
  const [maintenanceTemplates, setMaintenanceTemplates] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'attention' | 'inactive'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [areaData, stationData, equipmentData, cleaningTemplateData, automationTemplateData, inventoryData] = await Promise.all([
        base44.entities.Area.list().catch(() => []),
        base44.entities.Station.list().catch(() => []),
        base44.entities.Equipment.list().catch(() => []),
        base44.entities.CleaningTemplate.list().catch(() => []),
        base44.entities.AutomationTemplate.filter({ category: 'maintenance_check' }).catch(() => []),
        base44.entities.InventoryItem.list().catch(() => []),
      ]);
      setAreas(areaData);
      setStations(stationData);
      setEquipment(equipmentData);
      setCleaningTemplates(cleaningTemplateData.filter(isActive));
      setMaintenanceTemplates(automationTemplateData.filter((i) => i.is_active !== false));
      setInventoryItems(inventoryData);
    } catch (err) {
      console.error('Failed to load operational data:', err);
    }
    setLoading(false);
  };

  const activeAreas = useMemo(() => areas.filter(isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)), [areas]);
  const sortedStations = useMemo(() => [...stations].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)), [stations]);
  const activeEquipment = useMemo(() => equipment.filter(isActive), [equipment]);

  const query = search.trim().toLowerCase();
  const stationEquipmentFor = (station) => activeEquipment.filter((e) => e.station_id === station.id || e.station_name === station.name);

  const stationVisible = (station) => {
    const eq = stationEquipmentFor(station);
    if (!matchesSearch(station, eq, query)) return false;
    if (filter === 'attention') return isActive(station) && stationNeedsAttention(station, eq);
    if (filter === 'inactive') return !isActive(station);
    return isActive(station);
  };

  const visibleAreas = activeAreas.filter((area) => {
    const areaStations = sortedStations.filter((s) => s.area_id === area.id || s.area_name === area.name);
    return areaStations.some(stationVisible);
  });

  const unassignedStations = sortedStations.filter((s) => {
    if (!stationVisible(s)) return false;
    return !activeAreas.some((a) => s.area_id === a.id || s.area_name === a.name);
  });

  const allActiveStations = sortedStations.filter(isActive);
  const attentionCount = allActiveStations.filter((s) => stationNeedsAttention(s, stationEquipmentFor(s))).length;
  const issueCount = activeEquipment.filter((e) => e.requiresMaintenanceChecklist).length;

  const selectedStation = sortedStations.find((s) => s.id === selectedStationId);
  const selectedArea = selectedStation ? activeAreas.find((a) => selectedStation.area_id === a.id || selectedStation.area_name === a.name) : null;
  const selectedEquipment = selectedStation ? stationEquipmentFor(selectedStation) : [];

  return (
    <div className="app-screen">
      <main className="app-page mx-auto max-w-[640px] space-y-4">

        {/* Header */}
        <header className="flex items-start justify-between gap-4 pt-1">
          <div>
            <p className="metric-label">Operations</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Operational Map</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {allActiveStations.length} station{allActiveStations.length !== 1 ? 's' : ''} · {activeAreas.length} area{activeAreas.length !== 1 ? 's' : ''}
              {attentionCount > 0 && <span className="text-amber-400"> · {attentionCount} need attention</span>}
            </p>
          </div>
          <button
            onClick={loadData}
            className="status-marker status-marker-md status-neutral mt-1"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </header>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className="rounded-2xl border border-border/50 p-4 text-center"
            style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}
          >
            <p className="text-2xl font-black text-foreground">{activeAreas.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Areas</p>
          </div>
          <div
            className="rounded-2xl border border-border/50 p-4 text-center"
            style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}
          >
            <p className="text-2xl font-black text-foreground">{allActiveStations.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Stations</p>
          </div>
          <div
            className={cn('rounded-2xl border p-4 text-center', attentionCount > 0 ? 'border-amber-500/30' : 'border-border/50')}
            style={{ background: attentionCount > 0 ? 'rgba(245,158,11,0.06)' : 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}
          >
            <p className={cn('text-2xl font-black', attentionCount > 0 ? 'text-amber-400' : 'text-green-400')}>{attentionCount}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Attention</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search areas, stations, equipment…"
              className="h-11 w-full rounded-xl border border-border/60 bg-card/70 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary/40"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All stations' },
              { id: 'attention', label: `Needs attention${attentionCount > 0 ? ` (${attentionCount})` : ''}` },
              { id: 'inactive', label: 'Inactive' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                  filter === id ? 'glow-active' : 'border border-border/50 bg-card/70 text-muted-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-40 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAreas.map((area) => {
              const areaStations = sortedStations.filter((s) => (s.area_id === area.id || s.area_name === area.name) && stationVisible(s));
              if (areaStations.length === 0) return null;
              return (
                <AreaCard
                  key={area.id}
                  area={area}
                  stations={areaStations}
                  stationEquipmentFor={stationEquipmentFor}
                  selectedStationId={selectedStationId}
                  onSelectStation={(id) => setSelectedStationId((prev) => (prev === id ? null : id))}
                />
              );
            })}

            {unassignedStations.length > 0 && (
              <AreaCard
                area={{ id: '__unassigned', name: 'Unassigned', sortOrder: 999 }}
                stations={unassignedStations}
                stationEquipmentFor={stationEquipmentFor}
                selectedStationId={selectedStationId}
                onSelectStation={(id) => setSelectedStationId((prev) => (prev === id ? null : id))}
              />
            )}

            {visibleAreas.length === 0 && unassignedStations.length === 0 && (
              <div
                className="rounded-2xl border border-border/50 py-14 text-center"
                style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}
              >
                <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-muted-foreground">No stations match the current filter.</p>
                <button onClick={() => { setFilter('all'); setSearch(''); }} className="mt-3 text-xs font-black text-primary">
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <StationDetailSheet
        station={selectedStation}
        area={selectedArea}
        equipment={selectedEquipment}
        cleaningTemplates={cleaningTemplates}
        maintenanceTemplates={maintenanceTemplates}
        inventoryItems={inventoryItems}
        open={Boolean(selectedStation)}
        onClose={() => setSelectedStationId(null)}
        onRefresh={loadData}
      />
    </div>
  );
}

export const hideBase44Index = true;
