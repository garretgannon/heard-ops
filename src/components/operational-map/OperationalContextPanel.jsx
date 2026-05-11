import { X, Edit2, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function OperationalContextPanel({
  type,
  itemId,
  areas,
  stations,
  equipment,
  onClose,
  onRefresh,
  onSelectItem,
}) {
  const navigate = useNavigate();

  // Form states for add panels
  const [areaName, setAreaName] = useState('');
  const [areaDesc, setAreaDesc] = useState('');
  const [areaSaving, setAreaSaving] = useState(false);

  const [stationName, setStationName] = useState('');
  const [stationDesc, setStationDesc] = useState('');
  const [stationSaving, setStationSaving] = useState(false);

  const [equipName, setEquipName] = useState('');
  const [equipDesc, setEquipDesc] = useState('');
  const [equipVendor, setEquipVendor] = useState('');
  const [equipSaving, setEquipSaving] = useState(false);

  const [editAreaName, setEditAreaName] = useState('');
  const [editAreaDesc, setEditAreaDesc] = useState('');
  const [editAreaSaving, setEditAreaSaving] = useState(false);

  const [editStationName, setEditStationName] = useState('');
  const [editStationDesc, setEditStationDesc] = useState('');
  const [editStationSaving, setEditStationSaving] = useState(false);

  const [editEquipName, setEditEquipName] = useState('');
  const [editEquipDesc, setEditEquipDesc] = useState('');
  const [editEquipSaving, setEditEquipSaving] = useState(false);

  // Handlers for Area Add
  const handleAddArea = async () => {
    if (!areaName.trim()) {
      toast.error('Area name is required');
      return;
    }
    setAreaSaving(true);
    try {
      await base44.entities.Area.create({
        name: areaName.trim(),
        description: areaDesc.trim(),
        isActive: true,
      });
      toast.success('Area created');
      setAreaName('');
      setAreaDesc('');
      onRefresh?.();
      onClose?.();
    } catch (err) {
      toast.error('Failed to create area');
    }
    setAreaSaving(false);
  };

  // Handlers for Station Add
  const handleAddStation = async () => {
    if (!stationName.trim() || !itemId) {
      toast.error('Station name is required');
      return;
    }
    setStationSaving(true);
    try {
      const area = areas.find(a => a.id === itemId);
      await base44.entities.Station.create({
        name: stationName.trim(),
        area_id: itemId,
        area_name: area?.name,
        description: stationDesc.trim(),
        isActive: true,
      });
      toast.success('Station created');
      setStationName('');
      setStationDesc('');
      onRefresh?.();
      onClose?.();
    } catch (err) {
      toast.error('Failed to create station');
    }
    setStationSaving(false);
  };

  // Handlers for Equipment Add
  const handleAddEquipment = async () => {
    if (!equipName.trim() || !itemId) {
      toast.error('Equipment name is required');
      return;
    }
    setEquipSaving(true);
    try {
      const station = stations.find(s => s.id === itemId);
      const area = areas.find(a => a.id === station?.area_id);
      await base44.entities.Equipment.create({
        name: equipName.trim(),
        equipmentType: 'other',
        station_id: itemId,
        station_name: station?.name,
        area_id: station?.area_id,
        area_name: area?.name,
        vendorId: equipVendor.trim() || undefined,
        isActive: true,
      });
      toast.success('Equipment created');
      setEquipName('');
      setEquipDesc('');
      setEquipVendor('');
      onRefresh?.();
      onClose?.();
    } catch (err) {
      toast.error('Failed to create equipment');
    }
    setEquipSaving(false);
  };

  const handleEditArea = async () => {
    if (!editAreaName.trim() || !itemId) {
      toast.error('Area name is required');
      return;
    }
    setEditAreaSaving(true);
    try {
      await base44.entities.Area.update(itemId, {
        name: editAreaName.trim(),
        description: editAreaDesc.trim(),
      });
      toast.success('Area updated');
      onRefresh?.();
      onClose?.();
    } catch (err) {
      toast.error('Failed to update area');
    }
    setEditAreaSaving(false);
  };

  const handleEditStation = async () => {
    if (!editStationName.trim() || !itemId) {
      toast.error('Station name is required');
      return;
    }
    setEditStationSaving(true);
    try {
      await base44.entities.Station.update(itemId, {
        name: editStationName.trim(),
        description: editStationDesc.trim(),
      });
      toast.success('Station updated');
      onRefresh?.();
      onClose?.();
    } catch (err) {
      toast.error('Failed to update station');
    }
    setEditStationSaving(false);
  };

  const handleEditEquipment = async () => {
    if (!editEquipName.trim() || !itemId) {
      toast.error('Equipment name is required');
      return;
    }
    setEditEquipSaving(true);
    try {
      await base44.entities.Equipment.update(itemId, {
        name: editEquipName.trim(),
        description: editEquipDesc.trim(),
      });
      toast.success('Equipment updated');
      onRefresh?.();
      onClose?.();
    } catch (err) {
      toast.error('Failed to update equipment');
    }
    setEditEquipSaving(false);
  };

  const renderEquipmentPanel = () => {
    const equip = equipment.find(e => e.id === itemId);
    if (!equip) return null;

    const station = stations.find(s => s.id === equip.station_id);
    const area = areas.find(a => a.id === equip.area_id);

    return (
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{equip.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {equip.equipmentType} · {area?.name} / {station?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background/50 border border-border/40 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground font-semibold mb-1">Temperature</p>
            <p className="text-lg font-bold text-green-400">350°F</p>
            <p className="text-[10px] text-muted-foreground mt-1">Good</p>
          </div>
          <div className="bg-background/50 border border-border/40 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground font-semibold mb-1">Cleaning Due</p>
            <p className="text-sm font-bold text-foreground">In 2 days</p>
            <p className="text-[10px] text-muted-foreground mt-1">May 20</p>
          </div>
          <div className="bg-background/50 border border-border/40 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground font-semibold mb-1">Maintenance</p>
            <p className="text-sm font-bold text-green-400">Good</p>
            <p className="text-[10px] text-muted-foreground mt-1">No issues</p>
          </div>
          <div className="bg-background/50 border border-border/40 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground font-semibold mb-1">Utilization</p>
            <p className="text-lg font-bold text-blue-400">68%</p>
            <p className="text-[10px] text-muted-foreground mt-1">This week</p>
          </div>
        </div>

        {/* Edit Button */}
        <button onClick={() => onSelectItem?.('equipment-edit', equip.id)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary font-semibold text-xs transition-all">
          <Edit2 className="h-3.5 w-3.5" />
          Edit Equipment
        </button>

        {/* Sections */}
        <div className="space-y-4 border-t border-border/20 pt-4">
          {/* Temperature History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-foreground">Temperature History</p>
              <button onClick={() => navigate('/temperature-dashboard')} className="text-[10px] text-primary hover:underline font-bold cursor-pointer">View History →</button>
            </div>
            <div className="bg-background/50 border border-border/20 rounded-lg h-24 flex items-center justify-center text-muted-foreground text-xs">
              [Chart would render here]
            </div>
          </div>

          {/* Assigned Staff */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-foreground">Assigned Staff</p>
              <button onClick={() => navigate('/team')} className="text-[10px] text-primary hover:underline font-bold cursor-pointer">Edit</button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-background/50 border border-border/20 rounded text-xs">
                <div className="h-6 w-6 rounded-full bg-purple-500/30 border border-purple-400 flex items-center justify-center text-[10px] font-bold text-purple-300">
                  MC
                </div>
                <div>
                  <p className="font-semibold text-foreground">Monica C.</p>
                  <p className="text-[10px] text-muted-foreground">7:00 AM – 3:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cleaning Status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-foreground">Cleaning Status</p>
              <button onClick={() => navigate('/cleaning')} className="text-[10px] text-primary hover:underline font-bold cursor-pointer">View Tasks →</button>
            </div>
            <div className="px-2.5 py-1.5 bg-background/50 border border-border/20 rounded text-xs space-y-1">
              <p className="font-semibold text-foreground">Daily Fryer Clean</p>
              <p className="text-[10px] text-muted-foreground">Due in 2 days · May 20</p>
              <div className="w-full bg-background rounded h-1.5 mt-1">
                <div className="bg-green-400 h-full rounded" style={{ width: '75%' }} />
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-foreground">Maintenance</p>
              <button onClick={() => navigate('/logs?type=maintenance')} className="text-[10px] text-primary hover:underline font-bold cursor-pointer">View History →</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/50 border border-border/20 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground font-semibold">Last Service</p>
                <p className="text-xs font-bold text-foreground mt-1">Apr 28, 2025</p>
              </div>
              <div className="bg-background/50 border border-border/20 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground font-semibold">Next PM Due</p>
                <p className="text-xs font-bold text-green-400 mt-1">May 28, 2025</p>
              </div>
            </div>
          </div>

          {/* Vendor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-foreground">Vendor / Service</p>
              <button onClick={() => navigate('/vendors')} className="text-[10px] text-primary hover:underline font-bold">Edit</button>
            </div>
            <div className="px-2.5 py-1.5 bg-background/50 border border-border/20 rounded text-xs">
              <p className="font-semibold text-foreground">Frymaster</p>
              <p className="text-muted-foreground">Model JB14</p>
              <p className="text-muted-foreground">Serial FM1814-00421</p>
            </div>
          </div>

          {/* Linked Chemicals */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-foreground">Linked Chemicals / SDS</p>
              <button onClick={() => navigate('/chemical-library')} className="text-[10px] text-primary hover:underline font-bold">+ Add</button>
            </div>
            <div className="space-y-1.5">
              <div className="px-2.5 py-1.5 bg-background/50 border border-border/20 rounded text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Fry Oil (Canola Blend)</p>
                  <button onClick={() => navigate('/sds-library')} className="text-[10px] text-primary hover:underline">SDS →</button>
                </div>
                <button className="p-1 text-muted-foreground hover:text-foreground">
                  {/* menu icon */}
                </button>
              </div>
            </div>
          </div>

          {/* Operational Alerts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-foreground">Operational Alerts</p>
              <button onClick={() => navigate('/logs?type=incident')} className="text-[10px] text-primary hover:underline">View All (2) →</button>
            </div>
            <div className="space-y-1.5">
              <div className="px-2.5 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded text-xs cursor-pointer hover:bg-orange-500/20 transition-all">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-orange-300">Low Oil Level</p>
                    <p className="text-[10px] text-orange-200 mt-0.5">Detected 2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEquipmentAddPanel = () => {
    const station = stations.find(s => s.id === itemId);

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">New Equipment</h2>
            <p className="text-xs text-muted-foreground mt-1">Add equipment to this station</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-t border-border/20 pt-4 space-y-3">
          <p className="text-xs text-muted-foreground font-bold">Station: {station?.name}</p>
          <input
            type="text"
            placeholder="Equipment name"
            value={equipName}
            onChange={(e) => setEquipName(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground"
          />
          <textarea
            placeholder="Description (optional)"
            value={equipDesc}
            onChange={(e) => setEquipDesc(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground resize-none"
          />
          <input
            type="text"
            placeholder="Vendor ID (optional)"
            value={equipVendor}
            onChange={(e) => setEquipVendor(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground"
          />
          <button
            onClick={handleAddEquipment}
            disabled={equipSaving}
            className="w-full py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:brightness-110 disabled:opacity-60 transition-all"
          >
            {equipSaving ? 'Creating...' : 'Create Equipment'}
          </button>
        </div>
      </div>
    );
  };

  const renderAreaPanel = () => {
    const area = areas.find(a => a.id === itemId);
    if (!area) return null;

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{area.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{area.description || 'No description'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <button onClick={() => onSelectItem?.('area-edit', area.id)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary font-semibold text-xs transition-all">
          <Edit2 className="h-3.5 w-3.5" />
          Edit Area
        </button>

        <div className="border-t border-border/20 pt-4 text-xs text-muted-foreground">
          Area details panel. Select a station or equipment for more details.
        </div>
      </div>
    );
  };

  const renderAreaAddPanel = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">New Area</h2>
            <p className="text-xs text-muted-foreground mt-1">Create a new operational area</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-t border-border/20 pt-4 space-y-3">
          <input
            type="text"
            placeholder="Area name"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground"
          />
          <textarea
            placeholder="Description (optional)"
            value={areaDesc}
            onChange={(e) => setAreaDesc(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground resize-none"
          />
          <button
            onClick={handleAddArea}
            disabled={areaSaving}
            className="w-full py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:brightness-110 disabled:opacity-60 transition-all"
          >
            {areaSaving ? 'Creating...' : 'Create Area'}
          </button>
        </div>
      </div>
    );
  };

  const renderStationPanel = () => {
    const station = stations.find(s => s.id === itemId);
    if (!station) return null;

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{station.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{station.description || 'No description'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <button onClick={() => onSelectItem?.('station-edit', station.id)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary font-semibold text-xs transition-all">
          <Edit2 className="h-3.5 w-3.5" />
          Edit Station
        </button>

        <div className="border-t border-border/20 pt-4 text-xs text-muted-foreground">
          Station details panel. Select an equipment item for full details.
        </div>
      </div>
    );
  };

  const renderStationAddPanel = () => {
    const area = areas.find(a => a.id === itemId);

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">New Station</h2>
            <p className="text-xs text-muted-foreground mt-1">Create a new work station</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-t border-border/20 pt-4 space-y-3">
          <p className="text-xs text-muted-foreground font-bold">Area: {area?.name}</p>
          <input
            type="text"
            placeholder="Station name"
            value={stationName}
            onChange={(e) => setStationName(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground"
          />
          <textarea
            placeholder="Description (optional)"
            value={stationDesc}
            onChange={(e) => setStationDesc(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground resize-none"
          />
          <button
            onClick={handleAddStation}
            disabled={stationSaving}
            className="w-full py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:brightness-110 disabled:opacity-60 transition-all"
          >
            {stationSaving ? 'Creating...' : 'Create Station'}
          </button>
        </div>
      </div>
    );
  };

  const renderAreaEditPanel = () => {
    const area = areas.find(a => a.id === itemId);
    if (!area) return null;

    if (!editAreaName && area) {
      setEditAreaName(area.name);
      setEditAreaDesc(area.description || '');
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit Area</h2>
            <p className="text-xs text-muted-foreground mt-1">Update area details</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-t border-border/20 pt-4 space-y-3">
          <input
            type="text"
            placeholder="Area name"
            value={editAreaName}
            onChange={(e) => setEditAreaName(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground"
          />
          <textarea
            placeholder="Description (optional)"
            value={editAreaDesc}
            onChange={(e) => setEditAreaDesc(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground resize-none"
          />
          <button
            onClick={handleEditArea}
            disabled={editAreaSaving}
            className="w-full py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:brightness-110 disabled:opacity-60 transition-all"
          >
            {editAreaSaving ? 'Saving...' : 'Save Area'}
          </button>
        </div>
      </div>
    );
  };

  const renderStationEditPanel = () => {
    const station = stations.find(s => s.id === itemId);
    if (!station) return null;

    if (!editStationName && station) {
      setEditStationName(station.name);
      setEditStationDesc(station.description || '');
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit Station</h2>
            <p className="text-xs text-muted-foreground mt-1">Update station details</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-t border-border/20 pt-4 space-y-3">
          <input
            type="text"
            placeholder="Station name"
            value={editStationName}
            onChange={(e) => setEditStationName(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground"
          />
          <textarea
            placeholder="Description (optional)"
            value={editStationDesc}
            onChange={(e) => setEditStationDesc(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground resize-none"
          />
          <button
            onClick={handleEditStation}
            disabled={editStationSaving}
            className="w-full py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:brightness-110 disabled:opacity-60 transition-all"
          >
            {editStationSaving ? 'Saving...' : 'Save Station'}
          </button>
        </div>
      </div>
    );
  };

  const renderEquipmentEditPanel = () => {
    const equip = equipment.find(e => e.id === itemId);
    if (!equip) return null;

    if (!editEquipName && equip) {
      setEditEquipName(equip.name);
      setEditEquipDesc(equip.description || '');
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit Equipment</h2>
            <p className="text-xs text-muted-foreground mt-1">Update equipment details</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-t border-border/20 pt-4 space-y-3">
          <input
            type="text"
            placeholder="Equipment name"
            value={editEquipName}
            onChange={(e) => setEditEquipName(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground"
          />
          <textarea
            placeholder="Description (optional)"
            value={editEquipDesc}
            onChange={(e) => setEditEquipDesc(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground resize-none"
          />
          <button
            onClick={handleEditEquipment}
            disabled={editEquipSaving}
            className="w-full py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:brightness-110 disabled:opacity-60 transition-all"
          >
            {editEquipSaving ? 'Saving...' : 'Save Equipment'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {type === 'equipment' && renderEquipmentPanel()}
      {type === 'equipment-add' && renderEquipmentAddPanel()}
      {type === 'equipment-edit' && renderEquipmentEditPanel()}
      {type === 'area' && renderAreaPanel()}
      {type === 'area-add' && renderAreaAddPanel()}
      {type === 'area-edit' && renderAreaEditPanel()}
      {type === 'station' && renderStationPanel()}
      {type === 'station-add' && renderStationAddPanel()}
      {type === 'station-edit' && renderStationEditPanel()}
    </>
  );
}