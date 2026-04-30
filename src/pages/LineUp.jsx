import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Edit2, Trash2, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const SHIFTS = [
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" }
];

const emptyForm = {
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
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.LineUp.list("-date", 100);
      setLineups(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form.date || !form.shift) {
      toast.error("Date and shift required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await base44.entities.LineUp.update(editingId, form);
        setLineups(prev => prev.map(l => l.id === editingId ? { ...l, ...form } : l));
        toast.success("Updated");
      } else {
        const created = await base44.entities.LineUp.create(form);
        setLineups(prev => [created, ...prev]);
        toast.success("Created");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this lineup?")) return;
    try {
      await base44.entities.LineUp.delete(id);
      setLineups(prev => prev.filter(l => l.id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const openEdit = (lineup) => {
    setForm(lineup);
    setEditingId(lineup.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const todayLineup = lineups.find(l => l.date === today);
  const oldLineups = lineups.filter(l => l.date !== today);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Service Lineup</h1>
          <p className="text-muted-foreground text-sm mt-1">Team briefing for FOH and BOH</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {!todayLineup && lineups.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No lineups yet</p>
          <Button onClick={openNew} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Create First Lineup
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {todayLineup && (
            <div className="space-y-1 mb-4">
              <h2 className="text-sm font-bold text-primary">TODAY'S SERVICE</h2>
              <LineupCard lineup={todayLineup} onEdit={openEdit} onDelete={handleDelete} />
            </div>
          )}

          {oldLineups.length > 0 && (
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                History ({oldLineups.length})
              </summary>
              <div className="space-y-3 mt-4">
                {oldLineups.map(lineup => (
                  <LineupCard key={lineup.id} lineup={lineup} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Lineup" : "New Service Lineup"}</DialogTitle>
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
                    <Calendar mode="single" selected={form.date ? new Date(form.date + "T00:00:00") : undefined} onSelect={date => setForm(f => ({ ...f, date: format(date, "yyyy-MM-dd") }))} disabled={date => date > new Date()} />
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

            <div>
              <Label>Reservations</Label>
              <Textarea placeholder="Large parties, seated times..." value={form.reservations} onChange={e => setForm(f => ({ ...f, reservations: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>VIPs</Label>
              <Textarea placeholder="Notable guests, regulars..." value={form.vips} onChange={e => setForm(f => ({ ...f, vips: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Menu Changes</Label>
              <Textarea placeholder="Out of items, new specials..." value={form.menu_changes} onChange={e => setForm(f => ({ ...f, menu_changes: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>86 Items</Label>
              <Textarea placeholder="Out of stock or unavailable..." value={form.items_86d} onChange={e => setForm(f => ({ ...f, items_86d: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Allergies / Dietary</Label>
              <Textarea placeholder="Known allergies, dietary restrictions..." value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Events / Special Circumstances</Label>
              <Textarea placeholder="Special requests, events..." value={form.events} onChange={e => setForm(f => ({ ...f, events: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Staffing</Label>
              <Textarea placeholder="Station assignments, coverage..." value={form.staffing} onChange={e => setForm(f => ({ ...f, staffing: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Service Focus</Label>
              <Textarea placeholder="Key focus areas for today..." value={form.service_focus} onChange={e => setForm(f => ({ ...f, service_focus: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Manager Notes</Label>
              <Textarea placeholder="General notes and reminders..." value={form.manager_notes} onChange={e => setForm(f => ({ ...f, manager_notes: e.target.value }))} rows={2} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : (editingId ? "Update" : "Create")} Lineup
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LineupCard({ lineup, onEdit, onDelete }) {
  const [expandedSections, setExpandedSections] = useState({ reservations: true, vips: true });
  const [acknowledgedStaff, setAcknowledgedStaff] = useState(lineup.acknowledged_staff || []);
  const [marking, setMarking] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAcknowledge = async () => {
    const name = prompt("Your name:");
    if (!name) return;
    const updated = [...new Set([...acknowledgedStaff, name])];
    setAcknowledgedStaff(updated);
    setMarking(true);
    try {
      await base44.entities.LineUp.update(lineup.id, { acknowledged_staff: updated });
      toast.success(name + " acknowledged");
    } catch (err) {
      toast.error("Failed");
    }
    setMarking(false);
  };

  const sections = [
    { id: "reservations", label: "Reservations", content: lineup.reservations },
    { id: "vips", label: "VIPs", content: lineup.vips },
    { id: "menu_changes", label: "Menu Changes", content: lineup.menu_changes },
    { id: "items_86d", label: "86 Items", content: lineup.items_86d },
    { id: "allergies", label: "Allergies", content: lineup.allergies },
    { id: "events", label: "Events", content: lineup.events },
    { id: "staffing", label: "Staffing", content: lineup.staffing },
    { id: "service_focus", label: "Service Focus", content: lineup.service_focus },
  ];

  return (
    <div className="bg-card border-2 border-primary rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-base">{lineup.shift.charAt(0).toUpperCase() + lineup.shift.slice(1)} Shift</p>
          <p className="text-xs text-muted-foreground">{lineup.date}</p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(lineup)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(lineup.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {sections.map(section => (
          section.content && (
            <details key={section.id} className="group bg-secondary/50 rounded border border-border">
              <summary className="flex items-center gap-2 cursor-pointer p-3 font-medium text-sm">
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                {section.label}
              </summary>
              <div className="px-3 pb-3 text-sm text-muted-foreground whitespace-pre-wrap">
                {section.content}
              </div>
            </details>
          )
        ))}
      </div>

      {lineup.manager_notes && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
          <p className="font-semibold text-yellow-600 mb-1">Manager Notes</p>
          <p className="text-muted-foreground">{lineup.manager_notes}</p>
        </div>
      )}

      <div className="pt-3 border-t border-border space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Acknowledged: {acknowledgedStaff.length > 0 ? acknowledgedStaff.join(", ") : "None"}</p>
        <Button size="sm" onClick={handleAcknowledge} disabled={marking} className="gap-1 w-full">
          <Check className="h-3.5 w-3.5" /> {marking ? "Marking..." : "I Acknowledge This Lineup"}
        </Button>
      </div>
    </div>
  );
}