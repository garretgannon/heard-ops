import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, ArrowRight, Banknote, CheckCircle2,
  Clock, DollarSign, Minus, Plus,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Constants ─────────────────────────────────────────────────────────────────
const SHIFT_ORDER = ['morning', 'afternoon', 'night'];

const BILLS = [
  { key: 'hundreds', label: '$100', value: 100 },
  { key: 'fifties',  label: '$50',  value: 50  },
  { key: 'twenties', label: '$20',  value: 20  },
  { key: 'tens',     label: '$10',  value: 10  },
  { key: 'fives',    label: '$5',   value: 5   },
  { key: 'ones',     label: '$1',   value: 1   },
];

const COINS = [
  { key: 'quarters',        label: '25¢',         value: 0.25 },
  { key: 'dimes',           label: '10¢',         value: 0.10 },
  { key: 'nickels',         label: '5¢',          value: 0.05 },
  { key: 'pennies',         label: '1¢',          value: 0.01 },
  { key: 'rolled_quarters', label: 'Qtrs (roll)', value: 10   },
  { key: 'rolled_dimes',    label: 'Dimes (roll)', value: 5   },
  { key: 'rolled_nickels',  label: 'Nkls (roll)', value: 2   },
  { key: 'rolled_pennies',  label: 'Pnys (roll)', value: 0.50 },
];

const ALL_DENOMS = [...BILLS, ...COINS];

const DRAWER_OPTIONS = ['Bar', 'Register 1', 'Register 2', 'Host', 'Safe'];
const SHIFT_OPTIONS  = [
  { value: 'morning',   label: 'Morning'   },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'night',     label: 'Night'     },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function emptyCount() {
  return Object.fromEntries(ALL_DENOMS.map(d => [d.key, 0]));
}

function calcTotal(counts) {
  return ALL_DENOMS.reduce((s, d) => s + (Number(counts[d.key]) || 0) * d.value, 0);
}

function fmtMoney(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

function nameMatch(a, b) {
  return (a || '').toLowerCase().trim() === (b || '').toLowerCase().trim();
}

// Find the most recent prior-shift count for the given drawer on today (or last-night for morning)
function findPriorCount(history, drawerName, shift) {
  if (!drawerName) return null;
  const today = todayStr();
  const idx   = SHIFT_ORDER.indexOf(shift);

  // Walk backwards through earlier today
  for (let i = idx - 1; i >= 0; i--) {
    const match = history.find(h =>
      nameMatch(h.drawer_name, drawerName) &&
      h.shift === SHIFT_ORDER[i] &&
      h.date  === today
    );
    if (match) return match;
  }

  // Morning looks back to last night
  if (shift === 'morning') {
    const yd = yesterdayStr();
    return history.find(h =>
      nameMatch(h.drawer_name, drawerName) &&
      h.shift === 'night' &&
      h.date  === yd
    ) ?? null;
  }

  return null;
}

// Find if a later shift already has a count for the same drawer today
function findNextCount(history, drawerName, shift) {
  if (!drawerName) return null;
  const today = todayStr();
  const idx   = SHIFT_ORDER.indexOf(shift);

  for (let i = idx + 1; i < SHIFT_ORDER.length; i++) {
    const match = history.find(h =>
      nameMatch(h.drawer_name, drawerName) &&
      h.shift === SHIFT_ORDER[i] &&
      h.date  === today
    );
    if (match) return match;
  }
  return null;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function RecentRow({ count }) {
  const variance   = count.variance ?? (count.total - (count.expected ?? count.total));
  const hasExp     = count.expected != null;
  const flagged    = hasExp && Math.abs(variance) > 2;

  return (
    <div className="py-3 border-b border-border/30 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">{count.drawer_name || 'Drawer'}</p>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/50 capitalize">
              {count.shift}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmtDateTime(count.logged_at) || count.date}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-foreground tabular-nums">{fmtMoney(count.total || 0)}</p>
          {hasExp && (
            <p className={cn('text-xs font-bold tabular-nums', flagged ? 'text-red-400' : 'text-emerald-400')}>
              {variance >= 0 ? '+' : ''}{fmtMoney(variance)}
            </p>
          )}
          {count.deposit_amount != null && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              Dep: {fmtMoney(count.deposit_amount)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DenomRow({ denom, qty, onDecrement, onIncrement, onChange }) {
  const subtotal = qty * denom.value;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
      <span className="w-24 text-sm font-black text-foreground shrink-0">{denom.label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onDecrement}
          className="h-10 w-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 active:scale-95 transition-all"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min="0"
          value={qty || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="w-16 h-10 text-center text-sm font-black bg-background border border-border rounded-xl text-foreground outline-none focus:border-amber-500/50 tabular-nums"
        />
        <button
          onClick={onIncrement}
          className="h-10 w-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:border-amber-500/50 hover:text-amber-400 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1" />
      <span className={cn(
        'text-sm font-bold tabular-nums shrink-0 w-20 text-right',
        subtotal > 0 ? 'text-foreground' : 'text-muted-foreground/25'
      )}>
        {fmtMoney(subtotal)}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CashDrawer() {
  const { user } = useCurrentUser();

  // Count form
  const [counts, setCounts]             = useState(emptyCount());
  const [drawer, setDrawer]             = useState('');
  const [customDrawer, setCustomDrawer] = useState('');
  const [shift, setShift]               = useState('morning');
  const [expected, setExpected]         = useState('');
  const [countedBy, setCountedBy]       = useState('');
  const [notes, setNotes]               = useState('');
  const [saving, setSaving]             = useState(false);

  // Deposit form
  const [depositAmt, setDepositAmt]     = useState('');
  const [depositBag, setDepositBag]     = useState('');
  const [depositBy, setDepositBy]       = useState('');
  const [depositNotes, setDepositNotes] = useState('');

  // History
  const [history, setHistory]           = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    base44.entities.DrawerCount.list('logged_at', 40)
      .then(r => setHistory(r || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  // Derived values
  const drawerName  = drawer === '__custom__' ? customDrawer : drawer;
  const total       = calcTotal(counts);
  const expectedAmt = expected !== '' ? parseFloat(expected) : null;
  const variance    = expectedAmt !== null ? total - expectedAmt : null;
  const flagged     = variance !== null && Math.abs(variance) > 2;
  const billsTotal  = BILLS.reduce((s, d) => s + (counts[d.key] || 0) * d.value, 0);
  const coinsTotal  = COINS.reduce((s, d) => s + (counts[d.key] || 0) * d.value, 0);

  // Shift chain
  const priorCount = findPriorCount(history, drawerName, shift);
  const nextCount  = findNextCount(history, drawerName, shift);

  function setCount(key, val) {
    const n = Math.max(0, parseInt(val, 10) || 0);
    setCounts(prev => ({ ...prev, [key]: n }));
  }

  function increment(key) { setCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 })); }
  function decrement(key) { setCounts(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - 1) })); }

  function reset() {
    setCounts(emptyCount());
    setDrawer('');
    setCustomDrawer('');
    setExpected('');
    setCountedBy('');
    setNotes('');
    setDepositAmt('');
    setDepositBag('');
    setDepositBy('');
    setDepositNotes('');
  }

  async function handleSubmit() {
    if (!drawerName.trim()) { toast.error('Select a drawer'); return; }
    setSaving(true);
    try {
      const depositAmtParsed = depositAmt !== '' ? parseFloat(depositAmt) : undefined;

      const payload = {
        ...counts,
        date: todayStr(),
        shift,
        drawer_name:    drawerName.trim(),
        total,
        expected:       expectedAmt  ?? undefined,
        variance:       variance     ?? undefined,
        counted_by:     countedBy || user?.full_name || user?.email,
        notes,
        logged_at:      new Date().toISOString(),
        // Deposit fields
        deposit_amount: depositAmtParsed,
        deposit_bag:    depositBag  || undefined,
        deposit_by:     depositBy   || undefined,
        deposit_notes:  depositNotes || undefined,
      };

      const drawerRecord = await base44.entities.DrawerCount.create(payload);

      const logNotes = [
        `Drawer: ${drawerName} | Shift: ${shift}`,
        `Total counted: ${fmtMoney(total)}`,
        expectedAmt != null
          ? `Expected: ${fmtMoney(expectedAmt)} | Variance: ${variance >= 0 ? '+' : ''}${fmtMoney(variance)}`
          : null,
        depositAmtParsed != null ? `Deposit: ${fmtMoney(depositAmtParsed)}${depositBag ? ` (Bag #${depositBag})` : ''}` : null,
        notes ? `Notes: ${notes}` : null,
      ].filter(Boolean).join('\n');

      await base44.entities.ManagerLog.create({
        title:          `Cash Drawer Count — ${drawerName}`,
        category:       'shift_note',
        shift,
        notes:          logNotes,
        priority:       flagged ? 'high' : 'low',
        logged_by:      user?.email,
        logged_by_name: user?.full_name || user?.email,
      });

      toast.success('Drawer count saved and logged');
      setHistory(prev => [drawerRecord, ...prev]);
      reset();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-screen">
      <DesktopPageHeader
        title="Cash Drawer"
        subtitle="Count and balance the drawer for the shift."
      />

      <div className="app-page">

        {/* ── Mobile summary banner ── */}
        <div className="lg:hidden rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">Total Counted</p>
              <p className="text-3xl font-black text-foreground tabular-nums">{fmtMoney(total)}</p>
            </div>
            {variance !== null && (
              <div className={cn('text-right', flagged ? 'text-red-400' : 'text-emerald-400')}>
                <p className="text-[10px] font-bold uppercase tracking-widest">{flagged ? 'Over/Short' : 'On target'}</p>
                <p className="text-2xl font-black tabular-nums">{variance >= 0 ? '+' : ''}{fmtMoney(variance)}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── 3-column grid ── */}
        <div className="lg:grid lg:grid-cols-[1fr_1.6fr_1.4fr] lg:gap-6 space-y-4 lg:space-y-0">

          {/* ─────────────────────────────────────────
              COLUMN 1 — Drawer Setup
          ───────────────────────────────────────── */}
          <aside>
            <div className="app-card-lg space-y-5">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Drawer Setup</p>

              {/* Drawer / Register */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Drawer / Register</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DRAWER_OPTIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => { setDrawer(d); setCustomDrawer(''); }}
                      className={cn(
                        'py-2.5 rounded-xl text-xs font-bold border transition-colors',
                        drawer === d
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'text-muted-foreground border-border hover:border-border/80 hover:text-foreground'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    onClick={() => setDrawer('__custom__')}
                    className={cn(
                      'py-2.5 rounded-xl text-xs font-bold border transition-colors col-span-2',
                      drawer === '__custom__'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'text-muted-foreground border-border hover:border-border/80 hover:text-foreground'
                    )}
                  >
                    Other…
                  </button>
                </div>
                {drawer === '__custom__' && (
                  <input
                    autoFocus
                    value={customDrawer}
                    onChange={e => setCustomDrawer(e.target.value)}
                    placeholder="Drawer name"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-amber-500/50"
                  />
                )}
              </div>

              {/* Shift */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Shift</label>
                <div className="flex gap-1.5">
                  {SHIFT_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setShift(s.value)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors',
                        shift === s.value
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'text-muted-foreground border-border hover:border-border/80 hover:text-foreground'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected Amount */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Expected Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expected}
                    onChange={e => setExpected(e.target.value)}
                    placeholder="500.00"
                    className="w-full bg-background border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-amber-500/50"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground/45">Used to calculate variance.</p>
              </div>

              {/* Counted By */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Counted By</label>
                <input
                  value={countedBy}
                  onChange={e => setCountedBy(e.target.value)}
                  placeholder={user?.full_name || 'Your name'}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional notes about this count…"
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>
          </aside>

          {/* ─────────────────────────────────────────
              COLUMN 2 — Count Entry
          ───────────────────────────────────────── */}
          <section className="space-y-4">

            <div className="app-card-lg">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-4">Bills</p>
              <div>
                {BILLS.map(d => (
                  <DenomRow key={d.key} denom={d} qty={counts[d.key] || 0}
                    onDecrement={() => decrement(d.key)}
                    onIncrement={() => increment(d.key)}
                    onChange={val => setCount(d.key, val)}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/40">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Bills Total</span>
                <span className={cn('text-sm font-black tabular-nums', billsTotal > 0 ? 'text-foreground' : 'text-muted-foreground/30')}>
                  {fmtMoney(billsTotal)}
                </span>
              </div>
            </div>

            <div className="app-card-lg">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-4">Coins</p>
              <div>
                {COINS.map(d => (
                  <DenomRow key={d.key} denom={d} qty={counts[d.key] || 0}
                    onDecrement={() => decrement(d.key)}
                    onIncrement={() => increment(d.key)}
                    onChange={val => setCount(d.key, val)}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/40">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Coins Total</span>
                <span className={cn('text-sm font-black tabular-nums', coinsTotal > 0 ? 'text-foreground' : 'text-muted-foreground/30')}>
                  {fmtMoney(coinsTotal)}
                </span>
              </div>
            </div>

          </section>

          {/* ─────────────────────────────────────────
              COLUMN 3 — Summary, Handoff, Deposit, History
          ───────────────────────────────────────── */}
          <aside className="space-y-4">

            {/* ── Summary card ── */}
            <div className="app-card-lg space-y-4">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Summary</p>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Expected</span>
                <span className="text-sm font-bold tabular-nums text-muted-foreground">
                  {expectedAmt !== null ? fmtMoney(expectedAmt) : '—'}
                </span>
              </div>

              <div className="rounded-xl bg-card border border-border/60 px-4 py-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1.5">Total Counted</p>
                <p className="text-4xl font-black text-foreground tabular-nums leading-none">{fmtMoney(total)}</p>
              </div>

              {variance !== null ? (
                <div className={cn(
                  'flex items-center justify-between rounded-xl px-4 py-3 border',
                  flagged ? 'bg-red-500/10 border-red-500/25' : 'bg-emerald-500/10 border-emerald-500/25'
                )}>
                  <div className="flex items-center gap-2">
                    {flagged
                      ? <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                      : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    }
                    <span className={cn('text-xs font-bold', flagged ? 'text-red-400' : 'text-emerald-400')}>
                      {flagged ? 'Variance' : 'On target'}
                    </span>
                  </div>
                  <span className={cn('text-base font-black tabular-nums', flagged ? 'text-red-400' : 'text-emerald-400')}>
                    {variance >= 0 ? '+' : ''}{fmtMoney(variance)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Difference</span>
                  <span className="text-sm font-bold tabular-nums text-muted-foreground/30">—</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={saving || !drawerName.trim()}
                className="w-full py-3.5 rounded-xl bg-amber-500 text-white text-sm font-black disabled:opacity-30 transition-opacity"
              >
                {saving ? 'Saving…' : 'Review & Submit Count'}
              </button>
              <p className="text-[11px] text-muted-foreground/40 text-center leading-snug">
                Submit when the drawer count is complete.
              </p>
              <button
                onClick={reset}
                className="w-full py-2 text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              >
                Clear all
              </button>
            </div>

            {/* ── Shift Handoff card (conditional) ── */}
            {drawerName && (priorCount || nextCount) && (
              <div className="app-card-lg space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Shift Chain</p>
                </div>

                {/* Prior shift */}
                {priorCount && (
                  <div className="rounded-xl bg-card border border-border/50 px-3.5 py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 capitalize">
                          {priorCount.shift} ↑ prior
                        </span>
                      </div>
                      <span className="text-sm font-black text-foreground tabular-nums">
                        {fmtMoney(priorCount.total || 0)}
                      </span>
                    </div>
                    {priorCount.variance != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground/50">Variance</span>
                        <span className={cn(
                          'text-xs font-bold tabular-nums',
                          Math.abs(priorCount.variance) > 2 ? 'text-red-400' : 'text-emerald-400'
                        )}>
                          {priorCount.variance >= 0 ? '+' : ''}{fmtMoney(priorCount.variance)}
                        </span>
                      </div>
                    )}
                    {priorCount.counted_by && (
                      <p className="text-[11px] text-muted-foreground/45">
                        Counted by {priorCount.counted_by}
                      </p>
                    )}
                    {priorCount.deposit_amount != null && (
                      <div className="flex items-center justify-between pt-1 border-t border-border/30">
                        <span className="text-[11px] text-muted-foreground/50">Deposited</span>
                        <span className="text-xs font-bold text-emerald-400 tabular-nums">
                          {fmtMoney(priorCount.deposit_amount)}
                          {priorCount.deposit_bag ? ` · Bag #${priorCount.deposit_bag}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Current (you) */}
                <div className="flex items-center gap-2 px-1">
                  <div className="flex-1 h-px bg-amber-500/20" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 capitalize">
                    {shift} ← now
                  </span>
                  <div className="flex-1 h-px bg-amber-500/20" />
                </div>

                {/* Next shift */}
                {nextCount && (
                  <div className="rounded-xl bg-card border border-border/40 px-3.5 py-3 space-y-1.5 opacity-70">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 capitalize">
                        {nextCount.shift} ↓ already counted
                      </span>
                      <span className="text-sm font-black text-foreground tabular-nums">
                        {fmtMoney(nextCount.total || 0)}
                      </span>
                    </div>
                    {nextCount.counted_by && (
                      <p className="text-[11px] text-muted-foreground/40">
                        Counted by {nextCount.counted_by}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Deposit card ── */}
            <div className="app-card-lg space-y-4">
              <div className="flex items-center gap-2">
                <Banknote className="h-3.5 w-3.5 text-muted-foreground/50" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Deposit</p>
              </div>

              {/* Deposit Amount */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Deposit Amount</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={depositAmt}
                      onChange={e => setDepositAmt(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-background border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  {total > 0 && (
                    <button
                      onClick={() => setDepositAmt(total.toFixed(2))}
                      className="px-3 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-400 transition-colors shrink-0"
                      title="Use total counted"
                    >
                      = Total
                    </button>
                  )}
                </div>
                {depositAmt !== '' && total > 0 && (
                  <p className={cn(
                    'text-[11px] font-bold',
                    Math.abs(parseFloat(depositAmt) - total) < 0.01
                      ? 'text-emerald-400/70'
                      : 'text-amber-400/70'
                  )}>
                    {Math.abs(parseFloat(depositAmt) - total) < 0.01
                      ? 'Matches total counted'
                      : `${fmtMoney(Math.abs(parseFloat(depositAmt) - total))} ${parseFloat(depositAmt) < total ? 'float kept' : 'over total'}`
                    }
                  </p>
                )}
              </div>

              {/* Bag / Envelope # */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Bag / Envelope #</label>
                <input
                  value={depositBag}
                  onChange={e => setDepositBag(e.target.value)}
                  placeholder="e.g. 042"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Deposited By */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Deposited By</label>
                <input
                  value={depositBy}
                  onChange={e => setDepositBy(e.target.value)}
                  placeholder={user?.full_name || 'Your name'}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Deposit Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Notes</label>
                <textarea
                  value={depositNotes}
                  onChange={e => setDepositNotes(e.target.value)}
                  placeholder="Anything to note about this deposit…"
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              <p className="text-[11px] text-muted-foreground/40 leading-snug">
                Deposit info is saved with the count when you submit.
              </p>
            </div>

            {/* ── Recent Counts card ── */}
            <div className="app-card-lg">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Recent Counts</p>
              </div>
              {historyLoading ? (
                <p className="text-xs text-muted-foreground/50 py-6 text-center">Loading…</p>
              ) : history.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="h-10 w-10 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center mx-auto">
                    <DollarSign className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">No recent counts yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Submitted drawer counts will appear here.</p>
                  </div>
                </div>
              ) : (
                <div>
                  {history.slice(0, 10).map(c => <RecentRow key={c.id} count={c} />)}
                </div>
              )}
            </div>

          </aside>
        </div>

        {/* ── Mobile sticky bottom bar ── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/40 px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Counted</p>
            <p className="text-lg font-black text-foreground tabular-nums leading-tight">{fmtMoney(total)}</p>
          </div>
          {variance !== null && (
            <div className={cn('text-right shrink-0', flagged ? 'text-red-400' : 'text-emerald-400')}>
              <p className="text-[10px] font-bold uppercase tracking-widest">Difference</p>
              <p className="text-base font-black tabular-nums leading-tight">{variance >= 0 ? '+' : ''}{fmtMoney(variance)}</p>
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving || !drawerName.trim()}
            className="h-11 px-5 rounded-xl bg-amber-500 text-white text-sm font-black disabled:opacity-30 transition-opacity shrink-0"
          >
            {saving ? 'Saving…' : 'Submit'}
          </button>
        </div>

        <div className="lg:hidden h-20" />
      </div>
    </div>
  );
}
