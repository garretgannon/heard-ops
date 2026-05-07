import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Search, Plus, MessageSquare, CheckSquare2, User, Bell, Filter, ChefHat, Users, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast as toastSonner } from "sonner";
import AddEmployeeModal from "@/components/team/AddEmployeeModal";
import EmployeeEditModal from "@/components/team/EmployeeEditModal";

const toast = {
  info: (msg) => toastSonner.info(msg),
  success: (msg) => toastSonner.success(msg),
  error: (msg) => toastSonner.error(msg),
};
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const DEPARTMENTS = ["FOH", "BOH", "Bar"];
const FILTERS = ["All", "FOH", "BOH", "Bar", "Managers", "Support"];

export default function RestaurantTeam() {
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useCurrentUser();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.Employee.list();
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
    total: filteredEmployees.length,
    onShift: filteredEmployees.filter(e => e.status === "active").length,
    expiring: filteredEmployees.filter(e => e.certifications && e.certifications.length > 0).length,
    requests: 6,
  }), [filteredEmployees]);

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(start, start + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const handleAddEmployee = async () => {
    setShowAddModal(false);
    const all = await base44.entities.Employee.list();
    setEmployees(all);
    toast.success("Employee added!");
  };

  const handleUpdateEmployee = async () => {
    const all = await base44.entities.Employee.list();
    setEmployees(all);
  };

  const getRoleDisplay = (role) => {
    const roleMap = { admin: "Manager", foh: "FOH", user: "BOH", busser: "Busser" };
    return roleMap[role] || "Staff";
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div className="min-h-screen bg-background pb-28 text-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Desktop Layout */}
      <div className="hidden lg:flex gap-6 p-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Team Directory</h1>
              <p className="text-sm text-muted-foreground">View and manage your team</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>

          {/* Search & Filters */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3 px-3 h-10 rounded-lg border border-border bg-background">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search team members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
              />
              <Filter className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>

            <div className="flex gap-2">
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                    selectedFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground hover:bg-secondary"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Team Members</p>
                  <p className="text-xs text-muted-foreground">Across all departments</p>
                </div>
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-status-success">{stats.onShift}</p>
                  <p className="text-xs text-muted-foreground mt-1">On Shift</p>
                  <p className="text-xs text-status-success">Currently working</p>
                </div>
                <AlertCircle className="h-5 w-5 text-status-success" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-status-warning">{stats.expiring}</p>
                  <p className="text-xs text-muted-foreground mt-1">Expiring Certifications</p>
                  <p className="text-xs text-status-warning">Within 30 days</p>
                </div>
                <AlertCircle className="h-5 w-5 text-status-warning" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.requests}</p>
                  <p className="text-xs text-muted-foreground mt-1">Open Requests</p>
                  <p className="text-xs text-muted-foreground">Needs attention</p>
                </div>
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-secondary/30">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Employee</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Department</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Shift Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Certifications</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map(emp => (
                    <tr key={emp.id} onClick={() => setEditingEmployee(emp)} className="border-b border-border/20 hover:bg-secondary/20 transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {emp.full_name?.charAt(0) || "E"}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{emp.full_name || emp.email}</p>
                            <p className="text-xs text-muted-foreground">EMP-{emp.id?.slice(0, 4).toUpperCase() || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{getRoleDisplay(emp.role)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${emp.department === 'FOH' ? 'bg-orange-500/20 text-orange-400' : emp.department === 'BOH' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {emp.department || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className={`text-xs font-bold ${emp.status === 'active' ? 'text-status-success' : 'text-muted-foreground'}`}>
                            {emp.status === 'active' ? 'On Shift' : 'Off Shift'}
                          </p>
                          <p className="text-xs text-muted-foreground">Since {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground">3/3 Current</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="h-7 w-7 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors">
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                          <button className="h-7 w-7 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors">
                            <User className="h-3.5 w-3.5" />
                          </button>
                          <button className="h-7 w-7 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors">
                            <Filter className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
              <p>Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEmployees.length)} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} members</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="h-8 px-2 rounded hover:bg-secondary transition-colors disabled:opacity-50">←</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`h-8 w-8 rounded transition-colors ${currentPage === page ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="h-8 px-2 rounded hover:bg-secondary transition-colors disabled:opacity-50">→</button>
              </div>
              <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 rounded border border-border bg-secondary text-foreground text-xs">
                <option value="10">10 rows</option>
                <option value="25">25 rows</option>
                <option value="50">50 rows</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-64 space-y-6">
          {/* Certifications Overview */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-bold text-foreground mb-4">Certifications Overview</h3>
            <div className="h-32 bg-secondary/30 rounded-lg mb-3 flex items-center justify-center text-muted-foreground text-xs">[Chart]</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current</span>
                <span className="font-bold">16 (82%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expiring Soon</span>
                <span className="font-bold text-status-warning">4 (17%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expired</span>
                <span className="font-bold text-status-critical">1 (4%)</span>
              </div>
            </div>
            <button className="w-full mt-4 px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-secondary transition-colors">View All Certifications</button>
          </div>

          {/* Expiring Soon */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">Expiring Soon</h3>
              <a href="#" className="text-primary text-xs font-semibold hover:underline">View all</a>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-secondary/30 border border-border/20">
                <p className="font-semibold text-foreground">Food Handler</p>
                <p className="text-muted-foreground">Jameson Carter</p>
                <p className="text-status-warning font-semibold mt-1">5 days</p>
              </div>
              <div className="p-2 rounded bg-secondary/30 border border-border/20">
                <p className="font-semibold text-foreground">Alcohol Server</p>
                <p className="text-muted-foreground">Taylor Morgan</p>
                <p className="text-status-warning font-semibold mt-1">12 days</p>
              </div>
            </div>
          </div>

          {/* Open Requests */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">Open Requests</h3>
              <a href="#" className="text-primary text-xs font-semibold hover:underline">View all</a>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
                <span>Time Off Requests</span>
                <span className="font-bold">3</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
                <span>Shift Swap Requests</span>
                <span className="font-bold">2</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
                <span>Availability Updates</span>
                <span className="font-bold">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Team</h1>
              <p className="text-xs text-muted-foreground">Manage your team</p>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
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

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No team members found</p>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddEmployee}
        />
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <EmployeeEditModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSave={handleUpdateEmployee}
        />
      )}
    </motion.div>
  );
}

export const hideBase44Index = true;