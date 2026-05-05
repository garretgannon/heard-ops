import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  AlertTriangle, Wrench, Users, ShieldAlert, Building2, DollarSign, Truck,
  CheckCircle2, UserPlus, Plus, Clock, LayoutList, Flame, MapPin
} from "lucide-react";
import MetricTile from "../components/MetricTile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isToday } from "date-fns";

const CATEGORIES = {
  critical:   { label: "Critical",   icon: Flame,         color: "text-red-600",      bg: "bg-red-500/15" },
  equipment:  { label: "Equipment",  icon: Wrench,        color: "text-orange-400",   bg: "bg-orange-500/15" },
  facilities: { label: "Facilities", icon: Building2,     color: "text-blue-400",    bg: "bg-blue-500/15" },
  safety:     { label: "Safety",     icon: ShieldAlert,   color: "text-red-400",     bg: "bg-red-500/15" },
  guest:      { label: "Guest",      icon: Users,         color: "text-cyan-400",    bg: "bg-cyan-500/15" },
  cash:       { label: "Cash",       icon: DollarSign,    color: "text-yellow-400",  bg: "bg-yellow-500/15" },
  vendor:     { label: "Vendor",     icon: Truck,         color: "text-purple-400",  bg: "bg-purple-500/15" },
  team:       { label: "Team",       icon: Users,         color: "text-indigo-400",  bg: "bg-indigo-500/15" },
};

const STATUSES = {
  open:              { label: "Open",               cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  in_progress:       { label: "In Progress",        cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  waiting_on_vendor: { label: "Waiting on Vendor",  cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  resolved:          { label: "Resolved",           cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  needs_review:      { label: "Needs Review",       cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
};

const FILTERS = [
  { id: "all",       label: "All",         icon: LayoutList },
  { id: "critical",  label: "Critical",    icon: Flame },
  { id: "equipment", label: "Equipment",   icon: Wrench },
  { id: "facilities",label: "Facilities",  icon: Building2 },
  { id: "safety",    label: "Safety",      icon: ShieldAlert },
  { id: "guest",     label: "Guest",       icon: Users },
  { id: "cash",      label: "Cash",        icon: DollarSign },
  { id: "vendor",    label: "Vendor",      icon: Truck },
  { id: "team",      label: "Team",        icon: Users },
];

const emptyForm = () => ({
  title: "", description: "", category: "equipment", status: "open",
  assigned_to_name: "", assigned_to_email: "", location: "", severity: "high"
});

export default function IssuesRepairs() {
  const { user } = useCurrentUser();
  const [issues, setIssues] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [incidents, setIncidents] = useState([]);
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
      base44.entities.MaintenanceRequest.list("-created_date", 200).catch(() => []),
      base44.entities.IncidentReport.list("-created_date", 200).catch(() => []),
      base44.entities.User.list(),
    ]).then(([iss, maint, inc, users]) => {
      setIssues(iss);
      setMaintenance(maint || []);
      setIncidents(inc || []);
      setEmployees(users);
      setLoading(false);
    });
  }, []);

  const allItems = useMemo(() => {
    const merged = [
      ...issues.map(i => ({ ...i, _type: "issue", severity: i.severity || "high", status: i.status })),
      ...maintenance.map(m => ({ ...m, _type: "maintenance", severity: m.priority || "high", status: m.status, category: "equipment" })),
      ...incidents.map(i => ({ ...i, _type: "incident", severity: i.severity || "high", status: i.status })),
    ];
    return merged.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [issues, maintenance, incidents]);

  const filtered = useMemo(() => {
    if (filter === "all") return allItems;
    if (filter === "critical") return allItems.filter(i => i.severity === "critical" || i.status === "critical");
    return allItems.filter(i => i.category === filter);
  }, [allItems, filter]);

  const stats = useMemo(() => ({
    open: allItems.filter(i => ["open", "in_progress"].includes(i.status)).length,
    critical: allItems.filter(i => i.severity === "critical" || i.status === "critical").length,
    resolved: allItems.filter(i => i.status === "resolved" && isToday(new Date(i.resolved_at || i.created_date))).length,
  }), [allItems]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const created = await base44.entities.Issue.create({ ...form, logged_by: user?.email });
    setIssues(prev => [created, ...prev]);
    setDialogOpen(false);
    setForm(emptyForm());
    setSaving(false);
    toast.success("Issue reported");
  };

  const handleResolve = async (item) => {
    const entity = item._type === "issue" ? base44.entities.Issue :
                   item._type === "maintenance" ? base44.entities.MaintenanceRequest :
                   base44.entities.IncidentReport;
    const updated = await entity.update(item.id, { status: "resolved", resolved_at: new Date().toISOString() });
    if (item._type === "issue") setIssues(prev => prev.map(i => i.id === item.id ? updated : i));
    else if (item._type === "maintenance") setMaintenance(prev => prev.map(i => i.id === item.id ? updated : i));
    else setIncidents(prev => prev.map(i => i.id === item.id ? updated : i));
    toast.success("Resolved");
  };

  const handleStatusChange = async (item, status) => {
    const entity = item._type === "issue" ? base44.entities.Issue :
                   item._type === "maintenance" ? base44.entities.MaintenanceRequest :
                   base44.entities.IncidentReport;
    const patch = { status };
    if (status === "resolved") patch.resolved_at = new Date().toISOString();
    const updated = await entity.update(item.id, patch);
    if (item._type === "issue") setIssues(prev => prev.map(i => i.id === item.id ? updated : i));
    else if (item._type === "maintenance") setMaintenance(prev => prev.map(i => i.id === item.id ? updated : i));
    else setIncidents(prev => prev.map(i => i.id === item.id ? updated : i));
    setStatusDialog(null);
    toast.success("Updated");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pb-10">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 mb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Issues &amp; Repairs</h1>
          <button
            onClick={() => setDialogOpen(true)}
            className="h-9 px-3 flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary rounded-lg active:scale-95 transition-transform"
          >
            <Plus className="h-4 w-4" /> Report
          </button>
        </div>
      </div>

      <div className="px-4 grid grid-cols-3 gap-2 mb-4">
        <MetricTile label="Open" value={stats.open} color={stats.open > 0 ? "text-amber-400" : "text-white"} alert={stats.open > 0} />
        <MetricTile label="Critical" value={stats.critical} color={stats.critical > 0 ? "text-red-400" : "text-white"} alert={stats.critical > 0} />
        <MetricTile label="Resolved" value={stats.resolved} color="text-emerald-400" />
      </div>

      <div className="px-4 flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {FILTERS.map(f => {
          const FIcon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex-shrink-0 h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap",
                filter === f.id
                  ? f.id === "critical"
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : "bg-primary/15 text-primary border-primary/30"
                  : "bg-card border-border text-muted-foreground"
              )}
            >
              <FIcon className="h-3.5 w-3.5" />
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 space-y-2 mb-4">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-xs">No items in this filter</div>
        )}
        {filtered.map(item => {
          const cat = CATEGORIES[item.category] || CATEGORIES.equipment;
          const st = STATUSES[item.status] || STATUSES.open;
          const Icon = cat.icon;
          const isResolved = item.status === "resolved";
          const isCritical = item.severity === "critical" || item.status === "critical";

          return (
            <div
              key={`${item._type}-${item.id}`}
              className={cn(
                "bg-card border border-border rounded-xl px-3.5 py-2.5 flex items-start gap-3",
                isCritical && "border-red-500/40",
                isResolved && "opacity-60"
              )}
            >
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cat.bg)}>
                <Icon className={cn("h-4 w-4", cat.color)} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight truncate">{item.title}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                  {item.location && (
                    <>
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{item.location}</span>
                    </>
                  )}
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>{formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}</span>
                  {item.assigned_to_name && (
                    <>
                      <span>·</span>
                      <div className="h-4 w-4 rounded-full bg-primary/30 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                        {item.assigned_to_name.charAt(0)}
                      </div>
                      <span>{item.assigned_to_name.split(" ")[0]}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => !isResolved && setStatusDialog(item)}
                className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 transition-opacity whitespace-nowrap", st.cls, !isResolved && "active:opacity-70")}
              >
                {st.label}
              </button>

              {!isResolved && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setAssignDialog(item)}
                    className="h-6 w-6 rounded-lg bg-muted border border-border flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <UserPlus className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleResolve(item)}
                    className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report New Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="What needs attention?"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([v, m]) => (
                    <SelectItem key={v} value={v}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["critical", "high", "medium", "low"].map(v => (
                    <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Kitchen, FOH"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Details..."
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={saving || !form.title.trim()}
              className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-lg disabled:opacity-50 active:scale-95 transition-transform text-sm"
            >
              {saving ? "Reporting..." : "Report Issue"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign To</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 pt-2 max-h-64 overflow-y-auto">
            {employees.map(emp => (
              <button
                key={emp.email}
                onClick={() => {
                  const entity = assignDialog._type === "issue" ? base44.entities.Issue :
                                 assignDialog._type === "maintenance" ? base44.entities.MaintenanceRequest :
                                 base44.entities.IncidentReport;
                  entity.update(assignDialog.id, { assigned_to_email: emp.email, assigned_to_name: emp.full_name });
                  setAssignDialog(null);
                  toast.success("Assigned");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card border border-border active:scale-95 transition-transform text-left hover:bg-muted"
              >
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {emp.full_name?.charAt(0) || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{emp.full_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{emp.email}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {statusDialog && (
        <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Update Status</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground -mt-1">{statusDialog.title}</p>
            <div className="space-y-1.5 pt-2">
              {Object.entries(STATUSES).map(([v, m]) => (
                <button
                  key={v}
                  onClick={() => handleStatusChange(statusDialog, v)}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-lg border text-xs font-bold text-left transition-all active:scale-95",
                    statusDialog.status === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground hover:bg-muted"
                  )}
                >
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