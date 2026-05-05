import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Plus, MessageSquare, User, Clock, AlertCircle, CheckCircle2, Upload, Calendar,
  Users, Inbox, ChevronRight, MapPin, Phone, Mail, MoreVertical, Zap, Bell,
  TrendingUp, AlertTriangle, Clock3, ArrowLeft
} from "lucide-react";
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
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "import", label: "Import", icon: Upload },
];

const DEPARTMENTS = ["FOH", "BOH", "Bar", "Management"];

export default function ScheduleCenter() {
  const navigate = useNavigate();
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
      return minFromNow > 0 && minFromNow <= 120;
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
      <div className="w-4 h-4 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0D] pb-32">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-40 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F24] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-lg bg-[#141418] border border-[#1F1F24] flex items-center justify-center hover:bg-[#1A1A1F] transition-colors active:scale-95">
              <ArrowLeft className="h-4 w-4 text-[#A1A1AA]" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Schedule Center</h1>
              <p className="text-[10px] text-[#6B7280] mt-0.5">Today's team, shifts, and tools</p>
            </div>
          </div>
          <button className="h-9 w-9 rounded-lg bg-[#141418] border border-[#1F1F24] flex items-center justify-center active:scale-95">
            <Bell className="h-4 w-4 text-[#A1A1AA]" />
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400">{stats.onShift}</p>
            <p className="text-xs text-white font-semibold mt-1">On Shift</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5">currently working</p>
          </div>

          <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Clock3 className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-amber-400">{stats.startingSoon}</p>
            <p className="text-xs text-white font-semibold mt-1">Starting Soon</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5\">next 2 hours</p>
          </div>

          <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-red-400\">0</p>
            <p className="text-xs text-white font-semibold mt-1\">Open Shifts</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5\">needs coverage</p>
          </div>

          <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Inbox className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400\">0</p>
            <p className="text-xs text-white font-semibold mt-1\">Requests</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5\">pending review</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1.5 overflow-x-auto px-4 py-3 scrollbar-hide border-b border-[#1F1F24]">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 h-10 px-3 flex items-center gap-2 rounded-lg text-xs font-bold border transition-all whitespace-nowrap active:scale-95",
                activeTab === tab.id
                  ? "bg-[#FF6A00] text-black border-[#FF6A00]"
                  : "bg-[#141418] border-[#1F1F24] text-[#A1A1AA] hover:border-[#262630]"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Today Tab */}
      {activeTab === "today" && (
        <div className="px-4 py-4 space-y-4 mb-4">
          {/* On Shift Now */}
          {onShiftNow.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase text-[#6B7280] mb-2 tracking-widest flex items-center gap-1">
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
              <p className="text-xs font-bold uppercase text-[#6B7280] mb-2 tracking-widest flex items-center gap-1">
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
              <p className="text-xs font-bold uppercase text-[#6B7280] mb-2 tracking-widest flex items-center gap-1">
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
            <div className="text-center py-10 text-[#6B7280] text-xs">No shifts today</div>
          )}
        </div>
      )}

      {/* Week Tab */}
      {activeTab === "week" && (
        <div className="px-4 py-4 space-y-3 mb-4">
          {weekShifts.length === 0 ? (
            <div className="text-center py-10 text-[#6B7280] text-xs">No shifts this week</div>
          ) : (
            weekShifts.map(shift => (
              <ShiftCard key={shift.id} shift={shift} employees={employees} onSelect={() => setShiftDialog(shift)} />
            ))
          )}
        </div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <div className="px-4 py-4 space-y-3 mb-4">
          {employees.filter(e => e.role !== "admin" || isAdmin).map(emp => {
            const empShifts = weekShifts.filter(s => s.employee_email === emp.email);
            return (
              <div key={emp.id} className="bg-[#141418] border border-[#1F1F24] rounded-xl p-3">
                <div className="flex items-start gap-2.5">
                  <div className="h-10 w-10 rounded-lg bg-[#FF6A00]/20 border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00] text-xs font-bold shrink-0">
                    {emp.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{emp.full_name}</p>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{emp.role} · {empShifts.length} shifts</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#6B7280] mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="px-4 py-4 space-y-3 mb-4">
          <div>
            <p className="text-xs font-bold uppercase text-[#6B7280] tracking-widest mb-3">Pending Requests</p>
            {requests.length === 0 ? (
              <div className="bg-[#141418] border border-[#1F1F24] rounded-xl p-6 text-center">
                <Inbox className="h-8 w-8 text-[#6B7280]/50 mx-auto mb-2" />
                <p className="text-xs text-[#6B7280] mt-2">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map(req => (
                  <div key={req.id} className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{req.type || "Request"}</p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5">Pending</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shrink-0">Review</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === "import" && isAdmin && (
        <div className="px-4 py-4 space-y-4 mb-4">
          <div className="bg-[#141418] border border-[#1F1F24] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white">Import Schedule</h3>
            <p className="text-xs text-[#6B7280]">Upload a CSV, PDF, or R365 export file to import shifts for your team.</p>
            <button
              onClick={() => setImportDialog(true)}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#1F1F24] hover:border-[#FF6A00] transition-colors"
            >
              <Upload className="h-4 w-4 text-[#6B7280]" />
              <span className="text-xs font-bold text-[#6B7280]">Choose File</span>
            </button>
          </div>

          {/* Manual Add */}
          <div>
            <button
              onClick={() => setShiftDialog("new")}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-[#141418] border border-[#1F1F24] text-xs font-bold text-[#A1A1AA] hover:border-[#FF6A00] active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" /> Add Shift Manually
            </button>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-sm bg-[#141418] border border-[#1F1F24]">
          <DialogHeader>
            <DialogTitle className="text-white">Import Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-white">Select File</Label>
              <input
                type="file"
                onChange={e => setImportFile(e.target.files?.[0] || null)}
                accept=".csv,.pdf,.xlsx"
                className="w-full h-9 px-3 text-xs border border-[#1F1F24] rounded-lg bg-[#0B0B0D] text-white file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-[#FF6A00] file:text-black file:text-xs file:font-bold"
              />
            </div>
            <button
              onClick={handleImport}
              disabled={!importFile || uploading}
              className="w-full h-10 bg-[#FF6A00] text-black font-bold rounded-lg disabled:opacity-50 active:scale-95 transition-transform text-sm"
            >
              {uploading ? "Importing..." : "Import"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shift Dialog */}
      {(shiftDialog === "new" || shiftDialog) && (
        <Dialog open={!!shiftDialog} onOpenChange={() => setShiftDialog(null)}>
          <DialogContent className="max-w-sm bg-[#141418] border border-[#1F1F24]">
            <DialogHeader>
              <DialogTitle className="text-white">{shiftDialog === "new" ? "Add Shift" : "Shift Details"}</DialogTitle>
            </DialogHeader>
            {shiftDialog === "new" ? (
              <div className="space-y-3 pt-2 max-h-96 overflow-y-auto">
                <div>
                  <Label className="text-white">Employee</Label>
                  <select
                    value={form.employee_email}
                    onChange={e => {
                      const emp = employees.find(el => el.email === e.target.value);
                      setForm({ ...form, employee_email: e.target.value, employee_name: emp?.full_name || "" });
                    }}
                    className="w-full h-9 px-3 text-xs border border-[#1F1F24] rounded-lg bg-[#0B0B0D] text-white focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
                  >
                    <option value="">Select employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.email}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-white">Date</Label>
                    <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-[#0B0B0D] border-[#1F1F24] text-white" />
                  </div>
                  <div>
                    <Label className="text-white">Role</Label>
                    <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g., Server" className="bg-[#0B0B0D] border-[#1F1F24] text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-white">Start Time</Label>
                    <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="bg-[#0B0B0D] border-[#1F1F24] text-white" />
                  </div>
                  <div>
                    <Label className="text-white">End Time</Label>
                    <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="bg-[#0B0B0D] border-[#1F1F24] text-white" />
                  </div>
                  <div>
                    <Label className="text-white">Department</Label>
                    <select
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      className="w-full h-9 px-2 text-xs border border-[#1F1F24] rounded-lg bg-[#0B0B0D] text-white focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
                    >
                      <option value="">Select...</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-white">Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any notes..." className="bg-[#0B0B0D] border-[#1F1F24] text-white" />
                </div>
                <button
                  onClick={handleAddShift}
                  className="w-full h-10 bg-[#FF6A00] text-black font-bold rounded-lg active:scale-95 transition-transform text-sm"
                >
                  Add Shift
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280] mb-1">Details</p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">{shiftDialog.employee_name}</p>
                    <p className="text-xs text-[#6B7280]">{shiftDialog.role} • {shiftDialog.department}</p>
                    <p className="text-xs text-[#6B7280]">{shiftDialog.date} • {shiftDialog.start_time}–{shiftDialog.end_time}</p>
                  </div>
                </div>
                <button className="w-full h-9 bg-[#FF6A00] text-black text-xs font-bold rounded-lg active:scale-95 transition-transform">
                  Message
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* STICKY PRIMARY ACTION BUTTON */}
      {isAdmin && (
        <div className="fixed left-0 right-0 bottom-20 z-30 px-4 flex gap-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <button
            onClick={() => {
              if (activeTab === "today" || activeTab === "week") setShiftDialog("new");
              else if (activeTab === "import") setImportDialog(true);
              else if (activeTab === "requests") toast.info("Review requests below");
              else if (activeTab === "team") toast.info("Add team member via Team Directory");
            }}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] text-black text-sm font-bold active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5" /> 
            {activeTab === "today" ? "Add Shift" : activeTab === "week" ? "Add Weekly Shift" : activeTab === "team" ? "Add Member" : activeTab === "requests" ? "Review Requests" : "Import Schedule"}
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
        "w-full bg-[#141418] border rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-left hover:border-[#FF6A00]/50 transition-all active:scale-[0.99]",
        alert ? "border-red-500/40" : "border-[#1F1F24]",
        isActive && "border-emerald-500/40"
      )}
    >
      <div className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
        isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-[#FF6A00]/20 text-[#FF6A00]"
      )}>
        {emp?.full_name?.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{emp?.full_name || shift.employee_name}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-[#6B7280]">
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
        <ChevronRight className="h-4 w-4 text-[#6B7280]" />
      </div>
    </button>
  );
}

export const hideBase44Index = true;