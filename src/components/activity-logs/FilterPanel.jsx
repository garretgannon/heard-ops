import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Bookmark, ChevronDown, ChevronUp, SlidersHorizontal, Check } from "lucide-react";
import { LOG_TYPES, STATUS_META } from "./logConfig";
import { base44 } from "@/api/base44Client";

const PRIORITIES  = ["critical", "high", "medium", "low"];
const PASS_FAIL   = [{ id: "", label: "Any" }, { id: "passed", label: "Passed ✓" }, { id: "failed", label: "Failed ✗" }];
const OPEN_CLOSED = [{ id: "", label: "Any" }, { id: "open", label: "Open" }, { id: "closed", label: "Closed" }];

const SAVED_PRESETS = [
  {
    id: "today",
    label: "Today's Logs",
    icon: "📅",
    filters: { datePreset: "today" },
  },
  {
    id: "needs_review",
    label: "Needs Review",
    icon: "🔍",
    filters: { statuses: ["needs_review"], requiresReview: true },
  },
  {
    id: "open_maintenance",
    label: "Open Maintenance",
    icon: "🔧",
    filters: { types: ["maintenance"], openClosed: "open" },
  },
  {
    id: "failed_temps",
    label: "Failed Temps",
    icon: "🌡️",
    filters: { types: ["temperature"], passFail: "failed", statuses: ["flagged"] },
  },
  {
    id: "employee_logs",
    label: "Employee Logs",
    icon: "👤",
    filters: { types: ["employee", "manager"] },
  },
  {
    id: "incidents",
    label: "Incidents",
    icon: "🚨",
    filters: { types: ["incident", "issue"], priorities: ["critical", "high"] },
  },
  {
    id: "my_logs",
    label: "My Assigned",
    icon: "📌",
    filters: { assignedToMe: true },
  },
];

export const EMPTY_FILTERS = {
  types:         [],
  statuses:      [],
  priorities:    [],
  datePreset:    "",
  dateFrom:      "",
  dateTo:        "",
  createdBy:     "",
  assignedTo:    "",
  role:          "",
  station:       "",
  area:          "",
  equipment:     "",
  employee:      "",
  passFail:      "",
  openClosed:    "",
  requiresReview: false,
  hasPhoto:      false,
  assignedToMe:  false,
};

function countActive(filters) {
  let n = 0;
  if (filters.types?.length)       n++;
  if (filters.statuses?.length)    n++;
  if (filters.priorities?.length)  n++;
  if (filters.datePreset || filters.dateFrom || filters.dateTo) n++;
  if (filters.createdBy)   n++;
  if (filters.assignedTo)  n++;
  if (filters.role)        n++;
  if (filters.station)     n++;
  if (filters.area)        n++;
  if (filters.equipment)   n++;
  if (filters.employee)    n++;
  if (filters.passFail)    n++;
  if (filters.openClosed)  n++;
  if (filters.requiresReview) n++;
  if (filters.hasPhoto)    n++;
  if (filters.assignedToMe) n++;
  return n;
}

function MultiChip({ options, selected, onChange, colorFn }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const isActive = selected.includes(opt.id);
        return (
          <button key={opt.id} onClick={() => onChange(
            isActive ? selected.filter(s => s !== opt.id) : [...selected, opt.id]
          )}
            className={cn(
              "h-6 px-2 rounded-full text-[10px] font-bold border transition-all",
              isActive
                ? (colorFn?.(opt.id) || "bg-primary/20 text-primary border-primary/40")
                : "bg-card border-border text-muted-foreground hover:border-muted-foreground/40"
            )}>
            {opt.icon && <span className="mr-1">{opt.icon}</span>}
            {opt.label}
            {isActive && <Check className="inline h-2.5 w-2.5 ml-1" />}
          </button>
        );
      })}
    </div>
  );
}

function Section({ label, open, onToggle, children }) {
  return (
    <div className="border-b border-border/40 last:border-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between py-2.5 text-left">
        <span className="text-xs font-bold text-foreground">{label}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

export default function FilterPanel({ filters, onChange, currentUser, isOpen, onClose }) {
  const [openSections, setOpenSections] = useState({ type: true, status: true, date: true, people: false, location: false, quick: false });
  const [stations, setStations] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    if (isOpen) {
      base44.entities.Station.list("-name", 50).then(d => setStations(d.filter(s => s.isActive))).catch(() => {});
      base44.entities.Area.list("-name", 50).then(d => setAreas(d.filter(a => a.isActive))).catch(() => {});
    }
  }, [isOpen]);

  const toggle = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));
  const set = (key, val) => onChange({ ...filters, [key]: val });
  const activeCount = countActive(filters);

  const TYPE_OPTS = Object.entries(LOG_TYPES).map(([id, cfg]) => ({ id, label: cfg.label }));
  const STATUS_OPTS = Object.entries(STATUS_META).map(([id, m]) => ({ id, label: m.label }));
  const PRIORITY_OPTS = PRIORITIES.map(p => ({ id: p, label: p.charAt(0).toUpperCase() + p.slice(1) }));

  const typeBadgeColor = (id) => {
    const cfg = LOG_TYPES[id];
    return cfg ? `${cfg.bg} ${cfg.color} border-transparent` : "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-sm bg-card border-l border-border h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground text-sm">Filters</span>
            {activeCount > 0 && (
              <span className="h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button onClick={() => onChange(EMPTY_FILTERS)} className="text-[10px] font-bold text-muted-foreground hover:text-red-400 transition-colors">
                Clear all
              </button>
            )}
            <button onClick={onClose} className="h-7 w-7 rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0">

          {/* Saved Presets */}
          <Section label="Saved Presets" open={openSections.quick} onToggle={() => toggle("quick")}>
            <div className="grid grid-cols-2 gap-1.5">
              {SAVED_PRESETS.map(preset => (
                <button key={preset.id}
                  onClick={() => { onChange({ ...EMPTY_FILTERS, ...preset.filters }); onClose(); }}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-border bg-background text-left hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-[0.97]">
                  <span className="text-sm">{preset.icon}</span>
                  <span className="text-[10px] font-bold text-foreground leading-tight">{preset.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Log Type */}
          <Section label="Log Type" open={openSections.type} onToggle={() => toggle("type")}>
            <MultiChip options={TYPE_OPTS} selected={filters.types} onChange={v => set("types", v)} colorFn={typeBadgeColor} />
          </Section>

          {/* Status */}
          <Section label="Status" open={openSections.status} onToggle={() => toggle("status")}>
            <MultiChip options={STATUS_OPTS} selected={filters.statuses} onChange={v => set("statuses", v)} />
          </Section>

          {/* Priority */}
          <Section label="Priority" open={false} onToggle={() => toggle("priority")}>
            <MultiChip
              options={PRIORITY_OPTS}
              selected={filters.priorities}
              onChange={v => set("priorities", v)}
              colorFn={(id) => ({
                critical: "bg-red-500/20 text-red-400 border-red-500/30",
                high:     "bg-orange-500/20 text-orange-400 border-orange-500/30",
                medium:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
                low:      "bg-muted text-muted-foreground border-border",
              }[id])}
            />
          </Section>

          {/* Date */}
          <Section label="Date Range" open={openSections.date} onToggle={() => toggle("date")}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "today",      label: "Today" },
                  { id: "yesterday",  label: "Yesterday" },
                  { id: "this_week",  label: "This Week" },
                  { id: "last_7",     label: "Last 7 Days" },
                  { id: "this_month", label: "This Month" },
                ].map(p => (
                  <button key={p.id}
                    onClick={() => set("datePreset", filters.datePreset === p.id ? "" : p.id)}
                    className={cn("h-6 px-2 rounded-full text-[10px] font-bold border transition-all",
                      filters.datePreset === p.id ? "bg-primary/20 text-primary border-primary/40" : "bg-card border-border text-muted-foreground hover:border-muted-foreground/40")}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">From</label>
                  <input type="date" value={filters.dateFrom}
                    onChange={e => onChange({ ...filters, dateFrom: e.target.value, datePreset: "" })}
                    className="w-full h-7 px-2 bg-background border border-border rounded-lg text-[11px] text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">To</label>
                  <input type="date" value={filters.dateTo}
                    onChange={e => onChange({ ...filters, dateTo: e.target.value, datePreset: "" })}
                    className="w-full h-7 px-2 bg-background border border-border rounded-lg text-[11px] text-foreground focus:border-primary focus:outline-none" />
                </div>
              </div>
            </div>
          </Section>

          {/* Pass / Fail & Open / Closed */}
          <Section label="Result / State" open={false} onToggle={() => toggle("result")}>
            <div className="space-y-2">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Pass / Fail</label>
                <div className="flex gap-1 mt-1">
                  {PASS_FAIL.map(o => (
                    <button key={o.id} onClick={() => set("passFail", o.id)}
                      className={cn("flex-1 h-7 rounded-lg text-[10px] font-bold border transition-all",
                        filters.passFail === o.id ? "bg-primary/20 text-primary border-primary/40" : "bg-card border-border text-muted-foreground hover:bg-muted")}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Open / Closed</label>
                <div className="flex gap-1 mt-1">
                  {OPEN_CLOSED.map(o => (
                    <button key={o.id} onClick={() => set("openClosed", o.id)}
                      className={cn("flex-1 h-7 rounded-lg text-[10px] font-bold border transition-all",
                        filters.openClosed === o.id ? "bg-primary/20 text-primary border-primary/40" : "bg-card border-border text-muted-foreground hover:bg-muted")}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Quick toggles */}
          <Section label="Quick Filters" open={false} onToggle={() => toggle("toggles")}>
            <div className="space-y-2">
              {[
                { key: "requiresReview", label: "⭐ Requires Manager Review" },
                { key: "hasPhoto",        label: "📷 Has Photo" },
                { key: "assignedToMe",    label: "📌 Assigned to Me" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => set(key, !filters[key])}
                  className={cn("w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all",
                    filters[key] ? "border-primary/40 bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted/40")}>
                  <span className="text-xs font-bold">{label}</span>
                  <div className={cn("h-5 w-9 rounded-full border transition-all flex items-center",
                    filters[key] ? "bg-primary border-primary justify-end" : "bg-muted border-border justify-start")}>
                    <div className="h-3.5 w-3.5 rounded-full bg-white mx-0.5 shadow-sm" />
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* People */}
          <Section label="People" open={openSections.people} onToggle={() => toggle("people")}>
            <div className="space-y-2">
              {[
                { key: "createdBy",  label: "Created By" },
                { key: "assignedTo", label: "Assigned To" },
                { key: "employee",   label: "Employee Name" },
                { key: "role",       label: "Role" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
                  <input type="text" value={filters[key]} onChange={e => set(key, e.target.value)}
                    placeholder={`Filter by ${label.toLowerCase()}...`}
                    className="w-full h-7 px-2 bg-background border border-border rounded-lg text-[11px] text-foreground focus:border-primary focus:outline-none mt-0.5" />
                </div>
              ))}
            </div>
          </Section>

          {/* Location */}
          <Section label="Location" open={openSections.location} onToggle={() => toggle("location")}>
            <div className="space-y-2">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Station</label>
                <select value={filters.station} onChange={e => set("station", e.target.value)}
                  className="w-full h-7 px-2 bg-background border border-border rounded-lg text-[11px] text-foreground focus:border-primary focus:outline-none mt-0.5">
                  <option value="">All Stations</option>
                  {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Area</label>
                <select value={filters.area} onChange={e => set("area", e.target.value)}
                  className="w-full h-7 px-2 bg-background border border-border rounded-lg text-[11px] text-foreground focus:border-primary focus:outline-none mt-0.5">
                  <option value="">All Areas</option>
                  {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Equipment</label>
                <input type="text" value={filters.equipment} onChange={e => set("equipment", e.target.value)}
                  placeholder="Equipment name..."
                  className="w-full h-7 px-2 bg-background border border-border rounded-lg text-[11px] text-foreground focus:border-primary focus:outline-none mt-0.5" />
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-4 py-3">
          <button onClick={onClose} className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95">
            Apply Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}