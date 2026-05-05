import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Package, Trash2, X, Plus, TrendingDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function InventoryControl() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [waste, setWaste] = useState([]);
  const [eighty6, setEighty6] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.InventoryItem.list("-updated_date", 300),
      base44.entities.WasteEntry.list("-logged_at", 100),
      base44.entities.EightySixItem.filter({ is_active: true }),
    ]).then(([inv, w, e6]) => {
      setInventory(inv);
      setWaste(w);
      setEighty6(e6);
      setLoading(false);
    });
  }, []);

  const lowStockItems = inventory.filter(item => {
    if (!item.par_level || item.par_level === 0) return false;
    return item.current_stock < item.par_level;
  });

  const criticalItems = lowStockItems.filter(item => item.current_stock / item.par_level <= 0.25);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const wasteToday = waste.filter(w => (w.logged_at || w.created_date || "").startsWith(todayStr));
  const wasteTodayDollars = wasteToday.reduce((sum, w) => sum + (w.dollar_value || 0), 0);

  const lowStockAlerts = lowStockItems.map(item => ({
    type: "low_stock",
    id: item.id,
    name: item.name,
    current: item.current_stock,
    par: item.par_level,
    category: item.category,
    severity: item.current_stock / item.par_level <= 0.25 ? "critical" : "low",
    unit: item.unit,
  }));

  const eighty6Alerts = eighty6.map(item => ({
    type: "86",
    id: item.id,
    name: item.item_name,
    reason: item.reason,
    marked_at: item.marked_at,
  }));

  const wasteAlerts = wasteToday.map(item => ({
    type: "waste",
    id: item.id,
    name: item.item_name,
    amount: item.quantity,
    unit: item.unit,
    reason: item.reason,
    value: item.dollar_value || 0,
  }));

  const allAlerts = [...lowStockAlerts, ...eighty6Alerts, ...wasteAlerts].sort((a, b) => {
    const aOrder = a.severity === "critical" || a.type === "86" ? 0 : 1;
    const bOrder = b.severity === "critical" || b.type === "86" ? 0 : 1;
    return aOrder - bOrder;
  });

  const lossMap = {};
  waste.forEach(w => {
    if (w.dollar_value > 0) lossMap[w.item_name] = (lossMap[w.item_name] || 0) + w.dollar_value;
  });
  const topLoss = Object.entries(lossMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[480px] flex flex-col gap-1 pb-32">
      {/* Header */}
      <div className="flex items-center gap-2 pt-1 pb-0.5">
        <button onClick={() => navigate("/more")} className="h-7 w-7 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center shrink-0 active:scale-95">
          <ChevronLeft className="h-3 w-3 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-extrabold text-white tracking-tight leading-tight">Inventory Control</h1>
          <p className="text-[9px] text-gray-600 mt-0 truncate">Track stock, prevent shortages, reduce waste</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-1">
        <MetricCard label="Low Stock" value={lowStockItems.length} alert={criticalItems.length > 0} color={criticalItems.length > 0 ? "text-red-400" : "text-amber-400"} />
        <MetricCard label="86'd" value={eighty6.length} color={eighty6.length > 0 ? "text-red-400" : "text-gray-600"} />
        <MetricCard label="Waste $" value={`$${wasteTodayDollars.toFixed(0)}`} alert={wasteTodayDollars > 50} color="text-orange-400" />
        <MetricCard label="Orders" value="0" color="text-blue-400" />
      </div>

      {/* NEEDS ATTENTION */}
      {allAlerts.length > 0 ? (
        <div>
          <div className="flex items-center gap-1 mb-1 px-0.5">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-500">Alerts ({allAlerts.length})</p>
          </div>
          <div className="flex flex-col gap-0.5">
            {allAlerts.slice(0, 10).map(alert => (
              <AlertCard key={`${alert.type}-${alert.id}`} alert={alert} />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-2 py-1.5 bg-[#0D1117] border border-[#1F2937] rounded text-center">
          <p className="text-[11px] text-gray-600">All clear</p>
        </div>
      )}

      {/* LOW STOCK FOCUS */}
      {lowStockItems.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-1 px-0.5">
            <Package className="h-3 w-3 text-amber-400" />
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-500">Low Stock ({lowStockItems.length})</p>
          </div>
          <div className="flex flex-col gap-0.5">
            {lowStockItems.slice(0, 6).map(item => (
              <div key={item.id} className="flex items-center gap-1.5 px-2 py-1 bg-[#0D1117] border border-[#1F2937] rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                  <p className="text-[8px] text-gray-600 truncate">{item.current_stock}/{item.par_level} {item.unit}</p>
                </div>
                <button className="h-5 px-1.5 text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 rounded active:scale-95 shrink-0">
                  Order
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 86 BOARD */}
      {eighty6.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-1 px-0.5">
            <X className="h-3 w-3 text-red-400" />
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-500">86 Board ({eighty6.length})</p>
          </div>
          <div className="flex flex-col gap-0.5">
            {eighty6.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center gap-1.5 px-2 py-1 bg-red-950/20 border border-red-500/30 rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">{item.item_name}</p>
                  <p className="text-[8px] text-gray-500 truncate">{item.reason || "–"}</p>
                </div>
                <button className="h-5 px-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded active:scale-95 shrink-0">
                  Back
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WASTE SNAPSHOT */}
      {wasteToday.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-1 px-0.5">
            <Trash2 className="h-3 w-3 text-orange-400" />
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-500">Waste ({wasteToday.length})</p>
          </div>
          <div className="flex flex-col gap-0.5">
            {wasteToday.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center gap-1.5 px-2 py-1 bg-orange-950/20 border border-orange-500/30 rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">{item.item_name}</p>
                  <p className="text-[8px] text-gray-500 truncate">{item.reason} · {item.quantity}{item.unit}</p>
                </div>
                {item.dollar_value > 0 && (
                  <span className="text-[10px] font-bold text-red-400 shrink-0">${item.dollar_value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSIGHTS */}
      <div className="grid grid-cols-2 gap-1">
        <div className="bg-[#0D1117] border border-[#1F2937] rounded p-1.5">
          <p className="text-[8px] font-bold text-gray-600 uppercase tracking-wider mb-1">Top Loss</p>
          {topLoss.length === 0 ? (
            <p className="text-[8px] text-gray-700">–</p>
          ) : (
            topLoss.map(([name, val], i) => (
              <div key={name} className="flex items-center gap-0.5 mb-0.5 last:mb-0 min-w-0">
                <span className="text-[7px] text-gray-700 shrink-0">{i + 1}.</span>
                <span className="text-[9px] font-bold text-white truncate flex-1">{name}</span>
                <span className="text-[8px] font-bold text-red-400 shrink-0 tabular-nums">${val.toFixed(0)}</span>
              </div>
            ))
          )}
        </div>
        <div className="bg-[#0D1117] border border-[#1F2937] rounded p-1.5">
          <p className="text-[8px] font-bold text-gray-600 uppercase tracking-wider mb-1">Status</p>
          <div className="flex items-center justify-center h-8 gap-1 text-center">
            <span className="text-[9px] text-gray-500 leading-tight">See inventory page</span>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+6px)] right-3 z-40 flex flex-col gap-0.5 items-end lg:bottom-6">
        <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1F2937] border border-[#374151] text-white text-[9px] font-bold active:scale-95">
          <Plus className="h-2.5 w-2.5" /> 86
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1F2937] border border-[#374151] text-white text-[9px] font-bold active:scale-95">
          <Plus className="h-2.5 w-2.5" /> Waste
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold active:scale-95">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, alert, color }) {
  return (
    <div className={cn("flex flex-col items-center py-1.5 rounded border", alert ? "bg-red-950/30 border-red-500/40" : "bg-[#0D1117] border-[#1F2937]")}>
      <span className={cn("text-[14px] font-extrabold leading-none", color)}>{value}</span>
      <span className="text-[7px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

function AlertCard({ alert }) {
  if (alert.type === "low_stock") {
    const pct = alert.current / alert.par * 100;
    const isCritical = alert.severity === "critical";
    const badgeColor = isCritical ? "bg-red-500/15 text-red-400 border-red-500/40" : "bg-amber-500/15 text-amber-400 border-amber-500/40";
    return (
      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded border", isCritical ? "bg-red-950/30 border-red-500/40" : "bg-amber-950/15 border-amber-500/30")}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-[11px] font-bold text-white truncate">{alert.name}</p>
            <span className={cn("text-[7px] font-bold px-1 py-0.5 rounded border shrink-0", badgeColor)}>
              {isCritical ? "!" : "↓"}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex-1 h-1 bg-[#1A2235] rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", pct <= 25 ? "bg-red-500" : "bg-amber-500")} style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <span className="text-[8px] text-gray-600 shrink-0 tabular-nums">{Math.round(pct)}%</span>
          </div>
        </div>
        <button className="h-5 px-1.5 text-[8px] font-bold text-primary bg-primary/10 border border-primary/20 rounded active:scale-95 shrink-0">
          Order
        </button>
      </div>
    );
  } else if (alert.type === "86") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-950/30 border border-red-500/40 rounded">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-white truncate">{alert.name}</p>
          <p className="text-[8px] text-gray-500 truncate">{alert.reason || "–"}</p>
        </div>
        <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">86</span>
      </div>
    );
  } else if (alert.type === "waste") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-950/25 border border-orange-500/40 rounded">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-white truncate">{alert.name}</p>
          <p className="text-[8px] text-gray-500 truncate">{alert.reason} · {alert.amount}{alert.unit}</p>
        </div>
        {alert.value > 0 && <span className="text-[9px] font-bold text-red-400 shrink-0 tabular-nums">${alert.value}</span>}
      </div>
    );
  }
  return null;
}

export const hideBase44Index = true;