import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Search, Plus, MessageSquare, CheckSquare2, User, Bell, Filter, ChefHat, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const DEPARTMENTS = ["FOH", "BOH", "Bar"];
const FILTERS = ["All", "FOH", "BOH", "Bar", "Managers", "Support"];

export default function RestaurantTeam() {
  const { user: currentUser, isAdmin } = useCurrentUser();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitingRole, setInvitingRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.User.list();
      setEmployees(all);
      setLoading(false);
    };
    load();
  }, []);

  const filteredEmployees = useMemo(() => {
    let filtered = employees.filter(emp => {
      if (!isAdmin && emp.status === "archived") return false;
      if (search && !emp.full_name?.toLowerCase().includes(search.toLowerCase()) &&
          !emp.email?.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedFilter === "Managers" && emp.role !== "admin") return false;
      if (selectedFilter !== "All" && emp.department !== selectedFilter) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      const statusOrder = { active: 0, inactive: 1, archived: 2 };
      return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2);
    });
  }, [employees, search, selectedFilter, isAdmin]);

  const stats = useMemo(() => ({
    total: employees.length,
    onShift: employees.filter(e => e.status === "active").length,
    expiring: employees.filter(e => e.certifications && e.certifications.length > 0).length,
    requests: 6,
  }), [employees]);

  const onShiftEmployees = filteredEmployees.filter(e => e.status === "active");
  const offShiftEmployees = filteredEmployees.filter(e => e.status !== "active");

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), invitingRole);
    toast.success("Invite sent!");
    setInviteEmail("");
    setInvitingRole("user");
    setShowInvite(false);
    setInviting(false);
  };

  const getRoleDisplay = (role) => {
    const roleMap = { admin: "Manager", foh: "FOH", user: "BOH", busser: "Busser" };
    return roleMap[role] || "Staff";
  };

  const getStatusColor = (status) => {
    if (status === "active") return { bg: "bg-status-success/10", text: "text-status-success", badge: "On Shift" };
    return { bg: "bg-muted", text: "text-muted-foreground", badge: "Off Shift" };
  };

  const getStatusDot = (status) => {
    if (status === "active") return "bg-status-success";
    return "bg-muted-foreground";
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div className="min-h-screen bg-background pb-28 text-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold">Team Directory</h1>
            <p className="text-xs text-muted-foreground">View and manage your team</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center">
              <Bell className="h-4 w-4 text-primary" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-status-error rounded-full" />
            </button>
            <div className="h-9 w-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
              {currentUser?.full_name?.charAt(0) || "U"}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                selectedFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-border">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "On Shift", value: stats.onShift, color: "text-status-success" },
            { label: "Expiring", value: stats.expiring, color: "text-status-warning" },
            { label: "Requests", value: stats.requests, color: "text-primary" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-2 text-center">
              <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team List */}
      <div className="px-4 py-4 space-y-4">
        {/* On Shift Section */}
        {onShiftEmployees.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
              ON SHIFT ({onShiftEmployees.length})
            </h2>
            <div className="space-y-2">
              {onShiftEmployees.map(emp => {
                const statusInfo = getStatusColor(emp.status);
                return (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-lg p-2.5 flex items-start gap-2.5"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                        {emp.full_name?.charAt(0) || "E"}
                      </div>
                      <div className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-card", getStatusDot(emp.status))} />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="text-xs font-bold leading-tight">{emp.full_name || emp.email}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{getRoleDisplay(emp.role)}{emp.department && ` • ${emp.department}`}</p>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap", statusInfo.bg, statusInfo.text)}>
                        {statusInfo.badge}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
                          <MessageSquare className="h-3 w-3 text-foreground" />
                        </button>
                        <button className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
                          <CheckSquare2 className="h-3 w-3 text-foreground" />
                        </button>
                        <button className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
                          <User className="h-3 w-3 text-foreground" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Off Shift Section */}
        {offShiftEmployees.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              OFF SHIFT ({offShiftEmployees.length})
            </h2>
            <div className="space-y-2">
              {offShiftEmployees.map(emp => {
                const statusInfo = getStatusColor(emp.status);
                return (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-lg p-2.5 flex items-start gap-2.5 opacity-75"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-muted/20 border border-muted/30 flex items-center justify-center text-muted-foreground text-xs font-bold">
                        {emp.full_name?.charAt(0) || "E"}
                      </div>
                      <div className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-card", getStatusDot(emp.status))} />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="text-xs font-bold leading-tight">{emp.full_name || emp.email}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{getRoleDisplay(emp.role)}{emp.department && ` • ${emp.department}`}</p>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap", statusInfo.bg, statusInfo.text)}>
                        {statusInfo.badge}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
                          <MessageSquare className="h-3 w-3 text-foreground" />
                        </button>
                        <button className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
                          <CheckSquare2 className="h-3 w-3 text-foreground" />
                        </button>
                        <button className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
                          <User className="h-3 w-3 text-foreground" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No team members found</p>
          </div>
        )}

        {/* Certifications Section */}
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm font-bold mb-2">Certifications</h3>
          <div className="bg-card border border-border rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ServeSafe</span>
              <span className="text-sm font-bold">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Expiring Soon</span>
              <span className="text-sm font-bold text-status-warning">4</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
              Review Certifications
            </Button>
          </div>
        </div>

        {/* Availability Section */}
        <div>
          <h3 className="text-sm font-bold mb-2">Availability Requests</h3>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-3">6 pending requests</p>
            <Button variant="outline" size="sm" className="w-full text-xs">
              Open Requests
            </Button>
          </div>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">Email Address</label>
              <Input
                type="email"
                placeholder="staff@restaurant.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">Role</label>
              <Select value={invitingRole} onValueChange={setInvitingRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Manager</SelectItem>
                  <SelectItem value="user">BOH</SelectItem>
                  <SelectItem value="foh">FOH</SelectItem>
                  <SelectItem value="busser">Busser</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sticky Add Member Button */}
      <div className="fixed bottom-20 left-4 right-4 z-30">
        <Button onClick={() => setShowInvite(true)} className="w-full gap-2 h-12 text-base">
          <Plus className="h-5 w-5" /> Add Team Member
        </Button>
      </div>
    </motion.div>
  );
}

export const hideBase44Index = true;