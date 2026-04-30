import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Trash2, Settings, X, Thermometer, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TYPES = [
  { value: "refrigerator", label: "Refrigerators", defaultMin: 32, defaultMax: 41 },
  { value: "freezer", label: "Freezers", defaultMin: -10, defaultMax: 0 },
  { value: "hot_well", label: "Hot Wells", defaultMin: 135, defaultMax: 180 },
  { value: "cooling", label: "Cooling Logs", defaultMin: null, defaultMax: 70 },
];

const statusColor = {
  safe: "text-green-500",
  warning: "text-yellow-500",
  danger: "text-red-500",
};

const StatusIcon = ({ status }) => {
  if (status === "safe") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
};

function getStatus(temp, location) {
  if (!location) return "safe";
  const { target_min, target_max } = location;
  if (target_max !== undefined && target_max !== null && temp > target_max) return "danger";
  if (target_min !== undefined && target_min !== null && temp < target_min) return "danger";
  return "safe";
}

export default function TempLogs() {
  const [activeTab, setActiveTab] = useState("refrigerator");
  const [locations, setLocations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editLocation, setEditLocation] = useState(null);

  const blankLog = { location_id: "", temperature: "", notes: "" };
  const [logForm, setLogForm] = useState(blankLog);
  const blankLoc = { name: "", type: activeTab, target_min: "", target_max: "", check_interval_minutes: "", is_active: true };
  const [locForm, setLocForm] = useState(blankLoc);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [locs, ents] = await Promise.all([
        base44.entities.TempLogLocation.list(),
        base44.entities.TempLogEntry.list("-logged_at", 200),
      ]);
      setLocations(locs);
      setEntries(ents);
      setLoading(false);
    };
    load();
  }, []);

  const tabLocations = locations.filter(l => l.type === activeTab && l.is_active !== false);
  const tabEntries = entries.filter(e => e.location_type === activeTab);

  // Group entries by location, show latest per location + recent history
  const entriesByLocation = {};
  tabEntries.forEach(e => {
    if (!entriesByLocation[e.location_id]) entriesByLocation[e.location_id] = [];
    entriesByLocation[e.location_id].push(e);
  });

  const openLogForm = () => {
    setLogForm({ ...blankLog, location_id: tabLocations[0]?.id || "" });
    setShowLogForm(true);
  };

  const openLocationForm = (loc = null) => {
    if (loc) {
      setLocForm({ name: loc.name, type: loc.type, target_min: loc.target_min ?? "", target_max: loc.target_max ?? "", check_interval_minutes: loc.check_interval_minutes ?? "", is_active: loc.is_active ?? true });
      setEditLocation(loc);
    } else {
      setLocForm({ ...blankLoc, type: activeTab });
      setEditLocation(null);
    }
    setShowLocationForm(true);
  };

  const saveLog = async () => {
    if (!logForm.location_id || logForm.temperature === "") return toast.error("Select a location and enter a temperature");
    setSaving(true);
    const location = locations.find(l => l.id === logForm.location_id);
    const temp = parseFloat(logForm.temperature);
    const status = getStatus(temp, location);
    const now = new Date().toISOString();
    const entry = await base44.entities.TempLogEntry.create({
      location_id: logForm.location_id,
      location_name: location?.name || "",
      location_type: activeTab,
      temperature: temp,
      logged_at: now,
      notes: logForm.notes,
      status,
    });
    setEntries(prev => [entry, ...prev]);
    setSaving(false);
    setShowLogForm(false);
    toast.success(`Logged ${temp}°F — ${status}`);
  };

  const saveLocation = async () => {
    if (!locForm.name.trim()) return toast.error("Name is required");
    setSaving(true);
    const data = {
      ...locForm,
      target_min: locForm.target_min !== "" ? parseFloat(locForm.target_min) : null,
      target_max: locForm.target_max !== "" ? parseFloat(locForm.target_max) : null,
      check_interval_minutes: locForm.check_interval_minutes !== "" ? parseInt(locForm.check_interval_minutes) : null,
    };
    if (editLocation) {
      await base44.entities.TempLogLocation.update(editLocation.id, data);
      setLocations(prev => prev.map(l => l.id === editLocation.id ? { ...l, ...data } : l));
      toast.success("Location updated");
    } else {
      const created = await base44.entities.TempLogLocation.create(data);
      setLocations(prev => [...prev, created]);
      toast.success("Location added");
    }
    setSaving(false);
    setShowLocationForm(false);
  };

  const deleteLocation = async (id) => {
    await base44.entities.TempLogLocation.delete(id);
    setLocations(prev => prev.filter(l => l.id !== id));
    toast.success("Location removed");
  };

  const deleteEntry = async (id) => {
    await base44.entities.TempLogEntry.delete(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Temperature Logs</h1>
          <p className="text-muted-foreground mt-1">Track temperatures across refrigerators, hot wells, and cooling</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(v => !v)}>
            <Settings className="h-4 w-4 mr-2" /> Manage Locations
          </Button>
          <Button onClick={openLogForm}>
            <Plus className="h-4 w-4 mr-2" /> Log Temp
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit">
        {TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Manage Locations Panel */}
      {showSettings && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Manage {TYPES.find(t => t.value === activeTab)?.label}</h3>
            <Button size="sm" onClick={() => openLocationForm()}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Location
            </Button>
          </div>
          {locations.filter(l => l.type === activeTab).length === 0 ? (
            <p className="text-sm text-muted-foreground">No locations yet. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {locations.filter(l => l.type === activeTab).map(loc => (
                <div key={loc.id} className="flex items-center justify-between bg-secondary/40 rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{loc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {loc.target_min != null && loc.target_max != null
                        ? `Safe range: ${loc.target_min}°F – ${loc.target_max}°F`
                        : loc.target_max != null
                        ? `Max: ${loc.target_max}°F`
                        : "No range set"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openLocationForm(loc)} className="text-xs text-primary hover:underline">Edit</button>
                    <button onClick={() => deleteLocation(loc.id)} className="text-xs text-destructive hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Location cards with latest readings */}
      {tabLocations.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Thermometer className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No locations yet. Click "Manage Locations" to add some.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tabLocations.map(loc => {
            const locEntries = (entriesByLocation[loc.id] || []).sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
            const latest = locEntries[0];
            const isOverdue = loc.check_interval_minutes && (
              !latest || (Date.now() - new Date(latest.logged_at).getTime()) > loc.check_interval_minutes * 60 * 1000
            );
            return (
              <div key={loc.id} className={`bg-card border rounded-2xl overflow-hidden ${isOverdue ? "border-yellow-500" : "border-border"}`}>
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{loc.name}</p>
                      {isOverdue && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">Overdue</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {loc.target_min != null && loc.target_max != null
                        ? `Safe: ${loc.target_min}–${loc.target_max}°F`
                        : loc.target_max != null
                        ? `Max: ${loc.target_max}°F`
                        : "No range set"}
                      {loc.check_interval_minutes ? ` · Check every ${loc.check_interval_minutes >= 60 ? `${loc.check_interval_minutes / 60}hr` : `${loc.check_interval_minutes}min`}` : ""}
                    </p>
                  </div>
                  {latest && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon status={latest.status} />
                        <span className={`text-xl font-bold ${statusColor[latest.status] || ""}`}>{latest.temperature}°F</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(latest.logged_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1 max-h-48 overflow-y-auto">
                  {locEntries.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No readings yet</p>
                  ) : (
                    locEntries.slice(0, 10).map(entry => (
                      <div key={entry.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-secondary/40 group">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={entry.status} />
                          <span className="font-medium">{entry.temperature}°F</span>
                          {entry.notes && <span className="text-muted-foreground truncate max-w-[100px]">{entry.notes}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{new Date(entry.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Temp Modal */}
      {showLogForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowLogForm(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Log Temperature</h2>
              <button onClick={() => setShowLogForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                <select
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={logForm.location_id}
                  onChange={e => setLogForm(f => ({ ...f, location_id: e.target.value }))}
                >
                  <option value="">— Select location —</option>
                  {tabLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Temperature (°F)</label>
                <input
                  type="number"
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={logForm.temperature}
                  onChange={e => setLogForm(f => ({ ...f, temperature: e.target.value }))}
                  placeholder="e.g. 38"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
                <input
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={logForm.notes}
                  onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any notes…"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setShowLogForm(false)}>Cancel</Button>
              <Button onClick={saveLog} disabled={saving}>{saving ? "Saving…" : "Log Temp"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Location Form Modal */}
      {showLocationForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowLocationForm(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{editLocation ? "Edit Location" : "Add Location"}</h2>
              <button onClick={() => setShowLocationForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                <input
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={locForm.name}
                  onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Walk-in Cooler, Salad Reach-in"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <select
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={locForm.type}
                  onChange={e => setLocForm(f => ({ ...f, type: e.target.value }))}
                >
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Check Interval</label>
                <select
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={locForm.check_interval_minutes}
                  onChange={e => setLocForm(f => ({ ...f, check_interval_minutes: e.target.value }))}
                >
                  <option value="">No alert</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every 1 hour</option>
                  <option value="120">Every 2 hours</option>
                  <option value="180">Every 3 hours</option>
                  <option value="240">Every 4 hours</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Min Safe Temp (°F)</label>
                  <input
                    type="number"
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={locForm.target_min}
                    onChange={e => setLocForm(f => ({ ...f, target_min: e.target.value }))}
                    placeholder="e.g. 32"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Max Safe Temp (°F)</label>
                  <input
                    type="number"
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={locForm.target_max}
                    onChange={e => setLocForm(f => ({ ...f, target_max: e.target.value }))}
                    placeholder="e.g. 41"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setShowLocationForm(false)}>Cancel</Button>
              <Button onClick={saveLocation} disabled={saving}>{saving ? "Saving…" : editLocation ? "Save Changes" : "Add Location"}</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}