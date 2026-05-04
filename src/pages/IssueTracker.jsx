import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AlertTriangle, Users, DollarSign, Wrench, UserCheck, ShieldAlert,
  CheckCircle2, UserPlus, Eye, Plus, Clock } from "lucide-react";
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
  safety:    { label: "Safety",    icon: ShieldAlert,    color: "text-red-400",    bg: "bg-red-500/15" },
  guest:     { label: "Guest",     icon: Users,          color: "text-blue-400",   bg: "bg-blue-500/15" },
  equipment: { label: "Equipment", icon: Wrench,         color: "text-orange-400", bg: "bg-orange-500/15" },
  cash:      { label: "Cash",      icon: DollarSign,     color: "text-yellow-400", bg: "bg-yellow-500/15" },
  team:      { label: "Team",      icon: UserCheck,      color: "text-purple-400", bg: "bg-purple-500/15" },
  other:     { label: "Other",     icon: AlertTriangle,  color: "text-gray-400",   bg: "bg-[#1C2432]" },
};

const ST = {
  open:        { label: "Open",        cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  in_progress: { label: "In Progress", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  critical:    { label: "Critical",    cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  resolved:    { label: "Resolved",    cls: "bg-green-500/15 text-green-400 border-green-500/30" },
};

const FILTERS = ["all","safety","guest","equipment","cash","team"];
const emptyForm = () => ({ title: "", description: "", category: "guest", status: "open", assigned_to_name: "", assigned_to_email: "" });

function Stat({ label, value, color }) {
  return (
    <div className="flex-1 bg-[#111827] border border-[#1F2937] rounded-xl py-3 px-2 text-center min-w-0">
      <p className={cn("text-xl font-extrabold leading-none", color)}>{value}</p>
      <p className="text-[10px] text-gray-500 font-semibold mt-1 leading-tight">{label}</p>
    </div>
  );
}

export default function IssueTracker() {
  const { user } = useCurrentUser();
  const [issues, setIssues] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialog, setAssignDialog] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Issue.list("-created_date", 200),
      base44.entities.User.list(),
    ]).then(([iss, users]) => { setIssues(iss); setEmployees(users); setLoading(false); });
  }, []);

  const filtered = useMemo(() => filter === "all" ? issues : issues.filter(i => i.category === filter), [issues, filter]);
  const openCount = issues.filter(i => i.status === "open" || i.status === "in_progress").length;
  const criticalCount = issues.filter(i => i.status === "critical").length;
  const resolvedToday = issues.filter(i => i.status === "resolved" && i.resolved_at && isToday(new Date(i.resolved_at))).length;
  const resolvedWithTime = issues.filter(i => i.status === "resolved" && i.resolved_at && i.created_date);
  const avgResolution = resolvedWithTime.length
    ? Math.round(resolvedWithTime.reduce((s, i) => s + differenceInHours(new Date(i.resolved_at), new Date(i.created_date)), 0) / resolvedWithTime.length)
    : null;
  const followUps = issues.filter(i => i.status === "open" && differenceInHours(new Date(), new Date(i.created_date)) > 12);

  const trendData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { day: format(d, "EEE"), count: issues.filter(iss => iss.status === "resolved" && iss.resolved_at && format(new Date(iss.resolved_at), "yyyy-MM-dd") === format(d, "yyyy-MM-dd")).length };
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
    toast.success("Marked resolved");
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
    setReviewDialog(null); toast.success("Status updated");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="pb-2">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Issue Tracker</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">Track, assign, and resolve operational issues</p>
        </div>
        <button onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/25 px-3 py-2 rounded-xl active:scale-95 transition-transform">
          <Plus className="h-3.5 w-3.5" /> Log Issue
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-2 mb-3">
        <Stat label="Open Issues"   value={openCount}                                color={openCount > 0 ? "text-blue-400" : "text-white"} />
        <Stat label="Critical"      value={criticalCount}                            color={criticalCount > 0 ? "text-red-400" : "text-white"} />
        <Stat label="Resolved Today" value={resolvedToday}                           color="text-green-400" />
        <Stat label="Avg Resolution" value={avgResolution != null ? `${avgResolution}h` : "—"} color="text-[#F5A623]" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none mb-3">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition-all",
              filter === f ? "bg-[#F5A623] text-black border-[#F5A623]" : "border-[#1F2937] text-gray-400 bg-[#111827]")}>
            {f === "all" ? "All" : CAT[f]?.label}
          </button>
        ))}
      </div>

      {/* Issue cards */}
      <div className="space-y-1.5 mb-3">
        {filtered.length === 0 && (
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 text-center text-sm text-gray-500">No issues found</div>
        )}
        {filtered.map(issue => {
          const cat = CAT[issue.category] || CAT.other;
          const st = ST[issue.status] || ST.open;
          const Icon = cat.icon;
          const isCrit = issue.status === "critical";
          return (
            <div key={issue.id} className={cn("bg-[#111827] border rounded-xl px-3 py-2.5 flex gap-3", isCrit ? "border-red-500/40" : "border-[#1F2937]")}>
              {/* Left icon */}
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cat.bg)}>
                <Icon className={cn("h-4 w-4", cat.color)} />
              </div>
              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight truncate">{issue.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {formatDistanceToNow(new Date(issue.created_date), { addSuffix: true })}
                      {issue.logged_by ? ` · ${issue.logged_by.split("@")[0]}` : ""}
                    </p>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold shrink-0", st.cls)}>{st.label}</span>
                </div>
                {issue.description && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{issue.description}</p>}
                <div className="flex items-center justify-between mt-1.5 gap-2">
                  {/* Assignee */}
                  {issue.assigned_to_name ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-[#1C2432] border border-[#2A3441] flex items-center justify-center text-[9px] font-bold text-[#F5A623]">
                        {issue.assigned_to_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] text-gray-500">{issue.assigned_to_name.split(" ")[0]}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-600 italic">Unassigned</span>
                  )}
                  {/* Actions */}
                  {issue.status !== "resolved" && (
                    <div className="flex gap-1">
                      <button onClick={() => handleResolve(issue)}
                        className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg active:scale-95 transition-transform">
                        <CheckCircle2 className="h-3 w-3" /> Resolve
                      </button>
                      <button onClick={() => setAssignDialog(issue)}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg active:scale-95 transition-transform">
                        <UserPlus className="h-3 w-3" /> Assign
                      </button>
                      <button onClick={() => setReviewDialog(issue)}
                        className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-[#1C2432] border border-[#2A3441] px-2 py-1 rounded-lg active:scale-95 transition-transform">
                        <Eye className="h-3 w-3" /> Status
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Follow-ups + Trend */}
      <div className="grid grid-cols-1 gap-2">
        {/* Follow-Ups */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <p className="text-xs font-bold text-white">Follow-Ups Needed</p>
            {followUps.length > 0 && (
              <span className="ml-auto text-[10px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">{followUps.length}</span>
            )}
          </div>
          {followUps.length === 0 ? (
            <p className="text-[11px] text-gray-500">No stale issues — great work!</p>
          ) : followUps.slice(0, 4).map(i => (
            <div key={i.id} className="flex items-center justify-between py-1.5 border-t border-[#1F2937]">
              <span className="text-xs font-medium text-white truncate mr-2">{i.title}</span>
              <span className="text-[10px] text-gray-500 shrink-0">{formatDistanceToNow(new Date(i.created_date), { addSuffix: true })}</span>
            </div>
          ))}
        </div>

        {/* Resolution Trend */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5">
          <p className="text-xs font-bold text-white mb-2">Resolution Trend <span className="text-gray-500 font-normal">— last 7 days</span></p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={trendData} barSize={14}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis hide allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0B0F14", border: "1px solid #1F2937", borderRadius: 8, fontSize: 11 }} cursor={{ fill: "rgba(245,166,35,0.06)" }} />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {trendData.map((e, i) => <Cell key={i} fill={e.count > 0 ? "#F5A623" : "#1F2937"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Log Issue Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Issue</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="What's the issue?" /></div>
            <div><Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm({...form,category:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CAT).map(([v,m]) => <SelectItem key={v} value={v}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form,status:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(ST).map(([v,m]) => <SelectItem key={v} value={v}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} rows={2} placeholder="Brief details..." /></div>
            <button onClick={handleCreate} disabled={saving || !form.title.trim()}
              className="w-full h-11 bg-[#F5A623] text-black font-bold rounded-xl disabled:opacity-50 active:scale-95 transition-transform">
              {saving ? "Saving..." : "Log Issue"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Issue</DialogTitle></DialogHeader>
          <div className="space-y-1.5 pt-1">
            {employees.map(emp => (
              <button key={emp.email} onClick={() => handleAssign(assignDialog, emp.email, emp.full_name)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#111827] border border-[#1F2937] active:scale-[0.98] transition-transform text-left">
                <div className="h-8 w-8 rounded-full bg-[#F5A623]/15 flex items-center justify-center text-xs font-bold text-[#F5A623]">
                  {emp.full_name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{emp.full_name}</p>
                  <p className="text-[11px] text-gray-500">{emp.email}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review/Status Dialog */}
      {reviewDialog && (
        <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Update Status</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-500">{reviewDialog.title}</p>
            <div className="space-y-1.5 pt-1">
              {Object.entries(ST).map(([v, m]) => (
                <button key={v} onClick={() => handleStatusChange(reviewDialog, v)}
                  className={cn("w-full px-4 py-2.5 rounded-xl border text-sm font-semibold text-left transition-all active:scale-[0.98]",
                    reviewDialog.status === v ? "bg-[#F5A623] text-black border-[#F5A623]" : "bg-[#111827] border-[#1F2937] text-white")}>
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