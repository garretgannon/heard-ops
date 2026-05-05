import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Thermometer, AlertTriangle, Download, Minus, Check, X, QrCode, Clock, ShieldCheck, TrendingUp, Activity, ChevronRight } from "lucide-react";
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
  ok:       { label: "Safe",     bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400",         icon: "text-emerald-400" },
  warning:  { label: "Warning",  bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   dot: "bg-amber-400",            icon: "text-amber-400" },
  critical: { label: "Critical", bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-400",     dot: "bg-red-400 animate-pulse", icon: "text-red-400" },
  none:     { label: "No Log",   bg: "bg-[#181F2C]",      border: "border-[#232D3F]",      text: "text-gray-500",    dot: "bg-gray-600",             icon: "text-gray-600" },
};

function Badge({ status }) {
  const c = S[status] || S.none;
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", c.bg, c.border, c.text)}>
      {c.label}
    </span>
  );
}

function EquipmentCard({ loc, entry, status, isActive, inputVal, isSaving, onActivate, onTempChange, onStep, onLog, onFlag }) {
  const c = S[status] || S.none;
  const displayTemp = entry?.temperature;
  const loggedTime = entry?.logged_at
    ? new Date(entry.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  const pendingStatus = inputVal !== "" ? getTempStatus(parseFloat(inputVal), loc.target_min, loc.target_max) : null;
  const ps = pendingStatus ? S[pendingStatus] : null;

  return (
    <div className={cn(
      "bg-[#0F1623] border rounded-xl overflow-hidden transition-all",
      status === "critical" ? "border-red-500/40 shadow-sm shadow-red-500/10" : c.border
    )}>
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", c.bg)}>
          <Thermometer className={cn("h-3.5 w-3.5", c.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white leading-tight truncate">{loc.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-gray-600">{loc.target_min}–{loc.target_max}°F</span>
            {loggedTime && (
              <>
                <span className="text-gray-700">·</span>
                <span className="text-[10px] text-gray-600">{loggedTime}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {displayTemp !== undefined && (
            <span className={cn("text-[16px] font-extrabold leading-none", c.text)}>{displayTemp}°</span>
          )}
          <Badge status={status} />
          <button
            onClick={onActivate}
            className={cn(
              "h-7 px-2.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95",
              isActive ? "bg-[#1E2A3B] text-gray-400 border-[#2A3A50]" : "bg-primary/10 text-primary border-primary/25"
            )}
          >
            {isActive ? "Cancel" : "Log"}
          </button>
        </div>
      </div>

      {isActive && (
        <div className="flex items-center gap-1.5 px-3 pb-3 border-t border-[#1A2235] pt-2.5">
          <button onClick={() => onStep(-1)} className="h-8 w-8 rounded-lg bg-[#171F2D] border border-[#232D3F] flex items-center justify-center active:scale-90 transition-transform">
            <Minus className="h-3 w-3 text-gray-500" />
          </button>
          <input
            type="number"
            value={inputVal}
            onChange={e => onTempChange(e.target.value)}
            placeholder="°F"
            autoFocus
            className={cn(
              "flex-1 h-8 text-center text-[14px] font-bold rounded-lg border bg-[#0B0F18] focus:outline-none focus:ring-1 focus:ring-primary transition-colors",
              ps?.border || "border-[#232D3F]",
              ps?.text || "text-white"
            )}
          />
          <button onClick={() => onStep(1)} className="h-8 w-8 rounded-lg bg-[#171F2D] border border-[#232D3F] flex items-center justify-center active:scale-90 transition-transform">
            <Plus className="h-3 w-3 text-gray-500" />
          </button>
          <button
            onClick={onLog}
            disabled={!inputVal || isSaving}
            className={cn(
              "h-8 px-4 rounded-lg text-[12px] font-bold flex items-center gap-1.5 active:scale-95 transition-all border",
              inputVal ? "bg-primary text-primary-foreground border-primary" : "bg-[#171F2D] border-[#232D3F] text-gray-700 cursor-not-allowed"
            )}
          >
            {isSaving
              ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              : <><Check className="h-3 w-3" /> Log</>}
          </button>
          {status === "critical" && (
            <button onClick={onFlag} className="h-8 px-2.5 rounded-lg text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 active:scale-95 transition-transform whitespace-nowrap">
              Flag
            </button>
          )}
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
  const [activeLocId, setActiveLocId] = useState(null);
  const [issueSheet, setIssueSheet] = useState(null);

  useEffect(() => {
    if (!activeLocId) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`loc-card-${activeLocId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    return () => clearTimeout(timer);
  }, [activeLocId]);
  const [issueNotes, setIssueNotes] = useState("");
  const [managerInitials, setManagerInitials] = useState("");
  const [showAddLocation, setShowAddLocation] = useState(false);
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

  const hourlyBuckets = {};
  entries.forEach(e => {
    const h = new Date(e.logged_at).getHours();
    const label = `${h % 12 || 12}${h < 12 ? "a" : "p"}`;
    if (!hourlyBuckets[label]) hourlyBuckets[label] = { label, total: 0, pass: 0 };
    hourlyBuckets[label].total++;
    if (e.status !== false) hourlyBuckets[label].pass++;
  });
  const trendData = Object.values(hourlyBuckets).map(b => ({
    time: b.label,
    compliance: b.total > 0 ? Math.round((b.pass / b.total) * 100) : 100,
  }));

  const handleLogTemp = async (loc, overrideNotes, overrideInitials) => {
    const tempVal = temps[loc.id];
    if (!tempVal && tempVal !== 0) { haptics.warning(); toast.error("Enter a temperature first"); return; }
    const temp = parseFloat(tempVal);
    if (isNaN(temp)) { haptics.warning(); toast.error("Invalid temperature"); return; }
    const status = getTempStatus(temp, loc.target_min, loc.target_max);
    if (status === "critical" && !overrideInitials) { setIssueSheet({ location: loc, temp }); return; }
    setSaving(prev => ({ ...prev, [loc.id]: true }));
    await base44.entities.TempLogEntry.create({
      location_id: loc.id, location_name: loc.name, temperature: temp,
      status: status !== "critical",
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
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-3" style={{ paddingBottom: 'calc(16rem + env(safe-area-inset-bottom, 0px))' }}>

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[17px] font-extrabold text-white tracking-tight">Food Safety</h1>
          <p className="text-[11px] text-gray-600 mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
        </div>
        <div className="flex gap-1.5">
          {entries.length > 0 && (
            <button onClick={handleExport} className="h-8 w-8 rounded-lg bg-[#0F1623] border border-[#1E2A3B] flex items-center justify-center active:scale-95">
              <Download className="h-3.5 w-3.5 text-gray-500" />
            </button>
          )}
          <button onClick={() => setShowAddLocation(v => !v)} className="h-8 w-8 rounded-lg bg-[#0F1623] border border-[#1E2A3B] flex items-center justify-center active:scale-95">
            <Plus className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Metrics — 4-col */}
      <div className="grid grid-cols-4 gap-1.5">
        <MetricTile icon={Activity}      label="Logged" value={logsToday} />
        <MetricTile icon={Clock}         label="Missed" value={missedLogs} alert={missedLogs > 0} />
        <MetricTile icon={AlertTriangle} label="Alerts" value={highAlerts} alert={highAlerts > 0} />
        <MetricTile icon={ShieldCheck}   label="Pass %"
          value={`${compPct}%`}
          color={compPct >= 90 ? "text-emerald-400" : compPct >= 70 ? "text-amber-400" : "text-red-400"} />
      </div>

      {/* Critical Alerts */}
      {criticalLocations.length > 0 && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/6 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-red-500/15">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-[13px] font-extrabold text-red-400 flex-1 uppercase tracking-wide">Critical Alerts</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">{criticalLocations.length}</span>
          </div>
          {criticalLocations.map(loc => {
            const e = getLatestEntry(loc.id);
            const temp = e?.temperature;
            const above = temp > loc.target_max;
            return (
              <div key={loc.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-red-500/8 last:border-0">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white truncate">{loc.name}</p>
                  <p className="text-[11px] text-red-400 font-semibold">
                    {temp}°F — {above ? "↑ Too high" : "↓ Too low"} · Safe: {loc.target_min}–{loc.target_max}°F
                  </p>
                </div>
                <button
                  onClick={() => { setIssueSheet({ location: loc, temp }); setIssueNotes(""); setManagerInitials(""); }}
                  className="h-7 px-2.5 text-[11px] font-bold text-red-400 bg-red-500/12 border border-red-500/25 rounded-lg active:scale-95 whitespace-nowrap"
                >
                  Flag
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Scan Button */}
      <button
        onClick={() => toast.info("QR scanning: Point camera at equipment QR code")}
        className="w-full flex items-center gap-3 bg-[#0F1623] border border-[#1E2A3B] rounded-xl px-4 py-3 active:scale-[0.98] transition-transform"
      >
        <div className="h-11 w-11 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/25 flex items-center justify-center shrink-0">
          <QrCode className="h-5 w-5 text-[#F5A623]" />
        </div>
        <div className="text-left flex-1">
          <p className="text-[14px] font-bold text-white">Scan Equipment QR</p>
          <p className="text-[11px] text-gray-600">Tap to log temp instantly via QR code</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-700 shrink-0" />
      </button>

      {/* Add Location panel */}
      {showAddLocation && (
        <div className="bg-[#0F1623] border border-[#1E2A3B] rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-[#1E2A3B] flex items-center justify-between">
            <span className="text-[12px] font-bold text-white">Add Equipment</span>
            <button onClick={() => setShowAddLocation(false)}><X className="h-3.5 w-3.5 text-gray-500" /></button>
          </div>
          {LOCATIONS.filter(t => !locations.find(l => l.name === t.name)).map(t => (
            <button key={t.name} onClick={() => handleAddLocation(t)}
              className="w-full flex items-center justify-between px-3 py-2.5 border-b border-[#1E2A3B] last:border-0 hover:bg-[#141C29] active:scale-[0.99] transition-all text-left">
              <span className="text-[13px] font-semibold text-white">{t.name}</span>
              <span className="text-[10px] text-gray-600">{t.min}–{t.max}°F</span>
            </button>
          ))}
        </div>
      )}

      {/* Equipment section */}
      {locations.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Equipment</p>
          <div className="flex flex-col gap-2">
            {sortedLocations.map(loc => {
              const entry = getLatestEntry(loc.id);
              const status = entry ? getTempStatus(entry.temperature, loc.target_min, loc.target_max) : "none";
              const isActive = activeLocId === loc.id;
              return (
                <div id={`loc-card-${loc.id}`} key={loc.id}>
                <EquipmentCard
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
                  onFlag={() => { setIssueSheet({ location: loc, temp: entry?.temperature }); setIssueNotes(""); setManagerInitials(""); }}
                />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compliance Trend */}
      {trendData.length > 0 && (
        <div className="bg-[#0F1623] border border-[#1E2A3B] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-[12px] font-bold text-white flex-1">Compliance Trend</span>
            <span className={cn("text-[12px] font-bold", compPct >= 90 ? "text-emerald-400" : compPct >= 70 ? "text-amber-400" : "text-red-400")}>{compPct}%</span>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={trendData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F5A623" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2235" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "#4B5563", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#4B5563", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0F1623", border: "1px solid #1E2A3B", borderRadius: 8, fontSize: 11, padding: "4px 8px" }}
                labelStyle={{ color: "#6B7280" }} itemStyle={{ color: "#F5A623" }}
                formatter={v => [`${v}%`, "Compliance"]}
              />
              <Area type="monotone" dataKey="compliance" stroke="#F5A623" strokeWidth={1.5} fill="url(#cg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom bar — Log All */}
      <div className="fixed left-0 right-0 z-30 bg-[#080C14]/96 backdrop-blur-md border-t border-[#1E2A3B] px-4 py-2.5 flex gap-2 lg:left-64" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
        <button
          onClick={() => toast.info("QR scanning: Point camera at equipment QR code")}
          className="h-11 w-11 rounded-xl bg-[#0F1623] border border-[#1E2A3B] flex items-center justify-center active:scale-95 shrink-0"
        >
          <QrCode className="h-5 w-5 text-gray-500" />
        </button>
        <button
          onClick={async () => {
            const pending = locations.filter(l => temps[l.id] !== undefined && temps[l.id] !== "");
            if (!pending.length) { haptics.warning(); toast.error("Enter temperatures first"); return; }
            for (const loc of pending) await handleLogTemp(loc, undefined, undefined);
          }}
          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold active:scale-95 transition-transform"
        >
          <Thermometer className="h-4 w-4" />
          Log All Temps
        </button>
      </div>

      {/* Issue / corrective action sheet */}
      {issueSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/75" onClick={() => setIssueSheet(null)} />
          <div className="relative bg-[#0B1018] border-t border-red-500/25 rounded-t-2xl p-4 space-y-3 z-10">
            <div className="w-8 h-0.5 bg-[#1E2A3B] rounded-full mx-auto" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-500/12 border border-red-500/25 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">{issueSheet.location.name} — Out of Range</p>
                <p className="text-[11px] text-red-400">{issueSheet.temp}°F · Safe: {issueSheet.location.target_min}–{issueSheet.location.target_max}°F</p>
              </div>
            </div>
            <input
              type="text"
              value={managerInitials}
              onChange={e => setManagerInitials(e.target.value.toUpperCase())}
              placeholder="Manager initials *"
              maxLength={3}
              className="w-full h-10 px-3 text-[13px] font-bold border border-[#1E2A3B] rounded-xl bg-[#0F1623] text-white focus:outline-none focus:ring-1 focus:ring-red-500 uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
            />
            <textarea
              value={issueNotes}
              onChange={e => setIssueNotes(e.target.value)}
              placeholder="Corrective action taken..."
              rows={2}
              className="w-full px-3 py-2 text-[13px] border border-[#1E2A3B] rounded-xl bg-[#0F1623] text-white focus:outline-none focus:ring-1 focus:ring-red-500 resize-none placeholder:text-gray-600"
            />
            <div className="flex gap-2">
              <button onClick={() => setIssueSheet(null)} className="flex-1 py-2.5 rounded-xl border border-[#1E2A3B] text-[13px] font-semibold text-gray-500 active:scale-95">
                Cancel
              </button>
              <button onClick={handleIssueSubmit} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-bold active:scale-95">
                Log + Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;