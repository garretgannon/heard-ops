import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Copy, Save, Camera, ChevronLeft, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import TaskFormModal from "@/components/TaskFormModal";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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
    <div className="flex items-center gap-3 py-2.5 border-b border-[#1A2235]">
      <span className="text-[11px] text-gray-500 font-semibold w-24 shrink-0">{label}</span>
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
    <div className="bg-[#0B1018] border border-[#1A2235] rounded-lg overflow-hidden">
      {/* Compact view */}
      <div className="px-3 py-2 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[12px] font-bold text-white truncate flex-1">
            {task.name || <span className="text-gray-600 font-normal">Untitled</span>}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {task.photo_required && <Camera className="h-3 w-3 text-amber-400" />}
            <ChevronLeft className={cn("h-3 w-3 text-gray-600 transition-transform -rotate-90", expanded && "rotate-0")} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-gray-600">
          {task.station && <span>{task.station}</span>}
          {task.role && <span>· {task.role}</span>}
          {task.due_time && <span className="ml-auto">{task.due_time}</span>}
        </div>
      </div>

      {/* Expanded edit view */}
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
          <button onClick={onDelete} className="w-full py-2 text-[11px] font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            Delete Task
          </button>
        </div>
      )}
    </div>
  );
}

export default function TemplateBuilder() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [stats, setStats] = useState({});
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => { loadTemplates(); loadStats(); }, []);

  async function loadStats() {
    const today = new Date().toISOString().split('T')[0];
    const [prepItems, opening, closing, sideWork] = await Promise.all([
      base44.entities.PrepItem.filter({ source_template_id: { $exists: true } }),
      base44.entities.OpeningChecklist.filter({ date: today }),
      base44.entities.ClosingChecklist.filter({ date: today }),
      base44.entities.SideWorkAssignment.filter({ date: today }),
    ]);
    const all = [...prepItems, ...opening, ...closing, ...sideWork];
    const completed = all.filter(t => t.status === 'completed').length;
    const missed = all.filter(t => t.status === 'missed' || t.status === 'overdue').length;
    setStats({ total: all.length, completed, missed, rate: all.length ? Math.round((completed / all.length) * 100) : 0 });
  }

  async function pushNow() {
    if (!selected?.id) return;
    setPushing(true);
    setPushResult(null);
    const res = await base44.functions.invoke('generateTemplateTasks', { template_id: selected.id, date: new Date().toISOString().split('T')[0] });
    setPushResult(res.data);
    setPushing(false);
  }

  async function loadTemplates() {
    const data = await base44.entities.Template.list("-updated_date", 100);
    setTemplates(data);
  }

  function selectTemplate(t) {
    setSelected(JSON.parse(JSON.stringify(t)));
  }

  function newTemplate() {
    setSelected(emptyTemplate());
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
    selectTemplate(created);
  }

  async function deleteTemplate(id) {
    await base44.entities.Template.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function addTask(taskData) {
    setSelected(s => ({ ...s, tasks: [...(s.tasks || []), taskData] }));
    setShowTaskForm(false);
  }

  function updateTask(taskId, updated) {
    setSelected(s => ({ ...s, tasks: s.tasks.map(t => t.id === taskId ? updated : t) }));
  }

  function deleteTask(taskId) {
    setSelected(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== taskId) }));
  }

  function handleDragEnd(result) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.index === destination.index) return;
    
    const newTasks = Array.from(selected.tasks || []);
    const [removed] = newTasks.splice(source.index, 1);
    newTasks.splice(destination.index, 0, removed);
    setSelected(s => ({ ...s, tasks: newTasks }));
  }

  const active = templates.filter(t => t.is_active).length;
  const filtered = filterCat === "all" ? templates : templates.filter(t => t.category === filterCat);

  return (
    <div className="mx-auto w-full max-w-[480px] flex flex-col bg-[#080C14] text-white pb-24">
      {/* HEADER */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1A2235] sticky top-0 z-10 bg-[#080C14]">
        <div className="flex items-center gap-2">
          {selected && (
            <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center active:scale-95">
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-[16px] font-extrabold tracking-tight">{selected ? selected.name || "New Template" : "Templates"}</h1>
            <p className="text-[9px] text-gray-600">{selected ? "Edit template" : "Build workflows"}</p>
          </div>
        </div>

        {/* Metrics — list view only */}
        {!selected && (
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {[
              { label: "Active", value: active },
              { label: "Total", value: templates.length },
              { label: "Tasks", value: stats.total || 0 },
              { label: "Rate", value: `${stats.rate || 0}%` },
            ].map(m => (
              <div key={m.label} className="bg-[#0F1623] border border-[#1A2235] rounded-lg p-1.5 text-center">
                <div className="text-[14px] font-extrabold text-white leading-none">{m.value}</div>
                <div className="text-[8px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex flex-col">
            {/* Filter chips */}
            <div className="px-4 pt-3 pb-2 flex gap-1 overflow-x-auto">
              <button
                onClick={() => setFilterCat("all")}
                className={cn("shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all",
                  filterCat === "all" ? "bg-primary text-primary-foreground border-primary" : "border-[#1E2A3B] text-gray-500")}
              >All</button>
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setFilterCat(c.value)}
                  className={cn("shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all",
                    filterCat === c.value ? "bg-primary text-primary-foreground border-primary" : "border-[#1E2A3B] text-gray-500")}
                >{c.label}</button>
              ))}
            </div>

            {/* Template list */}
            <div className="px-4 pt-2 pb-4 space-y-1">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Layers className="h-8 w-8 text-gray-700 mb-2" />
                  <p className="text-[12px] text-gray-600">No templates yet</p>
                </div>
              ) : (
                filtered.map(t => {
                  const meta = catMeta(t.category);
                  return (
                    <button
                      key={t.id}
                      onClick={() => selectTemplate(t)}
                      className="w-full text-left px-3 py-2.5 rounded-lg border border-[#1A2235] bg-[#0B1018] hover:border-[#2A3A50] transition-all active:scale-95"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-white truncate">{t.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={cn("text-[10px] font-semibold", meta.color)}>{meta.label}</span>
                            {t.tasks?.length > 0 && (
                              <span className="text-[10px] text-gray-600">· {t.tasks.length} tasks</span>
                            )}
                          </div>
                        </div>
                        <ChevronLeft className="h-4 w-4 text-gray-600 -rotate-90 shrink-0 ml-2" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="px-4 pt-3 pb-4 space-y-4">
            {/* Settings section */}
            <div className="bg-[#0F1623] border border-[#1A2235] rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-[#1A2235] bg-[#0B1018]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Settings</span>
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
                  <div className="flex flex-wrap gap-1">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setSelected(s => ({ ...s, category: c.value }))}
                        className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors",
                          selected.category === c.value ? `${c.bg} ${c.color}` : "border-[#1E2A3B] text-gray-600")}
                      >{c.label}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Role">
                  <TextInput
                    value={selected.assigned_role}
                    onChange={v => setSelected(s => ({ ...s, assigned_role: v }))}
                    placeholder="e.g. Line Cook"
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
                  <div className="flex gap-1">
                    {REPEATS.map(r => (
                      <button
                        key={r}
                        onClick={() => setSelected(s => ({ ...s, repeat: r }))}
                        className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize transition-colors",
                          selected.repeat === r
                            ? "bg-primary/15 border-primary/30 text-primary"
                            : "border-[#1E2A3B] text-gray-600")}
                      >{r}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Photo">
                  <Toggle value={selected.photo_required} onChange={v => setSelected(s => ({ ...s, photo_required: v }))} />
                </Field>
              </div>
            </div>

            {/* Tasks section */}
            <div className="bg-[#0F1623] border border-[#1A2235] rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-[#1A2235] bg-[#0B1018] flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tasks</span>
                <span className="text-[10px] text-gray-600">{selected.tasks?.length || 0}</span>
              </div>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="tasks">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="p-3 space-y-2"
                    >
                      {(!selected.tasks || selected.tasks.length === 0) && (
                        <p className="text-[11px] text-gray-700 text-center py-2">No tasks yet</p>
                      )}
                      {selected.tasks?.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(snapshot.isDragging && "opacity-70 scale-[1.02]")}
                            >
                              <TaskRow
                                task={task}
                                onUpdate={updated => updateTask(task.id, updated)}
                                onDelete={() => deleteTask(task.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <div className="px-3 pb-3">
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="w-full h-9 rounded-lg bg-primary/10 border border-primary/25 text-primary text-[12px] font-bold active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Task
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-[#0F1623] border border-[#1A2235] rounded-lg p-3 space-y-2">
              <button
                onClick={pushNow}
                disabled={pushing || !selected?.id}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/25 text-primary text-[12px] font-bold disabled:opacity-40 active:scale-95"
              >
                <span>{pushing ? "Pushing..." : "Push Now"}</span>
                {pushResult && (
                  <span className={pushResult.created > 0 ? "text-emerald-400" : "text-gray-500"}>
                    {pushResult.created > 0 ? `✓ ${pushResult.created}` : "Done"}
                  </span>
                )}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={duplicateTemplate}
                  disabled={!selected.id}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#1E2A3B] text-[12px] font-bold text-gray-400 disabled:opacity-30 active:scale-95"
                >
                  Duplicate
                </button>
                {selected.id && (
                  <button
                    onClick={() => deleteTemplate(selected.id)}
                    className="px-3 py-2 rounded-lg border border-red-500/20 text-[12px] font-bold text-red-500 active:scale-95"
                  >
                    Delete
                  </button>
                )}
              </div>
              <button
                onClick={saveTemplate}
                disabled={saving || !selected.name.trim()}
                className="w-full px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-bold disabled:opacity-50 active:scale-95"
              >
                {saving ? "Saving…" : "Save Template"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FAB — New template (list view only) */}
      {!selected && (
        <button
          onClick={newTemplate}
          className="fixed bottom-6 right-4 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-[13px] font-bold shadow-lg active:scale-95 z-20"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      )}

      {/* Task Form Modal */}
      <TaskFormModal open={showTaskForm} onClose={() => setShowTaskForm(false)} onSave={addTask} />
    </div>
  );
}

export const hideBase44Index = true;