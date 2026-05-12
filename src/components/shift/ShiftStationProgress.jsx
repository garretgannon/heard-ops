const STATIONS = [
  'Prep',
  'Grill',
  'Pantry',
  'Dish',
  'Bar',
  'Server',
  'Host',
  'Expo',
];

export default function ShiftStationProgress({ tasks }) {
  const stationStats = STATIONS.map((station) => {
    const stationTasks = tasks.filter((t) => t.station === station);
    const completed = stationTasks.filter((t) => ['complete', 'approved'].includes(t.status)).length;
    const total = stationTasks.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const overdue = stationTasks.filter((t) => t.status === 'overdue').length;
    const review = stationTasks.filter((t) => t.status === 'needs_review').length;

    return { station, completed, total, pct, overdue, review };
  }).filter((s) => s.total > 0);

  return (
    <div className="rounded-xl border border-border/30 card-glass p-4">
      <h3 className="font-bold text-foreground text-sm mb-3">Station Progress</h3>
      <div className="space-y-2">
        {stationStats.length === 0 ? (
          <p className="text-xs text-muted-foreground">No station assignments</p>
        ) : (
          stationStats.map((s) => (
            <div
              key={s.station}
              className="p-2 rounded-lg bg-muted/40 border border-border/30 hover:border-border/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground">{s.station}</span>
                <span className="text-[10px] font-bold text-primary">{s.pct}%</span>
              </div>
              <div className="h-1 rounded-full bg-border/40 overflow-hidden mb-1">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                <span>{s.completed}/{s.total}</span>
                {s.overdue > 0 && <span className="text-red-400">📍 {s.overdue}</span>}
                {s.review > 0 && <span className="text-purple-400">👁 {s.review}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}