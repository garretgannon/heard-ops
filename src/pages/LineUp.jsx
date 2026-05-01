import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Edit2, Trash2, ChevronDown, Check, CheckCircle2, Copy, Link as LinkIcon } from "lucide-react";
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

const FILTERS = [
  { id: "foh", label: "FOH" },
  { id: "boh", label: "BOH" },
  { id: "management", label: "Management" },
];

const SHIFTS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const emptyPreShift = {
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

const emptyLineup = {
  date: format(new Date(), "yyyy-MM-dd"),
  shift: "evening",
  reservations: "",
  vips: "",
  menu_changes: "",
  items_86d: "",
  allergies: "",
  events: "",
  staffing: "",
  service_focus: "",
  manager_notes: "",
  acknowledged_staff: [],
};

export default function LineUp() {
  const [activeFilter, setActiveFilter] = useState("foh");
  const [preShifts, setPreShifts] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formType, setFormType] = useState("foh"); // which entity we're editing
  const [formPS, setFormPS] = useState(emptyPreShift);
  const [formLU, setFormLU] = useState(emptyLineup);
  const [expandedHistory, setExpandedHistory] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const load = async () => {
      const [ps, lu] = await Promise.all([
        base44.entities.PreShift.list("-date", 100),
        base44.entities.LineUp.list("-date", 100),
      ]);
      setPreShifts(ps);
      setLineups(lu);
      setLoading(false);
    };
    load();
  }, []);

  // --- FOH (PreShift) handlers ---
  const openNewPS = () => { setFormPS(emptyPreShift); setEditingId(null); setFormType("foh"); setShowForm(true); };
  const openEditPS = (b) => { setFormPS(b); setEditingId(b.id); setFormType("foh"); setShowForm(true); };
  const copyYesterdayPS = async () => {
    const prev = preShifts.find(b => b.date === format(subDays(new Date(), 1), "yyyy-MM-dd"));
    if (!prev) { toast.error("No pre-shift from yesterday"); return; }
    setFormPS({ ...prev, date: today, briefed_staff: [] });
    setEditingId(null); setFormType("foh"); setShowForm(true);
  };
  const deletePS = async (id) => {
    if (!confirm("Delete this briefing?")) return;
    await base44.entities.PreShift.delete(id);
    setPreShifts(prev => prev.filter(b => b.id !== id));
    toast.success("Deleted");
  };

  // --- BOH (LineUp) handlers ---
  const openNewLU = () => { setFormLU(emptyLineup); setEditingId(null); setFormType("boh"); setShowForm(true); };
  const openEditLU = (l) => { setFormLU(l); setEditingId(l.id); setFormType("boh"); setShowForm(true); };
  const deleteLU = async (id) => {
    if (!confirm("Delete this lineup?")) return;
    await base44.entities.LineUp.delete(id);
    setLineups(prev => prev.filter(l => l.id !== id));
    toast.success("Deleted");
  };

  const handleSave = async () => {
    if (formType === "foh") {
      if (!formPS.date || !formPS.shift) { toast.error("Date and shift required"); return; }
      setSaving(true);
      if (editingId) {
        await base44.entities.PreShift.update(editingId, formPS);
        setPreShifts(prev => prev.map(b => b.id === editingId ? { ...b, ...formPS } : b));
      } else {
        const created = await base44.entities.PreShift.create(formPS);
        setPreShifts(prev => [created, ...prev]);
      }
    } else {
      if (!formLU.date || !formLU.shift) { toast.error("Date and shift required"); return; }
      setSaving(true);
      if (editingId) {
        await base44.entities.LineUp.update(editingId, formLU);
        setLineups(prev => prev.map(l => l.id === editingId ? { ...l, ...formLU } : l));
      } else {
        const created = await base44.entities.LineUp.create(formLU);
        setLineups(prev => [created, ...prev]);
      }
    }
    toast.success(editingId ? "Updated" : "Created");
    setShowForm(false); setEditingId(null); setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const todayPS = preShifts.find(b => b.date === today);
  const oldPS = preShifts.filter(b => b.date !== today);
  const todayLU = lineups.find(l => l.date === today);
  const oldLU = lineups.filter(l => l.date !== today);

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Shift Briefing</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Pre-shift + service lineup</p>
        </div>
        <div className="flex gap-2">
          {activeFilter === "foh" && !todayPS && (
            <Button variant="outline" onClick={copyYesterdayPS} className="gap-1.5 text-sm">
              <Copy className="h-3.5 w-3.5" /> Copy Yesterday
            </Button>
          )}
          <Button onClick={activeFilter === "boh" ? openNewLU : openNewPS} className="gap-1.5">
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold border transition-all active:scale-95",
              activeFilter === f.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* FOH content */}
      {(activeFilter === "foh" || activeFilter === "management") && (
        <div className="space-y-3">
          {activeFilter === "management" && (
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider">FOH — Pre-Shift</h2>
          )}
          {!todayPS && preShifts.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-sm mb-3">No FOH briefings yet</p>
              <Button onClick={openNewPS} variant="outline" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Create First Briefing
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {todayPS && <PreShiftCard briefing={todayPS} onEdit={openEditPS} onDelete={deletePS} />}
              {oldPS.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setExpandedHistory(v => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expandedHistory && "rotate-180")} />
                    FOH History ({oldPS.length})
                  </button>
                  {expandedHistory && oldPS.map(b => <PreShiftCard key={b.id} briefing={b} onEdit={openEditPS} onDelete={deletePS} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BOH content */}
      {(activeFilter === "boh" || activeFilter === "management") && (
        <div className="space-y-3">
          {activeFilter === "management" && (
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider mt-2">BOH — Service Lineup</h2>
          )}
          {!todayLU && lineups.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-sm mb-3">No BOH lineups yet</p>
              <Button onClick={openNewLU} variant="outline" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Create First Lineup
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {todayLU && <LineupCard lineup={todayLU} onEdit={openEditLU} onDelete={deleteLU} />}
              {oldLU.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setExpandedHistory(v => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expandedHistory && "rotate-180")} />
                    BOH History ({oldLU.length})
                  </button>
                  {expandedHistory && oldLU.map(l => <LineupCard key={l.id} lineup={l} onEdit={openEditLU} onDelete={deleteLU} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "New"} {formType === "foh" ? "Pre-Shift Briefing (FOH)" : "Service Lineup (BOH)"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {formType === "foh"
                        ? (formPS.date ? format(new Date(formPS.date + "T00:00:00"), "MMM d, yyyy") : "Pick date")
                        : (formLU.date ? format(new Date(formLU.date + "T00:00:00"), "MMM d, yyyy") : "Pick date")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formType === "foh" ? (formPS.date ? new Date(formPS.date + "T00:00:00") : undefined) : (formLU.date ? new Date(formLU.date + "T00:00:00") : undefined)}
                      onSelect={date => formType === "foh"
                        ? setFormPS(f => ({ ...f, date: format(date, "yyyy-MM-dd") }))
                        : setFormLU(f => ({ ...f, date: format(date, "yyyy-MM-dd") }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Shift *</Label>
                <Select
                  value={formType === "foh" ? formPS.shift : formLU.shift}
                  onValueChange={v => formType === "foh" ? setFormPS(f => ({ ...f, shift: v })) : setFormLU(f => ({ ...f, shift: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHIFTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formType === "foh" ? (
              <>
                <FormField label="Specials" value={formPS.specials} onChange={v => setFormPS(f => ({ ...f, specials: v }))} placeholder="Daily specials, promotions..." />
                <FormField label="86 Items" value={formPS.items_86d} onChange={v => setFormPS(f => ({ ...f, items_86d: v }))} placeholder="Items out of stock..." />
                <FormField label="Events / Reservations" value={formPS.events_reservations} onChange={v => setFormPS(f => ({ ...f, events_reservations: v }))} placeholder="Large parties, VIP..." />
                <FormField label="Service Focus" value={formPS.service_focus} onChange={v => setFormPS(f => ({ ...f, service_focus: v }))} placeholder="Key focus areas..." />
                <FormField label="Wine / Beer / Cocktail Focus" value={formPS.wine_beer_cocktail_focus} onChange={v => setFormPS(f => ({ ...f, wine_beer_cocktail_focus: v }))} placeholder="Featured drinks, pairings..." />
                <FormField label="Safety Note" value={formPS.safety_note} onChange={v => setFormPS(f => ({ ...f, safety_note: v }))} placeholder="Safety reminders..." />
                <FormField label="Staff Assignments" value={formPS.staff_assignments} onChange={v => setFormPS(f => ({ ...f, staff_assignments: v }))} placeholder="Station assignments, roles..." />
                <FormField label="Upsell Focus" value={formPS.upsell_focus} onChange={v => setFormPS(f => ({ ...f, upsell_focus: v }))} placeholder="What to push, premium items..." />
                <FormField label="Manager Notes" value={formPS.manager_notes} onChange={v => setFormPS(f => ({ ...f, manager_notes: v }))} placeholder="General notes..." />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Build Book Link</Label>
                    <Input placeholder="https://..." value={formPS.build_book_link} onChange={e => setFormPS(f => ({ ...f, build_book_link: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Bar Book Link</Label>
                    <Input placeholder="https://..." value={formPS.bar_book_link} onChange={e => setFormPS(f => ({ ...f, bar_book_link: e.target.value }))} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <FormField label="Reservations" value={formLU.reservations} onChange={v => setFormLU(f => ({ ...f, reservations: v }))} placeholder="Large parties, seated times..." />
                <FormField label="VIPs" value={formLU.vips} onChange={v => setFormLU(f => ({ ...f, vips: v }))} placeholder="Notable guests, regulars..." />
                <FormField label="Menu Changes" value={formLU.menu_changes} onChange={v => setFormLU(f => ({ ...f, menu_changes: v }))} placeholder="Out of items, new specials..." />
                <FormField label="86 Items" value={formLU.items_86d} onChange={v => setFormLU(f => ({ ...f, items_86d: v }))} placeholder="Out of stock..." />
                <FormField label="Allergies / Dietary" value={formLU.allergies} onChange={v => setFormLU(f => ({ ...f, allergies: v }))} placeholder="Known allergies..." />
                <FormField label="Events" value={formLU.events} onChange={v => setFormLU(f => ({ ...f, events: v }))} placeholder="Special requests, events..." />
                <FormField label="Staffing" value={formLU.staffing} onChange={v => setFormLU(f => ({ ...f, staffing: v }))} placeholder="Station assignments, coverage..." />
                <FormField label="Service Focus" value={formLU.service_focus} onChange={v => setFormLU(f => ({ ...f, service_focus: v }))} placeholder="Key focus areas..." />
                <FormField label="Manager Notes" value={formLU.manager_notes} onChange={v => setFormLU(f => ({ ...f, manager_notes: v }))} placeholder="General notes..." />
              </>
            )}

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

function PreShiftCard({ briefing, onEdit, onDelete }) {
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
          {briefing.build_book_link && <a href={briefing.build_book_link} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline" className="gap-1.5 text-xs h-7"><LinkIcon className="h-3 w-3" /> Build Book</Button></a>}
          {briefing.bar_book_link && <a href={briefing.bar_book_link} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline" className="gap-1.5 text-xs h-7"><LinkIcon className="h-3 w-3" /> Bar Book</Button></a>}
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

function LineupCard({ lineup, onEdit, onDelete }) {
  const [acknowledged, setAcknowledged] = useState(lineup.acknowledged_staff || []);
  const [marking, setMarking] = useState(false);

  const handleAcknowledge = async () => {
    const name = prompt("Your name:");
    if (!name) return;
    const updated = [...new Set([...acknowledged, name])];
    setAcknowledged(updated);
    setMarking(true);
    await base44.entities.LineUp.update(lineup.id, { acknowledged_staff: updated });
    toast.success(name + " acknowledged");
    setMarking(false);
  };

  const sections = [
    { label: "Reservations", content: lineup.reservations },
    { label: "VIPs", content: lineup.vips },
    { label: "Menu Changes", content: lineup.menu_changes },
    { label: "86 Items", content: lineup.items_86d },
    { label: "Allergies", content: lineup.allergies },
    { label: "Events", content: lineup.events },
    { label: "Staffing", content: lineup.staffing },
    { label: "Service Focus", content: lineup.service_focus },
  ].filter(s => s.content);

  return (
    <div className="bg-card border-2 border-accent/40 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{lineup.shift.charAt(0).toUpperCase() + lineup.shift.slice(1)} Shift</p>
          <p className="text-xs text-muted-foreground">{lineup.date}</p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(lineup)}><Edit2 className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(lineup.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {sections.length > 0 && (
        <div className="space-y-1.5">
          {sections.map(s => (
            <details key={s.label} className="group bg-secondary/50 rounded border border-border">
              <summary className="flex items-center gap-2 cursor-pointer px-3 py-2 font-medium text-xs">
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                {s.label}
              </summary>
              <div className="px-3 pb-2.5 text-xs text-muted-foreground whitespace-pre-wrap">{s.content}</div>
            </details>
          ))}
        </div>
      )}
      {lineup.manager_notes && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
          <p className="font-semibold text-yellow-600 mb-0.5">Manager Notes</p>
          <p className="text-muted-foreground">{lineup.manager_notes}</p>
        </div>
      )}
      <div className="pt-2 border-t border-border space-y-1.5">
        <p className="text-xs text-muted-foreground">Acknowledged: {acknowledged.length > 0 ? acknowledged.join(", ") : "None"}</p>
        <Button size="sm" onClick={handleAcknowledge} disabled={marking} className="gap-1 h-7 text-xs">
          <Check className="h-3.5 w-3.5" /> {marking ? "Marking..." : "Acknowledge"}
        </Button>
      </div>
    </div>
  );
}