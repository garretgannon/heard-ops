import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Plus, Edit2, Trash2, Search, Layers, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Wrench, Thermometer, X,
  Sparkles, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
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
const healthBadge = {
  success: 'bg-green-500/15 text-green-400 border-green-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  neutral: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};
const healthLabel = { success: 'Ready', warning: 'Needs Setup', critical: 'Critical', neutral: 'Inactive' };

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card-glass border border-border rounded-xl p-3 flex flex-col gap-1">
      <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', color === 'green' && 'bg-green-500/15', color === 'amber' && 'bg-amber-500/15', color === 'red' && 'bg-red-500/15', color === 'default' && 'bg-primary/15')}>
        <Icon className={cn('h-3.5 w-3.5', color === 'green' && 'text-green-400', color === 'amber' && 'text-amber-400', color === 'red' && 'text-red-400', color === 'default' && 'text-primary')} />
      </div>
      <p className="text-xl font-black text-foreground">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

// ─── Station card (list item) ─────────────────────────────────────────────────

function StationListCard({ station, equipment, isSelected, onClick }) {
  const eq = equipment.filter(e => e.station_id === station.id || e.station_name === station.name);
  const health = stationHealth(station, eq);
  const blockers = getAttentionItems(station, eq);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border p-3 transition-all duration-200',
        isSelected
          ? cn('glow-active', healthBorder[health.color])
          : 'border-border/40 hover:border-border/70 card-glass'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground truncate">{station.name}</p>
          {station.department && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{station.department}</p>
          )}
        </div>
        <span className={cn('shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border', healthBadge[health.color])}>
          {healthLabel[health.color]}
        </span>
      </div>

      <div className="mt-2.5 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground font-semibold">Setup</span>
          <span className={cn('font-black tabular-nums', healthText[health.color])}>{health.pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/30">
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

function DetailPanel({ station, equipment, onEdit, onDelete, onClose }) {
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
    <div className="flex flex-col h-full">
      {/* Station header */}
      <div className={cn('p-4 border-b rounded-t-2xl', healthBorder[health.color])} style={{
        background: health.color === 'success' ? 'rgba(34,197,94,0.05)' : health.color === 'warning' ? 'rgba(245,158,11,0.05)' : health.color === 'critical' ? 'rgba(239,68,68,0.07)' : 'transparent'
      }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-lg font-black text-foreground truncate">{station.name}</p>
            {station.department && <p className="text-xs text-muted-foreground mt-0.5">{station.department}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', healthBadge[health.color])}>
              {healthLabel[health.color]}
            </span>
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
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
            <div className={cn('h-full rounded-full transition-all duration-700', healthBar[health.color])} style={{ width: `${health.pct}%` }} />
          </div>
        </div>

        {/* Mini metrics */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {metrics.map(m => (
            <div key={m.label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
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
                  <div key={e.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2 border border-border/30" style={{ background: 'rgba(0,0,0,0.2)' }}>
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
      <div className="p-3 border-t border-border/30 flex gap-2 shrink-0">
        <button
          onClick={() => onEdit(station)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border/50 py-2 text-xs font-bold text-foreground hover:bg-muted/50 transition-all"
        >
          <Edit2 className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          onClick={() => onDelete(station.id)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
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
    setSelectedStation(station);
    setShowDetail(true);
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
      <div className="lg:hidden bg-card border-b border-border px-4 pt-4 pb-3 sticky top-0 z-10">
        <h1 className="text-2xl font-black tracking-tight text-foreground mb-3">Stations</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5 mt-2.5 overflow-x-auto scrollbar-hide pt-1 pb-0.5 pl-0.5">
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

      <div className="app-page lg:max-w-none lg:px-6">
        {loading ? (
          <div className="space-y-3 pt-2">
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
            <div className="hidden lg:grid lg:grid-cols-[1fr_320px] gap-5 mt-1">
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
                      className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
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
                <div className="card-glass border border-border rounded-2xl overflow-hidden" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                  <DetailPanel
                    station={syncedSelected}
                    equipment={equipment}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            </div>

            {/* Mobile: list only */}
            <div className="lg:hidden space-y-5 mt-1">
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
      <div className="fixed bottom-20 right-4 flex flex-col gap-2 items-end lg:bottom-6">
        <button
          onClick={() => { setShowBulk(true); setShowForm(false); }}
          className="h-10 px-3 rounded-full card-glass border border-border text-xs font-bold text-foreground flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
        >
          <Layers className="h-4 w-4" /> Bulk Add
        </button>
        <button
          onClick={() => { haptics.medium(); setEditingStation(null); setShowForm(true); }}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile detail bottom sheet */}
      {showDetail && syncedSelected && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={e => { if (e.target === e.currentTarget) setShowDetail(false); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div
            className="relative w-full card-glass border border-border rounded-t-2xl flex flex-col"
            style={{ maxHeight: '85vh' }}
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
          <div className="w-full max-w-lg bg-card rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="font-bold text-foreground">Bulk Add Stations</h2>
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
            <div className="p-4 border-t border-border flex gap-2 shrink-0">
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
          <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-card border-b border-border p-4 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-foreground">{editingStation ? 'Edit Station' : 'Create Station'}</h2>
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
