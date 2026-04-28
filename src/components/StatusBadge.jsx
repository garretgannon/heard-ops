import { cn } from "@/lib/utils";

const statusStyles = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  active: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
};

const statusLabels = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  pending: "Pending",
  in_progress: "In Progress",
};

export default function StatusBadge({ status, className }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
      statusStyles[status] || statusStyles.draft,
      className
    )}>
      {statusLabels[status] || status}
    </span>
  );
}