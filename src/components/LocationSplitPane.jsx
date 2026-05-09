import { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Layers, Wrench, AlertCircle, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLD_TYPES = ['walk-in-cooler','walk-in-freezer','reach-in-cooler','reach-in-freezer','prep-table-cooler','lowboy-cooler','beer-cooler','wine-cooler','chest-freezer'];

const AREA_COLORS = {
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  green: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/40' },
};

function EquipmentContextPanel({ equipment, vendors }) {
  if (!equipment) return null;
  const vendor = vendors.find(v => v.id === equipment.vendorId);
  const isCold = COLD_TYPES.includes(equipment.equipmentType);
  
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center shrink-0">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{equipment.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{equipment.equipmentType}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {/* Equipment Details */}
        <div className="bg-background/50 rounded-lg p-3 space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Equipment Details</p>
          {equipment.modelNumber && <p className="text-xs text-foreground"><span className="text-muted-foreground">Model:</span> {equipment.modelNumber}</p>}
          {equipment.serialNumber && <p className="text-xs text-foreground"><span className="text-muted-foreground">Serial:</span> {equipment.serialNumber}</p>}
        </div>

        {/* Monitoring */}
        {(equipment.requiresTemperatureLog || equipment.requiresCleaningChecklist || equipment.requiresMaintenanceChecklist) && (
          <div className="bg-background/50 rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Monitoring</p>
            <div className="space-y-1">
              {equipment.requiresTemperatureLog && <div className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full bg-blue-400"></span> Temperature checks required</div>}
              {equipment.requiresCleaningChecklist && <div className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full bg-purple-400"></span> Cleaning checklist</div>}
              {equipment.requiresMaintenanceChecklist && <div className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full bg-amber-400"></span> Maintenance checklist</div>}
            </div>
          </div>
        )}

        {/* Vendor */}
        {vendor && (
          <div className="bg-background/50 rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Service Vendor</p>
            <p className="text-xs font-semibold text-foreground">{vendor.name}</p>
            {vendor.phone && <p className="text-xs text-muted-foreground">{vendor.phone}</p>}
          </div>
        )}

        {/* Special Handling */}
        {isCold && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-cyan-400" />
              <p className="text-[10px] font-bold text-cyan-300 uppercase">Temperature Sensitive</p>
            </div>
            <p className="text-xs text-cyan-200">Cold storage equipment — active temperature monitoring recommended.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StationContextPanel({ station, areaName, equipment, onAddEquipment }) {
  const stationEquip = equipment.filter(e => e.station_id === station.id);
  
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4 text-blue-300" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{station.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{areaName}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        <div className="bg-background/50 rounded-lg p-3 space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Equipment</p>
          {stationEquip.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No equipment assigned</p>
          ) : (
            <div className="space-y-1.5">
              {stationEquip.map(e => (
                <div key={e.id} className="text-xs text-foreground bg-card/50 px-2 py-1.5 rounded">
                  <p className="font-semibold">{e.name}</p>
                  <p className="text-muted-foreground text-[10px] mt-0.5">{e.equipmentType}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AreaContextPanel({ area, stations, equipment }) {
  const areaStations = stations.filter(s => s.area_id === area.id);
  const areaEquip = equipment.filter(e => e.area_id === area.id);
  
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{area.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{areaStations.length} stations • {areaEquip.length} equipment</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        <div className="bg-background/50 rounded-lg p-3 space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Stations</p>
          {areaStations.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No stations yet</p>
          ) : (
            <div className="space-y-1 text-xs">
              {areaStations.map(s => (
                <div key={s.id} className="flex items-center justify-between py-1.5">
                  <span className="text-foreground">{s.name}</span>
                  <span className="text-muted-foreground text-[10px]">{equipment.filter(e => e.station_id === s.id).length} equip</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TreeNode({ item, type, onSelect, isSelected, vendors, equipment, stations, areas }) {
  const [expanded, setExpanded] = useState(true);
  
  const color = type === 'area' ? AREA_COLORS[item.color] || AREA_COLORS.orange : null;
  
  const handleSelect = () => {
    onSelect(type, item);
  };
  
  const children = 
    type === 'area' ? stations.filter(s => s.area_id === item.id) :
    type === 'station' ? equipment.filter(e => e.station_id === item.id) :
    [];
  
  const hasChildren = children.length > 0;
  
  return (
    <div>
      <div
        onClick={handleSelect}
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer transition-all text-xs",
          isSelected ? "bg-primary/20 text-primary" : "hover:bg-muted/40 text-foreground"
        )}
      >
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-0 w-4 flex items-center justify-center"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        
        <span className="shrink-0">
          {type === 'area' && <MapPin className="h-3 w-3" />}
          {type === 'station' && <Layers className="h-3 w-3" />}
          {type === 'equipment' && <Wrench className="h-3 w-3" />}
        </span>
        
        <span className="font-semibold truncate flex-1">{item.name}</span>
        
        {type === 'area' && (
          <span className="text-[9px] text-muted-foreground shrink-0">
            {stations.filter(s => s.area_id === item.id).length}
          </span>
        )}
      </div>
      
      {expanded && hasChildren && (
        <div className="ml-2 border-l border-border/20 mt-0.5">
          {children.map(child => (
            <div key={child.id} className="ml-0">
              <TreeNode
                item={child}
                type={type === 'area' ? 'station' : 'equipment'}
                onSelect={onSelect}
                isSelected={isSelected}
                vendors={vendors}
                equipment={equipment}
                stations={stations}
                areas={areas}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LocationSplitPane({ areas, stations, equipment, vendors }) {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const handleSelect = (type, item) => {
    setSelectedType(type);
    setSelectedItem(item);
  };
  
  return (
    <div className="h-full flex gap-4">
      {/* Left Hierarchy */}
      <div className="w-80 border-r border-border/30 overflow-y-auto p-4 space-y-1">
        {areas.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No areas configured</p>
          </div>
        ) : (
          areas.map(area => (
            <TreeNode
              key={area.id}
              item={area}
              type="area"
              onSelect={handleSelect}
              isSelected={selectedType === 'area' && selectedItem?.id === area.id}
              vendors={vendors}
              equipment={equipment}
              stations={stations}
              areas={areas}
            />
          ))
        )}
      </div>
      
      {/* Right Context Panel */}
      <div className="flex-1 border border-border/30 rounded-lg overflow-hidden bg-card">
        {!selectedItem ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">Select an area, station, or equipment</p>
              <p className="text-xs text-muted-foreground mt-1">View operational details and management options</p>
            </div>
          </div>
        ) : selectedType === 'equipment' ? (
          <EquipmentContextPanel equipment={selectedItem} vendors={vendors} />
        ) : selectedType === 'station' ? (
          <StationContextPanel station={selectedItem} areaName={areas.find(a => a.id === selectedItem.area_id)?.name} equipment={equipment} />
        ) : (
          <AreaContextPanel area={selectedItem} stations={stations} equipment={equipment} />
        )}
      </div>
    </div>
  );
}