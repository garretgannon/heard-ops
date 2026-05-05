import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, GripVertical, ChevronLeft, Save, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TEMPLATE_CATEGORIES = [
  { id: "opening", label: "Opening Checklist" },
  { id: "closing", label: "Closing Checklist" },
  { id: "prep", label: "Prep Checklist" },
  { id: "cleaning", label: "Cleaning Checklist" },
  { id: "side_work", label: "Side Work" },
  { id: "temp_check", label: "Temp Check Routine" },
];

const DEPARTMENTS = ["FOH", "BOH", "Bar", "Kitchen", "All"];

export default function TemplateBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [template, setTemplate] = useState({
    name: "", category: "opening", department: "All", assigned_role: "",
    due_time: "06:00", repeat: "daily", photo_required: false,
    manager_signoff_required: false, auto_carryover: true, tasks: []
  });
  const [tasks, setTasks] = useState([]);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({ name: "", description: "", standard_notes: "", photo_required: false });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id && id !== "new") {
      base44.entities.Template.get(id).then(t => {
        setTemplate(t);
        setTasks(t.tasks || []);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleAddTask = () => {
    if (!newTask.name.trim()) {
      toast.error("Task name required");
      return;
    }
    const task = {
      id: `task_${Date.now()}`,
      ...newTask,
      sort_order: tasks.length
    };
    setTasks([...tasks, task]);
    setNewTask({ name: "", description: "", standard_notes: "", photo_required: false });
    setShowTaskDialog(false);
    toast.success("Task added");
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleSave = async () => {
    if (!template.name.trim()) {
      toast.error("Template name required");
      return;
    }
    setSaving(true);
    const data = { ...template, tasks };
    try {
      if (id && id !== "new") {
        await base44.entities.Template.update(id, data);
        toast.success("Template saved");
      } else {
        const created = await base44.entities.Template.create(data);
        toast.success("Template created");
        navigate(`/templates/${created.id}`);
      }
    } catch (err) {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div className="pb-28" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate("/templates")} className="p-2 hover:bg-card rounded-lg transition-colors active:scale-95">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Build Template</h1>
          <p className="text-xs text-muted-foreground">Create recurring checklists</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="p-2 hover:bg-card rounded-lg transition-colors active:scale-95">
          <Save className={cn("h-5 w-5", saving ? "animate-spin text-muted-foreground" : "text-primary")} />
        </button>
      </div>

      {/* Form */}
      <div className="px-4 py-4 space-y-4">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-xl p-3 space-y-3">
          <div>
            <Label>Template Name</Label>
            <Input
              value={template.name}
              onChange={e => setTemplate({ ...template, name: e.target.value })}
              placeholder="e.g., Morning Opening"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type</Label>
              <select
                value={template.category}
                onChange={e => setTemplate({ ...template, category: e.target.value })}
                className="w-full h-9 px-3 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {TEMPLATE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Department</Label>
              <select
                value={template.department}
                onChange={e => setTemplate({ ...template, department: e.target.value })}
                className="w-full h-9 px-3 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Assigned Role</Label>
              <Input
                value={template.assigned_role}
                onChange={e => setTemplate({ ...template, assigned_role: e.target.value })}
                placeholder="e.g., Manager"
              />
            </div>
            <div>
              <Label>Due Time</Label>
              <Input
                type="time"
                value={template.due_time}
                onChange={e => setTemplate({ ...template, due_time: e.target.value })}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            {[
              { key: "photo_required", label: "Require Photo" },
              { key: "manager_signoff_required", label: "Require Manager Sign-off" },
              { key: "auto_carryover", label: "Auto-carryover to next day" },
            ].map(tog => (
              <label key={tog.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template[tog.key]}
                  onChange={e => setTemplate({ ...template, [tog.key]: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-xs font-semibold text-foreground">{tog.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-foreground">Tasks ({tasks.length})</p>
            <button
              onClick={() => setShowTaskDialog(true)}
              className="px-2 py-1 text-xs font-bold rounded-lg bg-primary text-primary-foreground active:scale-95 transition-transform"
            >
              + Add Task
            </button>
          </div>

          <div className="space-y-2">
            {tasks.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-lg p-2.5 flex items-start gap-2"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{task.name}</p>
                  {task.description && <p className="text-[11px] text-muted-foreground mt-0.5">{task.description}</p>}
                  {task.standard_notes && <p className="text-[10px] text-amber-400/80 mt-1">📋 Has standard notes</p>}
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors active:scale-95 flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </motion.div>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-8 bg-card border border-dashed border-border rounded-lg">
              <p className="text-xs text-muted-foreground">No tasks yet. Add one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 max-h-96 overflow-y-auto">
            <div>
              <Label>Task Name</Label>
              <Input
                value={newTask.name}
                onChange={e => setNewTask({ ...newTask, name: e.target.value })}
                placeholder="e.g., Check temperature logs"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Optional brief description"
                rows={2}
              />
            </div>
            <div>
              <Label>Standard / Instructions</Label>
              <Textarea
                value={newTask.standard_notes}
                onChange={e => setNewTask({ ...newTask, standard_notes: e.target.value })}
                placeholder="Detailed steps, safety notes, or standards..."
                rows={3}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newTask.photo_required}
                onChange={e => setNewTask({ ...newTask, photo_required: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold text-foreground">Require photo</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTask}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Button */}
      <div className="fixed left-0 right-0 bottom-20 z-30 px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <Button onClick={handleSave} disabled={saving} className="w-full h-11">
          {saving ? "Saving..." : "Save Template"}
        </Button>
      </div>
    </motion.div>
  );
}

export const hideBase44Index = true;