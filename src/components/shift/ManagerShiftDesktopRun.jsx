import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Check, CheckCircle2, ClipboardCheck,
  MapPin, RefreshCw, Target, Users,
} from "lucide-react";

const PRE_SHIFT_FIELD_DEFS = {
  roles:              { label: "Roles / Assignments",      rows: 4, placeholder: "Who is working, role changes, sections, stations, breaks…" },
  reservations:       { label: "Reservations / BEOs",      rows: 3, placeholder: "Large parties, VIPs, private events, service timing…" },
  outOfStock:         { label: "Out of Stock / 86",        rows: 3, placeholder: "86'd items, low stock, substitutions…" },
  specials:           { label: "Specials",                 rows: 3, placeholder: "Food, drinks, promos, talking points…" },
  specialCleaning:    { label: "Special Cleaning / Focus", rows: 2, placeholder: "Cleaning priorities, reset items, inspection focus…" },
  notes:              { label: "Shift Notes",              rows: 4, placeholder: "What you will say to the team before service…" },
  sideworkPriorities: { label: "Sidework Priorities",      rows: 2, placeholder: "Sidework assignments, station duties, priority tasks…" },
  prepNeeds:          { label: "Prep Needs",               rows: 3, placeholder: "Items needing prep, quantities, priority order…" },
  lineCheckNotes:     { label: "Line Check Notes",         rows: 3, placeholder: "Station temps, product quality, readiness, equipment status…" },
  tempCheckNotes:     { label: "Temperature Checks",       rows: 2, placeholder: "Walk-in, freezer, hot holding — any variances to note…" },
  beverageNotes:      { label: "Beverage Notes",           rows: 2, placeholder: "Par levels, tap status, batch recipes, feature cocktails…" },
  barPrepNotes:       { label: "Bar Prep",                 rows: 3, placeholder: "Garnish prep, batch cocktails, keg status, mise en place…" },
};

const FIELD_ORDER_BY_DEPT = {
  foh:     ['sideworkPriorities', 'specials', 'specialCleaning', 'notes'],
  boh:     ['prepNeeds', 'lineCheckNotes', 'tempCheckNotes', 'specials', 'notes'],
  bar:     ['beverageNotes', 'barPrepNotes', 'specials', 'notes'],
  banquet: ['specials', 'notes'],
  all:     ['specials', 'specialCleaning', 'notes'],
};

function DutyCard({ config, checked, locked, onToggle }) {
  const Icon = config.icon;
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      disabled={locked}
      layout
      animate={{
        borderColor: checked ? "rgba(34,197,94,0.4)" : locked ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)",
        backgroundColor: checked ? "rgba(34,197,94,0.06)" : "transparent",
      }}
      transition={{ duration: 0.2 }}
      className="ops-panel flex w-full items-center gap-3 px-4 py-3 text-left"
    >
      <motion.div
        animate={{
          backgroundColor: checked ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)",
          borderColor: checked ? "rgba(34,197,94,0.5)" : locked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)",
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
      >
        {checked
          ? <Check className="h-4 w-4 text-green-400" />
          : <Icon className={cn("h-3.5 w-3.5", locked ? "text-muted-foreground/30" : "text-muted-foreground")} />
        }
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold leading-snug", checked ? "text-muted-foreground line-through" : locked ? "text-muted-foreground/50" : "text-foreground")}>
          {config.text}
        </p>
        {locked && <p className="mt-0.5 text-[10px] text-amber-400/70">Save pre-shift notes first</p>}
      </div>
      {checked && <Check className="h-3.5 w-3.5 shrink-0 text-green-400/60" />}
    </motion.button>
  );
}

export default function ManagerShiftDesktopRun({
  shiftContext,
  candidateProfiles,
  selectProfile,
  resetContext,
  briefing,
  preShiftForm,
  updatePreShiftField,
  preShiftSaved,
  preShiftPublished,
  savePreShift,
  publishBriefing,
  refreshing,
  load,
  DUTIES_CONFIG,
  checkedDuties,
  toggleDuty,
  dutiesPct,
  xpFloats,
  setXpFloats,
}) {
  const navigate = useNavigate();
  const dept = shiftContext?.department || 'all';
  const fieldKeys = FIELD_ORDER_BY_DEPT[dept] || FIELD_ORDER_BY_DEPT.all;
  const fields = fieldKeys.map(k => ({ field: k, ...PRE_SHIFT_FIELD_DEFS[k] }));

  return (
    <div className="hidden lg:grid lg:grid-cols-[1fr_296px] xl:grid-cols-[1fr_340px] lg:gap-6 items-start">

      {/* ── Left: Briefing form ── */}
      <div className="space-y-4">
        <div className="ops-section-header">
          <div>
            <p className="ops-kicker text-primary">Running</p>
            <h2 className="ops-section-title mt-0.5">Pre-Shift Notes</h2>
          </div>
          <span className={cn("ops-section-meta rounded-full border px-2.5 py-0.5 text-[10px] font-black",
            preShiftSaved ? "border-green-500/35 bg-green-500/10 text-green-400" : "border-primary/35 bg-primary/10 text-primary"
          )}>
            {preShiftSaved ? "✓ Saved" : "Required"}
          </span>
        </div>

        {/* Briefing form card */}
        <div className="ops-panel overflow-hidden">
          {/* Scope row */}
          <div className="flex items-center justify-between gap-3 border-b border-border/20 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">Shift Scope</p>
            {shiftContext ? (
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black",
                  shiftContext.department === 'foh'     ? 'border-blue-500/30 text-blue-400' :
                  shiftContext.department === 'boh'     ? 'border-amber-500/30 text-amber-400' :
                  shiftContext.department === 'bar'     ? 'border-teal-500/30 text-teal-400' :
                  shiftContext.department === 'banquet' ? 'border-cyan-500/30 text-cyan-400' :
                                                          'border-primary/30 text-primary'
                )}>
                  {shiftContext.profileName}
                </span>
                <button type="button" onClick={resetContext} className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors">
                  Change
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 justify-end">
                {candidateProfiles.map(p => (
                  <button key={p.id} type="button" onClick={() => { selectProfile(p); load({ quiet: true }); }}
                    className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-border/60 transition-all">
                    {p.shortName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auto-imported data */}
          <div className="border-b border-border/20">
            <div className="flex items-center justify-between px-4 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/60">Auto-Imported Context</p>
              <button type="button" onClick={() => load({ quiet: true })}
                className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <RefreshCw className={cn("h-2.5 w-2.5", refreshing && "animate-spin")} /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border/20 border-t border-border/10">
              {[
                { label: "Staff",         value: briefing.staff.length,                              color: briefing.staff.length > 0 ? "text-foreground" : "text-muted-foreground/30" },
                { label: "Reservations",  value: briefing.events.length + briefing.reservationsList.length, color: briefing.events.length + briefing.reservationsList.length > 0 ? "text-amber-400" : "text-muted-foreground/30" },
                { label: "86'd",          value: briefing.eightySix.length,                          color: briefing.eightySix.length > 0 ? "text-red-400" : "text-muted-foreground/30" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center justify-center gap-0.5 py-3">
                  <p className={cn("text-lg font-black tabular-nums", color)}>{value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3 px-4 py-4">
            {fields.map(({ field, label, rows, placeholder }) => (
              <label key={field} className="block space-y-1.5">
                <span className="text-xs font-black text-foreground">{field === 'notes' ? 'Manager Notes / Talking Points' : label}</span>
                <textarea
                  value={preShiftForm[field]}
                  onChange={e => updatePreShiftField(field, e.target.value)}
                  rows={rows}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </label>
            ))}

            {/* Publish / save */}
            {preShiftPublished ? (
              <>
                <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/8 py-3 text-sm font-black text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> Published to Staff
                </div>
                <button type="button" onClick={publishBriefing} className="w-full py-1.5 text-center text-xs font-bold text-muted-foreground transition-colors hover:text-foreground">
                  Re-publish with changes
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={publishBriefing}
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white active:scale-[0.98] transition-all"
                >
                  Publish to Staff
                </button>
                <button type="button" onClick={savePreShift} className="w-full py-1.5 text-center text-xs font-bold text-muted-foreground transition-colors hover:text-foreground">
                  Save Draft Only
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Sticky panel — duties + quick nav ── */}
      <div className="sticky top-[120px] space-y-3">
        {/* Duties */}
        <div className="ops-panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/20">
            <div className="flex items-center gap-2.5">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-black text-foreground">Shift Duties</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-black tabular-nums", dutiesPct === 100 ? "text-green-400" : "text-foreground")}>
                {checkedDuties.length}/{DUTIES_CONFIG.length}
              </span>
              {dutiesPct === 100 && <CheckCircle2 className="h-4 w-4 text-green-400" />}
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 pt-3 pb-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-black/40">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${dutiesPct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                  background: dutiesPct === 100 ? "hsl(var(--status-success))" : "hsl(var(--primary))",
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5 px-3 pb-3 pt-2">
            {DUTIES_CONFIG.map((config) => {
              const locked = config.requiresPreShift && !preShiftSaved;
              const checked = checkedDuties.includes(config.text);
              return (
                <DutyCard
                  key={config.text}
                  config={config}
                  checked={checked}
                  locked={locked}
                  onToggle={() => toggleDuty(config)}
                />
              );
            })}
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Floor Map", sub: "Station readiness", path: "/operational-map", icon: MapPin },
            { label: "Approvals", sub: "Pending reviews",   path: "/approvals",       icon: ClipboardCheck },
          ].map(({ label, sub, path, icon: Icon }) => (
            <button key={path} type="button" onClick={() => navigate(path)}
              className="ops-panel ops-panel-interactive flex items-center justify-between gap-2 px-3 py-3 text-left">
              <div>
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-black text-foreground">{label}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40">Duties customizable by Admin / GM in Settings</p>
      </div>
    </div>
  );
}