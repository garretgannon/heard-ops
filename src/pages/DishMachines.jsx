import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const CHEMICAL_TYPES = {
  rinse_aid: "Rinse Aid",
  detergent: "Detergent",
  sanitizer: "Sanitizer",
  descaler: "Descaler",
  other: "Other"
};

const STATUS_COLORS = {
  normal: "bg-green-50 border-green-200 text-green-900",
  low: "bg-yellow-50 border-yellow-200 text-yellow-900",
  critical: "bg-red-50 border-red-200 text-red-900"
};

export default function DishMachines() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    chemical_type: "sanitizer",
    reading: "",
    status: "normal",
    notes: "",
    photo_url: ""
  });
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const data = await base44.entities.ChemicalLog.list("-created_date", 100);
      setLogs(data);
      setLoading(false);
    };
    init();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, photo_url: file_url }));
    setUploadingPhoto(false);
    toast.success("Photo uploaded");
  };

  const handleSave = async () => {
    if (!form.reading || form.reading === "") {
      toast.error("Please enter a reading");
      return;
    }
    setSaving(true);
    await base44.entities.ChemicalLog.create({
      ...form,
      reading: parseFloat(form.reading),
      logged_by: user?.full_name || user?.email
    });
    setForm({
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      chemical_type: "sanitizer",
      reading: "",
      status: "normal",
      notes: "",
      photo_url: ""
    });
    setDialogOpen(false);
    setSaving(false);
    const data = await base44.entities.ChemicalLog.list("-created_date", 100);
    setLogs(data);
    toast.success("Chemical reading logged");
  };

  const handleDelete = async (id) => {
    await base44.entities.ChemicalLog.delete(id);
    setLogs(logs.filter(l => l.id !== id));
    toast.success("Log deleted");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dish Machine Chemicals</h1>
          <p className="text-muted-foreground mt-1">Log chemical readings throughout your shift</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Reading
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">No chemical readings logged yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className={`rounded-xl border p-4 ${STATUS_COLORS[log.status]}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{CHEMICAL_TYPES[log.chemical_type]}</h3>
                    {log.status === "critical" && <AlertCircle className="h-4 w-4" />}
                  </div>
                  <div className="text-sm space-y-1">
                    <p>{log.reading} ppm</p>
                    <p className="text-xs opacity-75">{log.date} at {log.time}</p>
                    {log.logged_by && <p className="text-xs opacity-75">Logged by {log.logged_by}</p>}
                    {log.notes && <p className="text-xs opacity-75 mt-1">{log.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {log.photo_url && (
                    <a href={log.photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={log.photo_url} alt="Chemical read" className="h-12 w-12 rounded-lg object-cover border border-current border-opacity-20" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-current opacity-60 hover:opacity-100"
                    onClick={() => handleDelete(log.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Chemical Reading</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Chemical Type</Label>
              <Select value={form.chemical_type} onValueChange={v => setForm({ ...form, chemical_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHEMICAL_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Reading (ppm)</Label>
                <Input type="number" step="0.1" placeholder="0.0" value={form.reading} onChange={e => setForm({ ...form, reading: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Photo (Test Strip)</Label>
              <label className="block">
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-accent transition-colors">
                  {form.photo_url ? (
                    <div>
                      <img src={form.photo_url} alt="Preview" className="h-20 w-20 rounded-lg object-cover mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Click to change photo</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium">Upload test strip photo</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              </label>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea placeholder="e.g., Machine running hot, need refill soon..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || uploadingPhoto || !form.reading}>
              {saving ? "Logging..." : "Log Reading"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}