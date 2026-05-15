import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  MapPin,
  RefreshCw,
  Search,
  Thermometer,
  Wrench,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function OperationalMap() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [areaData, stationData, equipmentData] = await Promise.all([
        base44.entities.Area.list().catch(() => []),
        base44.entities.Station.list().catch(() => []),
        base44.entities.Equipment.list().catch(() => []),
      ]);
      setAreas(areaData);
      setStations(stationData);
      setEquipment(equipmentData);
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

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Operations" subtitle="Station readiness, equipment, and area overview" />
      <main className="app-page mx-auto max-w-[640px] lg:max-w-7xl space-y-4">

        <header className="lg:hidden flex items-start justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Stations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {allActiveStations.length} station{allActiveStations.length !== 1 ? 's' : ''} · {activeAreas.length} area{activeAreas.length !== 1 ? 's' : ''}
              {attentionCount > 0 && <span className="text-amber-400"> · {attentionCount} need attention</span>}
            </p>
          </div>
          <button onClick={loadData} className="status-marker status-marker-md status-neutral mt-1" aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </header>

        <div className="grid grid-cols-3 gap-2 lg:mt-0">
          <div className="rounded-2xl border border-border/50 p-4 text-center" style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}>
            <p className="text-2xl font-black text-foreground">{activeAreas.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Areas</p>
          </div>
          <div className="rounded-2xl border border-border/50 p-4 text-center" style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}>
            <p className="text-2xl font-black text-foreground">{allActiveStations.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Stations</p>
          </div>
          <div className={cn('rounded-2xl border p-4 text-center', attentionCount > 0 ? 'border-amber-500/30' : 'border-border/50')} style={{ background: attentionCount > 0 ? 'rgba(245,158,11,0.06)' : 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}>
            <p className={cn('text-2xl font-black', attentionCount > 0 ? 'text-amber-400' : 'text-green-400')}>{attentionCount}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Attention</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search areas, stations, equipment…" className="h-11 w-full rounded-xl border border-border/60 bg-card/70 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary/40" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All stations' },
              { id: 'attention', label: `Needs attention${attentionCount > 0 ? ` (${attentionCount})` : ''}` },
              { id: 'inactive', label: 'Inactive' },
            ].map(({ id, label }) => (
              <button key={id} type="button" onClick={() => setFilter(id)} className={cn('flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200', filter === id ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive')}>
                {label}
              </button>
            ))}
          </div>
        </div>

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
                  selectedStationId={null}
                  onSelectStation={(id) => navigate(`/station/${id}`)}
                />
              );
            })}

            {unassignedStations.length > 0 && (
              <AreaCard
                area={{ id: '__unassigned', name: 'Unassigned', sortOrder: 999 }}
                stations={unassignedStations}
                stationEquipmentFor={stationEquipmentFor}
                selectedStationId={null}
                onSelectStation={(id) => navigate(`/station/${id}`)}
              />
            )}

            {visibleAreas.length === 0 && unassignedStations.length === 0 && (
              <div className="rounded-2xl border border-border/50 py-14 text-center" style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}>
                <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-muted-foreground">No stations match the current filter.</p>
                <button onClick={() => { setFilter('all'); setSearch(''); }} className="mt-3 text-xs font-black text-primary">Clear filters</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export const hideBase44Index = true;
