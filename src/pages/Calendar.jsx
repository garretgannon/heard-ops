import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "private_event", label: "Private Event", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { value: "holiday", label: "Holiday", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  { value: "catering", label: "Catering", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "maintenance", label: "Maintenance", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  { value: "inspection", label: "Inspection", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  { value: "training", label: "Training", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  { value: "staff_event", label: "Staff Event", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  { value: "promo", label: "Promo", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
];

const getCat = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[0];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYNAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [weekStart, setWeekStart] = useState(getMonday(today));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("week");
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState(new Set(CATEGORIES.map(c => c.value)));
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setView(isMobile ? "agenda" : "week");
  }, [isMobile]);

  useEffect(() => {
    base44.entities.CalendarEvent.list("-date", 500).then(e => { setEvents(e); setLoading(false); });
  }, []);

  const todayStr = today.toISOString().split("T")[0];

  const toggleFilter = (cat) => {
    const updated = new Set(filters);
    if (updated.has(cat)) updated.delete(cat);
    else updated.add(cat);
    setFilters(updated);
  };

  const filteredEvents = events.filter(e => filters.has(e.category));

  const expandedEventsForDate = (dateStr) => {
    return filteredEvents.filter(ev => {
      if (ev.date === dateStr) return true;
      if (!ev.recurrence || ev.recurrence === "none") return false;
      const start = new Date(ev.date + "T12:00:00");
      const target = new Date(dateStr + "T12:00:00");
      if (target <= start) return false;
      if (ev.recurrence_end_date && dateStr > ev.recurrence_end_date) return false;
      const diff = Math.round((target - start) / (1000 * 60 * 60 * 24));
      if (ev.recurrence === "daily") return true;
      if (ev.recurrence === "weekly") return diff % 7 === 0;
      if (ev.recurrence === "monthly") return start.getDate() === target.getDate();
      if (ev.recurrence === "yearly") return start.getDate() === target.getDate() && start.getMonth() === target.getMonth();
      return false;
    });
  };

  const openNew = (dateStr) => {
    setForm({ ...emptyForm(), date: dateStr });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form };
    if (payload.guest_count) payload.guest_count = Number(payload.guest_count);
    else delete payload.guest_count;
    if (!payload.recurrence_end_date) delete payload.recurrence_end_date;
    const created = await base44.entities.CalendarEvent.create(payload);
    setEvents(prev => [...prev, created]);
    setSaving(false);
    setDialogOpen(false);
    setForm(emptyForm());
    toast.success("Event added");
  };

  const handleDelete = async (id) => {
    await base44.entities.CalendarEvent.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Deleted");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold">Calendar</h1>
        <Button onClick={() => openNew(todayStr)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Event
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {!isMobile && (
          <>
            <Button size="sm" variant={view === "month" ? "default" : "outline"} onClick={() => setView("month")}>
              Month
            </Button>
            <Button size="sm" variant={view === "week" ? "default" : "outline"} onClick={() => setView("week")}>
              Week
            </Button>
            <Button size="sm" variant={view === "day" ? "default" : "outline"} onClick={() => setView("day")}>
              Day
            </Button>
          </>
        )}
        <Button size="sm" variant={view === "agenda" ? "default" : "outline"} onClick={() => setView("agenda")}>
          Agenda
        </Button>
        <div className="flex-1" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => toggleFilter(cat.value)}
            className={cn(
              "text-xs px-2 py-1 rounded-full border font-medium transition-colors",
              filters.has(cat.value) ? cat.color : "bg-muted text-muted-foreground border-border opacity-50"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Views */}
      {view === "month" && <MonthView year={year} month={month} prevMonth={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }} nextMonth={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }} todayStr={todayStr} expandedEventsForDate={expandedEventsForDate} openNew={openNew} />}
      {view === "week" && <WeekView weekStart={weekStart} prevWeek={() => setWeekStart(new Date(weekStart.getTime() - 7 * 86400000))} nextWeek={() => setWeekStart(new Date(weekStart.getTime() + 7 * 86400000))} expandedEventsForDate={expandedEventsForDate} openNew={openNew} />}
      {view === "day" && <DayView selectedDate={selectedDate || todayStr} setSelectedDate={setSelectedDate} expandedEventsForDate={expandedEventsForDate} openNew={openNew} />}
      {view === "agenda" && <AgendaView events={filteredEvents} todayStr={todayStr} openNew={openNew} />}

      {/* Day detail */}
      {selectedDate && view === "month" && (
        <EventDetail date={selectedDate} events={expandedEventsForDate(selectedDate)} openNew={openNew} handleDelete={handleDelete} />
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input placeholder="e.g., Private party, Health inspection" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Time</Label>
                <Input placeholder="e.g., 7:00 PM" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Guest Count</Label>
                <Input type="number" placeholder="e.g., 50" value={form.guest_count} onChange={e => setForm({ ...form, guest_count: e.target.value })} />
              </div>
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
            </div>
            {form.recurrence !== "none" && (
              <div>
                <Label>Repeat Until</Label>
                <Input type="date" value={form.recurrence_end_date} onChange={e => setForm({ ...form, recurrence_end_date: e.target.value })} />
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Details, contacts..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Staffing Notes</Label>
              <Textarea placeholder="Staffing requirements, schedule changes..." value={form.staffing_notes} onChange={e => setForm({ ...form, staffing_notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? "Saving..." : "Add"} Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function emptyForm() {
  const today = new Date();
  return {
    title: "",
    date: today.toISOString().split("T")[0],
    time: "",
    category: "private_event",
    notes: "",
    staffing_notes: "",
    guest_count: "",
    recurrence: "none",
    recurrence_end_date: ""
  };
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function MonthView({ year, month, prevMonth, nextMonth, todayStr, expandedEventsForDate, openNew }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={"e" + i} className="min-h-[80px] border-b border-r border-border/50 bg-muted/20" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
            const dayEvents = expandedEventsForDate(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div
                key={dateStr}
                onClick={() => openNew(dateStr)}
                className={cn(
                  "min-h-[80px] border-b border-r border-border/50 p-1.5 cursor-pointer hover:bg-secondary/40",
                  isToday && "bg-primary/10"
                )}
              >
                <span className={cn("text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1", isToday && "bg-primary text-primary-foreground text-xs")}>{day}</span>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map(ev => {
                    const cat = getCat(ev.category);
                    return (
                      <div key={ev.id} className={cn("text-[10px] px-1.5 py-0.5 rounded border truncate font-medium", cat.color)}>
                        {ev.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 2}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekView({ weekStart, prevWeek, nextWeek, expandedEventsForDate, openNew }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">
          {days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {days[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-secondary">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(7, minmax(100px, 1fr))" }}>
          {days.map((d, i) => {
            const dateStr = d.toISOString().split("T")[0];
            const dayEvents = expandedEventsForDate(dateStr);
            return (
              <div key={i} className="border-r border-border last:border-r-0 min-h-[200px] p-2 hover:bg-secondary/40 cursor-pointer" onClick={() => openNew(dateStr)}>
                <p className="text-xs font-semibold mb-2">{DAYNAMES[d.getDay()].slice(0, 3)} {d.getDate()}</p>
                <div className="space-y-1">
                  {dayEvents.map(ev => {
                    const cat = getCat(ev.category);
                    return (
                      <div key={ev.id} className={cn("text-[10px] px-1 py-0.5 rounded border truncate font-medium", cat.color)}>
                        {ev.title}
                      </div>
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

function DayView({ selectedDate, setSelectedDate, expandedEventsForDate, openNew }) {
  const d = new Date(selectedDate + "T12:00:00");
  const dayEvents = expandedEventsForDate(selectedDate);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => {
          const prev = new Date(d);
          prev.setDate(prev.getDate() - 1);
          setSelectedDate(prev.toISOString().split("T")[0]);
        }}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="max-w-xs" />
        <Button size="sm" variant="outline" onClick={() => {
          const next = new Date(d);
          next.setDate(next.getDate() + 1);
          setSelectedDate(next.toISOString().split("T")[0]);
        }}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="font-semibold mb-3">{d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h3>
        {dayEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events</p>
        ) : (
          <div className="space-y-2">
            {dayEvents.map(ev => {
              const cat = getCat(ev.category);
              return (
                <div key={ev.id} className={cn("p-2 rounded border", cat.color)}>
                  <p className="font-medium text-sm">{ev.title}</p>
                  {ev.time && <p className="text-xs text-muted-foreground">{ev.time}</p>}
                  {ev.notes && <p className="text-xs text-muted-foreground mt-1">{ev.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AgendaView({ events, todayStr, openNew }) {
  const upcoming = events.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-2">
      {upcoming.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          No upcoming events
        </div>
      ) : (
        upcoming.map(ev => {
          const cat = getCat(ev.category);
          const d = new Date(ev.date + "T12:00:00");
          return (
            <div key={ev.id} className={cn("bg-card rounded-lg border p-3 flex items-start gap-3", cat.color)}>
              <div className="flex-1">
                <p className="font-medium text-sm">{ev.title}</p>
                <p className="text-xs text-muted-foreground">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{ev.time && ` at ${ev.time}`}</p>
                {ev.notes && <p className="text-xs text-muted-foreground mt-1">{ev.notes}</p>}
              </div>
              <span className="text-xs px-2 py-1 rounded-full border font-medium">{cat.label}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

export const hideBase44Index = true;

function EventDetail({ date, events, openNew, handleDelete }) {
  const d = new Date(date + "T12:00:00");

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          {d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </h3>
        <Button size="sm" onClick={() => openNew(date)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events</p>
      ) : (
        <div className="space-y-2">
          {events.map(ev => {
            const cat = getCat(ev.category);
            return (
              <div key={ev.id} className={cn("p-3 rounded-lg border flex items-start gap-3", cat.color)}>
                <div className="flex-1">
                  <p className="font-medium text-sm">{ev.title}</p>
                  {ev.time && <p className="text-xs text-muted-foreground">{ev.time}</p>}
                  {ev.guest_count && <p className="text-xs text-muted-foreground">{ev.guest_count} guests</p>}
                  {ev.notes && <p className="text-xs text-muted-foreground mt-1">{ev.notes}</p>}
                  {ev.staffing_notes && <p className="text-xs text-muted-foreground mt-1">Staffing: {ev.staffing_notes}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(ev.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}