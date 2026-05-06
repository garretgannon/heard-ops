import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/hooks/useToast";
import { X, Plus, CheckCircle2 } from "lucide-react";

export default function UpdateQuantitySheet({ task, onClose, onSuccess }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [manualQty, setManualQty] = useState("");

  if (!task) return null;

  const current = task._raw?.completed_qty || 0;
  const needed = parseFloat(task._raw?.quantity) || 1;
  const unit = task._raw?.unit || "";

  const save = async (newQty, complete = false) => {
    setSubmitting(true);
    const clamped = Math.min(newQty, needed);
    const updates = {
      completed_qty: clamped,
      status: complete || clamped >= needed ? "completed" : "in_progress",
    };
    if (complete || clamped >= needed) {
      updates.completed_at = new Date().toISOString();
    }
    await base44.entities.PrepItem.update(task.id, updates);
    toast(complete || clamped >= needed ? "Prep item completed ✓" : "Quantity updated");
    onSuccess?.();
    onClose();
    setSubmitting(false);
  };

  const bump = (delta) => save(current + delta);
  const markComplete = () => save(needed, true);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <div className="w-full sm:max-w-lg bg-card rounded-t-3xl border border-border flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <p className="text-sm font-bold text-foreground">{task.name}</p>
            <p className="text-xs text-muted-foreground">{task.station} · Update Quantity</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Progress display */}
          <div className="bg-muted rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-foreground">
              {current}
              <span className="text-lg text-muted-foreground"> / {needed} {unit}</span>
            </p>
            <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min((current / needed) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{Math.round((current / needed) * 100)}% complete</p>
          </div>

          {/* Quick bump buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 5, 10].map(delta => (
              <button
                key={delta}
                onClick={() => bump(delta)}
                disabled={submitting || current >= needed}
                className="h-12 rounded-xl bg-muted border border-border font-bold text-sm flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                {delta} {unit}
              </button>
            ))}
          </div>

          {/* Manual entry */}
          <div className="flex gap-2">
            <input
              type="number"
              value={manualQty}
              onChange={e => setManualQty(e.target.value)}
              placeholder={`Set qty (${unit})`}
              min="0"
              max={needed}
              step="0.1"
              className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => { if (manualQty) save(parseFloat(manualQty)); }}
              disabled={submitting || !manualQty}
              className="px-4 py-2.5 rounded-lg bg-muted border border-border font-bold text-sm active:scale-95 disabled:opacity-40"
            >
              Set
            </button>
          </div>

          {/* Mark complete */}
          <button
            onClick={markComplete}
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark Complete
          </button>

          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold text-sm active:scale-95">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}