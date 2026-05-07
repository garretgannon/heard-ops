import { cn } from "@/lib/utils";
import LogCard from "./LogCard";
import { CheckCircle2 } from "lucide-react";

const SECTIONS = [
  {
    id: "flagged_overdue",
    label: "🚨 Flagged & Overdue",
    match: l => l.status === "flagged" || l.status === "overdue",
  },
  {
    id: "needs_review",
    label: "🔍 Pending Manager Review",
    match: l => l.status === "needs_review",
  },
  {
    id: "open_issues",
    label: "⚠️ Open Issues & Incidents",
    match: l => ["issue","incident","maintenance","equipment","guest_complaint"].includes(l.type) && ["open","in_progress"].includes(l.status),
  },
  {
    id: "failed_temps",
    label: "🌡️ Failed Temps & Food Safety",
    match: l => ["temperature","food_safety"].includes(l.type) && (l.status === "flagged" || l.status === "overdue"),
  },
];

export default function LogsReviewView({ logs, onLogClick, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = SECTIONS.map(s => ({ ...s, items: logs.filter(s.match) })).filter(s => s.items.length > 0);
  const total = sections.reduce((n, s) => n + s.items.length, 0);

  if (sections.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-400 opacity-60" />
        <p className="text-sm font-bold text-foreground">All clear!</p>
        <p className="text-xs mt-1 text-muted-foreground">No logs need review right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
        <p className="text-sm font-bold text-amber-400">{total} item{total !== 1 ? "s" : ""} need attention</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sections.length} categor{sections.length !== 1 ? "ies" : "y"} with pending items</p>
      </div>
      {sections.map(s => (
        <div key={s.id}>
          <p className="text-xs font-bold text-muted-foreground mb-2 px-1">{s.label} · {s.items.length}</p>
          <div className="space-y-2">
            {s.items.map(log => <LogCard key={`${log.type}-${log.id}`} log={log} onClick={onLogClick} />)}
          </div>
        </div>
      ))}
    </div>
  );
}