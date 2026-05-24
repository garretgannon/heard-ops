import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  Clock, Calendar, Plus, X, MapPin,
  ArrowRight, Repeat2, Gift, ChevronDown, ChevronUp,
  Briefcase,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday, isFuture, addDays, startOfWeek } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return 'No date';
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    return format(d, 'EEE, MMM d');
  } catch { return dateStr; }
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return t;
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h >= 12 ? 'PM' : 'AM'}`;
}

function shiftHours(shift) {
  if (!shift.start_time || !shift.end_time) return null;
  const [sh, sm] = shift.start_time.split(':').map(Number);
  const [eh, em] = shift.end_time.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? (diff / 60).toFixed(1) : null;
}

function timeStr(shift) {
  const s = fmtTime(shift.start_time);
  const e = fmtTime(shift.end_time);
  if (s && e) return `${s} – ${e}`;
  return s || e || '';
}

function isUpcoming(shift) {
  if (!shift.date) return false;
  try { const d = parseISO(shift.date); return isToday(d) || isFuture(d); }
  catch { return false; }
}

const ROLE_ACCENT = {
  manager: 'border-l-blue-400', server: 'border-l-pink-400',
  bartender: 'border-l-purple-400', cook: 'border-l-orange-400',
  'line cook': 'border-l-orange-400', 'prep cook': 'border-l-yellow-400',
  dishwasher: 'border-l-slate-400', host: 'border-l-teal-400', busser: 'border-l-cyan-400',
};

// ─── Swap Request Form ────────────────────────────────────────────────────────

function SwapRequestForm({ shift, myUpcomingShifts, user, onClose, onSuccess }) {
  const [offerShiftId, setOfferShiftId] = useState('');
  const [targetEmployee, setTargetEmployee] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const offerShift = myUpcomingShifts.find(s => s.id === offerShiftId);
      await base44.entities.TimeOffRequest.create({
        type: 'swap',
        employee_email: user?.email,
        employee_name: user?.name || user?.email,
        shift_id: shift.id,
        shift_date: shift.date,
        shift_role: shift.role || 'Shift',
        shift_time: timeStr(shift),
        offered_shift_id: offerShiftId || null,
        offered_shift_date: offerShift?.date || null,
        offered_shift_role: offerShift?.role || null,
        offered_shift_time: offerShift ? timeStr(offerShift) : null,
        target_employee_email: targetEmployee || null,
        reason,
        status: 'pending',
        submitted_date: new Date().toISOString(),
        start_date: shift.date,
        end_date: shift.date,
      });
      toast.success('Swap request submitted — awaiting manager approval');
      onSuccess?.();
    } catch {
      toast.error('Failed to submit swap request');
    } finally {
      setSaving(false);
    }
  };

  const otherShifts = myUpcomingShifts.filter(s => s.id !== shift.id);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Request Swap</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {shift.role || 'Shift'} · {fmtDate(shift.date)} {timeStr(shift) && `· ${timeStr(shift)}`}
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-all">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {otherShifts.length > 0 && (
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
            Offer in exchange (optional)
          </label>
          <select
            value={offerShiftId}
            onChange={e => setOfferShiftId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:border-primary/60"
          >
            <option value="">No specific offer</option>
            {otherShifts.map(s => (
              <option key={s.id} value={s.id}>
                {fmtDate(s.date)} · {s.role || 'Shift'} {timeStr(s) && `· ${timeStr(s)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
          Swap with (optional)
        </label>
        <input
          type="text"
          value={targetEmployee}
          onChange={e => setTargetEmployee(e.target.value)}
          placeholder="Employee name or leave blank for any"
          className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:border-primary/60"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
          Reason
        </label>
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Why are you requesting this swap?"
          className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:border-primary/60"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 h-9 rounded-xl border border-border/50 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 btn-primary h-9 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Repeat2 className="h-3.5 w-3.5" />
          {saving ? 'Submitting…' : 'Request Swap'}
        </button>
      </div>
    </div>
  );
}

// ─── My Shift Card ────────────────────────────────────────────────────────────

function MyShiftCard({ shift, myUpcomingShifts, user, onOfferPickup, onNavigate, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showSwapForm, setShowSwapForm] = useState(false);
  const accent = ROLE_ACCENT[(shift.role || '').toLowerCase()] || 'border-l-primary';
  const hrs = shiftHours(shift);
  const isOffered = !!shift.offered;

  return (
    <div
      className={cn(
        'rounded-2xl border border-l-4 overflow-hidden transition-all',
        isOffered ? 'border-amber-500/40' : 'border-border/40',
        accent,
      )}
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)' }}
    >
      {/* Main row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground/60">
              {fmtDate(shift.date)}
            </span>
            {isToday(parseISO(shift.date || '2000-01-01')) && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-black">TODAY</span>
            )}
            {isOffered && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black">OFFERED</span>
            )}
          </div>
          <p className="text-sm font-black text-foreground leading-snug">{shift.role || 'Shift'}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {timeStr(shift) && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {timeStr(shift)}
                {hrs && <span className="text-muted-foreground/60">({hrs}h)</span>}
              </span>
            )}
            {shift.station && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {shift.station}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize',
            shift.status === 'published' ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          )}>
            {shift.status || 'draft'}
          </span>
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50" />
            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
          }
        </div>
      </button>

      {/* Expanded actions */}
      {expanded && !showSwapForm && (
        <div className="px-4 pb-3 border-t border-border/20 pt-3 flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate(shift)}
            className="h-8 px-3 rounded-lg border border-border/40 bg-muted/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
          >
            View Details
          </button>
          {!isOffered ? (
            <button
              onClick={() => onOfferPickup(shift)}
              className="h-8 px-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1"
            >
              <Gift className="h-3 w-3" /> Offer for Pickup
            </button>
          ) : (
            <button
              onClick={() => onOfferPickup(shift)}
              className="h-8 px-3 rounded-lg border border-border/40 bg-muted/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Cancel Offer
            </button>
          )}
          <button
            onClick={() => setShowSwapForm(true)}
            className="h-8 px-3 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all flex items-center gap-1"
          >
            <Repeat2 className="h-3 w-3" /> Request Swap
          </button>
        </div>
      )}

      {/* Swap form */}
      {expanded && showSwapForm && (
        <div className="px-3 pb-3 pt-1">
          <SwapRequestForm
            shift={shift}
            myUpcomingShifts={myUpcomingShifts}
            user={user}
            onClose={() => setShowSwapForm(false)}
            onSuccess={() => { setShowSwapForm(false); setExpanded(false); onRefresh?.(); }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Open Shift Card ──────────────────────────────────────────────────────────

function OpenShiftCard({ shift, user, onPickUp }) {
  const accent = ROLE_ACCENT[(shift.role || '').toLowerCase()] || 'border-l-primary';
  const hrs = shiftHours(shift);
  const isOffered = !!shift.offered && (shift.employee_name || shift.employee_email);

  return (
    <div
      className={cn('rounded-2xl border border-l-4 px-4 py-3.5', 'border-border/40', accent)}
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
              {fmtDate(shift.date)}
            </span>
            {isOffered && (
              <span className="text-[10px] font-bold text-amber-400">offered by {shift.employee_name || shift.employee_email}</span>
            )}
          </div>
          <p className="text-sm font-black text-foreground leading-snug">{shift.role || 'Open Shift'}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {timeStr(shift) && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {timeStr(shift)}
                {hrs && <span className="text-muted-foreground/60">({hrs}h)</span>}
              </span>
            )}
            {shift.station && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {shift.station}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onPickUp(shift)}
          className="shrink-0 h-8 px-3 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/25 transition-all active:scale-95 flex items-center gap-1"
        >
          Pick Up <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Time Off Form ────────────────────────────────────────────────────────────

function TimeOffForm({ user, onSubmit, onClose }) {
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.start_date || !form.end_date) { toast.error('Select start and end dates'); return; }
    setSaving(true);
    try {
      await base44.entities.TimeOffRequest.create({
        type: 'time_off',
        employee_email: user?.email,
        employee_name: user?.name || user?.email,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason,
        status: 'pending',
        submitted_date: new Date().toISOString(),
      });
      toast.success('Time off request submitted');
      onSubmit?.();
    } catch {
      toast.error('Failed to submit request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">Request Time Off</p>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-all">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Start</label>
          <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:border-primary/60" />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">End</label>
          <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:border-primary/60" />
        </div>
      </div>
      <input type="text" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
        placeholder="Reason (optional)"
        className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:border-primary/60" />
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 h-9 rounded-xl border border-border/50 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={saving} className="flex-1 btn-primary h-9 text-sm disabled:opacity-50">
          {saving ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
}

// ─── Week Mini-Calendar ───────────────────────────────────────────────────────

function WeekBanner({ myShifts }) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="grid grid-cols-7 gap-1">
      {weekDays.map((day, i) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const hasShift = myShifts.some(s => s.date === dateStr);
        const today = isToday(day);
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className={cn('text-[9px] font-bold uppercase', today ? 'text-primary' : 'text-muted-foreground/50')}>
              {format(day, 'EEE')}
            </span>
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border',
              hasShift ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border/30 text-muted-foreground/40',
              today && 'ring-1 ring-primary/40',
            )}>
              {format(day, 'd')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyShifts() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [allShifts, setAllShifts] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTimeOffForm, setShowTimeOffForm] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const loadData = async () => {
    if (!user?.email) return;
    try {
      const [shifts, requests] = await Promise.all([
        base44.entities.StaffShift?.list?.('-date', 300).catch(() => []),
        base44.entities.TimeOffRequest?.list?.('-submitted_date', 100).catch(() => []),
      ]);
      setAllShifts(shifts || []);
      setTimeOffRequests((requests || []).filter(r => r.employee_email === user.email));
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [user?.email]);

  // My shifts: match by email or name
  const myShifts = allShifts.filter(s =>
    s.employee_email === user?.email || s.employee_name === user?.name
  );
  const myUpcoming = myShifts.filter(isUpcoming).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const myPast = myShifts.filter(s => !isUpcoming(s)).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 12);

  // Open shifts: manager-created (no employee) OR employee-offered (not mine)
  const openShifts = allShifts.filter(s => {
    const isOpen = !s.employee_email && !s.employee_name && s.status === 'published';
    const isOfferedByOther = s.offered && s.employee_email !== user?.email && s.employee_name !== user?.name;
    return isOpen || isOfferedByOther;
  });

  const myRequests = timeOffRequests;
  const pendingCount = myRequests.filter(r => r.status === 'pending').length;

  const handleOfferPickup = async (shift) => {
    const nowOffered = !shift.offered;
    try {
      await base44.entities.StaffShift.update(shift.id, { offered: nowOffered });
      toast.success(nowOffered ? 'Shift offered for pickup' : 'Offer cancelled');
      loadData();
    } catch { toast.error('Failed to update shift'); }
  };

  const handlePickUp = async (shift) => {
    try {
      await base44.entities.StaffShift.update(shift.id, {
        employee_email: user?.email,
        employee_name: user?.name || user?.email,
        offered: false,
        status: shift.status === 'draft' ? 'draft' : 'published',
      });
      toast.success('Shift picked up!');
      loadData();
    } catch { toast.error('Failed to pick up shift'); }
  };

  if (loading) {
    return (
      <div className="app-screen flex flex-col items-center justify-center gap-3 pb-24">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading shifts…</p>
      </div>
    );
  }

  const TABS = [
    { id: 'upcoming', label: 'Upcoming', count: myUpcoming.length },
    { id: 'open', label: 'Open Shifts', count: openShifts.length },
    { id: 'history', label: 'History', count: myPast.length },
    { id: 'requests', label: 'Requests', count: pendingCount },
  ];

  return (
    <div className="app-screen">
      <DesktopPageHeader title="My Shifts" subtitle="Your schedule, requests, and available shifts" />

      <main className="app-page max-w-xl lg:max-w-2xl mx-auto space-y-5 pb-28">

        {/* Mobile header */}
        <div className="lg:hidden space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Schedule</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">My Shifts</h1>
            </div>
            <div className="rounded-2xl border border-border/40 px-4 py-2.5 text-right"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)' }}>
              <p className="text-lg font-black text-foreground">{myUpcoming.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground">Upcoming</p>
            </div>
          </div>
          {myShifts.length > 0 && (
            <div className="rounded-2xl border border-border/30 bg-card/60 p-3">
              <WeekBanner myShifts={myShifts} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 pt-4 pl-1 scrollbar-hide">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all',
                activeTab === t.id ? 'glow-active' : 'border-transparent text-muted-foreground hover:text-foreground glow-interactive'
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span className={cn('text-[9px] font-black rounded-full px-1.5 min-w-[18px] text-center',
                  activeTab === t.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                )}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Upcoming ── */}
        {activeTab === 'upcoming' && (
          <section className="space-y-2">
            {myUpcoming.length === 0 ? (
              <div className="rounded-2xl border border-border/20 bg-card/40 py-14 text-center space-y-2">
                <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-semibold text-muted-foreground">No upcoming shifts</p>
                <p className="text-xs text-muted-foreground/60">Your manager hasn't scheduled you yet.</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">
                  Tap a shift to offer for pickup or request a swap
                </p>
                {myUpcoming.map(shift => (
                  <MyShiftCard
                    key={shift.id}
                    shift={shift}
                    myUpcomingShifts={myUpcoming}
                    user={user}
                    onOfferPickup={handleOfferPickup}
                    onNavigate={s => navigate(`/shift/${s.id}`)}
                    onRefresh={loadData}
                  />
                ))}
              </>
            )}
          </section>
        )}

        {/* ── Open Shifts ── */}
        {activeTab === 'open' && (
          <section className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Available to Pick Up
            </p>
            {openShifts.length === 0 ? (
              <div className="rounded-2xl border border-border/20 bg-card/40 py-14 text-center space-y-2">
                <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-semibold text-muted-foreground">No open shifts right now</p>
                <p className="text-xs text-muted-foreground/60">Check back later or ask your manager to post open shifts.</p>
              </div>
            ) : (
              openShifts.map(shift => (
                <OpenShiftCard key={shift.id} shift={shift} user={user} onPickUp={handlePickUp} />
              ))
            )}
          </section>
        )}

        {/* ── History ── */}
        {activeTab === 'history' && (
          <section className="space-y-2">
            {myPast.length === 0 ? (
              <div className="rounded-2xl border border-border/20 bg-card/40 py-14 text-center">
                <p className="text-sm text-muted-foreground">No past shifts yet.</p>
              </div>
            ) : (
              myPast.map(shift => (
                <MyShiftCard
                  key={shift.id}
                  shift={shift}
                  myUpcomingShifts={[]}
                  user={user}
                  onOfferPickup={() => {}}
                  onNavigate={s => navigate(`/shift/${s.id}`)}
                  onRefresh={loadData}
                />
              ))
            )}
          </section>
        )}

        {/* ── Requests (time off + swaps) ── */}
        {activeTab === 'requests' && (
          <section className="space-y-3">
            {!showTimeOffForm && (
              <button
                onClick={() => setShowTimeOffForm(true)}
                className="w-full h-11 rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-all"
              >
                <Plus className="h-4 w-4" /> Request Time Off
              </button>
            )}
            {showTimeOffForm && (
              <TimeOffForm
                user={user}
                onSubmit={() => { setShowTimeOffForm(false); loadData(); }}
                onClose={() => setShowTimeOffForm(false)}
              />
            )}

            {myRequests.length === 0 && !showTimeOffForm ? (
              <div className="rounded-2xl border border-border/20 bg-card/40 py-10 text-center">
                <p className="text-sm text-muted-foreground">No requests submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myRequests.map(req => {
                  const type = req.type || 'time_off';
                  const typeLabel = type === 'swap' ? 'Swap Request' : type === 'pickup' ? 'Pickup Request' : 'Time Off';
                  const typeColor = type === 'swap' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : type === 'pickup' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-muted text-muted-foreground border-border/40';
                  return (
                    <div key={req.id} className="rounded-xl border border-border/30 bg-card/60 px-4 py-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', typeColor)}>
                              {typeLabel}
                            </span>
                          </div>
                          {type === 'time_off' && (
                            <p className="text-sm font-bold text-foreground">
                              {req.start_date}{req.end_date !== req.start_date ? ` → ${req.end_date}` : ''}
                            </p>
                          )}
                          {type === 'swap' && (
                            <p className="text-sm font-bold text-foreground">
                              {req.shift_role} · {fmtDate(req.shift_date)}
                              {req.shift_time && <span className="text-muted-foreground font-normal"> · {req.shift_time}</span>}
                            </p>
                          )}
                          {req.reason && <p className="text-xs text-muted-foreground italic">"{req.reason}"</p>}
                          {type === 'swap' && req.offered_shift_date && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Offering: {req.offered_shift_role} · {fmtDate(req.offered_shift_date)}
                            </p>
                          )}
                        </div>
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize shrink-0',
                          req.status === 'approved' ? 'border-green-500/30 bg-green-500/10 text-green-400'
                            : req.status === 'denied' ? 'border-red-500/30 bg-red-500/10 text-red-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                        )}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export const hideBase44Index = true;
