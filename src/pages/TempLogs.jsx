import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Thermometer, AlertTriangle, Download, Minus, Check, X, QrCode, Clock, ShieldCheck, TrendingUp, Activity, ChevronRight, Droplet, Snowflake } from "lucide-react";
import MetricTile from "../components/MetricTile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { haptics } from "@/utils/haptics";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const LOCATIONS = [
  { name: "Walk-In Cooler", type: "walk_in", min: 32, max: 41 },
  { name: "Freezer", type: "freezer", min: -10, max: 0 },
  { name: "Line Cooler", type: "cooler", min: 32, max: 41 },
  { name: "Prep Cooler", type: "cooler", min: 32, max: 41 },
  { name: "Hot Holding", type: "hot", min: 135, max: 180 },
  { name: "Dish Machine", type: "dish", min: 160, max: 180 },
];

const NEAR_MARGIN = 5;

const getTempStatus = (temp, min, max) => {
  if (temp === null || temp === undefined || temp === "") return "none";
  const t = parseFloat(temp);
  if (isNaN(t)) return "none";
  if (t < min || t > max) return "critical";
  if (t <= min + NEAR_MARGIN || t >= max - NEAR_MARGIN) return "warning";
  return "ok";
};

const S = {
  ok:       { label: "Safe",     bg: "bg-green-500/10", border: "border-l-green-500", text: "text-green-400" },
  warning:  { label: "Warning",  bg: "bg-amber-500/10",   border: "border-l-amber-500",   text: "text-amber-400" },
  critical: { label: "Critical", bg: "bg-red-500/10",     border: "border-l-red-500",     text: "text-red-400" },
  none:     { label: "No Log",   bg: "bg-muted",      border: "border-l-slate-600",      text: "text-muted-foreground" },
};

function EquipmentCard({ loc, entry, status, isActive, inputVal, isSaving, onActivate, onTempChange, onStep, onLog, onFlag }) {
  const c = S[status] || S.none;
  const displayTemp = entry?.temperature;
  const loggedTime = entry?.logged_at
    ? new Date(entry.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={cn("card-with-border rounded-lg p-3 space-y-2", c.border)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{loc.name}</p>
          <p className="text-xs text-secondary-text mt-0.5">{loc.min}–{loc.max}°F {loggedTime && `· ${loggedTime}`}</p>
        </div>
        <span className={cn("text-xs font-bold px-2 py-1 rounded-full", c.bg, c.text)}>
          {c.label}
        </span>
      </div>

      {displayTemp !== undefined && (
        <p className={cn("text-3xl font-bold", c.text)}>{displayTemp}°</p>
      )}

      {isActive && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-border">
          <button onClick={() => onStep(-1)} className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center active:scale-90">
            <Minus className="h-4 w-4 text-secondary-text" />
          </button>
          <input
            type="number"
            value={inputVal}
            onChange={e => onTempChange(e.target.value)}
            placeholder="°F"
            autoFocus
            className="flex-1 h-8 text-center text-sm font-bold rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button onClick={() => onStep(1)} className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center active:scale-90">
            <Plus className="h-4 w-4 text-secondary-text" />
          </button>
          <button
            onClick={onLog}
            disabled={!inputVal || isSaving}
            className="btn-primary h-8 px-3 text-xs flex items-center gap-1.5"
          >
            {isSaving ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Check className="h-3 w-3" />}
            Log
          </button>
        </div>
      )}

      {!isActive && (
        <button onClick={onActivate} className="btn-secondary w-full text-xs h-8">
          Log Temperature
        </button>
      )}
    </div>
  );
}

export default function TempLogs() {
  const [activeTab, setActiveTab] = useState("temps");
  const [coolingLogs, setCoolingLogs] = useState([]);
  const [coolingInputs, setCoolingInputs] = useState({ item: "", tempStart: "", tempEnd: "", startTime: "", endTime: "" });
  const [loggingCooling, setLoggingCooling] = useState(false);
  const [locationFilter, setLocationFilter] = useState("All");
  const [locations, setLocations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [chemicalLogs, setChemicalLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [temps, setTemps] = useState({});
  const [saving, setSaving] = useState({});
  const [activeLocId, setActiveLocId] = useState(null);
  const [issueSheet, setIssueSheet] = useState(null);
  const [issueNotes, setIssueNotes] = useState("");
  const [managerInitials, setManagerInitials] = useState("");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [chemicalInputs, setChemicalInputs] = useState({ dishwasher: {}, threeSink: {} });
  const [loggingChemical, setLoggingChemical] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const loadChemicals = async () => {
      const logs = await base44.entities.ChemicalLog.filter({ date: todayStr }).catch(() => []);
      setChemicalLogs(logs);
    };
    loadChemicals();
  }, []);

  useEffect(() => {
    const loadCooling = async () => {
      const logs = await base44.entities.TemperatureLog.filter({ date: todayStr }).catch(() => []);
      setCoolingLogs(logs);
    };
    loadCooling();
  }, []);

  const load = async () => {
    const [locs, ents] = await Promise.all([
      base44.entities.TempLogLocation.list(),
      base44.entities.TempLogEntry.filter({ date: todayStr }),
    ]);
    setLocations(locs.filter(l => l.is_active !== false));
    setEntries(ents);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getLatestEntry = (locId) =>
    entries.filter(e => e.location_id === locId).sort((a, b) => b.logged_at > a.logged_at ? 1 : -1)[0];

  const logsToday  = entries.length;
  const missedLogs = locations.filter(l => !getLatestEntry(l.id)).length;
  const highAlerts = locations.filter(l => { const e = getLatestEntry(l.id); return e && getTempStatus(e.temperature, l.target_min, l.target_max) === "critical"; }).length;
  const logged     = locations.filter(l => getLatestEntry(l.id)).length;
  const passing    = locations.filter(l => { const e = getLatestEntry(l.id); return e && getTempStatus(e.temperature, l.target_min, l.target_max) === "ok"; }).length;
  const compPct    = logged > 0 ? Math.round((passing / logged) * 100) : 0;

  const criticalLocations = locations.filter(l => {
    const e = getLatestEntry(l.id);
    return e && getTempStatus(e.temperature, l.target_min, l.target_max) === "critical";
  });

  const sortedLocations = [...locations].sort((a, b) => {
    const order = { critical: 0, warning: 1, none: 2, ok: 3 };
    const ea = getLatestEntry(a.id);
    const eb = getLatestEntry(b.id);
    const sa = ea ? getTempStatus(ea.temperature, a.target_min, a.target_max) : "none";
    const sb = eb ? getTempStatus(eb.temperature, b.target_min, b.target_max) : "none";
    return order[sa] - order[sb];
  });

  const handleLogTemp = async (loc, overrideNotes, overrideInitials) => {
    const tempVal = temps[loc.id];
    if (!tempVal && tempVal !== 0) { haptics.warning(); toast.error("Enter a temperature first"); return; }
    const temp = parseFloat(tempVal);
    if (isNaN(temp)) { haptics.warning(); toast.error("Invalid temperature"); return; }
    const status = getTempStatus(temp, loc.target_min, loc.target_max);
    if (status === "critical" && !overrideInitials) { setIssueSheet({ location: loc, temp }); return; }
    setSaving(prev => ({ ...prev, [loc.id]: true }));
    const statusMap = { ok: "safe", warning: "warning", critical: "danger", none: "safe" };
    await base44.entities.TempLogEntry.create({
      location_id: loc.id, location_name: loc.name, temperature: temp,
      status: statusMap[status] || "safe",
      is_above_range: temp > loc.target_max, is_below_range: temp < loc.target_min,
      date: todayStr, logged_at: new Date().toISOString(),
      notes: overrideNotes || "",
      manager_initials: status === "critical" ? overrideInitials : null,
      corrective_action: status === "critical" ? overrideNotes : null,
    });
    await load();
    setSaving(prev => ({ ...prev, [loc.id]: false }));
    setTemps(prev => { const n = { ...prev }; delete n[loc.id]; return n; });
    setActiveLocId(null);
    haptics.success();
    toast.success(status === "critical" ? "Logged and flagged" : "Temp logged ✓");
  };

  const handleIssueSubmit = async () => {
    if (!managerInitials.trim()) { haptics.warning(); toast.error("Manager initials required"); return; }
    const loc = issueSheet.location;
    setIssueSheet(null);
    await handleLogTemp(loc, issueNotes, managerInitials);
    setIssueNotes(""); setManagerInitials("");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[430px] flex flex-col gap-3 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between pt-0.5">
        <h1 className="text-lg font-bold text-foreground">Temperature Control</h1>
        <div className="flex gap-1.5">
          {activeTab === "temps" && entries.length > 0 && (
            <button className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-secondary">
              <Download className="h-4 w-4 text-secondary-text" />
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-1">
        <MetricTile icon={Activity} label="Logged" value={logsToday} />
        <MetricTile icon={Clock} label="Missed" value={missedLogs} alert={missedLogs > 0} />
        <MetricTile icon={AlertTriangle} label="Alerts" value={highAlerts} alert={highAlerts > 0} />
        <MetricTile icon={ShieldCheck} label="Pass %" value={`${compPct}%`} color={compPct >= 90 ? "text-green-400" : compPct >= 70 ? "text-amber-400" : "text-red-400"} />
      </div>

      {/* Critical Alerts Section */}
      {criticalLocations.length > 0 && (
        <div className="card-with-border border-l-red-500 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs font-bold text-red-400 uppercase">Critical Alerts ({criticalLocations.length})</span>
          </div>
          <div className="space-y-1">
            {criticalLocations.map(loc => {
              const e = getLatestEntry(loc.id);
              const temp = e?.temperature;
              return (
                <div key={loc.id} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                  <div>
                    <p className="font-bold text-foreground">{loc.name}: {temp}°F</p>
                    <p className="text-secondary-text">Safe: {loc.target_min}–{loc.target_max}°F</p>
                  </div>
                  <button className="btn-secondary text-xs px-2 py-1">Flag</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Equipment List */}
      {locations.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase text-secondary-text mb-2">Equipment ({locations.length})</h2>
          <div className="space-y-1.5">
            {sortedLocations.map(loc => {
              const entry = getLatestEntry(loc.id);
              const status = entry ? getTempStatus(entry.temperature, loc.target_min, loc.target_max) : "none";
              const isActive = activeLocId === loc.id;
              return (
                <EquipmentCard
                  key={loc.id}
                  loc={loc}
                  entry={entry}
                  status={status}
                  isActive={isActive}
                  inputVal={temps[loc.id] ?? ""}
                  isSaving={saving[loc.id]}
                  onActivate={() => setActiveLocId(isActive ? null : loc.id)}
                  onTempChange={val => setTemps(prev => ({ ...prev, [loc.id]: val }))}
                  onStep={delta => {
                    const current = parseFloat(temps[loc.id] ?? "") || 0;
                    setTemps(prev => ({ ...prev, [loc.id]: String(current + delta) }));
                    haptics.swipe();
                  }}
                  onLog={() => handleLogTemp(loc, undefined, undefined)}
                  onFlag={() => { setIssueSheet({ location: loc, temp: entry?.temperature }); }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Issue Corrective Action Sheet */}
      {issueSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50">
          <div className="relative bg-card border-t border-border rounded-t-2xl p-4 space-y-3">
            <div className="w-8 h-0.5 bg-border rounded-full mx-auto" />
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm font-bold text-foreground">{issueSheet.location.name}</p>
                <p className="text-xs text-red-400">{issueSheet.temp}°F • Out of range</p>
              </div>
            </div>
            <input
              type="text"
              value={managerInitials}
              onChange={e => setManagerInitials(e.target.value.toUpperCase())}
              placeholder="Manager initials *"
              maxLength={3}
              className="w-full h-9 px-3 text-xs font-bold border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <textarea
              value={issueNotes}
              onChange={e => setIssueNotes(e.target.value)}
              placeholder="Corrective action..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setIssueSheet(null)} className="btn-secondary flex-1 h-9 text-xs">Cancel</button>
              <button onClick={handleIssueSubmit} className="btn-primary flex-1 h-9 text-xs">Log + Flag</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;