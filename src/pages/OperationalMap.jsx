import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationalMapHeader from '@/components/operational-map/OperationalMapHeader';
import OperationalTree from '@/components/operational-map/OperationalTree';
import OperationalContextPanel from '@/components/operational-map/OperationalContextPanel';

export default function OperationalMap() {
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedType, setSelectedType] = useState(null); // 'area', 'station', 'equipment'
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedAreas, setExpandedAreas] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [areaData, stationData, equipmentData] = await Promise.all([
        base44.entities.Area.list(),
        base44.entities.Station.list(),
        base44.entities.Equipment.list(),
      ]);
      setAreas(areaData);
      setStations(stationData);
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Failed to load operational data:', error);
    }
    setLoading(false);
  };

  const filteredAreas = areas.filter(a => 
    !search || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectItem = (type, id) => {
    setSelectedType(type);
    setSelectedId(id);
  };

  const handleAddArea = () => {
    // Trigger add area modal
    setSelectedType('area-add');
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const getMetrics = () => {
    const readyCount = equipment.filter(e => e.isActive).length;
    const total = equipment.filter(e => e.isActive).length || 1;
    const readyPercent = Math.round((readyCount / total) * 100);
    const warnings = equipment.filter(e => e.temp_enabled && e.isActive).length; // simplified

    return {
      readiness: readyPercent,
      areaCount: areas.filter(a => a.isActive).length,
      stationCount: stations.filter(s => s.isActive).length,
      equipmentCount: equipment.filter(e => e.isActive).length,
      warnings,
    };
  };

  const metrics = getMetrics();

  return (
    <div className="min-h-screen bg-background">
      <OperationalMapHeader
        metrics={metrics}
        search={search}
        onSearchChange={setSearch}
        onAddArea={handleAddArea}
        onRefresh={handleRefresh}
      />

      <div className="flex h-[calc(100vh-200px)]">
        {/* Center Tree Panel */}
        <div className="flex-1 border-r border-border/30 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Loading operational structure...
            </div>
          ) : (
            <OperationalTree
              areas={filteredAreas}
              stations={stations}
              equipment={equipment}
              expandedAreas={expandedAreas}
              onToggleArea={(areaId) => {
                setExpandedAreas(prev => ({
                  ...prev,
                  [areaId]: !prev[areaId],
                }));
              }}
              onSelectItem={handleSelectItem}
              selectedType={selectedType}
              selectedId={selectedId}
            />
          )}
        </div>

        {/* Right Context Panel */}
        <div className="w-96 border-l border-border/30 overflow-y-auto bg-background/50">
          {selectedType && selectedId ? (
            <OperationalContextPanel
              type={selectedType}
              itemId={selectedId}
              areas={areas}
              stations={stations}
              equipment={equipment}
              onClose={() => {
                setSelectedType(null);
                setSelectedId(null);
              }}
              onRefresh={handleRefresh}
            />
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Select an area, station, or equipment to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;