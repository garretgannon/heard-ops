import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ClipboardList, UtensilsCrossed, CheckCircle2, Clock, ArrowRight, Plus, CheckSquare, AlertCircle, ThumbsUp, ShowerHead } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import StationBadge from "../components/StationBadge";
import ShiftStatusPanel from "../components/ShiftStatusPanel";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const [stations, setStations] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [sideWorkAssignments, setSideWorkAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bathroomConfigs, setBathroomConfigs] = useState([]);
  const [bathroomLogs, setBathroomLogs] = useState([]);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      const [s, pl, pi, sw, bc, bl] = await Promise.all([
        base44.entities.Station.list(),
        base44.entities.PrepList.list("-created_date", 50),
        base44.entities.PrepItem.list("-created_date", 200),
        base44.entities.SideWorkAssignment.filter({ date: todayStr }),
        base44.entities.BathroomCheckConfig.filter({ is_active: true }),
        base44.entities.BathroomCheckLog.list("-checked_at", 100),
      ]);
      setStations(s);
      setPrepLists(pl);
      setPrepItems(pi);
      setSideWorkAssignments(sw);
      setBathroomConfigs(bc);
      setBathroomLogs(bl);
      setLoading(false);
    };
    load();
  }, []);

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

      {/* BACK OF HOUSE */}
      <div className="space-y-8">
        <h2 className="text-xl font-bold text-primary">Back of House</h2>

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

        {/* Temp Logs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Temperature Logs</h2>
            <Link to="/temp-logs" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 text-center text-muted-foreground text-sm">
            <p>Temperature monitoring active. <Link to="/temp-logs" className="text-primary hover:underline">View logs</Link></p>
          </div>
        </div>

        {/* Dish Machines */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Dish Machines</h2>
            <Link to="/dish-machines" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 text-center text-muted-foreground text-sm">
            <p>Dishwashing equipment tracking. <Link to="/dish-machines" className="text-primary hover:underline">Manage</Link></p>
          </div>
        </div>
      </div>

      {/* FRONT OF HOUSE */}
      <div className="space-y-8">
        <h2 className="text-xl font-bold text-primary">Front of House</h2>

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
      </div>
    </motion.div>
  );
}