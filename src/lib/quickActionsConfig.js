import { FileText, ListPlus, ChefHat, Trash2, AlertTriangle } from "lucide-react";

export const quickActionsConfig = [
  {
    id: "quick-log",
    label: "Manager Log",
    icon: FileText,
    targetModal: "quick-log",
    description: "Quick shift note or incident log",
  },
  {
    id: "add-task",
    label: "Add Task",
    icon: ListPlus,
    targetModal: "add-task",
    description: "Create a new task",
  },
  {
    id: "add-prep",
    label: "Update Prep",
    icon: ChefHat,
    targetModal: "add-prep",
    description: "Add or update prep item",
  },
  {
    id: "add-waste",
    label: "Log Waste",
    icon: Trash2,
    targetModal: "add-waste",
    description: "Log waste or 86 item",
  },
  {
    id: "add-issue",
    label: "Report Issue",
    icon: AlertTriangle,
    targetModal: "add-issue",
    description: "Report an issue or maintenance",
  },
];