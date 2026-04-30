import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Default thresholds for dish machine checks
const THRESHOLDS = {
  wash_temp: { min: 140, max: 180, label: "Wash Temp (°F)" },
  rinse_temp: { min: 140, max: 180, label: "Rinse Temp (°F)" },
  sanitizer_ppm: { min: 50, max: 400, label: "Sanitizer (PPM)" },
};

const getCheckStatus = (value, type) => {
  const threshold = THRESHOLDS[type];
  if (value < threshold.min || value > threshold.max) return "fail";
  return "pass";
};

export default function DishMachines() {
  const [machines, setMachines] = useState([]);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [showFailDialog, setShowFailDialog] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const [machineForm, setMachineForm] = useState({ name: "", location: "" });
  const [checkForm, setCheckForm] = useState({
    wash_temp: "",
    rinse_temp: "",
    sanitizer_ppm: "",
    corrective_action: "",
  });

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const [mData, cData] = await Promise.all([
          base44.entities.DishMachineEquipment.list(),
          base44.entities.TempLogEntry.filter({ date: todayStr }),
        ]);
        setMachines(mData.filter(m => m.is_active !== false));
        setChecks(cData);
        setLoading(false);
      } catch (err) {
        console.error("Load error:", err);
        setLoading(false);
      }
    };
    init();
  }, []);

  const todayChecks = checks.filter(c => c.date === todayStr && c.machine_id);
  const pending = machines.filter(m => !todayChecks.find(c => c.machine_id === m.id));

  const handleAddMachine = async () => {
    if (!machineForm.name.trim()) {
      toast.error("Enter machine name");
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.DishMachineEquipment.create({
        ...machineForm,
        is_active: true,
      });
      setMachines(prev => [...prev, created]);
      setMachineForm({ name: "", location: "" });
      setShowAddMachine(false);
      toast.success("Machine added");
    } catch (err) {
      toast.error("Failed to add machine");
    }
    setSaving(false);
  };

  const handleOpenCheck = (machine) => {
    setSelectedMachine(machine);
    setCheckForm({ wash_temp: "", rinse_temp: "", sanitizer_ppm: "", corrective_action: "" });
    setShowCheckForm(true);
  };

  const handleSaveCheck = async () => {
    const { wash_temp, rinse_temp, sanitizer_ppm } = checkForm;

    if (!wash_temp || !rinse_temp || !sanitizer_ppm) {
      toast.error("Enter all temperature and sanitizer readings");
      return;
    }

    const washStatus = getCheckStatus(parseFloat(wash_temp), "wash_temp");
    const rinseStatus = getCheckStatus(parseFloat(rinse_temp), "rinse_temp");
    const sanitizerStatus = getCheckStatus(parseFloat(sanitizer_ppm), "sanitizer_ppm");
    const overallStatus = washStatus === "fail" || rinseStatus === "fail" || sanitizerStatus === "fail" ? "fail" : "pass";

    if (overallStatus === "fail" && !checkForm.corrective_action.trim()) {
      setShowFailDialog(true);
      return;
    }

    setSaving(true);
    try {
      const entry = await base44.entities.TempLogEntry.create({
        machine_id: selectedMachine.id,
        machine_name: selectedMachine.name,
        machine_location: selectedMachine.location,
        wash_temp: parseFloat(wash_temp),
        rinse_temp: parseFloat(rinse_temp),
        sanitizer_ppm: parseFloat(sanitizer_ppm),
        status: overallStatus === "pass",
        date: todayStr,
        logged_at: new Date().toISOString(),
        checked_by: user?.full_name || user?.email,
        corrective_action: overallStatus === "fail" ? checkForm.corrective_action : null,
      });

      setChecks(prev => [...prev, entry]);
      setShowCheckForm(false);
      setShowFailDialog(null);
      setCheckForm({ wash_temp: "", rinse_temp: "", sanitizer_ppm: "", corrective_action: "" });

      if (overallStatus === "pass") {
        toast.success("✓ Check passed");
      } else {
        toast.error("✗ Check failed — manager notified");
      }
    } catch (err) {
      toast.error("Failed to save check");
    }
    setSaving(false);
  };

  const handleDeleteMachine = async (id) => {
    try {
      await base44.entities.DishMachineEquipment.delete(id);
      setMachines(prev => prev.filter(m => m.id !== id));
      toast.success("Machine removed");
    } catch (err) {
      toast.error("Failed to delete machine");
    }
  };

  const getLastSuccessfulCheck = (machineId) => {
    return todayChecks
      .filter(c => c.machine_id === machineId && c.status === true)
      .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Dish Machine Checks</h1>
          <p className="text-muted-foreground mt-1">
            {todayStr} • {pending.length} pending, {todayChecks.length} logged
          </p>
        </div>
        <Button onClick={() => setShowAddMachine(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Machine
        </Button>
      </div>

      {/* Required checks (pending) */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Required Today ({pending.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pending.map(machine => (
              <div key={machine.id} className="bg-card border-2 border-red-500/30 rounded-xl p-4 space-y-3">
                <div>
                  <h3 className="font-bold">{machine.name}</h3>
                  {machine.location && <p className="text-xs text-muted-foreground">{machine.location}</p>}
                </div>
                <Button className="w-full" onClick={() => handleOpenCheck(machine)}>
                  <Plus className="h-4 w-4 mr-2" /> Log Check
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed checks */}
      {todayChecks.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold">Checks Today ({todayChecks.length})</h2>
          <div className="space-y-2">
            {todayChecks.map(check => {
              const statusPass = check.status === true;
              return (
                <div key={check.id} className={cn("rounded-lg p-4 border-l-4", statusPass ? "bg-green-500/5 border-green-500" : "bg-red-500/5 border-red-500")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {statusPass ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                        <h3 className="font-bold">{check.machine_name}</h3>
                      </div>
                      <div className="text-xs space-y-1 mt-2">
                        <p>Wash: <span className={cn("font-bold", check.wash_temp < THRESHOLDS.wash_temp.min || check.wash_temp > THRESHOLDS.wash_temp.max ? "text-red-600" : "text-green-600")}>{check.wash_temp}°F</span></p>
                        <p>Rinse: <span className={cn("font-bold", check.rinse_temp < THRESHOLDS.rinse_temp.min || check.rinse_temp > THRESHOLDS.rinse_temp.max ? "text-red-600" : "text-green-600")}>{check.rinse_temp}°F</span></p>
                        <p>Sanitizer: <span className={cn("font-bold", check.sanitizer_ppm < THRESHOLDS.sanitizer_ppm.min || check.sanitizer_ppm > THRESHOLDS.sanitizer_ppm.max ? "text-red-600" : "text-green-600")}>{check.sanitizer_ppm} PPM</span></p>
                        <p className="text-muted-foreground">{new Date(check.logged_at).toLocaleTimeString()} • {check.checked_by}</p>
                        {check.corrective_action && <p className="text-red-700 font-semibold">Action: {check.corrective_action}</p>}
                      </div>
                    </div>
                    {!statusPass && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCheck(machines.find(m => m.id === check.machine_id))}
                        className="flex-shrink-0"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" /> Recheck
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Machines list */}
      {machines.length > 0 && (
        <details className="border border-border rounded-lg overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 bg-secondary/50 hover:bg-secondary cursor-pointer font-semibold">
            <span>All Machines ({machines.length})</span>
            <span className="text-xs">▼</span>
          </summary>
          <div className="divide-y divide-border">
            {machines.map(machine => {
              const lastSuccess = getLastSuccessfulCheck(machine.id);
              return (
                <div key={machine.id} className="p-4 flex items-center justify-between bg-card/50">
                  <div className="flex-1">
                    <p className="font-semibold">{machine.name}</p>
                    {machine.location && <p className="text-xs text-muted-foreground">{machine.location}</p>}
                    {lastSuccess && (
                      <p className="text-xs text-green-600 mt-1">
                        Last pass: {new Date(lastSuccess.logged_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteMachine(machine.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Check Form Dialog */}
      <Dialog open={showCheckForm} onOpenChange={setShowCheckForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Machine Check: {selectedMachine?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-bold block mb-1">Wash Temperature (°F) *</label>
              <p className="text-xs text-muted-foreground mb-2">Safe range: 140–180°F</p>
              <Input
                type="number"
                value={checkForm.wash_temp}
                onChange={(e) => setCheckForm(prev => ({ ...prev, wash_temp: e.target.value }))}
                placeholder="e.g., 160"
                className="h-10"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Rinse Temperature (°F) *</label>
              <p className="text-xs text-muted-foreground mb-2">Safe range: 140–180°F</p>
              <Input
                type="number"
                value={checkForm.rinse_temp}
                onChange={(e) => setCheckForm(prev => ({ ...prev, rinse_temp: e.target.value }))}
                placeholder="e.g., 160"
                className="h-10"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Sanitizer Level (PPM) *</label>
              <p className="text-xs text-muted-foreground mb-2">Safe range: 50–400 PPM</p>
              <Input
                type="number"
                value={checkForm.sanitizer_ppm}
                onChange={(e) => setCheckForm(prev => ({ ...prev, sanitizer_ppm: e.target.value }))}
                placeholder="e.g., 200"
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckForm(false)}>Cancel</Button>
            <Button onClick={handleSaveCheck} disabled={saving}>
              {saving ? "Logging..." : "Log Check"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Failed check dialog */}
      <Dialog open={!!showFailDialog} onOpenChange={() => setShowFailDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Reading Out of Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-700">One or more readings are outside safe ranges. Enter corrective action taken.</p>
            </div>

            <div>
              <label className="text-sm font-bold block mb-2">Corrective Action Taken *</label>
              <Textarea
                value={checkForm.corrective_action}
                onChange={(e) => setCheckForm(prev => ({ ...prev, corrective_action: e.target.value }))}
                placeholder="e.g., Adjusted heat, refilled sanitizer, called maintenance..."
                className="min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFailDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCheck} disabled={saving || !checkForm.corrective_action.trim()} className="bg-red-600 hover:bg-red-700">
              {saving ? "Logging..." : "Log & Alert Manager"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Machine Dialog */}
      <Dialog open={showAddMachine} onOpenChange={setShowAddMachine}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Dish Machine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-bold block mb-1">Machine Name *</label>
              <Input
                value={machineForm.name}
                onChange={(e) => setMachineForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Front Dishwasher"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Location (optional)</label>
              <Input
                value={machineForm.location}
                onChange={(e) => setMachineForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Back dish pit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMachine(false)}>Cancel</Button>
            <Button onClick={handleAddMachine} disabled={saving || !machineForm.name.trim()}>
              {saving ? "Adding..." : "Add Machine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;