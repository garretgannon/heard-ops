import { useState, useEffect, useMemo, useRef } from "react";
import { haptics } from "@/utils/haptics";
import { base44 } from "@/api/base44Client";
import { Plus, FileUp, Search, AlertCircle, Clock, CheckCircle2, Camera, Play, ClipboardList, ChefHat, Timer, XCircle } from "lucide-react";
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
    // Haptic + optimistic update
    if (newStatus === "completed") haptics.success();
    else haptics.swipe();
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

    // Persist to backend (optimistic update already applied above)
    await base44.entities.PrepItem.update(item.id, { status: newStatus });
    // Sync the real status into prepItems state without a full re-fetch
    setPrepItems(prev => prev.map(p => p.id === item.id ? { ...p, status: newStatus } : p));
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
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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

  const inProgress = todayItems.filter(i => getStatus(i) === "in_progress").length;

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-2 pb-24">

      {/* Header */}
      <div className="flex items-start justify-between pt-1 pb-0.5">
        <div>
          <h1 className="text-[17px] font-extrabold text-white tracking-tight">Prep Progress</h1>
          <p className="text-[11px] text-gray-600 mt-0.5">{dateFilter === todayStr ? "Today's station prep" : dateFilter}</p>
        </div>
        <div className="flex gap-1">
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="h-7 px-2 text-[10px] bg-[#111827] border border-[#1F2937] rounded-lg text-gray-400 focus:outline-none" />
          <button onClick={() => setBulkImportOpen(true)} className="h-7 w-7 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center active:scale-95">
            <FileUp className="h-3 w-3 text-gray-500" />
          </button>
          <button onClick={() => setDialogOpen(true)} disabled={stations.length === 0} className="h-7 w-7 rounded-lg bg-[#F5A623] flex items-center justify-center active:scale-95">
            <Plus className="h-3 w-3 text-black" />
          </button>
        </div>
      </div>

      {/* Metrics row — 4 equal tiles, single horizontal strip */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { icon: ClipboardList, label: "Total",    value: summary.total,     col: "text-white" },
          { icon: CheckCircle2,  label: "Done",      value: summary.completed, col: summary.completed === summary.total && summary.total > 0 ? "text-emerald-400" : "text-white" },
          { icon: Timer,         label: "Active",    value: inProgress,        col: inProgress > 0 ? "text-amber-400" : "text-white" },
          { icon: XCircle,       label: "Overdue",   value: summary.overdue,   col: summary.overdue > 0 ? "text-red-400" : "text-white" },
        ].map(({ icon: Icon, label, value, col }) => (
          <div key={label} className="flex flex-col gap-0 bg-[#111827] border border-[#1F2937] rounded-xl p-2 min-w-0">
            <Icon className={cn("h-3 w-3 mb-0.5", col)} />
            <span className={cn("text-[20px] font-extrabold leading-none", col)}>{value}</span>
            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wide mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      {/* Overall progress bar — compact card */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Completion</span>
          <span className={cn("text-[12px] font-extrabold", summary.pct === 100 ? "text-emerald-400" : summary.pct >= 60 ? "text-amber-400" : "text-red-400")}>{summary.pct}%</span>
        </div>
        <div className="h-1.5 w-full bg-[#1A2235] rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700", summary.pct === 100 ? "bg-emerald-500" : summary.pct >= 60 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${summary.pct}%` }} />
        </div>
        <p className="text-[10px] text-gray-600 mt-0.5">{summary.completed}/{summary.total} items</p>
      </div>

      {/* Station cards — horizontal scroll, prominent */}
      {stationStats.length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Stations</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveStation("")}
              className={cn(
                "flex-shrink-0 rounded-xl border px-3 py-2 text-left transition-all active:scale-95 min-w-[100px]",
                !activeStation ? "border-[#F5A623] bg-[#F5A623]/8" : "border-[#1F2937] bg-[#111827]"
              )}>
              <p className="text-[10px] font-bold text-gray-500 mb-1">All Stations</p>
              <p className={cn("text-[18px] font-extrabold leading-none", summary.pct === 100 ? "text-emerald-400" : "text-[#F5A623]")}>{summary.pct}%</p>
              <div className="h-1 w-full bg-[#1F2937] rounded-full mt-1.5 overflow-hidden">
                <div className={cn("h-1 rounded-full transition-all", summary.pct === 100 ? "bg-emerald-500" : "bg-[#F5A623]")} style={{ width: `${summary.pct}%` }} />
              </div>
              <p className="text-[10px] text-gray-600 mt-1 font-semibold">{summary.completed}/{summary.total} done</p>
            </button>
            {stationStats.map(({ station, done, total, overdue, pct }) => (
              <button key={station.id}
                onClick={() => setActiveStation(activeStation === station.id ? "" : station.id)}
                className={cn(
                  "flex-shrink-0 rounded-xl border px-3 py-2 text-left transition-all active:scale-95 min-w-[100px]",
                  activeStation === station.id ? "border-[#F5A623] bg-[#F5A623]/8"
                  : overdue > 0 ? "border-red-500/30 bg-[#111827]"
                  : pct === 100 ? "border-emerald-500/20 bg-[#111827]"
                  : "border-[#1F2937] bg-[#111827]"
                )}>
                <p className="text-[10px] font-bold text-gray-500 mb-1 truncate">{station.name}</p>
                <p className={cn("text-[18px] font-extrabold leading-none", pct === 100 ? "text-emerald-400" : overdue > 0 ? "text-red-400" : "text-[#F5A623]")}>{pct}%</p>
                <div className="h-1 w-full bg-[#1F2937] rounded-full mt-1.5 overflow-hidden">
                  <div className={cn("h-1 rounded-full transition-all", pct === 100 ? "bg-emerald-500" : overdue > 0 ? "bg-red-500" : "bg-[#F5A623]")} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-gray-600 mt-1 font-semibold">{done}/{total} done</p>
                {overdue > 0 && <p className="text-[9px] text-red-400 font-bold mt-0.5">{overdue} late</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {[
          { id: "all",            label: "All" },
          { id: "overdue",        label: "⚠ Late" },
          { id: "in_progress",    label: "Active" },
          { id: "not_started",    label: "Pending" },
          { id: "completed",      label: "Done" },
        ].map(f => (
          <button key={f.id} onClick={() => { setItemFilter(f.id); setAllCaughtUp(false); }}
            className={cn(
              "flex-shrink-0 h-7 px-2.5 rounded-lg text-[10px] font-bold border transition-all active:scale-95 whitespace-nowrap",
              itemFilter === f.id
                ? f.id === "overdue" ? "bg-red-500/15 text-red-400 border-red-500/30"
                  : f.id === "completed" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30"
                : "bg-[#111827] text-gray-600 border-[#1F2937]"
            )}>{f.label}</button>
        ))}
      </div>

      {/* All caught up */}
      {allCaughtUp && (
        <div className="flex items-center gap-2 py-2 px-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-bold">
          <CheckCircle2 className="h-3.5 w-3.5" /> All caught up!
        </div>
      )}

      {/* Prep Items */}
      <div className="flex flex-col gap-1.5">
        {filteredItems.length === 0
          ? <p className="text-center py-6 text-[12px] text-gray-600">No items</p>
          : filteredItems.map(item => (
              <PrepItemRow key={item.id} item={item} station={getStation(item.station_id)} list={getListForItem(item)} status={getStatus(item)} isFlashing={flashDone.has(item.id)} filteredIds={filteredIds} onAction={handleItemAction} onOpen={setSelectedList} itemRef={el => { itemRefs.current[item.id] = el; }} />
            ))
        }
      </div>

      {/* Dialogs */}
      <BulkImportDialog open={bulkImportOpen} onOpenChange={setBulkImportOpen} type="prep_items" onImportComplete={load} />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Prep List</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-sm font-semibold">List Name</label>
              <Input placeholder="e.g., AM Prep, Dinner Setup" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-sm font-semibold">Date</label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div><label className="text-sm font-semibold">Station</label>
              <Select value={form.station_id} onValueChange={v => setForm({ ...form, station_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select station..." /></SelectTrigger>
                <SelectContent>{stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.is_recurring ? "bg-primary" : "bg-muted"}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${form.is_recurring ? "translate-x-[18px]" : "translate-x-1"}`} />
              </button>
              <label className="text-sm font-semibold cursor-pointer" onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}>Repeat daily</label>
            </div>
            {form.is_recurring && (
              <div><label className="text-sm font-semibold">Generate at time</label>
                <Input type="time" value={form.recurring_time} onChange={e => setForm({ ...form, recurring_time: e.target.value })} /></div>
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

/* ── Prep Item Row — compact card ─────────────────────── */
function PrepItemRow({ item, station, list, status, isFlashing, filteredIds, onAction, onOpen, itemRef }) {
  const isDone       = status === "completed";
  const isInProgress = status === "in_progress";
  const isOverdue    = !isDone && item.priority === "high";
  const needsPhoto   = isDone && !item.photo_url && item.master_photo_url;

  return (
    <div
      ref={itemRef}
      className={cn(
        "bg-[#111827] border rounded-xl px-3 py-2 flex items-center gap-2.5 transition-all duration-200",
        isFlashing  ? "border-emerald-500 bg-emerald-500/6"
        : isOverdue ? "border-red-500/30"
        : needsPhoto? "border-amber-500/30"
        : isDone    ? "border-emerald-500/15"
        :             "border-[#1F2937]"
      )}
    >
      {/* Left icon */}
      <div className={cn(
        "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
        isDone ? "bg-emerald-500/10" : isInProgress ? "bg-amber-500/10" : isOverdue ? "bg-red-500/10" : "bg-[#1A2235]"
      )}>
        {isDone        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
         : isInProgress? <Play className="h-3.5 w-3.5 text-amber-400" />
         : isOverdue   ? <AlertCircle className="h-3.5 w-3.5 text-red-400" />
         :               <ClipboardList className="h-3.5 w-3.5 text-gray-600" />}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0" onClick={() => list && onOpen(list)}>
        <p className={cn("text-[12px] font-bold leading-tight truncate", isDone ? "line-through text-gray-600" : "text-white")}>{item.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {station && <span className="text-[10px] text-gray-600">{station.name}</span>}
          {(item.quantity || item.unit) && <><span className="text-gray-700 text-[9px]">·</span><span className="text-[10px] text-gray-600">{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span></>}
          {item.assigned_to_individual && <><span className="text-gray-700 text-[9px]">·</span><span className="text-[10px] text-gray-600">{item.assigned_to_individual.includes("@") ? item.assigned_to_individual.split("@")[0] : item.assigned_to_individual}</span></>}
          {needsPhoto && <Camera className="h-2.5 w-2.5 text-amber-400 shrink-0" />}
        </div>
      </div>

      {/* Status badge */}
      <span className={cn(
        "text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0",
        isDone       ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        : isInProgress? "bg-amber-500/10 border-amber-500/20 text-amber-400"
        : isOverdue  ? "bg-red-500/10 border-red-500/20 text-red-400"
        :               "bg-[#1A2235] border-[#232D3F] text-gray-600"
      )}>
        {isDone ? "Done" : isInProgress ? "Active" : isOverdue ? "Late" : "Pending"}
      </span>

      {/* Action buttons — right aligned, small */}
      <div className="flex gap-1 shrink-0">
        {!isDone && (
          <>
            {status === "pending" && (
              <button onClick={e => onAction(e, item, "in_progress", filteredIds)}
                className="h-6 px-2 rounded-lg bg-[#F5A623]/10 border border-[#F5A623]/20 text-[10px] font-bold text-[#F5A623] active:scale-95 transition-transform">
                Start
              </button>
            )}
            <button onClick={e => onAction(e, item, "completed", filteredIds)}
              className="h-6 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 active:scale-95 transition-transform">
              ✓
            </button>
          </>
        )}
        {needsPhoto && (
          <button onClick={() => list && onOpen(list)}
            className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center active:scale-95">
            <Camera className="h-3 w-3 text-amber-400" />
          </button>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;