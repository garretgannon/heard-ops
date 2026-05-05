import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Plus, Check, MessageSquare,
  ClipboardList, Flame, ShieldAlert, Users, Clock,
  Trash2, ChevronDown, ArrowRight, UserCheck, CalendarClock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const URGENCY_STYLES = {
  low:      { label: "Low",      cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  medium:   { label: "Medium",   cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  high:     { label: "High",     cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  critical: { label: "Critical", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const OPEN_ITEM_KEYS = [
  { key: "prep_concerns",         label: "Prep",         icon: ClipboardList, color: "text-blue-400",   bg: "bg-blue-500/10" },
  { key: "items_86d",             label: "86'd Items",   icon: ShieldAlert,   color: "text-orange-400", bg: "bg-orange-500/10" },
  { key: "maintenance_problems",  label: "Maintenance",  icon: Flame,         color: "text-amber-400",  bg: "bg-amber-500/10" },
  { key: "cash_issues",           label: "Cash",         icon: ShieldAlert,   color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { key: "guest_issues",          label: "Guest",        icon: Users,         color: "text-purple-400", bg: "bg-purple-500/10" },
  { key: "staff_issues",          label: "Staff",        icon: Users,         color: "text-pink-400",   bg: "bg-pink-500/10" },
  { key: "vendor_issues",         label: "Vendor",       icon: Clock,         color: "text-cyan-400",   bg: "bg-cyan-500/10" },
  { key: "reservations_to_watch", label: "Reservations", icon: Clock,         color: "text-indigo-400", bg: "bg-indigo-500/10" },
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

const currentHour = new Date().getHours();
const currentShiftLabel = currentHour < 12 ? "Morning Shift" : currentHour < 17 ? "Afternoon Shift" : "Evening Shift";

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-600">{children}</span>
      <div className="flex-1 h-px bg-[#1F2937]" />
    </div>
  );
}

function OpenItemRow({ icon: Icon, color, bg, label, text, onResolve, fromDate }) {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 flex items-start gap-2.5">
      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", bg)}>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</p>
          {fromDate && <span className="text-[9px] text-gray-700">· {fromDate}</span>}
        </div>
        <p className="text-[12px] text-white leading-snug mt-0.5">{text}</p>
      </div>
      <button onClick={onResolve}
        className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center active:scale-95 transition-transform shrink-0 mt-0.5">
        <Check className="h-3 w-3 text-emerald-400" />
      </button>
    </div>
  );
}

export default function ShiftHandoff() {
  const [handoffs, setHandoffs] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [user, setUser] = useState(null);

  const load = async () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const [data, me, prep, iss] = await Promise.all([
      base44.entities.ShiftHandoff.list("-created_date", 50),
      base44.auth.me().catch(() => null),
      base44.entities.PrepItem.filter({ status: "overdue" }).catch(() => []),
      base44.entities.Issue.filter({ status: "open" }).catch(() => []),
    ]);
    setHandoffs(data);
    setUser(me);
    setPrepItems(prep);
    setIssues(iss);
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
  const latest = handoffs[0] || null;

  // Open items from latest handoff
  const latestOpenItems = latest
    ? OPEN_ITEM_KEYS.filter(f => latest[f.key] && !isResolved(latest, f.key))
    : [];

  // Follow-ups from previous handoffs (not today's latest)
  const followUpItems = handoffs
    .filter(h => h.id !== latest?.id)
    .flatMap(h =>
      OPEN_ITEM_KEYS
        .filter(f => h[f.key] && !isResolved(h, f.key))
        .map(f => ({ ...f, text: h[f.key], handoffId: h.id, fromDate: `${h.shift} ${h.date}` }))
    )
    .slice(0, 8);

  // Timestamped notes feed
  const notesFeed = handoffs
    .filter(h => h.notes_for_next_manager)
    .slice(0, 10);

  const totalOpenItems = latestOpenItems.length + prepItems.length + issues.length;

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-4 pb-40">

      {/* ── SHIFT SUMMARY ── */}
      <div className="pt-1">
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#F5A623]" />
              <div>
                <p className="text-[14px] font-extrabold text-white leading-tight">{currentShiftLabel}</p>
                <p className="text-[10px] text-gray-600">{format(new Date(), "EEEE, MMM d")}</p>
              </div>
            </div>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
              totalOpenItems > 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            )}>
              {totalOpenItems > 0 ? `${totalOpenItems} open` : "All clear"}
            </span>
          </div>

          {/* Manager on duty */}
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="h-8 w-8 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/25 flex items-center justify-center shrink-0">
              <UserCheck className="h-3.5 w-3.5 text-[#F5A623]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">Manager on Duty</p>
              <p className="text-[13px] font-bold text-white">{user?.full_name || user?.email || "Not set"}</p>
            </div>
            {latest && (
              <div className="text-right">
                <p className="text-[10px] text-gray-600">Last handoff by</p>
                <p className="text-[11px] font-bold text-gray-400">{latest.logged_by || "Unknown"}</p>
              </div>
            )}
          </div>

          {/* Last handoff note preview */}
          {latest?.notes_for_next_manager && (
            <div className="px-3 pb-2.5 border-t border-[#1F2937]">
              <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide mt-2 mb-1">Incoming Note</p>
              <p className="text-[12px] text-gray-300 leading-snug line-clamp-2">{latest.notes_for_next_manager}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── OPEN ITEMS ── */}
      <div>
        <SectionLabel>Open Items</SectionLabel>

        {/* Live: overdue prep */}
        {prepItems.length > 0 && prepItems.slice(0, 3).map(item => (
          <div key={item.id} className="mb-1.5 bg-[#111827] border border-blue-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <ClipboardList className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Overdue Prep</p>
              <p className="text-[12px] text-white leading-tight truncate">{item.name}</p>
            </div>
            <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full shrink-0">Prep</span>
          </div>
        ))}

        {/* Live: open issues */}
        {issues.length > 0 && issues.slice(0, 3).map(issue => (
          <div key={issue.id} className="mb-1.5 bg-[#111827] border border-red-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Open Issue</p>
              <p className="text-[12px] text-white leading-tight truncate">{issue.title}</p>
            </div>
            <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full shrink-0 capitalize">{issue.category}</span>
          </div>
        ))}

        {/* Handoff open items */}
        {latestOpenItems.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {latestOpenItems.map(({ key, label, icon, color, bg }) => (
              <OpenItemRow
                key={key}
                icon={icon} color={color} bg={bg} label={label}
                text={latest[key]}
                onResolve={() => markResolved(latest.id, key)}
              />
            ))}
          </div>
        ) : prepItems.length === 0 && issues.length === 0 ? (
          <div className="flex items-center gap-2.5 bg-[#111827] border border-emerald-500/20 rounded-xl px-3 py-3">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-[12px] font-bold text-emerald-400">No open items — clean handoff</p>
          </div>
        ) : null}
      </div>

      {/* ── SHIFT NOTES ── */}
      <div>
        <SectionLabel>Shift Notes</SectionLabel>
        {notesFeed.length === 0 ? (
          <p className="text-center py-4 text-[12px] text-gray-700">No notes yet for this shift</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {notesFeed.map(h => (
              <div key={h.id} className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-extrabold text-[#F5A623]">{(h.logged_by || "?")[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-bold text-white">{h.logged_by || "Staff"}</span>
                    <span className="text-gray-700 text-[9px]">·</span>
                    <span className="text-[10px] text-gray-600 capitalize">{h.shift}</span>
                    <span className="text-gray-700 text-[9px]">·</span>
                    <span className="text-[10px] text-gray-600">{h.date}</span>
                    <span className={cn("ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", URGENCY_STYLES[h.urgency]?.cls)}>
                      {URGENCY_STYLES[h.urgency]?.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-300 leading-snug">{h.notes_for_next_manager}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FOLLOW-UPS ── */}
      {followUpItems.length > 0 && (
        <div>
          <SectionLabel>Follow-Ups for Next Shift</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {followUpItems.map(({ key, label, icon, color, bg, text, handoffId, fromDate }, i) => (
              <OpenItemRow
                key={`${handoffId}-${key}`}
                icon={icon} color={color} bg={bg} label={label}
                text={text} fromDate={fromDate}
                onResolve={() => markResolved(handoffId, key)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── HISTORY (collapsed) ── */}
      {handoffs.length > 0 && (
        <div>
          <button onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 w-full">
            <span>History</span>
            <div className="flex-1 h-px bg-[#1F2937]" />
            <ChevronDown className={cn("h-3 w-3 transition-transform", showHistory && "rotate-180")} />
          </button>
          {showHistory && (
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl divide-y divide-[#1F2937]">
              {handoffs.slice(0, 10).map(h => (
                <div key={h.id} className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-white capitalize">{h.shift} · {h.department} · {h.date}</p>
                    <p className="text-[10px] text-gray-600">{h.logged_by}</p>
                  </div>
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", URGENCY_STYLES[h.urgency]?.cls)}>
                    {URGENCY_STYLES[h.urgency]?.label}
                  </span>
                  <button onClick={() => handleDelete(h.id)} className="h-6 w-6 rounded-lg flex items-center justify-center active:scale-95 shrink-0">
                    <Trash2 className="h-3 w-3 text-gray-700 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {handoffs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-14 w-14 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-gray-700" />
          </div>
          <p className="text-[13px] text-gray-600">No handoffs logged yet</p>
          <button onClick={() => setShowForm(true)} className="text-[12px] font-bold text-[#F5A623] flex items-center gap-1">
            Start first handoff <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── BOTTOM BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#080C14]/96 backdrop-blur-md border-t border-[#1F2937] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:left-64">
        <button onClick={() => setShowForm(true)}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] text-black text-[14px] font-extrabold active:scale-95 transition-transform">
          <Plus className="h-4 w-4" /> Log Handoff Note
        </button>
      </div>

      {/* ── FORM DIALOG ── */}
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
              { key: "notes_for_next_manager", label: "Notes for Next Manager", ph: "What they need to know right now..." },
              { key: "prep_concerns",          label: "Prep Concerns",          ph: "Unfinished prep items..." },
              { key: "items_86d",              label: "Items 86'd",             ph: "What ran out..." },
              { key: "maintenance_problems",   label: "Maintenance",            ph: "Equipment issues..." },
              { key: "cash_issues",            label: "Cash Issues",            ph: "Drawer discrepancies..." },
              { key: "guest_issues",           label: "Guest Issues",           ph: "Complaints, incidents..." },
              { key: "staff_issues",           label: "Staff Issues",           ph: "Call-outs, conflicts..." },
              { key: "vendor_issues",          label: "Vendor Issues",          ph: "Missing deliveries..." },
              { key: "reservations_to_watch",  label: "Reservations to Watch",  ph: "VIP, large parties..." },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</label>
                <textarea value={formData[key]} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={ph} rows={key === "notes_for_next_manager" ? 3 : 2}
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