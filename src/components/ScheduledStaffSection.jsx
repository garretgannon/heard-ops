import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ScheduledStaffSection({ shifts, onManage }) {
  const navigate = useNavigate();
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const roles = useMemo(() => [...new Set(shifts.map(s => s.role || s.department).filter(Boolean))], [shifts]);

  const filtered = useMemo(() => {
    return shifts.filter(s => {
      const nameMatch = s.employee_name?.toLowerCase().includes(nameFilter.toLowerCase());
      const roleMatch = roleFilter === "all" || s.role === roleFilter || s.department === roleFilter;
      const timeMatch = timeFilter === "all" || (timeFilter === "morning" && s.start_time < "12:00") || (timeFilter === "afternoon" && s.start_time >= "12:00" && s.start_time < "17:00") || (timeFilter === "evening" && s.start_time >= "17:00");
      return nameMatch && roleMatch && timeMatch;
    });
  }, [shifts, nameFilter, roleFilter, timeFilter]);

  const activeFilters = [nameFilter, roleFilter !== "all", timeFilter !== "all"].filter(Boolean).length;

  return (
    <div className="bg-card border-2 border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Today's Scheduled Staff ({filtered.length})
        </h2>
        <Button onClick={() => navigate("/schedule-import")} variant="ghost" size="sm" className="text-xs">Manage</Button>
      </div>

      {/* Filters Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        {activeFilters > 0 ? `${activeFilters} filter${activeFilters > 1 ? "s" : ""}` : "Show filters"}
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-muted/20 rounded-lg p-3 mb-3 space-y-2">
          <Input
            placeholder="Search by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="h-8 text-sm"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Filter by time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Times</SelectItem>
              <SelectItem value="morning">Morning (Before Noon)</SelectItem>
              <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
              <SelectItem value="evening">Evening (After 5pm)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Staff List */}
      {filtered.length > 0 ? (
        <div className="space-y-1.5">
          {filtered.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <p className="font-medium">{s.employee_name}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{s.start_time} – {s.end_time}</span>
                <span className="text-xs px-2 py-0.5 bg-muted rounded-full">{s.role || s.department}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">No shifts match your filters</p>
      )}
    </div>
  );
}