import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Clock, Flag, Thermometer, Wrench } from "lucide-react";
import LogCard from "./LogCard";

const SECTIONS = [
  {
    id: "flagged",
    label: "Flagged / Critical",
    icon: Flag,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    match: l => l.status === "flagged" || l.priority === "critical",
  },
  {
    id: "needs_review",
    label: "Needs Manager Review",
    icon: Clock,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    match: l => l.status === "needs_review" || l.requiresReview,
  },
  {
    id: "overdue",
    label: "Overdue",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    match: l => l.status === "overdue",
  },
  {
    id: "open_issues",
    label: "Open Issues & Maintenance",
    icon: Wrench,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    match: l => (l.type === "issue" || l.type === "maintenance") && !["completed","approved","resolved"].includes(l.status),
  },
  {
    id: "failed_temps",
    label: "Failed Temperature Logs",
    icon: Thermometer,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    match: l => l.type === "temperature" && (l.status === "flagged" || l.status === "failed"),
  },
];

export default function ReviewView({ logs, onLogClick }) {
  const sections = SECTIONS.map(s => ({ ...s, items: logs.filter(s.match) })).filter(s => s.items.length > 0);
  const total    = sections.reduce((n, s) => n + s.items.length, 0);

  if (total === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-400 opacity-60" />
        <p className="text-sm font-bold text-foreground">All clear!</p>
        <p className="text-xs mt-1 text-muted-foreground">No logs need attention right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
        <p className="text-sm font-bold text-amber-400">{total} item{total !== 1 ? "s" : ""} need attention</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sections.length} categor{sections.length !== 1 ? "ies" : "y"}</p>
      </div>
      {sections.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.id} className="space-y-2">
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border", s.bg)}>
              <Icon className={cn("h-4 w-4 shrink-0", s.color)} />
              <p className={cn("text-sm font-bold", s.color)}>{s.label}</p>
              <span className={cn("ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-black/20", s.color)}>{s.items.length}</span>
            </div>
            <div className="space-y-1.5">
              {s.items.map(log => <LogCard key={`${log.type}-${log.id}`} log={log} onClick={onLogClick} compact />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}