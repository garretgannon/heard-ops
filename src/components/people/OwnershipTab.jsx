import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Layers, User, ChevronDown, Save } from 'lucide-react';

export default function OwnershipTab() {
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [a, s, e] = await Promise.all([
      base44.entities.Area.list('name', 100),
      base44.entities.Station.list('name', 200),
      base44.entities.Employee.filter({ status: 'active' }, 'full_name', 100),
    ]);
    setAreas(a);
    setStations(s);
    setEmployees(e);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setAreaOwner = async (area, empId) => {
    const emp = employees.find(e => e.id === empId);
    setSaving(p => ({ ...p, [`area-${area.id}`]: true }));
    await base44.entities.Area.update(area.id, {
      owner_id: empId || null,
      owner_name: emp?.full_name || null,
    });
    setAreas(prev => prev.map(a => a.id === area.id ? { ...a, owner_id: empId, owner_name: emp?.full_name || null } : a));
    setSaving(p => ({ ...p, [`area-${area.id}`]: false }));
  };

  const setStationOwner = async (station, empId) => {
    const emp = employees.find(e => e.id === empId);
    setSaving(p => ({ ...p, [`station-${station.id}`]: true }));
    await base44.entities.Station.update(station.id, {
      owner_id: empId || null,
      owner_name: emp?.full_name || null,
    });
    setStations(prev => prev.map(s => s.id === station.id ? { ...s, owner_id: empId, owner_name: emp?.full_name || null } : s));
    setSaving(p => ({ ...p, [`station-${station.id}`]: false }));
  };

  // Group stations by area
  const areaMap = {};
  areas.forEach(a => { areaMap[a.id] = { ...a, stations: [] }; });
  const unassigned = [];
  stations.forEach(s => {
    if (s.area_id && areaMap[s.area_id]) areaMap[s.area_id].stations.push(s);
    else unassigned.push(s);
  });

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
        <p className="text-xs font-bold text-orange-400 mb-1">What Ownership Means</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The owner of an area or station automatically receives all alerts, maintenance issues, temperature failures, task escalations, and operational reports for that location.
        </p>
      </div>

      <div className="space-y-3">
        {Object.values(areaMap).map(area => (
          <div key={area.id} className="card-glass border border-border rounded-xl overflow-hidden">
            {/* Area row */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/30">
              <MapPin className="h-4 w-4 text-orange-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{area.name}</p>
                <p className="text-[10px] text-muted-foreground">Area</p>
              </div>
              <OwnerSelect
                value={area.owner_id || ''}
                employees={employees}
                saving={saving[`area-${area.id}`]}
                onChange={empId => setAreaOwner(area, empId)}
              />
            </div>

            {/* Station rows */}
            {area.stations.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2 border-t border-border/40 ml-4">
                <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{s.name}</p>
                  {s.department && <p className="text-[9px] text-muted-foreground">{s.department}</p>}
                </div>
                <OwnerSelect
                  value={s.owner_id || ''}
                  employees={employees}
                  saving={saving[`station-${s.id}`]}
                  onChange={empId => setStationOwner(s, empId)}
                  compact
                />
              </div>
            ))}
          </div>
        ))}

        {unassigned.length > 0 && (
          <div className="card-glass border border-border rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-muted/20">
              <p className="text-xs font-bold text-muted-foreground">Unassigned Stations</p>
            </div>
            {unassigned.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2 border-t border-border/40">
                <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="flex-1 text-xs font-semibold text-foreground">{s.name}</p>
                <OwnerSelect
                  value={s.owner_id || ''}
                  employees={employees}
                  saving={saving[`station-${s.id}`]}
                  onChange={empId => setStationOwner(s, empId)}
                  compact
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerSelect({ value, employees, saving, onChange, compact }) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={saving}
        className={`appearance-none bg-background border border-border rounded-lg text-foreground pr-6 transition-all ${
          compact ? 'text-[10px] px-2 py-1' : 'text-xs px-2.5 py-1.5'
        } ${value ? 'border-orange-500/40 text-orange-300' : ''}`}
      >
        <option value="">Unowned</option>
        {employees.map(e => (
          <option key={e.id} value={e.id}>{e.full_name}{e.primary_role ? ` (${e.primary_role})` : ''}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
      {saving && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-400 animate-pulse" />}
    </div>
  );
}