import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import {
  Package, Plus, ClipboardList, Upload, Warehouse, TrendingDown,
  AlertTriangle, CheckCircle2, ArrowRight, Layers, RefreshCw,
  BarChart2, ChefHat, ClipboardCheck, Zap, Sparkles, ChevronLeft,
  ThumbsUp, Send, Filter, Search, MoreHorizontal, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { toast } from 'sonner';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import StartCountWizard from '@/components/inventory/StartCountWizard';
import LocationCountSheet from '@/components/inventory/LocationCountSheet';

const CARD_BG = 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)';
const todayStr = () => new Date().toISOString().split('T')[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseSessionMeta(notes) {
  const name = notes?.match(/\[session:(.*?)\]/)?.[1] || null;
  const due  = notes?.match(/\[due:(.*?)\]/)?.[1]     || null;
  return { name, due };
}

function progressOf(count) {
  const items   = count?.items || [];
  if (!items.length) return 0;
  const counted = items.filter(i => i.on_hand_quantity !== '' && i.on_hand_quantity != null).length;
  return Math.round((counted / items.length) * 100);
}

function exceptionsOf(count) {
  const items = count?.items || [];
  const low   = items.filter(i => {
    const qty = Number(i.on_hand_quantity); const par = Number(i.par_level || 0);
    return i.on_hand_quantity !== '' && i.on_hand_quantity != null && qty > 0 && par > 0 && qty < par;
  }).length;
  const out   = items.filter(i =>
    i.on_hand_quantity !== '' && i.on_hand_quantity != null && Number(i.on_hand_quantity) <= 0,
  ).length;
  return { low, out };
}

function estValueOf(count, purchasedItems) {
  return (count?.items || []).reduce((sum, item) => {
    const match = purchasedItems.find(p => p.id === item.purchased_item_id || p.itemName === item.item_name);
    return sum + (Number(item.on_hand_quantity || 0) * (match?.unitCost || 0));
  }, 0);
}

const STATUS_STYLE = {
  submitted:   { label: 'Complete',    cls: 'bg-green-500/15 text-green-400',  textCls: 'text-green-400' },
  complete:    { label: 'Complete',    cls: 'bg-green-500/15 text-green-400',  textCls: 'text-green-400' },
  reviewed:    { label: 'Reviewed',    cls: 'bg-primary/15 text-primary',       textCls: 'text-primary' },
  in_progress: { label: 'In Progress', cls: 'bg-blue-500/15 text-blue-400',    textCls: 'text-blue-400' },
  not_started: { label: 'Not Started', cls: 'bg-muted text-muted-foreground',  textCls: 'text-muted-foreground' },
};
const statusOf = s => STATUS_STYLE[s] || STATUS_STYLE.not_started;

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, labelColor = 'text-muted-foreground', color = 'text-foreground', borderColor = 'border-border/60', large, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'card-glass border rounded-xl px-3.5 py-3 text-left transition-all',
        borderColor,
        onClick && 'hover:bg-white/[0.03] active:scale-[0.98]',
      )}
      style={{ background: CARD_BG }}
    >
      <p className={cn('text-[9px] font-black uppercase tracking-[0.18em] mb-1', labelColor)}>{label}</p>
      <p className={cn('font-extrabold leading-tight', large ? 'text-3xl' : 'text-xl', color)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </button>
  );
}

// ─── Session KPI Card ─────────────────────────────────────────────────────────
function SessionKpiCard({ name, due, status }) {
  const st = statusOf(status);
  return (
    <div
      className="card-glass border border-border/60 rounded-xl px-3.5 py-3 text-left"
      style={{ background: CARD_BG }}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-1">Active Count Session</p>
      <p className="text-sm font-black text-foreground leading-tight truncate">{name || "Today's Count"}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">Due today at {due || '—'}</p>
      <span className={cn('mt-1.5 inline-block text-[9px] font-black px-2 py-0.5 rounded-full', st.cls)}>
        {st.label}
      </span>
    </div>
  );
}

// ─── Station Row ──────────────────────────────────────────────────────────────
function StationRow({ station, count, onAction }) {
  const prog         = progressOf(count);
  const { low, out } = exceptionsOf(count);
  const exceptions   = low + out;
  const st           = statusOf(count?.status);
  const counted      = count?.items?.filter(i => i.on_hand_quantity !== '' && i.on_hand_quantity != null).length || 0;
  const total        = count?.items?.length || 0;
  const isComplete   = count?.status === 'submitted' || count?.status === 'complete';
  const isNotStarted = !count || count.status === 'not_started';

  const lastUpdated = count?.updated_date
    ? new Date(count.updated_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '—';

  return (
    <div className="grid items-center gap-3 px-4 py-3.5 border-b border-border/15 hover:bg-white/[0.01]"
      style={{ gridTemplateColumns: '160px 100px 1fr 110px 90px 80px 70px 76px' }}>
      {/* Location / Station */}
      <p className="text-sm font-bold text-foreground truncate">{station.name}</p>

      {/* Assigned To */}
      <p className="text-xs text-muted-foreground truncate">{count?.counted_by || '—'}</p>

      {/* Progress — % text LEFT of bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0 w-7">{prog}%</span>
        <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
          {prog > 0 ? (
            <div
              className={cn('h-full rounded-full transition-all', isComplete ? 'bg-green-400' : 'bg-primary')}
              style={{ width: `${prog}%` }}
            />
          ) : null}
        </div>
      </div>

      {/* Status — plain colored text, no pill */}
      <p className={cn('text-xs font-bold', st.textCls)}>{st.label}</p>

      {/* Items Counted */}
      <p className="text-xs text-muted-foreground">{counted} / {total}</p>

      {/* Exceptions */}
      {exceptions > 0 ? (
        <span className={cn('text-xs font-bold', out > 0 ? 'text-red-400' : 'text-amber-400')}>
          {out > 0 ? `${out} out` : ''}{out > 0 && low > 0 ? ' · ' : ''}{low > 0 ? `${low} low` : ''}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground/30">—</span>
      )}

      {/* Last Updated */}
      <p className="text-xs text-muted-foreground">{lastUpdated}</p>

      {/* Action — all orange */}
      <button
        onClick={() => onAction(station, count)}
        className="text-[11px] font-black px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 transition-colors text-center"
      >
        {isNotStarted ? 'Start' : isComplete ? 'Review' : 'Continue'}
      </button>
    </div>
  );
}

// Mobile station card (for Count Tasks view)
function StationCard({ count, onOpen }) {
  const prog = progressOf(count);
  const st   = statusOf(count?.status);
  const isComplete = count?.status === 'submitted' || count?.status === 'complete';

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/15 hover:bg-white/[0.02] text-left active:scale-[0.99] transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-sm font-bold text-foreground">{count.station}</p>
          {count.counted_by && <p className="text-[10px] text-muted-foreground">{count.counted_by}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
            <div
              className={cn('h-full rounded-full', isComplete ? 'bg-green-400' : 'bg-primary')}
              style={{ width: `${prog}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{prog}%</span>
        </div>
      </div>
      <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0', st.cls)}>{st.label}</span>
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
const CONNECTIONS = [
  { icon: ClipboardList,  label: 'Pre-Shift Briefing',  desc: 'Low stock and 86 alerts auto-populate shift intel' },
  { icon: ChefHat,        label: 'Prep Planning',        desc: 'Below-par counts trigger prep task suggestions' },
  { icon: AlertTriangle,  label: '86 / Out of Stock',    desc: 'Zero counts can create 86 records automatically' },
  { icon: ClipboardCheck, label: 'Count Tasks',          desc: 'Staff see only their assigned count locations' },
  { icon: Package,        label: 'Purchased Items',      desc: 'Counts update on-hand quantities and par status' },
  { icon: BarChart2,      label: 'Inventory Reports',    desc: 'Value, usage, and variance across count sessions' },
];

function EmptyInventory({ onStartSession, onViewPurchasedItems }) {
  return (
    <div className="space-y-3">
      <div
        className="overflow-hidden rounded-2xl border border-border/40"
        style={{ background: CARD_BG, boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}
      >
        <div className="flex flex-col items-center px-5 py-8 text-center">
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-border/30 flex items-center justify-center">
              <Warehouse className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <div className="absolute -top-1 -right-0.5 h-2 w-2 rounded-full bg-primary/60" />
            <div className="absolute top-1 -left-2 h-1.5 w-1.5 rounded-full bg-primary/30" />
            <div className="absolute -bottom-0.5 -right-2 h-1 w-1 rounded-full bg-primary/40" />
          </div>
          <h3 className="text-base font-black text-foreground mb-1">No active count session.</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed mb-5">
            Start a count session to track inventory by area and station. Counts roll up into low-stock alerts, prep tasks, 86 records, and pre-shift intel.
          </p>
          <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
            <button
              onClick={() => { onStartSession(); haptics.medium(); }}
              className="btn-primary flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3"
            >
              <div className="flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">Start Count Session</span>
              </div>
              <span className="text-[10px] opacity-70 font-normal">Assign locations to staff</span>
            </button>
            <button
              onClick={() => { onViewPurchasedItems(); haptics.medium(); }}
              className="flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3 rounded-xl bg-white/[0.05] border border-border/40 text-foreground hover:bg-white/[0.07] transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-bold">Purchased Items</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal">Master item database</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3 rounded-xl bg-white/[0.05] border border-border/40 text-foreground hover:bg-white/[0.07] transition-colors active:scale-[0.98]">
              <div className="flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-bold">Import Items</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal">CSV or invoice import</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3 rounded-xl bg-white/[0.05] border border-border/40 text-foreground hover:bg-white/[0.07] transition-colors active:scale-[0.98]">
              <div className="flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-bold">Count Tasks</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal">View assigned counts</span>
            </button>
          </div>
        </div>
        <div className="border-t border-border/20 px-5 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/60 mb-3">Why This Matters</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-3">
            {CONNECTIONS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/70" />
                <div>
                  <p className="text-[11px] font-bold text-foreground leading-tight">{label}</p>
                  <p className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Count Tasks View (Panel 4) ───────────────────────────────────────────────
function CountTasksView({ todayCounts, sessionMeta, currentUser, onOpenCount, onBack }) {
  const [tab, setTab] = useState('my');

  const myTasks  = todayCounts.filter(c => c.counted_by && c.counted_by === currentUser?.display_name);
  const displayed = tab === 'my' ? (myTasks.length > 0 ? myTasks : todayCounts) : todayCounts;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background lg:static lg:z-auto">
      {/* Header */}
      <div className="shrink-0 border-b border-border/30" style={{ background: 'rgba(5,8,14,0.97)' }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            onClick={onBack}
            className="h-8 w-8 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-black text-foreground flex-1">Count Tasks</h2>
        </div>
        {/* Tabs */}
        <div className="flex gap-0 px-4 pb-3">
          {[['my', 'My Tasks'], ['all', 'All Locations']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex-1 h-8 text-xs font-bold rounded-lg transition-colors',
                tab === id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Session Banner */}
      {sessionMeta.name && (
        <div className="shrink-0 mx-4 mt-3 px-4 py-3 rounded-xl border border-border/40 flex items-center gap-3" style={{ background: CARD_BG }}>
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-foreground">Active Session</p>
            <p className="text-[10px] text-muted-foreground truncate">{sessionMeta.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Due today at {sessionMeta.due || '—'}</p>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">In Progress</span>
          </div>
        </div>
      )}

      {/* Location Cards */}
      <div className="flex-1 overflow-y-auto mt-3">
        <div
          className="overflow-hidden rounded-2xl border border-border/40 mx-4"
          style={{ background: CARD_BG }}
        >
          {displayed.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground">No count tasks assigned.</p>
            </div>
          ) : (
            displayed.map(count => (
              <StationCard
                key={count.id}
                count={count}
                onOpen={() => onOpenCount(count)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Review Count View (Panel 5) ─────────────────────────────────────────────
function ReviewCountView({ count, purchasedItems, onBack, onApprove, onSendBack, saving }) {
  const [tab, setTab] = useState('all');

  const { low, out } = exceptionsOf(count);
  const items        = count?.items || [];
  const counted      = items.filter(i => i.on_hand_quantity !== '' && i.on_hand_quantity != null).length;
  const total        = items.length;
  const uncounted    = total - counted;
  const estValue     = estValueOf(count, purchasedItems);
  const submittedBy  = count?.counted_by || 'Unknown';
  const submittedAt  = count?.updated_date
    ? new Date(count.updated_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '—';

  const filteredItems = useMemo(() => {
    if (tab === 'exceptions') return items.filter(i => {
      if (i.on_hand_quantity === '' || i.on_hand_quantity == null) return false;
      const qty = Number(i.on_hand_quantity); const par = Number(i.par_level || 0);
      return qty <= 0 || (par > 0 && qty < par);
    });
    if (tab === 'uncounted') return items.filter(i => i.on_hand_quantity === '' || i.on_hand_quantity == null);
    return items;
  }, [items, tab]);

  const itemStatus = (item) => {
    if (item.on_hand_quantity === '' || item.on_hand_quantity == null)
      return { label: '—', cls: 'text-muted-foreground' };
    const qty = Number(item.on_hand_quantity); const par = Number(item.par_level || 0);
    if (qty <= 0)             return { label: 'Out',  cls: 'text-red-400' };
    if (par > 0 && qty < par) return { label: 'Low',  cls: 'text-amber-400' };
    return                           { label: 'OK',   cls: 'text-green-400' };
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background lg:static lg:z-auto">
      {/* Header */}
      <div className="shrink-0 border-b border-border/30" style={{ background: 'rgba(5,8,14,0.97)' }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={onBack}
            className="h-8 w-8 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-foreground">Review Count: {count?.station}</h2>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">Submitted</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Submitted by {submittedBy} at {submittedAt}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 px-4 pb-3 border-b border-border/20">
          {[
            { label: 'Items Counted', value: `${counted}/${total}`, cls: 'text-foreground' },
            { label: 'Exceptions',    value: low + out, sub: low > 0 ? 'Low' : '—', cls: low > 0 ? 'text-amber-400' : 'text-foreground' },
            { label: 'Out of Stock',  value: out, cls: out > 0 ? 'text-red-400' : 'text-foreground' },
            { label: 'Est. Value',    value: `$${estValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, cls: 'text-foreground' },
          ].map(({ label, value, sub, cls }) => (
            <div key={label} className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className={cn('text-lg font-extrabold', cls)}>{value}</p>
              {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex px-4 py-2 gap-1">
          {[
            ['all',        'All Items'],
            ['exceptions', `Exceptions (${low + out})`],
            ['uncounted',  `Not Counted (${uncounted})`],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'px-3 py-1 text-[10px] font-bold rounded-lg transition-colors',
                tab === id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Column headers */}
        <div className="hidden lg:grid px-4 py-2 border-t border-border/20"
          style={{ gridTemplateColumns: '1fr 80px 100px 60px 70px 1fr' }}>
          {['ITEM', 'PAR LEVEL', 'COUNTED', 'UNIT', 'STATUS', 'NOTES'].map(h => (
            <p key={h} className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{h}</p>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border/15">
          {filteredItems.map((item, idx) => {
            const st = itemStatus(item);
            return (
              <div key={idx} className="lg:grid items-center px-4 py-2.5 gap-3 hover:bg-white/[0.01]"
                style={{ gridTemplateColumns: '1fr 80px 100px 60px 70px 1fr' }}>
                <p className="text-sm font-bold text-foreground">{item.item_name}</p>
                <p className="text-xs text-muted-foreground">{item.par_level || '—'}</p>
                <p className="text-xs font-bold text-foreground">{item.on_hand_quantity !== '' && item.on_hand_quantity != null ? item.on_hand_quantity : '—'}</p>
                <p className="text-xs text-muted-foreground">{item.unit || '—'}</p>
                <span className={cn('text-xs font-bold', st.cls)}>{st.label}</span>
                <p className="text-[10px] text-muted-foreground italic">{item.notes || ''}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-4 border-t border-border/30"
        style={{ background: 'rgba(5,8,14,0.97)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={onSendBack}
          disabled={saving}
          className="flex-1 h-10 rounded-xl border border-border/50 text-sm font-bold text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors flex items-center justify-center gap-2"
        >
          <Send className="h-3.5 w-3.5" /> Send Back
        </button>
        <button
          onClick={onApprove}
          disabled={saving}
          className="flex-1 h-10 rounded-xl bg-green-500/80 hover:bg-green-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <ThumbsUp className="h-3.5 w-3.5" /> Approve
        </button>
      </div>
    </div>
  );
}

// ─── Exceptions View (Panel 9) ────────────────────────────────────────────────
function ExceptionsView({ todayCounts, onBack }) {
  const [filter, setFilter] = useState('low');

  const allExceptions = useMemo(() => {
    const result = [];
    for (const count of todayCounts) {
      for (const item of count.items || []) {
        if (item.on_hand_quantity === '' || item.on_hand_quantity == null) {
          result.push({ ...item, location: count.station, type: 'uncounted' });
          continue;
        }
        const qty = Number(item.on_hand_quantity);
        const par = Number(item.par_level || 0);
        if (qty <= 0 && par > 0) {
          result.push({ ...item, location: count.station, type: 'out' });
        } else if (par > 0 && qty < par) {
          result.push({ ...item, location: count.station, type: 'low' });
        }
      }
    }
    return result;
  }, [todayCounts]);

  const lowItems       = allExceptions.filter(e => e.type === 'low');
  const outItems       = allExceptions.filter(e => e.type === 'out');
  const uncountedItems = allExceptions.filter(e => e.type === 'uncounted');
  const displayed      = filter === 'low' ? lowItems : filter === 'out' ? outItems : uncountedItems;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background lg:static lg:z-auto">
      {/* Header */}
      <div className="shrink-0 border-b border-border/30" style={{ background: 'rgba(5,8,14,0.97)' }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            onClick={onBack}
            className="h-8 w-8 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-black text-foreground flex-1">Needs Attention</h2>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 px-4 pb-3">
          {[
            { id: 'low',       label: `Low Stock (${lowItems.length})`,        cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
            { id: 'out',       label: `Out of Stock (${outItems.length})`,      cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
            { id: 'uncounted', label: `Not Counted (${uncountedItems.length})`, cls: 'bg-muted text-muted-foreground border-border/30' },
          ].map(({ id, label, cls }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                'px-3 py-1 rounded-full text-[10px] font-bold border transition-all',
                filter === id ? cls : 'bg-transparent text-muted-foreground border-border/30 hover:border-border/50',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Column Headers */}
        <div className="grid px-4 py-2 border-t border-border/20"
          style={{ gridTemplateColumns: '1fr 140px 80px 80px' }}>
          {['ITEM', 'LOCATION', 'ON HAND', 'PAR LEVEL'].map(h => (
            <p key={h} className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{h}</p>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <CheckCircle2 className="h-8 w-8 text-green-400/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No items in this category.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/15">
            {filter !== 'uncounted' && (
              <div className="px-4 py-2">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  {filter === 'low' ? 'Low Stock Items' : 'Out of Stock Items'}
                </p>
              </div>
            )}
            {displayed.map((item, idx) => (
              <div
                key={idx}
                className="grid items-center px-4 py-2.5 gap-3 hover:bg-white/[0.01]"
                style={{ gridTemplateColumns: '1fr 140px 80px 80px' }}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('h-1.5 w-1.5 rounded-full shrink-0',
                    item.type === 'out' ? 'bg-red-400' : item.type === 'low' ? 'bg-amber-400' : 'bg-muted-foreground/40'
                  )} />
                  <p className="text-xs font-bold text-foreground">{item.item_name}</p>
                </div>
                <p className="text-xs text-muted-foreground">{item.location}</p>
                <p className="text-xs font-bold text-foreground">
                  {item.on_hand_quantity !== '' && item.on_hand_quantity != null ? item.on_hand_quantity : '—'}
                  {item.unit ? ` ${item.unit}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">{item.par_level || '—'} {item.unit || ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="shrink-0 px-4 py-4 border-t border-border/30"
        style={{ background: 'rgba(5,8,14,0.97)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <button className="w-full btn-primary h-10 text-sm font-bold">
          Create Order Suggestion
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventorySimplified() {
  const navigate       = useNavigate();
  const { user, isAdmin } = useCurrentUser();

  const [view,          setView]          = useState('dashboard');
  const [todayCounts,   setTodayCounts]   = useState([]);
  const [stations,      setStations]      = useState([]);
  const [purchasedItems,setPurchasedItems]= useState([]);
  const [templates,     setTemplates]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeStation, setActiveStation] = useState(null);
  const [activeCount,   setActiveCount]   = useState(null);
  const [reviewCount,   setReviewCount]   = useState(null);
  const [showWizard,    setShowWizard]    = useState(false);
  const [savingReview,  setSavingReview]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [counts, stnList, items, tmplts] = await Promise.all([
      base44.entities.PrepInventoryCount.list('-date', 200).catch(() => []),
      base44.entities.Station.list().catch(() => []),
      base44.entities.PurchasedItem.list('-updated_date', 200).catch(() => []),
      base44.entities.PrepPlanTemplate.list().catch(() => []),
    ]);
    setTodayCounts(counts.filter(c => c.date === todayStr()));
    setStations(stnList.filter(s => s.isActive !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    setPurchasedItems(items.filter(i => i.active !== false));
    setTemplates(tmplts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived values ─────────────────────────────────────────────────────
  const { kpis, sessionMeta, attentionItems } = useMemo(() => {
    const assigned = todayCounts.length;
    const complete = todayCounts.filter(c => c.status === 'submitted' || c.status === 'complete').length;
    const inProg   = todayCounts.filter(c => c.status === 'in_progress').length;
    const notStart = todayCounts.filter(c => c.status === 'not_started').length;
    const meta     = todayCounts.length > 0 ? parseSessionMeta(todayCounts[0]?.notes) : { name: null, due: null };

    // Compute stock KPIs from purchasedItems
    const lowStock  = purchasedItems.filter(i => i.currentStock != null && i.parLevel && i.currentStock > 0 && i.currentStock <= i.parLevel * 0.75).length;
    const outStock  = purchasedItems.filter(i => (i.currentStock || 0) <= 0 && i.parLevel).length;
    const uncounted = purchasedItems.filter(i => i.currentStock == null && i.parLevel).length;
    const estValue  = purchasedItems.reduce((s, i) => s + ((i.currentStock || 0) * (i.unitCost || 0)), 0);

    // Attention items from count records
    const attn = [];
    for (const count of todayCounts) {
      for (const item of (count.items || [])) {
        if (item.on_hand_quantity === '' || item.on_hand_quantity == null) continue;
        const qty = Number(item.on_hand_quantity);
        const par = Number(item.par_level || 0);
        if (qty <= 0 && par > 0) {
          attn.push({ name: item.item_name, location: count.station, type: 'out', unit: item.unit, diff: par });
        } else if (par > 0 && qty < par) {
          attn.push({ name: item.item_name, location: count.station, type: 'low', diff: Math.round((par - qty) * 10) / 10, unit: item.unit });
        }
      }
    }

    return {
      kpis: { assigned, complete, inProg, notStart, lowStock, outStock, uncounted, estValue,
              completePct: assigned > 0 ? Math.round(complete / assigned * 100) : 0,
              inProgPct:   assigned > 0 ? Math.round(inProg   / assigned * 100) : 0,
              notStartPct: assigned > 0 ? Math.round(notStart / assigned * 100) : 0 },
      sessionMeta: meta,
      attentionItems: attn.slice(0, 6),
    };
  }, [todayCounts, purchasedItems]);

  const hasSession = todayCounts.length > 0;

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleStationAction = (station, count) => {
    haptics.medium();
    // If complete, show review (if admin/manager)
    if ((count?.status === 'submitted' || count?.status === 'complete') && isAdmin) {
      setReviewCount(count);
      setView('review-count');
      return;
    }
    setActiveStation(station);
    setActiveCount(count || null);
    setView('count-sheet');
  };

  const handleCountSave = async () => { await load(); setView('dashboard'); };

  const handleSessionStart = async () => { setShowWizard(false); await load(); };

  const handleCountTaskOpen = (count) => {
    const station = stations.find(s => s.name === count.station) || { name: count.station };
    setActiveStation(station);
    setActiveCount(count);
    setView('count-sheet');
  };

  const handleApprove = async () => {
    if (!reviewCount?.id) return;
    setSavingReview(true);
    try {
      await base44.entities.PrepInventoryCount.update(reviewCount.id, { ...reviewCount, status: 'reviewed' });
      haptics.success();
      toast.success('Count approved');
      await load();
      setView('dashboard');
    } catch { toast.error('Failed to approve count'); }
    setSavingReview(false);
  };

  const handleSendBack = async () => {
    if (!reviewCount?.id) return;
    setSavingReview(true);
    try {
      await base44.entities.PrepInventoryCount.update(reviewCount.id, { ...reviewCount, status: 'in_progress' });
      haptics.medium();
      toast.success('Count sent back for revision');
      await load();
      setView('dashboard');
    } catch { toast.error('Failed to send back count'); }
    setSavingReview(false);
  };

  // ── Sub-views ──────────────────────────────────────────────────────────
  if (view === 'count-sheet') {
    return (
      <LocationCountSheet
        count={activeCount}
        station={activeStation}
        templates={templates}
        purchasedItems={purchasedItems}
        onSave={handleCountSave}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'count-tasks') {
    return (
      <CountTasksView
        todayCounts={todayCounts}
        sessionMeta={sessionMeta}
        currentUser={user}
        onOpenCount={handleCountTaskOpen}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'review-count') {
    return (
      <ReviewCountView
        count={reviewCount}
        purchasedItems={purchasedItems}
        onBack={() => setView('dashboard')}
        onApprove={handleApprove}
        onSendBack={handleSendBack}
        saving={savingReview}
      />
    );
  }

  if (view === 'exceptions') {
    return (
      <ExceptionsView
        todayCounts={todayCounts}
        onBack={() => setView('dashboard')}
      />
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────
  return (
    <div className="app-screen">
      <DesktopPageHeader
        title="Inventory"
        subtitle="Track counts by area, station, and storage location"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowWizard(true); haptics.medium(); }}
              className="btn-primary h-8 px-3 text-xs flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Start Count Session
            </button>
            <button
              onClick={() => { setView('count-tasks'); haptics.light(); }}
              className="h-8 px-3 rounded-lg border border-border/60 card-glass text-xs font-bold text-foreground flex items-center gap-1.5 hover:bg-muted active:scale-95"
            >
              <ClipboardList className="h-3.5 w-3.5 text-primary" /> Count Tasks
            </button>
          </div>
        }
      />

      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Inventory</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setView('count-tasks'); haptics.light(); }}
              className="h-8 px-3 rounded-lg border border-border/60 card-glass text-xs font-bold text-muted-foreground flex items-center gap-1.5"
            >
              <ClipboardList className="h-3 w-3" /> Tasks
            </button>
            <button
              onClick={() => { setShowWizard(true); haptics.medium(); }}
              className="btn-primary text-xs h-8 px-3 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Start Count
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 lg:pt-14 pb-10 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasSession ? (
          <EmptyInventory
            onStartSession={() => setShowWizard(true)}
            onViewPurchasedItems={() => navigate('/purchased-items')}
          />
        ) : (
          <>
            {/* ── KPI Row 1: Session card + 4 progress cards ───── */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <SessionKpiCard
                name={sessionMeta.name}
                due={sessionMeta.due}
                status={todayCounts[0]?.status || 'in_progress'}
              />
              <KpiCard label="Areas Assigned"  value={kpis.assigned}  sub="All locations" />
              <KpiCard label="Areas Complete"  value={kpis.complete}  sub={`${kpis.completePct}%`} color={kpis.complete > 0 ? 'text-green-400' : 'text-foreground'} />
              <KpiCard label="In Progress"     value={kpis.inProg}    sub={`${kpis.inProgPct}%`}  color={kpis.inProg > 0 ? 'text-blue-400' : 'text-foreground'} />
              <KpiCard label="Not Started"     value={kpis.notStart}  sub={`${kpis.notStartPct}%`} color={kpis.notStart > 0 ? 'text-amber-400' : 'text-foreground'} />
            </div>

            {/* ── KPI Row 2: Stock status — colored borders + labels ── */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <KpiCard
                label="Low Stock"
                value={kpis.lowStock}
                sub="Items below par"
                labelColor="text-amber-400"
                color={kpis.lowStock > 0 ? 'text-amber-400' : 'text-foreground'}
                borderColor={kpis.lowStock > 0 ? 'border-amber-500/40' : 'border-border/60'}
                large
                onClick={kpis.lowStock > 0 ? () => setView('exceptions') : undefined}
              />
              <KpiCard
                label="Out of Stock"
                value={kpis.outStock}
                sub="Items"
                labelColor="text-red-400"
                color={kpis.outStock > 0 ? 'text-red-400' : 'text-foreground'}
                borderColor={kpis.outStock > 0 ? 'border-red-500/40' : 'border-border/60'}
                large
                onClick={kpis.outStock > 0 ? () => setView('exceptions') : undefined}
              />
              <KpiCard
                label="Uncounted Items"
                value={kpis.uncounted}
                sub="Need attention"
                labelColor="text-blue-400"
                color="text-foreground"
                borderColor="border-blue-500/25"
                large
              />
              <KpiCard
                label="Est. Inventory Value"
                value={`$${kpis.estValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                sub="Across all locations"
                labelColor="text-green-400"
                color="text-foreground"
                borderColor="border-green-500/25"
                large
              />
            </div>

            {/* ── Count Progress Table ──────────────────────────── */}
            <div className="overflow-hidden rounded-2xl border border-border/40" style={{ background: CARD_BG }}>
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Today's Count Progress
                </p>
              </div>

              {/* Desktop Column Headers */}
              <div className="hidden lg:grid items-center gap-3 px-4 py-2 border-b border-border/20"
                style={{ gridTemplateColumns: '160px 100px 1fr 110px 90px 80px 70px 76px' }}>
                {['LOCATION / STATION', 'ASSIGNED TO', 'PROGRESS', 'STATUS', 'ITEMS COUNTED', 'EXCEPTIONS', 'LAST UPDATED', 'ACTION'].map(h => (
                  <p key={h} className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{h}</p>
                ))}
              </div>

              {stations.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-muted-foreground">No stations configured.</p>
                  <button onClick={() => navigate('/operational-map')} className="mt-2 text-xs text-primary font-bold hover:underline">
                    Set up stations →
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop rows */}
                  <div className="hidden lg:block">
                    {stations.map(station => (
                      <StationRow
                        key={station.id || station.name}
                        station={station}
                        count={todayCounts.find(c => c.station === station.name)}
                        onAction={handleStationAction}
                      />
                    ))}
                  </div>
                  {/* Mobile rows */}
                  <div className="lg:hidden divide-y divide-border/15">
                    {stations.map(station => {
                      const count = todayCounts.find(c => c.station === station.name);
                      const prog  = progressOf(count);
                      const st    = statusOf(count?.status);
                      const isComplete = count?.status === 'submitted' || count?.status === 'complete';
                      return (
                        <div key={station.id || station.name} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold text-foreground truncate">{station.name}</p>
                              {count?.counted_by && <p className="text-[10px] text-muted-foreground truncate">{count.counted_by}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 rounded-full bg-border/30 overflow-hidden">
                                <div className={cn('h-full rounded-full', isComplete ? 'bg-green-400' : 'bg-primary')}
                                  style={{ width: `${prog}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0">{prog}%</span>
                              <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0', st.cls)}>{st.label}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleStationAction(station, count)}
                            className={cn(
                              'text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition-colors shrink-0',
                              !count || count.status === 'not_started'
                                ? 'btn-primary border-transparent'
                                : isComplete
                                ? 'bg-muted text-muted-foreground border-border/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                            )}
                          >
                            {!count || count.status === 'not_started' ? 'Start' : isComplete ? 'Review' : 'Continue'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* ── Needs Attention + Quick Actions ──────────────── */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Needs Attention */}
              <div className="overflow-hidden rounded-2xl border border-border/40" style={{ background: CARD_BG }}>
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Needs Attention</p>
                  </div>
                  {attentionItems.length > 0 && (
                    <button
                      onClick={() => setView('exceptions')}
                      className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>

                {attentionItems.length === 0 ? (
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400/60" />
                    <p className="text-xs text-muted-foreground">No exceptions — all items on target.</p>
                  </div>
                ) : (
                  <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
                    {attentionItems.slice(0, 3).map((item, i) => (
                      <div
                        key={i}
                        className="shrink-0 w-40 rounded-xl border border-border/40 bg-white/[0.02] px-3 py-2.5"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={cn('h-2 w-2 rounded-full shrink-0', item.type === 'out' ? 'bg-red-400' : 'bg-amber-400')} />
                          <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{item.location}</p>
                        <p className={cn('text-[10px] font-bold mt-0.5', item.type === 'out' ? 'text-red-400' : 'text-amber-400')}>
                          {item.type === 'out' ? 'Out of stock' : `Below par by ${item.diff} ${item.unit || ''}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="overflow-hidden rounded-2xl border border-border/40" style={{ background: CARD_BG }}>
                <div className="px-4 pt-4 pb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Quick Actions</p>
                </div>
                <div className="grid grid-cols-2 border-t border-border/20 divide-x divide-y divide-border/20">
                  {[
                    { icon: Package,   label: 'Purchased Items',   sub: 'Manage item database',   onClick: () => navigate('/purchased-items') },
                    { icon: Upload,    label: 'Import Items',      sub: 'CSV, invoices, or bulk', onClick: () => navigate('/purchased-items') },
                    { icon: BarChart2, label: 'Inventory Reports', sub: 'Value, usage, variance', onClick: () => {} },
                    { icon: Layers,    label: 'Par Levels',        sub: 'Manage par by location', onClick: () => navigate('/purchased-items') },
                  ].map(({ icon: Icon, label, sub, onClick }) => (
                    <button
                      key={label}
                      onClick={() => { onClick(); haptics.light(); }}
                      className="flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors active:scale-[0.99]"
                    >
                      <div className="h-7 w-7 rounded-lg bg-white/[0.05] border border-border/30 flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-primary/70" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground">{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showWizard && (
        <StartCountWizard
          stations={stations}
          onStart={handleSessionStart}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;
