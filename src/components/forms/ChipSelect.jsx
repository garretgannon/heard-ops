import { cn } from "@/lib/utils";

export function ChipSelect({ options, value, onChange, multi = false, className }) {
  const selected = multi ? (Array.isArray(value) ? value : []) : value;

  const toggle = (v) => {
    if (multi) {
      if (selected.includes(v)) onChange(selected.filter(s => s !== v));
      else onChange([...selected, v]);
    } else {
      onChange(v === selected ? "" : v);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map(opt => {
        const isSelected = multi ? selected.includes(opt.value) : selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground"
            )}
          >
            {opt.icon && <span className="mr-1.5">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function YesNo({ value, onChange, yesLabel = "Yes", noLabel = "No" }) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 py-3.5 rounded-xl text-sm font-bold border-2 transition-all active:scale-95",
          value === true ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
        )}
      >
        ✓ {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 py-3.5 rounded-xl text-sm font-bold border-2 transition-all active:scale-95",
          value === false ? "bg-destructive/20 text-destructive border-destructive/50" : "bg-card border-border"
        )}
      >
        ✕ {noLabel}
      </button>
    </div>
  );
}

export function StepHeader({ step, total, title, subtitle }) {
  return (
    <div className="space-y-3 pb-4 border-b border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Step {step} of {total}</span>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={cn("h-1.5 w-6 rounded-full transition-colors", i < step ? "bg-primary" : "bg-border")} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export function BigInput({ label, placeholder, value, onChange, type = "text", required }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-bold text-foreground">{label}{required && " *"}</label>}
      <input
        type={type}
        inputMode={type === "number" ? "numeric" : "text"}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-14 px-4 rounded-xl border-2 border-input bg-card text-base font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}

export function BigTextarea({ label, placeholder, value, onChange }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-bold text-foreground">{label}</label>}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="w-full px-4 py-3.5 rounded-xl border-2 border-input bg-card text-base font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
      />
      <p className="text-xs text-muted-foreground">💡 Tap and hold to use voice dictation</p>
    </div>
  );
}

export function StickyNav({ step, total, onBack, onNext, onSubmit, saving, canNext = true }) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background pt-4 pb-2 border-t border-border mt-6">
      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={onBack}
            className="h-14 px-6 rounded-xl border-2 border-border font-bold text-sm active:scale-95 transition-all"
          >
            ← Back
          </button>
        )}
        {step < total ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="flex-1 h-14 rounded-xl bg-primary text-primary-foreground font-bold text-base active:scale-95 transition-all disabled:opacity-40"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving || !canNext}
            className="flex-1 h-14 rounded-xl bg-primary text-primary-foreground font-bold text-base active:scale-95 transition-all disabled:opacity-40"
          >
            {saving ? "Saving…" : "Submit ✓"}
          </button>
        )}
      </div>
    </div>
  );
}