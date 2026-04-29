import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Plus, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function JobCodes() {
  const [jobCodes, setJobCodes] = useState([]);
  const [settingId, setSettingId] = useState(null);
  const [newCode, setNewCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Settings.filter({ key: "custom_roles" }).then(settings => {
      if (settings.length > 0) {
        setSettingId(settings[0].id);
        setJobCodes(JSON.parse(settings[0].value || "[]"));
      }
      setLoading(false);
    });
  }, []);

  const save = async (updated) => {
    const val = JSON.stringify(updated);
    if (settingId) {
      await base44.entities.Settings.update(settingId, { value: val });
    } else {
      const rec = await base44.entities.Settings.create({ key: "custom_roles", value: val });
      setSettingId(rec.id);
    }
  };

  const addCode = async () => {
    const label = newCode.trim();
    if (!label) return;
    const value = label.toLowerCase().replace(/\s+/g, "_");
    if (jobCodes.some(r => r.value === value)) { toast.error("Job code already exists"); return; }
    const updated = [...jobCodes, { value, label }];
    setJobCodes(updated);
    await save(updated);
    setNewCode("");
    toast.success("Job code added");
  };

  const removeCode = async (value) => {
    const updated = jobCodes.filter(r => r.value !== value);
    setJobCodes(updated);
    await save(updated);
    toast.success("Job code removed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 max-w-2xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Job Codes</h1>
        <p className="text-muted-foreground mt-1">Define the job roles for your restaurant. These are used when assigning staff.</p>
      </div>

      {/* Add new */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold">Add Job Code</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Line Cook, Prep Cook, Expo…"
            value={newCode}
            onChange={e => setNewCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCode()}
            className="flex-1 h-10 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button onClick={addCode} disabled={!newCode.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">All Job Codes ({jobCodes.length})</h2>
        </div>
        {jobCodes.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Tag className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No job codes yet. Add your first one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {jobCodes.map(code => (
              <div key={code.value} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{code.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{code.value}</p>
                </div>
                <button
                  onClick={() => removeCode(code.value)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}