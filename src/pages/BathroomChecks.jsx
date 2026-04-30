import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, AlertTriangle, ShoppingBag, Wrench, Plus, Trash2, Clock, Settings, X, Upload, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CONFIG = {
  clean: { label: "Clean", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/15 border-green-500/30" },
  needs_attention: { label: "Needs Attention", icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-500/15 border-yellow-500/30" },
  out_of_supplies: { label: "Out of Supplies", icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-500/15 border-orange-500/30" },
  maintenance: { label: "Maintenance Needed", icon: Wrench, color: "text-red-600", bg: "bg-red-500/15 border-red-500/30" },
};

const SUPPLY_CHECKLIST = [
  { key: "toilet_paper", label: "Toilet Paper" },
  { key: "paper_towels", label: "Paper Towels" },
  { key: "soap", label: "Soap" },
  { key: "trash", label: "Trash Empty" },
  { key: "floors", label: "Floors Clean" },
  { key: "smell", label: "No Bad Smell" },
  { key: "mirrors", label: "Mirrors Clean" },
];

function minutesToLabel(mins) {
  if (mins < 60) return `Every ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `Every ${h}h ${m}m` : `Every ${h}h`;
}

function isWithinActiveHours(config) {
  if (!config.active_start || !config.active_end) return true;
  const now = new Date();
  const [sh, sm] = config.active_start.split(":").map(Number);
  const [eh, em] = config.active_end.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  if (startMins <= endMins) return nowMins >= startMins && nowMins < endMins;
  return nowMins >= startMins || nowMins < endMins;
}

function isOverdue(log, config) {
  if (!isWithinActiveHours(config)) return false;
  if (!log) return true;
  const last = new Date(log.checked_at);
  const now = new Date();
  return (now - last) / 60000 > config.interval_minutes;
}

export default function BathroomChecks() {
  const [configs, setConfigs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentCheck, setCurrentCheck] = useState(null);
  const [configForm, setConfigForm] = useState({ name: "", interval_minutes: 60, active_start: "", active_end: "" });
  const [checkForm, setCheckForm] = useState({ status: "clean", supplies: {}, notes: "", photo_url: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { user, isAdmin } = useCurrentUser();

  const load = async () => {
    try {
      const [c, l] = await Promise.all([
        base44.entities.BathroomCheckConfig.filter({ is_active: true }),
        base44.entities.BathroomCheckLog.list("-checked_at", 100),
      ]);
      setConfigs(c);
      setLogs(l);
      setLoading(false);
    } catch (err) {
      console.error("Load error:", err);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addConfig = async () => {
    if (!configForm.name.trim() || !configForm.interval_minutes) {
      toast.error("Enter location and interval");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.BathroomCheckConfig.create({ ...configForm, is_active: true });
      setConfigForm({ name: "", interval_minutes: 60, active_start: "", active_end: "" });
      toast.success("Location added");
      load();
    } catch (err) {
      toast.error("Failed to add location");
    }
    setSaving(false);
  };

  const deleteConfig = async (id) => {
    try {
      await base44.entities.BathroomCheckConfig.update(id, { is_active: false });
      toast.success("Location removed");
      load();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCheckForm(prev => ({ ...prev, photo_url: file_url }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error("Photo upload failed");
    }
    setUploadingPhoto(false);
  };

  const submitCheck = async () => {
    if (!currentCheck) return;
    setSaving(true);
    try {
      await base44.entities.BathroomCheckLog.create({
        config_id: currentCheck.id,
        location_name: currentCheck.name,
        checked_by: user?.full_name || user?.email || "Staff",
        checked_at: new Date().toISOString(),
        status: checkForm.status,
        supplies: Object.keys(checkForm.supplies).filter(k => checkForm.supplies[k]),
        notes: checkForm.notes,
        photo_url: checkForm.photo_url,
      });

      if (checkForm.status !== "clean") {
        toast.error(`Check logged - Manager notified of issue at ${currentCheck.name}`);
      } else {
        toast.success("Clean check logged");
      }

      setCurrentCheck(null);
      setCheckForm({ status: "clean", supplies: {}, notes: "", photo_url: "" });
      load();
    } catch (err) {
      toast.error("Failed to save check");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const overdueConfigs = configs.filter(c => isWithinActiveHours(c) && isOverdue(logs.find(l => l.config_id === c.id), c));
  const nextDue = overdueConfigs.length > 0 ? overdueConfigs[0] : null;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Bathroom Checks</h1>
          <p className="text-muted-foreground mt-1">Fast, simple, on-schedule checks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-2" /> History
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowConfig(v => !v)}>
              <Settings className="h-4 w-4 mr-1" /> Configure
            </Button>
          )}
        </div>
      </div>

      {/* Config panel */}
      <AnimatePresence>
        {showConfig && isAdmin && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h2 className="font-semibold">Manage Locations</h2>
            <div className="space-y-3">
              <div>
                <input placeholder="Location name" value={configForm.name} onChange={e => setConfigForm(p => ({ ...p, name: e.target.value }))} className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">Interval</label>
                  <input type="number" value={configForm.interval_minutes} onChange={e => setConfigForm(p => ({ ...p, interval_minutes: Number(e.target.value) }))} placeholder="60" className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" min={5} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">From</label>
                  <input type="time" value={configForm.active_start} onChange={e => setConfigForm(p => ({ ...p, active_start: e.target.value }))} className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">To</label>
                  <input type="time" value={configForm.active_end} onChange={e => setConfigForm(p => ({ ...p, active_end: e.target.value }))} className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <Button size="sm" onClick={addConfig} disabled={saving || !configForm.name.trim()} className="mt-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {configs.length > 0 && (
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {configs.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-background/40">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{minutesToLabel(c.interval_minutes)}</p>
                    </div>
                    <button onClick={() => deleteConfig(c.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current check required */}
      {nextDue ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-2xl border-2 p-6 space-y-4", overdueConfigs.length > 0 ? "border-red-500/40 bg-red-500/5" : "border-yellow-500/40 bg-yellow-500/5")}>
          <div>
            <p className="text-sm text-muted-foreground">Current check required:</p>
            <h2 className="text-2xl font-bold mt-1">{nextDue.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{minutesToLabel(nextDue.interval_minutes)}</p>
          </div>

          {logs.find(l => l.config_id === nextDue.id) && (
            <p className="text-xs text-muted-foreground">
              Last check: {new Date(logs.find(l => l.config_id === nextDue.id)?.checked_at).toLocaleTimeString()} by {logs.find(l => l.config_id === nextDue.id)?.checked_by}
            </p>
          )}

          <Button className="w-full h-12 text-base" onClick={() => { setCurrentCheck(nextDue); setCheckForm({ status: "clean", supplies: {}, notes: "", photo_url: "" }); }}>
            Log Check
          </Button>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-border p-6 text-center text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="font-semibold">All caught up!</p>
          <p className="text-sm">No bathroom checks due right now.</p>
        </div>
      )}

      {/* Check Modal */}
      <Dialog open={!!currentCheck} onOpenChange={() => setCurrentCheck(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Check: {currentCheck?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            {/* Status buttons */}
            <div>
              <label className="text-sm font-bold block mb-2">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, sc]) => {
                  const Icon = sc.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setCheckForm(p => ({ ...p, status: key }))}
                      className={cn("flex flex-col items-center gap-2 px-3 py-3 rounded-lg border-2 transition-all", checkForm.status === key ? `${sc.bg} border-current` : "border-border hover:border-primary/40")}
                    >
                      <Icon className={cn("h-5 w-5", sc.color)} />
                      <span className="text-xs font-semibold text-center leading-tight">{sc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Supply checklist */}
            <div>
              <label className="text-sm font-bold block mb-2">Supplies and Condition</label>
              <div className="space-y-1.5">
                {SUPPLY_CHECKLIST.map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkForm.supplies[item.key] || false}
                      onChange={(e) => setCheckForm(prev => ({ ...prev, supplies: { ...prev.supplies, [item.key]: e.target.checked } }))}
                      className="rounded w-4 h-4"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Photo */}
            <div>
              <label className="text-sm font-bold block mb-2">Photo (optional)</label>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files[0])}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={uploadingPhoto}
                  onClick={e => e.currentTarget.parentElement.querySelector('input').click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingPhoto ? "Uploading..." : checkForm.photo_url ? "Photo uploaded" : "Upload Photo"}
                </Button>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-bold block mb-1">Notes (optional)</label>
              <Textarea
                value={checkForm.notes}
                onChange={(e) => setCheckForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any issues..."
                className="min-h-16"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCurrentCheck(null)}>Cancel</Button>
            <Button onClick={submitCheck} disabled={saving} className="flex-1">
              {saving ? "Logging..." : "Log Check"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Check History</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No checks logged yet</p>
            ) : (
              logs.map(log => {
                const sc = STATUS_CONFIG[log.status];
                const Icon = sc?.icon;
                return (
                  <div key={log.id} className={cn("flex items-start gap-3 p-3 rounded-lg border", sc?.bg)}>
                    <div className="mt-1">
                      {Icon && <Icon className={cn("h-4 w-4", sc?.color)} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{log.location_name}</p>
                      <p className="text-xs text-muted-foreground">{log.checked_by} · {new Date(log.checked_at).toLocaleString()}</p>
                      <p className={cn("text-xs font-semibold mt-1", sc?.color)}>{sc?.label}</p>
                      {log.supplies?.length > 0 && <p className="text-xs text-muted-foreground mt-1">Items checked: {log.supplies.length}</p>}
                      {log.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{log.notes}"</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}