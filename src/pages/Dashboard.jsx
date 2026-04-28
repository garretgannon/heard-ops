import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ClipboardList, UtensilsCrossed, CheckCircle2, Clock, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StationBadge from "../components/StationBadge";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const [stations, setStations] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, pl, pi] = await Promise.all([
        base44.entities.Station.list(),
        base44.entities.PrepList.list("-created_date", 50),
        base44.entities.PrepItem.list("-created_date", 200),
      ]);
      setStations(s);
      setPrepLists(pl);
      setPrepItems(pi);
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

  const todayStr = new Date().toISOString().split("T")[0];
  const todayLists = prepLists.filter(pl => pl.date === todayStr);
  const activeLists = prepLists.filter(pl => pl.status === "active");
  const totalItems = prepItems.length;
  const completedItems = prepItems.filter(pi => pi.status === "completed").length;

  const stats = [
    { label: "Stations", value: stations.length, icon: UtensilsCrossed, color: "text-blue-600 bg-blue-50", to: "/stations" },
    { label: "Today's Lists", value: todayLists.length, icon: ClipboardList, color: "text-primary bg-primary/10", to: "/prep-lists" },
    { label: "Active Lists", value: activeLists.length, icon: Clock, color: "text-amber-600 bg-amber-50", to: "/prep-lists" },
    { label: "Items Done", value: `${completedItems}/${totalItems}`, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50", to: "/prep-lists" },
  ];

  return (
    <div className="space-y-8">
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
        {stats.map(stat => (
          <Link key={stat.label} to={stat.to} className="block">
            <div className="bg-card rounded-2xl border border-border p-4 lg:p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
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
            {activeLists.slice(0, 5).map(pl => {
              const items = prepItems.filter(pi => pi.prep_list_id === pl.id);
              const done = items.filter(pi => pi.status === "completed").length;
              const station = stations.find(s => s.id === pl.station_id);
              const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

              return (
                <Link key={pl.id} to={`/prep-lists?id=${pl.id}`} className="block">
                  <div className="bg-card rounded-2xl border border-border p-4 lg:p-5 hover:shadow-md transition-shadow">
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
                          <div
                            className="h-full bg-accent rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Station Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Station Quick Access</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stations.map(s => (
            <Link key={s.id} to={`/station/${s.id}`}>
              <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-shadow text-center">
                <StationBadge name={s.name} color={s.color} className="mb-2" />
                <p className="text-xs text-muted-foreground mt-1">Tap to open station view</p>
              </div>
            </Link>
          ))}
          {stations.length === 0 && (
            <div className="col-span-full bg-card rounded-2xl border border-border p-8 text-center">
              <p className="text-muted-foreground text-sm">No stations yet. <Link to="/stations" className="text-primary hover:underline">Create your first station</Link></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}