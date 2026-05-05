import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, ShoppingCart, DollarSign, Flame, CheckCircle2, Clock, Truck, TrendingDown } from "lucide-react";
import MetricTile from "../components/MetricTile";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export const hideBase44Index = true;

const SEVERITY = {
  out:      { label: "Out",      color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/25",    dot: "bg-red-500",    order: 0 },
  critical: { label: "Critical", color: "text-red-400",    bg: "bg-red-500/8",     border: "border-red-500/20",    dot: "bg-red-400",    order: 1 },
  low:      { label: "Low",      color: "text-amber-400",  bg: "bg-amber-500/8",   border: "border-amber-500/20",  dot: "bg-amber-500",  order: 2 },
};

function getSeverity(item) {
  if (item.current_stock <= 0) return "out";
  if (item.par_level > 0) {
    const ratio = item.current_stock / item.par_level;
    if (ratio <= 0.25) return "critical";
    if (ratio <= 0.6) return "low";
  }
  return item.status === "critical" ? "critical" : item.status === "low" ? "low" : null;
}



const ORDER_STATUS_MAP = {
  pending:   { label: "Pending",   color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  Icon: Clock },
  ordered:   { label: "Ordered",   color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   Icon: ShoppingCart },
  confirmed: { label: "Confirmed", color: "text-teal-400",   bg: "bg-teal-500/10",   border: "border-teal-500/20",   Icon: CheckCircle2 },
  delivered: { label: "Delivered", color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20",Icon: Truck },
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.InventoryItem.list("-updated_date", 200),
      base44.entities.Vendor.list("-updated_date", 50),
    ]).then(([inv, vend]) => {
      setItems(inv);
      setVendors(vend);
      setLoading(false);
    });
  }, []);

  const alerts = useMemo(() => {
    return items
      .map(i => ({ ...i, _sev: getSeverity(i) }))
      .filter(i => i._sev)
      .sort((a, b) => SEVERITY[a._sev].order - SEVERITY[b._sev].order);
  }, [items]);

  const outCount = alerts.filter(i => i._sev === "out").length;
  const critCount = alerts.filter(i => i._sev === "critical").length;
  const lowCount = alerts.filter(i => i._sev === "low").length;
  const wasteRisk = items.filter(i => i.par_level > 0 && i.current_stock > i.par_level * 1.5).length;

  // Estimated spend from items below par (items needing reorder × implied unit cost proxy)
  const spendEstimate = alerts.length > 0
    ? `${alerts.length} SKU${alerts.length !== 1 ? "s" : ""}`
    : "—";

  // Vendor orders
  const orderedVendors = vendors.filter(v => v.next_delivery_date || (v.notes && /order|pending|deliver/i.test(v.notes)));
  const pendingOrders = orderedVendors.length;

  // Spend trend — simulate 7-day alert counts from item updated_date patterns
  const spendTrend = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    // Count items updated on that day as a proxy for "activity"
    const ds = format(d, "yyyy-MM-dd");
    const activity = items.filter(item => item.updated_date && item.updated_date.startsWith(ds)).length;
    return { day: format(d, "EEE"), value: activity };
  }), [items]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-3 pb-24">

      {/* Header */}
      <div className="pt-1">
        <h1 className="text-[17px] font-extrabold text-white tracking-tight">Inventory</h1>
        <p className="text-[11px] text-gray-600 mt-0.5">{format(new Date(), "EEEE, MMM d")} · {items.length} items tracked</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-1.5">
        <MetricTile
          label="Low Stock"
          value={outCount + critCount + lowCount}
          sub={outCount > 0 ? `${outCount} out` : critCount > 0 ? `${critCount} critical` : undefined}
          color={outCount > 0 ? "text-red-400" : critCount > 0 ? "text-amber-400" : "text-emerald-400"}
          alert={outCount > 0 || critCount > 0}
        />
        <MetricTile
          label="Orders"
          value={pendingOrders || "—"}
          sub={pendingOrders > 0 ? "pending" : "none"}
          color={pendingOrders > 0 ? "text-blue-400" : "text-gray-600"}
        />
        <MetricTile
          label="Spend"
          value={spendEstimate}
          sub="need reorder"
          color="text-[#F5A623]"
        />
        <MetricTile
          label="Waste Risk"
          value={wasteRisk || "—"}
          sub={wasteRisk > 0 ? "over par" : "clear"}
          color={wasteRisk > 0 ? "text-orange-400" : "text-emerald-400"}
          alert={wasteRisk > 0}
        />
      </div>

      {/* LOW STOCK SECTION */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <AlertTriangle className="h-3 w-3 text-red-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Low Stock</p>
          {alerts.length > 0 && (
            <span className="ml-auto text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
              {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 text-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-400/40 mx-auto mb-1.5" />
            <p className="text-[13px] font-bold text-gray-500">All stock levels OK</p>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden divide-y divide-[#1A2235]">
            {alerts.map(item => {
              const sev = SEVERITY[item._sev];
              const pct = item.par_level > 0 ? Math.min(100, Math.round((item.current_stock / item.par_level) * 100)) : 0;
              return (
                <div key={item.id} className={cn("flex items-center gap-3 px-3 py-2.5", item._sev === "out" && "bg-red-500/5")}>
                  <div className={cn("h-2 w-2 rounded-full shrink-0", sev.dot, item._sev === "out" && "animate-pulse")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[12px] font-bold text-white truncate">{item.name}</p>
                      <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded border shrink-0", sev.color, sev.bg, sev.border)}>
                        {sev.label}
                      </span>
                    </div>
                    {/* Current vs Par bar */}
                    {item.par_level > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-[#1A2235] rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", pct <= 25 ? "bg-red-500" : pct <= 60 ? "bg-amber-500" : "bg-emerald-500")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={cn("text-[10px] font-bold shrink-0 tabular-nums", sev.color)}>
                          {item.current_stock ?? 0}<span className="text-gray-700 font-normal">/{item.par_level} {item.unit}</span>
                        </span>
                      </div>
                    ) : (
                      <p className={cn("text-[10px] font-bold", sev.color)}>{item.current_stock ?? 0} {item.unit}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ORDERS SECTION */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Truck className="h-3 w-3 text-blue-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Orders</p>
        </div>

        {vendors.length === 0 ? (
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 text-center">
            <Truck className="h-6 w-6 text-gray-700 mx-auto mb-1" />
            <p className="text-[12px] font-bold text-gray-600">No vendors configured</p>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden divide-y divide-[#1A2235]">
            {vendors.slice(0, 8).map(vendor => {
              const hasPending = vendor.notes && /order|pending/i.test(vendor.notes);
              const statusKey = hasPending ? "ordered" : "pending";
              const S = ORDER_STATUS_MAP[statusKey];
              const StatusIcon = S.Icon;
              const deliveryDate = vendor.next_delivery_date
                ? format(new Date(vendor.next_delivery_date), "MMM d")
                : vendor.delivery_days || "—";
              return (
                <div key={vendor.id} className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", S.bg)}>
                    <StatusIcon className={cn("h-3.5 w-3.5", S.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-white truncate">{vendor.name}</p>
                    <p className="text-[10px] text-gray-600">Delivery: {deliveryDate}</p>
                  </div>
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-lg border shrink-0", S.color, S.bg, S.border)}>
                    {S.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SPEND TREND */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="h-3.5 w-3.5 text-[#F5A623]" />
          <p className="text-[12px] font-bold text-white">Spend Activity <span className="text-gray-600 font-normal">— 7 days</span></p>
        </div>
        {spendTrend.some(d => d.value > 0) ? (
          <ResponsiveContainer width="100%" height={72}>
            <BarChart data={spendTrend} barSize={14}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#0B0F14", border: "1px solid #1F2937", borderRadius: 8, fontSize: 11 }}
                formatter={v => [v, "Updates"]}
                cursor={{ fill: "rgba(245,166,35,0.06)" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {spendTrend.map((e, i) => (
                  <Cell key={i} fill={e.value > 0 ? "#F5A623" : "#1F2937"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[11px] text-gray-700 text-center py-4">No activity logged this week</p>
        )}
      </div>

    </div>
  );
}