import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  ListChecks,
  MessageSquareText,
  RefreshCw,
  Save,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { toast } from "sonner";

const PRE_SHIFT_DUTY = "Set up and conduct pre-shift briefing";

const DUTIES = [
  "Review incoming handoff",
  PRE_SHIFT_DUTY,
  "Verify 86'd items and event changes",
  "Walk all active stations",
  "Check critical equipment and open issues",
  "Confirm staffing and breaks",
  "Review manager follow-ups",
  "Prepare closing handoff",
];

const SHIFT_LABELS = {
  morning: "Opening",
  afternoon: "Midday",
  evening: "Dinner",
  night: "Closing",
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function currentShiftKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 16) return "afternoon";
  if (hour < 23) return "evening";
  return "night";
}

function recentDate(item) {
  return item?.created_date || item?.updated_date || item?.date || item?.eventDate || item?.waste_date || "";
}

function titleFor(item, fallback) {
  return item?.title || item?.eventName || item?.item_name || item?.notes_for_next_manager || fallback;
}

function safeEntityCall(call) {
  return call?.catch?.(() => []) || Promise.resolve([]);
}

function BriefingCard({ icon: Icon, label, count, tone = "text-primary", children }) {
  return (
    <section className="bg-card border border-border rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${tone}`} />
          <h2 className="text-sm font-bold text-foreground">{label}</h2>
        </div>
        <span className="text-xs font-bold text-muted-foreground">{count}</span>
      </div>
      {children}
    </section>
  );
}

function EmptyLine({ text }) {
  return <p className="text-xs text-muted-foreground py-1">{text}</p>;
}

function MiniItem({ title, meta, tone = "border-border" }) {
  return (
    <div className={`rounded-lg border ${tone} bg-background/40 px-3 py-2`}>
      <p className="text-sm font-semibold text-foreground truncate">{title}</p>
      {meta && <p className="text-xs text-muted-foreground mt-0.5 truncate">{meta}</p>}
    </div>
  );
}

export default function ManagerShift() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStage, setActiveStage] = useState("start");
  const [briefing, setBriefing] = useState({
    handoffs: [],
    managerLogs: [],
    eightySix: [],
    waste: [],
    events: [],
    issues: [],
    tasks: [],
    staff: [],
  });
  const [preShiftSaved, setPreShiftSaved] = useState(false);
  const [preShiftId, setPreShiftId] = useState(null);
  const [preShiftForm, setPreShiftForm] = useState({
    roles: "",
    specialCleaning: "",
    reservations: "",
    outOfStock: "",
    specials: "",
    notes: "",
  });
  const [acknowledged, setAcknowledged] = useState(false);
  const [checkedDuties, setCheckedDuties] = useState([]);
  const [handoffNotes, setHandoffNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const date = todayKey();
  const shift = currentShiftKey();
  const preShiftEntityShift = shift === "night" ? "evening" : shift;
  const ackKey = `heard-manager-shift-ack:${date}:${shift}:${user?.email || "manager"}`;

  const load = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        handoffs,
        managerLogs,
        eightySix,
        waste,
        events,
        issues,
        tasks,
        staff,
        preShifts,
      ] = await Promise.all([
        safeEntityCall(base44.entities.ShiftHandoff?.list?.("-created_date", 8)),
        safeEntityCall(base44.entities.ManagerLog?.list?.("-created_date", 12)),
        safeEntityCall(base44.entities.EightySixItem?.filter?.({ is_active: true })),
        safeEntityCall(base44.entities.WasteEntry?.list?.("-created_date", 8)),
        safeEntityCall(base44.entities.BEO?.list?.("-eventDate", 8)),
        safeEntityCall(base44.entities.Issue?.filter?.({ status: "open" })),
        safeEntityCall(base44.entities.Task?.list?.("-updated_date", 20)),
        safeEntityCall(base44.entities.StaffShift?.filter?.({ date })),
        safeEntityCall(base44.entities.PreShift?.filter?.({ date, shift: preShiftEntityShift })),
      ]);

      const upcomingEvents = events.filter(event => !event.eventDate || event.eventDate >= date).slice(0, 4);
      const activeEightySix = eightySix.slice(0, 4);
      const currentPreShift = preShifts?.[0];

      setBriefing({
        handoffs: handoffs.slice(0, 3),
        managerLogs: managerLogs.filter(log => log.status !== "resolved").slice(0, 4),
        eightySix: activeEightySix,
        waste: waste.slice(0, 4),
        events: upcomingEvents,
        issues: issues.slice(0, 4),
        tasks: tasks.filter(task => !["complete", "approved"].includes(task.status)).slice(0, 6),
        staff: staff.slice(0, 60),
      });
      setPreShiftSaved(Boolean(currentPreShift));
      setPreShiftId(currentPreShift?.id || null);
      setPreShiftForm({
        roles: currentPreShift?.staffing_notes || staff
          .map(person => [person.employee_name, person.role, person.station].filter(Boolean).join(" - "))
          .join("\n"),
        specialCleaning: currentPreShift?.issues || "",
        reservations: currentPreShift?.reservations || upcomingEvents
          .map(event => [event.eventName, event.startTime, event.room, event.guestCount ? `${event.guestCount} guests` : ""].filter(Boolean).join(" - "))
          .join("\n"),
        outOfStock: currentPreShift?.items_86d || activeEightySix
          .map(item => [item.item_name, item.category].filter(Boolean).join(" - "))
          .join("\n"),
        specials: currentPreShift?.specials || "",
        notes: currentPreShift?.notes || "",
      });
      setAcknowledged(localStorage.getItem(ackKey) === "true");
      if (currentPreShift) {
        setCheckedDuties(prev => prev.includes(PRE_SHIFT_DUTY) ? prev : [...prev, PRE_SHIFT_DUTY]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [ackKey]);

  const totals = useMemo(() => {
    const critical = briefing.issues.length + briefing.eightySix.length;
    const followUps = briefing.managerLogs.length + briefing.tasks.length;
    return { critical, followUps };
  }, [briefing]);

  const toggleDuty = (duty) => {
    if (duty === PRE_SHIFT_DUTY && !preShiftSaved) {
      toast.error("Set up the pre-shift briefing first");
      return;
    }

    setCheckedDuties(prev => (
      prev.includes(duty) ? prev.filter(item => item !== duty) : [...prev, duty]
    ));
  };

  const updatePreShiftField = (field, value) => {
    setPreShiftSaved(false);
    setCheckedDuties(prev => prev.filter(item => item !== PRE_SHIFT_DUTY));
    setPreShiftForm(prev => ({ ...prev, [field]: value }));
  };

  const savePreShift = async () => {
    const hasRequiredPlan = preShiftForm.roles.trim() && preShiftForm.notes.trim();
    if (!hasRequiredPlan) {
      toast.error("Add staff roles and briefing notes");
      return;
    }

    const talkingPoints = [
      preShiftForm.reservations && `Reservations/BEO:\n${preShiftForm.reservations}`,
      preShiftForm.outOfStock && `Out of stock / 86:\n${preShiftForm.outOfStock}`,
      preShiftForm.specials && `Specials:\n${preShiftForm.specials}`,
      preShiftForm.specialCleaning && `Special cleaning:\n${preShiftForm.specialCleaning}`,
      preShiftForm.notes && `Briefing notes:\n${preShiftForm.notes}`,
    ].filter(Boolean).join("\n\n");

    const payload = {
      date,
      shift: preShiftEntityShift,
      staffing_notes: preShiftForm.roles,
      specials: preShiftForm.specials,
      issues: preShiftForm.specialCleaning,
      notes: talkingPoints,
    };

    const saved = preShiftId
      ? await base44.entities.PreShift?.update?.(preShiftId, payload).catch(() => null)
      : await base44.entities.PreShift?.create?.(payload).catch(() => null);

    if (saved?.id) setPreShiftId(saved.id);
    setPreShiftSaved(true);
    setCheckedDuties(prev => prev.includes(PRE_SHIFT_DUTY) ? prev : [...prev, PRE_SHIFT_DUTY]);
    toast.success("Pre-shift briefing saved");
  };

  const acknowledgeBriefing = async () => {
    localStorage.setItem(ackKey, "true");
    setAcknowledged(true);

    await base44.entities.ManagerLog?.create?.({
      title: `${SHIFT_LABELS[shift]} briefing reviewed`,
      category: "shift_note",
      shift,
      notes: "Incoming handoff and shift briefing acknowledged.",
      priority: totals.critical > 0 ? "high" : "medium",
      status: "resolved",
      logged_by: user?.email,
      logged_by_name: user?.full_name,
    }).catch(() => null);

    toast.success("Briefing acknowledged");
    setActiveStage("run");
  };

  const completeHandoff = async () => {
    if (!preShiftSaved) {
      toast.error("Complete the pre-shift briefing before closing the shift");
      setActiveStage("run");
      return;
    }

    if (!handoffNotes.trim()) {
      toast.error("Add handoff notes for the next manager");
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.ShiftHandoff?.create?.({
        date,
        shift,
        logged_by: user?.email || user?.full_name || "Manager",
        department: "All",
        urgency: totals.critical > 0 ? "high" : "medium",
        notes_for_next_manager: handoffNotes,
        items_86d: briefing.eightySix.map(item => item.item_name).join(", "),
        maintenance_problems: briefing.issues.map(issue => issue.title).join("; "),
        reservations_to_watch: briefing.events.map(event => event.eventName).join("; "),
        tags: ["FOH", "BOH", "Prep"],
      });
      toast.success("Shift handoff saved");
      setHandoffNotes("");
      setActiveStage("start");
      load({ quiet: true });
    } catch (error) {
      toast.error("Could not save handoff");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36 lg:pb-12">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/30 px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Manager Shift</p>
            <h1 className="text-xl font-extrabold text-foreground">{SHIFT_LABELS[shift]} command</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Briefing, duties, and closing handoff</p>
          </div>
          <button
            type="button"
            onClick={() => load({ quiet: true })}
            className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center"
            aria-label="Refresh shift"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-muted/30 p-1">
          {[
            ["start", "Start"],
            ["run", "Duties"],
            ["close", "Close"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveStage(id)}
              className={`h-9 rounded-md text-xs font-bold transition ${
                activeStage === id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-3xl mx-auto">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border border-border rounded-xl p-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-2xl font-extrabold text-foreground mt-1">{totals.critical}</p>
            <p className="text-xs text-muted-foreground">critical items</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <ListChecks className="h-4 w-4 text-primary" />
            <p className="text-2xl font-extrabold text-foreground mt-1">{checkedDuties.length}/{DUTIES.length}</p>
            <p className="text-xs text-muted-foreground">duties complete</p>
          </div>
        </div>

        {activeStage === "start" && (
          <>
            <div className={`rounded-xl border p-3 flex items-start gap-3 ${
              acknowledged ? "border-green-500/25 bg-green-500/10" : "border-primary/25 bg-primary/10"
            }`}>
              {acknowledged ? (
                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">
                  {acknowledged ? "Briefing reviewed" : "Review before starting duties"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirming this creates a manager note and moves you into duties.
                </p>
              </div>
            </div>

            <BriefingCard icon={MessageSquareText} label="Previous Handoff" count={briefing.handoffs.length}>
              {briefing.handoffs.length === 0 ? (
                <EmptyLine text="No recent handoff found." />
              ) : briefing.handoffs.map(item => (
                <MiniItem
                  key={item.id}
                  title={item.notes_for_next_manager || item.notes || "Handoff note"}
                  meta={[item.department, item.urgency].filter(Boolean).join(" - ")}
                />
              ))}
            </BriefingCard>

            <BriefingCard icon={Flame} label="86'd Items" count={briefing.eightySix.length} tone="text-red-400">
              {briefing.eightySix.length === 0 ? (
                <EmptyLine text="No active 86'd items." />
              ) : briefing.eightySix.map(item => (
                <MiniItem key={item.id} title={item.item_name} meta={item.category || item.notes} tone="border-red-500/20" />
              ))}
            </BriefingCard>

            <BriefingCard icon={AlertTriangle} label="Open Issues" count={briefing.issues.length} tone="text-red-400">
              {briefing.issues.length === 0 ? (
                <EmptyLine text="No open issues." />
              ) : briefing.issues.map(item => (
                <MiniItem key={item.id} title={item.title} meta={item.category || item.priority} tone="border-red-500/20" />
              ))}
            </BriefingCard>

            <BriefingCard icon={CalendarClock} label="BEOs / Events" count={briefing.events.length}>
              {briefing.events.length === 0 ? (
                <EmptyLine text="No upcoming event changes." />
              ) : briefing.events.map(item => (
                <MiniItem key={item.id} title={item.eventName} meta={[item.eventDate, item.startTime, item.room].filter(Boolean).join(" - ")} />
              ))}
            </BriefingCard>

            <BriefingCard icon={Store} label="Manager Logs and Waste" count={briefing.managerLogs.length + briefing.waste.length}>
              {[...briefing.managerLogs, ...briefing.waste].length === 0 ? (
                <EmptyLine text="No manager notes or recent waste." />
              ) : [...briefing.managerLogs, ...briefing.waste].slice(0, 6).map(item => (
                <MiniItem
                  key={`${item.id}-${recentDate(item)}`}
                  title={titleFor(item, "Shift note")}
                  meta={item.category || item.reason || recentDate(item)}
                />
              ))}
            </BriefingCard>

            <button
              type="button"
              onClick={acknowledgeBriefing}
              disabled={acknowledged}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Check className="h-5 w-5" />
              {acknowledged ? "Briefing Acknowledged" : "I Reviewed The Briefing"}
            </button>
          </>
        )}

        {activeStage === "run" && (
          <>
            <section className={`bg-card border rounded-xl p-3 space-y-3 ${
              preShiftSaved ? "border-green-500/25" : "border-primary/30"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Pre-Shift Briefing
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Required before duties are complete. Use this to address FOH and keep face-to-face interaction built into the shift.
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                  preShiftSaved
                    ? "bg-green-500/10 text-green-400 border-green-500/25"
                    : "bg-primary/10 text-primary border-primary/25"
                }`}>
                  {preShiftSaved ? "Ready" : "Required"}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-background/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Scheduled Team</p>
                  <span className="text-xs font-bold text-foreground">{briefing.staff.length}</span>
                </div>
                {briefing.staff.length === 0 ? (
                  <EmptyLine text="No scheduled staff found for today." />
                ) : (
                  <div className="grid grid-cols-1 gap-1.5">
                    {briefing.staff.slice(0, 8).map(person => (
                      <div key={person.id || `${person.employee_name}-${person.start_time}`} className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-foreground truncate">{person.employee_name}</span>
                        <span className="text-muted-foreground shrink-0">
                          {[person.role, person.station, person.start_time].filter(Boolean).join(" - ")}
                        </span>
                      </div>
                    ))}
                    {briefing.staff.length > 8 && (
                      <p className="text-xs text-muted-foreground">+{briefing.staff.length - 8} more scheduled</p>
                    )}
                  </div>
                )}
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-foreground">Roles / Assignments</span>
                <textarea
                  value={preShiftForm.roles}
                  onChange={event => updatePreShiftField("roles", event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="Who is working, role changes, sections, stations, breaks..."
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-foreground">Reservations / BEO</span>
                <textarea
                  value={preShiftForm.reservations}
                  onChange={event => updatePreShiftField("reservations", event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="Large parties, VIPs, private events, service timing..."
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-foreground">Out of Stock / 86</span>
                  <textarea
                    value={preShiftForm.outOfStock}
                    onChange={event => updatePreShiftField("outOfStock", event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    placeholder="86'd items, low stock, substitutions..."
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-foreground">Specials</span>
                  <textarea
                    value={preShiftForm.specials}
                    onChange={event => updatePreShiftField("specials", event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    placeholder="Food, drinks, promos, talking points..."
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-foreground">Special Cleaning / Focus</span>
                <textarea
                  value={preShiftForm.specialCleaning}
                  onChange={event => updatePreShiftField("specialCleaning", event.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="Cleaning priorities, reset items, inspection focus..."
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-foreground">Briefing Notes</span>
                <textarea
                  value={preShiftForm.notes}
                  onChange={event => updatePreShiftField("notes", event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="What you will say to the team before service..."
                />
              </label>

              <button
                type="button"
                onClick={savePreShift}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Pre-Shift Briefing
              </button>
            </section>

            <section className="bg-card border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  Manager Duties
                </h2>
                <span className="text-xs font-bold text-muted-foreground">{checkedDuties.length}/{DUTIES.length}</span>
              </div>

              {DUTIES.map(duty => {
                const checked = checkedDuties.includes(duty);
                return (
                  <button
                    key={duty}
                    type="button"
                    onClick={() => toggleDuty(duty)}
                    className="w-full min-h-11 rounded-lg border border-border bg-background/40 px-3 py-2 flex items-center gap-3 text-left"
                  >
                    <span className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                      checked ? "bg-primary border-primary text-primary-foreground" : "border-border"
                    }`}>
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className={`text-sm font-semibold ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {duty}
                    </span>
                  </button>
                );
              })}
            </section>

            <section className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => navigate("/operational-map")}
                className="bg-card border border-border rounded-xl p-3 flex items-center justify-between text-left"
              >
                <span>
                  <span className="block text-sm font-bold text-foreground">Open Stations</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Readiness, assignments, issues</span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/approvals")}
                className="bg-card border border-border rounded-xl p-3 flex items-center justify-between text-left"
              >
                <span>
                  <span className="block text-sm font-bold text-foreground">Review Approvals</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Completed work needing manager review</span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </section>
          </>
        )}

        {activeStage === "close" && (
          <section className="bg-card border border-border rounded-xl p-3 space-y-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Handoff To Next Manager
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Summarize unresolved items, staffing notes, guest issues, and what to watch next shift.
              </p>
            </div>

            <textarea
              value={handoffNotes}
              onChange={event => setHandoffNotes(event.target.value)}
              rows={7}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-primary"
              placeholder="What does the next manager need to know?"
            />

            <button
              type="button"
              onClick={completeHandoff}
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Check className="h-5 w-5" />
              {submitting ? "Saving..." : "Complete Shift Handoff"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
