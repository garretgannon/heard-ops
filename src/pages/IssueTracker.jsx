import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AlertTriangle, Users, DollarSign, Wrench, UserCheck, ShieldAlert, MoreHorizontal, CheckCircle2, UserPlus, Eye, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isToday, differenceInHours } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CATEGORY_META = {
  safety:    { label: "Safety",    icon: ShieldAlert, color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20" },
  guest:     { label: "Guest",     icon: Users,       color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  equipment: { label: "Equipment", icon: Wrench,      color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  cash:      { label: "Cash",      icon: DollarSign,  color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  team:      { label: "Team",      icon: UserCheck,   color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  other:     { label: "Other",     icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-secondary border-border" },
};

const STATUS_META = {
  open:        { label: "Open",        cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  in_progress: { label: "In Progress", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  critical:    { label: "Critical",    cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  resolved:    { label: "Resolved",    cls: "bg-green-500/15 text-green-400 border-green-500/30" },
};

const FILTERS = ["all", "safety", "guest", "equipment", "cash", "team"];

const emptyForm = () => ({ title: "", description: "", category: "guest", status: "open", assigned_to_name: "", assigned_to_email: "" });

export default function IssueTracker() {
  const { user, isAdmin } = useCurrentUser();
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
    ]).then(([iss, users]) => {
      setIssues(iss);
      setEmployees(users);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() =>
    filter === "all" ? issues : issues.filter(i => i.category === filter),
    [issues, filter]
  );

  const openCount = issues.filter(i => i.status === "open" || i.status === "in_progress").length;
  const criticalCount = issues.filter(i => i.status === "critical").length;
  const resolvedToday = issues.filter(i => i.status === "resolved" && i.resolved_at && isToday(new Date(i.resolved_at))).length;
  const resolvedWithTime = issues.filter(i => i.status === "resolved" && i.resolved_at && i.created_date);
  const avgResolution = resolvedWithTime.length
    ? Math.round(resolvedWithTime.reduce((sum, i) => sum + differenceInHours(new Date(i.resolved_at), new Date(i.created_date)), 0) / resolvedWithTime.length)
    : null;

  const followUps = issues.filter(i => i.status === "open" && differenceInHours(new Date(), new Date(i.created_date)) > 12);

  // Build last 7 days resolution trend
  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const dayStr = format(d, "EEE");
      const count = issues.filter(iss => iss.status === "resolved" && iss.resolved_at && format(new Date(iss.resolved_at), "yyyy-MM-dd") === format(d, "yyyy-MM-dd")).length;
      return { day: dayStr, count };
    });
  }, [issues]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const created = await base44.entities.Issue.create({ ...form, logged_by: user?.email });
    setIssues(prev => [created, ...prev]);
    setDialogOpen(false);
    setForm(emptyForm());
    setSaving(false);
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
    setAssignDialog(null);
    toast.success("Assigned");
  };

  const handleStatusChange = async (issue, status) => {
    const patch = { status };
    if (status === "resolved") patch.resolved_at = new Date().toISOString();
    const updated = await base44.entities.Issue.update(issue.id, patch);
    setIssues(prev => prev.map(i => i.id === issue.id ? updated : i));
    setReviewDialog(null);
    toast.success("Status updated");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 pb-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Issue Tracker</h1>
          <p className="text-muted-foreground text-sm">Track, assign, and resolve operational issues</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Log Issue
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open Issues",     value: openCount,                          sub: "active",       color: "text-blue-400" },
          { label: "Critical",        value: criticalCount,                      sub: "urgent",       color: "text-red-400" },
          { label: "Resolved Today",  value: resolvedToday,                      sub: "today",        color: "text-green-400" },
          { label: "Avg Resolution",  value: avgResolution != null ? `${avgResolution}h` : "—", sub: "hours", color: "text-primary" },
        ].map(m => (
          <div key={m.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
            <p className={cn("text-2xl font-bold mt-1", m.color)}>{m.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition-all",
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}
          >{f === "all" ? "All" : CATEGORY_META[f]?.label}</button>
        ))}
      </div>

      {/* Issue Cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No issues found</div>
        )}
        {filtered.map(issue => {
          const cat = CATEGORY_META[issue.category] || CATEGORY_META.other;
          const st = STATUS_META[issue.status] || STATUS_META.open;
          const CatIcon = cat.icon;
          return (
            <div key={issue.id} className={cn("bg-card border rounded-xl p-3.5 flex gap-3", issue.status === "critical" ? "border-red-500/40" : "border-border")}>
              {/* Icon */}
              <div className={cn("h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5", cat.bg)}>
                <CatIcon className={cn("h-4 w-4", cat.color)} />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{issue.title}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(issue.created_date), { addSuffix: true })}{issue.logged_by ? ` · ${issue.logged_by.split("@")[0]}` : ""}</p>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0", st.cls)}>{st.label}</span>
                </div>
                {issue.description && <p className="text-xs text-muted-foreground line-clamp-1">{issue.description}</p>}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  {/* Assignee */}
                  <div className="flex items-center gap-1.5">
                    {issue.assigned_to_name ? (
                      <>
                        <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-foreground">
                          {issue.assigned_to_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-muted-foreground">{issue.assigned_to_name.split(" ")[0]}</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </div>
                  {/* Actions */}
                  {issue.status !== "resolved" && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleResolve(issue)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-green-400 hover:text-green-300 px-2 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/15 transition-colors">
                        <CheckCircle2 className="h-3 w-3" /> Resolve
                      </button>
                      <button onClick={() => setAssignDialog(issue)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/15 transition-colors">
                        <UserPlus className="h-3 w-3" /> Assign
                      </button>
                      <button onClick={() => setReviewDialog(issue)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                        <Eye className="h-3 w-3" /> Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Follow-Ups + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Follow-Ups */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" /> Follow-Ups Needed
            {followUps.length > 0 && <span className="ml-auto text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold">{followUps.length}</span>}
          </h3>
          {followUps.length === 0 ? (
            <p className="text-xs text-muted-foreground">No stale open issues — great work!</p>
          ) : followUps.map(i => (
            <div key={i.id} className="flex items-center justify-between text-xs py-1.5 border-t border-border/50">
              <span className="font-medium truncate mr-2">{i.title}</span>
              <span className="text-muted-foreground shrink-0">{formatDistanceToNow(new Date(i.created_date), { addSuffix: true })}</span>
            </div>
          ))}
        </div>

        {/* Resolution Trend */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-sm">Resolution Trend <span className="text-muted-foreground font-normal text-xs">— last 7 days</span></h3>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={trendData} barSize={16}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0B0F14", border: "1px solid #1F2933", borderRadius: 8, fontSize: 11 }}
                cursor={{ fill: "rgba(245,166,35,0.06)" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {trendData.map((entry, i) => (
                  <Cell key={i} fill={entry.count > 0 ? "#F5A623" : "#1F2933"} />
                ))}
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
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What's the issue?" />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_META).map(([v, m]) => <SelectItem key={v} value={v}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_META).map(([v, m]) => <SelectItem key={v} value={v}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief details..." />
            </div>
            <Button onClick={handleCreate} disabled={saving || !form.title.trim()} className="w-full">
              {saving ? "Saving..." : "Log Issue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Issue</DialogTitle></DialogHeader>
          <div className="space-y-2 pt-1">
            {employees.map(emp => (
              <button key={emp.email} onClick={() => handleAssign(assignDialog, emp.email, emp.full_name)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/70 transition-colors text-left">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {emp.full_name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold">{emp.full_name}</p>
                  <p className="text-xs text-muted-foreground">{emp.email}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      {reviewDialog && (
        <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Update Status</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{reviewDialog.title}</p>
            <div className="space-y-2 pt-1">
              {Object.entries(STATUS_META).map(([v, m]) => (
                <button key={v} onClick={() => handleStatusChange(reviewDialog, v)}
                  className={cn("w-full px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all",
                    reviewDialog.status === v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary")}>
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