import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Thermometer, AlertTriangle, Download, Minus, Check, X, QrCode, Clock, ShieldCheck, TrendingUp, Activity } from "lucide-react";
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

const STATUS_CONFIG = {
  ok:       { label: "Safe",     bg: "bg-green-500/15",  border: "border-green-500/30",  text: "text-green-400",  dot: "bg-green-400" },
  warning:  { label: "Warning",  bg: "bg-yellow-500/15", border: "border-yellow-500/30", text: "text-yellow-400", dot: "bg-yellow-400" },
  critical: { label: "Critical", bg: "bg-red-500/15",    border: "border-red-500/30",    text: "text-red-400",    dot: "bg-red-400 animate-pulse" },
  none:     { label: "No Log",   bg: "bg-[#1C2432]",     border: "border-[#1F2937]",     text: "text-gray-500",   dot: "bg-gray-600" },
};

function MetricCard({ icon: Icon, label, value, sub, color = "text-white", alert }) {
  return (
    <div className={cn("flex-1 flex flex-col gap-1 bg-[#111827] border rounded-xl p-3 min-w-0", alert ? "border-red-500/40" : "border-[#1F2937]")}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3.5 w-3.5", alert ? "text-red-400" : "text-gray-500")} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 truncate">{label}</span>
      </div>
      <span className={cn("text-2xl font-extrabold leading-none", alert ? "text-red-400" : color)}>{value}</span>
      {sub && <span className="text-[10px] text-gray-600 leading-tight">{sub}</span>}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.none;
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", cfg.bg, cfg.border, cfg.text)}>
      {cfg.label}
    </span>
  );
}

function EquipmentCard({ loc, entry, status, inputVal, isSaving, onTempChange, onStep, onLog, onCorrectiveAction }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.none;
  const displayTemp = entry?.temperature;
  const loggedTime = entry?.logged_at
    ? new Date(entry.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  const pendingStatus = inputVal !== "" ? getTempStatus(parseFloat(inputVal), loc.target_min, loc.target_max) : null;

  return (
    <div className={cn("bg-[#111827] border rounded-xl overflow-hidden transition-all", cfg.border, status === "critical" && "shadow-lg shadow-red-500/10")}>
      {/* Card header */}
      <div className={cn("px-3 py-2 flex items-center justify-between", status === "critical" ? "bg-red-500/8" : status === "warning" ? "bg-yellow-500/5" : "")}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{loc.name}</p>
            <p className="text-[11px] text-gray-500">Safe range: {loc.target_min}° – {loc.target_max}°F</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {displayTemp !== undefined && (
            <span className={cn("text-xl font-extrabold leading-none", cfg.text)}>{displayTemp}°F</span>
          )}
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Log row */}
      <div className="px-3 py-2 flex items-center gap-2 border-t border-[#1F2937]">
        <div className="flex items-center gap-1 flex-1">
          <button onClick={() => onStep(-1)} className="w-8 h-8 rounded-lg bg-[#1C2432] border border-[#1F2937] flex items-center justify-center active:scale-90 transition-transform">
            <Minus className="h-3 w-3 text-gray-400" />
          </button>
          <input
            type="number"
            value={inputVal}
            onChange={e => onTempChange(e.target.value)}
            placeholder="°F"
            className={cn(
              "w-16 h-8 text-center text-sm font-bold rounded-lg border bg-[#0B0F14] focus:outline-none focus:ring-1 focus:ring-primary",
              pendingStatus === "critical" ? "border-red-500 text-red-400" :
              pendingStatus === "warning"  ? "border-yellow-500 text-yellow-400" :
              pendingStatus === "ok"       ? "border-green-500 text-green-400" : "border-[#1F2937] text-white"
            )}
          />
          <button onClick={() => onStep(1)} className="w-8 h-8 rounded-lg bg-[#1C2432] border border-[#1F2937] flex items-center justify-center active:scale-90 transition-transform">
            <Plus className="h-3 w-3 text-gray-400" />
          </button>
        </div>
        <button
          onClick={onLog}
          disabled={!inputVal || isSaving}
          className={cn(
            "h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform border",
            inputVal
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-[#1C2432] border-[#1F2937] text-gray-600 opacity-50 cursor-not-allowed"
          )}
        >
          {isSaving
            ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            : <><Check className="h-3 w-3" /> Log</>}
        </button>
        {loggedTime && (
          <div className="flex items-center gap-1 text-[10px] text-gray-600 shrink-0">
            <Clock className="h-3 w-3" />
            {loggedTime}
          </div>
        )}
      </div>

      {/* Corrective action row */}
      {status === "critical" && (
        <div className="px-3 pb-2">
          <button
            onClick={onCorrectiveAction}
            className="w-full py-1.5 rounded-lg text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 active:scale-95 transition-transform"
          >
            + Add Corrective Action
          </button>
        </div>
      )}
    </div>
  );
}

export default function TempLogs() {
  const [locations, setLocations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [temps, setTemps] = useState({});
  const [saving, setSaving] = useState({});
  const [issueSheet, setIssueSheet] = useState(null);
  const [issueNotes, setIssueNotes] = useState("");
  const [managerInitials, setManagerInitials] = useState("");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [filter, setFilter] = useState("all"); // all | critical | warning
  const todayStr = new Date().toISOString().split("T")[0];

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

  // ── Metrics ─────────────────────────────────────────────────
  const logsToday = entries.length;
  const missedLogs = locations.filter(l => !getLatestEntry(l.id)).length;
  const highAlerts = locations.filter(l => {
    const e = getLatestEntry(l.id);
    return e && getTempStatus(e.temperature, l.target_min, l.target_max) === "critical";
  }).length;
  const logged = locations.filter(l => getLatestEntry(l.id)).length;
  const passing = locations.filter(l => {
    const e = getLatestEntry(l.id);
    return e && getTempStatus(e.temperature, l.target_min, l.target_max) === "ok";
  }).length;
  const compliancePct = logged > 0 ? Math.round((passing / logged) * 100) : 0;

  // ── Critical alerts ──────────────────────────────────────────
  const criticalLocations = locations.filter(l => {
    const e = getLatestEntry(l.id);
    return e && getTempStatus(e.temperature, l.target_min, l.target_max) === "critical";
  });

  // ── Compliance trend chart data ───────────────────────────────
  const hourlyBuckets = {};
  entries.forEach(e => {
    const h = new Date(e.logged_at).getHours();
    const label = `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
    if (!hourlyBuckets[label]) hourlyBuckets[label] = { label, total: 0, pass: 0 };
    hourlyBuckets[label].total++;
    if (e.status !== false) hourlyBuckets[label].pass++;
  });
  const trendData = Object.values(hourlyBuckets).map(b => ({
    time: b.label,
    compliance: b.total > 0 ? Math.round((b.pass / b.total) * 100) : 100,
  }));

  // ── Filtered locations ────────────────────────────────────────
  const visibleLocations = locations.filter(l => {
    if (filter === "all") return true;
    const e = getLatestEntry(l.id);
    const st = e ? getTempStatus(e.temperature, l.target_min, l.target_max) : "none";
    if (filter === "critical") return st === "critical" || st === "none";
    if (filter === "warning") return st === "warning";
    return true;
  });

  // ── Handlers ─────────────────────────────────────────────────
  const handleLogTemp = async (loc, overrideNotes, overrideInitials) => {
    const tempVal = temps[loc.id];
    if (tempVal === undefined || tempVal === "") { haptics.warning(); toast.error("Enter a temperature first"); return; }
    const temp = parseFloat(tempVal);
    if (isNaN(temp)) { haptics.warning(); toast.error("Invalid temperature"); return; }
    const status = getTempStatus(temp, loc.target_min, loc.target_max);
    if (status === "critical" && !overrideInitials) { setIssueSheet({ location: loc, temp }); return; }
    setSaving(prev => ({ ...prev, [loc.id]: true }));
    await base44.entities.TempLogEntry.create({
      location_id: loc.id,
      location_name: loc.name,
      temperature: temp,
      status: status !== "critical",
      is_above_range: temp > loc.target_max,
      is_below_range: temp < loc.target_min,
      date: todayStr,
      logged_at: new Date().toISOString(),
      notes: overrideNotes || "",
      manager_initials: status === "critical" ? overrideInitials : null,
      corrective_action: status === "critical" ? overrideNotes : null,
    });
    await load();
    setSaving(prev => ({ ...prev, [loc.id]: false }));
    setTemps(prev => { const n = { ...prev }; delete n[loc.id]; return n; });
    haptics.success();
    toast.success(status === "critical" ? "Logged and flagged" : "Temp logged ✓");
  };

  const handleIssueSubmit = async () => {
    if (!managerInitials.trim()) { haptics.warning(); toast.error("Manager initials required"); return; }
    const loc = issueSheet.location;
    setIssueSheet(null);
    await handleLogTemp(loc, issueNotes, managerInitials);
    setIssueNotes("");
    setManagerInitials("");
  };

  const handleAddLocation = async (template) => {
    const created = await base44.entities.TempLogLocation.create({
      name: template.name, type: template.type,
      target_min: template.min, target_max: template.max, is_active: true,
    });
    setLocations(prev => [...prev, created]);
    setShowAddLocation(false);
    toast.success("Location added");
  };

  const handleExport = () => {
    const csv = ["Location,Temperature,Status,Time,Notes,Manager"]
      .concat(entries.map(e =>
        `"${e.location_name}",${e.temperature},"${e.status ? "Pass" : "Fail"}",${new Date(e.logged_at).toLocaleTimeString()},"${e.notes || ""}","${e.manager_initials || ""}"`
      )).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `temp-logs-${todayStr}.csv`;
    a.click();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col pb-32 space-y-4">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-extrabold text-white tracking-tight">Food Safety</h1>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          {entries.length > 0 && (
            <button onClick={handleExport} className="h-9 w-9 rounded-xl bg-[#111827] border border-[#1F2937] flex items-center justify-center active:scale-95 transition-transform">
              <Download className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <button onClick={() => setShowAddLocation(v => !v)} className="h-9 w-9 rounded-xl bg-[#111827] border border-[#1F2937] flex items-center justify-center active:scale-95 transition-transform">
            <Plus className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard icon={Activity}    label="Logged"     value={logsToday}       color="text-white" />
        <MetricCard icon={Clock}       label="Missed"     value={missedLogs}      alert={missedLogs > 0} />
        <MetricCard icon={AlertTriangle} label="Alerts"  value={highAlerts}      alert={highAlerts > 0} />
        <MetricCard icon={ShieldCheck} label="Passing"   value={`${compliancePct}%`} color={compliancePct >= 90 ? "text-green-400" : compliancePct >= 70 ? "text-yellow-400" : "text-red-400"} />
      </div>

      {/* ── Critical Alerts ──────────────────────────────────── */}
      {criticalLocations.length > 0 && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/8 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-sm font-bold text-red-400">Critical Alerts — Out of Safe Range</span>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">{criticalLocations.length} active</span>
          </div>
          <div className="divide-y divide-red-500/10">
            {criticalLocations.map(loc => {
              const e = getLatestEntry(loc.id);
              const temp = e?.temperature;
              const above = temp > loc.target_max;
              return (
                <div key={loc.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{loc.name}</p>
                    <p className="text-[11px] text-red-400">{temp}°F — {above ? "above" : "below"} safe range ({loc.target_min}°–{loc.target_max}°F)</p>
                  </div>
                  <button
                    onClick={() => { setIssueSheet({ location: loc, temp }); setIssueNotes(""); setManagerInitials(""); }}
                    className="text-[11px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-lg active:scale-95 transition-transform whitespace-nowrap"
                  >
                    Flag
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Add Location panel ───────────────────────────────── */}
      {showAddLocation && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
          <div className="px-3 py-2.5 border-b border-[#1F2937] flex items-center justify-between">
            <span className="text-sm font-bold text-white">Add Equipment</span>
            <button onClick={() => setShowAddLocation(false)}><X className="h-4 w-4 text-gray-500" /></button>
          </div>
          <div className="divide-y divide-[#1F2937]">
            {LOCATIONS.filter(t => !locations.find(l => l.name === t.name)).map(t => (
              <button key={t.name} onClick={() => handleAddLocation(t)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#1C2432] active:scale-[0.98] transition-all text-left">
                <span className="text-sm font-semibold text-white">{t.name}</span>
                <span className="text-[11px] text-gray-500">{t.min}° – {t.max}°F</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter tabs ──────────────────────────────────────── */}
      <div className="flex gap-2">
        {[["all", "All Equipment"], ["critical", "Critical"], ["warning", "Warnings"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95",
              filter === val
                ? val === "critical" ? "bg-red-500/15 text-red-400 border-red-500/30"
                  : val === "warning" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                  : "bg-primary/15 text-primary border-primary/30"
                : "bg-[#111827] text-gray-500 border-[#1F2937]"
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Equipment Cards ──────────────────────────────────── */}
      <div className="space-y-2">
        {visibleLocations.length === 0 && (
          <div className="text-center py-10 text-gray-600 text-sm">No equipment to show</div>
        )}
        {visibleLocations.map(loc => {
          const entry = getLatestEntry(loc.id);
          const status = entry ? getTempStatus(entry.temperature, loc.target_min, loc.target_max) : "none";
          return (
            <EquipmentCard
              key={loc.id}
              loc={loc}
              entry={entry}
              status={status}
              inputVal={temps[loc.id] ?? ""}
              isSaving={saving[loc.id]}
              onTempChange={val => setTemps(prev => ({ ...prev, [loc.id]: val }))}
              onStep={delta => {
                const current = parseFloat(temps[loc.id] ?? "") || 0;
                setTemps(prev => ({ ...prev, [loc.id]: String(current + delta) }));
                haptics.swipe();
              }}
              onLog={() => handleLogTemp(loc, undefined, undefined)}
              onCorrectiveAction={() => { setIssueSheet({ location: loc, temp: entry?.temperature }); setIssueNotes(""); setManagerInitials(""); }}
            />
          );
        })}
      </div>

      {/* ── Compliance Trend Chart ───────────────────────────── */}
      {trendData.length > 0 && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-white">Compliance Trend — Today</span>
            <span className={cn("ml-auto text-xs font-bold", compliancePct >= 90 ? "text-green-400" : compliancePct >= 70 ? "text-yellow-400" : "text-red-400")}>{compliancePct}% passing</span>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F5A623" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "#9CA3AF" }}
                itemStyle={{ color: "#F5A623" }}
                formatter={v => [`${v}%`, "Compliance"]}
              />
              <Area type="monotone" dataKey="compliance" stroke="#F5A623" strokeWidth={2} fill="url(#compGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Fixed bottom bar ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0B0F14]/95 backdrop-blur-sm border-t border-[#1F2937] px-4 py-3 flex gap-2 lg:left-64">
        {/* QR Scan entry — large tap target */}
        <button
          onClick={() => toast.info("QR scanning: Point camera at equipment QR code")}
          className="h-12 w-12 rounded-xl bg-[#1C2432] border border-[#1F2937] flex items-center justify-center active:scale-95 transition-transform shrink-0"
        >
          <QrCode className="h-5 w-5 text-gray-400" />
        </button>
        <button
          onClick={async () => {
            const pending = locations.filter(l => temps[l.id] !== undefined && temps[l.id] !== "");
            if (!pending.length) { haptics.warning(); toast.error("Enter temperatures first"); return; }
            for (const loc of pending) await handleLogTemp(loc, undefined, undefined);
          }}
          className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-transform"
        >
          <Thermometer className="h-4 w-4" />
          Log All Temps
        </button>
      </div>

      {/* ── Issue bottom sheet ───────────────────────────────── */}
      {issueSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setIssueSheet(null)} />
          <div className="relative bg-[#0F1520] border-t border-red-500/30 rounded-t-2xl p-5 space-y-4 z-10">
            <div className="w-10 h-1 bg-[#1F2937] rounded-full mx-auto mb-1" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">{issueSheet.location.name} — Out of Range</h3>
                <p className="text-xs text-red-400">{issueSheet.temp}°F · Safe: {issueSheet.location.target_min}°–{issueSheet.location.target_max}°F</p>
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={managerInitials}
                onChange={e => setManagerInitials(e.target.value.toUpperCase())}
                placeholder="Manager initials *"
                maxLength={3}
                className="w-full h-11 px-3 text-sm font-bold border border-[#1F2937] rounded-xl bg-[#111827] text-white focus:outline-none focus:ring-1 focus:ring-red-500 uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
              />
              <textarea
                value={issueNotes}
                onChange={e => setIssueNotes(e.target.value)}
                placeholder="Corrective action taken (e.g. moved product, called repair, adjusted thermostat)..."
                rows={2}
                className="w-full px-3 py-2.5 text-sm border border-[#1F2937] rounded-xl bg-[#111827] text-white focus:outline-none focus:ring-1 focus:ring-red-500 resize-none placeholder:text-gray-600"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIssueSheet(null)} className="flex-1 py-3 rounded-xl border border-[#1F2937] text-sm font-semibold text-gray-400 active:scale-95 transition-transform">
                Cancel
              </button>
              <button onClick={handleIssueSubmit} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold active:scale-95 transition-transform">
                Log + Flag Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;