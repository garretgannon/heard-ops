import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import {
  AlertTriangle, CheckCircle2, ExternalLink,
  Layers, MapPin, RefreshCw, Search, Thermometer, Wrench, X,
  Sparkles, Activity, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

function stationReadinessPct(station, eq) {
  if (!isActive(station)) return 0;
  if (eq.length === 0) return 0;
  return Math.round((eq.filter(isEquipmentConfigured).length / eq.length) * 100);
}

function stationHealth(station, eq) {
  if (!isActive(station)) return { color: 'neutral', pct: 0 };
  const pct = stationReadinessPct(station, eq);
  if (pct === 100) return { color: 'success', pct };
  if (pct === 0)   return { color: 'critical', pct };
  return { color: 'warning', pct };
}

function getAttentionItems(station, eq) {
  if (!station) return [];
  const tempEq = eq.filter(e => e.temp_enabled || e.requiresTemperatureLog);
  const issues = eq.filter(e => e.requiresMaintenanceChecklist).length;
  return [
    !isActive(station) && 'Station inactive',
    eq.length === 0 && 'No equipment',
    tempEq.some(e => !hasTempSchedule(e)) && `${tempEq.filter(e => !hasTempSchedule(e)).length} temp schedule${tempEq.filter(e => !hasTempSchedule(e)).length === 1 ? '' : 's'} missing`,
    issues > 0 && `${issues} maintenance issue${issues === 1 ? '' : 's'}`,
  ].filter(Boolean);
}

// ─── Color helpers ────────────────────────────────────────────────────────────

const barColor  = { success: 'bg-green-500', warning: 'bg-amber-500', critical: 'bg-red-500', neutral: 'bg-slate-600' };
const textColor = { success: 'text-green-400', warning: 'text-amber-400', critical: 'text-red-400', neutral: 'text-slate-400' };
const glowColor = {
  success: 'border-green-500/50 shadow-[0_0_0_1px_rgba(34,197,94,0.2),0_0_14px_rgba(34,197,94,0.15)]',
  warning: 'border-amber-500/50 shadow-[0_0_0_1px_rgba(245,158,11,0.2),0_0_14px_rgba(245,158,11,0.15)]',
  critical: 'border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.2),0_0_14px_rgba(239,68,68,0.15)]',
  neutral: 'border-slate-600/50',
};
const bgColor = {
  success: 'rgba(34,197,94,0.05)',
  warning: 'rgba(245,158,11,0.06)',
  critical: 'rgba(239,68,68,0.08)',
  neutral: 'rgba(11,17,24,0.9)',
};
const badgeStyle = {
  success: 'bg-green-500/15 text-green-400 border-green-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  neutral:  'bg-slate-500/15 text-slate-400 border-slate-500/30',
};
const badgeLabel = { success: 'Ready', warning: 'Setup', critical: 'Critical', neutral: 'Inactive' };

// ─── Station grid card ────────────────────────────────────────────────────────

function StationCard({ station, eq, isSelected, onClick }) {
  const { color, pct } = stationHealth(station, eq);
  const blockers = getAttentionItems(station, eq);

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full text-left rounded-xl border p-3 transition-all duration-150 active:scale-[0.97] flex flex-col gap-2',
        isSelected ? glowColor[color] : 'border-border/40 hover:border-border/70'
      )}
      style={{ background: isSelected ? bgColor[color] : 'rgba(11,17,24,0.85)' }}
    >
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-xs font-black text-foreground leading-tight truncate flex-1">{station.name}</p>
      </div>

      {/* Readiness */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={cn('text-base font-black tabular-nums leading-none', textColor[color])}>{pct}%</span>
          <span className="text-[10px] font-bold text-muted-foreground">{eq.length} equip</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-black/40">
          <div className={cn('h-full rounded-full transition-all duration-700', barColor[color])} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Blockers */}
      {blockers.length > 0 && (
        <p className="text-[10px] font-semibold text-amber-400/80 leading-tight truncate">
          ⚠ {blockers[0]}{blockers.length > 1 ? ` +${blockers.length - 1}` : ''}
        </p>
      )}
    </button>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ station, allEquipment, onNavigate, onClose }) {
  if (!station) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
        <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-bold text-muted-foreground">Select a station</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Click any card to see details</p>
      </div>
    );
  }

  const eq = allEquipment.filter(e => e.station_id === station.id || e.station_name === station.name);
  const { color, pct } = stationHealth(station, eq);
  const blockers = getAttentionItems(station, eq);
  const tempEq = eq.filter(e => e.temp_enabled || e.requiresTemperatureLog);
  const issueCount = eq.filter(e => e.requiresMaintenanceChecklist).length;
  const configuredCount = eq.filter(isEquipmentConfigured).length;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-border/30 shrink-0" style={{ background: bgColor[color] }}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-lg font-black text-foreground truncate">{station.name}</p>
            {station.department && <p className="text-xs text-muted-foreground mt-0.5">{station.department}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', badgeStyle[color])}>
              {badgeLabel[color]}
            </span>
            {onClose && (
              <button onClick={onClose} className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground lg:hidden">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-muted-foreground">Setup readiness</span>
            <span className={cn('font-black tabular-nums', textColor[color])}>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
            <div className={cn('h-full rounded-full transition-all duration-700', barColor[color])} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {[
            { label: 'Equipment', value: eq.length },
            { label: 'Temp Checks', value: tempEq.length },
            { label: 'Issues', value: issueCount, hi: issueCount > 0 },
          ].map(m => (
            <div key={m.label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <p className={cn('text-base font-black', m.hi ? 'text-red-400' : 'text-foreground')}>{m.value}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 leading-tight">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-scrollable>
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

        {eq.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Equipment ({configuredCount}/{eq.length} configured)
            </p>
            <div className="space-y-1">
              {eq.map(e => (
                <div key={e.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2 border border-border/30" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  {isEquipmentConfigured(e)
                    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
                    : <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400/70" />}
                  <p className="flex-1 text-xs font-semibold text-foreground truncate">{e.name}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {(e.temp_enabled || e.requiresTemperatureLog) && <Thermometer className="h-3 w-3 text-blue-400/70" />}
                    {e.requiresCleaningChecklist && <Sparkles className="h-3 w-3 text-green-400/70" />}
                    {e.requiresMaintenanceChecklist && <Wrench className="h-3 w-3 text-amber-400/70" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">No equipment assigned</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="p-3 border-t border-border/30 shrink-0">
        <button
          onClick={() => onNavigate(station.id)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/25 py-2.5 text-xs font-black text-primary hover:bg-primary/15 transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open Station Details
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OperationalMap() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAreaId, setActiveAreaId] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [areaData, stationData, equipData] = await Promise.all([
        base44.entities.Area.list().catch(() => []),
        base44.entities.Station.list().catch(() => []),
        base44.entities.Equipment.list().catch(() => []),
      ]);
      setAreas(areaData || []);
      setStations(stationData || []);
      setEquipment(equipData || []);

      const activeEquip = (equipData || []).filter(isActive);
      const sorted = [...(stationData || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const firstBad = sorted.find(s => {
        const eq = activeEquip.filter(e => e.station_id === s.id || e.station_name === s.name);
        return getAttentionItems(s, eq).length > 0;
      });
      setSelectedStation(prev => prev || firstBad || sorted[0] || null);
    } catch (err) {
      console.error('Failed to load operational data:', err);
    }
    setLoading(false);
  };

  const activeAreas = useMemo(
    () => areas.filter(isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [areas]
  );
  const sortedStations = useMemo(
    () => [...stations].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [stations]
  );
  const activeEquipment = useMemo(() => equipment.filter(isActive), [equipment]);

  const eqFor = (s) => activeEquipment.filter(e => e.station_id === s.id || e.station_name === s.name);

  // Build area tabs: "All" + each area + "Unassigned" if needed
  const tabs = useMemo(() => {
    const result = [{ id: 'all', name: 'All' }];
    activeAreas.forEach(a => result.push({ id: a.id, name: a.name }));
    const hasUnassigned = sortedStations.some(s =>
      !activeAreas.some(a => s.area_id === a.id || s.area_name === a.name)
    );
    if (hasUnassigned) result.push({ id: '__unassigned', name: 'Other' });
    return result;
  }, [activeAreas, sortedStations]);

  // Stations visible in the current tab + search
  const visibleStations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedStations.filter(s => {
      const eq = eqFor(s);
      if (q && ![s.name, s.department, s.area_name, ...eq.map(e => e.name)].some(v => String(v || '').toLowerCase().includes(q))) return false;
      if (activeAreaId === 'all') return true;
      if (activeAreaId === '__unassigned') return !activeAreas.some(a => s.area_id === a.id || s.area_name === a.name);
      return s.area_id === activeAreaId || s.area_name === activeAreas.find(a => a.id === activeAreaId)?.name;
    });
   
  }, [sortedStations, activeEquipment, activeAreaId, activeAreas, search]);

  // Summary stats
  const stats = useMemo(() => {
    const all = sortedStations.filter(isActive);
    return {
      total: all.length,
      ready: all.filter(s => stationReadinessPct(s, eqFor(s)) === 100).length,
      attn:  all.filter(s => getAttentionItems(s, eqFor(s)).length > 0).length,
      issues: all.filter(s => eqFor(s).some(e => e.requiresMaintenanceChecklist)).length,
    };
   
  }, [sortedStations, activeEquipment]);

  const syncedSelected = useMemo(
    () => selectedStation ? (stations.find(s => s.id === selectedStation.id) || selectedStation) : null,
    [selectedStation, stations]
  );

  const handleSelect = (station) => {
    setSelectedStation(station);
    setShowDetail(true);
  };

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Stations" subtitle="Station readiness by area" />

      {/* Mobile header */}
      <div
        className="lg:hidden px-5 pt-6 pb-4 flex flex-col gap-4"
        style={{
          background: "rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 style={{
              fontSize: '40px',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: 'rgba(255,255,255,0.95)',
            }}>
              Stations
            </h1>
            {stats.attn > 0
              ? <p style={{ fontSize: '13px', fontWeight: 600, color: '#FF6B00', marginTop: '2px' }}>{stats.attn} need attention</p>
              : <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{stats.total} stations · all ready</p>}
          </div>
          <button
            onClick={loadData}
            className="flex items-center justify-center active:scale-95 transition-all"
            style={{
              width: '40px', height: '40px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Area filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const isActive = activeAreaId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAreaId(tab.id)}
                className="flex items-center whitespace-nowrap transition-all active:scale-95"
                style={{
                  height: '32px',
                  paddingLeft: '14px',
                  paddingRight: '14px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                  background: isActive ? 'rgba(255,107,0,0.15)' : 'rgba(255,255,255,0.06)',
                  border: isActive ? '1px solid rgba(255,107,0,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  color: isActive ? '#FF6B00' : 'rgba(255,255,255,0.45)',
                  boxShadow: isActive ? '0 0 12px rgba(255,107,0,0.15)' : 'none',
                  flexShrink: 0,
                }}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="app-page lg:max-w-none lg:px-6">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Mobile-only summary strip */}
            <div className="grid grid-cols-2 gap-2.5 lg:hidden">
              {[
                { label: 'Total', value: stats.total, color: 'text-foreground', iconColor: 'text-muted-foreground', icon: Layers },
                { label: 'Ready', value: stats.ready, color: 'text-green-400', iconColor: 'text-green-400', icon: CheckCircle2 },
                { label: 'Needs Attention', value: stats.attn, color: stats.attn > 0 ? 'text-amber-400' : 'text-foreground', iconColor: stats.attn > 0 ? 'text-amber-400' : 'text-muted-foreground', icon: AlertTriangle },
                { label: 'Equip. Issues', value: stats.issues, color: stats.issues > 0 ? 'text-red-400' : 'text-foreground', iconColor: stats.issues > 0 ? 'text-red-400' : 'text-muted-foreground', icon: Wrench },
              ].map(({ label, value, color, iconColor, icon: Icon }) => (
                <div key={label} className="card-glass border border-border rounded-xl px-3 py-3 flex items-center gap-2.5">
                  <Icon className={cn('h-4 w-4 shrink-0', iconColor)} />
                  <div>
                    <p className={cn('text-xl font-black leading-none', color)}>{value}</p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop 2-column — summary inside left column so right panel aligns from top */}
            <div className="hidden lg:flex lg:gap-5">
              {/* Left column */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Desktop summary strip */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { label: 'Total', value: stats.total, color: 'text-foreground', iconColor: 'text-muted-foreground', icon: Layers },
                    { label: 'Ready', value: stats.ready, color: 'text-green-400', iconColor: 'text-green-400', icon: CheckCircle2 },
                    { label: 'Needs Attention', value: stats.attn, color: stats.attn > 0 ? 'text-amber-400' : 'text-foreground', iconColor: stats.attn > 0 ? 'text-amber-400' : 'text-muted-foreground', icon: AlertTriangle },
                    { label: 'Equip. Issues', value: stats.issues, color: stats.issues > 0 ? 'text-red-400' : 'text-foreground', iconColor: stats.issues > 0 ? 'text-red-400' : 'text-muted-foreground', icon: Wrench },
                  ].map(({ label, value, color, iconColor, icon: Icon }) => (
                    <div key={label} className="card-glass border border-border rounded-xl px-3 py-3 flex items-center gap-2.5">
                      <Icon className={cn('h-4 w-4 shrink-0', iconColor)} />
                      <div>
                        <p className={cn('text-xl font-black leading-none', color)}>{value}</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search stations or equipment..."
                      className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <button onClick={loadData} className="h-9 w-9 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button onClick={() => navigate('/restaurant-setup-wizard')} className="h-9 px-3 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-1.5 shrink-0 hover:bg-primary/90 transition-all">
                    <Plus className="h-3.5 w-3.5" /> Add Stations
                  </button>
                </div>

                {/* Area tabs */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 pl-0.5">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveAreaId(tab.id)}
                      className={cn(
                        'shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all',
                        activeAreaId === tab.id ? 'glow-active' : 'border-transparent text-muted-foreground hover:text-foreground glow-interactive'
                      )}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>

                {/* Station grid */}
                {visibleStations.length === 0 ? (
                  <div className="py-14 text-center">
                    <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-semibold text-muted-foreground">No stations here.</p>
                    {search && <button onClick={() => setSearch('')} className="mt-2 text-xs font-black text-primary">Clear search</button>}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {visibleStations.map(s => (
                      <StationCard
                        key={s.id}
                        station={s}
                        eq={eqFor(s)}
                        isSelected={syncedSelected?.id === s.id}
                        onClick={() => handleSelect(s)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: sticky detail panel — full height alongside left column */}
              <div className="w-[300px] shrink-0 sticky top-[72px] self-start">
                <div className="card-glass border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 90px)' }}>
                  <DetailPanel
                    station={syncedSelected}
                    allEquipment={activeEquipment}
                    onNavigate={id => navigate(`/station/${id}`)}
                  />
                </div>
              </div>
            </div>

            {/* Mobile: station grid */}
            <div className="lg:hidden space-y-3 mt-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button onClick={() => navigate('/restaurant-setup-wizard')} className="h-10 px-3 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-1.5 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>

              {visibleStations.length === 0 ? (
                <div className="py-12 text-center">
                  <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-muted-foreground">No stations here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {visibleStations.map(s => (
                    <StationCard
                      key={s.id}
                      station={s}
                      eq={eqFor(s)}
                      isSelected={syncedSelected?.id === s.id}
                      onClick={() => handleSelect(s)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {showDetail && syncedSelected && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="relative w-full card-glass border border-border rounded-t-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="h-1 w-10 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <DetailPanel
              station={syncedSelected}
              allEquipment={activeEquipment}
              onNavigate={id => { setShowDetail(false); navigate(`/station/${id}`); }}
              onClose={() => setShowDetail(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;
