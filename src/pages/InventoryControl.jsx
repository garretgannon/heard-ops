import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Package, Trash2, X, Plus, ShoppingCart, ChevronLeft, TrendingDown } from "lucide-react";
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

  // Calculate metrics
  const lowStockItems = inventory.filter(item => {
    if (!item.par_level || item.par_level === 0) return false;
    return item.current_stock < item.par_level;
  });

  const criticalItems = lowStockItems.filter(item => item.current_stock / item.par_level <= 0.25);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const wasteToday = waste.filter(w => (w.logged_at || w.created_date || "").startsWith(todayStr));
  const wasteTodayDollars = wasteToday.reduce((sum, w) => sum + (w.dollar_value || 0), 0);

  // Combine alerts: low stock, 86'd, high waste
  const lowStockAlerts = lowStockItems.map(item => ({
    type: "low_stock",
    id: item.id,
    name: item.name,
    current: item.current_stock,
    par: item.par_level,
    category: item.category,
    severity: item.current_stock / item.par_level <= 0.25 ? "critical" : "low",
    unit: item.unit,
    vendor: item.vendor,
  }));

  const eighty6Alerts = eighty6.map(item => ({
    type: "86",
    id: item.id,
    name: item.item_name,
    reason: item.reason,
    marked_at: item.marked_at,
    severity: item.severity === "high" ? "critical" : "warning",
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
    const severityOrder = { critical: 0, warning: 1, low: 2 };
    const aOrder = a.severity === "critical" ? 0 : a.type === "86" ? 1 : a.type === "waste" ? 2 : 3;
    const bOrder = b.severity === "critical" ? 0 : b.type === "86" ? 1 : b.type === "waste" ? 2 : 3;
    return aOrder - bOrder;
  });

  // Top loss items
  const lossMap = {};
  waste.forEach(w => {
    if (w.dollar_value > 0) lossMap[w.item_name] = (lossMap[w.item_name] || 0) + w.dollar_value;
  });
  const topLoss = Object.entries(lossMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const pendingOrders = 0; // placeholder

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[480px] flex flex-col gap-2 pb-32">
      {/* Header */}
      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => navigate("/more")} className="h-8 w-8 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center shrink-0">
          <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-extrabold text-white tracking-tight">Inventory Control</h1>
          <p className="text-[10px] text-gray-600 mt-0.5">Track stock, prevent shortages, reduce waste</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-1.5">
        <MetricCard label="Low Stock" value={lowStockItems.length} alert={criticalItems.length > 0} color={criticalItems.length > 0 ? "text-red-400" : "text-amber-400"} />
        <MetricCard label="86'd" value={eighty6.length} color={eighty6.length > 0 ? "text-red-400" : "text-gray-600"} />
        <MetricCard label="Waste $" value={`$${wasteTodayDollars.toFixed(0)}`} alert={wasteTodayDollars > 50} color="text-orange-400" />
        <MetricCard label="Orders" value={pendingOrders || "—"} color="text-blue-400" />
      </div>

      {/* NEEDS ATTENTION */}
      {allAlerts.length > 0 ? (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 px-1">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Needs Attention ({allAlerts.length})</p>
          </div>
          <div className="flex flex-col gap-1">
            {allAlerts.slice(0, 12).map(alert => (
              <AlertCard key={`${alert.type}-${alert.id}`} alert={alert} />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-center">
          <p className="text-[12px] text-gray-500">Inventory is in good shape</p>
        </div>
      )}

      {/* LOW STOCK FOCUS */}
      {lowStockItems.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 px-1">
            <Package className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Low Stock ({lowStockItems.length})</p>
          </div>
          <div className="flex flex-col gap-1">
            {lowStockItems.slice(0, 8).map(item => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 bg-[#111827] border border-[#1F2937] rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{item.name}</p>
                  <p className="text-[9px] text-gray-600">{item.current_stock}/{item.par_level} {item.unit} • {item.category}</p>
                </div>
                <button className="h-6 px-2 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded active:scale-95 shrink-0">
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
          <div className="flex items-center gap-1.5 mb-1.5 px-1">
            <X className="h-3.5 w-3.5 text-red-400" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">86 Board ({eighty6.length})</p>
          </div>
          <div className="flex flex-col gap-1">
            {eighty6.slice(0, 6).map(item => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 bg-[#111827] border border-[#1F2937] rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{item.item_name}</p>
                  <p className="text-[9px] text-gray-600">{item.reason || "—"} • {item.marked_at ? format(new Date(item.marked_at), "h:mm a") : "—"}</p>
                </div>
                <button className="h-6 px-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded active:scale-95 shrink-0">
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
          <div className="flex items-center gap-1.5 mb-1.5 px-1">
            <Trash2 className="h-3.5 w-3.5 text-orange-400" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Waste Today ({wasteToday.length})</p>
          </div>
          <div className="flex flex-col gap-1">
            {wasteToday.slice(0, 6).map(item => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 bg-[#111827] border border-[#1F2937] rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{item.item_name}</p>
                  <p className="text-[9px] text-gray-600">{item.quantity} {item.unit} • {item.reason}</p>
                </div>
                {item.dollar_value > 0 && (
                  <span className="text-[11px] font-bold text-red-400 shrink-0">${item.dollar_value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSIGHTS */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-2">
          <p className="text-[9px] font-extrabold text-gray-600 uppercase tracking-widest mb-1">Top Loss</p>
          {topLoss.length === 0 ? (
            <p className="text-[9px] text-gray-700">No data</p>
          ) : (
            topLoss.map(([name, val], i) => (
              <div key={name} className="flex items-center gap-1 mb-0.5 last:mb-0">
                <span className="text-[8px] text-gray-700 w-3 shrink-0">{i + 1}.</span>
                <span className="text-[10px] font-bold text-white truncate flex-1">{name}</span>
                <span className="text-[9px] font-bold text-red-400 shrink-0">${val.toFixed(0)}</span>
              </div>
            ))
          )}
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-2">
          <p className="text-[9px] font-extrabold text-gray-600 uppercase tracking-widest mb-1">Trends</p>
          <div className="flex items-center justify-center h-12 gap-1">
            <TrendingDown className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-bold text-gray-500">View inventory page</span>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+8px)] right-4 z-40 flex flex-col gap-1 items-end lg:bottom-6">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2937] border border-[#374151] text-white text-[10px] font-bold active:scale-95">
          <Plus className="h-3 w-3" /> Mark 86
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2937] border border-[#374151] text-white text-[10px] font-bold active:scale-95">
          <Plus className="h-3 w-3" /> Log Waste
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold active:scale-95">
          <Plus className="h-3.5 w-3.5" /> Add Item
        </button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, alert, color }) {
  return (
    <div className={cn("flex flex-col items-center py-2 rounded-lg border", alert ? "bg-red-950/20 border-red-500/30" : "bg-[#111827] border-[#1F2937]")}>
      <span className={cn("text-[16px] font-extrabold leading-none", color)}>{value}</span>
      <span className="text-[8px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

function AlertCard({ alert }) {
  if (alert.type === "low_stock") {
    const pct = alert.current / alert.par * 100;
    const badgeColor = alert.severity === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111827] border border-[#1F2937] rounded-lg">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[12px] font-bold text-white truncate">{alert.name}</p>
            <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded border", badgeColor)}>
              {alert.severity === "critical" ? "CRITICAL" : "LOW"}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex-1 h-1 bg-[#1F2937] rounded-full overflow-hidden">
              <div className={cn("h-full", pct <= 25 ? "bg-red-500" : "bg-amber-500")} style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <span className="text-[9px] text-gray-600 shrink-0">{alert.current}/{alert.par}</span>
          </div>
        </div>
        <button className="h-6 px-2 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded active:scale-95 shrink-0">
          Order
        </button>
      </div>
    );
  } else if (alert.type === "86") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/20 border border-red-500/30 rounded-lg">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[12px] font-bold text-white truncate">{alert.name}</p>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/20">86</span>
          </div>
          <p className="text-[9px] text-gray-500 mt-0.5">{alert.reason || "No reason"}</p>
        </div>
      </div>
    );
  } else if (alert.type === "waste") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-950/20 border border-orange-500/30 rounded-lg">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white truncate">{alert.name}</p>
          <p className="text-[9px] text-gray-500 mt-0.5">{alert.amount} {alert.unit} • {alert.reason}</p>
        </div>
        {alert.value > 0 && <span className="text-[11px] font-bold text-red-400 shrink-0">${alert.value}</span>}
      </div>
    );
  }
  return null;
}

export const hideBase44Index = true;