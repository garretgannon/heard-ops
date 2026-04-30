import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  Plus, X, Search, Edit2, ChevronRight, BookOpen, Award, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DEPARTMENTS = ["FOH", "BOH", "Bar", "Management"];

export default function JobCodes() {
  const { isAdmin } = useCurrentUser();
  const [jobCodes, setJobCodes] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    department: "FOH",
    main_duties: "",
    opening_expectations: "",
    running_expectations: "",
    closing_expectations: "",
    required_training: [],
    uniform_standards: "",
    pay_code: "",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      const codes = await base44.entities.JobCode.list("-created_date");
      setJobCodes(codes);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = jobCodes.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.department.toLowerCase().includes(search.toLowerCase())
  );

  const selected = jobCodes.find(j => j.id === selectedId);

  const handleEdit = (jobCode) => {
    setFormData({
      title: jobCode.title || "",
      department: jobCode.department || "FOH",
      main_duties: jobCode.main_duties || "",
      opening_expectations: jobCode.opening_expectations || "",
      running_expectations: jobCode.running_expectations || "",
      closing_expectations: jobCode.closing_expectations || "",
      required_training: jobCode.required_training || [],
      uniform_standards: jobCode.uniform_standards || "",
      pay_code: jobCode.pay_code || "",
      notes: jobCode.notes || "",
    });
    setSelectedId(jobCode.id);
    setIsEditing(true);
  };

  const handleNewCode = () => {
    setFormData({
      title: "",
      department: "FOH",
      main_duties: "",
      opening_expectations: "",
      running_expectations: "",
      closing_expectations: "",
      required_training: [],
      uniform_standards: "",
      pay_code: "",
      notes: "",
    });
    setSelectedId(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { toast.error("Job title required"); return; }

    setSaving(true);
    try {
      if (selectedId) {
        await base44.entities.JobCode.update(selectedId, formData);
        toast.success("Job code updated");
      } else {
        await base44.entities.JobCode.create(formData);
        toast.success("Job code created");
      }
      const updated = await base44.entities.JobCode.list("-created_date");
      setJobCodes(updated);
      setIsEditing(false);
      setSelectedId(null);
    } catch (e) {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job code?")) return;
    await base44.entities.JobCode.delete(id);
    setJobCodes(jobCodes.filter(j => j.id !== id));
    setSelectedId(null);
    toast.success("Deleted");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* List */}
      <motion.div
        className="lg:col-span-1 space-y-4"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" /> Job Codes
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Role descriptions</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* New Button */}
        {isAdmin && (
          <Button onClick={handleNewCode} className="w-full gap-2" variant="outline">
            <Plus className="h-4 w-4" /> New Job Code
          </Button>
        )}

        {/* Cards List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No job codes found
            </div>
          ) : (
            filtered.map(code => (
              <button
                key={code.id}
                onClick={() => { setSelectedId(code.id); setIsEditing(false); }}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  selectedId === code.id
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border hover:bg-secondary/50"
                )}
              >
                <p className="font-semibold text-sm">{code.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{code.department}</p>
                <ChevronRight className="h-3.5 w-3.5 absolute right-3 top-1/2 -translate-y-1/2" />
              </button>
            ))
          )}
        </div>
      </motion.div>

      {/* Detail / Edit */}
      <motion.div
        className="lg:col-span-2"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isEditing ? (
          <div className="bg-card border border-border rounded-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selectedId ? "Edit Job Code" : "Create Job Code"}
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5">Job Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Server, Line Cook"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5">Department</label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5">Main Duties</label>
                <textarea
                  placeholder="Describe main responsibilities..."
                  value={formData.main_duties}
                  onChange={e => setFormData({ ...formData, main_duties: e.target.value })}
                  className="w-full h-20 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5">Opening Expectations</label>
                <textarea
                  placeholder="What should they do at shift start..."
                  value={formData.opening_expectations}
                  onChange={e => setFormData({ ...formData, opening_expectations: e.target.value })}
                  className="w-full h-20 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5">Running Expectations</label>
                <textarea
                  placeholder="During service..."
                  value={formData.running_expectations}
                  onChange={e => setFormData({ ...formData, running_expectations: e.target.value })}
                  className="w-full h-20 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5">Closing Expectations</label>
                <textarea
                  placeholder="End of shift..."
                  value={formData.closing_expectations}
                  onChange={e => setFormData({ ...formData, closing_expectations: e.target.value })}
                  className="w-full h-20 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5">Uniform Standards</label>
                <textarea
                  placeholder="Appearance, dress code, etc..."
                  value={formData.uniform_standards}
                  onChange={e => setFormData({ ...formData, uniform_standards: e.target.value })}
                  className="w-full h-20 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5">Pay Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SC001"
                  value={formData.pay_code}
                  onChange={e => setFormData({ ...formData, pay_code: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5">Notes</label>
                <textarea
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full h-16 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : selected ? (
          <div className="bg-card border border-border rounded-lg p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selected.title}</h2>
                <p className="text-sm text-muted-foreground mt-1 capitalize">{selected.department}</p>
              </div>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => handleEdit(selected)} className="gap-2">
                  <Edit2 className="h-4 w-4" /> Edit
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="space-y-5 text-sm">
              {selected.main_duties && (
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-primary" /> Main Duties
                  </p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selected.main_duties}</p>
                </div>
              )}

              {selected.opening_expectations && (
                <div>
                  <p className="font-semibold text-foreground mb-2">Opening Expectations</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selected.opening_expectations}</p>
                </div>
              )}

              {selected.running_expectations && (
                <div>
                  <p className="font-semibold text-foreground mb-2">Running Shift Expectations</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selected.running_expectations}</p>
                </div>
              )}

              {selected.closing_expectations && (
                <div>
                  <p className="font-semibold text-foreground mb-2">Closing Expectations</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selected.closing_expectations}</p>
                </div>
              )}

              {selected.uniform_standards && (
                <div>
                  <p className="font-semibold text-foreground mb-2">Uniform and Appearance</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selected.uniform_standards}</p>
                </div>
              )}

              {selected.pay_code && (
                <div>
                  <p className="text-xs text-muted-foreground">Pay Code: <span className="font-mono font-semibold">{selected.pay_code}</span></p>
                </div>
              )}

              {selected.notes && (
                <div className="bg-primary/5 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-primary mb-1">Notes</p>
                  <p className="text-xs text-muted-foreground">{selected.notes}</p>
                </div>
              )}
            </div>

            {/* Delete Button */}
            {isAdmin && (
              <div className="pt-4 border-t border-border">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(selected.id)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" /> Delete
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center space-y-3">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Select a job code to view details</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export const hideBase44Index = true;