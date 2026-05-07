import { useState } from 'react';
import { Plus, Zap, AlertCircle, Clock } from 'lucide-react';

export default function DesktopGridLayout({ stats, tasks, logs, onQuickAction }) {
  const overdueItems = tasks.filter((t) => t.status === 'overdue').slice(0, 5);
  const reviewItems = logs.filter((l) => l.requires_review || l.review_status === 'pending').slice(0, 5);
  const openIncidents = logs.filter((l) => l.type === 'incident' && l.status === 'open').slice(0, 5);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Left: Priorities */}
      <div className="rounded-xl border border-border/30 bg-card p-5 space-y-3">
        <h3 className="font-bold text-foreground text-sm">Today's Priorities</h3>
        {overdueItems.length > 0 ? (
          <div className="space-y-2">
            {overdueItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.assigned_employee_name || 'Unassigned'}</p>
                </div>
                <span className="text-[10px] font-bold text-red-400 flex-shrink-0">OVERDUE</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No overdue items</p>
        )}
      </div>

      {/* Middle: Shift Progress */}
      <div className="rounded-xl border border-border/30 bg-card p-5 space-y-3">
        <h3 className="font-bold text-foreground text-sm">Shift Progress</h3>
        <div className="space-y-3">
          {/* Overall */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">Overall</span>
              <span className="text-xs font-bold text-primary">{stats.completionPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${stats.completionPct}%` }}
              />
            </div>
          </div>

          {/* Tasks */}
          <div>
            <span className="text-xs font-semibold text-foreground">Tasks</span>
            <p className="text-xs text-muted-foreground mt-1">{stats.completedCount}/{stats.totalCount}</p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="font-bold text-blue-400">{tasks.filter((t) => t.type === 'prep').length}</p>
              <p className="text-muted-foreground">Prep</p>
            </div>
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="font-bold text-yellow-400">{tasks.filter((t) => t.type === 'sidework').length}</p>
              <p className="text-muted-foreground">Side Work</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Manager Review */}
      <div className="rounded-xl border border-border/30 bg-card p-5 space-y-3">
        <h3 className="font-bold text-foreground text-sm">Needs Review</h3>
        {reviewItems.length > 0 ? (
          <div className="space-y-2">
            {reviewItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.employee_name || 'Unknown'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">All caught up!</p>
        )}
      </div>
    </div>
  );
}