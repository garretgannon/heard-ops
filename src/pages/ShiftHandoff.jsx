import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Plus, Check, ChevronRight, MessageSquare,
  ClipboardList, Flame, ShieldAlert, Users, Clock, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const URGENCY_STYLES = {
  low:      { label: "Low",      bg: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  medium:   { label: "Medium",   bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  high:     { label: "High",     bg: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  critical: { label: "Critical", bg: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const OPEN_ITEM_KEYS = [
  { key: "prep_concerns",        label: "Prep",        icon: ClipboardList, color: "text-blue-400",   bg: "bg-blue-500/10" },
  { key: "items_86d",            label: "86'd",         icon: ShieldAlert,   color: "text-orange-400", bg: "bg-orange-500/10" },
  { key: "maintenance_problems", label: "Maintenance",  icon: Flame,         color: "text-amber-400",  bg: "bg-amber-500/10" },
  { key: "cash_issues",          label: "Cash",         icon: ShieldAlert,   color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { key: "guest_issues",         label: "Guest",        icon: Users,         color: "text-purple-400", bg: "bg-purple-500/10" },
  { key: "staff_issues",         label: "Staff",        icon: Users,         color: "text-pink-400",   bg: "bg-pink-500/10" },
  { key: "vendor_issues",        label: "Vendor",       icon: Clock,         color: "text-cyan-400",   bg: "bg-cyan-500/10" },
  { key: "reservations_to_watch",label: "Reservations", icon: Clock,         color: "text-indigo-400", bg: "bg-indigo-500/10" },
];

const EMPTY_FORM = {
  date: format(new Date(), "yyyy-MM-dd"),
  shift: "evening",
  department: "All",
  urgency: "medium",
  items_86d: "",
  staff_issues: "",
  guest_issues: "",
  maintenance_problems: "",
  cash_issues: "",
  prep_concerns: "",
  vendor_issues: "",
  reservations_to_watch: "",
  notes_for_next_manager: "",
  tags: [],
};

export default function ShiftHandoff() {
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [user, setUser] = useState(null);

  const load = async () => {
    const [data, me] = await Promise.all([
      base44.entities.ShiftHandoff.list("-created_date", 100),
      base44.auth.me().catch(() => null),
    ]);
    setHandoffs(data);
    setUser(me);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    await base44.entities.ShiftHandoff.create({ ...formData, logged_by: user?.full_name || user?.email });
    setFormData(EMPTY_FORM);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.ShiftHandoff.delete(id);
    setHandoffs(handoffs.filter(h => h.id !== id));
  };

  const markResolved = async (id, key) => {
    const handoff = handoffs.find(h => h.id === id);
    const resolved = handoff.resolved_items || [];
    await base44.entities.ShiftHandoff.update(id, { resolved_items: [...new Set([...resolved, key])] });
    load();
  };

  const isResolved = (handoff, key) => handoff.resolved_items?.includes(key) || false;

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayHandoffs = handoffs.filter(h => h.date === todayStr);
  const latest = todayHandoffs[0] || handoffs[0];
  const critical = handoffs.filter(h => h.urgency === "critical");
  const rest = handoffs.filter(h => h.urgency !== "critical");

  const currentHour = new Date().getHours();
  const currentShift = currentHour < 12 ? "Morning" : currentHour < 17 ? "Afternoon" : "Evening";

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-2.5 pb-28">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[17px] font-extrabold text-white tracking-tight">Shift Handoff</h1>
          <p className="text-[11px] text-gray-600 mt-0.5">{currentShift} · {format(new Date(), "MMM d")}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="h-8 px-3 rounded-xl bg-[#F5A623] text-black text-[11px] font-bold flex items-center gap-1.5 active:scale-95 transition-transform">
          <Plus className="h-3 w-3" /> New
        </button>
      </div>

      {/* Shift Summary Card */}
      {latest && (
        <div className={cn(
          "bg-[#111827] border rounded-xl px-3 py-2.5",
          latest.urgency === "critical" ? "border-red-500/35" : "border-[#1F2937]"
        )}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Last Handoff</p>
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", URGENCY_STYLES[latest.urgency]?.bg)}>
              {URGENCY_STYLES[latest.urgency]?.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-6 w-6 rounded-full bg-[#F5A623]/15 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#F5A623]">{(latest.logged_by || "?")[0].toUpperCase()}</span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-white">{latest.logged_by || "Unknown"}</p>
              <p className="text-[10px] text-gray-600">{latest.shift?.charAt(0).toUpperCase() + latest.shift?.slice(1)} · {latest.department}</p>
            </div>
          </div>
          {latest.notes_for_next_manager && (
            <p className="text-[11px] text-gray-400 leading-snug border-t border-[#1F2937] pt-1.5 mt-1.5 line-clamp-2">
              {latest.notes_for_next_manager}
            </p>
          )}
        </div>
      )}

      {/* Critical Alerts */}
      {critical.length > 0 && (
        <div className="bg-red-500/6 border border-red-500/30 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-red-500/15">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span className="text-[12px] font-bold text-red-400 flex-1">Critical — Needs Attention</span>
            <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded-full">{critical.length}</span>
          </div>
          {critical.map(h => (
            <button key={h.id} onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 border-b border-red-500/8 last:border-0 text-left active:bg-red-500/5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white truncate">{h.shift?.charAt(0).toUpperCase() + h.shift?.slice(1)} · {h.logged_by}</p>
                <p className="text-[10px] text-gray-600">{h.date}</p>
              </div>
              <ChevronRight className="h-3 w-3 text-gray-700 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Open Items — aggregated from latest handoff */}
      {latest && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Open Items</p>
          {OPEN_ITEM_KEYS.filter(f => latest[f.key] && !isResolved(latest, f.key)).length === 0 ? (
            <div className="flex items-center gap-2.5 bg-[#111827] border border-emerald-500/20 rounded-xl px-3 py-2.5">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-[12px] font-bold text-emerald-400">All items resolved</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {OPEN_ITEM_KEYS.filter(f => latest[f.key] && !isResolved(latest, f.key)).map(({ key, label, icon: Icon, color, bg }) => (
                <div key={key} className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 flex items-start gap-2.5">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", bg)}>
                    <Icon className={cn("h-3.5 w-3.5", color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">{label}</p>
                    <p className="text-[12px] text-white leading-snug mt-0.5">{latest[key]}</p>
                  </div>
                  <button onClick={() => markResolved(latest.id, key)}
                    className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center active:scale-95 transition-transform shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes (all handoffs as timestamped notes) */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Shift Notes</p>
        {handoffs.filter(h => h.notes_for_next_manager).length === 0 ? (
          <p className="text-center py-4 text-[12px] text-gray-700">No notes yet</p>
        ) : (
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl divide-y divide-[#1F2937]">
            {handoffs.filter(h => h.notes_for_next_manager).slice(0, 8).map(h => (
              <div key={h.id} className="flex items-start gap-2.5 px-3 py-2.5">
                <div className="h-6 w-6 rounded-full bg-[#F5A623]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="h-3 w-3 text-[#F5A623]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-bold text-white">{h.logged_by || "Unknown"}</span>
                    <span className="text-gray-700 text-[9px]">·</span>
                    <span className="text-[10px] text-gray-600">{h.shift?.charAt(0).toUpperCase() + h.shift?.slice(1)} {h.date}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">{h.notes_for_next_manager}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow-ups — all non-resolved handoff items */}
      {handoffs.some(h => OPEN_ITEM_KEYS.some(f => h[f.key] && !isResolved(h, f.key)) && h.id !== latest?.id) && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Follow-ups (Previous Shifts)</p>
          <div className="flex flex-col gap-1.5">
            {handoffs.filter(h => h.id !== latest?.id).flatMap(h =>
              OPEN_ITEM_KEYS.filter(f => h[f.key] && !isResolved(h, f.key)).map(({ key, label, icon: Icon, color, bg }) => ({
                h, key, label, icon: Icon, color, bg,
              }))
            ).slice(0, 5).map(({ h, key, label, icon: Icon, color, bg }, i) => (
              <div key={`${h.id}-${key}`} className="bg-[#111827] border border-amber-500/20 rounded-xl px-3 py-2.5 flex items-start gap-2.5">
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", bg)}>
                  <Icon className={cn("h-3.5 w-3.5", color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">{label}</p>
                    <span className="text-[9px] text-gray-600">· {h.shift} {h.date}</span>
                  </div>
                  <p className="text-[12px] text-white leading-snug mt-0.5 line-clamp-2">{h[key]}</p>
                </div>
                <button onClick={() => markResolved(h.id, key)}
                  className="h-6 px-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center active:scale-95 transition-transform shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-emerald-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All handoffs list (collapsed) */}
      {rest.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">History</p>
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl divide-y divide-[#1F2937]">
            {rest.slice(0, 10).map(h => {
              const isExp = expandedId === h.id;
              const activeItems = OPEN_ITEM_KEYS.filter(f => h[f.key] && !isResolved(h, f.key));
              return (
                <div key={h.id}>
                  <button onClick={() => setExpandedId(isExp ? null : h.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left active:bg-[#1A2235] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-white">{h.shift?.charAt(0).toUpperCase() + h.shift?.slice(1)} · {h.department} · {h.date}</p>
                      <p className="text-[10px] text-gray-600">{h.logged_by} {activeItems.length > 0 && `· ${activeItems.length} open`}</p>
                    </div>
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", URGENCY_STYLES[h.urgency]?.bg)}>{URGENCY_STYLES[h.urgency]?.label}</span>
                    <ChevronRight className={cn("h-3 w-3 text-gray-700 shrink-0 transition-transform", isExp && "rotate-90")} />
                  </button>
                  {isExp && (
                    <div className="border-t border-[#1F2937] bg-[#0D1320] px-3 py-2 space-y-2">
                      {OPEN_ITEM_KEYS.filter(f => h[f.key]).map(({ key, label, icon: Icon, color, bg }) => (
                        <div key={key} className="flex items-start gap-2">
                          <div className={cn("h-5 w-5 rounded flex items-center justify-center shrink-0 mt-0.5", bg)}>
                            <Icon className={cn("h-2.5 w-2.5", color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wide">{label}</p>
                            <p className={cn("text-[11px] leading-snug mt-0.5", isResolved(h, key) ? "line-through text-gray-700" : "text-gray-300")}>{h[key]}</p>
                          </div>
                          {!isResolved(h, key) && (
                            <button onClick={() => markResolved(h.id, key)} className="h-5 px-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 active:scale-95 shrink-0">✓</button>
                          )}
                        </div>
                      ))}
                      {h.notes_for_next_manager && (
                        <p className="text-[11px] text-gray-500 border-t border-[#1F2937] pt-2 mt-2">{h.notes_for_next_manager}</p>
                      )}
                      <button onClick={() => handleDelete(h.id)} className="text-[10px] text-red-500/60 flex items-center gap-1 mt-1 active:opacity-80">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {handoffs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <MessageSquare className="h-8 w-8 text-gray-700" />
          <p className="text-[13px] text-gray-600">No handoffs yet</p>
          <button onClick={() => setShowForm(true)} className="text-[11px] font-bold text-[#F5A623]">+ Create first handoff</button>
        </div>
      )}

      {/* Sticky Add Note button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#080C14]/95 backdrop-blur-md border-t border-[#1F2937] px-4 py-3 lg:left-64">
        <button onClick={() => setShowForm(true)}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] text-black text-[13px] font-bold active:scale-95 transition-transform">
          <Plus className="h-4 w-4" /> Add Handoff Note
        </button>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[15px]">Log Shift Handoff</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Shift</label>
                <Select value={formData.shift} onValueChange={v => setFormData(p => ({ ...p, shift: v }))}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["morning","afternoon","evening","night"].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Urgency</label>
                <Select value={formData.urgency} onValueChange={v => setFormData(p => ({ ...p, urgency: v }))}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low","medium","high","critical"].map(u => <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase()+u.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Date</label>
                <Input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} className="h-8 text-[12px]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Dept</label>
                <Select value={formData.department} onValueChange={v => setFormData(p => ({ ...p, department: v }))}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["All","FOH","BOH","Bar"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {[
              { key: "prep_concerns",        label: "Prep Concerns",      ph: "Unfinished prep items..." },
              { key: "items_86d",            label: "Items 86'd",         ph: "What ran out..." },
              { key: "maintenance_problems", label: "Maintenance",        ph: "Equipment issues..." },
              { key: "cash_issues",          label: "Cash Issues",        ph: "Drawer discrepancies..." },
              { key: "guest_issues",         label: "Guest Issues",       ph: "Complaints, incidents..." },
              { key: "staff_issues",         label: "Staff Issues",       ph: "Call-outs, conflicts..." },
              { key: "vendor_issues",        label: "Vendor Issues",      ph: "Missing deliveries..." },
              { key: "reservations_to_watch",label: "Reservations",       ph: "VIP, large parties..." },
              { key: "notes_for_next_manager",label: "Notes for Next Manager", ph: "Anything they need to know..." },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</label>
                <textarea value={formData[key]} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={ph} rows={2}
                  className="mt-1 w-full px-2.5 py-1.5 text-[12px] border border-[#1F2937] rounded-lg bg-[#111827] text-white focus:outline-none resize-none placeholder:text-gray-700" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1">Save Handoff</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;