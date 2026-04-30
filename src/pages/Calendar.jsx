import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, Trash2, Users, Package, Truck, ClipboardCheck, CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "large_party", label: "Large Party", icon: Users, color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { value: "order", label: "Order", icon: Package, color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "delivery", label: "Delivery", icon: Truck, color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "inventory", label: "Inventory", icon: ClipboardCheck, color: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
  { value: "other", label: "Other", icon: CalendarDays, color: "bg-muted text-muted-foreground border-border" },
];

const getCat = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[4];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDate, setDetailDate] = useState(null);
  const [form, setForm] = useState({ title: "", date: "", time: "", category: "large_party", notes: "", guest_count: "", recurrence: "none", recurrence_end_date: "" });
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());
  const [pickerYear, setPickerYear] = useState(today.getFullYear());

  useEffect(() => {
    base44.entities.CalendarEvent.list("-date", 500).then(e => { setEvents(e); setLoading(false); });
  }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const todayStr = today.toISOString().split("T")[0];

  const eventsForDate = (dateStr) => expandedEventsForDate(dateStr);

  // Expand recurring events into virtual instances for the current view
  const expandedEventsForDate = (dateStr) => {
    return events.filter(ev => {
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
    setForm({ title: "", date: dateStr, time: "", category: "large_party", notes: "", guest_count: "", recurrence: "none", recurrence_end_date: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form };
    if (payload.guest_count) payload.guest_count = Number(payload.guest_count);
    else delete payload.guest_count;
    if (!payload.recurrence_end_date) delete payload.recurrence_end_date;
    if (!payload.recurrence) payload.recurrence = "none";
    const created = await base44.entities.CalendarEvent.create(payload);
    setEvents(prev => [...prev, created]);
    setSaving(false);
    setDialogOpen(false);
    toast.success("Event added");
  };

  const handleDelete = async (id) => {
    await base44.entities.CalendarEvent.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Event removed");
  };

  const detailEvents = detailDate ? eventsForDate(detailDate) : [];

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">Parties, deliveries, orders and more</p>
        </div>
        <Button onClick={() => openNew(todayStr)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={"empty-" + i} className="min-h-[80px] border-b border-r border-border/50 bg-muted/20" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
            const dayEvents = eventsForDate(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = detailDate === dateStr;
            return (
              <div
                key={dateStr}
                onClick={() => openNew(dateStr)}
                className={cn(
                  "min-h-[80px] border-b border-r border-border/50 p-1.5 cursor-pointer transition-colors",
                  isSelected ? "bg-primary/10" : "hover:bg-secondary/40"
                )}
              >
                <div className="flex items-center mb-1">
                  <span className={cn(
                    "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    isToday ? "bg-primary text-primary-foreground text-xs" : "text-foreground"
                  )}>{day}</span>
                </div>
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
                    <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {detailDate && (
        <motion.div
          className="bg-card rounded-2xl border border-border p-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {new Date(detailDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            <Button size="sm" onClick={() => openNew(detailDate)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
          {detailEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events. Click "Add" to create one.</p>
          ) : (
            <div className="space-y-3">
              {detailEvents.map(ev => {
                const cat = getCat(ev.category);
                const CatIcon = cat.icon;
                return (
                  <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/20">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border", cat.color)}>
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{ev.title}</p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", cat.color)}>{cat.label}</span>
                        {ev.recurrence && ev.recurrence !== "none" && (
                          <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-muted text-muted-foreground border-border capitalize">{ev.recurrence}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        {ev.time && <span>{ev.time}</span>}
                        {ev.guest_count && <span>{ev.guest_count} guests</span>}
                      </div>
                      {ev.notes && <p className="text-xs text-muted-foreground mt-1">{ev.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => handleDelete(ev.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Upcoming events */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Upcoming Events</h2>
        {(() => {
          const upcoming = events.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);
          if (upcoming.length === 0) return (
            <div className="bg-card rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">No upcoming events.</div>
          );
          return (
            <div className="space-y-2">
              {upcoming.map(ev => {
                const cat = getCat(ev.category);
                const CatIcon = cat.icon;
                return (
                  <div key={ev.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border", cat.color)}>
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{ev.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        {ev.time && <span>· {ev.time}</span>}
                        {ev.guest_count && <span>· {ev.guest_count} guests</span>}
                      </div>
                      {ev.notes && <p className="text-xs text-muted-foreground truncate">{ev.notes}</p>}
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0", cat.color)}>{cat.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Add event dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
          <div>
            <Label>Title</Label>
            <Input placeholder="e.g., Smith party of 20, Wine delivery" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Popover open={pickerOpen} onOpenChange={open => {
                setPickerOpen(open);
                if (open && form.date) {
                  const d = new Date(form.date + "T12:00:00");
                  setPickerMonth(d.getMonth());
                  setPickerYear(d.getFullYear());
                }
              }}>
                <PopoverTrigger asChild>
                  <button type="button" className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm text-left hover:bg-secondary/40 transition-colors">
                    {form.date ? new Date(form.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : <span className="text-muted-foreground">Pick a date…</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  {(() => {
                    const pDays = getDaysInMonth(pickerYear, pickerMonth);
                    const pFirst = new Date(pickerYear, pickerMonth, 1).getDay();
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <button onClick={() => { if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(y => y-1); } else setPickerMonth(m => m-1); }} className="p-1 rounded hover:bg-secondary transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                          <span className="text-sm font-semibold">{MONTHS[pickerMonth]} {pickerYear}</span>
                          <button onClick={() => { if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(y => y+1); } else setPickerMonth(m => m+1); }} className="p-1 rounded hover:bg-secondary transition-colors"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                        <div className="grid grid-cols-7 text-center">
                          {DAYS.map(d => <div key={d} className="text-[10px] font-semibold text-muted-foreground pb-1">{d}</div>)}
                          {Array.from({ length: pFirst }).map((_, i) => <div key={"e"+i} />)}
                          {Array.from({ length: pDays }).map((_, i) => {
                            const d = i + 1;
                            const ds = pickerYear + "-" + String(pickerMonth+1).padStart(2,"0") + "-" + String(d).padStart(2,"0");
                            const isSelected = form.date === ds;
                            const isTod = ds === todayStr;
                            return (
                              <button key={d} type="button" onClick={() => { setForm(f => ({...f, date: ds})); setPickerOpen(false); }}
                                className={cn("h-7 w-7 mx-auto rounded-full text-xs transition-colors", isSelected ? "bg-primary text-primary-foreground" : isTod ? "border border-primary text-primary" : "hover:bg-secondary")}>
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </PopoverContent>
              </Popover>
              {form.date && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(form.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              )}
            </div>
              <div>
                <Label>Time (optional)</Label>
                <Input placeholder="e.g., 7:00 PM" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Guest Count (optional)</Label>
                <Input type="number" placeholder="e.g., 20" value={form.guest_count} onChange={e => setForm({ ...form, guest_count: e.target.value })} />
              </div>
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
            {form.recurrence !== "none" && (
              <div>
                <Label>Repeat Until (optional)</Label>
                <Input type="date" value={form.recurrence_end_date} onChange={e => setForm({ ...form, recurrence_end_date: e.target.value })} />
              </div>
            )}
            <div>
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Special requests, contacts, details..." rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? "Saving..." : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}