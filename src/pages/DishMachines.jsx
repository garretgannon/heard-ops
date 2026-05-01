import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Plus, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock,
  ChevronDown, Settings, Droplet, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

const todayStr = format(new Date(), "yyyy-MM-dd");

const DEFAULT_MACHINE = {
  name: "", location: "", check_frequency_hours: 4,
  min_wash_temp: 140, max_wash_temp: 180,
  min_rinse_temp: 140, max_rinse_temp: 180,
  sanitizer_type: "chlorine", min_sanitizer_ppm: 50, max_sanitizer_ppm: 400,
  is_active: true, notes: ""
};

const emptyCheckForm = {
  wash_temp: "", rinse_temp: "", sanitizer_ppm: "",
  test_strip_result: "pass", checked_by: "", notes: "", photo_url: "", corrective_action: ""
};

function isFailed(log, machine) {
  const m = machine || {};
  const minW = m.min_wash_temp ?? 140, maxW = m.max_wash_temp ?? 180;
  const minR = m.min_rinse_temp ?? 140, maxR = m.max_rinse_temp ?? 180;
  const minS = m.min_sanitizer_ppm ?? 50, maxS = m.max_sanitizer_ppm ?? 400;
  return log.wash_temp < minW || log.wash_temp > maxW
    || log.rinse_temp < minR || log.rinse_temp > maxR
    || log.sanitizer_ppm < minS || log.sanitizer_ppm > maxS
    || log.test_strip_result === "fail";
}

function getMachineStatus(machine, todayLogs) {
  const logs = todayLogs.filter(l => l.machine_id === machine.id);
  if (logs.length === 0) return "due";
  const lastLog = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0];
  const failed = isFailed(lastLog, machine);
  if (failed && !lastLog.corrective_action_resolved) return "failed";
  if (failed) return "failed";
  const hoursSince = (Date.now() - new Date(lastLog.logged_at).getTime()) / 3600000;
  if (hoursSince > (machine.check_frequency_hours || 4)) return "overdue";
  return "passed";
}

const STATUS_CONFIG = {
  passed:  { label: "Passed",  color: "text-green-500",  border: "border-green-500/30",  bg: "bg-green-500/5" },
  failed:  { label: "Failed",  color: "text-red-500",    border: "border-red-500/50",    bg: "bg-red-500/5" },
  due:     { label: "Due",     color: "text-yellow-500", border: "border-yellow-500/40", bg: "bg-yellow-500/5" },
  overdue: { label: "Overdue", color: "text-red-500",    border: "border-red-500/50",    bg: "bg-red-500/5" },
};

export default function DishMachines() {
  const [activeTab, setActiveTab] = useState("today");
  const [machines, setMachines] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [failedLogs, setFailedLogs] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [showFailDialog, setShowFailDialog] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [checkForm, setCheckForm] = useState(emptyCheckForm);
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [machineForm, setMachineForm] = useState(DEFAULT_MACHINE);
  const [showCompleted, setShowCompleted] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [u, mData, todayData, failData] = await Promise.all([
        base44.auth.me(),
        base44.entities.DishMachineEquipment.list(),
        base44.entities.DishMachineLog.filter({ date: todayStr }),
        base44.entities.DishMachineLog.filter({ status: "fail" }),
      ]);
      setUser(u);
      setIsAdmin(u?.role === "admin");
      setMachines(mData.filter(m => m.is_active !== false));
      setTodayLogs(todayData);
      setFailedLogs(failData.filter(l => !l.corrective_action_resolved));
      setCheckForm(f => ({ ...f, checked_by: u?.full_name || u?.email || "" }));
      setLoading(false);
    };
    load();
  }, []);

  const loadHistory = async () => {
    if (historyLoaded) return;
    const data = await base44.entities.DishMachineLog.list("-logged_at", 200);
    setHistoryLogs(data.filter(l => l.date !== todayStr));
    setHistoryLoaded(true);
  };

  const openCheck = (machine, isRecheck = false) => {
    setSelectedMachine(machine);
    setCheckForm({ ...emptyCheckForm, checked_by: user?.full_name || user?.email || "" });
    setShowCheckForm(true);
  };

  const handleSaveCheck = async (force = false) => {
    const { wash_temp, rinse_temp, sanitizer_ppm, checked_by } = checkForm;
    if (!wash_temp || !rinse_temp || !sanitizer_ppm || !checked_by) {
      toast.error("Fill in all required fields");
      return;
    }
    const m = selectedMachine;
    const logData = {
      machine_id: m.id, machine_name: m.name, date: todayStr,
      logged_at: new Date().toISOString(),
      checked_by,
      wash_temp: parseFloat(wash_temp),
      rinse_temp: parseFloat(rinse_temp),
      sanitizer_ppm: parseFloat(sanitizer_ppm),
      test_strip_result: checkForm.test_strip_result,
      notes: checkForm.notes,
      photo_url: checkForm.photo_url,
      corrective_action: checkForm.corrective_action,
      corrective_action_resolved: false,
    };
    const failed = isFailed(logData, m);
    logData.status = failed ? "fail" : "pass";

    if (failed && !checkForm.corrective_action.trim() && !force) {
      setShowFailDialog(true);
      return;
    }

    setSaving(true);
    const created = await base44.entities.DishMachineLog.create(logData);
    setTodayLogs(prev => [created, ...prev]);
    if (failed) setFailedLogs(prev => [created, ...prev]);
    setShowCheckForm(false);
    setShowFailDialog(false);
    setSaving(false);
    toast.success(failed ? "⚠️ Failed check logged" : "✓ Check passed");
  };

  const resolveAction = async (log) => {
    await base44.entities.DishMachineLog.update(log.id, { corrective_action_resolved: true });
    setFailedLogs(prev => prev.filter(l => l.id !== log.id));
    setTodayLogs(prev => prev.map(l => l.id === log.id ? { ...l, corrective_action_resolved: true } : l));
    toast.success("Action marked resolved");
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setCheckForm(f => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  const saveMachine = async () => {
    if (!machineForm.name.trim()) { toast.error("Machine name required"); return; }
    setSaving(true);
    if (editingMachine) {
      await base44.entities.DishMachineEquipment.update(editingMachine.id, machineForm);
      setMachines(prev => prev.map(m => m.id === editingMachine.id ? { ...m, ...machineForm } : m));
    } else {
      const created = await base44.entities.DishMachineEquipment.create(machineForm);
      setMachines(prev => [...prev, created]);
    }
    setShowMachineForm(false);
    setSaving(false);
    toast.success(editingMachine ? "Machine updated" : "Machine added");
  };

  const deleteMachine = async (id) => {
    if (!confirm("Remove this machine?")) return;
    await base44.entities.DishMachineEquipment.delete(id);
    setMachines(prev => prev.filter(m => m.id !== id));
    toast.success("Removed");
  };

  // Summary stats
  const dueMachines = machines.filter(m => {
    const s = getMachineStatus(m, todayLogs);
    return s === "due" || s === "overdue";
  });
  const failedToday = todayLogs.filter(l => l.status === "fail").length;
  const passedToday = todayLogs.filter(l => l.status === "pass").length;
  const lastSuccess = [...todayLogs].filter(l => l.status === "pass").sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0];

  const pendingMachines = machines.filter(m => ["due", "overdue"].includes(getMachineStatus(m, todayLogs)));
  const completedMachines = machines.filter(m => getMachineStatus(m, todayLogs) === "passed");
  const failedMachines = machines.filter(m => getMachineStatus(m, todayLogs) === "failed");

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 pb-16 max-w-2xl">
      {/* Title */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Dish Machine Logs</h1>
          <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE, MMM d")}</p>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryTile label="Due for Check" value={dueMachines.length} color={dueMachines.length > 0 ? "text-yellow-400" : "text-green-400"} />
        <SummaryTile label="Failed Today" value={failedToday} color={failedToday > 0 ? "text-red-400" : "text-muted-foreground"} />
        <SummaryTile label="Last Pass" value={lastSuccess ? format(new Date(lastSuccess.logged_at), "h:mm a") : "—"} color="text-green-400" />
        <SummaryTile label="Completed" value={passedToday} color="text-green-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
        {[
          { id: "today", label: "Today" },
          { id: "failed", label: `Failed${failedLogs.length > 0 ? ` (${failedLogs.length})` : ""}` },
          { id: "history", label: "History" },
          ...(isAdmin ? [{ id: "setup", label: "Equipment Setup" }] : []),
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id === "history") loadHistory(); }}
            className={cn(
              "flex-1 py-2 px-2 rounded-md text-xs font-semibold transition-all",
              activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {activeTab === "today" && (
        <div className="space-y-4">
          {machines.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <Droplet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm mb-3">No machines configured</p>
              {isAdmin && <Button size="sm" onClick={() => { setEditingMachine(null); setMachineForm(DEFAULT_MACHINE); setShowMachineForm(true); }}>Add Machine</Button>}
            </div>
          )}

          {/* Pending / Failed */}
          {[...failedMachines, ...pendingMachines].length > 0 && (
            <div className="space-y-2">
              {[...failedMachines, ...pendingMachines].map(machine => (
                <MachineCard key={machine.id} machine={machine} todayLogs={todayLogs} onCheck={openCheck} />
              ))}
            </div>
          )}

          {/* Completed */}
          {completedMachines.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
              >
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showCompleted && "rotate-180")} />
                Completed Today ({completedMachines.length})
              </button>
              {showCompleted && completedMachines.map(machine => (
                <MachineCard key={machine.id} machine={machine} todayLogs={todayLogs} onCheck={openCheck} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAILED TAB */}
      {activeTab === "failed" && (
        <div className="space-y-3">
          {failedLogs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No unresolved failed checks</div>
          ) : failedLogs.map(log => {
            const machine = machines.find(m => m.id === log.machine_id);
            return (
              <div key={log.id} className="bg-red-500/5 border border-red-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{log.machine_name}</p>
                    <p className="text-xs text-muted-foreground">{log.date} · {log.checked_by}</p>
                  </div>
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <ReadingRow log={log} machine={machine} />
                {log.corrective_action && (
                  <div className="bg-red-500/10 rounded p-2 text-xs">
                    <span className="font-semibold text-red-600">Action: </span>{log.corrective_action}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => openCheck(machines.find(m => m.id === log.machine_id))}>
                    <RefreshCw className="h-3 w-3" /> Recheck
                  </Button>
                  {log.corrective_action && (
                    <Button size="sm" className="gap-1.5 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => resolveAction(log)}>
                      <CheckCircle2 className="h-3 w-3" /> Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {!historyLoaded ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Loading history...</div>
          ) : historyLogs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No historical logs</div>
          ) : historyLogs.map(log => {
            const machine = machines.find(m => m.id === log.machine_id);
            const passed = log.status === "pass";
            return (
              <div key={log.id} className={cn("rounded-xl p-3 border", passed ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20")}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {passed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <p className="font-semibold text-sm">{log.machine_name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{log.date}</p>
                </div>
                <ReadingRow log={log} machine={machine} compact />
                <p className="text-xs text-muted-foreground mt-1">{log.checked_by}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* EQUIPMENT SETUP TAB */}
      {activeTab === "setup" && isAdmin && (
        <div className="space-y-3">
          <Button onClick={() => { setEditingMachine(null); setMachineForm(DEFAULT_MACHINE); setShowMachineForm(true); }} className="w-full gap-1.5">
            <Plus className="h-4 w-4" /> Add Machine
          </Button>
          {machines.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.location}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingMachine(m); setMachineForm({ ...DEFAULT_MACHINE, ...m }); setShowMachineForm(true); }}>Edit</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => deleteMachine(m.id)}>Remove</Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
                <span>Wash: {m.min_wash_temp}–{m.max_wash_temp}°F</span>
                <span>Rinse: {m.min_rinse_temp}–{m.max_rinse_temp}°F</span>
                <span>PPM: {m.min_sanitizer_ppm}–{m.max_sanitizer_ppm}</span>
              </div>
              <p className="text-xs text-muted-foreground">Check every {m.check_frequency_hours}h · {m.sanitizer_type}</p>
            </div>
          ))}
        </div>
      )}

      {/* LOG CHECK DIALOG */}
      <Dialog open={showCheckForm} onOpenChange={setShowCheckForm}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Check — {selectedMachine?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Checked By *</Label>
              <Input value={checkForm.checked_by} onChange={e => setCheckForm(f => ({ ...f, checked_by: e.target.value }))} placeholder="Your name" className="h-12 text-base" />
            </div>
            <div>
              <Label>Wash Temp (°F) * <span className="text-muted-foreground font-normal">{selectedMachine?.min_wash_temp ?? 140}–{selectedMachine?.max_wash_temp ?? 180}°F</span></Label>
              <Input type="number" value={checkForm.wash_temp} onChange={e => setCheckForm(f => ({ ...f, wash_temp: e.target.value }))} placeholder="e.g. 160" className="h-12 text-base" />
            </div>
            <div>
              <Label>Rinse Temp (°F) * <span className="text-muted-foreground font-normal">{selectedMachine?.min_rinse_temp ?? 140}–{selectedMachine?.max_rinse_temp ?? 180}°F</span></Label>
              <Input type="number" value={checkForm.rinse_temp} onChange={e => setCheckForm(f => ({ ...f, rinse_temp: e.target.value }))} placeholder="e.g. 160" className="h-12 text-base" />
            </div>
            <div>
              <Label>Sanitizer PPM * <span className="text-muted-foreground font-normal">{selectedMachine?.min_sanitizer_ppm ?? 50}–{selectedMachine?.max_sanitizer_ppm ?? 400} PPM</span></Label>
              <Input type="number" value={checkForm.sanitizer_ppm} onChange={e => setCheckForm(f => ({ ...f, sanitizer_ppm: e.target.value }))} placeholder="e.g. 200" className="h-12 text-base" />
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {[50, 100, 150, 200, 300].map(v => (
                  <button key={v} onClick={() => setCheckForm(f => ({ ...f, sanitizer_ppm: String(v) }))}
                    className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-all", checkForm.sanitizer_ppm == v ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Test Strip Result</Label>
              <div className="flex gap-2 mt-1">
                {["pass", "borderline", "fail"].map(v => (
                  <button key={v} onClick={() => setCheckForm(f => ({ ...f, test_strip_result: v }))}
                    className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all", checkForm.test_strip_result === v
                      ? v === "pass" ? "bg-green-600 text-white border-green-600" : v === "fail" ? "bg-red-600 text-white border-red-600" : "bg-yellow-500 text-white border-yellow-500"
                      : "border-border text-muted-foreground")}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={checkForm.notes} onChange={e => setCheckForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional notes..." />
            </div>
            <div>
              <Label>Photo (optional)</Label>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="text-sm w-full" />
              {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
              {checkForm.photo_url && <img src={checkForm.photo_url} alt="preview" className="w-20 h-20 object-cover rounded mt-1" />}
            </div>
            <Button onClick={() => handleSaveCheck(false)} disabled={saving} className="w-full h-12 text-base">
              {saving ? "Saving..." : "Save Check"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAIL + CORRECTIVE ACTION DIALOG */}
      <Dialog open={showFailDialog} onOpenChange={setShowFailDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Reading Out of Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-700">
              One or more readings are outside the safe range. Enter the corrective action taken before saving.
            </div>
            <div>
              <Label>Corrective Action *</Label>
              <Textarea value={checkForm.corrective_action} onChange={e => setCheckForm(f => ({ ...f, corrective_action: e.target.value }))}
                placeholder="e.g. Adjusted heat, refilled sanitizer, called maintenance..." className="min-h-[80px]" />
            </div>
            <Button onClick={() => handleSaveCheck(true)} disabled={saving || !checkForm.corrective_action.trim()} className="w-full bg-red-600 hover:bg-red-700 h-12">
              {saving ? "Logging..." : "Log Failed Check"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MACHINE SETUP DIALOG */}
      <Dialog open={showMachineForm} onOpenChange={setShowMachineForm}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMachine ? "Edit" : "Add"} Machine</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Machine Name *</Label><Input value={machineForm.name} onChange={e => setMachineForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Front Dishwasher" /></div>
            <div><Label>Location</Label><Input value={machineForm.location} onChange={e => setMachineForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Back dish pit" /></div>
            <div><Label>Check Frequency (hours)</Label><Input type="number" value={machineForm.check_frequency_hours} onChange={e => setMachineForm(f => ({ ...f, check_frequency_hours: parseFloat(e.target.value) }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Min Wash Temp</Label><Input type="number" value={machineForm.min_wash_temp} onChange={e => setMachineForm(f => ({ ...f, min_wash_temp: parseFloat(e.target.value) }))} /></div>
              <div><Label>Max Wash Temp</Label><Input type="number" value={machineForm.max_wash_temp} onChange={e => setMachineForm(f => ({ ...f, max_wash_temp: parseFloat(e.target.value) }))} /></div>
              <div><Label>Min Rinse Temp</Label><Input type="number" value={machineForm.min_rinse_temp} onChange={e => setMachineForm(f => ({ ...f, min_rinse_temp: parseFloat(e.target.value) }))} /></div>
              <div><Label>Max Rinse Temp</Label><Input type="number" value={machineForm.max_rinse_temp} onChange={e => setMachineForm(f => ({ ...f, max_rinse_temp: parseFloat(e.target.value) }))} /></div>
              <div><Label>Min Sanitizer PPM</Label><Input type="number" value={machineForm.min_sanitizer_ppm} onChange={e => setMachineForm(f => ({ ...f, min_sanitizer_ppm: parseFloat(e.target.value) }))} /></div>
              <div><Label>Max Sanitizer PPM</Label><Input type="number" value={machineForm.max_sanitizer_ppm} onChange={e => setMachineForm(f => ({ ...f, max_sanitizer_ppm: parseFloat(e.target.value) }))} /></div>
            </div>
            <div>
              <Label>Sanitizer Type</Label>
              <Select value={machineForm.sanitizer_type} onValueChange={v => setMachineForm(f => ({ ...f, sanitizer_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chlorine">Chlorine</SelectItem>
                  <SelectItem value="quat">Quaternary Ammonium</SelectItem>
                  <SelectItem value="iodine">Iodine</SelectItem>
                  <SelectItem value="none">None / Heat Sanitize</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={machineForm.notes} onChange={e => setMachineForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={saveMachine} disabled={saving} className="w-full h-12">{saving ? "Saving..." : (editingMachine ? "Update Machine" : "Add Machine")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;

function SummaryTile({ label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-center">
      <p className={cn("text-xl font-bold", color)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function ReadingRow({ log, machine, compact }) {
  const m = machine || {};
  const wBad = log.wash_temp < (m.min_wash_temp ?? 140) || log.wash_temp > (m.max_wash_temp ?? 180);
  const rBad = log.rinse_temp < (m.min_rinse_temp ?? 140) || log.rinse_temp > (m.max_rinse_temp ?? 180);
  const sBad = log.sanitizer_ppm < (m.min_sanitizer_ppm ?? 50) || log.sanitizer_ppm > (m.max_sanitizer_ppm ?? 400);
  return (
    <div className={cn("flex gap-3 text-xs", compact ? "" : "mt-1")}>
      <span className={wBad ? "text-red-500 font-bold" : "text-green-500"}>Wash: {log.wash_temp}°F</span>
      <span className={rBad ? "text-red-500 font-bold" : "text-green-500"}>Rinse: {log.rinse_temp}°F</span>
      <span className={sBad ? "text-red-500 font-bold" : "text-green-500"}>PPM: {log.sanitizer_ppm}</span>
    </div>
  );
}

function MachineCard({ machine, todayLogs, onCheck }) {
  const logs = todayLogs.filter(l => l.machine_id === machine.id).sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const lastLog = logs[0];
  const status = (() => {
    if (!lastLog) return "due";
    const failed = lastLog.status === "fail" && !lastLog.corrective_action_resolved;
    if (failed) return "failed";
    if (lastLog.status === "fail") return "failed";
    const hoursSince = (Date.now() - new Date(lastLog.logged_at).getTime()) / 3600000;
    if (hoursSince > (machine.check_frequency_hours || 4)) return "overdue";
    return "passed";
  })();
  const cfg = STATUS_CONFIG[status];

  return (
    <div className={cn("bg-card border-2 rounded-xl p-4 space-y-3", cfg.border, cfg.bg)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold">{machine.name}</p>
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", cfg.color, cfg.border)}>{cfg.label}</span>
          </div>
          {machine.location && <p className="text-xs text-muted-foreground">{machine.location}</p>}
        </div>
        {status === "passed" ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> :
          status === "failed" ? <XCircle className="h-5 w-5 text-red-500 shrink-0" /> :
          <Clock className="h-5 w-5 text-yellow-500 shrink-0" />}
      </div>

      {lastLog && (
        <div className="space-y-1">
          <ReadingRow log={lastLog} machine={machine} />
          <p className="text-xs text-muted-foreground">
            {format(new Date(lastLog.logged_at), "h:mm a")} · {lastLog.checked_by}
          </p>
          {lastLog.corrective_action && (
            <p className="text-xs text-red-600 font-medium">Action: {lastLog.corrective_action}</p>
          )}
        </div>
      )}

      <Button onClick={() => onCheck(machine)} className={cn("w-full h-11 gap-1.5", status === "failed" ? "bg-red-600 hover:bg-red-700" : "")} variant={status === "passed" ? "outline" : "default"}>
        {status === "failed" ? <><RefreshCw className="h-4 w-4" /> Recheck</> : <><Plus className="h-4 w-4" /> Log Check</>}
      </Button>
    </div>
  );
}