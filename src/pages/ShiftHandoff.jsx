import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertTriangle, Flame, MessageSquare, CheckCircle2, Clock, Users,
  ChevronRight, Plus, Check, Calendar
} from "lucide-react";
import { format } from "date-fns";

const SHIFTS = {
  morning: { label: "Breakfast", time: "6:00 AM – 12:00 PM", icon: "🌅", color: "purple" },
  afternoon: { label: "Lunch", time: "12:00 PM – 4:00 PM", icon: "☀️", color: "blue" },
  evening: { label: "Dinner", time: "4:00 PM – 11:00 PM", icon: "🌙", color: "purple" },
  night: { label: "Late Night", time: "11:00 PM – 2:00 AM", icon: "🌙", color: "purple" },
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
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

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

  const staffingCount = 1;
  const followUpCount = issues.length + eightySixItems.length + prepItems.length;

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0D] pb-32">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-40 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F24] px-4 py-3">
        <h1 className="text-lg font-bold text-white">Shift Handoff</h1>
        <p className="text-[10px] text-[#6B7280] mt-0.5">What the next manager needs to know</p>
      </div>

      {/* MAIN CONTENT */}
      <div className="px-4 py-4 space-y-5">

        {/* HEADER INFO CARD */}
        <div className="bg-[#141418] border border-[#1F1F24] rounded-xl p-3 grid grid-cols-3 gap-3">
          {/* Date */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase">{dayName}</p>
              <p className="text-xs font-bold text-white leading-tight mt-0.5">{today}</p>
            </div>
          </div>

          {/* Shift */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              shift.color === "purple" 
                ? "bg-purple-500/10 border border-purple-500/25" 
                : "bg-blue-500/10 border border-blue-500/25"
            }`}>
              <Clock className={`h-4 w-4 ${shift.color === "purple" ? "text-purple-400" : "text-blue-400"}`} />
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase">Shift</p>
              <p className="text-xs font-bold text-white leading-tight mt-0.5">{shift.label}</p>
            </div>
          </div>

          {/* Manager */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 border border-green-500/25 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase">Manager</p>
              <p className="text-xs font-bold text-white leading-tight mt-0.5">{user?.full_name?.split(" ")[0] || "—"}</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: SHIFT SNAPSHOT */}
        <section>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">1. Shift Snapshot</h2>
          <div className="grid grid-cols-2 gap-2">
            {/* Open Issues */}
            <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3 flex flex-col items-center text-center">
              <AlertTriangle className="h-4 w-4 text-red-400 mb-2" />
              <p className="text-3xl font-bold text-red-400">{issues.length}</p>
              <p className="text-sm text-white font-semibold mt-1">Open Issues</p>
              <p className="text-xs text-[#6B7280] mt-0.5">needs attention</p>
            </div>

            {/* 86'd Items */}
            <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3 flex flex-col items-center text-center">
              <Flame className="h-4 w-4 text-red-400 mb-2" />
              <p className="text-3xl font-bold text-red-400">{eightySixItems.length}</p>
              <p className="text-sm text-white font-semibold mt-1">86'd Items</p>
              <p className="text-xs text-[#6B7280] mt-0.5">today</p>
            </div>

            {/* Staffing Notes */}
            <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3 flex flex-col items-center text-center">
              <MessageSquare className="h-4 w-4 text-blue-400 mb-2" />
              <p className="text-3xl font-bold text-blue-400">{staffingCount}</p>
              <p className="text-sm text-white font-semibold mt-1">Staffing Notes</p>
              <p className="text-xs text-[#6B7280] mt-0.5">needs help</p>
            </div>

            {/* Follow-Ups */}
            <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3 flex flex-col items-center text-center">
              <CheckCircle2 className="h-4 w-4 text-yellow-400 mb-2" />
              <p className="text-3xl font-bold text-yellow-400">{followUpCount}</p>
              <p className="text-sm text-white font-semibold mt-1">Follow-Ups</p>
              <p className="text-xs text-[#6B7280] mt-0.5">pending</p>
            </div>
          </div>
        </section>

        {/* SECTION 2: NEEDS IMMEDIATE ATTENTION */}
        {(issues.length > 0 || eightySixItems.length > 0) && (
          <section>
            <div className="flex items-center justify-center mb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest max-w-xs">
                2. Needs<br />Immediate Attention
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{issues.length + eightySixItems.length} items</span>
            </div>
            <div className="space-y-2">
              {issues.slice(0, 2).map(issue => (
                <div key={issue.id} className="bg-[#141418] border border-red-500/30 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base font-bold text-white truncate">{issue.title}</p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5 line-clamp-1">{issue.category}</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#FF6A00]/50 text-[#FF6A00] hover:bg-[#FF6A00]/5 transition-colors shrink-0 active:scale-95">
                    Action
                  </button>
                </div>
              ))}
              {eightySixItems.map(item => (
                <div key={item.id} className="bg-[#141418] border border-red-500/30 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <Flame className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base font-bold text-white truncate">{item.item_name} (86'd)</p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5">{item.category}</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#FF6A00]/50 text-[#FF6A00] hover:bg-[#FF6A00]/5 transition-colors shrink-0 active:scale-95">
                    Action
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: DEPARTMENT NOTES */}
        <section>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">3. Department Notes</h2>
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {["FOH", "BOH", "Bar", "Facilities", "Guest"].map(dept => (
              <button
                key={dept}
                onClick={() => setActiveNoteTab(dept)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0 ${
                  activeNoteTab === dept
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                    : "bg-[#141418] text-[#A1A1AA] border border-[#1F1F24]"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3 flex items-start gap-2.5">
              <div className="h-2 w-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-base text-white line-clamp-2">Patio waitlist was long early. Shifted 2 servers to support FOH flow.</p>
                <p className="text-xs text-[#6B7280] mt-2">J. Rivera • 1h ago</p>
              </div>
            </div>
            <div className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3 flex items-start gap-2.5">
              <div className="h-2 w-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-base text-white line-clamp-2">Table 12 birthday celebration. Reserved preferred window seat.</p>
                <p className="text-xs text-[#6B7280] mt-2">J. Rivera • 2h ago</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: CARRYOVER TASKS */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">4. Carryover Tasks</h2>
            <button className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#FF6A00]/50 text-[#FF6A00] hover:bg-[#FF6A00]/5 transition-colors active:scale-95 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 3).map((task, idx) => (
              <div key={idx} className="bg-[#141418] border border-[#1F1F24] rounded-lg p-3 flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border border-[#1F1F24] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-white truncate">{task.task_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1F24] text-[#A1A1AA] font-semibold shrink-0">{task.area}</span>
                    {task.completed_at && <span className="text-xs text-[#6B7280]">{format(new Date(task.completed_at), "h:mm a")}</span>}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  task.status === "completed" ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"
                }`}>
                  {task.status === "completed" ? "Done" : "Open"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: LINKED ITEMS */}
        <section>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">5. Linked Items</h2>
          <div className="space-y-2">
            {issues.length > 0 && (
              <button className="w-full bg-[#141418] border border-[#1F1F24] rounded-lg p-3 flex items-center justify-between hover:bg-[#1A1A1F] transition-colors active:scale-95">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-base font-semibold text-white">Open Issues</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">{issues.length}</span>
                  <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                </div>
              </button>
            )}
            {eightySixItems.length > 0 && (
              <button className="w-full bg-[#141418] border border-[#1F1F24] rounded-lg p-3 flex items-center justify-between hover:bg-[#1A1A1F] transition-colors active:scale-95">
                <div className="flex items-center gap-2.5">
                  <Flame className="h-4 w-4 text-red-400" />
                  <span className="text-base font-semibold text-white">86 Log</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">{eightySixItems.length}</span>
                  <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                </div>
              </button>
            )}
            {prepItems.length > 0 && (
              <button className="w-full bg-[#141418] border border-[#1F1F24] rounded-lg p-3 flex items-center justify-between hover:bg-[#1A1A1F] transition-colors active:scale-95">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  <span className="text-base font-semibold text-white">Prep Items Needing Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{prepItems.length}</span>
                  <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                </div>
              </button>
            )}
          </div>
        </section>

      </div>

      {/* FIXED BOTTOM CTA */}
        <div className="fixed bottom-20 left-0 right-0 z-30 bg-[#0B0B0D]/95 backdrop-blur border-t border-[#1F1F24] px-4 py-3">
          <button
            onClick={() => setShowCompleteDialog(true)}
            className="w-full h-12 bg-[#FF6A00] text-black font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Check className="h-5 w-5" /> Complete Handoff
          </button>
          <p className="text-xs text-[#6B7280] text-center mt-2">Saves notes, creates follow-ups, and notifies the next manager.</p>
      </div>
    </div>
  );
}

export const hideBase44Index = true;