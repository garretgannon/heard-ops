import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ClipboardList, FileUp, Search, Filter, ChevronDown } from "lucide-react";
import BulkImportDialog from "../components/BulkImportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import StationBadge from "../components/StationBadge";
import PrepListDetail from "../components/PrepListDetail";
import { cn } from "@/lib/utils";

const todayStr = new Date().toISOString().split("T")[0];

export default function PrepLists() {
  const [stations, setStations] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState(todayStr);
  const [stationFilter, setStationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStations, setExpandedStations] = useState({});

  const [form, setForm] = useState({ name: "", date: todayStr, station_id: "", notes: "", is_recurring: false, recurring_time: "06:00" });

  const generateRecurring = async (allLists, allItems) => {
    const templates = allLists.filter(pl => pl.is_recurring && !pl.template_list_id);
    const todayLists = allLists.filter(pl => pl.date === todayStr);
    let generated = false;
    for (const tmpl of templates) {
      const alreadyExists = todayLists.some(pl => pl.template_list_id === tmpl.id);
      if (alreadyExists) continue;
      if (tmpl.recurring_time) {
        const [h, m] = tmpl.recurring_time.split(":").map(Number);
        const now = new Date();
        if (now.getHours() < h || (now.getHours() === h && now.getMinutes() < m)) continue;
      }
      const newList = await base44.entities.PrepList.create({
        name: tmpl.name,
        date: todayStr,
        station_id: tmpl.station_id,
        station_name: tmpl.station_name,
        notes: tmpl.notes,
        status: "draft",
        template_list_id: tmpl.id,
      });
      const tmplItems = allItems.filter(pi => pi.prep_list_id === tmpl.id);
      await Promise.all(tmplItems.map(pi =>
        base44.entities.PrepItem.create({
          name: pi.name,
          quantity: pi.quantity,
          unit: pi.unit,
          notes: pi.notes,
          priority: pi.priority,
          master_photo_url: pi.master_photo_url,
          prep_list_id: newList.id,
          station_id: tmpl.station_id,
          status: "pending",
          sort_order: pi.sort_order,
        })
      ));
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
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
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
    await base44.entities.PrepList.create({
      ...form,
      station_name: station?.name || "",
      status: "draft",
    });
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

  // Filter logic
  let filteredLists = prepLists.filter(pl => {
    if (dateFilter && pl.date !== dateFilter) return false;
    if (stationFilter && pl.station_id !== stationFilter) return false;
    if (statusFilter && pl.status !== statusFilter) return false;
    return true;
  });

  const getListProgress = (listId) => {
    const items = prepItems.filter(pi => pi.prep_list_id === listId);
    if (items.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = items.filter(i => i.status === "completed").length;
    return { completed, total: items.length, percentage: Math.round((completed / items.length) * 100) };
  };

  const getStationStats = (stationId) => {
    const lists = filteredLists.filter(pl => pl.station_id === stationId);
    if (lists.length === 0) return null;
    
    let totalItems = 0, completedItems = 0, overdueItems = 0, photoPending = 0;
    lists.forEach(list => {
      const items = prepItems.filter(pi => pi.prep_list_id === list.id);
      totalItems += items.length;
      completedItems += items.filter(i => i.status === "completed").length;
      overdueItems += items.filter(i => i.status !== "completed" && i.priority === "high").length;
      photoPending += items.filter(i => i.status === "completed" && i.requires_photo && !i.photo_url).length;
    });

    return { lists, totalItems, completedItems, overdueItems, photoPending, percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0 };
  };

  const visibleStations = stations.filter(s => {
    const stats = getStationStats(s.id);
    return stats && stats.lists.length > 0;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Prep Progress</h1>
          <p className="text-muted-foreground mt-1">Track kitchen prep by station</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prep items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="lg:w-40" />
          <Select value={stationFilter} onValueChange={setStationFilter}>
            <SelectTrigger className="lg:w-40">
              <SelectValue placeholder="All Stations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Stations</SelectItem>
              {stations.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="lg:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)} disabled={stations.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Button>
          <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
            <FileUp className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Station Cards */}
      <div className="space-y-4">
        {visibleStations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No prep lists for selected filters.
          </div>
        ) : (
          visibleStations.map(station => {
            const stats = getStationStats(station.id);
            const isExpanded = expandedStations[station.id] !== false;

            return (
              <div key={station.id} className="bg-card border-2 border-border rounded-xl overflow-hidden">
                {/* Station Header */}
                <button
                  onClick={() => setExpandedStations(prev => ({ ...prev, [station.id]: !prev[station.id] }))}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <StationBadge name={station.name} color={station.color} />
                    <div className="text-left flex-1 hidden md:block">
                      <p className="text-sm text-muted-foreground">{stats.completedItems} of {stats.totalItems} items</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${stats.percentage}%` }} />
                      </div>
                      <span className="text-lg font-bold text-primary min-w-12 text-right">{stats.percentage}%</span>
                      {stats.overdueItems > 0 && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-700 text-xs font-bold rounded-md">{stats.overdueItems} Overdue</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={cn("h-5 w-5 transition-transform", !isExpanded && "rotate-180")} />
                </button>

                {/* Lists */}
                {isExpanded && (
                  <div className="border-t border-border px-6 py-4 space-y-3">
                    {stats.lists.map(list => {
                      const progress = getListProgress(list.id);
                      return (
                        <button
                          key={list.id}
                          onClick={() => setSelectedList(list)}
                          className="w-full text-left p-4 bg-secondary/20 hover:bg-secondary/40 rounded-lg transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{list.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {progress.completed}/{progress.total} items • {list.status.toUpperCase()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">{progress.percentage}%</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Dialogs */}
      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        type="prep_items"
        onImportComplete={load}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Prep List</DialogTitle>
          </DialogHeader>
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
                <SelectTrigger>
                  <SelectValue placeholder="Select station..." />
                </SelectTrigger>
                <SelectContent>
                  {stations.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.is_recurring ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${form.is_recurring ? "translate-x-[18px]" : "translate-x-1"}`} />
              </button>
              <label className="text-sm font-semibold cursor-pointer" onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}>
                Repeat daily
              </label>
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
            <Button onClick={handleCreate} disabled={saving || !form.name.trim() || !form.station_id}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}