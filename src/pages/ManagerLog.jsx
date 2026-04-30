import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, ChevronLeft, ChevronRight, X, Save, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const COLOR_MAP = {
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  green: "bg-green-500/20 text-green-400 border-green-500/30",
  red: "bg-red-500/20 text-red-400 border-red-500/30",
  yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  teal: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  indigo: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  slate: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const getDefaultCategories = () => [
  { name: "General", color: "blue" },
  { name: "Incident", color: "red" },
  { name: "Maintenance", color: "orange" },
  { name: "Staff", color: "purple" },
  { name: "Food Safety", color: "yellow" },
  { name: "Financial", color: "green" },
];

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function ManagerLog() {
  const [logs, setLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "", author_name: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "blue" });
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [l, me, cats] = await Promise.all([
        base44.entities.ManagerLog.list("-date", 300),
        base44.auth.me(),
        base44.entities.LogCategory.list(),
      ]);
      setLogs(l);
      setUser(me);
      setIsAdmin(me?.role === "admin");
      const finalCats = cats.length > 0 ? cats : getDefaultCategories().map((c, i) => ({ ...c, id: `default-${i}` }));
      setCategories(finalCats);
      if (finalCats.length > 0) setForm(f => ({ ...f, category: finalCats[0].name }));
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
      setLoading(false);
    };
    load();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calCells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const logsOnDate = (dateStr) => logs.filter(l => l.date === dateStr);

  const toDateStr = (day) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const selectedLogs = selectedDate ? logsOnDate(selectedDate) : [];
  const today = new Date().toISOString().split("T")[0];

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", body: "", category: categories[0]?.name || "", author_name: user?.full_name || "" });
    setShowForm(true);
  };

  const openEdit = (log) => {
    setEditing(log);
    setForm({ title: log.title, body: log.body || "", category: log.category || categories[0]?.name || "", author_name: log.author_name || "" });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    if (editing) {
      const updated = await base44.entities.ManagerLog.update(editing.id, form);
      setLogs(prev => prev.map(l => l.id === editing.id ? { ...l, ...form } : l));
    } else {
      const rec = await base44.entities.ManagerLog.create({ ...form, date: selectedDate || today });
      setLogs(prev => [rec, ...prev]);
    }
    setShowForm(false);
    setSaving(false);
    toast.success(editing ? "Entry updated" : "Entry added");
  };

  const deleteLog = async (id) => {
    await base44.entities.ManagerLog.delete(id);
    setLogs(prev => prev.filter(l => l.id !== id));
    toast.success("Entry deleted");
  };

  const addCategory = async () => {
    if (!categoryForm.name.trim()) return;
    const cat = await base44.entities.LogCategory.create(categoryForm);
    setCategories(prev => [...prev, cat]);
    setCategoryForm({ name: "", color: "blue" });
    setShowCategoryForm(false);
    toast.success("Category added");
  };

  const deleteCategory = async (id) => {
    await base44.entities.LogCategory.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success("Category deleted");
  };

  const getCatStyle = (catName) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? COLOR_MAP[cat.color] || COLOR_MAP.blue : COLOR_MAP.blue;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-primary" /> Manager Log
          </h1>
          <p className="text-muted-foreground mt-1">Daily shift notes, incidents, and observations.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowCategoryForm(true)} className="gap-2">
              <Settings className="h-4 w-4" /> Categories
            </Button>
          )}
          {selectedDate && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Add Entry
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:text-primary transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-semibold text-sm">{MONTH_NAMES[month]} {year}</span>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:text-primary transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
            ))}
            {calCells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const ds = toDateStr(day);
              const hasLogs = logsOnDate(ds).length > 0;
              const isToday = ds === today;
              const isSelected = ds === selectedDate;
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  className={[
                    "relative flex items-center justify-center rounded-lg aspect-square text-xs font-medium transition-all",
                    isSelected ? "bg-primary text-primary-foreground" :
                    isToday ? "border border-primary text-primary" :
                    "hover:bg-secondary text-foreground"
                  ].join(" ")}
                >
                  {day}
                  {hasLogs && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Entries for selected date */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDate && (
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base">
                {selectedDate === today ? "Today" : selectedDate}
              </h2>
              <span className="text-xs text-muted-foreground">{selectedLogs.length} {selectedLogs.length === 1 ? "entry" : "entries"}</span>
            </div>
          )}

          {selectedLogs.length === 0 && (
            <div className="bg-card rounded-2xl border border-border p-10 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No entries for this day.</p>
              <Button size="sm" className="mt-4" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1" />Add Entry</Button>
            </div>
          )}

          <AnimatePresence>
            {selectedLogs.map(log => {
              const catStyle = getCatStyle(log.category);
              return (
                <motion.div
                  key={log.id}
                  className="bg-card rounded-2xl border border-border p-5 space-y-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catStyle}`}>{log.category}</span>
                      <h3 className="font-semibold text-sm">{log.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(log)}>
                        <BookOpen className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteLog(log.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {log.body && <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{log.body}</p>}
                  {log.author_name && <p className="text-xs text-muted-foreground">— {log.author_name} · {log.created_date ? new Date(log.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</p>}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
              className="bg-card rounded-2xl border border-border w-full max-w-lg p-6 space-y-4 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{editing ? "Edit Entry" : "New Log Entry"}</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input placeholder="e.g. Line cook called out" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     {categories.map(c => <SelectItem key={c.id || c.name} value={c.name}>{c.name}</SelectItem>)}
                   </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Textarea placeholder="Details, follow-up actions, observations…" rows={4} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Your Name</Label>
                  <Input placeholder="Manager name" value={form.author_name} onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving || !form.title.trim()}>
                  <Save className="h-3.5 w-3.5 mr-1" />{saving ? "Saving…" : "Save Entry"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category management modal */}
      <AnimatePresence>
        {showCategoryForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
              className="bg-card rounded-2xl border border-border w-full max-w-sm p-6 space-y-4 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Manage Categories</h2>
                <button onClick={() => setShowCategoryForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">New Category Name</Label>
                  <Input placeholder="e.g. Staffing" value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Color</Label>
                  <Select value={categoryForm.color} onValueChange={v => setCategoryForm(p => ({ ...p, color: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(COLOR_MAP).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addCategory} className="w-full"><Plus className="h-3.5 w-3.5 mr-1" />Add Category</Button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {categories.map(cat => (
                  <div key={cat.id || cat.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${COLOR_MAP[cat.color]?.split(" ")[0]}`} />
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    {!cat.id?.startsWith("default") && (
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const hideBase44Index = true;