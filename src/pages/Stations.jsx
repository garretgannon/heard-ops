import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Plus, Edit2, Trash2, Search, Layers, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Wrench, Thermometer, X,
  Sparkles, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { useNavigate } from 'react-router-dom';
import StationForm from '@/components/StationForm';
import DesktopPageHeader from '@/components/DesktopPageHeader';

// ─── Readiness helpers (mirrored from StationPage) ────────────────────────────

function isStationActive(item) { return item?.isActive !== false; }

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
  if (!isStationActive(station)) return { color: 'neutral', pct: 0 };
  if (equipment.length === 0) return { color: 'critical', pct: 0 };
  const pct = Math.round((equipment.filter(isEquipmentConfigured).length / equipment.length) * 100);
  if (pct === 100) return { color: 'success', pct: 100 };
  return { color: pct === 0 ? 'critical' : 'warning', pct };
}

function getAttentionItems(station, equipment) {
  if (!station) return [];
  const tempEquipment = equipment.filter(e => e.temp_enabled || e.requiresTemperatureLog);
  const issueCount = equipment.filter(e => e.requiresMaintenanceChecklist).length;
  return [
    !isStationActive(station) && 'Station is inactive',
    equipment.length === 0 && 'No equipment assigned',
    tempEquipment.some(e => !hasTempSchedule(e)) &&
      `${tempEquipment.filter(e => !hasTempSchedule(e)).length} temp schedule${tempEquipment.filter(e => !hasTempSchedule(e)).length === 1 ? '' : 's'} missing`,
    issueCount > 0 && `${issueCount} maintenance issue${issueCount === 1 ? '' : 's'} flagged`,
  ].filter(Boolean);
}

// ─── Health color helpers ──────────────────────────────────────────────────────

const healthBar = { success: 'bg-green-500', warning: 'bg-amber-500', critical: 'bg-red-500', neutral: 'bg-slate-600' };
const healthText = { success: 'text-green-400', warning: 'text-amber-400', critical: 'text-red-400', neutral: 'text-slate-400' };
const healthBorder = { success: 'border-green-500/30', warning: 'border-amber-500/30', critical: 'border-red-500/30', neutral: 'border-border/30' };

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="ops-panel px-4 py-4 flex flex-col gap-1.5">
      <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', color === 'green' && 'bg-green-500/15', color === 'amber' && 'bg-amber-500/15', color === 'red' && 'bg-red-500/15', color === 'default' && 'bg-primary/15')}>
        <Icon className={cn('h-3.5 w-3.5', color === 'green' && 'text-green-400', color === 'amber' && 'text-amber-400', color === 'red' && 'text-red-400', color === 'default' && 'text-primary')} />
      </div>
      <p className="text-xl font-black text-foreground">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

// ─── Station card (list item) ─────────────────────────────────────────────────

// Exact liquid-card values — applied inline on <button> so no CSS class or
// browser preflight can stomp them. Dashboard cards are <section>/<a> and pick
// these values up automatically from .liquid-card; buttons need inline forcing.
const GLASS_BASE = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.055) 100%)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.16)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.45)',
  borderRadius: '20px',
};

const HEALTH_SELECTED = {
  success:  { borderColor: 'rgba(34,197,94,0.5)',   boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.45), 0 0 22px rgba(34,197,94,0.22)' },
  warning:  { borderColor: 'rgba(245,158,11,0.5)',  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.45), 0 0 22px rgba(245,158,11,0.22)' },
  critical: { borderColor: 'rgba(239,68,68,0.5)',   boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.45), 0 0 22px rgba(239,68,68,0.22)' },
  neutral:  { borderColor: 'rgba(255,255,255,0.28)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.45)' },
};

function StationListCard({ station, equipment, isSelected, onClick }) {
  const eq = equipment.filter(e => e.station_id === station.id || e.station_name === station.name);
  const health = stationHealth(station, eq);
  const blockers = getAttentionItems(station, eq);

  return (
    <button
      onClick={onClick}
      className="ops-panel w-full text-left px-4 py-3 transition-all duration-200 active:scale-[0.99] hover:brightness-110"
      style={{ ...GLASS_BASE, ...(isSelected ? HEALTH_SELECTED[health.color] : {}) }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground truncate">{station.name}</p>
          {station.department && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{station.department}</p>
          )}
        </div>
      </div>

      <div className="mt-2.5 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground font-semibold">Setup</span>
          <span className={cn('font-black tabular-nums', healthText[health.color])}>{health.pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className={cn('h-full rounded-full transition-all duration-700', healthBar[health.color])} style={{ width: `${health.pct}%` }} />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{eq.length} equip.</span>
        {blockers.length > 0 && (
          <span className="flex items-center gap-1 text-amber-400/80"><AlertTriangle className="h-3 w-3" />{blockers.length} issue{blockers.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </button>
  );
}

// ─── Area group ───────────────────────────────────────────────────────────────

function AreaGroup({ areaName, stations, equipment, selectedId, onSelect, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  const areaEquip = equipment.filter(e =>
    stations.some(s => s.id === e.station_id || s.name === e.station_name)
  );
  const healthList = stations.map(s => {
    const eq = equipment.filter(e => e.station_id === s.id || e.station_name === s.name);
    return stationHealth(s, eq).pct;
  });
  const areaReadiness = healthList.length > 0 ? Math.round(healthList.reduce((a, b) => a + b, 0) / healthList.length) : 0;
  const needsAttention = stations.some(s => {
    const eq = equipment.filter(e => e.station_id === s.id || e.station_name === s.name);
    return getAttentionItems(s, eq).length > 0;
  });

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 py-1 group"
      >
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{areaName}</span>
        <span className="flex-1 h-px bg-border/30" />
        {needsAttention && <AlertTriangle className="h-3 w-3 text-amber-400/70 shrink-0" />}
        <span className={cn('text-[10px] font-black tabular-nums shrink-0', areaReadiness === 100 ? 'text-green-400' : areaReadiness === 0 ? 'text-red-400' : 'text-amber-400')}>
          {areaReadiness}%
        </span>
      </button>

      {open && (
        <div className="space-y-2 pl-1">
          {stations.map(s => (
            <StationListCard
              key={s.id}
              station={s}
              equipment={equipment}
              isSelected={selectedId === s.id}
              onClick={() => onSelect(s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ station, equipment, onEdit, onDelete, onClose, onViewDetail }) {
  if (!station) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
        <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-bold text-muted-foreground">Select a station</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Click any station to view details</p>
      </div>
    );
  }

  const eq = equipment.filter(e => e.station_id === station.id || e.station_name === station.name);
  const health = stationHealth(station, eq);
  const blockers = getAttentionItems(station, eq);
  const tempEquipment = eq.filter(e => e.temp_enabled || e.requiresTemperatureLog);
  const issueCount = eq.filter(e => e.requiresMaintenanceChecklist).length;
  const configuredCount = eq.filter(isEquipmentConfigured).length;

  const metrics = [
    { label: 'Equipment', value: eq.length, icon: Wrench, color: 'default' },
    { label: 'Temp Checks', value: tempEquipment.length, icon: Thermometer, color: 'blue' },
    { label: 'Issues', value: issueCount, icon: AlertTriangle, color: issueCount > 0 ? 'red' : 'default' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Station header */}
      <div className={cn('p-4 border-b', healthBorder[health.color])} style={{
        borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
        background: health.color === 'success' ? 'rgba(34,197,94,0.07)' : health.color === 'warning' ? 'rgba(245,158,11,0.07)' : health.color === 'critical' ? 'rgba(239,68,68,0.09)' : 'rgba(255,255,255,0.04)',
        borderBottomColor: 'rgba(255,255,255,0.08)',
      }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-lg font-black text-foreground truncate">{station.name}</p>
            {station.department && <p className="text-xs text-muted-foreground mt-0.5">{station.department}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onClose && (
              <button onClick={onClose} className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground lg:hidden">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Readiness bar */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-muted-foreground">Setup readiness</span>
            <span className={cn('font-black tabular-nums', healthText[health.color])}>{health.pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className={cn('h-full rounded-full transition-all duration-700', healthBar[health.color])} style={{ width: `${health.pct}%` }} />
          </div>
        </div>

        {/* Mini metrics */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {metrics.map(m => (
            <div key={m.label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className={cn('text-base font-black', m.color === 'red' ? 'text-red-400' : 'text-foreground')}>{m.value}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Blockers */}
        {blockers.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Issues</p>
            {blockers.map(b => (
              <div key={b} className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-2.5 py-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <p className="text-xs font-semibold text-foreground">{b}</p>
              </div>
            ))}
          </div>
        )}

        {/* Equipment breakdown */}
        {eq.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Equipment ({configuredCount}/{eq.length} configured)</p>
            <div className="space-y-1">
              {eq.map(e => {
                const configured = isEquipmentConfigured(e);
                return (
                  <div key={e.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {configured
                      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
                      : <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400/70" />}
                    <p className="flex-1 text-xs font-semibold text-foreground truncate">{e.name}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {(e.temp_enabled || e.requiresTemperatureLog) && <Thermometer className="h-3 w-3 text-blue-400/70" />}
                      {e.requiresCleaningChecklist && <Sparkles className="h-3 w-3 text-green-400/70" />}
                      {e.requiresMaintenanceChecklist && <Wrench className="h-3 w-3 text-amber-400/70" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {eq.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">No equipment assigned yet</p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="p-3 space-y-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {onViewDetail && (
          <button
            onClick={onViewDetail}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black text-primary transition-all active:scale-[0.98]"
            style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)' }}
          >
            <ChevronRight className="h-3.5 w-3.5" /> View Full Station Detail
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(station)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-foreground transition-all active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => onDelete(station.id)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-red-400 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'needs-attention', label: 'Needs Attention' },
  { id: 'ready', label: 'Ready' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'no-equipment', label: 'No Equipment' },
];

export default function Stations() {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedStation, setSelectedStation] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkRows, setBulkRows] = useState([{ name: '', department: 'BOH' }]);
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    loadAll();
    const unsub = base44.entities.Station.subscribe(() => loadAll());
    return () => unsub?.();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stationData, areaData, equipData] = await Promise.all([
        base44.entities.Station.list(),
        base44.entities.Area.list().catch(() => []),
        base44.entities.Equipment.list().catch(() => []),
      ]);
      setStations(stationData || []);
      setAreas(areaData || []);
      setEquipment(equipData || []);

      // Auto-select first station needing attention, or first station
      const allStations = stationData || [];
      const allEquip = equipData || [];
      const needsAttn = allStations.find(s => {
        const eq = allEquip.filter(e => e.station_id === s.id || e.station_name === s.name);
        return getAttentionItems(s, eq).length > 0;
      });
      setSelectedStation(prev => {
        if (prev) return prev; // keep existing selection
        return needsAttn || allStations[0] || null;
      });
    } catch (err) {
      console.error('Failed to load stations data:', err);
    }
    setLoading(false);
  };

  // Filtered + searched stations
  const filteredStations = useMemo(() => {
    let list = stations;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q));
    }

    if (activeFilter === 'needs-attention') {
      list = list.filter(s => {
        const eq = equipment.filter(e => e.station_id === s.id || e.station_name === s.name);
        return getAttentionItems(s, eq).length > 0;
      });
    } else if (activeFilter === 'ready') {
      list = list.filter(s => {
        const eq = equipment.filter(e => e.station_id === s.id || e.station_name === s.name);
        return stationHealth(s, eq).color === 'success';
      });
    } else if (activeFilter === 'inactive') {
      list = list.filter(s => !isStationActive(s));
    } else if (activeFilter === 'no-equipment') {
      list = list.filter(s => !equipment.some(e => e.station_id === s.id || e.station_name === s.name));
    }

    return list;
  }, [stations, equipment, search, activeFilter]);

  // Group by area
  const grouped = useMemo(() => {
    const areaMap = new Map();
    areas.forEach(a => areaMap.set(a.id, a.name));

    const groups = {};
    filteredStations.forEach(s => {
      let areaName = 'Unassigned';
      if (s.area_id && areaMap.has(s.area_id)) areaName = areaMap.get(s.area_id);
      else if (s.area_name) areaName = s.area_name;
      else if (s.department) areaName = s.department;
      if (!groups[areaName]) groups[areaName] = [];
      groups[areaName].push(s);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredStations, areas]);

  // Summary stats
  const stats = useMemo(() => {
    const total = stations.length;
    const ready = stations.filter(s => {
      const eq = equipment.filter(e => e.station_id === s.id || e.station_name === s.name);
      return stationHealth(s, eq).color === 'success';
    }).length;
    const needsAttn = stations.filter(s => {
      const eq = equipment.filter(e => e.station_id === s.id || e.station_name === s.name);
      return getAttentionItems(s, eq).length > 0;
    }).length;
    const equipIssues = stations.filter(s => {
      const eq = equipment.filter(e => e.station_id === s.id || e.station_name === s.name);
      return eq.some(e => e.requiresMaintenanceChecklist);
    }).length;
    return { total, ready, needsAttn, equipIssues };
  }, [stations, equipment]);

  const handleSelect = (station) => {
    haptics.light();
    const isMobile = window.innerWidth < 900;
    if (isMobile) {
      navigate(`/station/${station.id}`);
    } else {
      setSelectedStation(station);
      setShowDetail(true);
    }
  };

  const handleEdit = (station) => {
    haptics.light();
    setEditingStation(station);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    haptics.light();
    if (confirm('Delete this station?')) {
      await base44.entities.Station.delete(id);
      if (selectedStation?.id === id) setSelectedStation(null);
      await loadAll();
    }
  };

  const handleSave = async () => {
    await loadAll();
    setShowForm(false);
    setEditingStation(null);
  };

  const handleBulkSave = async () => {
    const valid = bulkRows.filter(r => r.name.trim());
    if (valid.length === 0) return;
    setBulkSaving(true);
    await Promise.all(valid.map(r => base44.entities.Station.create({ name: r.name.trim(), department: r.department, isActive: true })));
    setBulkSaving(false);
    setShowBulk(false);
    setBulkRows([{ name: '', department: 'BOH' }]);
    await loadAll();
  };

  // Sync selected station data when equipment/stations reload
  const syncedSelected = useMemo(() => {
    if (!selectedStation) return null;
    return stations.find(s => s.id === selectedStation.id) || selectedStation;
  }, [selectedStation, stations]);

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Stations" subtitle="Kitchen and service station readiness" />

      {/* Mobile header */}
      <div className="lg:hidden px-4 pt-5 pb-4 flex flex-col gap-3">
        {/* Title row — matches dashboard */}
        <div className="px-1">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-[32px] font-black tracking-tight text-foreground leading-none mt-1">Stations</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
            }}
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map(f => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { haptics.light?.(); setActiveFilter(f.id); }}
                className="flex items-center whitespace-nowrap transition-all active:scale-95"
                style={{
                  height: '30px',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  background: isActive ? 'rgba(255,107,0,0.15)' : 'rgba(255,255,255,0.06)',
                  border: isActive ? '1px solid rgba(255,107,0,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  color: isActive ? '#FF6B00' : 'rgba(255,255,255,0.45)',
                  boxShadow: isActive ? '0 0 12px rgba(255,107,0,0.15)' : 'none',
                  flexShrink: 0,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="ops-page ops-stack">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3">
              <SummaryCard label="Total Stations" value={stats.total} icon={Layers} color="default" />
              <SummaryCard label="Ready" value={stats.ready} icon={CheckCircle2} color="green" />
              <SummaryCard label="Needs Attention" value={stats.needsAttn} icon={AlertTriangle} color="amber" />
              <SummaryCard label="Equip. Issues" value={stats.equipIssues} icon={Wrench} color="red" />
            </div>

            {/* Desktop: 2-column layout */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_320px] gap-5">
              {/* Left: station list */}
              <div className="space-y-4">
                {/* Desktop toolbar */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search stations..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)' }}
                    />
                  </div>
                  <div className="flex gap-1.5 pt-1 pl-0.5">
                    {FILTERS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id)}
                        className={cn(
                          'shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all',
                          activeFilter === f.id ? 'glow-active' : 'border-transparent text-muted-foreground hover:text-foreground glow-interactive'
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {grouped.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {stations.length === 0 ? 'No stations yet — add one below' : 'No stations match your filters'}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {grouped.map(([areaName, areaStations]) => (
                      <AreaGroup
                        key={areaName}
                        areaName={areaName}
                        stations={areaStations}
                        equipment={equipment}
                        selectedId={syncedSelected?.id}
                        onSelect={handleSelect}
                        defaultOpen
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: sticky detail panel */}
              <div className="sticky top-[72px] self-start">
                <div className="ops-panel overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                  <DetailPanel
                    station={syncedSelected}
                    equipment={equipment}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewDetail={syncedSelected ? () => navigate(`/station/${syncedSelected.id}`) : undefined}
                  />
                </div>
              </div>
            </div>

            {/* Mobile: list only */}
            <div className="lg:hidden space-y-5">
              {grouped.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {stations.length === 0 ? 'No stations yet' : 'No stations match your filters'}
                </div>
              ) : (
                grouped.map(([areaName, areaStations]) => (
                  <AreaGroup
                    key={areaName}
                    areaName={areaName}
                    stations={areaStations}
                    equipment={equipment}
                    selectedId={syncedSelected?.id}
                    onSelect={handleSelect}
                    defaultOpen
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-2 items-end lg:bottom-8">
        <button
          onClick={() => { setShowBulk(true); setShowForm(false); }}
          className="h-9 px-4 rounded-full text-xs font-black text-foreground flex items-center gap-1.5 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
        >
          <Layers className="h-3.5 w-3.5" /> Bulk Add
        </button>
        <button
          onClick={() => { haptics.medium(); setEditingStation(null); setShowForm(true); }}
          className="h-13 w-13 rounded-full text-white flex items-center justify-center active:scale-90 transition-all"
          style={{ width: 52, height: 52, background: 'linear-gradient(145deg, #FF8A30 0%, #FF6B00 55%, #CC4400 100%)', boxShadow: '0 0 24px rgba(255,107,0,0.55), 0 0 6px rgba(255,107,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)', border: '1px solid rgba(255,140,60,0.5)' }}
        >
          <Plus className="h-5 w-5" strokeWidth={2.4} />
        </button>
      </div>

      {/* Mobile detail bottom sheet */}
      {showDetail && syncedSelected && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={e => { if (e.target === e.currentTarget) setShowDetail(false); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div
            className="relative w-full flex flex-col"
            style={{ maxHeight: '85vh', background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.035) 100%)', backdropFilter: 'blur(28px) saturate(160%)', WebkitBackdropFilter: 'blur(28px) saturate(160%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px 24px 0 0', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 -18px 45px rgba(0,0,0,0.38)' }}
          >
            <div className="h-1 w-10 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <DetailPanel
              station={syncedSelected}
              equipment={equipment}
              onEdit={s => { setShowDetail(false); handleEdit(s); }}
              onDelete={async id => { setShowDetail(false); await handleDelete(id); }}
              onClose={() => setShowDetail(false)}
            />
          </div>
        </div>
      )}

      {/* Bulk add modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[85vh] flex flex-col" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(20,20,22,0.97) 100%)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 32px 64px rgba(0,0,0,0.6)' }}>
            <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-black text-foreground">Bulk Add Stations</h2>
              <button onClick={() => setShowBulk(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              <p className="text-xs text-muted-foreground mb-3">Add multiple stations at once. Leave blank rows empty — they'll be skipped.</p>
              {bulkRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    autoFocus={i === 0}
                    value={row.name}
                    onChange={e => setBulkRows(prev => prev.map((r, ri) => ri === i ? { ...r, name: e.target.value } : r))}
                    onKeyDown={e => { if (e.key === 'Enter') setBulkRows(prev => [...prev, { name: '', department: 'BOH' }]); }}
                    placeholder={`Station name ${i + 1}`}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                  <select
                    value={row.department}
                    onChange={e => setBulkRows(prev => prev.map((r, ri) => ri === i ? { ...r, department: e.target.value } : r))}
                    className="px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    {['BOH', 'FOH', 'Bar', 'Management'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button onClick={() => setBulkRows(prev => prev.length > 1 ? prev.filter((_, ri) => ri !== i) : prev)} className="text-red-400 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => setBulkRows(prev => [...prev, { name: '', department: 'BOH' }])} className="w-full mt-1 h-9 rounded-lg border border-dashed border-border text-xs font-bold text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
            <div className="p-4 flex gap-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={handleBulkSave} disabled={bulkSaving} className="flex-1 btn-primary text-sm disabled:opacity-50">
                {bulkSaving ? 'Saving...' : `Save ${bulkRows.filter(r => r.name.trim()).length} Station(s)`}
              </button>
              <button onClick={() => setShowBulk(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(20,20,22,0.97) 100%)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 32px 64px rgba(0,0,0,0.6)' }}>
            <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-black text-foreground">{editingStation ? 'Edit Station' : 'Create Station'}</h2>
              <button onClick={() => { setShowForm(false); setEditingStation(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <StationForm
                station={editingStation}
                onSave={handleSave}
                onClose={() => { setShowForm(false); setEditingStation(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;
