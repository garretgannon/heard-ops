import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ArrowLeft, Check } from "lucide-react";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      });

      setSuccess(true);
      haptics.medium();
      setTimeout(() => {
        navigate("/logs");
        toast("Log entry saved");
      }, 500);
    } catch (error) {
      console.error(error);
      toast("Failed to save log entry");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <p className="text-foreground font-bold">Log saved</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate("/logs")}
          className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold">Quick Log Entry</h1>
        <div className="h-9 w-9" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
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
                    : "bg-card border-border text-foreground hover:bg-muted"
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
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="flex-1 px-3 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="px-3 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </form>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim()}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-lg transition-all active:scale-95"
        >
          {submitting ? "Saving..." : "Save Log Entry"}
        </button>
      </div>
    </div>
  );
}

export const hideBase44Index = true;