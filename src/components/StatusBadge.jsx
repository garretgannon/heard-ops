import { cn } from "@/lib/utils";

const statusStyles = {
  draft: "status-neutral",
  active: "status-info",
  completed: "status-success",
  archived: "status-neutral",
  pending: "status-warning",
  in_progress: "status-info",
  overdue: "status-critical",
  failed: "status-critical",
  flagged: "status-critical",
  approved: "status-success",
  resolved: "status-success",
};

const statusLabels = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  pending: "Pending",
  in_progress: "In Progress",
  overdue: "Overdue",
  failed: "Failed",
  flagged: "Flagged",
  approved: "Approved",
  resolved: "Resolved",
};

export default function StatusBadge({ status, className }) {
  const label = statusLabels[status] || status || "Status";

  return (
    <span className={cn("status-pill", statusStyles[status] || "status-neutral", className)}>
      {label}
    </span>
  );
}
