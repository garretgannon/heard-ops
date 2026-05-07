const CATEGORIES = ['prep', 'sidework', 'temperature', 'cleaning', 'handoff', 'manager_note'];

export default function ShiftCategoryProgress({ tasks }) {
  const categoryStats = CATEGORIES.map((cat) => {
    const catTasks = tasks.filter((t) => t.type === cat);
    const completed = catTasks.filter((t) => ['complete', 'approved'].includes(t.status)).length;
    const overdue = catTasks.filter((t) => t.status === 'overdue').length;
    const total = catTasks.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const catLabel = {
      prep: '🔪 Prep',
      sidework: '🧹 Side Work',
      temperature: '🌡️ Temperature',
      cleaning: '🧹 Cleaning',
      handoff: '🔄 Handoff',
      manager_note: '📝 Manager',
    }[cat];

    return { cat, catLabel, completed, total, pct, overdue };
  }).filter((s) => s.total > 0);

  return (
    <div className="rounded-xl border border-border/30 bg-card p-4">
      <h3 className="font-bold text-foreground text-sm mb-3">Category Progress</h3>
      <div className="space-y-3">
        {categoryStats.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tasks assigned</p>
        ) : (
          categoryStats.map((s) => (
            <div key={s.cat}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground">{s.catLabel}</span>
                <div className="text-[10px] text-muted-foreground">
                  <span className="font-bold">{s.completed}/{s.total}</span>
                  {s.overdue > 0 && <span className="text-red-400 ml-2">📍 {s.overdue} overdue</span>}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}