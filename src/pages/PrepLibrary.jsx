import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Copy, Download, Upload, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StationBadge from "../components/StationBadge";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PrepLibrary() {
  const { isAdmin } = useCurrentUser();
  const [stations, setStations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [stationFilter, setStationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [photoFilter, setPhotoFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form
  const [form, setForm] = useState({
    name: "",
    station_id: "",
    day_of_week: "",
    quantity: "",
    unit: "",
    par_level: "",
    due_time: "",
    requires_photo: false,
    recipe_link: "",
    notes: "",
    priority: "medium",
    active: true,
  });

  const load = async () => {
    const [s, items] = await Promise.all([
      base44.entities.Station.list(),
      base44.entities.PrepLibraryItem.list("-created_date", 500),
    ]);
    setStations(s);
    setTemplates(items);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.station_id) {
      toast.error("Name and station required");
      return;
    }

    if (editingId) {
      await base44.entities.PrepLibraryItem.update(editingId, form);
      toast.success("Template updated");
    } else {
      await base44.entities.PrepLibraryItem.create(form);
      toast.success("Template created");
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm({
      name: "",
      station_id: "",
      day_of_week: "",
      quantity: "",
      unit: "",
      par_level: "",
      due_time: "",
      requires_photo: false,
      recipe_link: "",
      notes: "",
      priority: "medium",
      active: true,
    });
    load();
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Archive this template?")) return;
    await base44.entities.PrepLibraryItem.update(id, { active: false });
    toast.success("Template archived");
    load();
  };

  const handleDuplicate = async (item) => {
    const newItem = { ...item };
    delete newItem.id;
    newItem.name = `${item.name} (Copy)`;
    await base44.entities.PrepLibraryItem.create(newItem);
    toast.success("Template duplicated");
    load();
  };

  const handleExport = () => {
    const filtered = getFilteredTemplates();
    const csv = [
      ["Name", "Station", "Day", "Quantity", "Unit", "Par Level", "Due Time", "Photo Required", "Priority", "Recipe Link", "Notes"],
      ...filtered.map(t => [
        t.name,
        stations.find(s => s.id === t.station_id)?.name || "",
        t.day_of_week || "Any",
        t.quantity || "",
        t.unit || "",
        t.par_level || "",
        t.due_time || "",
        t.requires_photo ? "Yes" : "No",
        t.priority,
        t.recipe_link || "",
        t.notes || "",
      ]),
    ]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = "prep_templates.csv";
    link.click();
    toast.success("Templates exported");
  };

  const getFilteredTemplates = () => {
    return templates.filter(t => {
      if (statusFilter === "active" && !t.active) return false;
      if (statusFilter === "archived" && t.active) return false;
      if (stationFilter && t.station_id !== stationFilter) return false;
      if (photoFilter === "yes" && !t.requires_photo) return false;
      if (photoFilter === "no" && t.requires_photo) return false;
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Only managers can access prep templates.
      </div>
    );
  }

  const filtered = getFilteredTemplates();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Prep Templates</h1>
        <p className="text-muted-foreground mt-1">Build recurring prep lists by station and day</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={stationFilter} onValueChange={setStationFilter}>
            <SelectTrigger className="w-40">
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
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>

          <Select value={photoFilter} onValueChange={setPhotoFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Photo Required" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All</SelectItem>
              <SelectItem value="yes">Photo Required</SelectItem>
              <SelectItem value="no">No Photo</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button onClick={() => { setEditingId(null); setForm({
            name: "",
            station_id: "",
            day_of_week: "",
            quantity: "",
            unit: "",
            par_level: "",
            due_time: "",
            requires_photo: false,
            recipe_link: "",
            notes: "",
            priority: "medium",
            active: true,
          }); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/30 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Station</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Day</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Qty</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Par</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Due</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Photo</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(item => (
              <tr key={item.id} className={cn("hover:bg-secondary/20 transition-colors", !item.active && "opacity-50")}>
                <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                <td className="px-4 py-3"><StationBadge name={stations.find(s => s.id === item.station_id)?.name} /></td>
                <td className="px-4 py-3 text-sm">{item.day_of_week || "Any"}</td>
                <td className="px-4 py-3 text-sm">{item.quantity}{item.unit ? ` ${item.unit}` : ""}</td>
                <td className="px-4 py-3 text-sm">{item.par_level || "—"}</td>
                <td className="px-4 py-3 text-sm">{item.due_time || "—"}</td>
                <td className="px-4 py-3 text-sm">{item.requires_photo ? "✓" : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicate(item)}><Copy className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filtered.map(item => (
          <div key={item.id} className={cn("bg-card border border-border rounded-lg p-4", !item.active && "opacity-50")}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <StationBadge name={stations.find(s => s.id === item.station_id)?.name} />
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{item.day_of_week || "Any Day"}</p>
                {item.requires_photo && <p className="text-amber-600 font-semibold">Photo</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div><span className="text-muted-foreground">Qty:</span> {item.quantity}{item.unit}</div>
              <div><span className="text-muted-foreground">Par:</span> {item.par_level || "—"}</div>
              <div><span className="text-muted-foreground">Due:</span> {item.due_time || "—"}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(item)} className="flex-1">Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => handleDuplicate(item)}><Copy className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No templates found for selected filters.
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Item Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Mirepoix, Burger Patties"
                />
              </div>
              <div>
                <Label>Station *</Label>
                <Select value={form.station_id} onValueChange={(v) => setForm({ ...form, station_id: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Day of Week</Label>
                <Select value={form.day_of_week} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Every Day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Every Day</SelectItem>
                    {daysOfWeek.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g., 5"
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="e.g., lbs, gallons"
                />
              </div>
              <div>
                <Label>Par Level</Label>
                <Input
                  value={form.par_level}
                  onChange={(e) => setForm({ ...form, par_level: e.target.value })}
                  placeholder="Safety stock level"
                />
              </div>
              <div>
                <Label>Due Time</Label>
                <Input
                  type="time"
                  value={form.due_time}
                  onChange={(e) => setForm({ ...form, due_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Recipe Link</Label>
              <Input
                value={form.recipe_link}
                onChange={(e) => setForm({ ...form, recipe_link: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Special instructions..."
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, requires_photo: !form.requires_photo })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.requires_photo ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${form.requires_photo ? "translate-x-[18px]" : "translate-x-1"}`} />
              </button>
              <Label className="cursor-pointer">Requires Photo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}