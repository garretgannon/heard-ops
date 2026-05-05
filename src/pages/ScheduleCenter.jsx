import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Plus, MessageSquare, User, Clock, AlertCircle, CheckCircle2, Upload, Calendar,
  Users, Inbox, ChevronRight, MapPin, Phone, Mail, MoreVertical, Zap
} from "lucide-react";
import MetricTile from "../components/MetricTile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isToday, startOfToday, endOfToday, startOfWeek, endOfWeek } from "date-fns";

const TABS = [
  { id: "today", label: "Today", icon: Clock },
  { id: "week", label: "Week", icon: Calendar },
  { id: "team", label: "Team", icon: Users },
  { id: "import", label: "Import", icon: Upload },
  { id: "requests", label: "Requests", icon: Inbox },
];

const DEPARTMENTS = ["FOH", "BOH", "Bar", "Management"];

export default function ScheduleCenter() {
  const { user, isAdmin } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("today");
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [events, setEvents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importDialog, setImportDialog] = useState(false);
  const [shiftDialog, setShiftDialog] = useState(null);
  const [requestDialog, setRequestDialog] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    employee_email: "", employee_name: "", date: "", start_time: "", end_time: "",
    role: "", department: "", notes: ""
  });

  useEffect(() => {
    const load = async () => {
      const [allShifts, allEmployees, allEvents] = await Promise.all([
        base44.entities.StaffShift.list("-date", 500).catch(() => []),
        base44.entities.User.list(),
        base44.entities.CalendarEvent.list().catch(() => []),
      ]);
      setShifts(allShifts);
      setEmployees(allEmployees);
      setEvents(allEvents);
      setLoading(false);
    };
    load();
  }, []);

  const now = new Date();
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const todayShifts = useMemo(() =>
    shifts.filter(s => {
      const d = new Date(s.date);
      return d >= todayStart && d <= todayEnd;
    }).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [shifts]
  );

  const weekShifts = useMemo(() =>
    shifts.filter(s => {
      const d = new Date(s.date);
      return d >= weekStart && d <= weekEnd;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)),
    [shifts]
  );

  const onShiftNow = useMemo(() =>
    todayShifts.filter(s => {
      const start = new Date(`${s.date}T${s.start_time}`);
      const end = new Date(`${s.date}T${s.end_time}`);
      return now >= start && now <= end;
    }),
    [todayShifts, now]
  );

  const startingSoon = useMemo(() =>
    todayShifts.filter(s => {
      const start = new Date(`${s.date}T${s.start_time}`);
      const minFromNow = (start - now) / (1000 * 60);
      return minFromNow > 0 && minFromNow <= 60;
    }),
    [todayShifts, now]
  );

  const lateOrNoShow = useMemo(() =>
    todayShifts.filter(s => {
      const start = new Date(`${s.date}T${s.start_time}`);
      return now > start && !onShiftNow.find(sh => sh.id === s.id);
    }),
    [todayShifts, onShiftNow, now]
  );

  const stats = useMemo(() => ({
    onShift: onShiftNow.length,
    startingSoon: startingSoon.length,
    lateNoShow: lateOrNoShow.length,
    totalWeek: weekShifts.length,
  }), [onShiftNow, startingSoon, lateOrNoShow, weekShifts]);

  const handleAddShift = async () => {
    if (!form.employee_email || !form.date || !form.start_time || !form.end_time) {
      toast.error("Fill all required fields");
      return;
    }
    const created = await base44.entities.StaffShift.create({
      ...form, status: "published", import_date: new Date().toISOString(), imported_by: user?.email
    });
    setShifts(prev => [created, ...prev]);
    setShiftDialog(null);
    setForm({ employee_email: "", employee_name: "", date: "", start_time: "", end_time: "", role: "", department: "", notes: "" });
    toast.success("Shift added");
  };

  const handleImport = async () => {
    if (!importFile) return;
    setUploading(true);
    try {
      const fileData = await importFile.text();
      toast.success("Schedule imported (preview mode)");
      setImportFile(null);
      setImportDialog(false);
    } catch (err) {
      toast.error("Import failed");
    }
    setUploading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 mb-2">
        <h1 className="text-xl font-bold text-foreground">Schedule Center</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage team shifts &amp; availability</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto px-4 pb-3 scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Today Tab */}
      {activeTab === "today" && (
        <div className="px-4 space-y-4 mb-4">
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-1.5">
            <MetricTile label="On Shift" value={stats.onShift} color="text-emerald-400" />
            <MetricTile label="Soon" value={stats.startingSoon} alert={stats.startingSoon > 0} />
            <MetricTile label="Late" value={stats.lateNoShow} alert={stats.lateNoShow > 0} />
            <MetricTile label="Open" value={0} />
          </div>

          {/* On Shift Now */}
          {onShiftNow.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-widest flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> ON SHIFT NOW ({onShiftNow.length})
              </p>
              <div className="space-y-2">
                {onShiftNow.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} employees={employees} onSelect={() => setShiftDialog(shift)} />
                ))}
              </div>
            </div>
          )}

          {/* Starting Soon */}
          {startingSoon.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-widest flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> STARTING SOON ({startingSoon.length})
              </p>
              <div className="space-y-2">
                {startingSoon.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} employees={employees} onSelect={() => setShiftDialog(shift)} />
                ))}
              </div>
            </div>
          )}

          {/* Late / No Show */}
          {lateOrNoShow.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-widest flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-400" /> LATE / NO SHOW ({lateOrNoShow.length})
              </p>
              <div className="space-y-2">
                {lateOrNoShow.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} employees={employees} alert onSelect={() => setShiftDialog(shift)} />
                ))}
              </div>
            </div>
          )}

          {onShiftNow.length === 0 && startingSoon.length === 0 && lateOrNoShow.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-xs">No shifts today</div>
          )}
        </div>
      )}

      {/* Week Tab */}
      {activeTab === "week" && (
        <div className="px-4 space-y-3 mb-4">
          {weekShifts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">No shifts this week</div>
          ) : (
            weekShifts.map(shift => (
              <ShiftCard key={shift.id} shift={shift} employees={employees} onSelect={() => setShiftDialog(shift)} />
            ))
          )}
        </div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <div className="px-4 space-y-3 mb-4">
          {employees.filter(e => e.role !== "admin" || isAdmin).map(emp => {
            const empShifts = weekShifts.filter(s => s.employee_email === emp.email);
            return (
              <div key={emp.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-start gap-2.5">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {emp.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{emp.full_name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{emp.role} · {empShifts.length} shifts</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Import Tab */}
      {activeTab === "import" && isAdmin && (
        <div className="px-4 space-y-4 mb-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Import Schedule</h3>
            <p className="text-xs text-muted-foreground">Upload a CSV, PDF, or R365 export file to import shifts for your team.</p>
            <button
              onClick={() => setImportDialog(true)}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors"
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground">Choose File</span>
            </button>
          </div>

          {/* Manual Add */}
          <div>
            <button
              onClick={() => setShiftDialog("new")}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-transform"
            >
              <Plus className="h-4 w-4" /> Add Shift Manually
            </button>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="px-4 space-y-3 mb-4">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Availability Requests</p>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No pending requests</p>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Import Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label>Select File</Label>
              <input
                type="file"
                onChange={e => setImportFile(e.target.files?.[0] || null)}
                accept=".csv,.pdf,.xlsx"
                className="w-full h-9 px-3 text-xs border border-border rounded-lg bg-card text-foreground file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:font-bold"
              />
            </div>
            <button
              onClick={handleImport}
              disabled={!importFile || uploading}
              className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-lg disabled:opacity-50 active:scale-95 transition-transform text-sm"
            >
              {uploading ? "Importing..." : "Import"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shift Dialog */}
      {(shiftDialog === "new" || shiftDialog) && (
        <Dialog open={!!shiftDialog} onOpenChange={() => setShiftDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{shiftDialog === "new" ? "Add Shift" : "Shift Details"}</DialogTitle>
            </DialogHeader>
            {shiftDialog === "new" ? (
              <div className="space-y-3 pt-2 max-h-96 overflow-y-auto">
                <div>
                  <Label>Employee</Label>
                  <select
                    value={form.employee_email}
                    onChange={e => {
                      const emp = employees.find(el => el.email === e.target.value);
                      setForm({ ...form, employee_email: e.target.value, employee_name: emp?.full_name || "" });
                    }}
                    className="w-full h-9 px-3 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.email}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g., Server" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Start Time</Label>
                    <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <select
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      className="w-full h-9 px-2 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select...</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any notes..." />
                </div>
                <button
                  onClick={handleAddShift}
                  className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-lg active:scale-95 transition-transform text-sm"
                >
                  Add Shift
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Details</p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{shiftDialog.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{shiftDialog.role} • {shiftDialog.department}</p>
                    <p className="text-xs text-muted-foreground">{shiftDialog.date} • {shiftDialog.start_time}–{shiftDialog.end_time}</p>
                  </div>
                </div>
                <button className="w-full h-9 bg-primary text-primary-foreground text-xs font-bold rounded-lg active:scale-95 transition-transform">
                  Message
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Sticky Add Button */}
      {isAdmin && activeTab !== "import" && (
        <div className="fixed left-0 right-0 bottom-20 z-30 px-4 flex gap-2 lg:left-64" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <button
            onClick={() => setShiftDialog("new")}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5" /> Add Shift
          </button>
        </div>
      )}
    </div>
  );
}

function ShiftCard({ shift, employees, alert, onSelect }) {
  const emp = employees.find(e => e.email === shift.employee_email);
  const now = new Date();
  const shiftStart = new Date(`${shift.date}T${shift.start_time}`);
  const shiftEnd = new Date(`${shift.date}T${shift.end_time}`);
  const isActive = now >= shiftStart && now <= shiftEnd;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full bg-card border border-border rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-left hover:border-primary/50 transition-all active:scale-[0.99]",
        alert && "border-red-500/40",
        isActive && "border-emerald-500/40"
      )}
    >
      <div className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
        isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/20 text-primary"
      )}>
        {emp?.full_name?.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{emp?.full_name || shift.employee_name}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
          <span>{shift.role}</span>
          <span>·</span>
          <span>{shift.department}</span>
          <span>·</span>
          <Clock className="h-3 w-3" />
          <span>{shift.start_time}–{shift.end_time}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
          isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
          alert ? "bg-red-500/10 text-red-400 border border-red-500/20" :
          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        )}>
          {isActive ? "Active" : alert ? "Late" : "Upcoming"}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

export const hideBase44Index = true;