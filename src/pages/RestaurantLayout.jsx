import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, Wrench, MapPin, Layers, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const DEPARTMENTS = ['BOH', 'FOH', 'Bar', 'Management'];

const DEPT_COLOR = {
  BOH: 'bg-red-500/15 text-red-400',
  FOH: 'bg-blue-500/15 text-blue-400',
  Bar: 'bg-purple-500/15 text-purple-400',
  Management: 'bg-gray-500/15 text-gray-400',
};

const EQUIPMENT_TYPES = [
  'Fryer', 'Grill', 'Flat Top', 'Oven', 'Steam Table',
  'Walk-in Cooler', 'Walk-in Freezer', 'Reach-in Cooler', 'Prep Table Cooler',
  'Beer Cooler', 'Wine Cooler', 'Chest Freezer',
  'Dish Machine', 'Glass Washer', 'Ice Machine',
  'Hand Sink', '3-Compartment Sink', 'Prep Sink',
  'Hood System', 'Grease Trap', 'HVAC', 'Water Heater', 'Other',
];

function AreaForm({ area, onSave, onCancel }) {
  const [name, setName] = useState(area?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (area?.id) {
        await base44.entities.Area.update(area.id, { name });
      } else {
        await base44.entities.Area.create({ name, isActive: true, sortOrder: Date.now() });
      }
      onSave();
    } catch {
      toast.error('Failed to save area');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        placeholder="e.g. Kitchen, Dining Room, Bar, Patio"
        className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
      >
        {saving ? '…' : area ? 'Save' : 'Add'}
      </button>
      <button
        onClick={onCancel}
        className="h-9 w-9 rounded-lg border border-border text-muted-foreground hover:bg-secondary flex items-center justify-center"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function StationForm({ station, areaId, areas, onSave, onCancel }) {
  const [name, setName] = useState(station?.name || '');
  const [department, setDepartment] = useState(station?.department || 'BOH');
  const [selectedAreaId, setSelectedAreaId] = useState(station?.area_id || areaId || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name, department, area_id: selectedAreaId || null };
      if (station?.id) {
        await base44.entities.Station.update(station.id, payload);
      } else {
        await base44.entities.Station.create({ ...payload, isActive: true });
      }
      onSave();
    } catch {
      toast.error('Failed to save station');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        placeholder="e.g. Grill Station, Fry Station, Bar"
        className="flex-1 min-w-[160px] h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <select
        value={department}
        onChange={e => setDepartment(e.target.value)}
        className="h-9 px-2 rounded-lg border border-border bg-background text-sm text-foreground"
      >
        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      {/* Only show area selector when editing unassigned stations */}
      {!areaId && (
        <select
          value={selectedAreaId}
          onChange={e => setSelectedAreaId(e.target.value)}
          className="h-9 px-2 rounded-lg border border-border bg-background text-sm text-foreground"
        >
          <option value="">No area</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      )}
      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
      >
        {saving ? '…' : station ? 'Save' : 'Add'}
      </button>
      <button
        onClick={onCancel}
        className="h-9 w-9 rounded-lg border border-border text-muted-foreground hover:bg-secondary flex items-center justify-center"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function EquipmentForm({ equipment, stationId, onSave, onCancel }) {
  const [name, setName] = useState(equipment?.name || '');
  const [type, setType] = useState(equipment?.equipmentType || '');
  const [photoUrl, setPhotoUrl] = useState(equipment?.photo_url || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
      toast.success('Photo uploaded');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !type) return;
    setSaving(true);
    try {
      const payload = { name, equipmentType: type, photo_url: photoUrl || null, station_id: stationId, isActive: true };
      if (equipment?.id) {
        await base44.entities.Equipment.update(equipment.id, payload);
      } else {
        await base44.entities.Equipment.create(payload);
      }
      onSave();
    } catch {
      toast.error('Failed to save equipment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,1.4fr)_minmax(250px,1fr)_auto_auto] gap-2 items-start">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        placeholder="e.g. Fryer 1, Walk-in #2"
        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <select
        value={type}
        onChange={e => setType(e.target.value)}
        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground"
      >
        <option value="">Select equipment type…</option>
        {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <label className="h-10 px-3 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary flex items-center justify-center cursor-pointer whitespace-nowrap">
        {uploadingPhoto ? 'Uploading…' : photoUrl ? 'Change Photo' : 'Add Photo'}
        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
      </label>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || uploadingPhoto || !name.trim() || !type}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
        >
          {saving ? '…' : equipment ? 'Save' : 'Add'}
        </button>
        <button
          onClick={onCancel}
          className="h-10 w-10 rounded-lg border border-border text-muted-foreground hover:bg-secondary flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {photoUrl && (
        <div className="lg:col-span-4 rounded-lg border border-border/60 bg-background/40 p-2 max-w-[220px]">
          <img src={photoUrl} alt="Equipment" className="h-24 w-full rounded-md object-cover" />
        </div>
      )}
    </div>
  );
}

export default function RestaurantLayout() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedAreas, setExpandedAreas] = useState(new Set());
  const [expandedStations, setExpandedStations] = useState(new Set());
  const [addingArea, setAddingArea] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [addingStationForArea, setAddingStationForArea] = useState(null);
  const [editingStation, setEditingStation] = useState(null);
  const [addingEquipmentForStation, setAddingEquipmentForStation] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, s, e] = await Promise.all([
      base44.entities.Area.list('sortOrder', 100).catch(() => []),
      base44.entities.Station.list('name', 200).catch(() => []),
      base44.entities.Equipment.list('name', 500).catch(() => []),
    ]);
    setAreas(a);
    setStations(s);
    setEquipment(e);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteArea = async (id) => {
    if (!confirm('Delete this area? Stations inside will become unassigned.')) return;
    await base44.entities.Area.delete(id);
    load();
  };

  const deleteStation = async (id) => {
    if (!confirm('Delete this station? Equipment inside will become unassigned.')) return;
    await base44.entities.Station.delete(id);
    load();
  };

  const deleteEquipment = async (id) => {
    if (!confirm('Delete this equipment?')) return;
    await base44.entities.Equipment.delete(id);
    load();
  };

  const toggleArea = (id) => setExpandedAreas(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleStation = (id) => setExpandedStations(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const unassignedStations = stations.filter(s => !s.area_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-28 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 lg:px-8 pt-4 pb-4">
        <button
          onClick={() => navigate('/my-restaurant')}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Restaurant Layout</h1>
          <p className="text-xs text-muted-foreground">Area → Station → Equipment</p>
        </div>
        <button
          onClick={() => { setAddingArea(true); setEditingArea(null); }}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          Add Area
        </button>
      </div>

      <div className="px-4 lg:px-8 space-y-2">
        {addingArea && (
          <div className="p-3 card-glass border border-border rounded-xl">
            <AreaForm
              onSave={() => { setAddingArea(false); load(); }}
              onCancel={() => setAddingArea(false)}
            />
          </div>
        )}

        {/* Areas */}
        {areas.map(area => {
          const areaStations = stations.filter(s => s.area_id === area.id);
          const isExpanded = expandedAreas.has(area.id);

          return (
            <div key={area.id} className="card-glass border border-border rounded-xl overflow-hidden">
              {/* Area row */}
              {editingArea?.id === area.id ? (
                <div className="p-3">
                  <AreaForm
                    area={area}
                    onSave={() => { setEditingArea(null); load(); }}
                    onCancel={() => setEditingArea(null)}
                  />
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/20 transition-colors select-none"
                  onClick={() => toggleArea(area.id)}
                >
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-bold text-sm text-foreground flex-1">{area.name}</span>
                  <span className="text-xs text-muted-foreground mr-2">
                    {areaStations.length} station{areaStations.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingArea(area); setExpandedAreas(p => new Set([...p, area.id])); }}
                    className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteArea(area.id); }}
                    className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Stations */}
              {isExpanded && (
                <div className="border-t border-border/20 bg-background/20">
                  {areaStations.map(station => {
                    const stationEquip = equipment.filter(eq => eq.station_id === station.id);
                    const isStationExpanded = expandedStations.has(station.id);

                    return (
                      <div key={station.id} className="border-b border-border/10 last:border-0">
                        {editingStation?.id === station.id ? (
                          <div className="px-4 py-2.5 pl-10">
                            <StationForm
                              station={station}
                              areaId={area.id}
                              areas={areas}
                              onSave={() => { setEditingStation(null); load(); }}
                              onCancel={() => setEditingStation(null)}
                            />
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-2.5 pl-10 pr-4 py-2.5 cursor-pointer hover:bg-secondary/10 select-none"
                            onClick={() => toggleStation(station.id)}
                          >
                            {isStationExpanded
                              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            }
                            <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm font-semibold text-foreground flex-1">{station.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${DEPT_COLOR[station.department] || 'bg-muted text-muted-foreground'}`}>
                              {station.department}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1.5">
                              {stationEquip.length} equip.
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); setEditingStation(station); setExpandedStations(p => new Set([...p, station.id])); }}
                              className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground ml-1"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); deleteStation(station.id); }}
                              className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {/* Equipment */}
                        {isStationExpanded && (
                          <div className="bg-background/20 border-t border-border/10">
                            {stationEquip.map(eq => (
                              <div key={eq.id} className="border-b border-border/10 last:border-0">
                                {editingEquipment?.id === eq.id ? (
                                  <div className="px-4 py-2 pl-16">
                                    <EquipmentForm
                                      equipment={eq}
                                      stationId={station.id}
                                      onSave={() => { setEditingEquipment(null); load(); }}
                                      onCancel={() => setEditingEquipment(null)}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2.5 pl-16 pr-4 py-2">
                                    <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span className="text-sm text-foreground flex-1 min-w-0 break-words">{eq.name}</span>
                                    <span className="text-xs text-muted-foreground max-w-[220px] text-right leading-tight break-words">{eq.equipmentType}</span>
                                    {eq.photo_url && (
                                      <img src={eq.photo_url} alt={eq.name} className="h-10 w-10 rounded-md object-cover border border-border/60 shrink-0" />
                                    )}
                                    <button
                                      onClick={() => setEditingEquipment(eq)}
                                      className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground ml-1"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => deleteEquipment(eq.id)}
                                      className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-red-400"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}

                            {addingEquipmentForStation === station.id ? (
                              <div className="px-4 py-2 pl-16">
                                <EquipmentForm
                                  stationId={station.id}
                                  onSave={() => { setAddingEquipmentForStation(null); load(); }}
                                  onCancel={() => setAddingEquipmentForStation(null)}
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingEquipmentForStation(station.id)}
                                className="flex items-center gap-1.5 pl-16 pr-4 py-2 text-xs text-muted-foreground hover:text-primary w-full text-left"
                              >
                                <Plus className="h-3 w-3" /> Add Equipment
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {addingStationForArea === area.id ? (
                    <div className="px-4 py-3 pl-10">
                      <StationForm
                        areaId={area.id}
                        areas={areas}
                        onSave={() => { setAddingStationForArea(null); load(); }}
                        onCancel={() => setAddingStationForArea(null)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingStationForArea(area.id)}
                      className="flex items-center gap-1.5 pl-10 pr-4 py-3 text-xs text-muted-foreground hover:text-primary w-full text-left"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Station
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {areas.length === 0 && !addingArea && (
          <div className="text-center py-16 text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No areas yet</p>
            <p className="text-xs mt-1 max-w-xs mx-auto">
              Add an area like Kitchen, Dining Room, or Bar, then add stations and equipment inside each.
            </p>
          </div>
        )}

        {/* Unassigned stations */}
        {unassignedStations.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">
              Unassigned Stations
            </p>
            <div className="space-y-1">
              {unassignedStations.map(station => (
                <div key={station.id}>
                  {editingStation?.id === station.id ? (
                    <div className="p-3 card-glass border border-border rounded-lg">
                      <StationForm
                        station={station}
                        areas={areas}
                        onSave={() => { setEditingStation(null); load(); }}
                        onCancel={() => setEditingStation(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 card-glass border border-border/40 rounded-lg">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold text-foreground flex-1">{station.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${DEPT_COLOR[station.department] || 'bg-muted text-muted-foreground'}`}>
                        {station.department}
                      </span>
                      <button
                        onClick={() => setEditingStation(station)}
                        className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteStation(station.id)}
                        className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;
