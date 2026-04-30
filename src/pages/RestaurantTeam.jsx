import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Users, Mail, X, ChevronLeft, ChevronRight, UserCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";

const SHIFTS = ["morning", "night"];
const SHIFT_LABELS = { morning: "AM", night: "PM" };

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin / Manager" },
  { value: "user", label: "BOH Staff" },
  { value: "foh", label: "FOH Staff" },
  { value: "busser", label: "Busser" },
];

function WeekNav({ weekStart, onPrev, onNext }) {
  const weekEnd = addDays(weekStart, 6);
  return (
    <div className="flex items-center gap-3">
      <Button size="icon" variant="outline" className="h-8 w-8" onClick={onPrev}><ChevronLeft className="h-4 w-4" /></Button>
      <span className="text-sm font-medium text-foreground min-w-[180px] text-center">
        {format(weekStart, "MMM d")} &ndash; {format(weekEnd, "MMM d, yyyy")}
      </span>
      <Button size="icon" variant="outline" className="h-8 w-8" onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
    </div>
  );
}

export default function RestaurantTeam() {
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);

  const loadAssignments = async () => {
    const from = format(weekStart, "yyyy-MM-dd");
    const to = format(weekEnd, "yyyy-MM-dd");
    const all = await base44.entities.StationAssignment.list("-date", 500);
    setAssignments(all.filter(a => a.date >= from && a.date <= to));
  };

  useEffect(() => {
    const load = async () => {
      const [u, s] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Station.list(),
      ]);
      setUsers(u);
      setStations(s);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [weekStart]);

  const getAssignment = (userEmail, date, shift) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return assignments.find(a => a.user_email === userEmail && a.date === dateStr && a.shift === shift);
  };

  const handleAssignmentChange = async (user, date, shift, stationId) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = assignments.find(a => a.user_email === user.email && a.date === dateStr && a.shift === shift);
    if (stationId === "__clear__") {
      if (existing) {
        await base44.entities.StationAssignment.delete(existing.id);
        setAssignments(prev => prev.filter(a => a.id !== existing.id));
      }
      return;
    }
    const station = stations.find(s => s.id === stationId);
    if (existing) {
      const updated = await base44.entities.StationAssignment.update(existing.id, {
        station_id: stationId, station_name: station?.name || "",
      });
      setAssignments(prev => prev.map(a => a.id === existing.id ? updated : a));
    } else {
      const created = await base44.entities.StationAssignment.create({
        station_id: stationId,
        station_name: station?.name || "",
        user_email: user.email,
        user_name: user.full_name || user.email,
        shift,
        date: dateStr,
      });
      setAssignments(prev => [...prev, created]);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(userId);
    await base44.entities.User.update(userId, { role: newRole });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setUpdatingRole(null);
    toast.success("Role updated");
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), "user");
    toast.success("Invite sent!");
    setInviteEmail("");
    setShowInvite(false);
    setInviting(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" /> Restaurant Team
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage staff roles and weekly station assignments.</p>
        </div>
        {!showInvite ? (
          <Button size="sm" onClick={() => setShowInvite(true)}>
            <Plus className="h-4 w-4 mr-1" /> Invite Member
          </Button>
        ) : (
          <div className="flex items-end gap-2">
            <div>
              <Label className="text-xs">Email</Label>
              <Input className="h-8 text-xs w-52" type="email" placeholder="staff@restaurant.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
            <Button size="sm" disabled={inviting || !inviteEmail.trim()} onClick={handleInvite}>
              <Mail className="h-3.5 w-3.5 mr-1" />{inviting ? "Sending..." : "Send"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowInvite(false); setInviteEmail(""); }}><X className="h-3.5 w-3.5" /></Button>
          </div>
        )}
      </div>

      {/* Team roster */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Team Members</h2>
          <span className="text-xs text-muted-foreground ml-auto">{users.length} members</span>
        </div>
        <div className="divide-y divide-border">
          {users.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">No team members yet.</p>}
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between px-5 py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {(u.full_name || u.email || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name || u.email}</p>
                  {u.full_name && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                </div>
              </div>
              <Select
                value={u.role || "user"}
                onValueChange={v => handleRoleChange(u.id, v)}
                disabled={updatingRole === u.id}
              >
                <SelectTrigger className="h-7 text-xs w-40 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly station assignments */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-semibold text-sm">Weekly Station Assignments</h2>
          <WeekNav weekStart={weekStart} onPrev={() => setWeekStart(w => subWeeks(w, 1))} onNext={() => setWeekStart(w => addWeeks(w, 1))} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground w-40">Staff / Shift</th>
                {weekDays.map(day => (
                  <th key={day.toISOString()} className={`text-center px-2 py-2 font-medium ${isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground"}`}>
                    <div>{format(day, "EEE")}</div>
                    <div className={`text-xs font-bold ${isSameDay(day, new Date()) ? "text-primary" : ""}`}>{format(day, "d")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                SHIFTS.map((shift, si) => (
                  <tr key={`${u.id}-${shift}`} className={si === 1 ? "bg-secondary/10" : ""}>
                    <td className="px-4 py-1.5 font-medium">
                      {si === 0 && <span className="text-foreground text-xs">{u.full_name || u.email}</span>}
                      <span className="block text-[10px] text-muted-foreground">{SHIFT_LABELS[shift]} Shift</span>
                    </td>
                    {weekDays.map(day => {
                      const assignment = getAssignment(u.email, day, shift);
                      return (
                        <td key={day.toISOString()} className="px-1 py-1">
                          <Select
                            value={assignment?.station_id || "__clear__"}
                            onValueChange={v => handleAssignmentChange(u, day, shift, v)}
                          >
                            <SelectTrigger className="h-7 text-[10px] px-1.5 border-border/50">
                              <SelectValue placeholder="off" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__clear__">Off</SelectItem>
                              {stations.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      );
                    })}
                  </tr>
                ))
              ))}
              {users.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">No team members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}