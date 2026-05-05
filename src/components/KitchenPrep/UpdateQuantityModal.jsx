import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UpdateQuantityModal({ item, onSave, onClose }) {
  const [qty, setQty] = useState(item.completed_qty || 0);
  const max = item.quantity || 100;
  const percent = Math.round((qty / max) * 100);

  const handleQuickAdd = (amount) => {
    setQty(Math.min(qty + amount, max));
  };

  const handleSave = () => {
    onSave(qty);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="w-full bg-card border-t border-border rounded-t-2xl p-4 space-y-3 animate-in slide-in-from-bottom">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">{item.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{item.station_name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* QUANTITY DISPLAY */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] text-muted-foreground font-bold uppercase">Current</p>
            <p className="text-2xl font-bold text-foreground">
              {qty}<span className="text-lg text-muted-foreground ml-1">{item.unit}</span>
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Target: {max} {item.unit}
          </p>

          {/* PROGRESS BAR */}
          <div className="h-2.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-right font-semibold text-primary">{percent}%</p>
        </div>

        {/* QUICK BUTTONS */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handleQuickAdd(1)}
            disabled={qty >= max}
            className="h-10 bg-blue-500/10 text-blue-400 font-bold rounded-lg border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform text-sm"
          >
            +1
          </button>
          <button
            onClick={() => handleQuickAdd(5)}
            disabled={qty >= max}
            className="h-10 bg-blue-500/10 text-blue-400 font-bold rounded-lg border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform text-sm"
          >
            +5
          </button>
          <button
            onClick={() => handleQuickAdd(10)}
            disabled={qty >= max}
            className="h-10 bg-blue-500/10 text-blue-400 font-bold rounded-lg border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform text-sm"
          >
            +10
          </button>
        </div>

        {/* MANUAL ENTRY */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">Manual Entry</label>
          <div className="flex gap-1.5">
            <input
              type="number"
              min="0"
              max={max}
              value={qty}
              onChange={e => setQty(Math.min(parseInt(e.target.value) || 0, max))}
              className="flex-1 h-10 px-3 text-sm font-bold border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <select
              defaultValue={item.unit}
              className="h-10 px-2 text-xs font-bold border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option>{item.unit}</option>
            </select>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onClose}
            className="h-10 bg-muted text-foreground font-bold rounded-lg active:scale-95 transition-transform text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "h-10 font-bold rounded-lg active:scale-95 transition-transform text-sm",
              qty >= max
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-primary text-primary-foreground"
            )}
          >
            {qty >= max ? "Mark Complete" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}