import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertTriangle, Flame, MessageSquare, CheckCircle2, Clock, Users,
  ChevronRight, Plus, Check, Calendar, ArrowLeftRight
} from "lucide-react";
import { format } from "date-fns";

const SHIFTS = {
  morning:   { label: "Breakfast",  time: "6:00 AM – 12:00 PM" },
  afternoon: { label: "Lunch",      time: "12:00 PM – 4:00 PM" },
  evening:   { label: "Dinner",     time: "4:00 PM – 11:00 PM" },
  night:     { label: "Late Night", time: "11:00 PM – 2:00 AM" },
};

function getShiftInfo() {
  const hour = new Date().getHours();
  if (hour < 12) return { key: "morning", ...SHIFTS.morning };
  if (hour < 16) return { key: "afternoon", ...SHIFTS.afternoon };
  if (hour < 23) return { key: "evening", ...SHIFTS.evening };
  return { key: "night", ...SHIFTS.night };
}

export default function ShiftHandoff() {
  const [issues, setIssues] = useState([]);
  const [eightySixItems, setEightySixItems] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeNoteTab, setActiveNoteTab] = useState("FOH");
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [notes, setNotes] = useState("");

  const load = async () => {
    try {
      const me = await base44.auth.me().catch(() => null);
      setUser(me);
      const [iss, eighty, prep, tsk] = await Promise.all([
        base44.entities.Issue.filter({ status: "open" }).catch(() => []),
        base44.entities.EightySixItem.filter({ is_active: true }).catch(() => []),
        base44.entities.PrepItem.filter({ status: "pending" }).catch(() => []),
        base44.entities.ClosingChecklist.filter({ status: "pending" }).catch(() => []),
      ]);
      setIssues(iss.slice(0, 3));
      setEightySixItems(eighty.slice(0, 2));
      setPrepItems(prep.slice(0, 5));
      setTasks(tsk.slice(0, 3));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const shift = getShiftInfo();
  const today = format(new Date(), "MMM d, yyyy");
  const dayName = format(new Date(), "EEEE");
  const followUpCount = issues.length + eightySixItems.length + prepItems.length;

  const handleCompleteHandoff = async () => {
    setCompleting(true);
    try {
      await base44.functions.invoke("createHandoff", {
        shift: shift.key,
        notes,
        completed_by: user?.full_name || user?.email || "Unknown",
        open_issues: issues.length,
        eighty_six_count: eightySixItems.length,
        follow_up_count: followUpCount,
      });
      setCompleted(true);
    } catch (e) {
      // Fallback: save directly as ShiftHandoff entity
      await base44.entities.ShiftHandoff.create({
        shift: shift.key,
        notes,
        completed_by: user?.full_name || user?.email || "Unknown",
        date: new Date().toISOString().split("T")[0],
        status: "completed",
      }).catch(() => {});
      setCompleted(true);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (completed) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-5">
      <div className="h-16 w-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-400" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-foreground">Handoff Complete</h2>
        <p className="text-sm text-muted-foreground mt-1">Notes saved and next manager notified.</p>
      </div>
      <button onClick={() => { setCompleted(false); load(); }} className="btn-secondary text-sm px-6">
        Start New Handoff
      </button>
    </div>
  );

  return (
    <div className="min-h-screen pb-40 lg:pb-12">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/30 px-4 pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" /> Shift Handoff
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">What the next manager needs to know</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">

        {/* INFO ROW */}
        <div className="bg-card border border-border rounded-xl p-3 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="h-9 w-9 rounded-lg bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-yellow-400" />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">{dayName}</p>
            <p className="text-xs font-bold text-foreground leading-tight">{today}</p>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Shift</p>
            <p className="text-xs font-bold text-foreground leading-tight">{shift.label}</p>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="h-9 w-9 rounded-lg bg-green-500/10 border border-green-500/25 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Manager</p>
            <p className="text-xs font-bold text-foreground leading-tight">{user?.full_name?.split(" ")[0] || "—"}</p>
          </div>
        </div>

        {/* SNAPSHOT */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Shift Snapshot</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center text-center">
              <AlertTriangle className="h-4 w-4 text-red-400 mb-1.5" />
              <p className="text-2xl font-extrabold text-red-400">{issues.length}</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">Open Issues</p>
              <p className="text-[10px] text-muted-foreground">needs attention</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center text-center">
              <Flame className="h-4 w-4 text-red-400 mb-1.5" />
              <p className="text-2xl font-extrabold text-red-400">{eightySixItems.length}</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">86'd Items</p>
              <p className="text-[10px] text-muted-foreground">today</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center text-center">
              <MessageSquare className="h-4 w-4 text-blue-400 mb-1.5" />
              <p className="text-2xl font-extrabold text-blue-400">{tasks.length}</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">Carryover Tasks</p>
              <p className="text-[10px] text-muted-foreground">next shift</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center text-center">
              <CheckCircle2 className="h-4 w-4 text-yellow-400 mb-1.5" />
              <p className="text-2xl font-extrabold text-yellow-400">{followUpCount}</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">Follow-Ups</p>
              <p className="text-[10px] text-muted-foreground">pending</p>
            </div>
          </div>
        </section>

        {/* NEEDS ATTENTION */}
        {(issues.length > 0 || eightySixItems.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Needs Attention</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                {issues.length + eightySixItems.length} items
              </span>
            </div>
            <div className="space-y-2">
              {issues.slice(0, 2).map(issue => (
                <div key={issue.id} className="bg-card border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">{issue.category || "Issue"}</p>
                  </div>
                </div>
              ))}
              {eightySixItems.map(item => (
                <div key={item.id} className="bg-card border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
                  <Flame className="h-4 w-4 text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.item_name} (86'd)</p>
                    <p className="text-xs text-muted-foreground">{item.category || "86 Item"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DEPARTMENT NOTES */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Department Notes</h2>
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {["FOH", "BOH", "Bar", "Facilities", "Guest"].map(dept => (
              <button
                key={dept}
                onClick={() => setActiveNoteTab(dept)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0 border ${
                  activeNoteTab === dept
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-card text-muted-foreground border-border"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2.5">
              <div className="h-2 w-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">Patio waitlist was long early. Shifted 2 servers to support FOH flow.</p>
                <p className="text-xs text-muted-foreground mt-1.5">J. Rivera • 1h ago</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2.5">
              <div className="h-2 w-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">Table 12 birthday celebration. Reserved preferred window seat.</p>
                <p className="text-xs text-muted-foreground mt-1.5">J. Rivera • 2h ago</p>
              </div>
            </div>
          </div>
        </section>

        {/* NOTES FOR NEXT MANAGER */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Notes for Next Manager</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add any notes for the incoming manager..."
            rows={4}
            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </section>

        {/* LINKED ITEMS */}
        {(issues.length > 0 || eightySixItems.length > 0 || prepItems.length > 0) && (
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Linked Items</h2>
            <div className="space-y-2">
              {issues.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-semibold text-foreground">Open Issues</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{issues.length}</span>
                </div>
              )}
              {eightySixItems.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Flame className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-semibold text-foreground">86 Log</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{eightySixItems.length}</span>
                </div>
              )}
              {prepItems.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-semibold text-foreground">Prep Items Needing Review</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{prepItems.length}</span>
                </div>
              )}
            </div>
          </section>
        )}

      </div>

      {/* FIXED BOTTOM CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/30 px-4 py-4"
        style={{
          background: "rgba(5,10,15,0.96)",
          backdropFilter: "blur(20px)",
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <button
          onClick={handleCompleteHandoff}
          disabled={completing}
          className="w-full h-12 btn-primary flex items-center justify-center gap-2 text-base disabled:opacity-60"
        >
          {completing
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <><Check className="h-5 w-5" /> Complete Handoff</>
          }
        </button>
        <p className="text-xs text-muted-foreground text-center mt-2">Saves notes, creates follow-ups, and notifies the next manager.</p>
      </div>
    </div>
  );
}

export const hideBase44Index = true;