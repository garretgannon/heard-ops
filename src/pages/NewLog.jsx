import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Check } from "lucide-react";
import { haptics } from "@/utils/haptics";
import { useToast } from "@/hooks/useToast";

export default function NewLog() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useCurrentUser();
  const [type, setType] = useState("temperature");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("°F");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const logTypes = [
    { id: "temperature", label: "Temperature", defaultUnit: "°F" },
    { id: "waste", label: "Waste", defaultUnit: "$" },
    { id: "incident", label: "Incident", defaultUnit: "" },
    { id: "safety", label: "Safety", defaultUnit: "" },
    { id: "manager_note", label: "Manager Note", defaultUnit: "" },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast("Please enter a title");
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Log.create({
        type,
        title: title.trim(),
        notes: notes.trim(),
        value: value ? parseFloat(value) : null,
        value_unit: unit,
        logged_by_email: user?.email,
        logged_by_name: user?.full_name,
        logged_at: new Date().toISOString(),
        status: "safe",
        shift_id: "current-shift",
        location_id: "default-location",
      });

      setSuccess(true);
      haptics.medium();
      setTimeout(() => {
        navigate(-1);
      }, 600);
    } catch (error) {
      console.error(error);
      toast("Failed to save log entry");
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate("/logs");
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-400" />
          </div>
          <p className="text-foreground font-bold">Log saved</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="w-full sm:max-w-lg max-h-[90dvh] bg-card rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden border border-border">
        
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Quick Log Entry</h2>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors text-foreground font-bold text-xl"
          >
            ×
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 pb-6 space-y-4">
          {/* Log Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Log Type</label>
            <div className="grid grid-cols-2 gap-2">
              {logTypes.map(lt => (
                <button
                  key={lt.id}
                  type="button"
                  onClick={() => {
                    setType(lt.id);
                    setUnit(lt.defaultUnit);
                  }}
                  className={`py-2.5 px-3 rounded-lg border font-bold text-sm transition-all ${
                    type === lt.id
                      ? "bg-primary/15 border-primary text-primary"
                      : "bg-muted border-border text-foreground hover:bg-muted/80"
                  }`}
                >
                  {lt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Walk-in cooler temperature"
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Value (if applicable) */}
          {(type === "temperature" || type === "waste") && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary-text uppercase">Value</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
                  step="0.1"
                  className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>°F</option>
                  <option>°C</option>
                  <option>$</option>
                  <option>lbs</option>
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={4}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Sticky Footer with Submit Button */}
        <div className="flex-shrink-0 flex flex-col gap-2 px-5 py-4 border-t border-border bg-card">
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            {submitting ? "Submitting..." : "Submit Entry"}
          </button>
          <button
            onClick={handleClose}
            type="button"
            className="w-full h-10 rounded-lg border border-border text-foreground font-bold text-sm active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;