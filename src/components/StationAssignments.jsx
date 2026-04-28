import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sun, Moon, Plus, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const shiftConfig = {
  morning: { label: "Morning", icon: Sun, color: "text-amber-500 bg-amber-50 border-amber-200" },
  night: { label: "Night", icon: Moon, color: "text-indigo-500 bg-indigo-50 border-indigo-200" },
};

export default function StationAssignments({ station }) {
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [adding, setAdding] = useState(null); // "morning" | "night" | null
  const [form, setForm] = useState({ user_email: "", shift: "" });
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [a, u] = await Promise.all([
      base44.entities.StationAssignment.filter({ station_id: station.id, date }),
      base44.entities.User.list(),
    ]);
    setAssignments(a);
    setUsers(u);
  };

  useEffect(() => { load(); }, [station.id, date]);

  const handleAdd = async (shift) => {
    if (!form.user_email) return;
    setSaving(true);
    const user = users.find(u => u.email === form.user_email);
    await base44.entities.StationAssignment.create({
      station_id: station.id,
      station_name: station.name,
      user_email: form.user_email,
      user_name: user?.full_name || form.user_email,
      shift,
      date,
    });
    setForm({ user_email: "", shift: "" });
    setAdding(null);
    setSaving(false);
    load();
  };

  const handleRemove = async (id) => {
    await base44.entities.StationAssignment.delete(id);
    load();
  };

  const morningAssignments = assignments.filter(a => a.shift === "morning");
  const nightAssignments = assignments.filter(a => a.shift === "night");

  return (
    <div className="mt-3 border-t border-border pt-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Users className="h-3.5 w-3.5" />
          Assignments
        </div>
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="h-6 text-xs w-32 px-2"
        />
      </div>

      {["morning", "night"].map(shift => {
        const cfg = shiftConfig[shift];
        const list = shift === "morning" ? morningAssignments : nightAssignments;
        const Icon = cfg.icon;
        return (
          <div key={shift}>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${cfg.color} mb-1.5`}>
              <Icon className="h-3 w-3" />
              <span className="text-xs font-semibold">{cfg.label}</span>
            </div>
            <div className="space-y-1 ml-1">
              {list.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-2 text-xs px-2 py-1 rounded-md bg-muted/50">
                  <span className="truncate">{a.user_name}</span>
                  <button onClick={() => handleRemove(a.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {adding === shift ? (
                <div className="flex gap-1">
                  <Select value={form.user_email} onValueChange={v => setForm({ ...form, user_email: v })}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.email}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleAdd(shift)} disabled={saving || !form.user_email}>Add</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setAdding(null)}>✕</Button>
                </div>
              ) : (
                <button
                  onClick={() => { setAdding(shift); setForm({ user_email: "" }); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5"
                >
                  <Plus className="h-3 w-3" /> Assign staff
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}