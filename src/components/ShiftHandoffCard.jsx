import { ChevronRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const TAG_COLORS = {
  FOH: "bg-blue-500/20 text-blue-700",
  BOH: "bg-orange-500/20 text-orange-700",
  Bar: "bg-purple-500/20 text-purple-700",
  Maintenance: "bg-yellow-500/20 text-yellow-700",
  Cash: "bg-green-500/20 text-green-700",
  Guest: "bg-cyan-500/20 text-cyan-700",
  Staff: "bg-pink-500/20 text-pink-700",
  Urgent: "bg-red-500/20 text-red-700",
};

export default function ShiftHandoffCard({ handoff }) {
  if (!handoff) {
    return (
      <div className="bg-card border-2 border-border rounded-xl p-6 text-center text-muted-foreground">
        No shift handoffs logged yet.
      </div>
    );
  }

  const sections = [
    { label: "Items 86'd", value: handoff.items_86d },
    { label: "Staff Issues", value: handoff.staff_issues },
    { label: "Guest Issues", value: handoff.guest_issues },
    { label: "Maintenance", value: handoff.maintenance_problems },
    { label: "Cash Issues", value: handoff.cash_issues },
    { label: "Prep Concerns", value: handoff.prep_concerns },
    { label: "Vendor Issues", value: handoff.vendor_issues },
    { label: "Reservations to Watch", value: handoff.reservations_to_watch },
    { label: "Notes for Next Manager", value: handoff.notes_for_next_manager },
  ];

  const hasUrgent = handoff.tags?.includes("Urgent");
  const filledSections = sections.filter(s => s.value).length;

  return (
    <Link to="/shift">
      <div
        className={cn(
          "bg-card border-2 rounded-xl p-6 hover:bg-secondary/20 transition-colors cursor-pointer",
          hasUrgent ? "border-red-500/50" : "border-border"
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold flex items-center gap-2">
              {hasUrgent && <AlertTriangle className="h-4 w-4 text-red-500" />}
              {handoff.shift.charAt(0).toUpperCase() + handoff.shift.slice(1)} Shift Handoff
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {handoff.date} • {handoff.logged_by}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {handoff.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {handoff.tags.map(tag => (
              <span
                key={tag}
                className={cn("px-2 py-0.5 rounded text-xs font-semibold", TAG_COLORS[tag])}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          {sections.slice(0, 3).map(
            section =>
              section.value && (
                <div key={section.label}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{section.label}</p>
                  <p className="text-sm line-clamp-2">{section.value}</p>
                </div>
              )
          )}
        </div>

        {filledSections > 3 && (
          <p className="text-xs text-primary mt-3 font-semibold">+{filledSections - 3} more sections →</p>
        )}
      </div>
    </Link>
  );
}
