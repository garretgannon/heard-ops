import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Users, Mail, X, Plus, Search, Archive, MoreVertical, ExternalLink,
  AlertCircle, CheckCircle, Clock, Phone, Calendar, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const DEPARTMENTS = ["FOH", "BOH", "Bar"];
const STATUSES = [
  { value: "active", label: "Active", icon: CheckCircle, color: "text-green-500" },
  { value: "inactive", label: "Inactive", icon: Clock, color: "text-yellow-500" },
  { value: "archived", label: "Archived", icon: Archive, color: "text-muted-foreground" },
];

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "foh", label: "FOH" },
  { value: "user", label: "BOH" },
  { value: "busser", label: "Busser" },
];

function getStatusInfo(status) {
  return STATUSES.find(s => s.value === status) || STATUSES[0];
}

export default function RestaurantTeam() {
  const { user: currentUser, isAdmin } = useCurrentUser();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitingRole, setInvitingRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.User.list();
      setEmployees(all);
      setLoading(false);
    };
    load();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    if (!isAdmin && emp.status === "archived") return false;
    if (selectedStatus !== "all" && emp.status !== selectedStatus) return false;
    if (selectedDepartment !== "all" && emp.department !== selectedDepartment) return false;
    if (search && !emp.full_name?.toLowerCase().includes(search.toLowerCase()) &&
        !emp.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    const statusOrder = { active: 0, inactive: 1, archived: 2 };
    const aDept = a.department || "ZZ";
    const bDept = b.department || "ZZ";
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return aDept.localeCompare(bDept);
  });

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

  const handleSaveEmployee = async () => {
    if (!editingEmployee) return;
    setSaving(true);
    const updated = await base44.entities.User.update(editingEmployee.id, editForm);
    setEmployees(prev => prev.map(e => e.id === editingEmployee.id ? updated : e));
    setEditingEmployee(null);
    setSaving(false);
    toast.success("Updated");
  };

  const handleSeedDummyData = async () => {
    setSeeding(true);
    const res = await base44.functions.invoke('seedDummyTeam', {});
    if (res.data.success) {
      toast.success(`Added ${res.data.invited.length} dummy team members`);
      const all = await base44.entities.User.list();
      setEmployees(all);
    } else {
      toast.error("Failed to seed data");
    }
    setSeeding(false);
  };

  const handleChangeStatus = async (empId, newStatus) => {
    const updated = await base44.entities.User.update(empId, { status: newStatus });
    setEmployees(prev => prev.map(e => e.id === empId ? updated : e));
    toast.success("Status updated");
  };

  const handleChangeRole = async (empId, newRole) => {
    const updated = await base44.entities.User.update(empId, { role: newRole });
    setEmployees(prev => prev.map(e => e.id === empId ? updated : e));
    toast.success("Role updated");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activeCount = employees.filter(e => e.status === "active").length;
  const inactiveCount = employees.filter(e => e.status === "inactive").length;

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3 text-white">
            <Users className="h-7 w-7 text-primary" /> Restaurant Team
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Employee directory, roles, and permissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSeedDummyData} disabled={seeding} variant="outline" className="gap-2 text-xs">
            {seeding ? "Adding..." : "Add Dummy Data"}
          </Button>
          <Button onClick={() => setShowInvite(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Invite
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{employees.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-500">{activeCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Inactive</p>
          <p className="text-2xl font-bold text-yellow-500">{inactiveCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Departments</p>
          <p className="text-2xl font-bold">{new Set(employees.filter(e => e.department).map(e => e.department)).size}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 text-foreground"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-foreground">All Status</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value} className="text-foreground">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-40 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-foreground">All Departments</SelectItem>
            {DEPARTMENTS.map(d => (
              <SelectItem key={d} value={d} className="text-foreground">{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employee Directory */}
      <div className="grid gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No employees found.</p>
          </div>
        ) : (
          filteredEmployees.map(emp => {
            const statusInfo = getStatusInfo(emp.status);
            const StatusIcon = statusInfo.icon;
            const canSeePrivate = isAdmin || emp.email === currentUser?.email;
            return (
              <div key={emp.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{emp.full_name || emp.email}</h3>
                      <StatusIcon className={cn("h-4 w-4 flex-shrink-0", statusInfo.color)} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{emp.email}</p>
                    <div className="flex items-center gap-4 flex-wrap text-xs">
                      {emp.department && (
                        <span className="px-2 py-1 bg-secondary rounded-full">{emp.department}</span>
                      )}
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {ROLES.find(r => r.value === emp.role)?.label || "User"}
                      </span>
                      {emp.start_date && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {format(parseISO(emp.start_date), "MMM d, yyyy")}
                        </span>
                      )}
                      {emp.phone && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {emp.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                {/* Certifications */}
                {emp.certifications && (
                  <div className="flex items-start gap-2 text-xs">
                    <Award className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {emp.certifications.split(",").map((cert, i) => (
                        <span key={i} className="px-2 py-1 bg-primary/10 rounded text-primary">
                          {cert.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50">
                  <Select value={emp.status} onValueChange={v => handleChangeStatus(emp.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-32 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value} className="text-foreground">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={emp.role || "user"} onValueChange={v => handleChangeRole(emp.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-32 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => (
                        <SelectItem key={r.value} value={r.value} className="text-foreground">{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="text-xs gap-1 ml-auto">
                    <ExternalLink className="h-3 w-3" /> View
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-foreground">Email Address</Label>
              <Input
                type="email"
                placeholder="staff@restaurant.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="text-foreground"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-foreground">Initial Role</Label>
              <Select value={invitingRole} onValueChange={setInvitingRole}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value} className="text-foreground">{r.label}</SelectItem>
                  ))}
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

      {/* Employee Details */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Employee</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label className="text-foreground">Name</Label>
                <p className="text-sm text-foreground">{selectedEmployee.full_name || selectedEmployee.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Email</Label>
                <p className="text-sm text-foreground">{selectedEmployee.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Department</Label>
                <Select value={selectedEmployee.department || ""} onValueChange={v => setSelectedEmployee({ ...selectedEmployee, department: v })}>
                    <SelectTrigger className="text-foreground">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => (
                        <SelectItem key={d} value={d} className="text-foreground">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Phone</Label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={selectedEmployee.phone || ""}
                  onChange={e => setSelectedEmployee({ ...selectedEmployee, phone: e.target.value })}
                  className="text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Start Date</Label>
                <Input
                  type="date"
                  value={selectedEmployee.start_date || ""}
                  onChange={e => setSelectedEmployee({ ...selectedEmployee, start_date: e.target.value })}
                  className="text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Certifications (comma-separated)</Label>
                <Input
                  placeholder="ServSafe, TIPS, Mixology"
                  value={selectedEmployee.certifications || ""}
                  onChange={e => setSelectedEmployee({ ...selectedEmployee, certifications: e.target.value })}
                  className="text-foreground"
                />
              </div>
              {isAdmin && (
                <>
                  <div className="space-y-1">
                    <Label className="text-foreground">Emergency Contact (Private)</Label>
                    <Input
                      placeholder="Name"
                      value={selectedEmployee.emergency_contact || ""}
                      onChange={e => setSelectedEmployee({ ...selectedEmployee, emergency_contact: e.target.value })}
                      className="text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-foreground">Emergency Phone (Private)</Label>
                    <Input
                      placeholder="+1 (555) 000-0000"
                      value={selectedEmployee.emergency_contact_phone || ""}
                      onChange={e => setSelectedEmployee({ ...selectedEmployee, emergency_contact_phone: e.target.value })}
                      className="text-foreground"
                    />
                  </div>
                </>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedEmployee(null)}>Cancel</Button>
                <Button onClick={async () => {
                  setSaving(true);
                  const updated = await base44.entities.User.update(selectedEmployee.id, selectedEmployee);
                  setEmployees(prev => prev.map(e => e.id === selectedEmployee.id ? updated : e));
                  setSelectedEmployee(null);
                  setSaving(false);
                  toast.success("Updated");
                }} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export const hideBase44Index = true;