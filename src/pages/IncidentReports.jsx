import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Edit2, Trash2, AlertTriangle, Download, Lock, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "guest", label: "Guest Incident" },
  { value: "staff", label: "Staff Issue" },
  { value: "injury", label: "Injury" },
  { value: "security", label: "Security" },
  { value: "alcohol", label: "Alcohol Related" },
  { value: "property", label: "Property Damage" },
  { value: "hr", label: "HR / Discipline" },
  { value: "other", label: "Other" },
];

const emptyForm = {
  date: format(new Date(), "yyyy-MM-dd"),
  time: "",
  category: "",
  location: "",
  description: "",
  people_involved: "",
  witness_names: "",
  actions_taken: "",
  photo_url: "",
  file_url: "",
  follow_up_required: false,
  follow_up_date: "",
  sensitive: false,
  manager_signature: "",
};

export default function IncidentReports() {
  const [incidents, setIncidents] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const data = await base44.entities.IncidentReport.list("-created_date", 200);
      setIncidents(data);
      setLoading(false);
    };
    load();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, photo_url: file_url }));
      setPhotoPreview(URL.createObjectURL(file));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, file_url }));
      toast.success("File uploaded: " + file.name);
    } catch (err) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.date || !form.category || !form.location || !form.description) {
      toast.error("Fill required fields");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, reported_by: user?.full_name || user?.email };
      if (editingId) {
        const updated = await base44.entities.IncidentReport.update(editingId, payload);
        setIncidents(prev => prev.map(i => i.id === editingId ? updated : i));
        toast.success("Report updated");
      } else {
        const created = await base44.entities.IncidentReport.create(payload);
        setIncidents(prev => [created, ...prev]);
        toast.success("Report filed");
      }
      closeForm();
    } catch (err) {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const closeForm = () => {
    setShowForm(false);
    setStep(1);
    setForm(emptyForm);
    setEditingId(null);
    setPhotoPreview(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this report?")) return;
    try {
      await base44.entities.IncidentReport.delete(id);
      setIncidents(prev => prev.filter(i => i.id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleExportPDF = async (incident) => {
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `Create a formal incident report PDF with:\n\nCategory: ${incident.category}\nDate: ${incident.date}\nTime: ${incident.time}\nLocation: ${incident.location}\n\nDescription: ${incident.description}\n\nPeople Involved: ${incident.people_involved}\nWitnesses: ${incident.witness_names}\nActions Taken: ${incident.actions_taken}\n\nReported by: ${incident.reported_by}`,
      });
      window.open(url, "_blank");
    } catch (err) {
      toast.error("PDF generation failed");
    }
  };

  const openEdit = (incident) => {
    setForm(incident);
    setEditingId(incident.id);
    setStep(1);
    setShowForm(true);
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setStep(1);
    setPhotoPreview(null);
    setShowForm(true);
  };

  const isAdmin = user?.role === "admin";
  const visibleIncidents = isAdmin ? incidents : incidents.filter(i => !i.sensitive);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const criticalCount = incidents.filter(i => ["injury", "security"].includes(i.category)).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" /> Incident Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Document workplace incidents</p>
        </div>
        <Button onClick={openNew} size="lg">
          <Plus className="h-4 w-4 mr-2" /> New Incident
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Critical</p>
          <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{visibleIncidents.length}</p>
        </div>
      </div>

      {/* Reports */}
      {visibleIncidents.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground mb-4">No incidents yet</p>
          <Button onClick={openNew} variant="outline">
            <Plus className="h-4 w-4 mr-2" /> File Report
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleIncidents.map(incident => {
            const cat = CATEGORIES.find(c => c.value === incident.category);
            return (
              <div key={incident.id} className={cn("bg-card border rounded-xl p-4 space-y-3", incident.sensitive && !isAdmin ? "blur-sm opacity-50" : "")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {incident.sensitive && <Lock className="h-4 w-4 text-orange-600" />}
                      <h3 className="font-bold">{cat?.label}</h3>
                      {["injury", "security"].includes(incident.category) && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Critical</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{incident.location} • {incident.date} {incident.time && `@ ${incident.time}`}</p>
                    <p className="text-sm mt-2 line-clamp-2">{incident.description}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(incident)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleExportPDF(incident)} title="Export PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(incident.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {incident.people_involved && <div>People: <span className="font-semibold">{incident.people_involved}</span></div>}
                  {incident.witness_names && <div>Witnesses: <span className="font-semibold">{incident.witness_names}</span></div>}
                  {incident.reported_by && <div>Reported by: <span className="font-semibold">{incident.reported_by}</span></div>}
                  {incident.follow_up_required && <div className="col-span-2">Follow-up: <span className="font-semibold">{incident.follow_up_date}</span></div>}
                </div>

                {(incident.photo_url || incident.file_url) && (
                  <div className="flex gap-2 flex-wrap">
                    {incident.photo_url && (
                      <a href={incident.photo_url} target="_blank" rel="noopener noreferrer">
                        <img src={incident.photo_url} alt="Incident" className="h-14 w-20 object-cover rounded border border-border hover:opacity-80" />
                      </a>
                    )}
                    {incident.file_url && (
                      <a href={incident.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded hover:opacity-80">
                        📄 Attachment
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Wizard Dialog */}
      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Report" : "File Incident Report"}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Step {step} of 4</p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Step 1: Date & Category */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          {form.date ? format(new Date(form.date + "T00:00:00"), "MMM d") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar selected={form.date ? new Date(form.date + "T00:00:00") : undefined} onSelect={date => setForm(f => ({ ...f, date: format(date, "yyyy-MM-dd") }))} disabled={date => date > new Date()} mode="single" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Location *</Label>
                  <Input placeholder="Where did this happen?" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Step 2: Description & People */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Description *</Label>
                  <Textarea rows={4} placeholder="What happened..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <Label>People Involved</Label>
                  <Input placeholder="Names or emails" value={form.people_involved} onChange={e => setForm(f => ({ ...f, people_involved: e.target.value }))} />
                </div>
                <div>
                  <Label>Witnesses</Label>
                  <Input placeholder="Names or emails" value={form.witness_names} onChange={e => setForm(f => ({ ...f, witness_names: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Step 3: Actions & Media */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Actions Taken</Label>
                  <Textarea rows={3} placeholder="What was done..." value={form.actions_taken} onChange={e => setForm(f => ({ ...f, actions_taken: e.target.value }))} />
                </div>
                <div>
                  <Label>Photo</Label>
                  {photoPreview ? (
                    <div className="relative mt-1.5">
                      <img src={photoPreview} alt="Preview" className="w-full max-h-40 object-cover rounded border border-border" />
                      <button onClick={() => { setPhotoPreview(null); setForm(f => ({ ...f, photo_url: "" })); }} className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="mt-1.5 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50">
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{uploading ? "Uploading…" : "Add photo"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>
                <div>
                  <Label>Attachment (PDF, image, etc.)</Label>
                  {form.file_url ? (
                    <div className="mt-1.5 p-3 bg-green-500/10 rounded flex items-center justify-between">
                      <span className="text-xs text-green-600">✓ File attached</span>
                      <button onClick={() => setForm(f => ({ ...f, file_url: "" }))} className="text-xs text-destructive hover:underline">Remove</button>
                    </div>
                  ) : (
                    <label className="mt-1.5 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 cursor-pointer hover:border-primary/50">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{uploading ? "Uploading…" : "Upload file"}</span>
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Follow-up & Sensitivity */}
            {step === 4 && (
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-3 bg-secondary/40 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={form.follow_up_required} onChange={e => setForm(f => ({ ...f, follow_up_required: e.target.checked }))} />
                  <span className="text-sm font-semibold">Follow-up required</span>
                </label>
                {form.follow_up_required && (
                  <div>
                    <Label>Follow-up Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          {form.follow_up_date ? format(new Date(form.follow_up_date + "T00:00:00"), "MMM d, yyyy") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar selected={form.follow_up_date ? new Date(form.follow_up_date + "T00:00:00") : undefined} onSelect={date => setForm(f => ({ ...f, follow_up_date: format(date, "yyyy-MM-dd") }))} mode="single" />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                <label className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg cursor-pointer border border-orange-500/30">
                  <input type="checkbox" checked={form.sensitive} onChange={e => setForm(f => ({ ...f, sensitive: e.target.checked }))} />
                  <span className="text-sm font-semibold text-orange-600">Mark as sensitive (hidden from staff)</span>
                </label>
                <div>
                  <Label>Manager Signature</Label>
                  <Input placeholder="Your name" value={form.manager_signature} onChange={e => setForm(f => ({ ...f, manager_signature: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-4 border-t">
            {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} className="flex-1">Next</Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Saving…" : "File Report"}</Button>
            )}
            <Button variant="ghost" onClick={closeForm}><X className="h-4 w-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;