import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_TAGS = ["86 item", "Vendor issue", "Equipment down", "Staff note", "Safety concern"];

export default function ShiftHandoffReview({
  tasksCompletedPct = 0,
  logsCompletedPct = 0,
  issuesResolved = 0,
  onSubmit,
  isLoading = false,
  onBack,
}) {
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState(new Set());

  const toggleTag = (tag) => {
    const updated = new Set(selectedTags);
    if (updated.has(tag)) {
      updated.delete(tag);
    } else {
      updated.add(tag);
    }
    setSelectedTags(updated);
  };

  const handleSubmit = () => {
    const notesWithTags = selectedTags.size > 0
      ? `${notes}\n[${Array.from(selectedTags).join(", ")}]`
      : notes;
    onSubmit(notesWithTags);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">Shift Summary</h1>
        <p className="text-xs text-muted-foreground mt-1">Review today's performance</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-500/15 border border-blue-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{tasksCompletedPct}%</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Tasks Done</p>
        </div>
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{logsCompletedPct}%</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Logs Done</p>
        </div>
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{issuesResolved}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Issues</p>
        </div>
      </div>

      {/* Notes Input */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">Add Shift Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything important for the next shift..."
          rows={3}
          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-card text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Quick Tags */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-1.5">Quick Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "h-7 px-2.5 text-[10px] font-bold rounded-full border transition-all active:scale-95",
                selectedTags.has(tag)
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-card border-border text-muted-foreground hover:border-border/60"
              )}
            >
              {selectedTags.has(tag) && <span className="mr-1">✓</span>}
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 h-11 rounded-lg border border-border font-bold text-sm text-muted-foreground hover:bg-card transition-all"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Ending...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Submit and End Shift
            </>
          )}
        </button>
      </div>
    </div>
  );
}