import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AlertTriangle, Wrench, Users, ShieldAlert, UserCheck, DollarSign,
  CheckCircle2, UserPlus, Plus, Clock, LayoutList, Flame } from "lucide-react";
import MetricTile from "../components/MetricTile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isToday, differenceInHours } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CAT = {
  safety:    { label: "Safety",    icon: ShieldAlert,   color: "text-red-400",    bg: "bg-red-500/10" },
  guest:     { label: "Guest",     icon: Users,         color: "text-blue-400",   bg: "bg-blue-500/10" },
  equipment: { label: "Equipment", icon: Wrench,        color: "text-orange-400", bg: "bg-orange-500/10" },
  cash:      { label: "Cash",      icon: DollarSign,    color: "text-yellow-400", bg: "bg-yellow-500/10" },
  team:      { label: "Team",      icon: UserCheck,     color: "text-purple-400", bg: "bg-purple-500/10" },
  other:     { label: "Other",     icon: AlertTriangle, color: "text-gray-400",   bg: "bg-[#1C2432]" },
};

const ST = {
  open:        { label: "Open",     cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  in_progress: { label: "Active",   cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  critical:    { label: "Critical", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  resolved:    { label: "Done",     cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

const FILTERS = [
  { id: "all",       label: "All",       icon: LayoutList },
  { id: "safety",    label: "Safety",    icon: ShieldAlert },
  { id: "equipment", label: "Equipment", icon: Wrench },
  { id: "guest",     label: "Guest",     icon: Users },
  { id: "critical",  label: "Critical",  icon: Flame, statusFilter: true },
];

const emptyForm = () => ({ title: "", description: "", category: "guest", status: "open", assigned_to_name: "", assigned_to_email: "" });

export default function IssueTracker() {
  const { user } = useCurrentUser();
  const [issues, setIssues] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialog, setAssignDialog] = useState(null);
  const [statusDialog, setStatusDialog] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Issue.list("-created_date", 200),
      base44.entities.User.list(),
    ]).then(([iss, users]) => { setIssues(iss); setEmployees(users); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const f = FILTERS.find(x => x.id === filter);
    if (!f || filter === "all") return issues;
    if (f.statusFilter) return issues.filter(i => i.status === filter);
    return issues.filter(i => i.category === filter);
  }, [issues, filter]);

  const openCount      = issues.filter(i => i.status === "open" || i.status === "in_progress").length;
  const criticalCount  = issues.filter(i => i.status === "critical").length;
  const resolvedToday  = issues.filter(i => i.status === "resolved" && i.resolved_at && isToday(new Date(i.resolved_at))).length;
  const resolvedWithTime = issues.filter(i => i.status === "resolved" && i.resolved_at && i.created_date);
  const avgHours = resolvedWithTime.length
    ? Math.round(resolvedWithTime.reduce((s, i) => s + differenceInHours(new Date(i.resolved_at), new Date(i.created_date)), 0) / resolvedWithTime.length)
    : null;

  const trendData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dayStr = format(d, "yyyy-MM-dd");
    return {
      day: format(d, "EEE"),
      count: issues.filter(iss => iss.status === "resolved" && iss.resolved_at && format(new Date(iss.resolved_at), "yyyy-MM-dd") === dayStr).length,
    };
  }), [issues]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const created = await base44.entities.Issue.create({ ...form, logged_by: user?.email });
    setIssues(prev => [created, ...prev]);
    setDialogOpen(false); setForm(emptyForm()); setSaving(false);
    toast.success("Issue logged");
  };

  const handleResolve = async (issue) => {
    const updated = await base44.entities.Issue.update(issue.id, { status: "resolved", resolved_at: new Date().toISOString() });
    setIssues(prev => prev.map(i => i.id === issue.id ? updated : i));
    toast.success("Resolved");
  };

  const handleAssign = async (issue, email, name) => {
    const updated = await base44.entities.Issue.update(issue.id, { assigned_to_email: email, assigned_to_name: name, status: issue.status === "open" ? "in_progress" : issue.status });
    setIssues(prev => prev.map(i => i.id === issue.id ? updated : i));
    setAssignDialog(null); toast.success("Assigned");
  };

  const handleStatusChange = async (issue, status) => {
    const patch = { status }; if (status === "resolved") patch.resolved_at = new Date().toISOString();
    const updated = await base44.entities.Issue.update(issue.id, patch);
    setIssues(prev => prev.map(i => i.id === issue.id ? updated : i));
    setStatusDialog(null); toast.success("Updated");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-4 h-4 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-3 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-[16px] font-extrabold text-white tracking-tight">Issues</h1>
        <button onClick={() => setDialogOpen(true)}
          className="h-7 px-2.5 flex items-center gap-1 text-[11px] font-bold text-[#F5A623] bg-[#F5A623]/8 border border-[#F5A623]/20 rounded-lg active:scale-95 transition-transform">
          <Plus className="h-3 w-3" /> Log
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-1.5">
        <MetricTile label="Open"       value={openCount}     color={openCount > 0 ? "text-amber-400" : "text-white"} alert={openCount > 0} />
        <MetricTile label="Critical"   value={criticalCount} color={criticalCount > 0 ? "text-red-400" : "text-white"} alert={criticalCount > 0} />
        <MetricTile label="Done Today" value={resolvedToday} color="text-emerald-400" />
        <MetricTile label="Avg Time"   value={avgHours != null ? `${avgHours}h` : "—"} color="text-gray-400" />
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {FILTERS.map(f => {
          const FIcon = f.icon;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn(
                "flex-shrink-0 h-7 px-2.5 flex items-center gap-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95 whitespace-nowrap",
                filter === f.id
                  ? f.id === "critical"
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : "bg-primary/15 text-primary border-primary/30"
                  : "bg-[#0F1623] text-gray-600 border-[#1A2235]"
              )}>
              <FIcon className="h-3 w-3" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Issue list */}
      <div className="flex flex-col gap-1.5">
        {filtered.length === 0 && (
          <p className="text-center py-8 text-[12px] text-gray-600">No issues in this filter</p>
        )}
        {filtered.map(issue => {
          const cat = CAT[issue.category] || CAT.other;
          const st = ST[issue.status] || ST.open;
          const Icon = cat.icon;
          const isCrit = issue.status === "critical";
          const isResolved = issue.status === "resolved";
          return (
            <div key={issue.id} className={cn(
              "bg-[#0F1623] border rounded-xl px-3 py-2.5 flex items-center gap-2.5",
              isCrit ? "border-red-500/35" : "border-[#1A2235]",
              isResolved && "opacity-60"
            )}>
              {/* Icon */}
              <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", cat.bg)}>
                <Icon className={cn("h-3.5 w-3.5", cat.color)} />
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white leading-tight truncate">{issue.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-2.5 w-2.5 text-gray-700 shrink-0" />
                  <span className="text-[10px] text-gray-600">{formatDistanceToNow(new Date(issue.created_date), { addSuffix: true })}</span>
                  {issue.assigned_to_name ? (
                    <>
                      <span className="text-gray-700 text-[9px]">·</span>
                      <span className="text-[10px] text-gray-500">{issue.assigned_to_name.split(" ")[0]}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-700 text-[9px]">·</span>
                      <span className="text-[10px] text-gray-700 italic">unassigned</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <button onClick={() => !isResolved && setStatusDialog(issue)}
                className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 transition-opacity", st.cls, !isResolved && "active:opacity-70")}>
                {st.label}
              </button>

              {/* Actions */}
              {!isResolved && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setAssignDialog(issue)}
                    className="h-6 w-6 rounded-lg bg-[#1A2235] border border-[#232D3F] flex items-center justify-center active:scale-95 transition-transform">
                    <UserPlus className="h-3 w-3 text-gray-500" />
                  </button>
                  <button onClick={() => handleResolve(issue)}
                    className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center active:scale-95 transition-transform">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trend chart */}
      <div className="bg-[#0F1623] border border-[#1A2235] rounded-xl px-3 py-2.5">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Resolutions — 7 days</p>
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={trendData} barSize={12} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#4B5563" }} axisLine={false} tickLine={false} />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#0B0F14", border: "1px solid #1A2235", borderRadius: 6, fontSize: 10, padding: "3px 8px" }}
              cursor={{ fill: "rgba(245,166,35,0.05)" }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {trendData.map((e, i) => <Cell key={i} fill={e.count > 0 ? "#F5A623" : "#1A2235"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Log Issue Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Issue</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What's the issue?" /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CAT).map(([v, m]) => <SelectItem key={v} value={v}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(ST).map(([v, m]) => <SelectItem key={v} value={v}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief details..." /></div>
            <button onClick={handleCreate} disabled={saving || !form.title.trim()}
              className="w-full h-10 bg-[#F5A623] text-black font-bold rounded-xl disabled:opacity-50 active:scale-95 transition-transform text-[13px]">
              {saving ? "Saving..." : "Log Issue"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Issue</DialogTitle></DialogHeader>
          <div className="space-y-1 pt-1 max-h-72 overflow-y-auto">
            {employees.map(emp => (
              <button key={emp.email} onClick={() => handleAssign(assignDialog, emp.email, emp.full_name)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#111827] border border-[#1F2937] active:scale-[0.98] transition-transform text-left">
                <div className="h-7 w-7 rounded-full bg-[#F5A623]/15 flex items-center justify-center text-[11px] font-bold text-[#F5A623] shrink-0">
                  {emp.full_name?.charAt(0) || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{emp.full_name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{emp.email}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      {statusDialog && (
        <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Update Status</DialogTitle></DialogHeader>
            <p className="text-[12px] text-gray-500 -mt-1">{statusDialog.title}</p>
            <div className="space-y-1.5 pt-1">
              {Object.entries(ST).map(([v, m]) => (
                <button key={v} onClick={() => handleStatusChange(statusDialog, v)}
                  className={cn("w-full px-4 py-2.5 rounded-xl border text-[13px] font-bold text-left transition-all active:scale-[0.98]",
                    statusDialog.status === v ? "bg-[#F5A623] text-black border-[#F5A623]" : "bg-[#111827] border-[#1F2937] text-white")}>
                  {m.label}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export const hideBase44Index = true;