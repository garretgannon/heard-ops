import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, X, Edit2, Trash2, AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format } from "date-fns";

const INCIDENT_TYPES = [
  { value: "accident", label: "Accident" },
  { value: "injury", label: "Injury" },
  { value: "property_damage", label: "Property Damage" },
  { value: "food_safety", label: "Food Safety" },
  { value: "customer_complaint", label: "Customer Complaint" },
  { value: "staff_conflict", label: "Staff Conflict" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

const SEVERITY_COLORS = {
  low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  medium: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  critical: "bg-red-600/20 text-red-300 border-red-600/30",
};

const STATUS_COLORS = {
  open: "bg-blue-500/20 text-blue-400",
  investigating: "bg-purple-500/20 text-purple-400",
  resolved: "bg-green-500/20 text-green-400",
};

export default function IncidentReports() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    time: "",
    type: "",
    location: "",
    description: "",
    people_involved: "",
    severity: "medium",
    injuries: "",
    actions_taken: "",
    witness_names: "",
    follow_up_required: false,
    follow_up_date: "",
    status: "open",
    notes: "",
    affected_person_name: "",
    affected_person_email: "",
    affected_person_phone: "",
    affected_person_dob: "",
    affected_person_gender: "",
    affected_person_address: ""
  });

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.IncidentReport.list("-date", 100);
      setIncidents(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form.date || !form.type || !form.location || !form.description) {
      toast.error("Please fill in required fields");
      return;
    }
    setSaving(true);
    const user = await base44.auth.me();
    const payload = { ...form, reported_by: user?.full_name || user?.email };
    
    if (editingId) {
      const updated = await base44.entities.IncidentReport.update(editingId, payload);
      setIncidents(prev => prev.map(i => i.id === editingId ? updated : i));
      toast.success("Incident report updated");
    } else {
      const created = await base44.entities.IncidentReport.create(payload);
      setIncidents(prev => [created, ...prev]);
      toast.success("Incident report filed");
    }
    setSaving(false);
    setShowForm(false);
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      time: "",
      type: "",
      location: "",
      description: "",
      people_involved: "",
      severity: "medium",
      injuries: "",
      actions_taken: "",
      witness_names: "",
      follow_up_required: false,
      follow_up_date: "",
      status: "open",
      notes: ""
    });
    setEditingId(null);
  };

  const handleEmailForm = async (id) => {
    const incident = incidents.find(i => i.id === id);
    if (!incident?.affected_person_email) {
      toast.error("No email address on file");
      return;
    }
    const body = `
Incident Report Summary

Incident Type: ${incident.type}
Date: ${incident.date} ${incident.time || ""}
Location: ${incident.location}
Severity: ${incident.severity}

Description:
${incident.description}

Affected Person:
Name: ${incident.affected_person_name || "N/A"}
Phone: ${incident.affected_person_phone || "N/A"}
DOB: ${incident.affected_person_dob || "N/A"}
Gender: ${incident.affected_person_gender || "N/A"}
Address: ${incident.affected_person_address || "N/A"}

Injuries: ${incident.injuries || "None reported"}
Actions Taken: ${incident.actions_taken || "N/A"}
Status: ${incident.status}
    `.trim();
    await base44.integrations.Core.SendEmail({
      to: incident.affected_person_email,
      subject: `Incident Report - ${incident.date}`,
      body
    });
    toast.success("Report emailed");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this incident report?")) return;
    await base44.entities.IncidentReport.delete(id);
    setIncidents(prev => prev.filter(i => i.id !== id));
    toast.success("Report deleted");
  };

  const openEdit = (incident) => {
    setForm(incident);
    setEditingId(incident.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      time: "",
      type: "",
      location: "",
      description: "",
      people_involved: "",
      severity: "medium",
      injuries: "",
      actions_taken: "",
      witness_names: "",
      follow_up_required: false,
      follow_up_date: "",
      status: "open",
      notes: "",
      affected_person_name: "",
      affected_person_email: "",
      affected_person_phone: "",
      affected_person_dob: "",
      affected_person_gender: "",
      affected_person_address: ""
    });
    setEditingId(null);
    setShowForm(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const criticalCount = incidents.filter(i => i.severity === "critical").length;
  const openCount = incidents.filter(i => i.status === "open" || i.status === "investigating").length;

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-primary" /> Incident Reports
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Document and track workplace incidents</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> File Report
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Critical Incidents</p>
          <p className="text-3xl font-bold text-red-500">{criticalCount}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Open / Investigating</p>
          <p className="text-3xl font-bold text-orange-500">{openCount}</p>
        </div>
      </div>

      {/* Reports list */}
      {incidents.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground mb-4">No incident reports yet</p>
          <Button onClick={openNew} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> File First Report
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map(incident => {
            const typeInfo = INCIDENT_TYPES.find(t => t.value === incident.type);
            return (
              <div key={incident.id} className={`bg-card border rounded-2xl p-4 ${SEVERITY_COLORS[incident.severity] || "border-border"}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{typeInfo?.label}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[incident.status]}`}>{incident.status}</span>
                    </div>
                    <p className="text-sm">{incident.location} · {incident.date} {incident.time && `@ ${incident.time}`}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(incident)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEmailForm(incident.id)} title="Email report">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(incident.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm mb-3">{incident.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs opacity-80">
                  {incident.people_involved && <p><strong>People:</strong> {incident.people_involved}</p>}
                  {incident.injuries && <p className="col-span-2"><strong>Injuries:</strong> {incident.injuries}</p>}
                  {incident.actions_taken && <p className="col-span-2"><strong>Actions:</strong> {incident.actions_taken}</p>}
                  {incident.reported_by && <p><strong>Reported by:</strong> {incident.reported_by}</p>}
                </div>

                {incident.follow_up_required && incident.follow_up_date && (
                  <div className="mt-2 pt-2 border-t border-current/20 text-xs opacity-80">
                    Follow-up: {incident.follow_up_date}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Incident Report" : "File Incident Report"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {form.date ? format(new Date(form.date + "T00:00:00"), "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.date ? new Date(form.date + "T00:00:00") : undefined}
                      onSelect={date => setForm(f => ({ ...f, date: format(date, "yyyy-MM-dd") }))}
                      disabled={date => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Incident Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Location *</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Where did the incident occur?" />
            </div>

            <div className="space-y-1">
              <Label>Description *</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Detailed description of what happened..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>People Involved</Label>
                <Input value={form.people_involved} onChange={e => setForm(f => ({ ...f, people_involved: e.target.value }))} placeholder="Names or emails" />
              </div>
              <div className="space-y-1">
                <Label>Witness Names</Label>
                <Input value={form.witness_names} onChange={e => setForm(f => ({ ...f, witness_names: e.target.value }))} placeholder="Witnesses" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Injuries (if any)</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Describe any injuries..."
                value={form.injuries}
                onChange={e => setForm(f => ({ ...f, injuries: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Actions Taken</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="What actions were taken immediately..."
                value={form.actions_taken}
                onChange={e => setForm(f => ({ ...f, actions_taken: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Follow-Up Required?</Label>
                <Select value={form.follow_up_required ? "yes" : "no"} onValueChange={v => setForm(f => ({ ...f, follow_up_required: v === "yes" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.follow_up_required && (
              <div className="space-y-1">
                <Label>Follow-Up Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {form.follow_up_date ? format(new Date(form.follow_up_date + "T00:00:00"), "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.follow_up_date ? new Date(form.follow_up_date + "T00:00:00") : undefined}
                      onSelect={date => setForm(f => ({ ...f, follow_up_date: format(date, "yyyy-MM-dd") }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-sm mb-3">Affected Person Info</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={form.affected_person_name} onChange={e => setForm(f => ({ ...f, affected_person_name: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={form.affected_person_email} onChange={e => setForm(f => ({ ...f, affected_person_email: e.target.value }))} placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.affected_person_phone} onChange={e => setForm(f => ({ ...f, affected_person_phone: e.target.value }))} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-1">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.affected_person_dob} onChange={e => setForm(f => ({ ...f, affected_person_dob: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label>Gender</Label>
                  <Select value={form.affected_person_gender} onValueChange={v => setForm(f => ({ ...f, affected_person_gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer Not to Say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Address</Label>
                  <Input value={form.affected_person_address} onChange={e => setForm(f => ({ ...f, affected_person_address: e.target.value }))} placeholder="Street address" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Additional Notes</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Any additional notes..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving…" : (editingId ? "Update" : "File")} Report
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}