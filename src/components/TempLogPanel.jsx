import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Thermometer, Plus, Trash2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Safe zone: 41°F or below (cold) or 140°F or above (hot). Danger zone: 41–140°F
function getStatus(temp, unit) {
  const f = unit === "C" ? (temp * 9) / 5 + 32 : temp;
  if (f <= 41 || f >= 140) return "safe";
  if (f > 41 && f < 70) return "warning";
  return "danger";
}

const statusConfig = {
  safe: { label: "Safe", icon: CheckCircle2, classes: "bg-green-500/10 text-green-400 border-green-500/20" },
  warning: { label: "Warning", icon: AlertTriangle, classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  danger: { label: "Danger Zone", icon: XCircle, classes: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function TempLogPanel({ prepListId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ item_name: "", temperature: "", unit: "F", notes: "" });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    base44.entities.TemperatureLog.filter({ prep_list_id: prepListId }, "-logged_at", 100)
      .then(l => { setLogs(l); setLoading(false); });
  }, [prepListId]);

  const handleSave = async () => {
    if (!form.item_name.trim() || !form.temperature) return;
    setSaving(true);
    const user = await base44.auth.me();
    const temp = parseFloat(form.temperature);
    const status = getStatus(temp, form.unit);
    const payload = {
      prep_list_id: prepListId,
      item_name: form.item_name.trim(),
      temperature: temp,
      unit: form.unit,
      notes: form.notes,
      status,
      logged_by: user?.full_name || user?.email || "Staff",
      logged_at: new Date().toISOString(),
    };
    const created = await base44.entities.TemperatureLog.create(payload);
    setLogs(prev => [created, ...prev]);
    setForm({ item_name: "", temperature: "", unit: "F", notes: "" });
    setSaving(false);
    setOpen(false);
    if (status === "danger") toast.error("⚠️ Temperature in danger zone! Take corrective action.");
    else if (status === "warning") toast.warning("Temperature approaching danger zone.");
    else toast.success("Temperature logged safely.");
  };

  const handleDelete = async (id) => {
    await base44.entities.TemperatureLog.delete(id);
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Temperature Log</h3>
          <span className="text-xs text-muted-foreground">Food safety compliance</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(o => !o)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Log Temp
        </Button>
      </div>

      {/* Inline form */}
      {open && (
        <div className="bg-secondary/30 rounded-xl border border-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Food Item</Label>
              <Input placeholder="e.g., Chicken breast, Soup" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Temperature</Label>
              <Input type="number" placeholder="e.g., 38" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">°F</SelectItem>
                  <SelectItem value="C">°C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Notes (optional)</Label>
              <Input placeholder="e.g., After 2hr cooling" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          {form.temperature && (
            <p className="text-xs text-muted-foreground">
              Safe zones: ≤41°F / ≤5°C (cold) or ≥140°F / ≥60°C (hot). Danger zone: 41–140°F.
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.item_name.trim() || !form.temperature}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}

      {/* Log list */}
      {loading ? (
        <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-3">No temperatures logged yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const cfg = statusConfig[log.status] || statusConfig.safe;
            const StatusIcon = cfg.icon;
            return (
              <div key={log.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-secondary/20">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border", cfg.classes)}>
                  <StatusIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{log.item_name}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-semibold", cfg.classes)}>
                      {log.temperature}°{log.unit} — {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    {log.logged_by && <span>{log.logged_by}</span>}
                    {log.logged_at && <span>· {new Date(log.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                    {log.notes && <span>· {log.notes}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => handleDelete(log.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}