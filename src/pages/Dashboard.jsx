import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ClipboardList, UtensilsCrossed, CheckCircle2, Clock, ArrowRight, Plus, CheckSquare, AlertCircle, ThumbsUp, Flame, Salad, Wine, Fish, Beef, Soup, CookingPot, Pizza, Coffee, Sandwich, Cake, Search, X, Users } from "lucide-react";
import JobCodeSelector from "../components/JobCodeSelector";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StationBadge from "../components/StationBadge";
import ShiftStatusPanel from "../components/ShiftStatusPanel";
import MasterPrepList from "./MasterPrepList";
import { ShowerHead } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { toast } from "sonner";

const ACCESS_LEVELS = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "Staff" },
];

export default function Dashboard() {
  const [stations, setStations] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [sideWorkAssignments, setSideWorkAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [savingRole, setSavingRole] = useState({});
  const [customRoles, setCustomRoles] = useState([]);
  const [customRolesSettingId, setCustomRolesSettingId] = useState(null);
  const [bathroomConfigs, setBathroomConfigs] = useState([]);
  const [bathroomLogs, setBathroomLogs] = useState([]);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      const [s, pl, pi, sw, u, settings, bc, bl] = await Promise.all([
        base44.entities.Station.list(),
        base44.entities.PrepList.list("-created_date", 50),
        base44.entities.PrepItem.list("-created_date", 200),
        base44.entities.SideWorkAssignment.filter({ date: todayStr }),
        base44.entities.User.list(),
        base44.entities.Settings.filter({ key: "custom_roles" }),
        base44.entities.BathroomCheckConfig.filter({ is_active: true }),
        base44.entities.BathroomCheckLog.list("-checked_at", 100),
      ]);
      setStations(s);
      setPrepLists(pl);
      setPrepItems(pi);
      setSideWorkAssignments(sw);
      setUsers(u);
      setBathroomConfigs(bc);
      setBathroomLogs(bl);
      if (settings.length > 0) {
        setCustomRolesSettingId(settings[0].id);
        setCustomRoles(JSON.parse(settings[0].value || "[]"));
      }
      setLoading(false);
    };
    load();
  }, []);



  const inviteUser = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
    setInviteEmail("");
    setInviteRole("user");
    setShowInvite(false);
    setInviting(false);
    toast.success("Invite sent to " + inviteEmail.trim());
  };

  const updateRole = async (userId, role) => {
    setSavingRole(p => ({ ...p, [userId]: true }));
    await base44.entities.User.update(userId, { role });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    setSavingRole(p => ({ ...p, [userId]: false }));
    toast.success("Access level updated");
  };

  const updateJobCodes = async (userId, job_codes) => {
    setSavingRole(p => ({ ...p, [userId]: true }));
    await base44.entities.User.update(userId, { job_codes });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, job_codes } : u));
    setSavingRole(p => ({ ...p, [userId]: false }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const todayLists = prepLists.filter(pl => pl.date === todayStr);
  const activeLists = prepLists.filter(pl => pl.status === "active");
  const totalItems = prepItems.length;
  const completedItems = prepItems.filter(pi => pi.status === "completed").length;

  const swPending = sideWorkAssignments.filter(a => a.status === "pending" || a.status === "rejected").length;
  const swApprovals = sideWorkAssignments.filter(a => a.status === "completed").length;
  const swApproved = sideWorkAssignments.filter(a => a.status === "approved").length;
  const swTotal = sideWorkAssignments.length;

  const stats = [
    { label: "Stations", value: stations.length, icon: UtensilsCrossed, color: "text-blue-600 bg-blue-50", to: "/stations" },
    { label: "Today's Lists", value: todayLists.length, icon: ClipboardList, color: "text-primary bg-primary/10", to: "/prep-lists" },
    { label: "Active Lists", value: activeLists.length, icon: Clock, color: "text-amber-600 bg-amber-50", to: "/prep-lists" },
    { label: "Items Done", value: `${completedItems}/${totalItems}`, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50", to: "/prep-lists" },
  ];

  const q = search.toLowerCase().trim();
  const stationResults = q ? stations.filter(s => s.name.toLowerCase().includes(q)) : [];
  const assignmentResults = q ? sideWorkAssignments.filter(a =>
    (a.assigned_to_name && a.assigned_to_name.toLowerCase().includes(q)) ||
    (a.assigned_to_email && a.assigned_to_email.toLowerCase().includes(q))
  ) : [];
  const hasResults = stationResults.length > 0 || assignmentResults.length > 0;

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Kitchen prep overview</p>
        </div>
        <Link to="/prep-lists">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Prep List
          </Button>
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search stations or staff…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search results */}
      {q && (
        <div className="space-y-3">
          {!hasResults && (
            <p className="text-sm text-muted-foreground px-1">No results for "{search}"</p>
          )}
          {stationResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Stations</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stationResults.map(s => (
                  <Link key={s.id} to={`/station/${s.id}`}>
                    <div className="bg-card rounded-2xl border border-border p-4 flex flex-col items-center gap-2 hover:border-primary transition-colors">
                      <StationBadge name={s.name} color={s.color} />
                      <p className="text-xs text-muted-foreground">Open station</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {assignmentResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Staff Today</p>
              <div className="grid gap-2">
                {assignmentResults.map(a => (
                  <div key={a.id} className="bg-card rounded-xl border border-border px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{a.assigned_to_name || a.assigned_to_email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{a.role?.replace("_", " ")} · {a.shift_type}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.status === "approved" ? "bg-green-500/15 text-green-400" :
                      a.status === "completed" ? "bg-yellow-500/15 text-yellow-400" :
                      "bg-muted text-muted-foreground"
                    }`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, i) => (
          <Link key={stat.label} to={stat.to} className="block">
            <motion.div
              className="bg-card rounded-2xl border border-border p-4 lg:p-5 cursor-pointer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07, ease: "easeOut" }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          </Link>
        ))}
      </div>



      {/* Active Prep Lists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active Prep Lists</h2>
          <Link to="/prep-lists" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {activeLists.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">No active prep lists. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {activeLists.slice(0, 5).map((pl, i) => {
              const items = prepItems.filter(pi => pi.prep_list_id === pl.id);
              const done = items.filter(pi => pi.status === "completed").length;
              const station = stations.find(s => s.id === pl.station_id);
              const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

              return (
                <Link key={pl.id} to={`/prep-lists?id=${pl.id}`} className="block">
                  <motion.div
                    className="bg-card rounded-2xl border border-border p-4 lg:p-5"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, delay: i * 0.06, ease: "easeOut" }}
                    whileHover={{ x: 3 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold truncate">{pl.name}</h3>
                          <StatusBadge status={pl.status} />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {station && <StationBadge name={station.name} color={station.color} />}
                          <span>{pl.date}</span>
                          <span>{done}/{items.length} items</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{progress}%</span>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-accent rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.06 + 0.2 }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Prep Progress Chart */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Today's Prep Progress</h2>
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col sm:flex-row items-center gap-8">
          <div className="relative w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Completed", value: completedItems || 0 },
                    { name: "Pending", value: Math.max((totalItems - completedItems), 0) || (totalItems === 0 ? 1 : 0) },
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={46} outerRadius={64}
                  startAngle={90} endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill="hsl(165,58%,46%)" />
                  <Cell fill="hsl(224,12%,18%)" />
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(224,18%,10%)", border: "1px solid hsl(224,14%,18%)", borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: "hsl(220,14%,93%)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">{totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%</span>
              <span className="text-xs text-muted-foreground">done</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-accent inline-block" />Completed</span>
                <span className="font-semibold">{completedItems}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-accent rounded-full" initial={{ width: 0 }} animate={{ width: totalItems > 0 ? `${(completedItems / totalItems) * 100}%` : "0%" }} transition={{ duration: 0.7, ease: "easeOut" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 inline-block" />Pending</span>
                <span className="font-semibold">{totalItems - completedItems}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-muted-foreground/30 rounded-full" initial={{ width: 0 }} animate={{ width: totalItems > 0 ? `${((totalItems - completedItems) / totalItems) * 100}%` : "0%" }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">{totalItems} total items across all lists today</p>
          </div>
        </div>
      </div>

      <ShiftStatusPanel prepLists={prepLists} prepItems={prepItems} stations={stations} />

      {/* Master Prep List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Master Prep List</h2>
        <MasterPrepList />
      </div>

      {/* Bathroom Checks Summary */}
      {bathroomConfigs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><ShowerHead className="h-5 w-5 text-primary" />Bathroom Checks</h2>
            <Link to="/bathroom-checks" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bathroomConfigs.map(c => {
              const recentLog = bathroomLogs.find(l => l.config_id === c.id);
              const lastChecked = recentLog ? new Date(recentLog.checked_at) : null;
              const minutesSince = lastChecked ? (new Date() - lastChecked) / 60000 : Infinity;
              const overdue = minutesSince > c.interval_minutes;
              return (
                <Link key={c.id} to="/bathroom-checks">
                  <div className={`bg-card rounded-2xl border p-4 flex items-center gap-3 hover:border-primary/40 transition-colors ${overdue ? "border-yellow-500/40" : "border-border"}`}>
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${overdue ? "bg-yellow-500/15" : "bg-green-500/15"}`}>
                      <ShowerHead className={`h-4 w-4 ${overdue ? "text-yellow-400" : "text-green-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{lastChecked ? `${Math.round(minutesSince)}m ago` : "Never checked"}</p>
                    </div>
                    {overdue && <span className="text-xs bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Due</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* FOH Side Work Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><CheckSquare className="h-5 w-5 text-primary" />Front of House Side Work</h2>
          <Link to="/side-work" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {swTotal === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">No side work assigned today. <Link to="/side-work" className="text-primary hover:underline">Assign tasks</Link></p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl border border-border p-4">
              <AlertCircle className="h-5 w-5 text-red-400 mb-2" />
              <p className="text-2xl font-bold">{swPending}</p>
              <p className="text-xs text-muted-foreground">Incomplete</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4">
              <Clock className="h-5 w-5 text-yellow-400 mb-2" />
              <p className="text-2xl font-bold">{swApprovals}</p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4">
              <ThumbsUp className="h-5 w-5 text-green-400 mb-2" />
              <p className="text-2xl font-bold">{swApproved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </div>
        )}
      </div>

      {/* Station Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Station Quick Access</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stations.map((s, i) => {
            const name = (s.name || "").toLowerCase();
            const StationIcon =
              name.includes("grill") || name.includes("hot") || name.includes("fire") ? Flame :
              name.includes("salad") || name.includes("cold") || name.includes("garde") ? Salad :
              name.includes("bar") || name.includes("drink") || name.includes("bev") ? Wine :
              name.includes("fish") || name.includes("seafood") ? Fish :
              name.includes("meat") || name.includes("butcher") || name.includes("protein") ? Beef :
              name.includes("soup") || name.includes("sauce") ? Soup :
              name.includes("pizza") || name.includes("flat") ? Pizza :
              name.includes("coffee") || name.includes("espresso") ? Coffee :
              name.includes("dessert") || name.includes("pastry") || name.includes("sweet") ? Cake :
              name.includes("sandwich") || name.includes("deli") ? Sandwich :
              CookingPot;

            const colorBgMap = {
              red: "bg-red-500/15 text-red-400",
              blue: "bg-blue-500/15 text-blue-400",
              green: "bg-green-500/15 text-green-400",
              orange: "bg-orange-500/15 text-orange-400",
              purple: "bg-purple-500/15 text-purple-400",
              teal: "bg-teal-500/15 text-teal-400",
              pink: "bg-pink-500/15 text-pink-400",
              yellow: "bg-yellow-500/15 text-yellow-400",
            };
            const iconColors = colorBgMap[s.color] || "bg-primary/15 text-primary";

            return (
              <Link key={s.id} to={`/station/${s.id}`}>
                <motion.div
                  className="bg-card rounded-2xl border border-border p-4 flex flex-col items-center gap-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${iconColors}`}>
                    <StationIcon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tap to open</p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
          {stations.length === 0 && (
            <div className="col-span-full bg-card rounded-2xl border border-border p-8 text-center">
              <p className="text-muted-foreground text-sm">No stations yet. <Link to="/stations" className="text-primary hover:underline">Create your first station</Link></p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}