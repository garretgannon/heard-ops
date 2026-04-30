import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, X, Edit2, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format } from "date-fns";

const SHIFTS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" }
];

export default function PreShift() {
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    shift: "morning",
    notes: "",
    staffing_notes: "",
    specials: "",
    issues: ""
  });

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.PreShift.list("-date", 100);
      setBriefings(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form.date || !form.shift) {
      toast.error("Date and shift are required");
      return;
    }
    setSaving(true);
    if (editingId) {
      await base44.entities.PreShift.update(editingId, form);
      setBriefings(prev => prev.map(b => b.id === editingId ? { ...b, ...form } : b));
      toast.success("Briefing updated");
    } else {
      const created = await base44.entities.PreShift.create(form);
      setBriefings(prev => [created, ...prev]);
      toast.success("Briefing created");
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      shift: "morning",
      notes: "",
      staffing_notes: "",
      specials: "",
      issues: ""
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this briefing?")) return;
    await base44.entities.PreShift.delete(id);
    setBriefings(prev => prev.filter(b => b.id !== id));
    toast.success("Briefing deleted");
  };

  const openEdit = (briefing) => {
    setForm(briefing);
    setEditingId(briefing.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      shift: "morning",
      notes: "",
      staffing_notes: "",
      specials: "",
      issues: ""
    });
    setEditingId(null);
    setShowForm(true);
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
            <Users className="h-7 w-7 text-primary" /> Pre-Shift Briefings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Team briefings before each shift</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New Briefing
        </Button>
      </div>

      {briefings.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground mb-4">No briefings scheduled</p>
          <Button onClick={openNew} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Create First Briefing
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {briefings.map(briefing => (
            <div key={briefing.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{briefing.date} · {briefing.shift}</h3>
                  </div>
                  {briefing.notes && <p className="text-sm text-muted-foreground mb-2">{briefing.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(briefing)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(briefing.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {briefing.staffing_notes && (
                  <div>
                    <p className="font-medium text-primary mb-1">Staffing</p>
                    <p className="text-muted-foreground">{briefing.staffing_notes}</p>
                  </div>
                )}
                {briefing.specials && (
                  <div>
                    <p className="font-medium text-primary mb-1">Specials</p>
                    <p className="text-muted-foreground">{briefing.specials}</p>
                  </div>
                )}
                {briefing.issues && (
                  <div className="md:col-span-2">
                    <p className="font-medium text-destructive mb-1">Issues</p>
                    <p className="text-muted-foreground">{briefing.issues}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Briefing" : "New Pre-Shift Briefing"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
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
                      disabled={date => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label>Shift *</Label>
                <Select value={form.shift} onValueChange={v => setForm(f => ({ ...f, shift: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHIFTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Main Notes</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Key talking points and updates..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Staffing Notes</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Who's working, coverage issues, etc..."
                value={form.staffing_notes}
                onChange={e => setForm(f => ({ ...f, staffing_notes: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Specials / Promotions</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Any specials or promotions to highlight..."
                value={form.specials}
                onChange={e => setForm(f => ({ ...f, specials: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Issues / Concerns</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Any issues or concerns to address..."
                value={form.issues}
                onChange={e => setForm(f => ({ ...f, issues: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving…" : (editingId ? "Update" : "Create")} Briefing
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}