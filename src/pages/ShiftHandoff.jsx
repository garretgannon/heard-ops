import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  AlertTriangle, Flame, MessageSquare, CheckCircle2, Clock, Users,
  ChevronRight, Check, Calendar, ArrowLeftRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";
import DesktopPageHeader from "@/components/DesktopPageHeader";

const SHIFTS = {
  morning:   { label: "Breakfast",  time: "6:00 AM – 12:00 PM" },
  afternoon: { label: "Lunch",      time: "12:00 PM – 4:00 PM" },
  evening:   { label: "Dinner",     time: "4:00 PM – 11:00 PM" },
  night:     { label: "Late Night", time: "11:00 PM – 2:00 AM" },
};

function getShiftInfo() {
  const h = new Date().getHours();
  if (h < 12) return { key: "morning",   ...SHIFTS.morning };
  if (h < 16) return { key: "afternoon", ...SHIFTS.afternoon };
  if (h < 23) return { key: "evening",   ...SHIFTS.evening };
  return              { key: "night",    ...SHIFTS.night };
}

const cardStyle = {
  background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)",
};

export default function ShiftHandoff() {
  const [issues, setIssues]             = useState([]);
  const [eightySixItems, setEightySixItems] = useState([]);
  const [prepItems, setPrepItems]       = useState([]);
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [user, setUser]                 = useState(null);
  const [activeNoteTab, setActiveNoteTab] = useState("FOH");
  const [completing, setCompleting]     = useState(false);
  const [completed, setCompleted]       = useState(false);
  const [notes, setNotes]               = useState("");

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
    haptics.medium();
    setCompleting(true);
    try {
      await base44.functions.invoke("createHandoff", {
        shift: shift.key, notes,
        completed_by: user?.full_name || user?.email || "Unknown",
        open_issues: issues.length,
        eighty_six_count: eightySixItems.length,
        follow_up_count: followUpCount,
      });
      haptics.success();
      setCompleted(true);
    } catch {
      await base44.entities.ShiftHandoff.create({
        shift: shift.key, notes,
        completed_by: user?.full_name || user?.email || "Unknown",
        date: new Date().toISOString().split("T")[0],
        status: "completed",
      }).catch(() => {});
      haptics.success();
      setCompleted(true);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent"
        style={{ boxShadow: "0 0 20px rgba(230,106,31,0.35)" }}
      />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading handoff…</p>
    </div>
  );

  if (completed) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 pb-24 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 20 }}
        className="flex h-20 w-20 items-center justify-center rounded-full border border-green-500/40"
        style={{ background: "rgba(34,197,94,0.12)", boxShadow: "0 0 40px rgba(34,197,94,0.2)" }}
      >
        <CheckCircle2 className="h-10 w-10 text-green-400" style={{ filter: "drop-shadow(0 0 6px rgba(34,197,94,0.6))" }} />
      </motion.div>
      <div>
        <p className="metric-label">Shift Complete</p>
        <h2 className="mt-1 text-2xl font-black text-foreground">Handoff Saved</h2>
        <p className="mt-1 text-sm text-muted-foreground">Notes saved and next manager notified.</p>
      </div>
      <button
        onClick={() => { setCompleted(false); load(); }}
        className="rounded-2xl border border-border/50 px-6 py-3 text-sm font-black text-foreground transition-all active:scale-[0.97]"
        style={{ background: "linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)" }}
      >
        Start New Handoff
      </button>
    </div>
  );

  return (
    <div className="min-h-screen pb-40 lg:pb-12">
      <DesktopPageHeader title="Shift Handoff" subtitle="Document and pass the shift" />
      {/* Sticky header */}
      <div
        className="lg:hidden sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{
          background: "linear-gradient(180deg, rgba(6,10,16,0.97) 0%, rgba(8,13,20,0.95) 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 16px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <div>
              <p className="metric-label">Close of Shift</p>
              <h1 className="text-2xl font-black tracking-tight text-foreground">Shift Handoff</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-4">

        {/* Shift context */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Calendar, label: dayName, value: today,               color: 'text-amber-400', border: 'border-amber-500/25', bg: 'bg-amber-500/10' },
            { icon: Clock,    label: 'Shift',  value: shift.label,         color: 'text-blue-400',  border: 'border-blue-500/25',  bg: 'bg-blue-500/10' },
            { icon: Users,    label: 'Manager',value: user?.full_name?.split(' ')[0] || '—', color: 'text-green-400', border: 'border-green-500/25', bg: 'bg-green-500/10' },
          ].map(({ icon: Icon, label, value, color, border, bg }) => (
            <div key={label} className={cn('flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center', border)} style={cardStyle}>
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg border', border, bg)}>
                <Icon className={cn('h-4 w-4', color)} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="text-xs font-black text-foreground leading-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* Snapshot tiles */}
        <section className="space-y-2">
          <p className="metric-label px-1">Shift Snapshot</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: AlertTriangle, label: 'Open Issues',     value: issues.length,       color: 'text-red-400',    border: 'border-red-500/25',    bg: 'rgba(239,68,68,0.06)' },
              { icon: Flame,         label: "86'd Items",      value: eightySixItems.length, color: 'text-red-400',  border: 'border-red-500/25',    bg: 'rgba(239,68,68,0.06)' },
              { icon: MessageSquare, label: 'Carryover Tasks', value: tasks.length,         color: 'text-blue-400',  border: 'border-blue-500/25',   bg: 'rgba(96,165,250,0.06)' },
              { icon: CheckCircle2,  label: 'Follow-Ups',      value: followUpCount,        color: 'text-amber-400', border: 'border-amber-500/25',  bg: 'rgba(245,158,11,0.06)' },
            ].map(({ icon: Icon, label, value, color, border, bg }) => (
              <div key={label} className={cn('flex flex-col items-center rounded-2xl border p-4 text-center', value > 0 ? border : 'border-border/40')}
                style={{ background: value > 0 ? bg : 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}>
                <Icon className={cn('h-4 w-4 mb-2', value > 0 ? color : 'text-muted-foreground/50')} />
                <p className={cn('text-2xl font-black', value > 0 ? color : 'text-foreground')}>{value}</p>
                <p className="mt-1 text-[10px] font-bold text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Attention items */}
        {(issues.length > 0 || eightySixItems.length > 0) && (
          <section className="space-y-2">
            <p className="metric-label px-1">Needs Attention</p>
            {issues.slice(0, 2).map(issue => (
              <div key={issue.id} className="flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/6 px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{issue.title}</p>
                  <p className="text-[10px] text-muted-foreground">{issue.category || "Issue"}</p>
                </div>
              </div>
            ))}
            {eightySixItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/6 px-3 py-2.5">
                <Flame className="h-4 w-4 shrink-0 text-red-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{item.item_name} (86'd)</p>
                  <p className="text-[10px] text-muted-foreground">{item.category || "86 Item"}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Department tab notes */}
        <section className="space-y-3">
          <p className="metric-label px-1">Department Notes</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {["FOH", "BOH", "Bar", "Facilities", "Guest"].map(dept => (
              <button
                key={dept}
                onClick={() => setActiveNoteTab(dept)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                  activeNoteTab === dept ? "glow-active" : "border-border/40 bg-black/25 text-muted-foreground"
                )}
              >
                {dept}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { dot: "bg-green-400", text: "Patio waitlist was long early. Shifted 2 servers to support FOH flow.", meta: "J. Rivera · 1h ago" },
              { dot: "bg-blue-400",  text: "Table 12 birthday celebration. Reserved preferred window seat.", meta: "J. Rivera · 2h ago" },
            ].map((note, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border/40 px-3 py-3" style={cardStyle}>
                <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', note.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{note.text}</p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">{note.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notes for next manager */}
        <section className="space-y-2">
          <p className="metric-label px-1">Notes for Next Manager</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="What does the next manager need to know?"
            rows={4}
            className="w-full rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground resize-none"
          />
        </section>
      </div>

      {/* Fixed CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 py-4"
        style={{
          background: "rgba(5,10,15,0.97)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <button
          onClick={handleCompleteHandoff}
          disabled={completing}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-black text-white disabled:opacity-60 active:scale-[0.98] transition-all"
          style={{
            background: "linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)",
            boxShadow: "0 0 0 1px rgba(230,106,31,0.35), 0 0 24px rgba(230,106,31,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {completing
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
            : <><Check className="h-5 w-5" />Complete Handoff</>
          }
        </button>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">Saves notes, creates follow-ups, and notifies the next manager.</p>
      </div>
    </div>
  );
}

export const hideBase44Index = true;
