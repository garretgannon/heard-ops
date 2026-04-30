import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ClipboardList, FileUp } from "lucide-react";
import BulkImportDialog from "../components/BulkImportDialog";
import ImportDialog from "../components/ImportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import StationBadge from "../components/StationBadge";
import EmptyState from "../components/EmptyState";
import PrepListDetail from "../components/PrepListDetail";
import PrepListCard from "../components/PrepListCard";

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
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
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
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Prep Lists</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage prep lists for each station</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
            <FileUp className="h-4 w-4 mr-2" />
            Bulk Import
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
        <div className="space-y-8">
          {stations.map(station => {
            const stationLists = prepLists.filter(pl => pl.station_id === station.id);
            if (stationLists.length === 0) return null;

            const amLists = stationLists.filter(pl => {
              const time = pl.recurring_time || "12:00";
              const [h] = time.split(":").map(Number);
              return h < 12;
            });
            const pmLists = stationLists.filter(pl => {
              const time = pl.recurring_time || "12:00";
              const [h] = time.split(":").map(Number);
              return h >= 12;
            });

            return (
              <div key={station.id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <StationBadge name={station.name} color={station.color} />
                  <span className="text-xs text-muted-foreground">({stationLists.length} lists)</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {amLists.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Morning</h4>
                      <div className="space-y-3">
                        {amLists.map((pl, i) => (
                          <PrepListCard
                            key={pl.id}
                            pl={pl}
                            items={prepItems.filter(pi => pi.prep_list_id === pl.id)}
                            i={i}
                            onSelect={setSelectedList}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {pmLists.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Evening</h4>
                      <div className="space-y-3">
                        {pmLists.map((pl, i) => (
                          <PrepListCard
                            key={pl.id}
                            pl={pl}
                            items={prepItems.filter(pi => pi.prep_list_id === pl.id)}
                            i={i}
                            onSelect={setSelectedList}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        type="prep_items"
        onImportComplete={load}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={open => { setImportOpen(open); if (!open) setImportTargetList(null); }}
        type="prep_items"
        onImport={async (rows) => {
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