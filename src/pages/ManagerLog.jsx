import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, AlertTriangle, Clock, CheckCircle2, MessageSquare, Zap, Users, Wrench, AlertCircle, X, Check, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "shift_note", label: "Shift Notes" },
  { value: "incident", label: "Incidents" },
  { value: "guest_issue", label: "Guest Issues" },
  { value: "team_note", label: "Team Notes" },
  { value: "maintenance", label: "Maintenance" },
  { value: "follow_up", label: "Follow-Ups" },
];

const CAT_ICONS = {
  shift_note: MessageSquare,
  incident: AlertTriangle,
  guest_issue: Users,
  team_note: Users,
  maintenance: Wrench,
  waste: AlertCircle,
  prep_issue: Clock,
};

const CAT_STYLES = {
  shift_note:  { label: "Shift Note",   text: "text-blue-400",   bg: "bg-blue-500/10",       border: "border-blue-500/20" },
  incident:    { label: "Incident",     text: "text-red-400",    bg: "bg-red-500/10",        border: "border-red-500/20" },
  guest_issue: { label: "Guest Issue",  text: "text-purple-400", bg: "bg-purple-500/10",     border: "border-purple-500/20" },
  team_note:   { label: "Team Note",    text: "text-pink-400",   bg: "bg-pink-500/10",       border: "border-pink-500/20" },
  maintenance: { label: "Maintenance",  text: "text-amber-400",  bg: "bg-amber-500/10",      border: "border-amber-500/20" },
  waste:       { label: "86 / Waste",   text: "text-orange-400", bg: "bg-orange-500/10",     border: "border-orange-500/20" },
  prep_issue:  { label: "Prep Issue",   text: "text-emerald-400",bg: "bg-emerald-500/10",    border: "border-emerald-500/20" },
};

const PRI_STYLES = {
  low:      { label: "Low",      text: "text-gray-400",   bg: "bg-gray-500/10" },
  medium:   { label: "Medium",   text: "text-amber-400",  bg: "bg-amber-500/10" },
  high:     { label: "High",     text: "text-orange-400", bg: "bg-orange-500/10" },
  critical: { label: "Critical", text: "text-red-400",    bg: "bg-red-500/10" },
};

function EntryForm({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    category: "shift_note",
    shift: "evening",
    notes: "",
    priority: "medium",
    assigned_to: "",
    assigned_to_name: "",
    due_date: new Date().toISOString().split("T")[0],
    due_time: "",
    send_to_handoff: false,
    create_issue: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    const me = await base44.auth.me().catch(() => null);
    const entry = await base44.entities.ManagerLog.create({
      ...form,
      logged_by: me?.email,
      logged_by_name: me?.full_name,
      status: form.assigned_to ? "follow_up" : "open",
      has_follow_up: !!form.assigned_to,
    });

    if (form.send_to_handoff) {
      await base44.entities.ShiftHandoff.create({
        date: form.due_date,
        shift: form.shift,
        department: "All",
        notes_for_next_manager: form.title,
        urgency: form.priority,
        logged_by: me?.full_name,
      }).catch(() => {});
    }

    if (form.create_issue) {
      await base44.entities.Issue.create({
        title: form.title,
        description: form.notes,
        category: form.category === "maintenance" ? "equipment" : "other",
        status: "open",
        logged_by: me?.email,
      }).catch(() => {});
    }

    setSaving(false);
    setForm({
      title: "",
      category: "shift_note",
      shift: "evening",
      notes: "",
      priority: "medium",
      assigned_to: "",
      assigned_to_name: "",
      due_date: new Date().toISOString().split("T")[0],
      due_time: "",
      send_to_handoff: false,
      create_issue: false,
    });
    onSaved(entry);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#0B1018] border-t border-[#1E2A3B] rounded-t-2xl z-10 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2235] shrink-0">
          <p className="text-[15px] font-bold text-white">New Log Entry</p>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="overflow-y-auto px-4 py-3 space-y-3 pb-6">
          <div>
            <label className="block text-[11px] text-gray-500 font-semibold mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Guest complaint about wait time"
              className="w-full h-9 px-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-700" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-9 px-3 text-[12px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary">
                {Object.entries(CAT_STYLES).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">Shift</label>
              <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}
                className="w-full h-9 px-3 text-[12px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary">
                {["morning", "afternoon", "evening", "night"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 font-semibold mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Details about this log entry..."
              rows={2}
              className="w-full px-3 py-2 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-gray-700" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full h-9 px-3 text-[12px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary">
                {Object.entries(PRI_STYLES).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">Assign To</label>
              <input value={form.assigned_to_name} onChange={e => setForm(f => ({ ...f, assigned_to_name: e.target.value }))}
                placeholder="Name or email"
                className="w-full h-9 px-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-700" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full h-9 px-3 text-[12px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">Due Time</label>
              <input type="time" value={form.due_time} onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))}
                className="w-full h-9 px-3 text-[12px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input type="checkbox" checked={form.send_to_handoff} onChange={e => setForm(f => ({ ...f, send_to_handoff: e.target.checked }))}
              className="w-4 h-4 rounded border-[#1E2A3B]" id="handoff" />
            <label htmlFor="handoff" className="text-[12px] text-gray-400 cursor-pointer">Send to Shift Handoff</label>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input type="checkbox" checked={form.create_issue} onChange={e => setForm(f => ({ ...f, create_issue: e.target.checked }))}
              className="w-4 h-4 rounded border-[#1E2A3B]" id="issue" />
            <label htmlFor="issue" className="text-[12px] text-gray-400 cursor-pointer">Create Issue Ticket</label>
          </div>
        </div>

        <div className="px-4 pb-6 pt-2 border-t border-[#1A2235] shrink-0">
          <button onClick={handleSave} disabled={saving || !form.title.trim()}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[14px] font-bold disabled:opacity-50 active:scale-[0.98] transition-transform">
            {saving ? "Saving…" : "Log Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EntryCard({ entry, onResolve }) {
  const catMeta = CAT_STYLES[entry.category] || CAT_STYLES.shift_note;
  const priMeta = PRI_STYLES[entry.priority] || PRI_STYLES.medium;
  const Icon = CAT_ICONS[entry.category] || MessageSquare;
  const time = entry.created_date ? new Date(entry.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="bg-[#0F1623] border border-[#1E2A3B] rounded-lg px-3 py-1.5 flex items-center gap-2 min-h-[44px]">
      <div className={cn("h-6 w-6 rounded flex items-center justify-center shrink-0", catMeta.bg)}>
        <Icon className={cn("h-3 w-3", catMeta.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[12px] font-bold text-white truncate">{entry.title}</p>
          {entry.notes && <p className="text-[11px] text-gray-500 truncate">· {entry.notes}</p>}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={cn("text-[8px] font-bold px-1 py-0.5 rounded border", catMeta.bg, catMeta.border, catMeta.text)}>
            {catMeta.label}
          </span>
          {entry.logged_by_name && <span className="text-[9px] text-gray-600">{entry.logged_by_name}</span>}
          {time && <span className="text-[9px] text-gray-700">·</span>}
          {time && <span className="text-[9px] text-gray-600">{time}</span>}
          <span className={cn("ml-auto text-[8px] font-bold px-1 py-0.5 rounded border", priMeta.bg, priMeta.text)}>
            {priMeta.label}
          </span>
        </div>
      </div>
      {entry.status === "open" && (
        <button onClick={() => onResolve(entry.id)}
          className="h-6 px-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded active:scale-95 transition-transform shrink-0">
          ✓
        </button>
      )}
      {entry.status === "follow_up" && (
        <span className="h-6 px-2 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded flex items-center shrink-0">
          ⚡
        </span>
      )}
    </div>
  );
}

export default function ManagerLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const data = await base44.entities.ManagerLog.list("-created_date", 100);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSaved = (entry) => {
    setEntries(prev => [entry, ...prev]);
    setShowForm(false);
    toast.success("Entry logged");
  };

  const handleResolve = async (id) => {
    await base44.entities.ManagerLog.update(id, { status: "resolved", resolved_at: new Date().toISOString() });
    load();
    toast.success("Marked resolved");
  };

  const openFollowups = entries.filter(e => e.status === "follow_up");
  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntries = entries.filter(e => e.created_date?.startsWith(todayStr));
  const openCount = entries.filter(e => e.status === "open" || e.status === "follow_up").length;
  const incidentCount = entries.filter(e => e.category === "incident").length;

  let filtered = filter === "all" ? entries : filter === "follow_up" ? openFollowups : entries.filter(e => e.category === filter);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[480px] flex flex-col gap-2 pb-28">

      {/* Header */}
      <div className="pt-0.5">
        <h1 className="text-[16px] font-extrabold text-white tracking-tight">Manager Log</h1>
        <p className="text-[10px] text-gray-600 mt-0.5">Shift journal — fast, professional</p>
      </div>

      {/* Metrics — compact */}
      <div className="grid grid-cols-4 gap-1">
        <div className="flex flex-col items-center text-center bg-[#111827] border border-[#1F2937] rounded-lg p-1.5">
          <span className="text-[14px] font-extrabold text-white leading-none">{todayEntries.length}</span>
          <span className="text-[8px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">Notes</span>
        </div>
        <div className="flex flex-col items-center text-center bg-[#111827] border border-[#1F2937] rounded-lg p-1.5">
          <span className="text-[14px] font-extrabold text-primary leading-none">{openFollowups.length}</span>
          <span className="text-[8px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">Follow-Up</span>
        </div>
        <div className="flex flex-col items-center text-center bg-[#111827] border border-[#1F2937] rounded-lg p-1.5">
          <span className={cn("text-[14px] font-extrabold leading-none", incidentCount > 0 ? "text-red-400" : "text-white")}>{incidentCount}</span>
          <span className="text-[8px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">Issues</span>
        </div>
        <div className="flex flex-col items-center text-center bg-[#111827] border border-[#1F2937] rounded-lg p-1.5">
          <span className={cn("text-[14px] font-extrabold leading-none", openCount > 0 ? "text-amber-400" : "text-white")}>{openCount}</span>
          <span className="text-[8px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">Open</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 h-6 px-2.5 rounded-full text-[10px] font-bold border transition-all",
              filter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-[#0F1623] text-gray-500 border-[#1E2A3B]"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Open Follow-Ups — priority section */}
      {openFollowups.length > 0 && filter === "all" && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1.5 flex items-center gap-1">
            <AlertTriangle className="h-2.5 w-2.5" /> Needs Follow-Up ({openFollowups.length})
          </p>
          <div className="flex flex-col gap-1">
            {openFollowups.slice(0, 8).map(e => (
              <EntryCard key={e.id} entry={e} onResolve={handleResolve} />
            ))}
          </div>
        </div>
      )}

      {/* Log Entries */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">
          {filter !== "all" ? FILTERS.find(f => f.value === filter)?.label : "All Entries"} ({filtered.length})
        </p>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-600 gap-2">
            <MessageSquare className="h-6 w-6 opacity-20" />
            <p className="text-[12px]">No entries</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map(e => (
              <EntryCard key={e.id} entry={e} onResolve={handleResolve} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-[#080C14]/96 backdrop-blur-md border-t border-[#1F2937] px-4 py-2.5 lg:bottom-0 lg:left-64">
        <button onClick={() => setShowForm(true)}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold active:scale-95 transition-transform">
          <Plus className="h-4 w-4" /> Log Entry
        </button>
      </div>

      <EntryForm open={showForm} onClose={() => setShowForm(false)} onSaved={handleSaved} />
    </div>
  );
}

export const hideBase44Index = true;