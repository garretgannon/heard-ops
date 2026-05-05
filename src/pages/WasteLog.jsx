import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, AlertTriangle, Trash2, Check, TrendingDown, BarChart2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import MetricTile from "@/components/MetricTile";

const CATEGORIES = ["All", "Kitchen", "Bar", "Bakery", "Prep"];
const REASONS = ["Spoiled", "Over-prepped", "Dropped", "Expired", "Wrong order", "Other"];
const SEVERITIES = ["low", "medium", "high"];

const SEV_STYLE = {
  low:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  medium: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  high:   "bg-red-500/10 text-red-400 border-red-500/20",
};

const REASON_STYLE = {
  Spoiled:       "bg-red-500/10 text-red-400 border-red-500/20",
  "Over-prepped": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Dropped:       "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Expired:       "bg-red-500/10 text-red-400 border-red-500/20",
  "Wrong order": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Other:         "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const inputCls = "w-full px-2.5 py-1.5 text-[12px] border border-[#1F2937] rounded-lg bg-[#111827] text-white focus:outline-none placeholder:text-gray-700";

const EMPTY_WASTE = { item_name: "", category: "Kitchen", quantity: "", unit: "portions", reason: "Spoiled", dollar_value: "", notes: "" };
const EMPTY_86 = { item_name: "", category: "Kitchen", reason: "", severity: "medium" };

function SectionLabel({ icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[12px]">{icon}</span>
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-600">{children}</span>
      <div className="flex-1 h-px bg-[#1F2937]" />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex items-center justify-center py-4 bg-[#111827] border border-[#1F2937] rounded-xl">
      <p className="text-[11px] text-gray-700">{text}</p>
    </div>
  );
}

function Badge({ label, cls }) {
  return <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", cls)}>{label}</span>;
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
      {children}
    </div>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[420px] bg-[#0D1117] border border-[#1F2937] rounded-t-2xl p-5 pb-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onSave, saveLabel }) {
  return (
    <div className="flex gap-2 mt-4">
      <button onClick={onCancel}
        className="flex-1 h-10 rounded-xl border border-[#1F2937] text-gray-400 text-[13px] font-bold active:scale-95 transition-transform">
        Cancel
      </button>
      <button onClick={onSave}
        className="flex-1 h-10 rounded-xl bg-[#F5A623] text-black text-[13px] font-extrabold active:scale-95 transition-transform">
        {saveLabel}
      </button>
    </div>
  );
}

function WasteCard({ entry, onEdit, onDelete }) {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[12px] font-bold text-white truncate">{entry.item_name}</p>
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", REASON_STYLE[entry.reason] || REASON_STYLE.Other)}>
            {entry.reason}
          </span>
          {entry.dollar_value > 0 && (
            <span className="text-[10px] font-bold text-red-400 ml-auto shrink-0">${entry.dollar_value}</span>
          )}
        </div>
        <p className="text-[10px] text-gray-600 truncate">
          {entry.category} &middot; {entry.quantity}{entry.unit ? ` ${entry.unit}` : ""} &middot; {entry.reported_by || "Staff"}
          {entry.logged_at ? ` \u00b7 ${format(new Date(entry.logged_at), "h:mm a")}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(entry)}
          className="h-6 px-2 rounded-lg bg-[#1F2937] text-[10px] font-bold text-gray-400 active:scale-95 transition-transform">
          Edit
        </button>
        <button onClick={() => onDelete(entry.id)} className="h-6 w-6 rounded-lg flex items-center justify-center active:scale-95">
          <Trash2 className="h-3 w-3 text-gray-700 hover:text-red-400 transition-colors" />
        </button>
      </div>
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
    setWaste(w);
    setEighty6(e6);
    setUser(me);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const wasteToday = waste.filter(w => (w.logged_at || w.created_date || "").startsWith(todayStr));
  const wasteTodayDollars = wasteToday.reduce((s, w) => s + (w.dollar_value || 0), 0);
  const recoveryOpportunity = waste
    .filter(w => w.reason === "Over-prepped" || w.reason === "Wrong order")
    .reduce((s, w) => s + (w.dollar_value || 0), 0);

  const filteredWaste = filter === "All" ? waste : waste.filter(w => w.category === filter);
  const active86 = filter === "All" ? eighty6 : eighty6.filter(e => e.category === filter);

  const repeatItems = {};
  wasteToday.forEach(w => { repeatItems[w.item_name] = (repeatItems[w.item_name] || 0) + 1; });
  const highRiskWaste = Object.entries(repeatItems)
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => ({ name, label: "Repeat waste", note: `${count}x today`, type: "waste" }));
  const highRisk86 = eighty6.filter(e => e.severity === "high")
    .map(e => ({ name: e.item_name, label: "86 - High", note: e.reason || "", type: "86" }));
  const highRiskItems = [...highRisk86, ...highRiskWaste];

  const lossMap = {};
  waste.forEach(w => { lossMap[w.item_name] = (lossMap[w.item_name] || 0) + (w.dollar_value || 0); });
  const topLoss = Object.entries(lossMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const total = waste.filter(w => (w.logged_at || w.created_date || "").startsWith(d))
      .reduce((s, w) => s + (w.dollar_value || 0), 0);
    return { day: format(subDays(new Date(), 6 - i), "EEE"), total: parseFloat(total.toFixed(2)) };
  });

  const saveWaste = async () => {
    const payload = {
      ...wasteForm,
      quantity: parseFloat(wasteForm.quantity) || 0,
      dollar_value: parseFloat(wasteForm.dollar_value) || 0,
      logged_at: new Date().toISOString(),
      reported_by: user?.full_name || user?.email || "Staff",
    };
    if (editWaste) {
      await base44.entities.WasteEntry.update(editWaste.id, payload);
    } else {
      await base44.entities.WasteEntry.create(payload);
    }
    setShowWasteForm(false);
    setEditWaste(null);
    setWasteForm(EMPTY_WASTE);
    load();
  };

  const saveE6 = async () => {
    await base44.entities.EightySixItem.create({
      ...e6Form,
      marked_at: new Date().toISOString(),
      marked_by: user?.full_name || user?.email || "Staff",
      is_active: true,
    });
    setShowE6Form(false);
    setE6Form(EMPTY_86);
    load();
  };

  const resolveE6 = async (id) => {
    await base44.entities.EightySixItem.update(id, { is_active: false, resolved_at: new Date().toISOString() });
    load();
  };

  const openEditWaste = (entry) => {
    setEditWaste(entry);
    setWasteForm({ ...entry });
    setShowWasteForm(true);
  };

  const deleteWaste = async (id) => {
    await base44.entities.WasteEntry.delete(id);
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-4 pb-44 px-0">

      {/* HEADER */}
      <div className="pt-1">
        <h1 className="text-[18px] font-extrabold text-white leading-tight">Waste &amp; 86 Log</h1>
        <p className="text-[11px] text-gray-600 mt-0.5">Track loss, prevent shortages</p>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-4 gap-1.5">
        <MetricTile label="Waste $" value={`$${wasteTodayDollars.toFixed(0)}`} color="text-red-400" icon={TrendingDown} alert={wasteTodayDollars > 50} />
        <MetricTile label="86'd" value={eighty6.length} color={eighty6.length > 0 ? "text-orange-400" : "text-gray-500"} icon={AlertTriangle} />
        <MetricTile label="High Risk" value={highRiskItems.length} color={highRiskItems.length > 0 ? "text-red-400" : "text-gray-500"} icon={AlertTriangle} alert={highRiskItems.length > 0} />
        <MetricTile label="Recovery" value={`$${recoveryOpportunity.toFixed(0)}`} color="text-yellow-400" icon={BarChart2} />
      </div>

      {/* FILTER CHIPS */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={cn("px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all",
              filter === cat
                ? "bg-[#F5A623] text-black border-[#F5A623]"
                : "bg-[#111827] text-gray-500 border-[#1F2937]"
            )}>
            {cat}
          </button>
        ))}
      </div>

      {/* SECTION 1: HIGH RISK */}
      {highRiskItems.length > 0 && (
        <div>
          <SectionLabel icon="🚨">High Risk</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {highRiskItems.map((item, i) => (
              <div key={i} className="bg-[#111827] border border-red-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-600 truncate">{item.note}</p>
                </div>
                <Badge label={item.label} cls={item.type === "86" ? SEV_STYLE.high : SEV_STYLE.medium} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: WASTE ENTRIES */}
      <div>
        <SectionLabel icon="🗑️">Waste Entries</SectionLabel>
        {filteredWaste.length === 0
          ? <EmptyState text="No waste logged yet" />
          : (
            <div className="flex flex-col gap-1.5">
              {filteredWaste.slice(0, 20).map(entry => (
                <WasteCard key={entry.id} entry={entry} onEdit={openEditWaste} onDelete={deleteWaste} />
              ))}
            </div>
          )}
      </div>

      {/* SECTION 3: 86 BOARD */}
      <div>
        <SectionLabel icon="🚫">86 Board</SectionLabel>
        {active86.length === 0
          ? <EmptyState text="Nothing currently 86'd" />
          : (
            <div className="flex flex-col gap-1.5">
              {active86.map(item => (
                <div key={item.id} className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                    item.severity === "high" ? "bg-red-500/10" : item.severity === "medium" ? "bg-orange-500/10" : "bg-yellow-500/10"
                  )}>
                    <X className={cn("h-3.5 w-3.5",
                      item.severity === "high" ? "text-red-400" : item.severity === "medium" ? "text-orange-400" : "text-yellow-400"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-white truncate">{item.item_name}</p>
                    <p className="text-[10px] text-gray-600 truncate">
                      {item.reason ? `${item.reason} \u00b7 ` : ""}{item.marked_at ? format(new Date(item.marked_at), "h:mm a") : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge label={item.severity} cls={SEV_STYLE[item.severity] || SEV_STYLE.medium} />
                    <button onClick={() => resolveE6(item.id)}
                      className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center active:scale-95 transition-transform">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* SECTION 4: INSIGHTS */}
      <div>
        <SectionLabel icon="📊">Insights</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-3">
            <p className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest mb-2">Top Loss</p>
            {topLoss.length === 0
              ? <p className="text-[10px] text-gray-700">No data yet</p>
              : topLoss.map(([name, val], i) => (
                <div key={name} className="flex items-center gap-1.5 mb-1.5 last:mb-0">
                  <span className="text-[9px] font-bold text-gray-700 w-3">{i + 1}.</span>
                  <p className="text-[11px] font-bold text-white truncate flex-1">{name}</p>
                  <span className="text-[10px] font-bold text-red-400">${val.toFixed(0)}</span>
                </div>
              ))}
          </div>
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-3">
            <p className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest mb-2">7-Day Trend</p>
            <ResponsiveContainer width="100%" height={70}>
              <BarChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 8, fill: "#4B5563" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 8, fontSize: 10 }}
                  formatter={v => [`$${v}`, "Waste"]}
                />
                <Bar dataKey="total" fill="#EF4444" radius={[2, 2, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BUTTONS */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 items-end lg:bottom-6">
        <button onClick={() => setShowE6Form(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1F2937] border border-[#374151] text-white text-[12px] font-bold shadow-lg active:scale-95 transition-transform">
          <Plus className="h-3.5 w-3.5 text-orange-400" /> Mark 86
        </button>
        <button onClick={() => { setEditWaste(null); setWasteForm(EMPTY_WASTE); setShowWasteForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5A623] text-black text-[13px] font-extrabold shadow-lg active:scale-95 transition-transform">
          <Plus className="h-4 w-4" /> Log Waste
        </button>
      </div>

      {/* WASTE FORM MODAL */}
      {showWasteForm && (
        <ModalOverlay onClose={() => { setShowWasteForm(false); setEditWaste(null); }}>
          <h2 className="text-[15px] font-extrabold text-white mb-4">{editWaste ? "Edit Waste Entry" : "Log Waste"}</h2>
          <div className="space-y-3">
            <FormField label="Item Name">
              <input value={wasteForm.item_name} onChange={e => setWasteForm(p => ({ ...p, item_name: e.target.value }))}
                placeholder="e.g. Salmon" className={inputCls} />
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
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Quantity">
                <input type="number" value={wasteForm.quantity} onChange={e => setWasteForm(p => ({ ...p, quantity: e.target.value }))}
                  placeholder="0" className={inputCls} />
              </FormField>
              <FormField label="Unit">
                <input value={wasteForm.unit} onChange={e => setWasteForm(p => ({ ...p, unit: e.target.value }))}
                  placeholder="portions" className={inputCls} />
              </FormField>
            </div>
            <FormField label="$ Value Lost">
              <input type="number" value={wasteForm.dollar_value} onChange={e => setWasteForm(p => ({ ...p, dollar_value: e.target.value }))}
                placeholder="0.00" className={inputCls} />
            </FormField>
            <FormField label="Notes (optional)">
              <textarea value={wasteForm.notes} onChange={e => setWasteForm(p => ({ ...p, notes: e.target.value }))}
                rows={2} className={inputCls + " resize-none"} placeholder="Any extra context..." />
            </FormField>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setShowWasteForm(false); setEditWaste(null); }}
              className="flex-1 h-10 rounded-xl border border-[#1F2937] text-gray-400 text-[13px] font-bold active:scale-95 transition-transform">Cancel</button>
            <button onClick={saveWaste}
              className="flex-1 h-10 rounded-xl bg-[#F5A623] text-black text-[13px] font-extrabold active:scale-95 transition-transform">
              {editWaste ? "Update" : "Log Waste"}
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* 86 FORM MODAL */}
      {showE6Form && (
        <ModalOverlay onClose={() => setShowE6Form(false)}>
          <h2 className="text-[15px] font-extrabold text-white mb-4">Mark Item 86</h2>
          <div className="space-y-3">
            <FormField label="Item Name">
              <input value={e6Form.item_name} onChange={e => setE6Form(p => ({ ...p, item_name: e.target.value }))}
                placeholder="e.g. Salmon" className={inputCls} />
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
              <input value={e6Form.reason} onChange={e => setE6Form(p => ({ ...p, reason: e.target.value }))}
                placeholder="e.g. Ran out, supplier issue..." className={inputCls} />
            </FormField>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowE6Form(false)}
              className="flex-1 h-10 rounded-xl border border-[#1F2937] text-gray-400 text-[13px] font-bold active:scale-95 transition-transform">Cancel</button>
            <button onClick={saveE6}
              className="flex-1 h-10 rounded-xl bg-[#F5A623] text-black text-[13px] font-extrabold active:scale-95 transition-transform">Mark 86</button>
          </div>
        </ModalOverlay>
      )}

    </div>
  );
}

export const hideBase44Index = true;