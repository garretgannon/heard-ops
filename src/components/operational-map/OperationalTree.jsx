import { ChevronDown, ChevronRight, MapPin, Layers, Zap, Plus, MoreVertical } from 'lucide-react';
import { useState } from 'react';

const EQUIPMENT_ICONS = {
  'dish-machine': Layers,
  'fryer': Zap,
  'grill': Zap,
  'oven': Zap,
  'walk-in-cooler': Zap,
  'walk-in-freezer': Zap,
  'reach-in-cooler': Zap,
  'reach-in-freezer': Zap,
  'default': Layers,
};

export default function OperationalTree({
  areas,
  stations,
  equipment,
  expandedAreas,
  onToggleArea,
  onSelectItem,
  selectedType,
  selectedId,
}) {
  const getAreaReadiness = (areaId) => {
    const areaStations = stations.filter(s => s.area_id === areaId);
    const areaEquipment = equipment.filter(e => e.area_id === areaId);
    const ready = areaEquipment.filter(e => e.isActive).length;
    const total = areaEquipment.length || 1;
    return Math.round((ready / total) * 100);
  };

  const getStationReadiness = (stationId) => {
    const stationEquipment = equipment.filter(e => e.station_id === stationId);
    const ready = stationEquipment.filter(e => e.isActive).length;
    const total = stationEquipment.length || 1;
    return Math.round((ready / total) * 100);
  };

  const getEquipmentStatus = (equip) => {
    if (!equip.isActive) return { color: 'text-muted-foreground', label: 'Inactive' };
    if (equip.temp_enabled && equip.temp_min) {
      // simplified temp status
      return { color: 'text-green-400', label: 'Good', temp: '350°F' };
    }
    return { color: 'text-blue-400', label: 'Ready' };
  };

  return (
    <div className="p-4 space-y-2">
      {areas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No areas yet. Add your first area to get started.
        </div>
      ) : (
        areas.map(area => {
          const isExpanded = expandedAreas[area.id];
          const areaStations = stations.filter(s => s.area_id === area.id && s.isActive);
          const areaEquipment = equipment.filter(e => e.area_id === area.id && e.isActive);
          const readiness = getAreaReadiness(area.id);
          const isSelected = selectedType === 'area' && selectedId === area.id;

          return (
            <div key={area.id} className="space-y-1">
              {/* AREA ROW */}
              <div
                onClick={() => onSelectItem('area', area.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/20 border border-primary/50'
                    : 'hover:bg-card border border-transparent'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleArea(area.id);
                  }}
                  className="p-0.5 hover:bg-background rounded transition-all"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{area.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {areaStations.length} Station{areaStations.length !== 1 ? 's' : ''} · {areaEquipment.length} Equipment
                  </p>
                </div>
                <span className={`text-xs font-bold ${readiness >= 80 ? 'text-green-400' : 'text-orange-400'}`}>
                  {readiness}%
                </span>
                <button className="p-1 text-muted-foreground hover:text-foreground opacity-0 hover:opacity-100 transition-all">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* EXPANDED STATIONS */}
              {isExpanded && (
                <div className="ml-4 space-y-1 border-l border-border/30 pl-3">
                  {areaStations.map(station => {
                    const stationEquipment = equipment.filter(e => e.station_id === station.id && e.isActive);
                    const stationReadiness = getStationReadiness(station.id);
                    const isStationSelected = selectedType === 'station' && selectedId === station.id;

                    return (
                      <div key={station.id} className="space-y-1">
                        {/* STATION ROW */}
                        <div
                          onClick={() => onSelectItem('station', station.id)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                            isStationSelected
                              ? 'bg-primary/20 border border-primary/50'
                              : 'hover:bg-card border border-transparent'
                          }`}
                        >
                          <Layers className="h-3.5 w-3.5 text-secondary-text shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-xs">{station.name}</p>
                            <p className="text-[10px] text-muted-foreground">{stationEquipment.length} Equipment</p>
                          </div>
                          <span className={`text-xs font-bold ${stationReadiness >= 80 ? 'text-green-400' : 'text-orange-400'}`}>
                            {stationReadiness}%
                          </span>
                          <button className="p-1 text-muted-foreground hover:text-foreground opacity-0 hover:opacity-100 transition-all">
                            <MoreVertical className="h-3 w-3" />
                          </button>
                        </div>

                        {/* EQUIPMENT ROWS */}
                        <div className="ml-4 space-y-1 border-l border-border/20 pl-3">
                          {stationEquipment.map(equip => {
                            const status = getEquipmentStatus(equip);
                            const isEquipSelected = selectedType === 'equipment' && selectedId === equip.id;

                            return (
                              <div
                                key={equip.id}
                                onClick={() => onSelectItem('equipment', equip.id)}
                                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-xs ${
                                  isEquipSelected
                                    ? 'bg-primary/20 border border-primary/50'
                                    : 'hover:bg-card border border-transparent'
                                }`}
                              >
                                <Zap className="h-3.5 w-3.5 text-secondary-text shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-foreground">{equip.name}</p>
                                  <p className="text-[9px] text-muted-foreground">
                                    {equip.equipmentType} {status.temp && `· ${status.temp}`}
                                  </p>
                                </div>
                                <span className={`text-[10px] font-bold ${status.color}`}>{status.label}</span>
                                <button className="p-0.5 text-muted-foreground hover:text-foreground opacity-0 hover:opacity-100 transition-all">
                                  <MoreVertical className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                          <button onClick={() => onSelectItem('equipment-add', station.id)} className="flex items-center gap-2 px-3 py-1 text-muted-foreground hover:text-primary text-xs font-semibold transition-all">
                            <Plus className="h-3.5 w-3.5" />
                            Add Equipment
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => onSelectItem('station-add', area.id)} className="flex items-center gap-2 px-3 py-1 text-muted-foreground hover:text-primary text-xs font-semibold transition-all">
                    <Plus className="h-3.5 w-3.5" />
                    Add Station
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}