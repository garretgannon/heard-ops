import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { CheckCircle2, AlertTriangle, Plus, Sun, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const hideBase44Index = true;

const todayStr = new Date().toISOString().split("T")[0];

const AREAS = ["FOH", "BOH", "Bar", "Kitchen", "Management", "General"];

function StatusPill({ status }) {
  const map = {
    not_started: { label: "Not Started", cls: "bg-gray-500/12 text-gray-500 border-gray-500/20" },
    in_progress:  { label: "In Progress",  cls: "bg-amber-500/12 text-amber-400 border-amber-500/20" },
    complete:     { label: "Complete",      cls: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20" },
  };
  const s = map[status];
  return <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", s.cls)}>{s.label}</span>;
}

function ChecklistRow({ item, onComplete, onDelete, isAdmin }) {
  const isDone = item.status === "completed";
  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3 py-2.5 border-b border-[#1A2235] last:border-0",
      item.is_critical && !isDone && "bg-red-500/4"
    )}>
      {item.is_critical && !isDone && (
        <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
      )}
      {(!item.is_critical || isDone) && (
        <div className={cn("h-3.5 w-3.5 rounded-full border shrink-0",
          isDone ? "bg-emerald-500 border-emerald-500" : "border-gray-600")} />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn("text-[12px] font-semibold leading-tight", isDone ? "line-through text-gray-600" : item.is_critical ? "text-red-200" : "text-white")}>
          {item.task_name}
          {item.is_critical && !isDone && <span className="ml-1.5 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded">CRITICAL</span>}
        </p>
        {item.assigned_to_name && (
          <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
            <User className="h-2.5 w-2.5" />{item.assigned_to_name}
            {item.area && <><span className="text-gray-700">·</span>{item.area}</>}
          </p>
        )}
        {isDone && item.completed_by && (
          <p className="text-[10px] text-emerald-600 mt-0.5">✓ {item.completed_by} · {item.completed_at ? format(new Date(item.completed_at), "h:mm a") : ""}</p>
        )}
      </div>
      {!isDone && (
        <button onClick={() => onComplete(item)}
          className="h-6 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 active:scale-95 transition-transform shrink-0">
          ✓ Done
        </button>
      )}
      {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
      {isAdmin && (
        <button onClick={() => onDelete(item.id)} className="h-5 w-5 flex items-center justify-center text-gray-700 hover:text-red-400 shrink-0">
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

const EMPTY_FORM = { task_name: "", area: "FOH", assigned_to_name: "", is_critical: false, is_template: true, notes: "", sort_order: 0 };

export default function OpeningChecklist() {
  const { user, isAdmin } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [manager, setManager] = useState("");

  const load = async () => {
    const [todayItems, tmpl] = await Promise.all([
      base44.entities.OpeningChecklist.filter({ date: todayStr }),
      base44.entities.OpeningChecklist.filter({ is_template: true }),
    ]);
    setItems(todayItems.filter(i => !i.is_template));
    setTemplates(tmpl);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Overall opening status
  const overallStatus = useMemo(() => {
    if (items.length === 0) return "not_started";
    const done = items.filter(i => i.status === "completed").length;
    if (done === 0) return "not_started";
    if (done === items.length) return "complete";
    return "in_progress";
  }, [items]);

  const completedCount = items.filter(i => i.status === "completed").length;
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const criticalPending = items.filter(i => i.is_critical && i.status !== "completed");

  // Group by area
  const byArea = useMemo(() => {
    const groups = {};
    items.forEach(i => {
      const key = i.area || "General";
      if (!groups[key]) groups[key] = [];
      groups[key].push(i);
    });
    // Sort: critical first within each area
    Object.values(groups).forEach(arr => arr.sort((a, b) => (b.is_critical ? 1 : 0) - (a.is_critical ? 1 : 0)));
    return groups;
  }, [items]);

  const handleStartOpening = async () => {
    if (items.length > 0) { toast.info("Opening already started"); return; }
    if (templates.length === 0) { toast.error("No checklist templates. Add tasks first."); return; }
    setStarting(true);
    const created = await base44.entities.OpeningChecklist.bulkCreate(
      templates.map(t => ({
        task_name: t.task_name, area: t.area, assigned_to_name: t.assigned_to_name || "",
        is_critical: t.is_critical, is_template: false,
        notes: t.notes, sort_order: t.sort_order || 0,
        date: todayStr, status: "pending",
      }))
    );
    setItems(created);
    setStarting(false);
    toast.success("Opening checklist started ✓");
  };

  const handleComplete = async (item) => {
    const patch = { status: "completed", completed_at: new Date().toISOString(), completed_by: user?.full_name || user?.email || "Staff" };
    await base44.entities.OpeningChecklist.update(item.id, patch);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...patch } : i));
    toast.success("Item checked off ✓");
  };

  const handleDelete = async (id) => {
    await base44.entities.OpeningChecklist.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleAdd = async () => {
    if (!form.task_name.trim()) return;
    setSaving(true);
    const created = await base44.entities.OpeningChecklist.create({ ...form, date: todayStr });
    if (form.is_template) setTemplates(prev => [...prev, created]);
    else setItems(prev => [...prev, { ...created, status: "pending" }]);
    setDialogOpen(false);
    setForm(EMPTY_FORM);
    setSaving(false);
    toast.success("Task added");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-2.5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-400" />
            <h1 className="text-[17px] font-extrabold text-white tracking-tight">Opening</h1>
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">{format(new Date(), "EEEE, MMM d")}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setDialogOpen(true)}
            className="h-8 px-3 rounded-xl bg-[#F5A623] text-black text-[11px] font-bold flex items-center gap-1.5 active:scale-95 transition-transform">
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </div>

      {/* Status card */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3.5 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Status</span>
            <StatusPill status={overallStatus} />
          </div>
          <div className="h-1.5 w-full bg-[#1A2235] rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-700",
              pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-[#1F2937]")}
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-gray-600 mt-0.5">{completedCount}/{items.length} complete · {pct}%</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">Manager</p>
          {isAdmin ? (
            <input value={manager} onChange={e => setManager(e.target.value)} placeholder="Your name"
              className="w-24 h-6 px-2 mt-0.5 text-[11px] border border-[#1F2937] rounded-lg bg-[#0B0F14] text-white focus:outline-none placeholder:text-gray-700 text-right" />
          ) : (
            <p className="text-[11px] font-bold text-white">{manager || "—"}</p>
          )}
        </div>
      </div>

      {/* Critical alert */}
      {criticalPending.length > 0 && (
        <div className="flex items-center gap-2 bg-red-500/6 border border-red-500/20 rounded-xl px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <p className="text-[11px] text-red-300 font-semibold">
            {criticalPending.length} critical item{criticalPending.length > 1 ? "s" : ""} not completed
          </p>
        </div>
      )}

      {/* Checklist */}
      {items.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center">
          <Sun className="h-8 w-8 text-yellow-400/30 mx-auto mb-2" />
          <p className="text-[13px] font-bold text-gray-500">Opening not started yet</p>
          <p className="text-[11px] text-gray-700 mt-0.5">
            {templates.length > 0 ? `${templates.length} template tasks ready` : "Add tasks using the + button first"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {Object.entries(byArea).map(([area, areaItems]) => {
            const areaDone = areaItems.filter(i => i.status === "completed").length;
            const areaPct = Math.round((areaDone / areaItems.length) * 100);
            const hasUrgent = areaItems.some(i => i.is_critical && i.status !== "completed");
            return (
              <div key={area} className={cn("bg-[#111827] border rounded-xl overflow-hidden", hasUrgent ? "border-red-500/25" : "border-[#1F2937]")}>
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1A2235]">
                  <p className="text-[12px] font-bold text-white flex-1">{area}</p>
                  <div className="h-1 w-12 bg-[#1A2235] rounded-full overflow-hidden">
                    <div className={cn("h-1 rounded-full", areaPct === 100 ? "bg-emerald-500" : hasUrgent ? "bg-red-500" : "bg-[#F5A623]")} style={{ width: `${areaPct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-600">{areaDone}/{areaItems.length}</span>
                </div>
                {areaItems.map(item => (
                  <ChecklistRow key={item.id} item={item} onComplete={handleComplete} onDelete={handleDelete} isAdmin={isAdmin} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom action */}
      {items.length === 0 && (
        <button onClick={handleStartOpening} disabled={starting || templates.length === 0}
          className="flex items-center justify-center gap-2 w-full h-12 bg-[#F5A623] text-black font-bold rounded-xl text-[14px] active:scale-95 transition-transform disabled:opacity-40">
          <Sun className="h-4 w-4" />
          {starting ? "Starting..." : "Start Opening"}
        </button>
      )}

      {/* Add Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-[15px]">Add Opening Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Task Name *</label>
              <input value={form.task_name} onChange={e => setForm(p => ({ ...p, task_name: e.target.value }))}
                placeholder="e.g. Check fridge temps"
                className="mt-1 w-full h-9 px-3 text-[13px] border border-[#1F2937] rounded-lg bg-[#111827] text-white focus:outline-none placeholder:text-gray-700" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Area</label>
                <Select value={form.area} onValueChange={v => setForm(p => ({ ...p, area: v }))}>
                  <SelectTrigger className="h-8 mt-1 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Assigned To</label>
                <input value={form.assigned_to_name} onChange={e => setForm(p => ({ ...p, assigned_to_name: e.target.value }))}
                  placeholder="Name"
                  className="mt-1 w-full h-8 px-2 text-[12px] border border-[#1F2937] rounded-lg bg-[#111827] text-white focus:outline-none placeholder:text-gray-700" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setForm(p => ({ ...p, is_critical: !p.is_critical }))}
                  className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", form.is_critical ? "bg-red-500" : "bg-[#1F2937]")}>
                  <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", form.is_critical ? "translate-x-[18px]" : "translate-x-1")} />
                </button>
                <label className="text-[12px] text-gray-400 font-semibold">Mark as critical</label>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setForm(p => ({ ...p, is_template: !p.is_template }))}
                  className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", form.is_template ? "bg-[#F5A623]" : "bg-[#1F2937]")}>
                  <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", form.is_template ? "translate-x-[18px]" : "translate-x-1")} />
                </button>
                <label className="text-[12px] text-gray-400 font-semibold">Save as reusable template</label>
              </div>
            </div>
            <button onClick={handleAdd} disabled={saving || !form.task_name.trim()}
              className="w-full h-10 bg-[#F5A623] text-black font-bold rounded-xl text-[13px] disabled:opacity-50 active:scale-95 transition-transform">
              {saving ? "Saving..." : "Add Task"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}