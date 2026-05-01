import { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FileUp, Search, AlertCircle, Clock, CheckCircle2, Camera, Play } from "lucide-react";
import BulkImportDialog from "../components/BulkImportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PrepListDetail from "../components/PrepListDetail";
import { cn } from "@/lib/utils";

const todayStr = new Date().toISOString().split("T")[0];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "pending_review", label: "Needs Photo" },
  { id: "not_started", label: "Not Started" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Done" },
];

const PRIORITY_COLOR = { high: "bg-red-500", medium: "bg-yellow-400", low: "bg-muted" };
const STATUS_COLOR = { completed: "text-green-500", in_progress: "text-yellow-500", pending: "text-muted-foreground" };

export default function PrepLists() {
  const [stations, setStations] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemFilter, setItemFilter] = useState("all");
  const [activeStation, setActiveStation] = useState("");
  const [form, setForm] = useState({ name: "", date: todayStr, station_id: "", notes: "", is_recurring: false, recurring_time: "06:00" });

  // Action flow state
  const [flashDone, setFlashDone] = useState(new Set()); // item ids currently showing checkmark flash
  const [localStatus, setLocalStatus] = useState({}); // optimistic status overrides
  const [allCaughtUp, setAllCaughtUp] = useState(false);
  const [viewByPerson, setViewByPerson] = useState(false);
  const itemRefs = useRef({});

  const generateRecurring = async (allLists, allItems) => {
    const templates = allLists.filter(pl => pl.is_recurring && !pl.template_list_id);
    const todayLists = allLists.filter(pl => pl.date === todayStr);
    let generated = false;
    for (const tmpl of templates) {
      if (todayLists.some(pl => pl.template_list_id === tmpl.id)) continue;
      if (tmpl.recurring_time) {
        const [h, m] = tmpl.recurring_time.split(":").map(Number);
        const now = new Date();
        if (now.getHours() < h || (now.getHours() === h && now.getMinutes() < m)) continue;
      }
      const newList = await base44.entities.PrepList.create({
        name: tmpl.name, date: todayStr, station_id: tmpl.station_id,
        station_name: tmpl.station_name, notes: tmpl.notes, status: "draft", template_list_id: tmpl.id,
      });
      const tmplItems = allItems.filter(pi => pi.prep_list_id === tmpl.id);
      await Promise.all(tmplItems.map(pi => base44.entities.PrepItem.create({
        name: pi.name, quantity: pi.quantity, unit: pi.unit, notes: pi.notes,
        priority: pi.priority, master_photo_url: pi.master_photo_url,
        prep_list_id: newList.id, station_id: tmpl.station_id, status: "pending", sort_order: pi.sort_order,
      })));
      generated = true;
    }
    return generated;
  };

  const load = async () => {
    const [s, pl, pi] = await Promise.all([
      base44.entities.Station.list(),
      base44.entities.PrepList.list("-created_date", 100),
      base44.entities.PrepItem.list("-created_date", 500),
    ]);
    setStations(s);
    const generated = await generateRecurring(pl, pi);
    if (generated) {
      const [pl2, pi2] = await Promise.all([
        base44.entities.PrepList.list("-created_date", 100),
        base44.entities.PrepItem.list("-created_date", 500),
      ]);
      setPrepLists(pl2);
      setPrepItems(pi2);
    } else {
      setPrepLists(pl);
      setPrepItems(pi);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (prepLists.length > 0) {
      const id = new URLSearchParams(window.location.search).get("id");
      if (id) {
        const found = prepLists.find(pl => pl.id === id);
        if (found) setSelectedList(found);
      }
    }
  }, [prepLists]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.station_id) return;
    setSaving(true);
    const station = stations.find(s => s.id === form.station_id);
    await base44.entities.PrepList.create({ ...form, station_name: station?.name || "", status: "draft" });
    setDialogOpen(false);
    setForm({ name: "", date: todayStr, station_id: "", notes: "", is_recurring: false, recurring_time: "06:00" });
    setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    const items = prepItems.filter(pi => pi.prep_list_id === id);
    await Promise.all(items.map(pi => base44.entities.PrepItem.delete(pi.id)));
    await base44.entities.PrepList.delete(id);
    if (selectedList?.id === id) setSelectedList(null);
    load();
  };

  // Action handler: optimistic update + flash + auto-advance
  const handleItemAction = async (e, item, newStatus, currentFilteredIds) => {
    e.stopPropagation();
    // Optimistic update
    setLocalStatus(prev => ({ ...prev, [item.id]: newStatus }));
    // Flash checkmark
    setFlashDone(prev => new Set([...prev, item.id]));
    setTimeout(() => setFlashDone(prev => { const s = new Set(prev); s.delete(item.id); return s; }), 900);

    // Find next item in filtered list that still needs action
    const currentIndex = currentFilteredIds.indexOf(item.id);
    const remainingAfter = currentFilteredIds.slice(currentIndex + 1).filter(id => {
      const st = localStatus[id] || prepItems.find(p => p.id === id)?.status;
      return st !== "completed";
    });

    if (remainingAfter.length > 0) {
      const nextId = remainingAfter[0];
      setTimeout(() => {
        const el = itemRefs.current[nextId];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    } else {
      // Check if there's anything left at all
      const anyLeft = currentFilteredIds.filter(id => {
        const st = localStatus[id] || prepItems.find(p => p.id === id)?.status;
        return st !== "completed" && id !== item.id;
      });
      if (anyLeft.length === 0) {
        setTimeout(() => setAllCaughtUp(true), 500);
        setTimeout(() => setAllCaughtUp(false), 3000);
      }
    }

    // Persist to backend
    await base44.entities.PrepItem.update(item.id, { status: newStatus });
    // Refresh quietly
    const pi = await base44.entities.PrepItem.list("-created_date", 500);
    setPrepItems(pi);
    setLocalStatus(prev => { const s = { ...prev }; delete s[item.id]; return s; });
  };

  // Derived data
  const todayLists = useMemo(() => prepLists.filter(pl => pl.date === dateFilter), [prepLists, dateFilter]);
  const todayListIds = useMemo(() => new Set(todayLists.map(pl => pl.id)), [todayLists]);
  const todayItems = useMemo(() => prepItems.filter(pi => todayListIds.has(pi.prep_list_id)), [prepItems, todayListIds]);

  const getStation = (id) => stations.find(s => s.id === id);
  const getListForItem = (pi) => todayLists.find(pl => pl.id === pi.prep_list_id);

  // Merge optimistic status
  const getStatus = (item) => localStatus[item.id] || item.status;

  const summary = useMemo(() => {
    const total = todayItems.length;
    const completed = todayItems.filter(i => getStatus(i) === "completed").length;
    const overdue = todayItems.filter(i => getStatus(i) !== "completed" && i.priority === "high").length;
    const needsPhoto = todayItems.filter(i => getStatus(i) === "completed" && !i.photo_url && i.master_photo_url).length;
    const stationsActive = new Set(todayItems.map(i => i.station_id));
    const stationsNotStarted = stations.filter(s => stationsActive.has(s.id) && todayItems.filter(i => i.station_id === s.id).every(i => getStatus(i) === "pending")).length;
    return { total, completed, overdue, needsPhoto, stationsNotStarted, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [todayItems, stations, localStatus]);

  const stationStats = useMemo(() => {
    return stations.map(s => {
      const items = todayItems.filter(i => i.station_id === s.id);
      if (items.length === 0) return null;
      const done = items.filter(i => getStatus(i) === "completed").length;
      const overdue = items.filter(i => getStatus(i) !== "completed" && i.priority === "high").length;
      const pct = Math.round((done / items.length) * 100);
      return { station: s, items, done, total: items.length, overdue, pct };
    }).filter(Boolean);
  }, [todayItems, stations, localStatus]);

  const filteredItems = useMemo(() => {
    let items = todayItems;
    if (activeStation) items = items.filter(i => i.station_id === activeStation);
    if (searchQuery) items = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (itemFilter === "overdue") items = items.filter(i => getStatus(i) !== "completed" && i.priority === "high");
    else if (itemFilter === "pending_review") items = items.filter(i => getStatus(i) === "completed" && !i.photo_url && i.master_photo_url);
    else if (itemFilter === "not_started") items = items.filter(i => getStatus(i) === "pending");
    else if (itemFilter === "in_progress") items = items.filter(i => getStatus(i) === "in_progress");
    else if (itemFilter === "completed") items = items.filter(i => getStatus(i) === "completed");
    return items;
  }, [todayItems, activeStation, searchQuery, itemFilter, localStatus]);

  const needsAttention = useMemo(() => ({
    overdue: todayItems.filter(i => getStatus(i) !== "completed" && i.priority === "high"),
    needsPhoto: todayItems.filter(i => getStatus(i) === "completed" && !i.photo_url && i.master_photo_url),
    lowStations: stationStats.filter(s => s.pct < 30 && s.pct > 0),
  }), [todayItems, stationStats, localStatus]);

  const hasAttention = needsAttention.overdue.length > 0 || needsAttention.needsPhoto.length > 0 || needsAttention.lowStations.length > 0;
  const filteredIds = filteredItems.map(i => i.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedList) {
    return (
      <PrepListDetail
        prepList={selectedList}
        station={stations.find(s => s.id === selectedList.station_id)}
        items={prepItems.filter(pi => pi.prep_list_id === selectedList.id)}
        onBack={() => setSelectedList(null)}
        onRefresh={load}
      />
    );
  }

  return (
    <div className="pb-20">
      {/* Sticky Summary Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border pb-3 pt-2 -mx-4 px-4 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Prep Progress</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setBulkImportOpen(true)}>
              <FileUp className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)} disabled={stations.length === 0}>
              <Plus className="h-4 w-4 mr-1" />New
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <div className="bg-primary/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-primary">{summary.pct}%</div>
            <div className="text-[10px] text-muted-foreground">Complete</div>
          </div>
          <div className={cn("rounded-lg p-2 text-center", summary.overdue > 0 ? "bg-red-500/10" : "bg-card")}>
            <div className={cn("text-lg font-bold", summary.overdue > 0 ? "text-red-500" : "text-foreground")}>{summary.overdue}</div>
            <div className="text-[10px] text-muted-foreground">Overdue</div>
          </div>
          <div className={cn("rounded-lg p-2 text-center", summary.needsPhoto > 0 ? "bg-yellow-500/10" : "bg-card")}>
            <div className={cn("text-lg font-bold", summary.needsPhoto > 0 ? "text-yellow-500" : "text-foreground")}>{summary.needsPhoto}</div>
            <div className="text-[10px] text-muted-foreground">Needs Photo</div>
          </div>
          <div className={cn("rounded-lg p-2 text-center", summary.stationsNotStarted > 0 ? "bg-orange-500/10" : "bg-card")}>
            <div className={cn("text-lg font-bold", summary.stationsNotStarted > 0 ? "text-orange-500" : "text-foreground")}>{summary.stationsNotStarted}</div>
            <div className="text-[10px] text-muted-foreground">Not Started</div>
          </div>
        </div>

        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${summary.pct}%` }} />
        </div>

        <div className="flex gap-2">
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-8 text-xs w-36 shrink-0" />
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-8 text-xs pl-7" />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        {/* Needs Attention */}
        {hasAttention && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />Needs Attention
            </p>
            {needsAttention.overdue.length > 0 && (
              <button onClick={() => setItemFilter("overdue")} className="w-full bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-left flex items-center justify-between active:scale-95 transition-transform">
                <span className="text-xs font-semibold text-red-600">{needsAttention.overdue.length} high-priority items not done</span>
                <span className="text-[10px] text-red-500">Tap to filter →</span>
              </button>
            )}
            {needsAttention.needsPhoto.length > 0 && (
              <button onClick={() => setItemFilter("pending_review")} className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-left flex items-center justify-between active:scale-95 transition-transform">
                <span className="text-xs font-semibold text-yellow-600">{needsAttention.needsPhoto.length} items need photo verification</span>
                <span className="text-[10px] text-yellow-500">Tap to filter →</span>
              </button>
            )}
            {needsAttention.lowStations.map(s => (
              <button key={s.station.id} onClick={() => { setActiveStation(s.station.id); setItemFilter("all"); }} className="w-full bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 text-left flex items-center justify-between active:scale-95 transition-transform">
                <span className="text-xs font-semibold text-orange-600">{s.station.name}: only {s.pct}% complete</span>
                <span className="text-[10px] text-orange-500">Tap to filter →</span>
              </button>
            ))}
          </div>
        )}

        {/* Station cards */}
        {stationStats.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Stations</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              <button
                onClick={() => setActiveStation("")}
                className={cn("flex-shrink-0 rounded-xl border px-3 py-2 text-left transition-all active:scale-95", !activeStation ? "border-primary bg-primary/10" : "border-border bg-card")}
                style={{ minWidth: 110 }}
              >
                <div className="text-xs font-bold truncate">All Stations</div>
                <div className="text-base font-bold text-primary">{summary.pct}%</div>
                <div className="h-1 w-full bg-border rounded-full mt-1 overflow-hidden">
                  <div className="h-1 bg-primary rounded-full transition-all duration-500" style={{ width: `${summary.pct}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{summary.completed}/{summary.total}</div>
              </button>
              {stationStats.map(({ station, done, total, overdue, pct }) => (
                <button
                  key={station.id}
                  onClick={() => setActiveStation(activeStation === station.id ? "" : station.id)}
                  className={cn("flex-shrink-0 rounded-xl border px-3 py-2 text-left transition-all active:scale-95", activeStation === station.id ? "border-primary bg-primary/10" : overdue > 0 ? "border-red-500/40 bg-red-500/5" : "border-border bg-card")}
                  style={{ minWidth: 110 }}
                >
                  <div className="text-xs font-bold truncate">{station.name}</div>
                  <div className={cn("text-base font-bold", pct === 100 ? "text-green-500" : overdue > 0 ? "text-red-500" : "text-primary")}>{pct}%</div>
                  <div className="h-1 w-full bg-border rounded-full mt-1 overflow-hidden">
                    <div className={cn("h-1 rounded-full transition-all duration-500", pct === 100 ? "bg-green-500" : overdue > 0 ? "bg-red-500" : "bg-primary")} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {done}/{total} · {pct === 100 ? <span className="text-green-500 font-semibold">All done</span> : done === 0 ? <span className="text-orange-400">Not started</span> : overdue > 0 ? <span className="text-red-400">{overdue} overdue</span> : <span className="text-yellow-400">Behind schedule</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View toggle + Filter chips */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setViewByPerson(v => !v)}
            className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95",
              viewByPerson ? "bg-accent text-accent-foreground border-accent" : "bg-card border-border text-muted-foreground"
            )}
          >
            👤 By Person
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => { setItemFilter(f.id); setAllCaughtUp(false); }}
              className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95",
                itemFilter === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* All caught up banner */}
        {allCaughtUp && (
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-sm font-semibold animate-pulse">
            <CheckCircle2 className="h-4 w-4" />
            All caught up!
          </div>
        )}

        {/* Prep Item Cards */}
        {viewByPerson ? (
          (() => {
            const unassigned = "Unassigned";
            const grouped = {};
            filteredItems.forEach(item => {
              const key = item.assigned_to_individual || unassigned;
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(item);
            });
            const entries = Object.entries(grouped).sort(([a], [b]) => a === unassigned ? 1 : b === unassigned ? -1 : a.localeCompare(b));
            if (entries.length === 0) return <div className="text-center py-8 text-muted-foreground text-sm">No items match this filter</div>;
            return (
              <div className="space-y-4">
                {entries.map(([person, items]) => {
                  const done = items.filter(i => getStatus(i) === "completed").length;
                  const overdue = items.filter(i => getStatus(i) !== "completed" && i.priority === "high").length;
                  const pct = Math.round((done / items.length) * 100);
                  const displayName = person === unassigned ? "Unassigned" : person.includes("@") ? person.split("@")[0] : person;
                  return (
                    <div key={person}>
                      <div className="flex items-center justify-between mb-1.5 px-0.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {displayName[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-bold">{displayName}</span>
                          {overdue > 0 && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">{overdue} overdue</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className={cn("h-1.5 rounded-full transition-all duration-500", pct === 100 ? "bg-green-500" : overdue > 0 ? "bg-red-500" : "bg-primary")} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={cn("text-xs font-bold", pct === 100 ? "text-green-500" : overdue > 0 ? "text-red-500" : "text-primary")}>{pct}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {items.map(item => {
                          const list = getListForItem(item);
                          const station = getStation(item.station_id);
                          const status = getStatus(item);
                          const isDone = status === "completed";
                          const isInProgress = status === "in_progress";
                          const isOverdue = !isDone && item.priority === "high";
                          const needsPhoto = isDone && !item.photo_url && item.master_photo_url;
                          const isFlashing = flashDone.has(item.id);
                          return (
                            <div key={item.id} ref={el => { itemRefs.current[item.id] = el; }}
                              className={cn("bg-card border rounded-xl p-3 transition-all duration-300",
                                isFlashing ? "border-green-500 bg-green-500/10 scale-[0.98]" : isOverdue ? "border-red-500/40" : needsPhoto ? "border-yellow-500/40" : isDone ? "border-green-500/20" : "border-border"
                              )}
                            >
                              {isFlashing && <div className="flex items-center gap-1.5 mb-1.5 text-green-500 text-xs font-bold animate-pulse"><CheckCircle2 className="h-4 w-4" /> Updated!</div>}
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => list && setSelectedList(list)}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-0.5", PRIORITY_COLOR[item.priority] || "bg-muted")} />
                                  <span className={cn("font-semibold text-sm truncate", isDone && "line-through text-muted-foreground")}>{item.name}</span>
                                </div>
                                <span className={cn("text-xs font-bold shrink-0", STATUS_COLOR[status] || "text-muted-foreground")}>{isDone ? "✓ Done" : isInProgress ? "In Progress" : "Pending"}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground pl-3.5 mb-2">
                                {station && <span className="font-medium text-foreground/70">{station.name}</span>}
                                {item.due_time && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{item.due_time}</span>}
                                {(item.quantity || item.unit) && <span>{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span>}
                                {needsPhoto && <span className="flex items-center gap-0.5 text-yellow-500 font-semibold"><Camera className="h-3 w-3" />Photo needed</span>}
                              </div>
                              {!isDone && (
                                <div className="flex gap-2 pl-3.5">
                                  {status === "pending" && <button onClick={e => handleItemAction(e, item, "in_progress", filteredIds)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold active:scale-95 transition-transform border border-primary/20"><Play className="h-3 w-3" /> Start</button>}
                                  {status === "in_progress" && <button onClick={e => handleItemAction(e, item, "completed", filteredIds)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold active:scale-95 transition-transform border border-green-500/20"><CheckCircle2 className="h-3 w-3" /> Complete</button>}
                                  {status === "pending" && <button onClick={e => handleItemAction(e, item, "completed", filteredIds)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-semibold active:scale-95 transition-transform border border-border">✓ Mark Done</button>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        ) : (
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No items match this filter</div>
          ) : (
            filteredItems.map(item => {
              const list = getListForItem(item);
              const station = getStation(item.station_id);
              const status = getStatus(item);
              const isDone = status === "completed";
              const isInProgress = status === "in_progress";
              const isOverdue = !isDone && item.priority === "high";
              const needsPhoto = isDone && !item.photo_url && item.master_photo_url;
              const isFlashing = flashDone.has(item.id);

              return (
                <div
                  key={item.id}
                  ref={el => { itemRefs.current[item.id] = el; }}
                  className={cn(
                    "bg-card border rounded-xl p-3 transition-all duration-300",
                    isFlashing ? "border-green-500 bg-green-500/10 scale-[0.98]" : isOverdue ? "border-red-500/40" : needsPhoto ? "border-yellow-500/40" : isDone ? "border-green-500/20" : "border-border"
                  )}
                >
                  {isFlashing && (
                    <div className="flex items-center gap-1.5 mb-1.5 text-green-500 text-xs font-bold animate-pulse">
                      <CheckCircle2 className="h-4 w-4" /> Updated!
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => list && setSelectedList(list)}>
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-0.5", PRIORITY_COLOR[item.priority] || "bg-muted")} />
                      <span className={cn("font-semibold text-sm truncate", isDone && "line-through text-muted-foreground")}>{item.name}</span>
                    </div>
                    <span className={cn("text-xs font-bold shrink-0", STATUS_COLOR[status] || "text-muted-foreground")}>
                      {isDone ? "✓ Done" : isInProgress ? "In Progress" : "Pending"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground pl-3.5 mb-2">
                    {station && <span className="font-medium text-foreground/70">{station.name}</span>}
                    {item.due_time && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{item.due_time}</span>}
                    {(item.quantity || item.unit) && <span>{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span>}
                    {item.assigned_to_individual && <span>{item.assigned_to_individual.split("@")[0]}</span>}
                    {needsPhoto && <span className="flex items-center gap-0.5 text-yellow-500 font-semibold"><Camera className="h-3 w-3" />Photo needed</span>}
                  </div>

                  {!isDone && (
                    <div className="flex gap-2 pl-3.5">
                      {status === "pending" && (
                        <button
                          onClick={e => handleItemAction(e, item, "in_progress", filteredIds)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold active:scale-95 transition-transform border border-primary/20"
                        >
                          <Play className="h-3 w-3" /> Start
                        </button>
                      )}
                      {status === "in_progress" && (
                        <button
                          onClick={e => handleItemAction(e, item, "completed", filteredIds)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold active:scale-95 transition-transform border border-green-500/20"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Complete
                        </button>
                      )}
                      {status === "pending" && (
                        <button
                          onClick={e => handleItemAction(e, item, "completed", filteredIds)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-semibold active:scale-95 transition-transform border border-border"
                        >
                          ✓ Mark Done
                        </button>
                      )}
                    </div>
                  )}
                  {needsPhoto && (
                    <div className="flex gap-2 pl-3.5 mt-1">
                      <button
                        onClick={() => list && setSelectedList(list)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/10 text-yellow-600 text-xs font-bold active:scale-95 transition-transform border border-yellow-500/20"
                      >
                        <Camera className="h-3 w-3" /> Add Photo
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        )}

        {/* Prep Lists for active station */}
        {activeStation && (
          <div className="pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Prep Lists</p>
            <div className="space-y-2">
              {todayLists.filter(pl => pl.station_id === activeStation).map(list => {
                const items = prepItems.filter(pi => pi.prep_list_id === list.id);
                const done = items.filter(i => getStatus(i) === "completed").length;
                const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
                return (
                  <button key={list.id} onClick={() => setSelectedList(list)} className="w-full bg-secondary/20 border border-border rounded-lg px-3 py-2 text-left flex items-center justify-between active:scale-95 transition-transform">
                    <div>
                      <div className="text-sm font-semibold">{list.name}</div>
                      <div className="text-[11px] text-muted-foreground">{done}/{items.length} · {list.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-primary">{pct}%</div>
                      <div className="h-1 w-16 bg-border rounded-full mt-1 overflow-hidden">
                        <div className="h-1 bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <BulkImportDialog open={bulkImportOpen} onOpenChange={setBulkImportOpen} type="prep_items" onImportComplete={load} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Prep List</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold">List Name</label>
              <Input placeholder="e.g., AM Prep, Dinner Setup" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-semibold">Date</label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-semibold">Station</label>
              <Select value={form.station_id} onValueChange={v => setForm({ ...form, station_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select station..." /></SelectTrigger>
                <SelectContent>
                  {stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.is_recurring ? "bg-primary" : "bg-muted"}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${form.is_recurring ? "translate-x-[18px]" : "translate-x-1"}`} />
              </button>
              <label className="text-sm font-semibold cursor-pointer" onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}>Repeat daily</label>
            </div>
            {form.is_recurring && (
              <div>
                <label className="text-sm font-semibold">Generate at time</label>
                <Input type="time" value={form.recurring_time} onChange={e => setForm({ ...form, recurring_time: e.target.value })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name.trim() || !form.station_id}>{saving ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;