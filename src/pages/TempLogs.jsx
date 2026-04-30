import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Settings, X, Thermometer, CheckCircle2, AlertTriangle, XCircle, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Predefined locations matching kitchen zones
const LOCATIONS = [
  { name: "Walk-in Cooler", type: "cooler", min: 32, max: 41 },
  { name: "Freezer", type: "freezer", min: -10, max: 0 },
  { name: "Line Cooler", type: "cooler", min: 32, max: 41 },
  { name: "Prep Cooler", type: "cooler", min: 32, max: 41 },
  { name: "Hot Holding", type: "hot", min: 135, max: 180 },
  { name: "Dish Machine", type: "dishwasher", min: null, max: 180 },
];

const getStatus = (temp, min, max) => {
  if (temp < min || temp > max) return "fail";
  return "pass";
};

const StatusBadge = ({ status }) => {
  if (status === "pass") return <span className="bg-green-500/20 text-green-700 px-2 py-0.5 rounded font-bold text-sm">✓ Pass</span>;
  return <span className="bg-red-500/20 text-red-700 px-2 py-0.5 rounded font-bold text-sm">✗ Fail</span>;
};

export default function TempLogs() {
  const [locations, setLocations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showFailDialog, setShowFailDialog] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({ temperature: "", notes: "", photo_url: "" });
  const [managerInitials, setManagerInitials] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const load = async () => {
    try {
      const [locs, ents] = await Promise.all([
        base44.entities.TempLogLocation.list(),
        base44.entities.TempLogEntry.filter({ date: todayStr }),
      ]);
      setLocations(locs.filter(l => l.is_active !== false));
      setEntries(ents);
      setLoading(false);
    } catch (err) {
      console.error("Load error:", err);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const todayEntries = entries.filter(e => e.date === todayStr);
  const completed = todayEntries.filter(e => e.status);
  const pending = locations.filter(l => !todayEntries.find(e => e.location_id === l.id));

  const handleOpenLog = (location) => {
    setSelectedLocation(location);
    setFormData({ temperature: "", notes: "", photo_url: "" });
    setShowLogForm(true);
  };

  const handleUploadPhoto = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error("Photo upload failed");
    }
    setUploadingPhoto(false);
  };

  const handleSaveLog = async () => {
    const temp = parseFloat(formData.temperature);
    if (!temp && temp !== 0) {
      toast.error("Enter a temperature");
      return;
    }

    const status = getStatus(temp, selectedLocation.target_min, selectedLocation.target_max);
    if (status === "fail" && !managerInitials.trim()) {
      toast.error("Manager initials required for failed temps");
      return;
    }

    setSaving(true);
    try {
      const entry = await base44.entities.TempLogEntry.create({
        location_id: selectedLocation.id,
        location_name: selectedLocation.name,
        temperature: temp,
        status: status === "pass",
        date: todayStr,
        logged_at: new Date().toISOString(),
        notes: formData.notes,
        photo_url: formData.photo_url,
        manager_initials: status === "fail" ? managerInitials : null,
        corrective_action: status === "fail" ? formData.notes : null,
      });

      setEntries(prev => [...prev, entry]);
      setShowLogForm(false);
      setShowFailDialog(null);
      setFormData({ temperature: "", notes: "", photo_url: "" });
      setManagerInitials("");

      const result = status === "pass" ? "✓ Logged" : "✗ Logged & flagged";
      toast.success(result);
    } catch (err) {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const handleAddLocation = async (template) => {
    try {
      const created = await base44.entities.TempLogLocation.create({
        name: template.name,
        type: template.type,
        target_min: template.min,
        target_max: template.max,
        is_active: true,
      });
      setLocations(prev => [...prev, created]);
      setShowAddLocation(false);
      toast.success("Location added");
    } catch (err) {
      toast.error("Failed to add location");
    }
  };

  const handleDeleteLocation = async (id) => {
    try {
      await base44.entities.TempLogLocation.delete(id);
      setLocations(prev => prev.filter(l => l.id !== id));
      toast.success("Location removed");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleExportReport = () => {
    const csv = ["Location,Temperature,Status,Time,Notes,Manager Initials"]
      .concat(
        completed.map(e => `"${e.location_name}",${e.temperature},"${e.status ? "Pass" : "Fail"}",${new Date(e.logged_at).toLocaleTimeString()},"${e.notes || ""}","${e.manager_initials || ""}"`)
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `temp-logs-${todayStr}.csv`;
    a.click();
    toast.success("Report exported");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6 pb-12" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Temperature Logs</h1>
          <p className="text-muted-foreground mt-1">{todayStr} • {pending.length} pending, {completed.length} logged</p>
        </div>
        <div className="flex gap-2">
          {completed.length > 0 && (
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          )}
          <Button onClick={() => setShowAddLocation(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Location
          </Button>
        </div>
      </div>

      {/* Pending logs (required for today) */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Required Today ({pending.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pending.map(location => (
              <div key={location.id} className="bg-card border-2 border-red-500/30 rounded-xl p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-base">{location.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Safe range: {location.target_min}°F – {location.target_max}°F
                  </p>
                </div>
                <Button className="w-full" onClick={() => handleOpenLog(location)}>
                  <Thermometer className="h-4 w-4 mr-2" /> Log Temperature
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed logs */}
      {completed.length > 0 && (
        <details className="border border-border rounded-lg overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 bg-green-500/5 hover:bg-green-500/10 cursor-pointer font-semibold text-green-700">
            <span>✓ Completed Today ({completed.length})</span>
            <span className="text-xs">▼</span>
          </summary>
          <div className="divide-y divide-border">
            {completed.map(entry => (
              <div key={entry.id} className="p-4 flex items-start justify-between bg-card/50">
                <div className="flex-1">
                  <p className="font-semibold">{entry.location_name}</p>
                  <p className="text-sm text-muted-foreground">{new Date(entry.logged_at).toLocaleTimeString()}</p>
                  {entry.notes && <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>}
                  {entry.manager_initials && <p className="text-xs font-semibold text-yellow-600">Manager: {entry.manager_initials}</p>}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{entry.temperature}°F</p>
                  <StatusBadge status={entry.status ? "pass" : "fail"} />
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Manage Locations */}
      {locations.length > 0 && (
        <details className="border border-border rounded-lg overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 bg-secondary/50 hover:bg-secondary cursor-pointer font-semibold">
            <span>Manage Locations</span>
            <span className="text-xs">▼</span>
          </summary>
          <div className="divide-y divide-border">
            {locations.map(loc => (
              <div key={loc.id} className="p-4 flex items-center justify-between bg-card/50">
                <div>
                  <p className="font-semibold">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">{loc.target_min}°F – {loc.target_max}°F</p>
                </div>
                <button onClick={() => handleDeleteLocation(loc.id)} className="text-destructive hover:text-destructive/80">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Log Temp Modal */}
      <Dialog open={showLogForm} onOpenChange={setShowLogForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Temperature: {selectedLocation?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-bold block mb-2">Temperature (°F) *</label>
              <Input
                type="number"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                placeholder="e.g., 38"
                className="h-12 text-lg"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-2">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any observations..."
                className="min-h-16"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-2">Thermometer Photo (optional)</label>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadPhoto(e.target.files[0])}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={uploadingPhoto}
                  onClick={e => e.currentTarget.parentElement.querySelector('input').click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingPhoto ? "Uploading..." : formData.photo_url ? "Photo uploaded ✓" : "Upload Photo"}
                </Button>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogForm(false)}>Cancel</Button>
            <Button onClick={() => {
              const temp = parseFloat(formData.temperature);
              const status = getStatus(temp, selectedLocation.target_min, selectedLocation.target_max);
              if (status === "fail") {
                setShowFailDialog(true);
              } else {
                handleSaveLog();
              }
            }} disabled={saving}>
              {saving ? "Logging..." : "Log Temperature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Failed Temp Dialog */}
      <Dialog open={!!showFailDialog} onOpenChange={() => setShowFailDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Temperature Out of Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-700">
                {formData.temperature}°F is outside safe range: {selectedLocation?.target_min}°F – {selectedLocation?.target_max}°F
              </p>
            </div>

            <div>
              <label className="text-sm font-bold block mb-2">Manager Initials *</label>
              <Input
                value={managerInitials}
                onChange={(e) => setManagerInitials(e.target.value.toUpperCase())}
                placeholder="e.g., JD"
                className="h-12 text-lg"
                maxLength={3}
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-2">Corrective Action Taken</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Adjusted unit, called maintenance..."
                className="min-h-16"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFailDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveLog} disabled={saving || !managerInitials} className="bg-red-600 hover:bg-red-700">
              {saving ? "Logging..." : "Log & Flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Location Dialog */}
      <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Temperature Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {LOCATIONS.map(template => (
              <button
                key={template.name}
                onClick={() => handleAddLocation(template)}
                className="w-full text-left p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <p className="font-semibold">{template.name}</p>
                <p className="text-xs text-muted-foreground">{template.min}°F – {template.max}°F</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export const hideBase44Index = true;