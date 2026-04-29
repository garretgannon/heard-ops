import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JobCodeSelector({ allCodes, selected = [], onChange, saving }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (value) => {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    onChange(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={saving}
        className="flex items-center gap-1.5 min-w-[160px] max-w-xs h-8 px-3 rounded-lg border border-border bg-background text-xs text-left hover:border-ring transition-colors disabled:opacity-50"
      >
        <span className="flex-1 flex flex-wrap gap-1 overflow-hidden">
          {selected.length === 0
            ? <span className="text-muted-foreground">Assign job codes…</span>
            : selected.map(v => {
                const code = allCodes.find(c => c.value === v);
                return (
                  <span key={v} className="bg-primary/15 text-primary rounded-full px-2 py-0.5 flex items-center gap-1">
                    {code?.label || v}
                    <span
                      role="button"
                      className="hover:text-destructive cursor-pointer"
                      onMouseDown={e => { e.stopPropagation(); toggle(v); }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </span>
                  </span>
                );
              })
          }
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-48 bg-popover border border-border rounded-xl shadow-lg py-1 max-h-56 overflow-y-auto">
          {allCodes.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">No job codes yet.</p>
          )}
          {allCodes.map(code => (
            <button
              key={code.value}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary transition-colors text-left"
              onClick={() => toggle(code.value)}
            >
              <span className={cn(
                "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                selected.includes(code.value) ? "bg-primary border-primary" : "border-border"
              )}>
                {selected.includes(code.value) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
              </span>
              {code.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}