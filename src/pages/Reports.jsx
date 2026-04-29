import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
];

function dateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export default function Reports() {
  const [stations, setStations] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(14);

  useEffect(() => {
    Promise.all([
      base44.entities.Station.list(),
      base44.entities.PrepList.list("-date", 500),
      base44.entities.PrepItem.list("-created_date", 2000),
    ]).then(([s, pl, pi]) => {
      setStations(s);
      setPrepLists(pl);
      setPrepItems(pi);
      setLoading(false);
    });
  }, []);

  const cutoff = dateNDaysAgo(range);

  // Build per-station stats
  const stationStats = stations.map(station => {
    const lists = prepLists.filter(pl => pl.station_id === station.id && pl.date >= cutoff);
    const totalLists = lists.length;
    if (totalLists === 0) return { station, totalLists: 0, completedLists: 0, completionRate: null, avgItemCompletion: null };

    const completedLists = lists.filter(pl => pl.status === "completed").length;
    const completionRate = Math.round((completedLists / totalLists) * 100);

    // Average item completion % per list
    const perListCompletion = lists.map(pl => {
      const items = prepItems.filter(pi => pi.prep_list_id === pl.id);
      if (items.length === 0) return null;
      const done = items.filter(pi => pi.status === "completed").length;
      return (done / items.length) * 100;
    }).filter(v => v !== null);

    const avgItemCompletion = perListCompletion.length > 0
      ? Math.round(perListCompletion.reduce((a, b) => a + b, 0) / perListCompletion.length)
      : null;

    return { station, totalLists, completedLists, completionRate, avgItemCompletion };
  }).filter(s => s.totalLists > 0).sort((a, b) => (b.completionRate ?? 0) - (a.completionRate ?? 0));

  const chartData = stationStats.map(s => ({
    name: s.station.name,
    completion: s.avgItemCompletion ?? 0,
    lists: s.totalLists,
    color: s.station.color,
  }));

  const colorMap = {
    red: "#ef4444", blue: "#3b82f6", green: "#22c55e", orange: "#f97316",
    purple: "#a855f7", teal: "#14b8a6", pink: "#ec4899", yellow: "#eab308",
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Station Reports</h1>
          <p className="text-muted-foreground mt-1">Track which stations consistently finish prep on time</p>
        </div>
        {/* Range selector */}
        <div className="flex gap-2">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => setRange(opt.days)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                range === opt.days ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {stationStats.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-muted-foreground">No prep list data found for the selected period.</p>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-base font-semibold mb-1">Avg. Item Completion by Station</h2>
            <p className="text-xs text-muted-foreground mb-5">Percentage of prep items completed per list</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(0,0%,60%)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(0,0%,60%)" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ background: "hsl(0,0%,10%)", border: "1px solid hsl(0,0%,16%)", borderRadius: 10, fontSize: 12 }}
                  itemStyle={{ color: "hsl(0,0%,90%)" }}
                  formatter={(v) => [`${v}%`, "Completion"]}
                />
                <Bar dataKey="completion" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={colorMap[entry.color] || "hsl(38,96%,58%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Station cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stationStats.map(({ station, totalLists, completedLists, completionRate, avgItemCompletion }) => {
              const rate = avgItemCompletion ?? completionRate ?? 0;
              const status = rate >= 80 ? "on-time" : rate >= 50 ? "mixed" : "delayed";
              const StatusIcon = status === "on-time" ? TrendingUp : status === "mixed" ? Minus : TrendingDown;
              const statusColor = status === "on-time" ? "text-green-400" : status === "mixed" ? "text-amber-400" : "text-red-400";
              const statusBg = status === "on-time" ? "bg-green-500/10 border-green-500/20" : status === "mixed" ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";
              const statusLabel = status === "on-time" ? "Consistently On Time" : status === "mixed" ? "Mixed Performance" : "Often Delayed";
              const stationColor = colorMap[station.color] || "hsl(38,96%,58%)";

              return (
                <motion.div
                  key={station.id}
                  className="bg-card rounded-2xl border border-border p-5 space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: stationColor }} />
                      <h3 className="font-semibold text-sm">{station.name}</h3>
                    </div>
                    <span className={cn("flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border", statusBg, statusColor)}>
                      <StatusIcon className="h-3 w-3" />
                      {statusLabel}
                    </span>
                  </div>

                  {/* Big completion number */}
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold">{rate}%</span>
                    <span className="text-sm text-muted-foreground mb-1">avg item completion</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: stationColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${rate}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  </div>

                  {/* Secondary stats */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="text-center">
                      <p className="text-lg font-bold">{totalLists}</p>
                      <p className="text-[10px] text-muted-foreground">Total Lists</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-400">{completedLists}</p>
                      <p className="text-[10px] text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-400">{totalLists - completedLists}</p>
                      <p className="text-[10px] text-muted-foreground">Incomplete</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Summary table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Summary Table</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left px-5 py-3 font-medium">Station</th>
                    <th className="text-center px-4 py-3 font-medium">Lists</th>
                    <th className="text-center px-4 py-3 font-medium">Completed</th>
                    <th className="text-center px-4 py-3 font-medium">List Completion</th>
                    <th className="text-center px-4 py-3 font-medium">Avg Item %</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stationStats.map(({ station, totalLists, completedLists, completionRate, avgItemCompletion }) => {
                    const rate = avgItemCompletion ?? 0;
                    const status = rate >= 80 ? "on-time" : rate >= 50 ? "mixed" : "delayed";
                    return (
                      <tr key={station.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorMap[station.color] || "hsl(38,96%,58%)" }} />
                            {station.name}
                          </div>
                        </td>
                        <td className="text-center px-4 py-3 text-muted-foreground">{totalLists}</td>
                        <td className="text-center px-4 py-3 text-muted-foreground">{completedLists}</td>
                        <td className="text-center px-4 py-3">
                          <span className={completionRate >= 80 ? "text-green-400" : completionRate >= 50 ? "text-amber-400" : "text-red-400"}>
                            {completionRate}%
                          </span>
                        </td>
                        <td className="text-center px-4 py-3">
                          <span className={rate >= 80 ? "text-green-400" : rate >= 50 ? "text-amber-400" : "text-red-400"}>
                            {avgItemCompletion !== null ? `${avgItemCompletion}%` : "—"}
                          </span>
                        </td>
                        <td className="text-center px-4 py-3">
                          <span className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium",
                            status === "on-time" ? "bg-green-500/10 text-green-400" :
                            status === "mixed" ? "bg-amber-500/10 text-amber-400" :
                            "bg-red-500/10 text-red-400"
                          )}>
                            {status === "on-time" ? "On Time" : status === "mixed" ? "Mixed" : "Delayed"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}