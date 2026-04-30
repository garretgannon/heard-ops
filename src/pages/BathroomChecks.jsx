import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, AlertTriangle, ShoppingBag, Plus, Trash2, Clock, Settings, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { toast } from "sonner";

const STATUS_CONFIG = {
  clean: { label: "Clean", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/15" },
  needs_attention: { label: "Needs Attention", icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/15" },
  out_of_supplies: { label: "Out of Supplies", icon: ShoppingBag, color: "text-red-400", bg: "bg-red-500/15" },
};

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
  // overnight wrap
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
  const [checkModal, setCheckModal] = useState(null); // config object
  const [configForm, setConfigForm] = useState({ name: "", interval_minutes: 60, active_start: "", active_end: "", notes: "" });
  const [checkForm, setCheckForm] = useState({ status: "clean", notes: "" });
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(null); // config object being edited
  const [editForm, setEditForm] = useState({});
  const { user, isAdmin } = useCurrentUser();

  const load = async () => {
    const [c, l] = await Promise.all([
      base44.entities.BathroomCheckConfig.filter({ is_active: true }),
      base44.entities.BathroomCheckLog.list("-checked_at", 200),
    ]);
    setConfigs(c);
    setLogs(l);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addConfig = async () => {
    if (!configForm.name.trim() || !configForm.interval_minutes) return;
    setSaving(true);
    await base44.entities.BathroomCheckConfig.create({ ...configForm, is_active: true });
    setConfigForm({ name: "", interval_minutes: 60, active_start: "", active_end: "", notes: "" });

    toast.success("Bathroom location added");
    setSaving(false);
    load();
  };

  const deleteConfig = async (id) => {
    await base44.entities.BathroomCheckConfig.update(id, { is_active: false });
    toast.success("Location removed");
    load();
  };

  const openEdit = (c) => {
    setEditModal(c);
    setEditForm({ name: c.name, interval_minutes: c.interval_minutes, active_start: c.active_start || "", active_end: c.active_end || "", notes: c.notes || "" });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.interval_minutes) return;
    setSaving(true);
    await base44.entities.BathroomCheckConfig.update(editModal.id, editForm);
    setEditModal(null);
    toast.success("Location updated");
    setSaving(false);
    load();
  };

  const submitCheck = async () => {
    if (!checkModal) return;
    setSaving(true);
    await base44.entities.BathroomCheckLog.create({
      config_id: checkModal.id,
      location_name: checkModal.name,
      checked_by: user?.full_name || user?.email || "Staff",
      checked_at: new Date().toISOString(),
      status: checkForm.status,
      notes: checkForm.notes,
    });
    setCheckModal(null);
    setCheckForm({ status: "clean", notes: "" });
    setSaving(false);
    toast.success("Check logged!");
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Bathroom Checks</h1>
          <p className="text-muted-foreground mt-1">Track cleanliness on custom intervals</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowConfig(v => !v)}>
              <Settings className="h-4 w-4 mr-1" /> Configure
            </Button>
          )}
        </div>
      </div>

      {/* Config panel (admin only) */}
      <AnimatePresence>
        {showConfig && isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card rounded-2xl border border-border p-5 space-y-4"
          >
            <h2 className="font-semibold">Manage Locations</h2>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
              <input
                placeholder="Location name (e.g. Men's Room)"
                value={configForm.name}
                onChange={e => setConfigForm(p => ({ ...p, name: e.target.value }))}
                className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Interval (min)"
                  value={configForm.interval_minutes}
                  onChange={e => setConfigForm(p => ({ ...p, interval_minutes: Number(e.target.value) }))}
                  className="w-36 h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  min={5}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">min interval</span>
              </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex items-center gap-2 flex-1">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Active From</label>
                    <input
                      type="time"
                      value={configForm.active_start}
                      onChange={e => setConfigForm(p => ({ ...p, active_start: e.target.value }))}
                      className="h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">—</span>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Active Until</label>
                    <input
                      type="time"
                      value={configForm.active_end}
                      onChange={e => setConfigForm(p => ({ ...p, active_end: e.target.value }))}
                      className="h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-5">Leave blank for always-on</p>
                </div>
              <Button size="sm" onClick={addConfig} disabled={saving || !configForm.name.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
              </div>
            </div>
            {configs.length > 0 && (
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {configs.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-background/40">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {minutesToLabel(c.interval_minutes)}
                        {c.active_start && c.active_end && (
                          <span className="ml-1">&middot; {c.active_start}–{c.active_end}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteConfig(c.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location cards */}
      {configs.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground">
          {isAdmin ? "No bathroom locations configured yet. Use Configure to add one." : "No bathroom locations set up."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {configs.map((c, i) => {
            const recentLog = logs.filter(l => l.config_id === c.id)[0];
            const withinHours = isWithinActiveHours(c);
            const overdue = isOverdue(recentLog, c);
            const lastStatus = recentLog ? STATUS_CONFIG[recentLog.status] : null;
            const LastIcon = lastStatus?.icon;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06 }}
                className={`bg-card rounded-2xl border p-5 space-y-4 ${overdue && withinHours ? "border-yellow-500/40" : "border-border"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {minutesToLabel(c.interval_minutes)}
                      {c.active_start && c.active_end && (
                        <span>&middot; {c.active_start}–{c.active_end}</span>
                      )}
                    </p>
                  </div>
                  {!withinHours ? (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Closed</span>
                  ) : overdue ? (
                    <span className="text-xs bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full font-medium">Due</span>
                  ) : (
                    <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium">OK</span>
                  )}
                </div>

                {recentLog ? (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${lastStatus?.bg}`}>
                    {LastIcon && <LastIcon className={`h-4 w-4 ${lastStatus?.color}`} />}
                    <div>
                      <p className={`text-xs font-medium ${lastStatus?.color}`}>{lastStatus?.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {recentLog.checked_by} · {new Date(recentLog.checked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No checks logged yet.</p>
                )}

                <Button
                  size="sm"
                  className="w-full"
                  variant={overdue ? "default" : "outline"}
                  onClick={() => { setCheckModal(c); setCheckForm({ status: "clean", notes: "" }); }}
                >
                  Log Check
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Recent log */}
      {logs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Checks</h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {logs.slice(0, 15).map(log => {
              const sc = STATUS_CONFIG[log.status];
              const Icon = sc?.icon;
              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sc?.bg}`}>
                    {Icon && <Icon className={`h-4 w-4 ${sc?.color}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{log.location_name}</p>
                    <p className="text-xs text-muted-foreground">{log.checked_by} · {new Date(log.checked_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc?.bg} ${sc?.color}`}>{sc?.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
            onClick={() => setEditModal(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-card rounded-2xl border border-border p-5 w-full max-w-md space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Edit Location</h3>
                <button onClick={() => setEditModal(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Location Name</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Check Interval (minutes)</label>
                  <input
                    type="number"
                    min={5}
                    value={editForm.interval_minutes}
                    onChange={e => setEditForm(p => ({ ...p, interval_minutes: Number(e.target.value) }))}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Active From</label>
                    <input
                      type="time"
                      value={editForm.active_start}
                      onChange={e => setEditForm(p => ({ ...p, active_start: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">—</span>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Active Until</label>
                    <input
                      type="time"
                      value={editForm.active_end}
                      onChange={e => setEditForm(p => ({ ...p, active_end: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Leave times blank for always-on</p>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Notes (optional)</label>
                  <textarea
                    value={editForm.notes}
                    onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditModal(null)}>Cancel</Button>
                <Button size="sm" onClick={saveEdit} disabled={saving || !editForm.name.trim()}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check modal */}
      <AnimatePresence>
        {checkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
            onClick={() => setCheckModal(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Log Check — <span className="font-normal text-muted-foreground">{checkModal.name}</span></h3>
                <button onClick={() => setCheckModal(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, sc]) => {
                    const Icon = sc.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setCheckForm(p => ({ ...p, status: key }))}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          checkForm.status === key ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${sc.color}`} />
                        <span className="text-sm font-medium">{sc.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Notes (optional)</p>
                <textarea
                  placeholder="Any issues to note..."
                  value={checkForm.notes}
                  onChange={e => setCheckForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <Button className="w-full" onClick={submitCheck} disabled={saving}>
                {saving ? "Saving..." : "Submit Check"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}