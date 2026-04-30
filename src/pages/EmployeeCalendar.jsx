import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  CalendarDays, Plus, X, Save, ChevronLeft, ChevronRight,
  AlertTriangle, ThumbsUp, ThumbsDown, Clock, UserX, User, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from "date-fns";

const EVENT_TYPES = [
  { value: "write_up", label: "Write-Up", icon: AlertTriangle, color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "positive_conversation", label: "Positive Conversation", icon: ThumbsUp, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "negative_conversation", label: "Negative Conversation", icon: ThumbsDown, color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { value: "late_arrival", label: "Late Arrival", icon: Clock, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "no_show", label: "No Show", icon: UserX, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
];

const dotColors = {
  write_up: "bg-red-500",
  positive_conversation: "bg-green-500",
  negative_conversation: "bg-orange-500",
  late_arrival: "bg-yellow-400",
  no_show: "bg-purple-500",
};

function getTypeInfo(type) {
  return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
}

export default function EmployeeCalendar() {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);

  const [form, setForm] = useState({
    employee_email: "", employee_name: "", date: format(new Date(), "yyyy-MM-dd"),
    type: "", notes: "", follow_up_date: ""
  });

  useEffect(() => {
    const load = async () => {
      const [evts, users] = await Promise.all([
        base44.entities.EmployeeEvent.list("-date", 500),
        base44.entities.User.list(),
      ]);
      setEvents(evts);
      setEmployees(users);
      setLoading(false);
    };
    load();
  }, []);

  const filteredEvents = selectedEmployee === "all"
    ? events
    : events.filter(e => e.employee_email === selectedEmployee);

  const eventsForDay = (day) =>
    filteredEvents.filter(e => e.date && isSameDay(parseISO(e.date), day));

  const eventsForSelected = selectedDate ? eventsForDay(selectedDate) : [];

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPadding = getDay(startOfMonth(currentMonth));

  const handleSave = async () => {
    if (!form.employee_email || !form.type || !form.date) {
      toast.error("Please fill in required fields");
      return;
    }
    setSaving(true);
    const user = await base44.auth.me();
    const rec = await base44.entities.EmployeeEvent.create({
      ...form,
      logged_by: user?.full_name || user?.email || "Manager",
    });
    setEvents(prev => [rec, ...prev]);
    setShowForm(false);
    setForm({ employee_email: "", employee_name: "", date: format(new Date(), "yyyy-MM-dd"), type: "", notes: "", follow_up_date: "" });
    setSaving(false);
    toast.success("Event logged");
  };

  const handleDelete = async (id) => {
    await base44.entities.EmployeeEvent.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Removed");
  };

  const employeeStats = (email) => {
    const emp = events.filter(e => e.employee_email === email);
    return EVENT_TYPES.map(t => ({ ...t, count: emp.filter(e => e.type === t.value).length }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-primary" /> Employee Calendar
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Track write-ups, conversations, attendance patterns — management only.</p>
        </div>
        <Button onClick={() => { setForm(f => ({ ...f, date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd") })); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Log Event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(u => (
              <SelectItem key={u.email} value={u.email}>{u.full_name || u.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedEmployee !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => setViewEmployee(selectedEmployee)} className="gap-1 text-primary">
            <User className="h-3.5 w-3.5" /> View Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
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

          <div className="grid grid-cols-7 gap-px mb-1">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px">
            {Array(startPadding).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const dayEvents = eventsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setForm(f => ({ ...f, date: format(day, "yyyy-MM-dd") }));
                    setShowForm(true);
                  }}
                >
                  <span className={`text-xs font-medium block text-center mb-1 ${isToday ? "text-primary font-bold" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {dayEvents.slice(0, 3).map(e => (
                      <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${dotColors[e.type] || "bg-gray-400"}`} />
                    ))}
                    {dayEvents.length > 3 && <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
            {EVENT_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${dotColors[t.value]}`} />
                {t.label}
              </div>
            ))}
          </div>
        </div>

        {/* Day detail / recent */}
        <div className="space-y-4">
          {selectedDate ? (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold mb-3">{format(selectedDate, "MMMM d, yyyy")}</h3>
              {eventsForSelected.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events on this day.</p>
              ) : (
                <div className="space-y-3">
                  {eventsForSelected.map(ev => {
                    const info = getTypeInfo(ev.type);
                    const Icon = info.icon;
                    return (
                      <div key={ev.id} className={`rounded-xl border p-3 ${info.color}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold">{ev.employee_name}</p>
                              <p className="text-xs opacity-80">{info.label}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDelete(ev.id)} className="opacity-50 hover:opacity-100 transition-opacity">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {ev.notes && <p className="text-xs mt-2 opacity-80">{ev.notes}</p>}
                        {ev.follow_up_date && <p className="text-xs mt-1 opacity-60">Follow-up: {ev.follow_up_date}</p>}
                        {ev.logged_by && <p className="text-xs mt-1 opacity-50">Logged by {ev.logged_by}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Recent Events</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {filteredEvents.slice(0, 15).map(ev => {
                  const info = getTypeInfo(ev.type);
                  const Icon = info.icon;
                  return (
                    <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                      <Icon className={`h-4 w-4 flex-shrink-0 ${info.color.split(" ")[1]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ev.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{info.label} · {ev.date}</p>
                      </div>
                    </div>
                  );
                })}
                {filteredEvents.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
              </div>
            </div>
          )}

          {/* Employee summary */}
          {selectedEmployee !== "all" && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Pattern Summary</h3>
              <div className="space-y-2">
                {employeeStats(selectedEmployee).map(t => (
                  <div key={t.value} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`h-2 w-2 rounded-full ${dotColors[t.value]}`} />
                      {t.label}
                    </div>
                    <span className={`text-sm font-semibold ${t.count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      {t.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Event Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Employee Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Employee</Label>
              <Select value={form.employee_email} onValueChange={v => {
                const emp = employees.find(u => u.email === v);
                setForm(f => ({ ...f, employee_email: v, employee_name: emp?.full_name || v }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(u => (
                    <SelectItem key={u.email} value={u.email}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Event Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Details about the conversation or incident..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Follow-Up Date (optional)</Label>
              <Input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-1" />{saving ? "Saving…" : "Log Event"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}