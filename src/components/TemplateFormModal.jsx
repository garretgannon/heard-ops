import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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

const CATEGORIES = [
  { value: "prep", label: "Prep" },
  { value: "cleaning", label: "Cleaning" },
  { value: "side_work", label: "Side Work" },
  { value: "opening", label: "Opening" },
  { value: "closing", label: "Closing" },
];

const REPEATS = ["daily", "weekly", "custom"];

export default function TemplateFormModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    category: "prep",
    assigned_role: "",
    due_time: "",
    repeat: "daily",
    photo_required: false,
    is_active: true,
    station_id: "",
    tasks: [],
  });
  const [saving, setSaving] = useState(false);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    if (open) {
      base44.entities.Station.list("-updated_date", 100).then(setStations);
    }
  }, [open]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const created = await base44.entities.Template.create(form);
    setSaving(false);
    onSaved(created);
    setForm({
      name: "",
      category: "prep",
      assigned_role: "",
      due_time: "",
      repeat: "daily",
      photo_required: false,
      is_active: true,
      station_id: "",
      tasks: [],
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#0B1018] border-t border-[#1E2A3B] rounded-t-2xl z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2235] shrink-0">
          <p className="text-[15px] font-bold text-white">Create Template</p>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto px-4 py-4 space-y-3 pb-6 flex-1">
          <div>
            <label className="block text-[11px] text-gray-500 font-semibold mb-1.5">Template Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Morning Prep"
              className="w-full h-10 px-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-lg text-white outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-700"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 font-semibold mb-1.5">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setForm(f => ({ ...f, category: cat.value, station_id: "" }))}
                  className={cn("px-3 py-1 rounded-full text-[11px] font-bold border transition-all",
                    form.category === cat.value ? "bg-primary text-primary-foreground border-primary" : "border-[#1E2A3B] text-gray-500")}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 font-semibold mb-1.5">Role (optional)</label>
            <input
              value={form.assigned_role}
              onChange={e => setForm(f => ({ ...f, assigned_role: e.target.value }))}
              placeholder="e.g. Line Cook"
              className="w-full h-10 px-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-lg text-white outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-700"
            />
          </div>

          {form.category === "prep" && (
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1.5">Station (optional)</label>
              <select
                value={form.station_id}
                onChange={e => setForm(f => ({ ...f, station_id: e.target.value }))}
                className="w-full h-10 px-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-lg text-white outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">None</option>
                {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1.5">Due Time</label>
              <input
                type="time"
                value={form.due_time}
                onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))}
                className="w-full h-10 px-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-lg text-white outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1.5">Repeat</label>
              <select value={form.repeat} onChange={e => setForm(f => ({ ...f, repeat: e.target.value }))}
                className="w-full h-10 px-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-lg text-white outline-none focus:ring-1 focus:ring-primary">
                {REPEATS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="text-[12px] text-gray-400 font-medium">Photo required</label>
            <Toggle value={form.photo_required} onChange={v => setForm(f => ({ ...f, photo_required: v }))} />
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-4 border-t border-[#1A2235] flex gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-[#1E2A3B] text-[13px] font-bold text-gray-400 active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-[13px] font-bold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}