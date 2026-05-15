import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, DollarSign, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

const todayStr = () => new Date().toISOString().split('T')[0];

const BILLS = [
  { key: 'hundreds', label: '$100', value: 100 },
  { key: 'fifties',  label: '$50',  value: 50 },
  { key: 'twenties', label: '$20',  value: 20 },
  { key: 'tens',     label: '$10',  value: 10 },
  { key: 'fives',    label: '$5',   value: 5 },
  { key: 'ones',     label: '$1',   value: 1 },
];

const COINS = [
  { key: 'quarters',        label: '25¢',          value: 0.25 },
  { key: 'dimes',           label: '10¢',          value: 0.10 },
  { key: 'nickels',         label: '5¢',           value: 0.05 },
  { key: 'pennies',         label: '1¢',           value: 0.01 },
  { key: 'rolled_quarters', label: 'Qtrs (roll)',  value: 10 },
  { key: 'rolled_dimes',    label: 'Dimes (roll)', value: 5 },
  { key: 'rolled_nickels',  label: 'Nkls (roll)',  value: 2 },
  { key: 'rolled_pennies',  label: 'Pnys (roll)',  value: 0.50 },
];

const ALL_DENOMS = [...BILLS, ...COINS];

const DRAWER_OPTIONS = ['Bar', 'Register 1', 'Register 2', 'Host', 'Safe'];
const SHIFT_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'night', label: 'Night' },
];

function emptyCount() {
  return Object.fromEntries(ALL_DENOMS.map(d => [d.key, 0]));
}

function calcTotal(counts) {
  return ALL_DENOMS.reduce((s, d) => s + (Number(counts[d.key]) || 0) * d.value, 0);
}

function fmtMoney(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function RecentRow({ count }) {
  const variance = count.variance ?? (count.total - (count.expected ?? count.total));
  const flagged = Math.abs(variance) > 2;
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{count.drawer_name || 'Drawer'}</p>
        <p className="text-xs text-muted-foreground capitalize">{count.shift} · {count.date}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">{fmtMoney(count.total || 0)}</p>
        {count.expected != null && (
          <p className={cn('text-xs font-bold', flagged ? 'text-red-400' : 'text-emerald-400')}>
            {variance >= 0 ? '+' : ''}{fmtMoney(variance)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CashDrawer() {
  const { user } = useCurrentUser();
  const [counts, setCounts] = useState(emptyCount());
  const [drawer, setDrawer] = useState('');
  const [customDrawer, setCustomDrawer] = useState('');
  const [shift, setShift] = useState('morning');
  const [expected, setExpected] = useState('');
  const [countedBy, setCountedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    base44.entities.DrawerCount.list('logged_at', 20)
      .then(r => setHistory(r || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const drawerName = drawer === '__custom__' ? customDrawer : drawer;
  const total = calcTotal(counts);
  const expectedAmt = expected !== '' ? parseFloat(expected) : null;
  const variance = expectedAmt !== null ? total - expectedAmt : null;
  const flagged = variance !== null && Math.abs(variance) > 2;

  function setCount(key, val) {
    const n = Math.max(0, parseInt(val, 10) || 0);
    setCounts(prev => ({ ...prev, [key]: n }));
  }

  function increment(key) {
    setCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  }

  function decrement(key) {
    setCounts(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - 1) }));
  }

  function reset() {
    setCounts(emptyCount());
    setDrawer('');
    setCustomDrawer('');
    setExpected('');
    setCountedBy('');
    setNotes('');
  }

  async function handleSubmit() {
    if (!drawerName.trim()) { toast.error('Select a drawer'); return; }
    setSaving(true);
    try {
      const payload = {
        ...counts,
        date: todayStr(),
        shift,
        drawer_name: drawerName.trim(),
        total,
        expected: expectedAmt ?? undefined,
        variance: variance ?? undefined,
        counted_by: countedBy || user?.full_name || user?.email,
        notes,
        logged_at: new Date().toISOString(),
      };

      const drawerRecord = await base44.entities.DrawerCount.create(payload);

      // Auto-create manager log entry
      const logNotes = [
        `Drawer: ${drawerName} | Shift: ${shift}`,
        `Total counted: ${fmtMoney(total)}`,
        expectedAmt != null ? `Expected: ${fmtMoney(expectedAmt)} | Variance: ${variance >= 0 ? '+' : ''}${fmtMoney(variance)}` : null,
        notes ? `Notes: ${notes}` : null,
      ].filter(Boolean).join('\n');

      await base44.entities.ManagerLog.create({
        title: `Cash Drawer Count — ${drawerName}`,
        category: 'shift_note',
        shift,
        notes: logNotes,
        priority: flagged ? 'high' : 'low',
        logged_by: user?.email,
        logged_by_name: user?.full_name || user?.email,
      });

      toast.success('Drawer count saved and logged');
      setHistory(prev => [drawerRecord, ...prev]);
      reset();
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Cash Drawer" subtitle={total > 0 ? fmtMoney(total) : undefined} />

      <div className="app-page">
      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)_280px] lg:gap-6 space-y-4 lg:space-y-0">

        {/* Left — setup */}
        <aside className="space-y-4">
          <div className="app-card-lg space-y-4">
            <p className="app-section-title">Drawer Setup</p>

            {/* Drawer picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Drawer / Register</label>
              <div className="grid grid-cols-2 gap-1.5">
                {DRAWER_OPTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => { setDrawer(d); setCustomDrawer(''); }}
                    className={cn(
                      'py-2 rounded-lg text-xs font-bold border transition-colors',
                      drawer === d
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'text-muted-foreground border-border hover:border-border/80'
                    )}
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={() => setDrawer('__custom__')}
                  className={cn(
                    'py-2 rounded-lg text-xs font-bold border transition-colors col-span-2',
                    drawer === '__custom__'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'text-muted-foreground border-border hover:border-border/80'
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
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-amber-500/50"
                />
              )}
            </div>

            {/* Shift */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Shift</label>
              <div className="flex gap-1.5">
                {SHIFT_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setShift(s.value)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-bold border transition-colors',
                      shift === s.value
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'text-muted-foreground border-border hover:border-border/80'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expected */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Expected Amount (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expected}
                  onChange={e => setExpected(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Counted by */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Counted By</label>
              <input
                value={countedBy}
                onChange={e => setCountedBy(e.target.value)}
                placeholder={user?.full_name || 'Your name'}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Explain any variance…"
                rows={2}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-amber-500/50 resize-none"
              />
            </div>
          </div>

          {/* Totals summary */}
          <div className="app-card space-y-3">
            <div className="flex items-center justify-between">
              <p className="app-section-title">Total Counted</p>
              <p className="text-2xl font-black text-foreground tabular-nums">{fmtMoney(total)}</p>
            </div>

            {variance !== null && (
              <div className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2.5 border',
                flagged
                  ? 'bg-red-500/10 border-red-500/25'
                  : 'bg-emerald-500/10 border-emerald-500/25'
              )}>
                <div className="flex items-center gap-2">
                  {flagged
                    ? <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  <span className={cn('text-xs font-bold', flagged ? 'text-red-400' : 'text-emerald-400')}>
                    {flagged ? 'Variance' : 'On target'}
                  </span>
                </div>
                <span className={cn('text-sm font-black tabular-nums', flagged ? 'text-red-400' : 'text-emerald-400')}>
                  {variance >= 0 ? '+' : ''}{fmtMoney(variance)}
                </span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving || !drawerName.trim()}
              className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-black disabled:opacity-30 transition-opacity"
            >
              {saving ? 'Saving…' : 'Save & Log Count'}
            </button>
            <button
              onClick={reset}
              className="w-full py-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Clear all
            </button>
          </div>
        </aside>

        {/* Center — denomination counter */}
        <section className="space-y-4">
          {/* Bills */}
          <div className="app-card-lg space-y-2">
            <p className="app-section-title">Bills</p>
            {BILLS.map(d => {
              const qty = counts[d.key] || 0;
              const subtotal = qty * d.value;
              return (
                <div key={d.key} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                  <span className="w-12 text-sm font-black text-foreground shrink-0">{d.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => decrement(d.key)}
                      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={qty || ''}
                      onChange={e => setCount(d.key, e.target.value)}
                      placeholder="0"
                      className="w-16 h-8 text-center text-sm font-black bg-background border border-border rounded-lg text-foreground outline-none focus:border-amber-500/50 tabular-nums"
                    />
                    <button
                      onClick={() => increment(d.key)}
                      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex-1" />
                  <span className={cn(
                    'text-sm font-bold tabular-nums shrink-0 w-20 text-right',
                    subtotal > 0 ? 'text-foreground' : 'text-muted-foreground/30'
                  )}>
                    {fmtMoney(subtotal)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Coins */}
          <div className="app-card-lg space-y-2">
            <p className="app-section-title">Coins</p>
            {COINS.map(d => {
              const qty = counts[d.key] || 0;
              const subtotal = qty * d.value;
              return (
                <div key={d.key} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                  <span className="w-24 text-sm font-black text-foreground shrink-0">{d.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => decrement(d.key)}
                      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={qty || ''}
                      onChange={e => setCount(d.key, e.target.value)}
                      placeholder="0"
                      className="w-16 h-8 text-center text-sm font-black bg-background border border-border rounded-lg text-foreground outline-none focus:border-amber-500/50 tabular-nums"
                    />
                    <button
                      onClick={() => increment(d.key)}
                      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex-1" />
                  <span className={cn(
                    'text-sm font-bold tabular-nums shrink-0 w-20 text-right',
                    subtotal > 0 ? 'text-foreground' : 'text-muted-foreground/30'
                  )}>
                    {fmtMoney(subtotal)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right — history */}
        <aside>
          <div className="app-card-lg">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="app-section-title">Recent Counts</p>
            </div>
            {historyLoading ? (
              <p className="text-xs text-muted-foreground/50 py-4 text-center">Loading…</p>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/50">No counts yet</p>
              </div>
            ) : (
              <div>
                {history.slice(0, 12).map(c => <RecentRow key={c.id} count={c} />)}
              </div>
            )}
          </div>
        </aside>
      </div>
      </div>
    </div>
  );
}
