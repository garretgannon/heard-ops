import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChefHat, CheckCircle2, Circle, Camera } from "lucide-react";
import StationBadge from "../components/StationBadge";
import PrepItemCard from "../components/PrepItemCard";

export default function StationPrepView() {
  const { stationId } = useParams();
  const [station, setStation] = useState(null);
  const [prepLists, setPrepLists] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const load = async () => {
    const [s, pl, pi] = await Promise.all([
      base44.entities.Station.get(stationId),
      base44.entities.PrepList.filter({ station_id: stationId, status: "active" }),
      base44.entities.PrepItem.filter({ station_id: stationId }),
    ]);
    setStation(s);
    setPrepLists(pl);
    setPrepItems(pi);

    try {
      const me = await base44.auth.me();
      setUser(me);
    } catch {}

    setLoading(false);
  };

  useEffect(() => { load(); }, [stationId]);

  const handleItemUpdate = async (itemId, data) => {
    await base44.entities.PrepItem.update(itemId, data);
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Station not found.</p>
      </div>
    );
  }

  const activeItems = prepItems.filter(pi => {
    const pl = prepLists.find(l => l.id === pi.prep_list_id);
    return pl && pl.status === "active";
  });

  const pending = activeItems.filter(i => i.status !== "completed");
  const completed = activeItems.filter(i => i.status === "completed");
  const progress = activeItems.length > 0 ? Math.round((completed.length / activeItems.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">PrepFlow</span>
          </div>
          <StationBadge name={station.name} color={station.color} />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Progress */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Today's Progress</h2>
            <span className="text-2xl font-bold">{progress}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{completed.length} completed</span>
            <span>{pending.length} remaining</span>
          </div>
        </div>

        {activeItems.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No active prep items for this station.</p>
          </div>
        ) : (
          <>
            {/* Pending items */}
            {pending.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Circle className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">To Do ({pending.length})</h3>
                </div>
                <div className="space-y-2">
                  {pending.map(item => (
                    <PrepItemCard
                      key={item.id}
                      item={item}
                      prepList={prepLists.find(l => l.id === item.prep_list_id)}
                      userName={user?.full_name || user?.email || "Staff"}
                      onUpdate={handleItemUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed items */}
            {completed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Done ({completed.length})</h3>
                </div>
                <div className="space-y-2">
                  {completed.map(item => (
                    <PrepItemCard
                      key={item.id}
                      item={item}
                      prepList={prepLists.find(l => l.id === item.prep_list_id)}
                      userName={user?.full_name || user?.email || "Staff"}
                      onUpdate={handleItemUpdate}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}