import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronDown, ChevronRight, Thermometer, AlertTriangle, Download, Minus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { haptics } from "@/utils/haptics";

const LOCATIONS = [
  { name: "Walk-In Cooler", type: "walk_in", min: 32, max: 41 },
  { name: "Freezer", type: "freezer", min: -10, max: 0 },
  { name: "Line Cooler", type: "cooler", min: 32, max: 41 },
  { name: "Prep Cooler", type: "cooler", min: 32, max: 41 },
  { name: "Hot Holding", type: "hot", min: 135, max: 180 },
  { name: "Dish Machine", type: "dish", min: 160, max: 180 },
];

const CATEGORY_LABELS = {
  hot: "Hot Hold",
  cooler: "Cold Hold",
  walk_in: "Walk-In",
  freezer: "Freezer",
  dish: "Dish Machine",
};

const NEAR_MARGIN = 5;

const getTempStatus = (temp, min, max) => {
  if (temp === null || temp === undefined || temp === "") return "none";
  const t = parseFloat(temp);
  if (isNaN(t)) return "none";
  if (t < min || t > max) return "critical";
  if (t <= min + NEAR_MARGIN || t >= max - NEAR_MARGIN) return "warning";
  return "ok";
};

export default function TempLogs() {
  const [locations, setLocations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [temps, setTemps] = useState({});
  const [saving, setSaving] = useState({});
  const [openCategories, setOpenCategories] = useState({});
  const [issueSheet, setIssueSheet] = useState(null);
  const [issueNotes, setIssueNotes] = useState("");
  const [managerInitials, setManagerInitials] = useState("");
  const [viewIssuesOnly, setViewIssuesOnly] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const todayStr = new Date().toISOString().split("T")[0];

  const load = async () => {
    const [locs, ents] = await Promise.all([
      base44.entities.TempLogLocation.list(),
      base44.entities.TempLogEntry.filter({ date: todayStr }),
    ]);
    const active = locs.filter(l => l.is_active !== false);
    setLocations(active);
    setEntries(ents);
    if (ents.length > 0) {
      const latest = ents.reduce((a, b) => a.logged_at > b.logged_at ? a : b);
      setLastUpdated(new Date(latest.logged_at));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getLatestEntry = (locId) =>
    entries.filter(e => e.location_id === locId).sort((a, b) => b.logged_at > a.logged_at ? 1 : -1)[0];

  const summaryStats = locations.reduce((acc, loc) => {
    const entry = getLatestEntry(loc.id);
    if (!entry) return acc;
    const st = getTempStatus(entry.temperature, loc.target_min, loc.target_max);
    if (st === "ok") acc.ok++;
    else if (st === "warning") acc.warning++;
    else if (st === "critical") acc.critical++;
    return acc;
  }, { ok: 0, warning: 0, critical: 0 });

  const grouped = locations.reduce((acc, loc) => {
    const cat = loc.type || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(loc);
    return acc;
  }, {});

  const toggleCategory = (cat) => setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  const handleTempChange = (locId, val) => setTemps(prev => ({ ...prev, [locId]: val }));

  const handleStep = (loc, delta) => {
    const current = parseFloat(temps[loc.id] ?? "") || 0;
    setTemps(prev => ({ ...prev, [loc.id]: String(current + delta) }));
    haptics.swipe();
  };

  const handleLogTemp = async (loc, overrideNotes, overrideInitials) => {
    const tempVal = temps[loc.id];
    if (tempVal === undefined || tempVal === "") { haptics.warning(); toast.error("Enter a temperature first"); return; }
    const temp = parseFloat(tempVal);
    if (isNaN(temp)) { haptics.warning(); toast.error("Invalid temperature"); return; }

    const status = getTempStatus(temp, loc.target_min, loc.target_max);

    if (status === "critical" && !overrideInitials) {
      setIssueSheet({ location: loc, temp });
      return;
    }

    setSaving(prev => ({ ...prev, [loc.id]: true }));
    await base44.entities.TempLogEntry.create({
      location_id: loc.id,
      location_name: loc.name,
      temperature: temp,
      status: status !== "critical",
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
    toast.success(status === "critical" ? "Logged and flagged" : "Temp logged");
  };

  const handleLogAll = async () => {
    const pending = locations.filter(l => temps[l.id] !== undefined && temps[l.id] !== "");
    if (pending.length === 0) { haptics.warning(); toast.error("Enter temperatures first"); return; }
    for (const loc of pending) { await handleLogTemp(loc, undefined, undefined); }
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
      name: template.name,
      type: template.type,
      target_min: template.min,
      target_max: template.max,
      is_active: true,
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

  const categoriesToShow = Object.entries(grouped).filter(([cat, locs]) => {
    if (!viewIssuesOnly) return true;
    return locs.some(loc => {
      const entry = getLatestEntry(loc.id);
      if (!entry) return true;
      return getTempStatus(entry.temperature, loc.target_min, loc.target_max) !== "ok";
    });
  });

  return (
    <div className="flex flex-col pb-20">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold">Temp Logs</h1>
        <div className="flex gap-2">
          {entries.length > 0 && (
            <button onClick={handleExport} className="p-2 rounded-lg border border-border text-muted-foreground active:scale-95 transition-transform">
              <Download className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setShowAddLocation(v => !v)} className="p-2 rounded-lg border border-border text-muted-foreground active:scale-95 transition-transform">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sticky summary bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-bold text-green-500">{summaryStats.ok}</span>
          <span className="text-xs text-muted-foreground">OK</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs font-bold text-yellow-500">{summaryStats.warning}</span>
          <span className="text-xs text-muted-foreground">Near</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs font-bold text-red-500">{summaryStats.critical}</span>
          <span className="text-xs text-muted-foreground">Critical</span>
        </div>
        <div className="ml-auto text-[10px] text-muted-foreground">
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "No logs today"}
        </div>
      </div>

      {/* Add Location panel */}
      {showAddLocation && (
        <div className="mx-4 mt-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold">Add Location</span>
            <button onClick={() => setShowAddLocation(false)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </div>
          <div className="divide-y divide-border">
            {LOCATIONS.filter(t => !locations.find(l => l.name === t.name)).map(t => (
              <button
                key={t.name}
                onClick={() => handleAddLocation(t)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/40 active:scale-[0.98] transition-transform text-left"
              >
                <span className="text-sm font-semibold">{t.name}</span>
                <span className="text-[11px] text-muted-foreground">{t.min}° – {t.max}°F</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category groups */}
      <div className="px-4 pt-2 space-y-2">
        {categoriesToShow.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No items to show</div>
        )}
        {categoriesToShow.map(([cat, locs]) => {
          const isOpen = openCategories[cat];
          const catIssues = locs.filter(loc => {
            const e = getLatestEntry(loc.id);
            return !e || getTempStatus(e.temperature, loc.target_min, loc.target_max) === "critical";
          }).length;
          const catWarnings = locs.filter(loc => {
            const e = getLatestEntry(loc.id);
            return e && getTempStatus(e.temperature, loc.target_min, loc.target_max) === "warning";
          }).length;

          return (
            <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/30 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  {isOpen
                    ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-sm font-bold">{CATEGORY_LABELS[cat] || cat}</span>
                  <span className="text-[11px] text-muted-foreground">{locs.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {catIssues > 0 && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                      {catIssues} critical
                    </span>
                  )}
                  {catWarnings > 0 && (
                    <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">
                      {catWarnings} near
                    </span>
                  )}
                  {catIssues === 0 && catWarnings === 0 && locs.every(l => getLatestEntry(l.id)) && (
                    <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                      All OK
                    </span>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="divide-y divide-border/60">
                  {locs.map(loc => {
                    const entry = getLatestEntry(loc.id);
                    const inputVal = temps[loc.id] ?? "";
                    const displayTemp = entry?.temperature;
                    const status = displayTemp !== undefined
                      ? getTempStatus(displayTemp, loc.target_min, loc.target_max)
                      : "none";
                    const isSavingThis = saving[loc.id];
                    const pendingStatus = inputVal !== ""
                      ? getTempStatus(parseFloat(inputVal), loc.target_min, loc.target_max)
                      : null;
                    const rowBg = status === "critical"
                      ? "bg-red-500/5"
                      : status === "warning" ? "bg-yellow-500/5" : "";

                    return (
                      <div key={loc.id} className={cn("px-3 py-2.5 transition-colors", rowBg)}>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0 mt-0.5",
                            status === "ok" ? "bg-green-500" :
                            status === "warning" ? "bg-yellow-500" :
                            status === "critical" ? "bg-red-500 animate-pulse" : "bg-muted"
                          )} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold truncate">{loc.name}</span>
                              {status === "critical" && <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{loc.target_min}° – {loc.target_max}°F</span>
                              {entry && (
                                <span className="opacity-60">
                                  {new Date(entry.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                          </div>

                          {displayTemp !== undefined && (
                            <div className={cn(
                              "text-right mr-1 flex-shrink-0",
                              status === "ok" ? "text-green-500" :
                              status === "warning" ? "text-yellow-500" : "text-red-500"
                            )}>
                              <span className="text-lg font-bold leading-none">{displayTemp}°</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleStep(loc, -1)}
                              className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center active:scale-90 transition-transform"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              value={inputVal}
                              onChange={e => handleTempChange(loc.id, e.target.value)}
                              placeholder="°F"
                              className={cn(
                                "w-14 h-7 text-center text-sm font-bold rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary",
                                pendingStatus === "critical" ? "border-red-500 text-red-500" :
                                pendingStatus === "warning" ? "border-yellow-500 text-yellow-500" :
                                pendingStatus === "ok" ? "border-green-500" : "border-border"
                              )}
                            />
                            <button
                              onClick={() => handleStep(loc, 1)}
                              className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center active:scale-90 transition-transform"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleLogTemp(loc, undefined, undefined)}
                              disabled={!inputVal || isSavingThis}
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-transform border",
                                inputVal
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-secondary border-border text-muted-foreground opacity-50"
                              )}
                            >
                              {isSavingThis
                                ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                : <Check className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        {status === "critical" && (
                          <div className="flex items-center gap-2 mt-1.5 pl-4">
                            <button
                              onClick={() => {
                                setIssueSheet({ location: loc, temp: displayTemp });
                                setIssueNotes("");
                                setManagerInitials("");
                              }}
                              className="text-[11px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg active:scale-95 transition-transform"
                            >
                              Add Note / Corrective Action
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 flex gap-3">
        <button
          onClick={() => setViewIssuesOnly(v => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95",
            viewIssuesOnly
              ? "bg-red-500/10 text-red-500 border-red-500/30"
              : "bg-secondary border-border text-muted-foreground"
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          Issues Only
        </button>
        <button
          onClick={handleLogAll}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-transform"
        >
          <Thermometer className="h-4 w-4" />
          Log All Temps
        </button>
      </div>

      {/* Issue bottom sheet */}
      {issueSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIssueSheet(null)} />
          <div className="relative bg-background border-t border-border rounded-t-2xl p-5 space-y-4 z-10">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-1" />
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-bold text-sm">{issueSheet.location.name} — Out of Range</h3>
                <p className="text-xs text-red-500">
                  {issueSheet.temp}°F (range: {issueSheet.location.target_min}° – {issueSheet.location.target_max}°F)
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={managerInitials}
                onChange={e => setManagerInitials(e.target.value.toUpperCase())}
                placeholder="Manager initials *"
                maxLength={3}
                className="w-full h-10 px-3 text-sm font-bold border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary uppercase tracking-widest"
              />
              <textarea
                value={issueNotes}
                onChange={e => setIssueNotes(e.target.value)}
                placeholder="Corrective action taken..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIssueSheet(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueSubmit}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold active:scale-95 transition-transform"
              >
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