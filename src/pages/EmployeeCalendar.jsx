import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  CalendarDays, Plus, X, Save, ChevronLeft, ChevronRight,
  Calendar, BookOpen, Award, Cake, Heart, CheckCircle, AlertCircle, User, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, addMonths, subMonths, parseISO, addDays, isWithinInterval, isSameDay, startOfMonth, endOfMonth, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const EVENT_TYPES = [
  { value: "time_off", label: "Time Off", icon: Calendar, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "training", label: "Training", icon: BookOpen, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { value: "certification", label: "Certification", icon: Award, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "birthday", label: "Birthday", icon: Cake, color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  { value: "anniversary", label: "Anniversary", icon: Heart, color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "review", label: "Review", icon: CheckCircle, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "availability_change", label: "Availability Change", icon: AlertCircle, color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
];

const dotColors = {
  time_off: "bg-blue-500",
  training: "bg-cyan-500",
  certification: "bg-green-500",
  birthday: "bg-pink-500",
  anniversary: "bg-red-500",
  review: "bg-yellow-400",
  availability_change: "bg-orange-500",
};

function getTypeInfo(type) {
  return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
}

function getDateRange() {
  const today = new Date();
  return { start: today, end: addDays(today, 13) };
}

export default function EmployeeCalendar() {
  const { user, isAdmin } = useCurrentUser();
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { start: rangeStart, end: rangeEnd } = getDateRange();
  const departments = [...new Set(employees.map(e => e.role || "Staff"))].filter(Boolean);

  const [form, setForm] = useState({
    employee_email: "", employee_name: "", department: "",
    type: "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: "",
    title: "", notes: "", status: "approved", recurring: false
  });

  useEffect(() => {
    const load = async () => {
      const [evts, users] = await Promise.all([
        base44.entities.EmployeeCalendarEvent.list("-start_date", 500),
        base44.entities.User.list(),
      ]);
      setEvents(evts);
      setEmployees(users);
      setLoading(false);
    };
    load();
  }, []);

  const filteredEvents = events.filter(e => {
    if (selectedEmployee !== "all" && e.employee_email !== selectedEmployee) return false;
    if (selectedDepartment !== "all" && e.department !== selectedDepartment) return false;
    if (selectedType !== "all" && e.type !== selectedType) return false;
    return isWithinInterval(parseISO(e.start_date), { start: rangeStart, end: rangeEnd });
  });

  const eventsForDay = (day) =>
    events.filter(e => {
      const start = parseISO(e.start_date);
      const end = e.end_date ? parseISO(e.end_date) : start;
      return isWithinInterval(day, { start, end });
    });

  const eventsForSelected = selectedDate ? eventsForDay(selectedDate) : [];
  const upcomingEvents = filteredEvents.sort((a, b) => a.start_date.localeCompare(b.start_date));

  const openFormForDate = (day) => {
    setSelectedDate(day);
    setForm(f => ({ ...f, start_date: format(day, "yyyy-MM-dd") }));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.employee_email || !form.type || !form.start_date) {
      toast.error("Please fill required fields");
      return;
    }
    setSaving(true);
    const rec = await base44.entities.EmployeeCalendarEvent.create(form);
    setEvents(prev => [rec, ...prev]);
    setShowForm(false);
    setForm({
      employee_email: "", employee_name: "", department: "",
      type: "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: "",
      title: "", notes: "", status: "approved", recurring: false
    });
    setSaving(false);
    toast.success("Event added");
  };

  const handleDelete = async (id) => {
    await base44.entities.EmployeeCalendarEvent.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Removed");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const startPadding = getDay(startOfMonth(currentMonth));
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => 
    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1)
  );

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-primary" /> Employee Calendar
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Upcoming 14 days: time off, training, reviews, availability.</p>
        </div>
        <Button onClick={() => {
          setForm(f => ({ ...f, start_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd") }));
          setShowForm(true);
        }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(u => (
              <SelectItem key={u.email} value={u.email}>{u.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {departments.length > 1 && (
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {EVENT_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-lg">{format(currentMonth, "MMMM yyyy")}</h2>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {Array(startPadding).fill(null).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[80px] border-b border-r border-border/50 bg-muted/20" />
            ))}
            {calendarDays.map(day => {
              const dayEvents = eventsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => openFormForDate(day)}
                  className={cn(
                    "min-h-[80px] border-b border-r border-border/50 p-1.5 cursor-pointer transition-colors",
                    isSelected ? "bg-primary/10" : "hover:bg-secondary/40"
                  )}
                >
                  <div className="flex items-center mb-1">
                    <span className={cn(
                      "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      isToday ? "bg-primary text-primary-foreground text-xs" : "text-foreground"
                    )}>{format(day, "d")}</span>
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map(e => (
                      <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${dotColors[e.type] || "bg-gray-400"}`} />
                    ))}
                    {dayEvents.length > 3 && <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 px-5 py-3 border-t border-border">
            {EVENT_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${dotColors[t.value]}`} />
                {t.label}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming 14 days */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-3">Next 14 Days</h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events scheduled.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {upcomingEvents.map(ev => {
                  const info = getTypeInfo(ev.type);
                  const Icon = info.icon;
                  const isMultiDay = ev.end_date && ev.end_date > ev.start_date;
                  return (
                    <div
                      key={ev.id}
                      className={cn(
                        "rounded-lg border p-3 space-y-1 group hover:shadow-md transition-shadow",
                        info.color
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{ev.title || ev.employee_name}</p>
                            <p className="text-xs opacity-75">
                              {isMultiDay ? `${format(parseISO(ev.start_date), "MMM d")} - ${format(parseISO(ev.end_date), "MMM d")}` : format(parseISO(ev.start_date), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(ev.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {isAdmin && ev.notes && (
                        <p className="text-xs opacity-75 line-clamp-2">{ev.notes}</p>
                      )}
                      {ev.recurring && <p className="text-xs opacity-60">Repeats annually</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Employee *</Label>
              <Select value={form.employee_email} onValueChange={v => {
                const emp = employees.find(u => u.email === v);
                setForm(f => ({ ...f, employee_email: v, employee_name: emp?.full_name || v, department: emp?.role || "" }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {employees.map(u => (
                    <SelectItem key={u.email} value={u.email}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Event Type *</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Title / Summary</Label>
              <Input placeholder="e.g., Annual review, Certification course" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes (Manager Only)</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Internal notes..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={form.recurring}
                onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="recurring" className="text-sm font-normal cursor-pointer">Repeats annually</Label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving…" : "Add Event"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}