import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Search, Plus, ChevronRight, Book, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Standards() {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showStandardDialog, setShowStandardDialog] = useState(false);
  const [newStandard, setNewStandard] = useState({ task_id: "", instructions: "" });

  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.Template.list().catch(() => []);
      setTemplates(all.filter(t => t.is_active !== false));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return templates;
    return templates.filter(t => 
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
    );
  }, [templates, search]);

  const categoryLabel = (cat) => {
    const map = {
      opening: "Opening", closing: "Closing", prep: "Prep",
      cleaning: "Cleaning", side_work: "Side Work", temp_check: "Temp Check"
    };
    return map[cat] || cat;
  };

  const handleAddStandard = async () => {
    if (!newStandard.task_id || !newStandard.instructions.trim()) {
      toast.error("Fill all fields");
      return;
    }

    if (selectedTemplate) {
      const updated = {
        ...selectedTemplate,
        tasks: selectedTemplate.tasks.map(t => 
          t.id === newStandard.task_id
            ? { ...t, standard_notes: newStandard.instructions }
            : t
        )
      };
      await base44.entities.Template.update(selectedTemplate.id, updated);
      setSelectedTemplate(updated);
      setTemplates(templates.map(t => t.id === selectedTemplate.id ? updated : t));
      toast.success("Standard added");
      setShowStandardDialog(false);
      setNewStandard({ task_id: "", instructions: "" });
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div className="pb-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">Standards and Instructions</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Attach detailed standards to template tasks</p>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Info Alert */}
      <div className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2">
        <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300">Add standards to template tasks. They will appear in daily checklists.</p>
      </div>

      {/* Templates List */}
      <div className="px-4 py-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Book className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-xs">No templates found</p>
          </div>
        ) : (
          filtered.map(template => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedTemplate(template)}
              className="w-full text-left bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-all active:scale-[0.98]"
            >
              <div className="flex items-start gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {template.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{template.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {categoryLabel(template.category)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{template.tasks?.length || 0} tasks</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Template Detail Dialog */}
      {selectedTemplate && (
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{selectedTemplate.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2 max-h-96 overflow-y-auto">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Tasks with Standards</p>
                {selectedTemplate.tasks?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tasks</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedTemplate.tasks.map(task => (
                      <div key={task.id} className="bg-muted/30 rounded border border-border p-2">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-xs font-bold text-foreground flex-1">{task.name}</p>
                          <button
                            onClick={() => {
                              setNewStandard({ task_id: task.id, instructions: task.standard_notes || "" });
                              setShowStandardDialog(true);
                            }}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            {task.standard_notes ? "Edit" : "Add"}
                          </button>
                        </div>
                        {task.standard_notes && (
                          <p className="text-[10px] text-muted-foreground leading-tight">{task.standard_notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Standard Dialog */}
      <Dialog open={showStandardDialog} onOpenChange={setShowStandardDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Standard Instructions</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label>Instructions or Procedure</Label>
              <Textarea
                value={newStandard.instructions}
                onChange={e => setNewStandard({ ...newStandard, instructions: e.target.value })}
                placeholder="Detailed steps, safety notes, quality standards…"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStandardDialog(false)}>Cancel</Button>
            <Button onClick={handleAddStandard}>Save Standard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export const hideBase44Index = true;