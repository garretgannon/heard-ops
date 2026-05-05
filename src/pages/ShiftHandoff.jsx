import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Plus, Check, MessageSquare, ChevronDown, ChevronRight,
  Clock, Users, Trash2, Flame, ClipboardList, UtensilsCrossed
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const currentHour = new Date().getHours();
const currentShiftLabel = currentHour < 12 ? "AM Shift" : currentHour < 17 ? "PM Shift" : "Evening Shift";

export default function ShiftHandoff() {
  const [handoffs, setHandoffs] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showNotes, setShowNotes] = useState({});
  const [formData, setFormData] = useState({ notes: "", urgency: "medium" });
  const [user, setUser] = useState(null);

  const load = async () => {
    try {
      const me = await base44.auth.me().catch(() => null);
      setUser(me);
      const data = await base44.entities.ShiftHandoff.list("-created_date", 50);
      setHandoffs(data);
      const prep = await base44.entities.PrepItem.filter({ status: "overdue" }).catch(() => []);
      const iss = await base44.entities.Issue.filter({ status: "open" }).catch(() => []);
      setPrepItems(prep.slice(0, 5));
      setIssues(iss.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    await base44.entities.ShiftHandoff.create({
      shift: currentShiftLabel,
      date: format(new Date(), "yyyy-MM-dd"),
      notes_for_next_manager: formData.notes,
      urgency: formData.urgency,
      logged_by: user?.full_name || user?.email
    });
    setFormData({ notes: "", urgency: "medium" });
    setShowForm(false);
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const latest = handoffs[0] || null;

  return (
    <div className="min-h-screen bg-[#0B0B0D] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F24] px-4 py-3">
        <h1 className="text-lg font-bold text-white">Shift Handoff</h1>
        <p className="text-[10px] text-[#6B7280] mt-0.5">What the next manager needs to know</p>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-6">

        {/* SHIFT SNAPSHOT */}
        <section>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3">
              <p className="text-[10px] text-[#6B7280] uppercase font-bold">Current Shift</p>
              <p className="text-base font-bold text-white mt-1">{currentShiftLabel}</p>
              <p className="text-xs text-[#A1A1AA] mt-0.5">{format(new Date(), "MMM d, h:mm a")}</p>
            </div>
            <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3">
              <p className="text-[10px] text-[#6B7280] uppercase font-bold">On Duty</p>
              <p className="text-sm font-bold text-white mt-1 truncate">{user?.full_name || "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3">
              <p className="text-xs text-[#6B7280] uppercase font-bold">Issues</p>
              <p className="text-2xl font-bold text-[#FF6A00] mt-1">{issues.length}</p>
            </div>
            <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3">
              <p className="text-xs text-[#6B7280] uppercase font-bold">Overdue Prep</p>
              <p className="text-2xl font-bold text-[#FF6A00] mt-1">{prepItems.length}</p>
            </div>
          </div>
        </section>

        {/* URGENT SECTION */}
        {(issues.length > 0 || prepItems.length > 0) && (
          <section>
            <h2 className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest mb-3">Needs Immediate Attention</h2>
            <div className="space-y-2">
              {issues.map(issue => (
                <div key={issue.id} className="bg-[#141418] border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{issue.title}</p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5">Category: {issue.category}</p>
                    </div>
                  </div>
                </div>
              ))}
              {prepItems.map(item => (
                <div key={item.id} className="bg-[#141418] border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <ClipboardList className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.name}</p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5">Overdue prep item</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DEPARTMENT NOTES */}
        <section>
          <h2 className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest mb-3">Department Notes</h2>
          <div className="space-y-2">
            {["FOH Notes", "BOH Notes", "Bar Notes"].map(dept => (
              <button
                key={dept}
                onClick={() => setShowNotes(p => ({ ...p, [dept]: !p[dept] }))}
                className="w-full bg-[#141418] border border-[#1F1F24] rounded-lg p-3 hover:border-[#FF6A00]/30 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{dept}</p>
                  <ChevronDown className={cn("h-4 w-4 text-[#6B7280] transition-transform", showNotes[dept] && "rotate-180")} />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* RECENT HANDOFF NOTES */}
        {latest?.notes_for_next_manager && (
          <section>
            <h2 className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest mb-3">Latest Handoff Note</h2>
            <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3">
              <p className="text-sm text-white leading-relaxed">{latest.notes_for_next_manager}</p>
              <p className="text-xs text-[#6B7280] mt-2">— {latest.logged_by} ({latest.shift}, {latest.date})</p>
            </div>
          </section>
        )}

        {/* LINKED ITEMS */}
        <section>
          <h2 className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest mb-3">Related Items</h2>
          <div className="space-y-2">
            {issues.length > 0 && (
              <button className="w-full bg-[#141418] border border-[#1F1F24] rounded-lg p-3 hover:bg-[#1A1A1F] transition-colors text-left flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Open Issues</p>
                  <p className="text-xs text-[#6B7280]">{issues.length} pending</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#6B7280]" />
              </button>
            )}
            {prepItems.length > 0 && (
              <button className="w-full bg-[#141418] border border-[#1F1F24] rounded-lg p-3 hover:bg-[#1A1A1F] transition-colors text-left flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Overdue Prep Items</p>
                  <p className="text-xs text-[#6B7280]">{prepItems.length} pending</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#6B7280]" />
              </button>
            )}
          </div>
        </section>

        {handoffs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <MessageSquare className="h-8 w-8 text-[#6B7280]" />
            <p className="text-sm text-[#A1A1AA]">No handoffs logged yet</p>
          </div>
        )}
      </div>

      {/* FIXED BOTTOM BUTTON */}
      <div className="fixed bottom-20 left-0 right-0 z-30 bg-[#0B0B0D]/95 backdrop-blur border-t border-[#1F1F24] px-4 py-3">
        <button
          onClick={() => setShowForm(true)}
          className="w-full h-12 bg-[#FF6A00] text-black font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Plus className="h-5 w-5" /> Complete Handoff
        </button>
      </div>

      {/* FORM DIALOG */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete Shift Handoff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#6B7280] uppercase">Handoff Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="What does the next manager need to know?"
                rows={5}
                className="mt-2 w-full px-3 py-2 text-sm border border-[#1F1F24] rounded-lg bg-[#141418] text-white focus:outline-none focus:ring-1 focus:ring-[#FF6A00] resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6B7280] uppercase">Urgency</label>
              <select
                value={formData.urgency}
                onChange={e => setFormData(p => ({ ...p, urgency: e.target.value }))}
                className="mt-2 w-full px-3 py-2 text-sm border border-[#1F1F24] rounded-lg bg-[#141418] text-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#FF6A00] text-black hover:bg-[#FF6A00]/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;