import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Camera, ChevronLeft, Layers, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import TaskFormModal from "@/components/TaskFormModal";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const CATEGORIES = [
  { value: "prep", label: "Prep", color: "text-blue-400", bg: "bg-blue-500/10" },
  { value: "cleaning", label: "Cleaning", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { value: "side_work", label: "Side Work", color: "text-purple-400", bg: "bg-purple-500/10" },
  { value: "opening", label: "Opening", color: "text-amber-400", bg: "bg-amber-500/10" },
  { value: "closing", label: "Closing", color: "text-red-400", bg: "bg-red-500/10" },
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
      className={cn("relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0", value ? "bg-primary" : "bg-[#1E2A3B]")}
    >
      <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", value && "translate-x-4")} />
    </button>
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
      <div className="px-2 py-1.5 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span className="text-[12px] font-bold text-white truncate flex-1">{task.name || "Untitled"}</span>
          <div className="flex items-center gap-1 shrink-0">
            {task.photo_required && <Camera className="h-3 w-3 text-amber-400" />}
            <ChevronLeft className={cn("h-3 w-3 text-gray-600 transition-transform -rotate-90", expanded && "rotate-0")} />
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap text-[9px] text-gray-600">
          {task.station && <span>{task.station}</span>}
          {task.role && <span>·</span>}
          {task.role && <span>{task.role}</span>}
          {task.due_time && <span className="ml-auto text-[9px]">{task.due_time}</span>}
        </div>
      </div>

      {expanded && (
        <div className="px-2 pb-2 space-y-1.5 border-t border-[#1A2235] pt-1.5">
          <input
            value={task.name}
            onChange={e => onUpdate({ ...task, name: e.target.value })}
            placeholder="Task name"
            className="w-full bg-[#0F1623] border border-[#1E2A3B] rounded-lg px-2 py-1 text-[12px] text-white outline-none"
          />
          <div className="grid grid-cols-2 gap-1">
            <input
              value={task.station}
              onChange={e => onUpdate({ ...task, station: e.target.value })}
              placeholder="Station"
              className="bg-[#0F1623] border border-[#1E2A3B] rounded-lg px-2 py-1 text-[12px] text-white outline-none"
            />
            <input
              value={task.role}
              onChange={e => onUpdate({ ...task, role: e.target.value })}
              placeholder="Role"
              className="bg-[#0F1623] border border-[#1E2A3B] rounded-lg px-2 py-1 text-[12px] text-white outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={task.due_time}
              onChange={e => onUpdate({ ...task, due_time: e.target.value })}
              className="bg-[#0F1623] border border-[#1E2A3B] rounded-lg px-2 py-1 text-[12px] text-white outline-none flex-1"
            />
            <Toggle value={task.photo_required} onChange={v => onUpdate({ ...task, photo_required: v })} />
          </div>
          <button onClick={onDelete} className="w-full py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/10 rounded transition-colors">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function TemplateBuilder() {
  const { id } = useParams();
  const [templates, setTemplates] = useState([]);
  const [screen, setScreen] = useState("list"); // list, detail, edit
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [stats, setStats] = useState({});
  const [stations, setStations] = useState([]);
  const [showStationForm, setShowStationForm] = useState(false);
  const [newStationName, setNewStationName] = useState("");
  const [savingStation, setSavingStation] = useState(false);

  useEffect(() => { 
    loadTemplates(); 
    loadStats();
    if (id === "new") {
      setSelected(emptyTemplate());
      setScreen("edit");
    }
  }, [id]);

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
    setStats({ total: all.length, completed, rate: all.length ? Math.round((completed / all.length) * 100) : 0 });
  }

  async function loadTemplates() {
    const data = await base44.entities.Template.list("-updated_date", 100);
    setTemplates(data.filter(t => t.is_active !== false));
  }

  function selectTemplate(t) {
    setSelected(JSON.parse(JSON.stringify(t)));
    setScreen("detail");
  }

  function newTemplate() {
    setSelected(emptyTemplate());
    setScreen("edit");
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
    setScreen("detail");
  }

  async function pushNow() {
    if (!selected?.id) return;
    setPushing(true);
    setPushResult(null);
    const res = await base44.functions.invoke('generateTemplateTasks', { template_id: selected.id, date: new Date().toISOString().split('T')[0] });
    setPushResult(res.data);
    setPushing(false);
  }

  async function deleteTemplate(id) {
    await base44.entities.Template.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    setScreen("list");
    setSelected(null);
  }

  async function duplicateTemplate() {
    if (!selected) return;
    const copy = { ...selected, name: selected.name + " (Copy)", id: undefined };
    delete copy.id;
    const created = await base44.entities.Template.create(copy);
    setTemplates(prev => [created, ...prev]);
    selectTemplate(created);
  }

  async function addStation() {
    if (!newStationName.trim()) return;
    setSavingStation(true);
    const station = await base44.entities.Station.create({ name: newStationName.trim() });
    setStations(prev => [station, ...prev]);
    setNewStationName("");
    setShowStationForm(false);
    setSavingStation(false);
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
    if (!destination || source.index === destination.index) return;
    const newTasks = Array.from(selected.tasks || []);
    const [removed] = newTasks.splice(source.index, 1);
    newTasks.splice(destination.index, 0, removed);
    setSelected(s => ({ ...s, tasks: newTasks }));
  }

  const active = templates.filter(t => t.is_active).length;

  return (
    <div className="mx-auto w-full max-w-[480px] h-screen bg-[#080C14] text-white flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {/* LIST SCREEN */}
        {screen === "list" && (
          <motion.div
            key="list"
            initial={{ x: -480 }}
            animate={{ x: 0 }}
            exit={{ x: -480 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Header */}
            <div className="px-3 pt-3 pb-2 border-b border-[#1A2235] bg-[#080C14]">
              <h1 className="text-[16px] font-extrabold tracking-tight">Templates</h1>
              <p className="text-[9px] text-gray-600 mt-0.5">Build workflows</p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-1 mt-2">
                {[
                  { label: "Active", value: active },
                  { label: "Tasks", value: stats.total || 0 },
                  { label: "Rate", value: `${stats.rate || 0}%` },
                ].map(m => (
                  <div key={m.label} className="bg-[#0F1623] border border-[#1A2235] rounded-lg p-1 text-center">
                    <div className="text-[12px] font-extrabold text-white leading-none">{m.value}</div>
                    <div className="text-[8px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
                  <Layers className="h-8 w-8 opacity-30" />
                  <p className="text-[13px]">No templates</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {templates.map(t => {
                    const meta = catMeta(t.category);
                    return (
                      <button
                        key={t.id}
                        onClick={() => selectTemplate(t)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg border border-[#1A2235] bg-[#0B1018] hover:border-[#2A3A50] transition-all active:scale-95"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-white truncate">{t.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={cn("text-[9px] font-semibold", meta.color)}>{meta.label}</span>
                              {t.tasks?.length > 0 && <span className="text-[9px] text-gray-600">· {t.tasks.length} tasks</span>}
                            </div>
                          </div>
                          <ChevronLeft className="h-3 w-3 text-gray-600 -rotate-90 shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FAB */}
            <div className="px-3 pb-4 pt-2">
              <button
                onClick={newTemplate}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground text-[13px] font-bold shadow-lg active:scale-95 transition-transform"
              >
                <Plus className="h-4 w-4" /> New Template
              </button>
            </div>
          </motion.div>
        )}

        {/* DETAIL SCREEN */}
        {screen === "detail" && selected && (
          <motion.div
            key="detail"
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Header */}
            <div className="px-3 pt-2 pb-2 border-b border-[#1A2235] bg-[#080C14] flex items-center justify-between">
              <button onClick={() => { setScreen("list"); setSelected(null); }} className="h-8 w-8 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center active:scale-95">
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </button>
              <h1 className="text-[14px] font-extrabold tracking-tight flex-1 text-center">{selected.name}</h1>
              <button onClick={() => setScreen("edit")} className="text-[12px] font-bold text-primary">Edit</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <div className="space-y-2">
                {/* Info */}
                <div className="bg-[#0F1623] border border-[#1A2235] rounded-lg p-2">
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category</span>
                      <span className={cn("font-semibold", catMeta(selected.category).color)}>{catMeta(selected.category).label}</span>
                    </div>
                    {selected.assigned_role && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Role</span>
                        <span className="text-white">{selected.assigned_role}</span>
                      </div>
                    )}
                    {selected.due_time && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Due Time</span>
                        <span className="text-white">{selected.due_time}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Repeat</span>
                      <span className="text-white capitalize">{selected.repeat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Photo Required</span>
                      <span className="text-white">{selected.photo_required ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="bg-[#0F1623] border border-[#1A2235] rounded-lg overflow-hidden">
                  <div className="px-2 py-1.5 border-b border-[#1A2235] bg-[#0B1018]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tasks ({selected.tasks?.length || 0})</span>
                  </div>
                  <div className="p-2 space-y-1">
                    {(!selected.tasks || selected.tasks.length === 0) ? (
                      <p className="text-[10px] text-gray-700 text-center py-1.5">No tasks yet</p>
                    ) : (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="tasks">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                              {selected.tasks.map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={cn(snapshot.isDragging && "opacity-70 scale-[1.02]")}
                                    >
                                      <TaskRow task={task} onUpdate={updated => updateTask(task.id, updated)} onDelete={() => deleteTask(task.id)} />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-3 pb-4 pt-2 space-y-1.5">
              <button
                onClick={pushNow}
                disabled={pushing}
                className="w-full h-9 rounded-lg bg-primary/10 border border-primary/25 text-primary text-[12px] font-bold disabled:opacity-40 active:scale-95 flex items-center justify-between px-3"
              >
                <span>{pushing ? "Pushing..." : "Push Now"}</span>
                {pushResult && <span className={pushResult.created > 0 ? "text-emerald-400" : "text-gray-500"}>{pushResult.created > 0 ? `✓ ${pushResult.created}` : "Done"}</span>}
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={duplicateTemplate}
                  className="h-9 px-3 rounded-lg border border-[#1E2A3B] text-[12px] font-bold text-gray-400 active:scale-95"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => deleteTemplate(selected.id)}
                  className="h-9 px-3 rounded-lg border border-red-500/20 text-[12px] font-bold text-red-500 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* EDIT SCREEN */}
        {screen === "edit" && selected && (
          <motion.div
            key="edit"
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Header */}
            <div className="px-3 pt-2 pb-2 border-b border-[#1A2235] bg-[#080C14] flex items-center justify-between">
              <button onClick={() => selected.id ? setScreen("detail") : setScreen("list")} className="h-8 w-8 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center active:scale-95">
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </button>
              <h1 className="text-[14px] font-extrabold tracking-tight flex-1 text-center">Edit Template</h1>
              <div className="w-8" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              <div className="bg-[#0F1623] border border-[#1A2235] rounded-lg p-2 space-y-2">
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold">Name *</label>
                  <TextInput value={selected.name} onChange={v => setSelected(s => ({ ...s, name: v }))} placeholder="Template name" className="text-[13px]" />
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 font-semibold mb-1 block">Category</label>
                  <div className="flex flex-wrap gap-1">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setSelected(s => ({ ...s, category: c.value }))}
                        className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors",
                          selected.category === c.value ? `${c.bg} ${c.color}` : "border-[#1E2A3B] text-gray-600")}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="text-[10px] text-gray-500 font-semibold">Role</label>
                   <TextInput value={selected.assigned_role} onChange={v => setSelected(s => ({ ...s, assigned_role: v }))} placeholder="e.g. Line Cook" className="text-[13px]" />
                </div>

                {selected.category === "prep" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-gray-500 font-semibold">Station</label>
                      <button onClick={() => setShowStationForm(true)} className="text-[9px] font-bold text-primary hover:text-primary/80">+ Add</button>
                    </div>
                    <select value={selected.station_id || ""} onChange={e => setSelected(s => ({ ...s, station_id: e.target.value || undefined }))} className="w-full bg-[#0B1018] border border-[#1E2A3B] text-[13px] text-white rounded-lg px-2 py-1 outline-none">
                      <option value="">None</option>
                      {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold">Due Time</label>
                    <input type="time" value={selected.due_time} onChange={e => setSelected(s => ({ ...s, due_time: e.target.value }))} className="w-full bg-transparent text-[13px] text-white outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold">Repeat</label>
                    <select value={selected.repeat} onChange={e => setSelected(s => ({ ...s, repeat: e.target.value }))} className="w-full bg-[#0B1018] border border-[#1E2A3B] text-[13px] text-white rounded-lg px-2 py-1 outline-none">
                      {REPEATS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-500 font-semibold">Photo Required</label>
                  <Toggle value={selected.photo_required} onChange={v => setSelected(s => ({ ...s, photo_required: v }))} />
                </div>
              </div>

              {/* Tasks */}
              <div className="bg-[#0F1623] border border-[#1A2235] rounded-lg overflow-hidden">
                <div className="px-2 py-1.5 border-b border-[#1A2235] bg-[#0B1018]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tasks</span>
                </div>
                <div className="p-2 space-y-1">
                  {(!selected.tasks || selected.tasks.length === 0) && <p className="text-[10px] text-gray-700 text-center py-1">No tasks yet</p>}
                  {selected.tasks?.map(task => (
                    <TaskRow key={task.id} task={task} onUpdate={updated => updateTask(task.id, updated)} onDelete={() => deleteTask(task.id)} />
                  ))}
                  <button onClick={() => setShowTaskForm(true)} className="w-full h-8 rounded-lg bg-primary/10 border border-primary/25 text-primary text-[11px] font-bold active:scale-95 flex items-center justify-center gap-1">
                    <Plus className="h-3 w-3" /> Add Task
                  </button>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="px-3 pb-4 pt-2">
              <button onClick={saveTemplate} disabled={saving || !selected.name.trim()} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-[13px] font-bold disabled:opacity-50 active:scale-95">
                {saving ? "Saving…" : "Save Template"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Form Modal */}
      <TaskFormModal open={showTaskForm} onClose={() => setShowTaskForm(false)} onSave={addTask} />

      {/* Station Form Modal */}
      {showStationForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowStationForm(false)} />
          <div className="relative bg-[#0B1018] border-t border-[#1E2A3B] rounded-t-2xl z-10 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2235]">
              <p className="text-[15px] font-bold text-white">Add Station</p>
              <button onClick={() => setShowStationForm(false)} className="text-gray-500 hover:text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="block text-[11px] text-gray-500 font-semibold mb-1.5">Station Name *</label>
                <input
                  value={newStationName}
                  onChange={e => setNewStationName(e.target.value)}
                  placeholder="e.g. Line 1"
                  className="w-full h-10 px-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-lg text-white outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-700"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-4 py-4 border-t border-[#1A2235] flex gap-2">
              <button
                onClick={() => setShowStationForm(false)}
                className="flex-1 h-10 rounded-lg border border-[#1E2A3B] text-[13px] font-bold text-gray-400 active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={addStation}
                disabled={savingStation || !newStationName.trim()}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-[13px] font-bold disabled:opacity-50 active:scale-95 transition-transform"
              >
                {savingStation ? "Adding..." : "Add Station"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;