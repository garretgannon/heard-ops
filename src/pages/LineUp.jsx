import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Edit2, Trash2, ChevronDown, CheckCircle2, Copy, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

const SHIFTS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const emptyForm = {
  date: format(new Date(), "yyyy-MM-dd"),
  shift: "morning",
  specials: "",
  items_86d: "",
  events_reservations: "",
  service_focus: "",
  wine_beer_cocktail_focus: "",
  safety_note: "",
  staff_assignments: "",
  upsell_focus: "",
  manager_notes: "",
  briefed_staff: [],
  build_book_link: "",
  bar_book_link: "",
};

export default function LineUp() {
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedHistory, setExpandedHistory] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    base44.entities.PreShift.list("-date", 100).then(data => {
      setBriefings(data);
      setLoading(false);
    });
  }, []);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (b) => { setForm(b); setEditingId(b.id); setShowForm(true); };

  const copyYesterday = async () => {
    const prev = briefings.find(b => b.date === format(subDays(new Date(), 1), "yyyy-MM-dd"));
    if (!prev) { toast.error("No line-up from yesterday"); return; }
    setForm({ ...prev, date: today, briefed_staff: [] });
    setEditingId(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this line-up?")) return;
    await base44.entities.PreShift.delete(id);
    setBriefings(prev => prev.filter(b => b.id !== id));
    toast.success("Deleted");
  };

  const handleSave = async () => {
    if (!form.date || !form.shift) { toast.error("Date and shift required"); return; }
    setSaving(true);
    if (editingId) {
      await base44.entities.PreShift.update(editingId, form);
      setBriefings(prev => prev.map(b => b.id === editingId ? { ...b, ...form } : b));
    } else {
      const created = await base44.entities.PreShift.create(form);
      setBriefings(prev => [created, ...prev]);
    }
    toast.success(editingId ? "Updated" : "Created");
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const todayBriefing = briefings.find(b => b.date === today);
  const oldBriefings = briefings.filter(b => b.date !== today);

  return (
    <div className="space-y-5 pb-12">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Service Line-Up</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Daily shift briefing</p>
        </div>
        <div className="flex gap-2">
          {!todayBriefing && (
            <Button variant="outline" onClick={copyYesterday} className="gap-1.5 text-sm">
              <Copy className="h-3.5 w-3.5" /> Copy Yesterday
            </Button>
          )}
          <Button onClick={openNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      {briefings.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground text-sm mb-3">No line-ups yet</p>
          <Button onClick={openNew} variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Create First Line-Up
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {todayBriefing && <BriefingCard briefing={todayBriefing} onEdit={openEdit} onDelete={handleDelete} />}
          {oldBriefings.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setExpandedHistory(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expandedHistory && "rotate-180")} />
                History ({oldBriefings.length})
              </button>
              {expandedHistory && oldBriefings.map(b => (
                <BriefingCard key={b.id} briefing={b} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "New"} Service Line-Up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {form.date ? format(new Date(form.date + "T00:00:00"), "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.date ? new Date(form.date + "T00:00:00") : undefined}
                      onSelect={date => setForm(f => ({ ...f, date: format(date, "yyyy-MM-dd") }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Shift *</Label>
                <Select value={form.shift} onValueChange={v => setForm(f => ({ ...f, shift: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHIFTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <FormField label="Specials" value={form.specials} onChange={v => setForm(f => ({ ...f, specials: v }))} placeholder="Daily specials, promotions..." />
            <FormField label="86 Items" value={form.items_86d} onChange={v => setForm(f => ({ ...f, items_86d: v }))} placeholder="Items out of stock..." />
            <FormField label="Events / Reservations" value={form.events_reservations} onChange={v => setForm(f => ({ ...f, events_reservations: v }))} placeholder="Large parties, VIP..." />
            <FormField label="Service Focus" value={form.service_focus} onChange={v => setForm(f => ({ ...f, service_focus: v }))} placeholder="Key focus areas..." />
            <FormField label="Wine / Beer / Cocktail Focus" value={form.wine_beer_cocktail_focus} onChange={v => setForm(f => ({ ...f, wine_beer_cocktail_focus: v }))} placeholder="Featured drinks, pairings..." />
            <FormField label="Safety Note" value={form.safety_note} onChange={v => setForm(f => ({ ...f, safety_note: v }))} placeholder="Safety reminders..." />
            <FormField label="Staff Assignments" value={form.staff_assignments} onChange={v => setForm(f => ({ ...f, staff_assignments: v }))} placeholder="Station assignments, roles..." />
            <FormField label="Upsell Focus" value={form.upsell_focus} onChange={v => setForm(f => ({ ...f, upsell_focus: v }))} placeholder="What to push, premium items..." />
            <FormField label="Manager Notes" value={form.manager_notes} onChange={v => setForm(f => ({ ...f, manager_notes: v }))} placeholder="General notes..." />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Build Book Link</Label>
                <Input placeholder="https://..." value={form.build_book_link} onChange={e => setForm(f => ({ ...f, build_book_link: e.target.value }))} />
              </div>
              <div>
                <Label>Bar Book Link</Label>
                <Input placeholder="https://..." value={form.bar_book_link} onChange={e => setForm(f => ({ ...f, bar_book_link: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : (editingId ? "Update" : "Create")}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;

function FormField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} rows={2} />
    </div>
  );
}

function BriefingCard({ briefing, onEdit, onDelete }) {
  const [currentBriefed, setCurrentBriefed] = useState(briefing.briefed_staff || []);
  const [marking, setMarking] = useState(false);

  const handleAddBriefed = async () => {
    const name = prompt("Staff name:");
    if (!name) return;
    const updated = [...new Set([...currentBriefed, name])];
    setCurrentBriefed(updated);
    setMarking(true);
    await base44.entities.PreShift.update(briefing.id, { briefed_staff: updated });
    toast.success(name + " marked briefed");
    setMarking(false);
  };

  const fields = [
    { label: "Specials", value: briefing.specials },
    { label: "86 Items", value: briefing.items_86d },
    { label: "Events", value: briefing.events_reservations },
    { label: "Service Focus", value: briefing.service_focus },
    { label: "Drinks Focus", value: briefing.wine_beer_cocktail_focus },
    { label: "Safety", value: briefing.safety_note },
    { label: "Assignments", value: briefing.staff_assignments },
    { label: "Upsell", value: briefing.upsell_focus },
    { label: "Manager Notes", value: briefing.manager_notes },
  ].filter(f => f.value);

  return (
    <div className="bg-card border-2 border-primary/40 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{briefing.shift.charAt(0).toUpperCase() + briefing.shift.slice(1)} Shift</p>
          <p className="text-xs text-muted-foreground">{briefing.date}</p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(briefing)}><Edit2 className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(briefing.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {fields.map(f => (
            <div key={f.label}>
              <p className="font-semibold text-primary text-xs mb-0.5">{f.label}</p>
              <p className="text-muted-foreground text-xs line-clamp-3">{f.value}</p>
            </div>
          ))}
        </div>
      )}

      {(briefing.build_book_link || briefing.bar_book_link) && (
        <div className="flex gap-2 pt-1 border-t border-border">
          {briefing.build_book_link && (
            <a href={briefing.build_book_link} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7"><LinkIcon className="h-3 w-3" /> Build Book</Button>
            </a>
          )}
          {briefing.bar_book_link && (
            <a href={briefing.bar_book_link} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7"><LinkIcon className="h-3 w-3" /> Bar Book</Button>
            </a>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-border space-y-1.5">
        <p className="text-xs text-muted-foreground">Briefed: {currentBriefed.length > 0 ? currentBriefed.join(", ") : "None"}</p>
        <Button size="sm" onClick={handleAddBriefed} disabled={marking} className="gap-1 h-7 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5" /> {marking ? "Marking..." : "Mark Briefed"}
        </Button>
      </div>
    </div>
  );
}