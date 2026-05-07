import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Plus, ChevronRight, Layers, Bell, CalendarDays, GripVertical, Eye, Copy, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const TYPE_CATEGORIES = [
  { value: "all", label: "All Templates", count: null },
  { value: "checklist", label: "Checklists" },
  { value: "task_list", label: "Task Lists" },
  { value: "log", label: "Logs" },
  { value: "temp_log", label: "Temperature Logs" },
  { value: "cleaning", label: "Cleaning Schedules" },
];

const MOBILE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "prep", label: "Prep" },
  { value: "cleaning", label: "Cleaning" },
  { value: "side_work", label: "Side Work" },
  { value: "opening", label: "Opening" },
  { value: "closing", label: "Closing" },
];

const catColor = (val) => {
  const map = { prep: "text-blue-400", cleaning: "text-emerald-400", side_work: "text-purple-400", opening: "text-amber-400", closing: "text-red-400" };
  return map[val] || "text-gray-400";
};

export default function TemplateList() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    base44.entities.Template.list("-updated_date", 100).then(data => {
      const active = data.filter(t => t.is_active !== false);
      setTemplates(active);
      setLoading(false);
      if (active.length > 0 && window.innerWidth >= 1024) setSelectedTemplate(active[0]);
    });
  }, []);

  const filtered = templates.filter(t => {
    if (filterCat !== "all" && t.category !== filterCat) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categoryCounts = TYPE_CATEGORIES.map(c => ({
    ...c,
    count: c.value === "all" ? templates.length : templates.filter(t => t.category === c.value || (c.value === "checklist" && !t.category)).length,
  }));

  const myTemplates = templates.filter(t => t.created_by);
  const sharedTemplates = templates.filter(t => !t.created_by);

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="pb-24 lg:pb-0 h-full lg:h-[calc(100vh-52px)] lg:flex lg:flex-col">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/30 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Templates</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Build and manage operational templates</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/templates/new")} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 active:scale-95">
            <Plus className="h-3.5 w-3.5" /> New Template
          </button>
          <button className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted active:scale-95">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Desktop 3-panel layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left: Categories */}
        <div className="w-48 border-r border-border/30 flex flex-col shrink-0">
          <div className="p-3 border-b border-border/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Template Categories</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {categoryCounts.map(cat => (
              <button key={cat.value} onClick={() => setFilterCat(cat.value)}
                className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all", filterCat === cat.value ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                <span>{cat.label}</span>
                <span className={cn("text-[10px] font-bold", filterCat === cat.value ? "text-white/70" : "text-muted-foreground")}>{cat.count || 0}</span>
              </button>
            ))}
            <div className="pt-2 border-t border-border/30 mt-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-1">My Templates</p>
              <button onClick={() => {}} className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/50">
                <span>My Templates</span><span className="text-[10px]">{myTemplates.length}</span>
              </button>
              <button onClick={() => {}} className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/50">
                <span>Shared With Me</span><span className="text-[10px]">{sharedTemplates.length}</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Middle: Template Library */}
        <div className="w-64 border-r border-border/30 flex flex-col shrink-0">
          <div className="p-3 border-b border-border/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Template Library</p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…" className="w-full h-7 pl-7 pr-2 bg-card border border-border rounded-lg text-[11px] text-foreground" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Layers className="h-6 w-6 opacity-40 mb-2" />
                <p className="text-xs">{search ? "No templates match" : "No templates yet"}</p>
              </div>
            ) : (
              filtered.map(template => (
                <button key={template.id} onClick={() => setSelectedTemplate(template)}
                  className={cn("w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left", selectedTemplate?.id === template.id ? "border-primary/40 bg-primary/10" : "border-border/50 bg-card hover:border-border")}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-foreground truncate">{template.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn("text-[9px] font-semibold capitalize", catColor(template.category))}>{template.category || "general"}</span>
                      {template.updated_date && <span className="text-[9px] text-muted-foreground">{formatDistanceToNow(new Date(template.updated_date), { addSuffix: false })} ago</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Template Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTemplate ? (
            <>
              <div className="px-5 py-4 border-b border-border/30 shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Template Editor</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">Template Name</label>
                    <input value={selectedTemplate.name} readOnly className="w-full h-8 px-3 bg-card border border-border rounded-lg text-xs text-foreground" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">Type</label>
                    <select className="w-full h-8 px-3 bg-card border border-border rounded-lg text-xs text-foreground">
                      <option>{selectedTemplate.category || "Checklist"}</option>
                    </select>
                  </div>
                </div>
                {selectedTemplate.description && (
                  <div className="mt-3">
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">Description</label>
                    <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Template Preview</p>
                {(selectedTemplate.tasks || []).length === 0 ? (
                  <div className="text-center py-8 bg-card border border-dashed border-border rounded-xl">
                    <p className="text-xs text-muted-foreground">No checklist items yet</p>
                    <button className="mt-2 text-[10px] font-bold text-primary hover:underline">+ Add Item</button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {(selectedTemplate.tasks || []).map((task, i) => (
                      <div key={i} className="flex items-center gap-2 bg-card border border-border/60 rounded-lg px-3 py-2.5">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 cursor-grab" />
                        <input type="checkbox" readOnly className="rounded border-border shrink-0" />
                        <span className="text-xs text-foreground flex-1">{task.name || task}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t border-border/30 flex gap-2 shrink-0">
                <button className="h-8 px-3 rounded-lg border border-border bg-card text-xs font-bold text-foreground flex items-center gap-1.5 hover:bg-muted active:scale-95">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <button className="h-8 px-3 rounded-lg border border-border bg-card text-xs font-bold text-foreground flex items-center gap-1.5 hover:bg-muted active:scale-95">
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <button className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95">
                  <Save className="h-3.5 w-3.5" /> Save Template
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Select a template to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="px-4 pt-4 pb-3 border-b border-border sticky top-0 z-10 bg-background">
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-[16px] font-extrabold tracking-tight text-foreground flex-1">Templates</h1>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…" className="w-full h-9 pl-9 pr-3 text-sm bg-card border border-border rounded-lg text-foreground outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {MOBILE_CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setFilterCat(cat.value)} className={cn("shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all", filterCat === cat.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border")}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 pt-3 pb-4 space-y-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Layers className="h-8 w-8 opacity-40 mb-2" />
              <p className="text-sm">{search ? "No templates match your search" : "No templates yet"}</p>
            </div>
          ) : (
            filtered.map(template => (
              <button key={template.id} onClick={() => navigate(`/templates/${template.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:border-border/80 active:scale-95 transition-all">
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-bold text-foreground truncate">{template.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-[10px] font-semibold", catColor(template.category))}>{MOBILE_CATEGORIES.find(c => c.value === template.category)?.label || template.category}</span>
                    <span className="text-[10px] text-muted-foreground">{template.tasks?.length || 0} tasks</span>
                    {template.updated_date && <span className="text-[10px] text-muted-foreground">· {formatDistanceToNow(new Date(template.updated_date), { addSuffix: false })}</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))
          )}
        </div>
        <button onClick={() => navigate("/templates/new")} className="fixed right-4 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg active:scale-95 transition-transform z-40" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
          <Plus className="h-4 w-4" /> Create
        </button>
      </div>
    </div>
  );
}

export const hideBase44Index = true;