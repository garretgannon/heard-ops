import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UpdateStatusModal({ task, onSave, onClose }) {
  const [status, setStatus] = useState(task.status || "pending");

  const statuses = [
    { id: "completed", label: "Mark Complete", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { id: "in_progress", label: "In Progress", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { id: "pending_review", label: "Needs Review", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  ];

  const handleSave = () => {
    onSave(status);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="w-full bg-card border-t border-border rounded-t-2xl p-4 space-y-3 animate-in slide-in-from-bottom">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">{task.task_name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{task.role_assignment}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* STATUS OPTIONS */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase">Task Status</p>
          <div className="grid grid-cols-1 gap-2">
            {statuses.map(opt => (
              <button
                key={opt.id}
                onClick={() => setStatus(opt.id)}
                className={cn(
                  "h-10 px-3 font-bold rounded-lg border text-sm transition-all active:scale-95",
                  status === opt.id
                    ? opt.color
                    : "bg-muted border-border text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="h-10 bg-muted text-foreground font-bold rounded-lg active:scale-95 transition-transform text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="h-10 bg-primary text-primary-foreground font-bold rounded-lg active:scale-95 transition-transform text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}