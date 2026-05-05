import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { CheckCircle2, AlertTriangle, Plus, Moon, Flag, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import BottomSheet from "../components/BottomSheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const hideBase44Index = true;

const todayStr = new Date().toISOString().split("T")[0];
const AREAS = ["Kitchen", "FOH", "Bar", "Management", "General"];

function ChecklistRow({ item, onComplete, onFlag, onDelete, isAdmin, userName }) {
  const isDone = item.status === "completed";
  const isMissed = item.status === "missed";
  const isFlagged = item.flagged_for_handoff;

  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3 py-2.5 border-b border-[#1A2235] last:border-0",
      isMissed && "bg-red-500/4",
      isFlagged && !isDone && "bg-amber-500/4"
    )}>
      <div className={cn("h-3.5 w-3.5 rounded-full border shrink-0",
        isDone ? "bg-emerald-500 border-emerald-500" : isMissed ? "bg-red-500 border-red-500" : "border-gray-600")} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={cn("text-[12px] font-semibold leading-tight", isDone ? "line-through text-gray-600" : "text-white")}>
            {item.task_name}
          </p>
          {item.is_critical && !isDone && (
            <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded">CRITICAL</span>
          )}
          {isFlagged && (
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded flex items-center gap-0.5">
              <Flag className="h-2 w-2" /> Handoff
            </span>
          )}
        </div>
        {item.assigned_to_name && (
          <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
            <User className="h-2.5 w-2.5" />{item.assigned_to_name}
          </p>
        )}
        {isDone && item.completed_by && (
          <p className="text-[10px] text-emerald-600 mt-0.5">✓ {item.completed_by}{item.completed_at ? ` · ${format(new Date(item.completed_at), "h:mm a")}` : ""}</p>
        )}
      </div>

      {!isDone && (
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onComplete(item)}
            className="h-6 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 active:scale-95 transition-transform">
            ✓ Done
          </button>
          <button onClick={() => onFlag(item)}
            title="Flag for handoff"
            className={cn("h-6 w-6 flex items-center justify-center rounded-lg border active:scale-95 transition-transform",
              isFlagged ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-[#1A2235] border-[#1F2937] text-gray-600")}>
            <Flag className="h-3 w-3" />
          </button>
        </div>
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

const EMPTY_FORM = { task_name: "", area: "Kitchen", assigned_to_name: "", is_critical: false, is_template: true, notes: "", sort_order: 0 };

export default function ClosingChecklist() {
  const { user, isAdmin } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [manager, setManager] = useState("");
  const [shiftClosed, setShiftClosed] = useState(false);

  const load = async () => {
    const [todayItems, tmpl] = await Promise.all([
      base44.entities.ClosingChecklist.filter({ date: todayStr }),
      base44.entities.ClosingChecklist.filter({ is_template: true }),
    ]);
    setItems(todayItems.filter(i => !i.is_template));
    setTemplates(tmpl);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const completedCount = items.filter(i => i.status === "completed").length;
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const flaggedCount = items.filter(i => i.flagged_for_handoff && i.status !== "completed").length;
  const pendingCount = items.filter(i => i.status === "pending").length;

  // Group by area, sort critical first
  const byArea = useMemo(() => {
    const groups = {};
    items.forEach(i => {
      const key = i.area || "General";
      if (!groups[key]) groups[key] = [];
      groups[key].push(i);
    });
    Object.values(groups).forEach(arr => arr.sort((a, b) => (b.is_critical ? 1 : 0) - (a.is_critical ? 1 : 0)));
    // Sort areas in preferred order
    const order = ["Kitchen", "FOH", "Bar", "Management", "General"];
    return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => order.indexOf(a) - order.indexOf(b)));
  }, [items]);

  const startClosing = async () => {
    if (items.length > 0) { toast.info("Closing checklist already started"); return; }
    if (templates.length === 0) { toast.error("No templates. Add tasks first."); return; }
    setClosing(true);
    const created = await base44.entities.ClosingChecklist.bulkCreate(
      templates.map(t => ({
        task_name: t.task_name, area: t.area, assigned_to_name: t.assigned_to_name || "",
        is_critical: t.is_critical, is_template: false,
        notes: t.notes, sort_order: t.sort_order || 0,
        date: todayStr, status: "pending",
        manager_name: manager,
      }))
    );
    setItems(created);
    setClosing(false);
    toast.success("Closing checklist started ✓");
  };

  const closeShift = async () => {
    // Mark remaining pending items as missed
    const remaining = items.filter(i => i.status === "pending" || i.status === "in_progress");
    if (remaining.length > 0) {
      await Promise.all(remaining.map(i =>
        base44.entities.ClosingChecklist.update(i.id, { status: "missed", flagged_for_handoff: true })
      ));
      setItems(prev => prev.map(i => remaining.find(r => r.id === i.id)
        ? { ...i, status: "missed", flagged_for_handoff: true } : i));
      toast.warning(`${remaining.length} item${remaining.length > 1 ? "s" : ""} flagged for handoff`);
    } else {
      toast.success("Shift closed — all tasks complete! 🎉");
    }
    setShiftClosed(true);
  };

  const handleComplete = async (item) => {
    const patch = { status: "completed", completed_at: new Date().toISOString(), completed_by: user?.full_name || user?.email || "Staff" };
    await base44.entities.ClosingChecklist.update(item.id, patch);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...patch } : i));
  };

  const handleFlag = async (item) => {
    const flagged = !item.flagged_for_handoff;
    await base44.entities.ClosingChecklist.update(item.id, { flagged_for_handoff: flagged });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, flagged_for_handoff: flagged } : i));
    toast(flagged ? "Flagged for handoff" : "Handoff flag removed");
  };

  const handleDelete = async (id) => {
    await base44.entities.ClosingChecklist.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleAdd = async () => {
    if (!form.task_name.trim()) return;
    setSaving(true);
    const created = await base44.entities.ClosingChecklist.create({ ...form, date: todayStr });
    if (form.is_template) setTemplates(prev => [...prev, created]);
    else setItems(prev => [...prev, { ...created, status: "pending" }]);
    setSheetOpen(false);
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
            <Moon className="h-4 w-4 text-indigo-400" />
            <h1 className="text-[17px] font-extrabold text-white tracking-tight">Closing</h1>
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">{format(new Date(), "EEEE, MMM d")}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setSheetOpen(true)}
            className="h-8 px-3 rounded-xl bg-[#F5A623] text-black text-[11px] font-bold flex items-center gap-1.5 active:scale-95 transition-transform">
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </div>

      {/* Status card */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3.5 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Completion</span>
              <span className={cn("text-[18px] font-extrabold", pct === 100 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400")}>{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#1A2235] rounded-full overflow-hidden mb-1">
              <div className={cn("h-full rounded-full transition-all duration-700", pct === 100 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-gray-600">{completedCount}/{items.length} done · {pendingCount} pending · {flaggedCount} flagged</p>
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
      </div>

      {/* Flagged alert */}
      {flaggedCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-500/6 border border-amber-500/20 rounded-xl px-3 py-2">
          <Flag className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <p className="text-[11px] text-amber-300 font-semibold">{flaggedCount} item{flaggedCount > 1 ? "s" : ""} flagged for handoff</p>
        </div>
      )}

      {/* Checklist */}
      {items.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center">
          <Moon className="h-8 w-8 text-indigo-400/30 mx-auto mb-2" />
          <p className="text-[13px] font-bold text-gray-500">Closing not started</p>
          <p className="text-[11px] text-gray-700 mt-0.5">
            {templates.length > 0 ? `${templates.length} template tasks ready` : "Add tasks using the + button first"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {Object.entries(byArea).map(([area, areaItems]) => {
            const areaDone = areaItems.filter(i => i.status === "completed").length;
            const areaPct = Math.round((areaDone / areaItems.length) * 100);
            const hasMissed = areaItems.some(i => i.status === "missed");
            const hasFlagged = areaItems.some(i => i.flagged_for_handoff && i.status !== "completed");
            return (
              <div key={area} className={cn("bg-[#111827] border rounded-xl overflow-hidden",
                hasMissed ? "border-red-500/25" : hasFlagged ? "border-amber-500/25" : "border-[#1F2937]")}>
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1A2235]">
                  <p className="text-[12px] font-bold text-white flex-1">{area}</p>
                  <div className="h-1 w-12 bg-[#1A2235] rounded-full overflow-hidden">
                    <div className={cn("h-1 rounded-full", areaPct === 100 ? "bg-emerald-500" : hasMissed ? "bg-red-500" : "bg-[#F5A623]")} style={{ width: `${areaPct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-600">{areaDone}/{areaItems.length}</span>
                </div>
                {areaItems.map(item => (
                  <ChecklistRow key={item.id} item={item} onComplete={handleComplete} onFlag={handleFlag} onDelete={handleDelete} isAdmin={isAdmin} userName={user?.full_name} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Close Shift button */}
      {items.length > 0 && !shiftClosed && (
        <button onClick={closeShift}
          className="flex items-center justify-center gap-2 w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[14px] active:scale-95 transition-transform mt-1">
          <Moon className="h-4 w-4" /> Close Shift
        </button>
      )}

      {items.length === 0 && (
        <button onClick={startClosing} disabled={closing || templates.length === 0}
          className="flex items-center justify-center gap-2 w-full h-12 bg-indigo-600 text-white font-bold rounded-xl text-[14px] active:scale-95 transition-transform disabled:opacity-40 mt-1">
          <Moon className="h-4 w-4" />
          {closing ? "Starting..." : "Start Closing"}
        </button>
      )}

      {shiftClosed && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 text-center">
          <p className="text-[14px] font-bold text-emerald-400">Shift Closed ✓</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{completedCount} completed · {flaggedCount} flagged for next shift</p>
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add Closing Task">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Task Name *</label>
              <input value={form.task_name} onChange={e => setForm(p => ({ ...p, task_name: e.target.value }))}
                placeholder="e.g. Wrap and label all proteins"
                className="mt-1 w-full h-11 px-3 text-[14px] border border-[#1F2937] rounded-xl bg-[#111827] text-white focus:outline-none placeholder:text-gray-700" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Area</label>
                <Select value={form.area} onValueChange={v => setForm(p => ({ ...p, area: v }))}>
                  <SelectTrigger className="h-10 mt-1 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Assigned To</label>
                <input value={form.assigned_to_name} onChange={e => setForm(p => ({ ...p, assigned_to_name: e.target.value }))}
                  placeholder="Name"
                  className="mt-1 w-full h-10 px-2 text-[13px] border border-[#1F2937] rounded-xl bg-[#111827] text-white focus:outline-none placeholder:text-gray-700" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm(p => ({ ...p, is_critical: !p.is_critical }))}
                  className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", form.is_critical ? "bg-red-500" : "bg-[#1F2937]")}>
                  <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", form.is_critical ? "translate-x-[22px]" : "translate-x-1")} />
                </button>
                <label className="text-[14px] text-white font-semibold">Mark as critical</label>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm(p => ({ ...p, is_template: !p.is_template }))}
                  className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", form.is_template ? "bg-[#F5A623]" : "bg-[#1F2937]")}>
                  <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", form.is_template ? "translate-x-[22px]" : "translate-x-1")} />
                </button>
                <label className="text-[14px] text-white font-semibold">Save as template</label>
              </div>
            </div>
            <button onClick={handleAdd} disabled={saving || !form.task_name.trim()}
              className="w-full h-12 bg-indigo-600 text-white font-bold rounded-xl text-[14px] disabled:opacity-50 active:scale-95 transition-transform">
              {saving ? "Saving..." : "Add Task"}
            </button>
          </div>
      </BottomSheet>
    </div>
  );
}