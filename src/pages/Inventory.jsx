import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Package, ShoppingCart, DollarSign, Flame, TrendingDown, CheckCircle2, Clock, Truck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const hideBase44Index = true;

const SEVERITY = {
  out:      { label: "Out",      color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/25",    dot: "bg-red-500",    bar: "bg-red-500",    order: 0 },
  critical: { label: "Critical", color: "text-red-400",    bg: "bg-red-500/8",     border: "border-red-500/20",    dot: "bg-red-400",    bar: "bg-red-400",    order: 1 },
  low:      { label: "Low",      color: "text-amber-400",  bg: "bg-amber-500/8",   border: "border-amber-500/20",  dot: "bg-amber-500",  bar: "bg-amber-500",  order: 2 },
  ok:       { label: "OK",       color: "text-emerald-400",bg: "bg-emerald-500/6", border: "border-[#1F2937]",      dot: "bg-emerald-500",bar: "bg-emerald-500",order: 3 },
};

function getSeverity(item) {
  if (item.current_stock <= 0) return "out";
  if (item.par_level > 0) {
    const ratio = item.current_stock / item.par_level;
    if (ratio <= 0.25) return "critical";
    if (ratio <= 0.6) return "low";
  }
  return item.status === "critical" ? "critical" : item.status === "low" ? "low" : "ok";
}

function StockBar({ current, par }) {
  const pct = par > 0 ? Math.min(100, Math.round((current / par) * 100)) : 100;
  const sev = pct <= 25 ? "bg-red-500" : pct <= 60 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="w-16 flex flex-col items-end gap-0.5">
      <div className="h-1.5 w-full bg-[#1A2235] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", sev)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] text-gray-600">{current} / {par} {}</span>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className={cn("flex-1 min-w-0 rounded-xl border border-[#1F2937] p-2.5", bg || "bg-[#111827]")}>
      <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center mb-1.5", bg ? "bg-white/5" : "bg-[#1A2235]")}>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <p className="text-[16px] font-extrabold text-white leading-none">{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{label}</p>
      {sub && <p className={cn("text-[9px] mt-0.5", color)}>{sub}</p>}
    </div>
  );
}

const ORDER_STATUS = {
  pending:   { label: "Pending",   color: "text-amber-400",  bg: "bg-amber-500/10",  icon: Clock },
  ordered:   { label: "Ordered",   color: "text-blue-400",   bg: "bg-blue-500/10",   icon: ShoppingCart },
  confirmed: { label: "Confirmed", color: "text-teal-400",   bg: "bg-teal-500/10",   icon: CheckCircle2 },
  delivered: { label: "Delivered", color: "text-emerald-400",bg: "bg-emerald-500/10",icon: Truck },
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
      .filter(i => i._sev !== "ok")
      .sort((a, b) => SEVERITY[a._sev].order - SEVERITY[b._sev].order);
  }, [items]);

  const outCount = alerts.filter(i => i._sev === "out").length;
  const critCount = alerts.filter(i => i._sev === "critical").length;
  const lowCount = alerts.filter(i => i._sev === "low").length;
  const wasteRisk = items.filter(i => i.status === "ok" && i.par_level > 0 && i.current_stock > i.par_level * 1.5).length;

  // Simulate pending orders from vendors with notes containing "order" or "pending"
  const pendingOrders = vendors.filter(v => v.notes && /order|pending|deliver/i.test(v.notes));

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-3 pb-24">

      {/* Header */}
      <div className="pt-1">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[#F5A623]" />
          <h1 className="text-[17px] font-extrabold text-white tracking-tight">Inventory</h1>
        </div>
        <p className="text-[11px] text-gray-600 mt-0.5">{format(new Date(), "EEEE, MMM d")} · {items.length} items tracked</p>
      </div>

      {/* Top metrics */}
      <div className="flex gap-2">
        <MetricCard icon={AlertTriangle} label="Low Stock" value={outCount + critCount + lowCount}
          sub={outCount > 0 ? `${outCount} out of stock` : critCount > 0 ? `${critCount} critical` : "Monitor closely"}
          color={outCount > 0 ? "text-red-400" : critCount > 0 ? "text-amber-400" : "text-emerald-400"} />
        <MetricCard icon={ShoppingCart} label="Orders Pending" value={pendingOrders.length || "—"}
          sub={pendingOrders.length > 0 ? "Review vendors" : "None logged"}
          color="text-blue-400" />
        <MetricCard icon={Flame} label="Waste Risk" value={wasteRisk || "—"}
          sub={wasteRisk > 0 ? "Over par level" : "All within par"}
          color={wasteRisk > 0 ? "text-orange-400" : "text-emerald-400"} />
      </div>

      {/* Low Stock Alerts */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Low Stock Alerts</p>
          <span className="text-[10px] text-gray-600">{alerts.length} item{alerts.length !== 1 ? "s" : ""}</span>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 text-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-400/40 mx-auto mb-1.5" />
            <p className="text-[13px] font-bold text-gray-500">All stock levels OK</p>
            <p className="text-[11px] text-gray-700 mt-0.5">No items below par</p>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden divide-y divide-[#1A2235]">
            {alerts.map(item => {
              const sev = SEVERITY[item._sev];
              return (
                <div key={item.id} className={cn("flex items-center gap-2.5 px-3 py-2.5", item._sev === "out" && "bg-red-500/4")}>
                  <div className={cn("h-2 w-2 rounded-full shrink-0", sev.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[12px] font-bold text-white truncate">{item.name}</p>
                      <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded border shrink-0", sev.color, sev.bg, sev.border)}>
                        {sev.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-0.5 capitalize">{item.category?.replace("_", " ")}{item.vendor ? ` · ${item.vendor}` : ""}</p>
                  </div>
                  {item.par_level > 0 ? (
                    <StockBar current={item.current_stock || 0} par={item.par_level} />
                  ) : (
                    <div className="text-right">
                      <p className={cn("text-[13px] font-extrabold", sev.color)}>{item.current_stock ?? 0}</p>
                      <p className="text-[9px] text-gray-600">{item.unit}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Orders / Vendors */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Vendors & Orders</p>
        </div>
        {vendors.length === 0 ? (
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 text-center">
            <Truck className="h-6 w-6 text-gray-700 mx-auto mb-1" />
            <p className="text-[12px] font-bold text-gray-600">No vendors configured</p>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden divide-y divide-[#1A2235]">
            {vendors.slice(0, 6).map(vendor => {
              const hasPending = vendor.notes && /order|pending/i.test(vendor.notes);
              const status = hasPending ? "ordered" : "pending";
              const S = ORDER_STATUS[status];
              const StatusIcon = S.icon;
              return (
                <div key={vendor.id} className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", S.bg)}>
                    <StatusIcon className={cn("h-3.5 w-3.5", S.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-white truncate">{vendor.name}</p>
                    <p className="text-[10px] text-gray-600 truncate">
                      {vendor.delivery_days || "No delivery schedule"}{vendor.contact_name ? ` · ${vendor.contact_name}` : ""}
                    </p>
                  </div>
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-lg border", S.color, S.bg)}>
                    {S.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spend trend — category breakdown */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Stock by Category</p>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden divide-y divide-[#1A2235]">
          {(() => {
            const cats = {};
            items.forEach(i => {
              const c = i.category || "other";
              if (!cats[c]) cats[c] = { total: 0, low: 0 };
              cats[c].total++;
              if (getSeverity(i) !== "ok") cats[c].low++;
            });
            return Object.entries(cats)
              .sort(([, a], [, b]) => b.low - a.low)
              .map(([cat, data]) => {
                const pct = data.total > 0 ? Math.round((data.total - data.low) / data.total * 100) : 100;
                const color = pct < 50 ? "bg-red-500" : pct < 80 ? "bg-amber-500" : "bg-emerald-500";
                return (
                  <div key={cat} className="flex items-center gap-2.5 px-3 py-2">
                    <p className="text-[11px] font-semibold text-white capitalize w-24 shrink-0">{cat.replace("_", " ")}</p>
                    <div className="flex-1 h-1.5 bg-[#1A2235] rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-600 w-14 text-right shrink-0">{data.low > 0 ? <span className="text-amber-400 font-bold">{data.low} alert{data.low > 1 ? "s" : ""}</span> : <span className="text-emerald-500">All OK</span>}</span>
                  </div>
                );
              });
          })()}
        </div>
      </div>

    </div>
  );
}