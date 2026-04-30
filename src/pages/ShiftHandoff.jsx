import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, ChevronDown, Plus, Trash2, Check, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const TAGS = ["FOH", "BOH", "Bar", "Maintenance", "Cash", "Guest", "Staff", "Vendor", "Prep"];
const TAG_COLORS = {
  FOH: "bg-blue-500/20 text-blue-700 border-blue-300",
  BOH: "bg-orange-500/20 text-orange-700 border-orange-300",
  Bar: "bg-purple-500/20 text-purple-700 border-purple-300",
  Maintenance: "bg-yellow-500/20 text-yellow-700 border-yellow-300",
  Cash: "bg-green-500/20 text-green-700 border-green-300",
  Guest: "bg-cyan-500/20 text-cyan-700 border-cyan-300",
  Staff: "bg-pink-500/20 text-pink-700 border-pink-300",
  Vendor: "bg-indigo-500/20 text-indigo-700 border-indigo-300",
  Prep: "bg-amber-500/20 text-amber-700 border-amber-300",
};

const URGENCY_CONFIG = {
  low: { label: "Low", bg: "bg-blue-500/20 text-blue-600" },
  medium: { label: "Medium", bg: "bg-amber-500/20 text-amber-600" },
  high: { label: "High", bg: "bg-orange-500/20 text-orange-600" },
  critical: { label: "Critical", bg: "bg-red-500/20 text-red-600" },
};

export default function ShiftHandoff() {
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filterShift, setFilterShift] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("");
  const [filterManager, setFilterManager] = useState("");
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    shift: "evening",
    department: "All",
    urgency: "medium",
    items_86d: "",
    staff_issues: "",
    guest_issues: "",
    maintenance_problems: "",
    cash_issues: "",
    prep_concerns: "",
    vendor_issues: "",
    reservations_to_watch: "",
    notes_for_next_manager: "",
    tags: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.ShiftHandoff.list("-created_date", 100);
        setHandoffs(data);
      } catch (error) {
        console.error("Load error:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      const user = await base44.auth.me();
      await base44.entities.ShiftHandoff.create({
        ...formData,
        logged_by: user?.full_name || user?.email,
      });
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        shift: "evening",
        department: "All",
        urgency: "medium",
        items_86d: "",
        staff_issues: "",
        guest_issues: "",
        maintenance_problems: "",
        cash_issues: "",
        prep_concerns: "",
        vendor_issues: "",
        reservations_to_watch: "",
        notes_for_next_manager: "",
        tags: [],
      });
      const updated = await base44.entities.ShiftHandoff.list("-created_date", 100);
      setHandoffs(updated);
      setShowForm(false);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.ShiftHandoff.delete(id);
      setHandoffs(handoffs.filter(h => h.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const markResolved = async (id, item) => {
    try {
      const handoff = handoffs.find(h => h.id === id);
      const resolved = handoff.resolved_items || [];
      await base44.entities.ShiftHandoff.update(id, {
        resolved_items: [...new Set([...resolved, item])]
      });
      const updated = await base44.entities.ShiftHandoff.list("-created_date", 100);
      setHandoffs(updated);
    } catch (error) {
      console.error("Resolve error:", error);
    }
  };

  const isResolved = (handoff, item) => {
    return handoff.resolved_items?.includes(item) || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter handoffs
  const filtered = handoffs.filter(h => {
    if (filterShift && h.shift !== filterShift) return false;
    if (filterDept && h.department !== filterDept && h.department !== "All") return false;
    if (filterUrgency && h.urgency !== filterUrgency) return false;
    if (filterManager && h.logged_by !== filterManager) return false;
    return true;
  });

  // Separate urgent from regular
  const urgent = filtered.filter(h => h.urgency === "critical");
  const regular = filtered.filter(h => h.urgency !== "critical");
  const managers = [...new Set(handoffs.map(h => h.logged_by).filter(Boolean))];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold">Manager Handoff Hub</h1>
        <Button onClick={() => setShowForm(true)} size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> New Handoff
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Filters</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Select value={filterShift} onValueChange={setFilterShift}>
            <SelectTrigger><SelectValue placeholder="All Shifts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Shifts</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
              <SelectItem value="night">Night</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger><SelectValue placeholder="All Depts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Depts</SelectItem>
              <SelectItem value="FOH">FOH</SelectItem>
              <SelectItem value="BOH">BOH</SelectItem>
              <SelectItem value="Bar">Bar</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterUrgency} onValueChange={setFilterUrgency}>
            <SelectTrigger><SelectValue placeholder="All Urgency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Urgency</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterManager} onValueChange={setFilterManager}>
            <SelectTrigger><SelectValue placeholder="All Managers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Managers</SelectItem>
              {managers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Urgent Handoffs */}
      {urgent.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Critical Handoffs
          </h2>
          {urgent.map(handoff => (
            <HandoffCard key={handoff.id} handoff={handoff} expanded={expandedId === handoff.id} onToggle={() => setExpandedId(expandedId === handoff.id ? null : handoff.id)} onDelete={handleDelete} onMarkResolved={markResolved} isResolved={isResolved} />
          ))}
        </div>
      )}

      {/* All Handoffs */}
      <div className="space-y-3">
        {regular.length === 0 && urgent.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No shift handoffs found.
          </div>
        ) : (
          regular.map(handoff => (
            <HandoffCard key={handoff.id} handoff={handoff} expanded={expandedId === handoff.id} onToggle={() => setExpandedId(expandedId === handoff.id ? null : handoff.id)} onDelete={handleDelete} onMarkResolved={markResolved} isResolved={isResolved} />
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Shift Handoff</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Shift</label>
                <Select value={formData.shift} onValueChange={v => setFormData(prev => ({ ...prev, shift: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Department</label>
                <Select value={formData.department} onValueChange={v => setFormData(prev => ({ ...prev, department: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FOH">FOH</SelectItem>
                    <SelectItem value="BOH">BOH</SelectItem>
                    <SelectItem value="Bar">Bar</SelectItem>
                    <SelectItem value="All">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Date</label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Urgency</label>
                <Select value={formData.urgency} onValueChange={v => setFormData(prev => ({ ...prev, urgency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Items 86'd</label>
              <textarea value={formData.items_86d} onChange={(e) => setFormData(prev => ({ ...prev, items_86d: e.target.value }))} placeholder="List items that ran out..." className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Staff Issues</label>
              <textarea value={formData.staff_issues} onChange={(e) => setFormData(prev => ({ ...prev, staff_issues: e.target.value }))} placeholder="Any staff concerns..." className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Guest Issues</label>
              <textarea value={formData.guest_issues} onChange={(e) => setFormData(prev => ({ ...prev, guest_issues: e.target.value }))} placeholder="Guest complaints..." className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Maintenance Problems</label>
              <textarea value={formData.maintenance_problems} onChange={(e) => setFormData(prev => ({ ...prev, maintenance_problems: e.target.value }))} placeholder="Equipment or facility issues..." className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Cash Issues</label>
              <textarea value={formData.cash_issues} onChange={(e) => setFormData(prev => ({ ...prev, cash_issues: e.target.value }))} placeholder="Drawer discrepancies..." className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Prep Concerns</label>
              <textarea value={formData.prep_concerns} onChange={(e) => setFormData(prev => ({ ...prev, prep_concerns: e.target.value }))} placeholder="Prep for next service..." className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Vendor Issues</label>
              <textarea value={formData.vendor_issues} onChange={(e) => setFormData(prev => ({ ...prev, vendor_issues: e.target.value }))} placeholder="Missing deliveries..." className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Events or Reservations to Watch</label>
              <textarea value={formData.reservations_to_watch} onChange={(e) => setFormData(prev => ({ ...prev, reservations_to_watch: e.target.value }))} placeholder="Large reservations, VIP..." className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Notes for Next Manager</label>
              <textarea value={formData.notes_for_next_manager} onChange={(e) => setFormData(prev => ({ ...prev, notes_for_next_manager: e.target.value }))} placeholder="Any important notes..." className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all", formData.tags.includes(tag) ? `${TAG_COLORS[tag]}` : "bg-muted border-border text-muted-foreground")}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Handoff</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HandoffCard({ handoff, expanded, onToggle, onDelete, onMarkResolved, isResolved }) {
  const urgencyConfig = URGENCY_CONFIG[handoff.urgency] || URGENCY_CONFIG.medium;

  const items = [
    { key: "items_86d", label: "86'd Items" },
    { key: "staff_issues", label: "Staff Issues" },
    { key: "guest_issues", label: "Guest Issues" },
    { key: "maintenance_problems", label: "Maintenance" },
    { key: "cash_issues", label: "Cash Issues" },
    { key: "prep_concerns", label: "Prep Concerns" },
    { key: "vendor_issues", label: "Vendor Issues" },
    { key: "reservations_to_watch", label: "Events/Reservations" },
    { key: "notes_for_next_manager", label: "Manager Notes" },
  ];

  return (
    <div className={cn("bg-card border-2 rounded-xl overflow-hidden transition-all", handoff.urgency === "critical" ? "border-destructive/40" : "border-border")}>
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className={cn("px-2 py-1 rounded text-xs font-bold", urgencyConfig.bg)}>
            {URGENCY_CONFIG[handoff.urgency]?.label}
          </div>
          <div>
            <p className="font-semibold">{handoff.shift.charAt(0).toUpperCase() + handoff.shift.slice(1)} Shift • {handoff.department}</p>
            <p className="text-xs text-muted-foreground">{handoff.date} • {handoff.logged_by}</p>
          </div>
          {handoff.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-2">
              {handoff.tags.slice(0, 2).map(tag => (
                <span key={tag} className={cn("px-1.5 py-0.5 rounded text-xs font-semibold", TAG_COLORS[tag])}>
                  {tag}
                </span>
              ))}
              {handoff.tags.length > 2 && <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-muted">+{handoff.tags.length - 2}</span>}
            </div>
          )}
        </div>
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform flex-shrink-0", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="border-t border-border p-4 bg-secondary/5 space-y-3 text-sm">
          {items.map(({ key, label }) => handoff[key] && (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{label}</p>
                {isResolved(handoff, key) && <Check className="h-4 w-4 text-green-600" />}
              </div>
              <p className={cn("text-muted-foreground", isResolved(handoff, key) && "line-through opacity-50")}>{handoff[key]}</p>
              {!isResolved(handoff, key) && (
                <button onClick={() => onMarkResolved(handoff.id, key)} className="text-xs text-primary hover:underline font-semibold">
                  Mark resolved
                </button>
              )}
            </div>
          ))}
          <div className="flex justify-end pt-2 border-t border-border">
            <button onClick={() => onDelete(handoff.id)} className="text-destructive hover:text-destructive/80 text-xs font-semibold flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}