import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Edit2, Trash2, Users, Settings, Copy, Link as LinkIcon, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

const SHIFTS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" }
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

export default function PreShift() {
  const [briefings, setBriefings] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    shift: "morning",
    notes: "",
    staffing_notes: "",
    specials: "",
  });
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const load = async () => {
      const [data, templates, user] = await Promise.all([
        base44.entities.PreShift.list("-date", 100),
        base44.entities.PreShiftTemplate.list(),
        base44.auth.me(),
      ]);
      setBriefings(data);
      setTemplates(templates);
      setIsAdmin(user?.role === "admin");
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
        await base44.entities.PreShift.update(editingId, form);
        setBriefings(prev => prev.map(b => b.id === editingId ? { ...b, ...form } : b));
        toast.success("Updated");
      } else {
        const created = await base44.entities.PreShift.create(form);
        setBriefings(prev => [created, ...prev]);
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
    if (!confirm("Delete this briefing?")) return;
    try {
      await base44.entities.PreShift.delete(id);
      setBriefings(prev => prev.filter(b => b.id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const copyYesterday = async () => {
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const prev = briefings.find(b => b.date === yesterday);
    if (!prev) {
      toast.error("No pre-shift from yesterday");
      return;
    }
    setForm({
      ...prev,
      date: format(new Date(), "yyyy-MM-dd"),
      briefed_staff: [],
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (briefing) => {
    setForm(briefing);
    setEditingId(briefing.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const applyTemplate = (template) => {
    setForm({
      ...emptyForm,
      shift: template.shift,
      specials: template.specials || "",
      manager_notes: template.notes || "",
      staff_assignments: template.staffing_notes || "",
    });
    setEditingId(null);
    setShowTemplates(false);
    setShowForm(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast.error("Template name required");
      return;
    }
    const created = await base44.entities.PreShiftTemplate.create(templateForm);
    setTemplates(prev => [...prev, created]);
    setTemplateForm({
      name: "",
      shift: "morning",
      notes: "",
      staffing_notes: "",
      specials: "",
    });
    toast.success("Template saved");
  };

  const deleteTemplate = async (id) => {
    if (!confirm("Delete this template?")) return;
    await base44.entities.PreShiftTemplate.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success("Deleted");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const todayBriefing = briefings.find(b => b.date === today);
  const oldBriefings = briefings.filter(b => b.date !== today);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <Users className="h-7 w-7" /> Pre-Shift Briefings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Daily team briefing and service prep</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!todayBriefing && <Button onClick={copyYesterday} variant="outline" className="gap-2"><Copy className="h-4 w-4" /> Copy Yesterday</Button>}
          <Button onClick={() => setShowTemplates(true)} variant="outline" className="gap-2">
            <Settings className="h-4 w-4" /> Templates
          </Button>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      {!todayBriefing && briefings.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground mb-4">No briefings yet</p>
          <Button onClick={openNew} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Create First Briefing
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {todayBriefing && (
            <div className="space-y-1 mb-2">
              <h2 className="text-sm font-bold text-primary">TODAY SHIFT MEETING</h2>
              <PreShiftCard briefing={todayBriefing} onEdit={openEdit} onDelete={handleDelete} />
            </div>
          )}

          {oldBriefings.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setExpandedHistory(!expandedHistory)}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedHistory && "rotate-180")} />
                History ({oldBriefings.length})
              </button>
              {expandedHistory && (
                <div className="space-y-3">
                  {oldBriefings.map(briefing => (
                    <PreShiftCard key={briefing.id} briefing={briefing} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pre-Shift Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {isAdmin && (
              <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
                <h3 className="font-semibold text-sm">Create Template</h3>
                <Input placeholder="Template name" value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} />
                <Select value={templateForm.shift} onValueChange={v => setTemplateForm(f => ({ ...f, shift: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHIFTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea placeholder="Default notes..." value={templateForm.notes} onChange={e => setTemplateForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                <Button onClick={saveTemplate} className="w-full"><Plus className="h-4 w-4 mr-1" /> Save Template</Button>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Available</h3>
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No templates</p>
              ) : (
                templates.map(template => (
                  <div key={template.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.shift}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => applyTemplate(template)}>Use</Button>
                      {isAdmin && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteTemplate(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Pre-Shift" : "New Pre-Shift Briefing"}</DialogTitle>
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
              <Label>Specials</Label>
              <Textarea placeholder="Daily specials, promotions..." value={form.specials} onChange={e => setForm(f => ({ ...f, specials: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>86 Items</Label>
              <Textarea placeholder="Items out of stock..." value={form.items_86d} onChange={e => setForm(f => ({ ...f, items_86d: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Events / Reservations</Label>
              <Textarea placeholder="Large parties, VIP..." value={form.events_reservations} onChange={e => setForm(f => ({ ...f, events_reservations: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Service Focus</Label>
              <Textarea placeholder="Key focus areas..." value={form.service_focus} onChange={e => setForm(f => ({ ...f, service_focus: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Wine / Beer / Cocktail Focus</Label>
              <Textarea placeholder="Featured drinks, pairings..." value={form.wine_beer_cocktail_focus} onChange={e => setForm(f => ({ ...f, wine_beer_cocktail_focus: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Safety Note</Label>
              <Textarea placeholder="Safety reminders..." value={form.safety_note} onChange={e => setForm(f => ({ ...f, safety_note: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Staff Assignments</Label>
              <Textarea placeholder="Station assignments, roles..." value={form.staff_assignments} onChange={e => setForm(f => ({ ...f, staff_assignments: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Upsell Focus</Label>
              <Textarea placeholder="What to push, premium items..." value={form.upsell_focus} onChange={e => setForm(f => ({ ...f, upsell_focus: e.target.value }))} rows={2} />
            </div>

            <div>
              <Label>Manager Notes</Label>
              <Textarea placeholder="General notes..." value={form.manager_notes} onChange={e => setForm(f => ({ ...f, manager_notes: e.target.value }))} rows={2} />
            </div>

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
                {saving ? "Saving..." : (editingId ? "Update" : "Create")} Pre-Shift
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreShiftCard({ briefing, onEdit, onDelete }) {
  const [markingBriefed, setMarkingBriefed] = useState(false);
  const [currentBriefed, setCurrentBriefed] = useState(briefing.briefed_staff || []);

  const handleAddBriefed = async () => {
    const name = prompt("Staff name:");
    if (!name) return;
    const updated = [...new Set([...currentBriefed, name])];
    setCurrentBriefed(updated);
    setMarkingBriefed(true);
    try {
      await base44.entities.PreShift.update(briefing.id, { briefed_staff: updated });
      toast.success(name + " marked briefed");
    } catch (err) {
      toast.error("Failed");
    }
    setMarkingBriefed(false);
  };

  return (
    <div className="bg-card border-2 border-primary rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-lg">{briefing.shift.charAt(0).toUpperCase() + briefing.shift.slice(1)} Shift</p>
          <p className="text-xs text-muted-foreground">{briefing.date}</p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(briefing)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(briefing.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {briefing.specials && <Section label="Specials" text={briefing.specials} />}
        {briefing.items_86d && <Section label="86 Items" text={briefing.items_86d} />}
        {briefing.events_reservations && <Section label="Events" text={briefing.events_reservations} />}
        {briefing.service_focus && <Section label="Service Focus" text={briefing.service_focus} />}
        {briefing.wine_beer_cocktail_focus && <Section label="Drinks Focus" text={briefing.wine_beer_cocktail_focus} />}
        {briefing.safety_note && <Section label="Safety" text={briefing.safety_note} />}
        {briefing.staff_assignments && <Section label="Assignments" text={briefing.staff_assignments} />}
        {briefing.upsell_focus && <Section label="Upsell" text={briefing.upsell_focus} />}
        {briefing.manager_notes && <Section label="Notes" text={briefing.manager_notes} />}
      </div>

      {(briefing.build_book_link || briefing.bar_book_link) && (
        <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
          {briefing.build_book_link && (
            <a href={briefing.build_book_link} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-2">
                <LinkIcon className="h-3.5 w-3.5" /> Build Book
              </Button>
            </a>
          )}
          {briefing.bar_book_link && (
            <a href={briefing.bar_book_link} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-2">
                <LinkIcon className="h-3.5 w-3.5" /> Bar Book
              </Button>
            </a>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-border space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Briefed: {currentBriefed.length > 0 ? currentBriefed.join(", ") : "None"}</p>
        <Button size="sm" onClick={handleAddBriefed} disabled={markingBriefed} className="gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> {markingBriefed ? "Marking..." : "Mark Staff Briefed"}
        </Button>
      </div>
    </div>
  );
}

function Section({ label, text }) {
  return (
    <div>
      <p className="font-semibold text-primary text-xs mb-1">{label}</p>
      <p className="text-muted-foreground text-xs line-clamp-3">{text}</p>
    </div>
  );
}