/**
 * Centralized Quick Actions Configuration
 * Used by Today page and any other page that needs quick actions
 */

import { FileText, CheckCircle2, Droplet, ClipboardList, AlertTriangle, Wrench } from "lucide-react";

export const quickActionsConfig = [
  {
    id: "quick-log",
    label: "Log",
    icon: FileText,
    modalId: "quick-log-modal",
    entityType: "Log",
    description: "Quick temperature or incident log",
  },
  {
    id: "add-task",
    label: "Task",
    icon: CheckCircle2,
    modalId: "add-task-modal",
    entityType: "Task",
    description: "Create a new task",
  },
  {
    id: "add-prep",
    label: "Prep",
    icon: ClipboardList,
    modalId: "add-prep-modal",
    entityType: "PrepItem",
    description: "Add prep item",
  },
  {
    id: "add-waste",
    label: "Waste",
    icon: Droplet,
    modalId: "add-waste-modal",
    entityType: "WasteEntry",
    description: "Log waste or 86 item",
  },
  {
    id: "add-issue",
    label: "Issue",
    icon: AlertTriangle,
    modalId: "add-issue-modal",
    entityType: "Issue",
    description: "Report an issue or maintenance",
  },
];