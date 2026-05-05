import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Copy, Save, Camera, Clock, RefreshCw, ChevronRight, Layers, CheckSquare, ClipboardList, Flame, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "prep", label: "Prep", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { value: "cleaning", label: "Cleaning", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { value: "side_work", label: "Side Work", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { value: "opening", label: "Opening", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { value: "closing", label: "Closing", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
];

const catMeta = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[0];

const REPEATS = ["daily", "weekly", "custom"];

const emptyTemplate = () => ({
  name: "",
  category: "prep",
  assigned_role: "",
  due_time: "",
  repeat: "daily",
  photo_required: false,
  is_active: true,
  tasks: [],
});

const emptyTask = () => ({
  id: crypto.randomUUID(),
  name: "",
  station: "",
  role: "",
  due_time: "",
  photo_required: false,
});

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0",
        value ? "bg-primary" : "bg-[#1E2A3B]"
      )}
    >
      <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", value && "translate-x-4")} />
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#1A2235]">
      <span className="text-[11px] text-gray-500 font-semibold w-28 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, className }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("w-full bg-transparent text-[13px] text-white outline-none placeholder:text-gray-600", className)}
    />
  );
}

function TaskRow({ task, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-[#0B1018] border border-[#1A2235] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="h-1.5 w-1.5 rounded-full bg-gray-600 shrink-0" />
        <span
          className="flex-1 text-[13px] text-white font-medium truncate cursor-pointer"
          onClick={() => setExpanded(e => !e)}
        >
          {task.name || <span className="text-gray-600 font-normal">Untitled task</span>}
        </span>
        {task.photo_required && <Camera className="h-3 w-3 text-amber-400 shrink-0" />}
        <button onClick={() => setExpanded(e => !e)} className="text-gray-600 hover:text-gray-400 px-1">
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
        </button>
        <button onClick={onDelete} className="text-gray-700 hover:text-red-400 px-1">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-[#1A2235] pt-2">
          <input
            value={task.name}
            onChange={e => onUpdate({ ...task, name: e.target.value })}
            placeholder="Task name"
            className="w-full bg-[#0F1623] border border-[#1E2A3B] rounded-lg px-3 py-1.5 text-[12px] text-white outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={task.station}
              onChange={e => onUpdate({ ...task, station: e.target.value })}
              placeholder="Station / area"
              className="bg-[#0F1623] border border-[#1E2A3B] rounded-lg px-3 py-1.5 text-[12px] text-white outline-none"
            />
            <input
              value={task.role}
              onChange={e => onUpdate({ ...task, role: e.target.value })}
              placeholder="Role"
              className="bg-[#0F1623] border border-[#1E2A3B] rounded-lg px-3 py-1.5 text-[12px] text-white outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={task.due_time}
              onChange={e => onUpdate({ ...task, due_time: e.target.value })}
              className="bg-[#0F1623] border border-[#1E2A3B] rounded-lg px-3 py-1.5 text-[12px] text-white outline-none flex-1"
            />
            <div className="flex items-center gap-2">
              <Camera className="h-3.5 w-3.5 text-gray-500" />
              <Toggle value={task.photo_required} onChange={v => onUpdate({ ...task, photo_required: v })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplateBuilder() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null); // full template object being edited
  const [saving, setSaving] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    const data = await base44.entities.Template.list("-updated_date", 100);
    setTemplates(data);
  }

  function selectTemplate(t) {
    setSelected(JSON.parse(JSON.stringify(t)));
    setNewTaskName("");
  }

  function newTemplate() {
    setSelected(emptyTemplate());
    setNewTaskName("");
  }

  async function saveTemplate() {
    if (!selected.name.trim()) return;
    setSaving(true);
    if (selected.id) {
      const updated = await base44.entities.Template.update(selected.id, selected);
      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSelected(updated);
    } else {
      const created = await base44.entities.Template.create(selected);
      setTemplates(prev => [created, ...prev]);
      setSelected(created);
    }
    setSaving(false);
  }

  async function duplicateTemplate() {
    if (!selected) return;
    const copy = { ...selected, name: selected.name + " (Copy)", id: undefined };
    delete copy.id;
    const created = await base44.entities.Template.create(copy);
    setTemplates(prev => [created, ...prev]);
    setSelected(created);
  }

  async function deleteTemplate(id) {
    await base44.entities.Template.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function addTask() {
    if (!newTaskName.trim()) return;
    const task = { ...emptyTask(), name: newTaskName.trim() };
    setSelected(s => ({ ...s, tasks: [...(s.tasks || []), task] }));
    setNewTaskName("");
  }

  function updateTask(taskId, updated) {
    setSelected(s => ({ ...s, tasks: s.tasks.map(t => t.id === taskId ? updated : t) }));
  }

  function deleteTask(taskId) {
    setSelected(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== taskId) }));
  }

  // metrics
  const active = templates.filter(t => t.is_active).length;
  const photoPct = templates.length
    ? Math.round((templates.filter(t => t.photo_required).length / templates.length) * 100)
    : 0;
  const today = new Date().toDateString();
  const recentlyUpdated = templates.filter(t => new Date(t.updated_date).toDateString() === today).length;

  const filtered = filterCat === "all" ? templates : templates.filter(t => t.category === filterCat);

  return (
    <div className="min-h-screen bg-[#080C14] text-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1A2235]">
        <h1 className="text-[18px] font-extrabold tracking-tight">Templates</h1>
        <p className="text-[11px] text-gray-500 mt-0.5">Build and manage operational workflows</p>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { label: "Active", value: active },
            { label: "Assigned Today", value: templates.length },
            { label: "Photo Req", value: `${photoPct}%` },
            { label: "Updated Today", value: recentlyUpdated },
          ].map(m => (
            <div key={m.label} className="bg-[#0F1623] border border-[#1A2235] rounded-xl p-2 text-center">
              <div className="text-[18px] font-extrabold text-white leading-none">{m.value}</div>
              <div className="text-[9px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex h-[calc(100vh-180px)]">

        {/* LEFT — Template List */}
        <div className="w-56 shrink-0 border-r border-[#1A2235] flex flex-col">
          {/* Category filter */}
          <div className="px-2 pt-2 pb-1 flex flex-wrap gap-1">
            <button
              onClick={() => setFilterCat("all")}
              className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors",
                filterCat === "all" ? "bg-primary text-primary-foreground border-primary" : "border-[#1E2A3B] text-gray-500")}
            >All</button>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setFilterCat(c.value)}
                className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors",
                  filterCat === c.value ? "bg-primary text-primary-foreground border-primary" : "border-[#1E2A3B] text-gray-500")}
              >{c.label}</button>
            ))}
          </div>

          {/* New template button */}
          <button
            onClick={newTemplate}
            className="mx-2 mb-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[12px] font-bold hover:bg-primary/15 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> New Template
          </button>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
            {filtered.length === 0 && (
              <p className="text-[11px] text-gray-600 text-center mt-6">No templates yet</p>
            )}
            {filtered.map(t => {
              const meta = catMeta(t.category);
              const isActive = selected?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl border transition-all",
                    isActive
                      ? "bg-[#0F1E35] border-primary/30"
                      : "bg-[#0B1018] border-[#1A2235] hover:border-[#2A3A50]"
                  )}
                >
                  <div className="text-[12px] font-bold text-white truncate">{t.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("text-[10px] font-semibold", meta.color)}>{meta.label}</span>
                    {t.tasks?.length > 0 && (
                      <span className="text-[10px] text-gray-600">· {t.tasks.length} tasks</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Builder */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <Layers className="h-10 w-10 text-gray-700 mb-3" />
              <p className="text-[14px] font-bold text-gray-500">Select or create a template</p>
              <p className="text-[11px] text-gray-700 mt-1">Build checklists and workflows in seconds</p>
              <button onClick={newTemplate} className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold">
                + New Template
              </button>
            </div>
          ) : (
            <div className="px-4 pt-3 pb-24 space-y-4">

              {/* Section 1: Settings */}
              <div className="bg-[#0F1623] border border-[#1A2235] rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-[#1A2235]">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Template Settings</span>
                </div>
                <div className="px-3">
                  <Field label="Name">
                    <TextInput
                      value={selected.name}
                      onChange={v => setSelected(s => ({ ...s, name: v }))}
                      placeholder="Template name"
                      className="text-[14px] font-bold"
                    />
                  </Field>
                  <Field label="Category">
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setSelected(s => ({ ...s, category: c.value }))}
                          className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors",
                            selected.category === c.value ? `${c.bg} ${c.color}` : "border-[#1E2A3B] text-gray-600")}
                        >{c.label}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Assigned Role">
                    <TextInput
                      value={selected.assigned_role}
                      onChange={v => setSelected(s => ({ ...s, assigned_role: v }))}
                      placeholder="e.g. Line Cook, Server"
                    />
                  </Field>
                  <Field label="Due Time">
                    <input
                      type="time"
                      value={selected.due_time}
                      onChange={e => setSelected(s => ({ ...s, due_time: e.target.value }))}
                      className="bg-transparent text-[13px] text-white outline-none"
                    />
                  </Field>
                  <Field label="Repeat">
                    <div className="flex gap-1.5">
                      {REPEATS.map(r => (
                        <button
                          key={r}
                          onClick={() => setSelected(s => ({ ...s, repeat: r }))}
                          className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize transition-colors",
                            selected.repeat === r
                              ? "bg-primary/15 border-primary/30 text-primary"
                              : "border-[#1E2A3B] text-gray-600")}
                        >{r}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Photo Required">
                    <Toggle value={selected.photo_required} onChange={v => setSelected(s => ({ ...s, photo_required: v }))} />
                  </Field>
                </div>
              </div>

              {/* Section 2: Task List */}
              <div className="bg-[#0F1623] border border-[#1A2235] rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-[#1A2235] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Tasks</span>
                  <span className="text-[11px] text-gray-600">{selected.tasks?.length || 0} items</span>
                </div>
                <div className="p-3 space-y-2">
                  {(!selected.tasks || selected.tasks.length === 0) && (
                    <p className="text-[11px] text-gray-700 text-center py-3">No tasks yet — add one below</p>
                  )}
                  {selected.tasks?.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onUpdate={updated => updateTask(task.id, updated)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}

                  {/* Add Task */}
                  <div className="flex gap-2 pt-1">
                    <input
                      value={newTaskName}
                      onChange={e => setNewTaskName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addTask()}
                      placeholder="Add a task..."
                      className="flex-1 bg-[#0B1018] border border-[#1E2A3B] rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-primary/40 placeholder:text-gray-700"
                    />
                    <button
                      onClick={addTask}
                      className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center active:scale-95 transition-transform shrink-0"
                    >
                      <Plus className="h-4 w-4 text-primary-foreground" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-2">
                <button
                  onClick={duplicateTemplate}
                  disabled={!selected.id}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F1623] border border-[#1E2A3B] text-[13px] font-semibold text-gray-400 hover:text-white disabled:opacity-30 active:scale-95 transition-all"
                >
                  <Copy className="h-4 w-4" /> Duplicate
                </button>
                {selected.id && (
                  <button
                    onClick={() => deleteTemplate(selected.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F1623] border border-red-500/20 text-[13px] font-semibold text-red-500 hover:bg-red-500/10 active:scale-95 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={saveTemplate}
                  disabled={saving || !selected.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold disabled:opacity-50 active:scale-95 transition-all"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : "Save Template"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}