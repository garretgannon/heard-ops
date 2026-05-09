import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, MapPin } from 'lucide-react';
import LocationSplitPane from '@/components/LocationSplitPane';

const AREA_COLORS = ['orange', 'blue', 'purple', 'green'];

export default function LocationSetup() {
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddArea, setShowAddArea] = useState(false);
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
    setShowAddArea(false);
    reload();
  };

  if (loading) {
    return (
      <div className="pb-28 lg:pb-8">
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-4 lg:px-8">
          <h1 className="text-xl font-extrabold text-foreground">Operational Hierarchy</h1>
        </div>
        <div className="h-96 flex items-center justify-center text-muted-foreground">Loading location map…</div>
      </div>
    );
  }

  return (
    <div className="pb-28 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Operational Hierarchy</h1>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span><span className="font-bold text-foreground">{areas.length}</span> Areas</span>
              <span><span className="font-bold text-foreground">{stations.length}</span> Stations</span>
              <span><span className="font-bold text-foreground">{equipment.length}</span> Equipment</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddArea(true)}
            className="btn-primary text-sm flex items-center gap-1.5 px-3 py-2"
          >
            <Plus className="h-4 w-4" /> Add Area
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 h-[calc(100vh-180px)]">
        {showAddArea && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-foreground">Create Area</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Area Name *</label>
                  <input
                    autoFocus
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addArea();
                      if (e.key === 'Escape') setShowAddArea(false);
                    }}
                    placeholder="e.g. Cook Line, Bar, Dish Pit"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Color</label>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {AREA_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewAreaColor(color)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-all capitalize ${
                          newAreaColor === color
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-foreground hover:border-border/60'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={addArea} className="flex-1 btn-primary text-sm">Create</button>
                  <button onClick={() => setShowAddArea(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <LocationSplitPane
          areas={areas}
          stations={stations}
          equipment={equipment}
          vendors={vendors}
        />
      </div>
    </div>
  );
}

export const hideBase44Index = true;