import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, AlertTriangle, Trash2, Check, TrendingDown, BarChart2, X, Flame, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";

const CATEGORIES = ["All", "Kitchen", "Bar", "Bakery", "Prep"];
const REASONS = ["Spoiled", "Over-prepped", "Dropped", "Expired", "Wrong order", "Other"];
const SEVERITIES = ["low", "medium", "high"];

const SEV_CLS = {
  low:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  medium: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  high:   "bg-red-500/15 text-red-400 border-red-500/30",
};
const REASON_CLS = {
  Spoiled:        "bg-red-500/15 text-red-400 border-red-500/30",
  "Over-prepped": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Dropped:        "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Expired:        "bg-red-500/15 text-red-400 border-red-500/30",
  "Wrong order":  "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Other:          "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const inputCls = "w-full px-2.5 py-1.5 text-[12px] border border-[#1F2937] rounded-lg bg-[#111827] text-white focus:outline-none placeholder:text-gray-700";
const EMPTY_WASTE = { item_name: "", category: "Kitchen", quantity: "", unit: "portions", reason: "Spoiled", dollar_value: "", notes: "" };
const EMPTY_86 = { item_name: "", category: "Kitchen", reason: "", severity: "medium" };

// ── Atoms ──────────────────────────────────────────────────
function Chip({ label, cls }) {
  return <span className={cn("text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wide", cls)}>{label}</span>;
}
function Row({ children, alert }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border",
      alert
        ? "bg-red-950/30 border-red-500/30"
        : "bg-[#0D1117] border-[#1F2937]"
    )}>
      {children}
    </div>
  );
}
function SectionHead({ icon, label, count }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-[11px]">{icon}</span>
      <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-600">{label}</span>
      {count != null && (
        <span className="text-[9px] font-bold text-gray-700 bg-[#1F2937] px-1.5 py-0.5 rounded-full">{count}</span>
      )}
      <div className="flex-1 h-px bg-[#1F2937]" />
    </div>
  );
}
function Empty({ text }) {
  return <p className="text-[10px] text-gray-700 py-2 pl-1">{text}</p>;
}
function FormField({ label, children }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wide mb-0.5">{label}</p>
      {children}
    </div>
  );
}
function Sheet({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-[420px] bg-[#0B0F14] border border-[#1F2937] rounded-t-2xl px-4 pt-4 pb-8 max-h-[88vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function SheetActions({ onCancel, onSave, label }) {
  return (
    <div className="flex gap-2 mt-3">
      <button onClick={onCancel} className="flex-1 h-9 rounded-lg border border-[#1F2937] text-gray-400 text-[12px] font-bold active:scale-95">Cancel</button>
      <button onClick={onSave} className="flex-1 h-9 rounded-lg bg-[#F5A623] text-black text-[12px] font-extrabold active:scale-95">{label}</button>
    </div>
  );
}

// ── Metric strip ───────────────────────────────────────────
function Metric({ label, value, color, alert }) {
  return (
    <div className={cn(
      "flex-1 flex flex-col items-center justify-center py-2 rounded-lg border gap-0",
      alert ? "bg-red-950/30 border-red-500/30" : "bg-[#0D1117] border-[#1F2937]"
    )}>
      <span className={cn("text-[17px] font-extrabold leading-none", color)}>{value}</span>
      <span className="text-[8px] font-bold text-gray-600 uppercase tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

export default function WasteLog() {
  const [waste, setWaste] = useState([]);
  const [eighty6, setEighty6] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [showE6Form, setShowE6Form] = useState(false);
  const [editWaste, setEditWaste] = useState(null);
  const [wasteForm, setWasteForm] = useState(EMPTY_WASTE);
  const [e6Form, setE6Form] = useState(EMPTY_86);

  const load = async () => {
    const [w, e6, me] = await Promise.all([
      base44.entities.WasteEntry.list("-logged_at", 200),
      base44.entities.EightySixItem.filter({ is_active: true }),
      base44.auth.me().catch(() => null),
    ]);
    setWaste(w); setEighty6(e6); setUser(me); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // derived
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const wasteToday = waste.filter(w => (w.logged_at || w.created_date || "").startsWith(todayStr));
  const wasteTodayDollars = wasteToday.reduce((s, w) => s + (w.dollar_value || 0), 0);
  const recoveryOpp = waste.filter(w => w.reason === "Over-prepped" || w.reason === "Wrong order")
    .reduce((s, w) => s + (w.dollar_value || 0), 0);

  const filteredWaste = filter === "All" ? waste : waste.filter(w => w.category === filter);
  const active86 = filter === "All" ? eighty6 : eighty6.filter(e => e.category === filter);

  const repeatMap = {};
  wasteToday.forEach(w => { repeatMap[w.item_name] = (repeatMap[w.item_name] || 0) + 1; });
  const highRisk = [
    ...eighty6.filter(e => e.severity === "high").map(e => ({ name: e.item_name, tag: "86 HIGH", note: e.reason || "", type: "86" })),
    ...Object.entries(repeatMap).filter(([, c]) => c >= 2).map(([n, c]) => ({ name: n, tag: "REPEAT", note: `${c}x today`, type: "waste" })),
  ];

  const lossMap = {};
  waste.forEach(w => { lossMap[w.item_name] = (lossMap[w.item_name] || 0) + (w.dollar_value || 0); });
  const topLoss = Object.entries(lossMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const total = waste.filter(w => (w.logged_at || w.created_date || "").startsWith(d))
      .reduce((s, w) => s + (w.dollar_value || 0), 0);
    return { day: format(subDays(new Date(), 6 - i), "EEE"), total: parseFloat(total.toFixed(2)) };
  });

  // handlers
  const saveWaste = async () => {
    const p = { ...wasteForm, quantity: parseFloat(wasteForm.quantity) || 0, dollar_value: parseFloat(wasteForm.dollar_value) || 0, logged_at: new Date().toISOString(), reported_by: user?.full_name || user?.email || "Staff" };
    editWaste ? await base44.entities.WasteEntry.update(editWaste.id, p) : await base44.entities.WasteEntry.create(p);
    setShowWasteForm(false); setEditWaste(null); setWasteForm(EMPTY_WASTE); load();
  };
  const saveE6 = async () => {
    await base44.entities.EightySixItem.create({ ...e6Form, marked_at: new Date().toISOString(), marked_by: user?.full_name || user?.email || "Staff", is_active: true });
    setShowE6Form(false); setE6Form(EMPTY_86); load();
  };
  const resolveE6 = async (id) => { await base44.entities.EightySixItem.update(id, { is_active: false, resolved_at: new Date().toISOString() }); load(); };
  const deleteWaste = async (id) => { await base44.entities.WasteEntry.delete(id); load(); };
  const openEdit = (e) => { setEditWaste(e); setWasteForm({ ...e }); setShowWasteForm(true); };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-3 pb-52 px-0">

      {/* HEADER */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[16px] font-extrabold text-white leading-tight">Waste &amp; 86 Log</h1>
          <p className="text-[10px] text-gray-600">Track loss · prevent shortages</p>
        </div>
        <button onClick={load} className="h-7 w-7 rounded-lg bg-[#1F2937] border border-[#374151] flex items-center justify-center active:scale-95">
          <RefreshCw className="h-3 w-3 text-gray-500" />
        </button>
      </div>

      {/* METRICS STRIP */}
      <div className="flex gap-1.5">
        <Metric label="Waste $" value={`$${wasteTodayDollars.toFixed(0)}`} color="text-red-400" alert={wasteTodayDollars > 50} />
        <Metric label="86'd" value={eighty6.length} color={eighty6.length > 0 ? "text-orange-400" : "text-gray-600"} />
        <Metric label="Risk" value={highRisk.length} color={highRisk.length > 0 ? "text-red-400" : "text-gray-600"} alert={highRisk.length > 0} />
        <Metric label="Recovery" value={`$${recoveryOpp.toFixed(0)}`} color="text-yellow-400" />
      </div>

      {/* FILTER CHIPS */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all",
              filter === cat ? "bg-[#F5A623] text-black border-[#F5A623]" : "bg-[#111827] text-gray-500 border-[#1F2937]"
            )}>
            {cat}
          </button>
        ))}
      </div>

      {/* SECTION 1: HIGH RISK */}
      {highRisk.length > 0 && (
        <div>
          <SectionHead icon="🚨" label="High Risk" count={highRisk.length} />
          <div className="flex flex-col gap-1">
            {highRisk.map((item, i) => (
              <Row key={i} alert>
                <Flame className="h-3.5 w-3.5 text-red-400 shrink-0" />
                <span className="text-[12px] font-bold text-white truncate flex-1">{item.name}</span>
                <span className="text-[9px] text-gray-500 shrink-0">{item.note}</span>
                <Chip label={item.tag} cls={item.type === "86" ? SEV_CLS.high : SEV_CLS.medium} />
              </Row>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: WASTE ENTRIES */}
      <div>
        <SectionHead icon="🗑️" label="Waste Entries" count={filteredWaste.length} />
        {filteredWaste.length === 0 ? <Empty text="No waste logged yet" /> : (
          <div className="flex flex-col gap-1">
            {filteredWaste.slice(0, 25).map(entry => (
              <Row key={entry.id}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-white truncate">{entry.item_name}</span>
                    <Chip label={entry.reason} cls={REASON_CLS[entry.reason] || REASON_CLS.Other} />
                    {entry.dollar_value > 0 && <span className="text-[10px] font-extrabold text-red-400 ml-auto shrink-0">${entry.dollar_value}</span>}
                  </div>
                  <p className="text-[9px] text-gray-600 truncate mt-0.5">
                    {entry.category} &middot; {entry.quantity}{entry.unit ? ` ${entry.unit}` : ""} &middot; {entry.reported_by || "Staff"}
                    {entry.logged_at ? ` \u00b7 ${format(new Date(entry.logged_at), "h:mm a")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(entry)} className="h-5 px-1.5 rounded bg-[#1F2937] text-[9px] font-bold text-gray-500 active:scale-95">Edit</button>
                  <button onClick={() => deleteWaste(entry.id)} className="h-5 w-5 flex items-center justify-center active:scale-95">
                    <Trash2 className="h-3 w-3 text-gray-700 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              </Row>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: 86 BOARD */}
      <div>
        <SectionHead icon="🚫" label="86 Board" count={active86.length} />
        {active86.length === 0 ? <Empty text="Nothing currently 86'd" /> : (
          <div className="flex flex-col gap-1">
            {active86.map(item => (
              <Row key={item.id} alert={item.severity === "high"}>
                <X className={cn("h-3.5 w-3.5 shrink-0",
                  item.severity === "high" ? "text-red-400" : item.severity === "medium" ? "text-orange-400" : "text-yellow-400"
                )} />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-bold text-white truncate block">{item.item_name}</span>
                  <p className="text-[9px] text-gray-600 truncate">
                    {item.reason ? `${item.reason} \u00b7 ` : ""}{item.marked_at ? format(new Date(item.marked_at), "h:mm a") : ""}
                  </p>
                </div>
                <Chip label={item.severity} cls={SEV_CLS[item.severity] || SEV_CLS.medium} />
                <button onClick={() => resolveE6(item.id)}
                  className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center active:scale-95 shrink-0">
                  <Check className="h-3 w-3 text-emerald-400" />
                </button>
              </Row>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: INSIGHTS */}
      <div>
        <SectionHead icon="📊" label="Insights" />
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0D1117] border border-[#1F2937] rounded-lg p-2.5">
            <p className="text-[9px] font-extrabold text-gray-600 uppercase tracking-widest mb-1.5">Top Loss</p>
            {topLoss.length === 0 ? <p className="text-[9px] text-gray-700">No data yet</p>
              : topLoss.map(([name, val], i) => (
                <div key={name} className="flex items-center gap-1.5 mb-1 last:mb-0">
                  <span className="text-[8px] font-bold text-gray-700 w-3 shrink-0">{i + 1}.</span>
                  <span className="text-[10px] font-bold text-white truncate flex-1">{name}</span>
                  <span className="text-[9px] font-extrabold text-red-400 shrink-0">${val.toFixed(0)}</span>
                </div>
              ))}
          </div>
          <div className="bg-[#0D1117] border border-[#1F2937] rounded-lg p-2.5">
            <p className="text-[9px] font-extrabold text-gray-600 uppercase tracking-widest mb-1.5">7-Day</p>
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 7, fill: "#4B5563" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 6, fontSize: 10 }} formatter={v => [`$${v}`, "Waste"]} />
                <Bar dataKey="total" fill="#EF4444" radius={[2, 2, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+8px)] right-4 z-40 flex flex-col gap-1.5 items-end lg:bottom-6">
        <button onClick={() => setShowE6Form(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F2937] border border-[#374151] text-white text-[11px] font-bold shadow-xl active:scale-95 transition-transform">
          <Plus className="h-3 w-3 text-orange-400" /> Mark 86
        </button>
        <button onClick={() => { setEditWaste(null); setWasteForm(EMPTY_WASTE); setShowWasteForm(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5A623] text-black text-[12px] font-extrabold shadow-xl active:scale-95 transition-transform">
          <Plus className="h-3.5 w-3.5" /> Log Waste
        </button>
      </div>

      {/* WASTE FORM */}
      {showWasteForm && (
        <Sheet onClose={() => { setShowWasteForm(false); setEditWaste(null); }}>
          <h2 className="text-[14px] font-extrabold text-white mb-3">{editWaste ? "Edit Waste Entry" : "Log Waste"}</h2>
          <div className="space-y-2.5">
            <FormField label="Item Name">
              <input value={wasteForm.item_name} onChange={e => setWasteForm(p => ({ ...p, item_name: e.target.value }))} placeholder="e.g. Salmon" className={inputCls} />
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Category">
                <select value={wasteForm.category} onChange={e => setWasteForm(p => ({ ...p, category: e.target.value }))} className={inputCls}>
                  {["Kitchen","Bar","Bakery","Prep","Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Reason">
                <select value={wasteForm.reason} onChange={e => setWasteForm(p => ({ ...p, reason: e.target.value }))} className={inputCls}>
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <FormField label="Qty">
                <input type="number" value={wasteForm.quantity} onChange={e => setWasteForm(p => ({ ...p, quantity: e.target.value }))} placeholder="0" className={inputCls} />
              </FormField>
              <FormField label="Unit">
                <input value={wasteForm.unit} onChange={e => setWasteForm(p => ({ ...p, unit: e.target.value }))} placeholder="portions" className={inputCls} />
              </FormField>
              <FormField label="$ Lost">
                <input type="number" value={wasteForm.dollar_value} onChange={e => setWasteForm(p => ({ ...p, dollar_value: e.target.value }))} placeholder="0" className={inputCls} />
              </FormField>
            </div>
            <FormField label="Notes">
              <textarea value={wasteForm.notes} onChange={e => setWasteForm(p => ({ ...p, notes: e.target.value }))}
                rows={2} className={inputCls + " resize-none"} placeholder="Optional context..." />
            </FormField>
          </div>
          <SheetActions onCancel={() => { setShowWasteForm(false); setEditWaste(null); }} onSave={saveWaste} label={editWaste ? "Update" : "Log Waste"} />
        </Sheet>
      )}

      {/* 86 FORM */}
      {showE6Form && (
        <Sheet onClose={() => setShowE6Form(false)}>
          <h2 className="text-[14px] font-extrabold text-white mb-3">Mark Item 86</h2>
          <div className="space-y-2.5">
            <FormField label="Item Name">
              <input value={e6Form.item_name} onChange={e => setE6Form(p => ({ ...p, item_name: e.target.value }))} placeholder="e.g. Salmon" className={inputCls} />
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Category">
                <select value={e6Form.category} onChange={e => setE6Form(p => ({ ...p, category: e.target.value }))} className={inputCls}>
                  {["Kitchen","Bar","Bakery","Prep","Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Severity">
                <select value={e6Form.severity} onChange={e => setE6Form(p => ({ ...p, severity: e.target.value }))} className={inputCls}>
                  {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Reason">
              <input value={e6Form.reason} onChange={e => setE6Form(p => ({ ...p, reason: e.target.value }))} placeholder="e.g. Ran out, supplier issue..." className={inputCls} />
            </FormField>
          </div>
          <SheetActions onCancel={() => setShowE6Form(false)} onSave={saveE6} label="Mark 86" />
        </Sheet>
      )}

    </div>
  );
}

export const hideBase44Index = true;