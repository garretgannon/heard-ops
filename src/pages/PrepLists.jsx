import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ClipboardList, Trash2, Play, Archive, Eye, Repeat, FileUp } from "lucide-react";
import ImportDialog from "../components/ImportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import StationBadge from "../components/StationBadge";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import PrepListDetail from "../components/PrepListDetail";

const todayStr = new Date().toISOString().split("T")[0];

export default function PrepLists() {
  const [stations, setStations] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [form, setForm] = useState({ name: "", date: todayStr, station_id: "", notes: "", is_recurring: false, recurring_time: "06:00" });
  const [importOpen, setImportOpen] = useState(false);
  const [importTargetList, setImportTargetList] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const handleStatusChange = async (pl, newStatus) => {
    await base44.entities.PrepList.update(pl.id, { status: newStatus });
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

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Prep Lists</h1>
          <p className="text-muted-foreground mt-1">Create and manage prep lists for each station</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} disabled={prepLists.length === 0}>
            <FileUp className="h-4 w-4 mr-2" />
            Import Items
          </Button>
          <Button onClick={() => setDialogOpen(true)} disabled={stations.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Button>
        </div>
      </div>

      {stations.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Create stations first before making prep lists.
        </div>
      )}

      {prepLists.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No prep lists yet"
          description="Create your first prep list and assign it to a station."
          action={stations.length > 0 && <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />New List</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {prepLists.map(pl => {
            const items = prepItems.filter(pi => pi.prep_list_id === pl.id);
            const done = items.filter(pi => pi.status === "completed").length;
            const station = stations.find(s => s.id === pl.station_id);
            const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

            return (
              <div key={pl.id} className="bg-card rounded-2xl border border-border p-4 lg:p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedList(pl)}>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-semibold">{pl.name}</h3>
                      <StatusBadge status={pl.status} />
                      {pl.is_recurring && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          <Repeat className="h-3 w-3" /> Daily {pl.recurring_time}
                        </span>
                      )}
                      {pl.template_list_id && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          <Repeat className="h-3 w-3" /> Auto-generated
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      {station && <StationBadge name={station.name} color={station.color} />}
                      <span>{pl.date}</span>
                      <span>{done}/{items.length} items</span>
                    </div>
                    {items.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedList(pl)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {pl.status === "draft" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleStatusChange(pl, "active")}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {pl.status === "archived" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleStatusChange(pl, "active")} title="Unarchive">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {pl.status === "active" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleStatusChange(pl, "archived")}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(pl.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImportDialog
        open={importOpen}
        onOpenChange={open => { setImportOpen(open); if (!open) setImportTargetList(null); }}
        type="prep_items"
        onImport={async (rows) => {
          // Import into the most recently active/draft list if no target
          const target = importTargetList || prepLists.find(pl => pl.status === "active") || prepLists[0];
          if (!target) { return; }
          await Promise.all(rows.map((row, i) =>
            base44.entities.PrepItem.create({
              name: row.name,
              quantity: row.quantity || "",
              unit: row.unit || "",
              notes: row.notes || "",
              priority: ["high","medium","low"].includes(row.priority) ? row.priority : "medium",
              prep_list_id: target.id,
              station_id: target.station_id,
              status: "pending",
              sort_order: (prepItems.filter(pi => pi.prep_list_id === target.id).length) + i,
            })
          ));
          load();
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Prep List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>List Name</Label>
              <Input placeholder="e.g., AM Prep, Dinner Setup" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Station</Label>
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
            <div>
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Any special instructions..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  form.is_recurring ? "bg-primary" : "bg-muted"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  form.is_recurring ? "translate-x-[18px]" : "translate-x-1"
                }`} />
              </button>
              <Label className="cursor-pointer" onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}>
                Repeat daily
              </Label>
            </div>
            {form.is_recurring && (
              <div>
                <Label>Generate at time</Label>
                <Input type="time" value={form.recurring_time} onChange={e => setForm({ ...form, recurring_time: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">A fresh copy will be auto-created each day once this time passes, cloning all items.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name.trim() || !form.station_id}>
              {saving ? "Creating..." : "Create List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}