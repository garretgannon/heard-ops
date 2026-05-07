import {
  FileText, AlertTriangle, Thermometer, Utensils, Flame, Wind,
  ClipboardList, ListFilter, Wrench, ShieldAlert, User, Coffee,
  ClipboardCheck, MessageSquareWarning, ArrowRightLeft, Droplets,
} from "lucide-react";

export const LOG_TYPES = {
  temperature:    { label: "Temp Log",      icon: Thermometer,          color: "text-cyan-400",    bg: "bg-cyan-500/15",    border: "border-l-cyan-500",    dot: "bg-cyan-500",    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",    routePath: "/temp-logs" },
  bathroom:       { label: "Bathroom",       icon: Droplets,             color: "text-purple-400",  bg: "bg-purple-500/15",  border: "border-l-purple-500",  dot: "bg-purple-500",  badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", routePath: "/more" },
  maintenance:    { label: "Maintenance",    icon: Wrench,               color: "text-amber-400",   bg: "bg-amber-400/15",   border: "border-l-amber-400",   dot: "bg-amber-400",   badge: "bg-amber-400/20 text-amber-300 border-amber-400/30",   routePath: "/issues" },
  incident:       { label: "Incident",       icon: ShieldAlert,          color: "text-red-400",     bg: "bg-red-500/15",     border: "border-l-red-500",     dot: "bg-red-500",     badge: "bg-red-500/20 text-red-300 border-red-500/30",        routePath: "/issues" },
  employee:       { label: "Employee",       icon: User,                 color: "text-pink-400",    bg: "bg-pink-500/15",    border: "border-l-pink-500",    dot: "bg-pink-500",    badge: "bg-pink-500/20 text-pink-300 border-pink-500/30",     routePath: "/team" },
  manager:        { label: "Manager Note",   icon: Coffee,               color: "text-orange-400",  bg: "bg-orange-500/15",  border: "border-l-orange-500",  dot: "bg-orange-500",  badge: "bg-orange-500/20 text-orange-300 border-orange-500/30", routePath: "/logs" },
  food_safety:    { label: "Food Safety",    icon: ClipboardCheck,       color: "text-teal-400",    bg: "bg-teal-500/15",    border: "border-l-teal-500",    dot: "bg-teal-500",    badge: "bg-teal-500/20 text-teal-300 border-teal-500/30",     routePath: "/temp-logs" },
  cleaning:       { label: "Cleaning",       icon: Wind,                 color: "text-green-400",   bg: "bg-green-500/15",   border: "border-l-green-500",   dot: "bg-green-500",   badge: "bg-green-500/20 text-green-300 border-green-500/30",  routePath: "/cleaning" },
  waste:          { label: "Waste",          icon: Flame,                color: "text-yellow-500",  bg: "bg-yellow-600/15",  border: "border-l-yellow-600",  dot: "bg-yellow-600",  badge: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30", routePath: "/waste-86" },
  eighty_six:     { label: "86'd",           icon: Utensils,             color: "text-orange-500",  bg: "bg-orange-600/15",  border: "border-l-orange-600",  dot: "bg-orange-600",  badge: "bg-orange-600/20 text-orange-400 border-orange-600/30", routePath: "/waste-86" },
  equipment:      { label: "Equipment",      icon: Wrench,               color: "text-sky-400",     bg: "bg-sky-500/15",     border: "border-l-sky-500",     dot: "bg-sky-500",     badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",        routePath: "/issues" },
  guest_complaint:{ label: "Guest Complaint",icon: MessageSquareWarning, color: "text-rose-400",    bg: "bg-rose-500/15",    border: "border-l-rose-500",    dot: "bg-rose-500",    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",     routePath: "/issues" },
  shift_handoff:  { label: "Shift Handoff",  icon: ArrowRightLeft,       color: "text-indigo-400",  bg: "bg-indigo-500/15",  border: "border-l-indigo-500",  dot: "bg-indigo-500",  badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", routePath: "/shift-handoff" },
  issue:          { label: "Issue",          icon: AlertTriangle,        color: "text-red-400",     bg: "bg-red-500/15",     border: "border-l-red-500",     dot: "bg-red-500",     badge: "bg-red-500/20 text-red-300 border-red-500/30",        routePath: "/issues" },
  prep:           { label: "Prep",           icon: ClipboardList,        color: "text-violet-400",  bg: "bg-violet-500/15",  border: "border-l-violet-500",  dot: "bg-violet-500",  badge: "bg-violet-500/20 text-violet-300 border-violet-500/30", routePath: "/prep-lists" },
  side_work:      { label: "Side Work",      icon: ListFilter,           color: "text-pink-400",    bg: "bg-pink-400/15",    border: "border-l-pink-400",    dot: "bg-pink-400",    badge: "bg-pink-400/20 text-pink-300 border-pink-400/30",     routePath: "/side-work" },
};

export const STATUS_META = {
  completed:    { label: "Done",        cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  approved:     { label: "Approved",    cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  flagged:      { label: "Flagged",     cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  overdue:      { label: "Overdue",     cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  needs_review: { label: "Review",      cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  open:         { label: "Open",        cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  in_progress:  { label: "In Progress", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  not_started:  { label: "Pending",     cls: "bg-muted/80 text-muted-foreground border-border" },
  active:       { label: "Active",      cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  resolved:     { label: "Resolved",    cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  failed:       { label: "Failed",      cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  passed:       { label: "Passed",      cls: "bg-green-500/15 text-green-400 border-green-500/30" },
};

/** Normalize any raw entity into a unified log shape */
export function mapLog(raw, type) {
  const cfg = LOG_TYPES[type] || LOG_TYPES.issue;
  let title = "", subtitle = "", ts = "", status = "open", priority = "", location = "", person = "", department = "", station = "", area = "", equipment = "", notes = "", assignedTo = "", tags = [];

  switch (type) {
    case "temperature":
      title     = raw.equipmentName || raw.locationName || "Temp Log";
      subtitle  = raw.temperature != null ? `${raw.temperature}°F` : "";
      ts        = raw.logged_at || raw.created_date;
      status    = raw.is_out_of_range ? "flagged" : "completed";
      station   = raw.station || "";
      area      = raw.area || "";
      equipment = raw.equipmentName || "";
      notes     = raw.notes || "";
      person    = raw.logged_by || raw.created_by || "";
      break;
    case "waste":
      title    = raw.itemName || "Waste Entry";
      subtitle = raw.reason || "";
      ts       = raw.created_date;
      status   = "completed";
      person   = raw.wastedBy || raw.created_by || "";
      notes    = raw.notes || "";
      break;
    case "eighty_six":
      title    = raw.itemName || "86'd Item";
      subtitle = raw.reason || "";
      ts       = raw.marked_at || raw.created_date;
      status   = raw.isResolved ? "resolved" : "active";
      station  = raw.station || "";
      person   = raw.created_by || "";
      break;
    case "cleaning":
      title     = raw.name || raw.taskName || "Cleaning Task";
      subtitle  = raw.station || "";
      ts        = raw.completedAt || raw.updated_date || raw.created_date;
      status    = raw.status === "completed" ? "completed" : raw.status === "skipped" ? "flagged" : "open";
      station   = raw.station || "";
      area      = raw.area || "";
      person    = raw.completedBy || raw.created_by || "";
      notes     = raw.notes || "";
      break;
    case "prep":
      title    = raw.name || raw.itemName || "Prep Task";
      subtitle = raw.station || "";
      ts       = raw.updated_date || raw.created_date;
      status   = raw.status || "open";
      station  = raw.station || "";
      person   = raw.created_by || "";
      priority = raw.priority || "";
      notes    = raw.notes || "";
      break;
    case "side_work":
      title    = raw.name || raw.taskName || "Side Work";
      subtitle = raw.station || "";
      ts       = raw.updated_date || raw.created_date;
      status   = raw.status || "open";
      station  = raw.station || "";
      person   = raw.created_by || "";
      notes    = raw.notes || "";
      break;
    case "issue":
      title      = raw.title || raw.description || "Issue";
      subtitle   = raw.type || "";
      ts         = raw.created_date;
      status     = raw.status || "open";
      priority   = raw.priority || "";
      person     = raw.reportedBy || raw.created_by || "";
      station    = raw.station || "";
      area       = raw.area || "";
      equipment  = raw.equipmentName || "";
      notes      = raw.description || raw.notes || "";
      assignedTo = raw.assignedTo || "";
      tags       = raw.tags || [];
      department = raw.department || "";
      break;
    case "manager":
      title      = raw.title || raw.content?.slice(0, 60) || "Manager Note";
      subtitle   = raw.shift || "";
      ts         = raw.created_date;
      status     = raw.status || "completed";
      priority   = raw.priority || "";
      person     = raw.created_by || "";
      department = raw.department || "";
      notes      = raw.content || raw.notes || "";
      tags       = raw.tags || [];
      break;
    default:
      title  = raw.title || raw.name || "Log";
      ts     = raw.created_date;
      status = raw.status || "open";
      person = raw.created_by || "";
      notes  = raw.notes || raw.description || "";
  }

  return {
    id:          raw.id,
    type,
    title,
    subtitle,
    ts,
    status,
    priority,
    location,
    person,
    department:  department || raw.department || "",
    station,
    area,
    equipment,
    notes,
    assignedTo,
    tags,
    routePath:   cfg.routePath,
    hasPhoto:    !!(raw.photoUrl || raw.photo_url || raw.imageUrl),
    requiresReview: !!(raw.requiresManagerReview || status === "needs_review"),
    _raw:        raw,
  };
}