import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronLeft, ChevronRight, Trash2, X, CalendarDays, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, addDays, parseISO, isWithinInterval } from "date-fns";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const ALL_CATEGORIES = [
  { value: "restaurant_event",  label: "Restaurant Event",       color: "bg-primary/20 text-primary border-primary/40",           dot: "bg-primary" },
  { value: "private_event",     label: "Private Event",          color: "bg-purple-500/15 text-purple-400 border-purple-500/30",   dot: "bg-purple-500" },
  { value: "catering",          label: "Catering",               color: "bg-blue-500/15 text-blue-400 border-blue-500/30",         dot: "bg-blue-500" },
  { value: "reservation_buyout",label: "Reservation / Buyout",   color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",   dot: "bg-indigo-500" },
  { value: "maintenance",       label: "Maintenance",            color: "bg-orange-500/15 text-orange-400 border-orange-500/30",   dot: "bg-orange-500" },
  { value: "inspection",        label: "Inspection",             color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",   dot: "bg-yellow-500" },
  { value: "vendor_deadline",   label: "Vendor Deadline",        color: "bg-amber-500/15 text-amber-400 border-amber-500/30",      dot: "bg-amber-500" },
  { value: "staff_meeting",     label: "Staff Meeting",          color: "bg-teal-500/15 text-teal-400 border-teal-500/30",         dot: "bg-teal-500" },
  { value: "training",          label: "Training",               color: "bg-green-500/15 text-green-400 border-green-500/30",      dot: "bg-green-500" },
  { value: "time_off",          label: "Employee Time Off",      color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",         dot: "bg-cyan-500", employee: true, sensitive: false },
  { value: "review",            label: "Employee Review",        color: "bg-rose-500/15 text-rose-400 border-rose-500/30",         dot: "bg-rose-500",  employee: true, sensitive: true },
  { value: "certification",     label: "Certification Expiration",color: "bg-lime-500/15 text-lime-400 border-lime-500/30",        dot: "bg-lime-500",  employee: true, sensitive: false },
  { value: "onboarding",        label: "Onboarding",             color: "bg-sky-500/15 text-sky-400 border-sky-500/30",            dot: "bg-sky-500",   employee: true, sensitive: false },
  { value: "availability_change",label: "Availability Change",   color: "bg-violet-500/15 text-violet-400 border-violet-500/30",  dot: "bg-violet-500",employee: true, sensitive: true },
  { value: "holiday",           label: "Holiday",                color: "bg-red-500/15 text-red-400 border-red-500/30",            dot: "bg-red-500" },
  { value: "other",             label: "Other",                  color: "bg-muted text-muted-foreground border-border",            dot: "bg-muted-foreground" },
];

const VIEW_FILTERS = [
  { id: "all",         label: "All",                       cats: null },
  { id: "restaurant",  label: "Restaurant Events",          cats: ["restaurant_event","private_event","catering","reservation_buyout","holiday","staff_meeting","other"] },
  { id: "employee",    label: "Employee Events",            cats: ["time_off","review","certification","onboarding","availability_change"] },
  { id: "maintenance", label: "Maintenance & Inspections",  cats: ["maintenance","inspection","vendor_deadline"] },
  { id: "training",    label: "Training",                   cats: ["training"] },
  { id: "private",     label: "Private / Catering",         cats: ["private_event","catering","reservation_buyout"] },
];

const SENSITIVE_TYPES = new Set(["review", "availability_change"]);

const QUICK_TYPES = [
  { label: "Restaurant Event", category: "restaurant_event" },
  { label: "Private Event", category: "private_event" },
  { label: "Maintenance Visit", category: "maintenance" },
  { label: "Training", category: "training" },
  { label: "Employee Event", category: "time_off" },
];

function getCat(val) {
  return ALL_CATEGORIES.find(c => c.value === val) || ALL_CATEGORIES[ALL_CATEGORIES.length - 1];
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  return date;
}

function emptyForm(category = "restaurant_event", date = "") {
  return { title: "", date: date || format(new Date(), "yyyy-MM-dd"), end_date: "", time: "", category, employee_email: "", employee_name: "", notes: "", staffing_notes: "", guest_count: "", is_sensitive: false, recurrence: "none", recurrence_end_date: "" };
}

const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function Calendar() {
  const { user, isAdmin } = useCurrentUser();
  const isManager = isAdmin || user?.role === "manager";

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [view, setView] = useState(window.innerWidth < 768 ? "agenda" : "week");
  const [viewFilter, setViewFilter] = useState("all");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [weekStart, setWeekStart] = useState(getMonday(today));
  const [dayDate, setDayDate] = useState(todayStr);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);

  // Read URL filter param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get("filter");
    if (f && VIEW_FILTERS.find(v => v.id === f)) setViewFilter(f);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    Promise.all([
      base44.entities.CalendarEvent.list("-date", 800),
      base44.entities.User.list(),
    ]).then(([evts, users]) => {
      setEvents(evts);
      setEmployees(users);
      setLoading(false);
    });
  }, []);

  // Role-based visibility filter
  const visibleEvents = events.filter(ev => {
    const cat = getCat(ev.category);
    // Sensitive events hidden from non-managers
    if (ev.is_sensitive && !isManager) return false;
    if (SENSITIVE_TYPES.has(ev.category) && !isManager) return false;
    // Staff can only see public events + their own employee events
    if (!isManager && cat.employee) {
      return ev.employee_email === user?.email;
    }
    return true;
  });

  // View filter
  const activeFilterCats = VIEW_FILTERS.find(v => v.id === viewFilter)?.cats;
  const filteredEvents = activeFilterCats ? visibleEvents.filter(e => activeFilterCats.includes(e.category)) : visibleEvents;

  const expandedEventsForDate = (dateStr) => {
    return filteredEvents.filter(ev => {
      if (ev.date === dateStr) return true;
      // Multi-day span
      if (ev.end_date && ev.end_date > ev.date && dateStr > ev.date && dateStr <= ev.end_date) return true;
      if (!ev.recurrence || ev.recurrence === "none") return false;
      const start = new Date(ev.date + "T12:00:00");
      const target = new Date(dateStr + "T12:00:00");
      if (target <= start) return false;
      if (ev.recurrence_end_date && dateStr > ev.recurrence_end_date) return false;
      const diff = Math.round((target - start) / 86400000);
      if (ev.recurrence === "daily") return true;
      if (ev.recurrence === "weekly") return diff % 7 === 0;
      if (ev.recurrence === "monthly") return start.getDate() === target.getDate();
      if (ev.recurrence === "yearly") return start.getDate() === target.getDate() && start.getMonth() === target.getMonth();
      return false;
    });
  };

  const openNew = (dateStr, category) => {
    setForm(emptyForm(category || "restaurant_event", dateStr));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form };
    if (payload.guest_count) payload.guest_count = Number(payload.guest_count); else delete payload.guest_count;
    if (!payload.recurrence_end_date) delete payload.recurrence_end_date;
    if (!payload.end_date) delete payload.end_date;
    if (!payload.employee_email) delete payload.employee_email;
    const created = await base44.entities.CalendarEvent.create(payload);
    setEvents(prev => [created, ...prev]);
    setSaving(false);
    setDialogOpen(false);
    toast.success("Event added");
  };

  const handleDelete = async (id) => {
    await base44.entities.CalendarEvent.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    setDetailEvent(null);
    toast.success("Deleted");
  };

  const isEmployeeCategory = (cat) => getCat(cat)?.employee;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 pb-12 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" /> Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{format(today, "EEEE, MMMM d, yyyy")}</p>
        </div>
        {isManager && (
          <div className="flex gap-2 flex-wrap">
            {QUICK_TYPES.map(qt => (
              <Button key={qt.category} size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => openNew(todayStr, qt.category)}>
                <Plus className="h-3 w-3" />{qt.label}
              </Button>
            ))}
          </div>
        )}
        {!isManager && (
          <Button onClick={() => openNew(todayStr)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        )}
      </div>

      {/* View Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {VIEW_FILTERS.map(vf => (
          <button key={vf.id}
            onClick={() => setViewFilter(vf.id)}
            className={cn("whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              viewFilter === vf.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}
          >
            {vf.label}
          </button>
        ))}
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
          {(!isMobile ? ["week","month","day","agenda"] : ["agenda","week","month"]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn("px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all",
                view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
            >{v}</button>
          ))}
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
          setYear(today.getFullYear()); setMonth(today.getMonth());
          setWeekStart(getMonday(today)); setDayDate(todayStr);
        }}>Today</Button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">{filteredEvents.length} events</span>
      </div>

      {/* Upcoming 7 Days strip */}
      <UpcomingStrip events={filteredEvents} todayStr={todayStr} onEventClick={setDetailEvent} />

      {/* Calendar Views */}
      {view === "month" && <MonthView year={year} month={month}
        prevMonth={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
        nextMonth={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
        todayStr={todayStr} expandedEventsForDate={expandedEventsForDate} openNew={isManager ? openNew : null}
        onEventClick={setDetailEvent}
      />}
      {view === "week" && <WeekView weekStart={weekStart}
        prevWeek={() => setWeekStart(new Date(weekStart.getTime() - 7 * 86400000))}
        nextWeek={() => setWeekStart(new Date(weekStart.getTime() + 7 * 86400000))}
        todayStr={todayStr} expandedEventsForDate={expandedEventsForDate} openNew={isManager ? openNew : null}
        onEventClick={setDetailEvent}
      />}
      {view === "day" && <DayView date={dayDate} setDate={setDayDate} expandedEventsForDate={expandedEventsForDate} openNew={isManager ? openNew : null} onEventClick={setDetailEvent} />}
      {view === "agenda" && <AgendaView events={filteredEvents} todayStr={todayStr} openNew={isManager ? openNew : null} onEventClick={setDetailEvent} />}

      {/* Event Detail Dialog */}
      {detailEvent && (
        <Dialog open={!!detailEvent} onOpenChange={() => setDetailEvent(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{detailEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm mt-1">
              {(() => { const cat = getCat(detailEvent.category); return <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", cat.color)}>{cat.label}</span>; })()}
              <p className="text-muted-foreground">{detailEvent.date}{detailEvent.end_date && detailEvent.end_date !== detailEvent.date ? ` – ${detailEvent.end_date}` : ""}{detailEvent.time ? ` · ${detailEvent.time}` : ""}</p>
              {detailEvent.employee_name && <p><span className="font-semibold">Employee:</span> {detailEvent.employee_name}</p>}
              {detailEvent.guest_count && <p><span className="font-semibold">Guests:</span> {detailEvent.guest_count}</p>}
              {detailEvent.notes && <p><span className="font-semibold">Notes:</span> {detailEvent.notes}</p>}
              {isManager && detailEvent.staffing_notes && <p><span className="font-semibold">Staffing:</span> {detailEvent.staffing_notes}</p>}
              {isAdmin && (
                <Button variant="destructive" size="sm" className="w-full mt-2" onClick={() => handleDelete(detailEvent.id)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Event
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input placeholder="Event title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-11" />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Time</Label>
              <Input placeholder="e.g., 7:00 PM" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
            {isEmployeeCategory(form.category) && (
              <div>
                <Label>Employee</Label>
                <Select value={form.employee_email} onValueChange={v => {
                  const emp = employees.find(u => u.email === v);
                  setForm(f => ({ ...f, employee_email: v, employee_name: emp?.full_name || v }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(u => <SelectItem key={u.email} value={u.email}>{u.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(form.category === "private_event" || form.category === "catering" || form.category === "reservation_buyout") && (
              <div>
                <Label>Guest Count</Label>
                <Input type="number" placeholder="e.g., 50" value={form.guest_count} onChange={e => setForm({ ...form, guest_count: e.target.value })} />
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Details..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            {isManager && (
              <div>
                <Label>Staffing Notes</Label>
                <Textarea placeholder="Staffing requirements..." value={form.staffing_notes} onChange={e => setForm({ ...form, staffing_notes: e.target.value })} rows={2} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Recurrence</Label>
                <Select value={form.recurrence} onValueChange={v => setForm({ ...form, recurrence: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.recurrence !== "none" && (
                <div>
                  <Label>Repeat Until</Label>
                  <Input type="date" value={form.recurrence_end_date} onChange={e => setForm({ ...form, recurrence_end_date: e.target.value })} />
                </div>
              )}
            </div>
            {isManager && SENSITIVE_TYPES.has(form.category) && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_sensitive} onChange={e => setForm({ ...form, is_sensitive: e.target.checked })} />
                Mark as Sensitive (HR only)
              </label>
            )}
            <Button onClick={handleSave} disabled={saving || !form.title.trim()} className="w-full h-11">
              {saving ? "Saving..." : "Add Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;

// ── Upcoming 7-day strip ─────────────────────────────────────────────────────
function UpcomingStrip({ events, todayStr, onEventClick }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(todayStr + "T12:00:00"), i);
    return format(d, "yyyy-MM-dd");
  });
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map(dateStr => {
        const dayEvts = events.filter(e => e.date === dateStr);
        const d = new Date(dateStr + "T12:00:00");
        const isToday = dateStr === todayStr;
        return (
          <div key={dateStr} className={cn("rounded-lg p-2 border text-center", isToday ? "border-primary/50 bg-primary/5" : "border-border bg-card")}>
            <p className={cn("text-[10px] font-semibold uppercase", isToday ? "text-primary" : "text-muted-foreground")}>{format(d, "EEE")}</p>
            <p className={cn("text-sm font-bold mt-0.5", isToday ? "text-primary" : "")}>{format(d, "d")}</p>
            <div className="flex justify-center flex-wrap gap-0.5 mt-1">
              {dayEvts.slice(0, 3).map(ev => (
                <button key={ev.id} onClick={() => onEventClick(ev)} className={cn("h-1.5 w-1.5 rounded-full", getCat(ev.category).dot)} title={ev.title} />
              ))}
              {dayEvts.length > 3 && <span className="text-[8px] text-muted-foreground">+{dayEvts.length - 3}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Agenda View ──────────────────────────────────────────────────────────────
function AgendaView({ events, todayStr, openNew, onEventClick }) {
  const upcoming = events.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="space-y-2">
      {openNew && (
        <Button onClick={() => openNew(todayStr)} size="sm" variant="outline" className="gap-1.5 w-full">
          <Plus className="h-4 w-4" /> Add Event
        </Button>
      )}
      {upcoming.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">No upcoming events</div>
      ) : upcoming.map(ev => {
        const cat = getCat(ev.category);
        const d = new Date(ev.date + "T12:00:00");
        return (
          <button key={ev.id} onClick={() => onEventClick(ev)} className={cn("w-full text-left bg-card rounded-lg border p-3 flex items-start gap-3 hover:opacity-80 transition-opacity", cat.color)}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{ev.title}</p>
              <p className="text-xs opacity-75">{format(d, "EEE MMM d")}{ev.time ? ` · ${ev.time}` : ""}{ev.employee_name ? ` · ${ev.employee_name}` : ""}</p>
              {ev.notes && <p className="text-xs opacity-60 mt-0.5 line-clamp-1">{ev.notes}</p>}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full border font-medium shrink-0">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Month View ───────────────────────────────────────────────────────────────
function MonthView({ year, month, prevMonth, nextMonth, todayStr, expandedEventsForDate, openNew, onEventClick }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary"><ChevronLeft className="h-5 w-5" /></button>
        <h2 className="text-base font-semibold">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary"><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_SHORT.map(d => <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => <div key={"e" + i} className="min-h-[72px] border-b border-r border-border/50 bg-muted/10" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvts = expandedEventsForDate(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div key={dateStr} onClick={() => openNew && openNew(dateStr)} className={cn("min-h-[72px] border-b border-r border-border/50 p-1 cursor-pointer hover:bg-secondary/30", isToday && "bg-primary/8")}>
                <span className={cn("text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full", isToday ? "bg-primary text-primary-foreground" : "")}>{day}</span>
                <div className="space-y-0.5 mt-0.5">
                  {dayEvts.slice(0, 2).map(ev => {
                    const cat = getCat(ev.category);
                    return <button key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }} className={cn("text-[10px] px-1 py-0.5 rounded border truncate w-full font-medium text-left", cat.color)}>{ev.title}</button>;
                  })}
                  {dayEvts.length > 2 && <p className="text-[9px] text-muted-foreground pl-1">+{dayEvts.length - 2}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Week View ────────────────────────────────────────────────────────────────
function WeekView({ weekStart, prevWeek, nextWeek, todayStr, expandedEventsForDate, openNew, onEventClick }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-secondary"><ChevronLeft className="h-5 w-5" /></button>
        <span className="text-sm font-semibold">
          {format(days[0], "MMM d")} – {format(days[6], "MMM d, yyyy")}
        </span>
        <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-secondary"><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <div className="grid gap-px min-w-[600px]" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
          {days.map((d, i) => {
            const dateStr = format(d, "yyyy-MM-dd");
            const dayEvts = expandedEventsForDate(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div key={i} className={cn("border-r border-border last:border-r-0 min-h-[160px] p-2 cursor-pointer hover:bg-secondary/30", isToday && "bg-primary/5")}
                onClick={() => openNew && openNew(dateStr)}>
                <p className={cn("text-xs font-semibold mb-2", isToday ? "text-primary" : "text-muted-foreground")}>{format(d, "EEE d")}</p>
                <div className="space-y-1">
                  {dayEvts.map(ev => {
                    const cat = getCat(ev.category);
                    return (
                      <button key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                        className={cn("text-[10px] px-1 py-0.5 rounded border truncate w-full font-medium text-left", cat.color)}>
                        {ev.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Day View ─────────────────────────────────────────────────────────────────
function DayView({ date, setDate, expandedEventsForDate, openNew, onEventClick }) {
  const d = new Date(date + "T12:00:00");
  const dayEvts = expandedEventsForDate(date);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setDate(format(addDays(d, -1), "yyyy-MM-dd"))}><ChevronLeft className="h-4 w-4" /></Button>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="max-w-xs" />
        <Button size="sm" variant="outline" onClick={() => setDate(format(addDays(d, 1), "yyyy-MM-dd"))}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{format(d, "EEEE, MMMM d")}</h3>
          {openNew && <Button size="sm" onClick={() => openNew(date)}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>}
        </div>
        {dayEvts.length === 0 ? <p className="text-sm text-muted-foreground">No events</p> : (
          <div className="space-y-2">
            {dayEvts.map(ev => {
              const cat = getCat(ev.category);
              return (
                <button key={ev.id} onClick={() => onEventClick(ev)} className={cn("w-full text-left p-3 rounded-lg border", cat.color)}>
                  <p className="font-semibold text-sm">{ev.title}</p>
                  {ev.time && <p className="text-xs opacity-75">{ev.time}</p>}
                  {ev.employee_name && <p className="text-xs opacity-75">{ev.employee_name}</p>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}