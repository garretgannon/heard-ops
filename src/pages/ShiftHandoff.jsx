import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, ChevronDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TAGS = ["FOH", "BOH", "Bar", "Maintenance", "Cash", "Guest", "Staff", "Urgent"];
const TAG_COLORS = {
  FOH: "bg-blue-500/20 text-blue-700 border-blue-300",
  BOH: "bg-orange-500/20 text-orange-700 border-orange-300",
  Bar: "bg-purple-500/20 text-purple-700 border-purple-300",
  Maintenance: "bg-yellow-500/20 text-yellow-700 border-yellow-300",
  Cash: "bg-green-500/20 text-green-700 border-green-300",
  Guest: "bg-cyan-500/20 text-cyan-700 border-cyan-300",
  Staff: "bg-pink-500/20 text-pink-700 border-pink-300",
  Urgent: "bg-red-500/20 text-red-700 border-red-300",
};

export default function ShiftHandoff() {
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    shift: "evening",
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

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const data = await base44.entities.ShiftHandoff.filter({ date: todayStr }, "-created_date", 20);
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
        date: todayStr,
        shift: "evening",
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
      const updated = await base44.entities.ShiftHandoff.filter({ date: todayStr }, "-created_date", 20);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shift Handoff</h1>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Handoff
        </Button>
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
                <label className="block text-sm font-semibold mb-2">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Shift</label>
                <select
                  value={formData.shift}
                  onChange={(e) => setFormData(prev => ({ ...prev, shift: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Items 86'd</label>
              <textarea
                value={formData.items_86d}
                onChange={(e) => setFormData(prev => ({ ...prev, items_86d: e.target.value }))}
                placeholder="List items that ran out..."
                className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Staff Issues</label>
              <textarea
                value={formData.staff_issues}
                onChange={(e) => setFormData(prev => ({ ...prev, staff_issues: e.target.value }))}
                placeholder="Any staff issues or concerns..."
                className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Guest Issues</label>
              <textarea
                value={formData.guest_issues}
                onChange={(e) => setFormData(prev => ({ ...prev, guest_issues: e.target.value }))}
                placeholder="Any guest issues or complaints..."
                className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Maintenance Problems</label>
              <textarea
                value={formData.maintenance_problems}
                onChange={(e) => setFormData(prev => ({ ...prev, maintenance_problems: e.target.value }))}
                placeholder="Any equipment or facility issues..."
                className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Cash Issues</label>
              <textarea
                value={formData.cash_issues}
                onChange={(e) => setFormData(prev => ({ ...prev, cash_issues: e.target.value }))}
                placeholder="Drawer discrepancies, short/over amounts..."
                className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Prep Concerns</label>
              <textarea
                value={formData.prep_concerns}
                onChange={(e) => setFormData(prev => ({ ...prev, prep_concerns: e.target.value }))}
                placeholder="Issues with prep for next service..."
                className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Vendor Issues</label>
              <textarea
                value={formData.vendor_issues}
                onChange={(e) => setFormData(prev => ({ ...prev, vendor_issues: e.target.value }))}
                placeholder="Missing deliveries, quality issues..."
                className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Events or Reservations to Watch</label>
              <textarea
                value={formData.reservations_to_watch}
                onChange={(e) => setFormData(prev => ({ ...prev, reservations_to_watch: e.target.value }))}
                placeholder="Large reservations, VIP tables, special events..."
                className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Notes for Next Manager</label>
              <textarea
                value={formData.notes_for_next_manager}
                onChange={(e) => setFormData(prev => ({ ...prev, notes_for_next_manager: e.target.value }))}
                placeholder="Any other important notes..."
                className="w-full p-2 rounded-md border border-input bg-transparent text-sm min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                      formData.tags.includes(tag)
                        ? `${TAG_COLORS[tag]}`
                        : "bg-muted border-border text-muted-foreground"
                    )}
                  >
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

      {/* Handoff List */}
      <div className="space-y-3">
        {handoffs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No shift handoffs logged yet.
          </div>
        ) : (
          handoffs.map(handoff => (
            <div
              key={handoff.id}
              className={cn(
                "bg-card border rounded-xl overflow-hidden transition-all",
                handoff.tags.includes("Urgent") ? "border-red-500/50" : "border-border"
              )}
            >
              <button
                onClick={() => setExpandedId(expandedId === handoff.id ? null : handoff.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div>
                    <p className="font-semibold">{handoff.shift.charAt(0).toUpperCase() + handoff.shift.slice(1)} Shift</p>
                    <p className="text-xs text-muted-foreground">{handoff.date} • {handoff.logged_by}</p>
                  </div>
                  {handoff.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {handoff.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={cn("px-2 py-0.5 rounded text-xs font-semibold", TAG_COLORS[tag])}>
                          {tag}
                        </span>
                      ))}
                      {handoff.tags.length > 3 && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-muted text-muted-foreground">
                          +{handoff.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", expandedId === handoff.id && "rotate-180")} />
              </button>

              {expandedId === handoff.id && (
                <div className="border-t border-border p-4 bg-secondary/5 space-y-3 text-sm">
                  {handoff.items_86d && (
                    <div>
                      <p className="font-semibold mb-1">Items 86'd</p>
                      <p className="text-muted-foreground">{handoff.items_86d}</p>
                    </div>
                  )}
                  {handoff.staff_issues && (
                    <div>
                      <p className="font-semibold mb-1">Staff Issues</p>
                      <p className="text-muted-foreground">{handoff.staff_issues}</p>
                    </div>
                  )}
                  {handoff.guest_issues && (
                    <div>
                      <p className="font-semibold mb-1">Guest Issues</p>
                      <p className="text-muted-foreground">{handoff.guest_issues}</p>
                    </div>
                  )}
                  {handoff.maintenance_problems && (
                    <div>
                      <p className="font-semibold mb-1">Maintenance Problems</p>
                      <p className="text-muted-foreground">{handoff.maintenance_problems}</p>
                    </div>
                  )}
                  {handoff.cash_issues && (
                    <div>
                      <p className="font-semibold mb-1">Cash Issues</p>
                      <p className="text-muted-foreground">{handoff.cash_issues}</p>
                    </div>
                  )}
                  {handoff.prep_concerns && (
                    <div>
                      <p className="font-semibold mb-1">Prep Concerns</p>
                      <p className="text-muted-foreground">{handoff.prep_concerns}</p>
                    </div>
                  )}
                  {handoff.vendor_issues && (
                    <div>
                      <p className="font-semibold mb-1">Vendor Issues</p>
                      <p className="text-muted-foreground">{handoff.vendor_issues}</p>
                    </div>
                  )}
                  {handoff.reservations_to_watch && (
                    <div>
                      <p className="font-semibold mb-1">Events/Reservations to Watch</p>
                      <p className="text-muted-foreground">{handoff.reservations_to_watch}</p>
                    </div>
                  )}
                  {handoff.notes_for_next_manager && (
                    <div>
                      <p className="font-semibold mb-1">Notes for Next Manager</p>
                      <p className="text-muted-foreground">{handoff.notes_for_next_manager}</p>
                    </div>
                  )}
                  <div className="flex justify-end pt-2 border-t border-border">
                    <button
                      onClick={() => handleDelete(handoff.id)}
                      className="text-red-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}