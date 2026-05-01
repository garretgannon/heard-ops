import { useState, useMemo } from "react";
import { ChevronDown, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEPARTMENTS = ["FOH", "BOH", "Bar", "Management"];
const SHIFT_TYPES = ["Opening", "Mid", "Closing", "Double", "Training", "Manager"];
const DEPARTMENT_COLORS = {
  FOH: "bg-blue-500/10 border-blue-500/30",
  BOH: "bg-orange-500/10 border-orange-500/30",
  Bar: "bg-purple-500/10 border-purple-500/30",
  Management: "bg-amber-500/10 border-amber-500/30",
};

export default function ScheduleThisWeek({ weekStart, shifts }) {
  const [nameFilter, setNameFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [shiftTypeFilter, setShiftTypeFilter] = useState("all");

  const days = useMemo(() => {
    const d = [];
    const start = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      d.push(date.toISOString().split("T")[0]);
    }
    return d;
  }, [weekStart]);

  const filtered = useMemo(() => {
    return shifts.filter(s => {
      if (nameFilter && !s.employee_name?.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (deptFilter !== "all" && s.department !== deptFilter) return false;
      if (shiftTypeFilter !== "all" && s.shift_type !== shiftTypeFilter) return false;
      return true;
    });
  }, [shifts, nameFilter, deptFilter, shiftTypeFilter]);

  const employees = useMemo(() => {
    const unique = new Set(filtered.map(s => s.employee_name));
    return Array.from(unique).sort();
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Filter by employee name..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="flex-1"
        />
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={shiftTypeFilter} onValueChange={setShiftTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shift Types</SelectItem>
            {SHIFT_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add Shift</Button>
      </div>

      {/* Desktop Grid */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="min-w-max bg-card border border-border rounded-xl overflow-hidden">
          {/* Days Header */}
          <div className="grid gap-px bg-border" style={{ gridTemplateColumns: `200px repeat(7, 180px)` }}>
            <div className="bg-card p-4 font-bold text-sm">Employee</div>
            {days.map(day => {
              const d = new Date(day);
              return (
                <div key={day} className="bg-card p-4 text-center">
                  <div className="font-semibold text-sm">{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                  <div className="text-xs text-muted-foreground">{d.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Shift Cells */}
          <div className="grid gap-px bg-border" style={{ gridTemplateColumns: `200px repeat(7, 180px)` }}>
            {employees.map(emp => {
              const empShifts = filtered.filter(s => s.employee_name === emp);
              return (
                <div key={emp} className="contents">
                  <div className="bg-background p-4 border-b border-border font-medium text-sm truncate">{emp}</div>
                  {days.map(day => {
                    const shift = empShifts.find(s => s.date === day);
                    return (
                      <div key={`${emp}-${day}`} className="bg-background p-2 min-h-24 flex flex-col gap-1">
                        {shift ? (
                          <div className={`p-2 rounded text-xs border ${DEPARTMENT_COLORS[shift.department]}`}>
                            <p className="font-semibold">{shift.start_time} - {shift.end_time}</p>
                            <p className="text-xs">{shift.role}</p>
                            {shift.notes && <p className="text-xs mt-1 opacity-75">{shift.notes}</p>}
                            <div className="flex gap-1 mt-2">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0"><Edit2 className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0"><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        ) : (
                          <button className="border border-dashed border-border rounded p-2 text-xs text-muted-foreground hover:bg-muted transition-colors">+ Add</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Agenda */}
      <div className="lg:hidden space-y-4">
        {days.map(day => {
          const dayShifts = filtered.filter(s => s.date === day);
          const d = new Date(day);
          return (
            <div key={day} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-muted p-4 font-semibold flex items-center justify-between">
                <span>{d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                <span className="text-sm text-muted-foreground">{dayShifts.length} shifts</span>
              </div>
              <div className="divide-y divide-border">
                {dayShifts.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No shifts scheduled</div>
                ) : (
                  dayShifts.map(shift => (
                    <div key={shift.id} className={`p-4 border-l-4 ${DEPARTMENT_COLORS[shift.department]}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{shift.employee_name}</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Edit2 className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{shift.start_time} - {shift.end_time}</p>
                      <p className="text-xs">{shift.role} • {shift.department}</p>
                      {shift.notes && <p className="text-xs mt-2 opacity-75">{shift.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}