import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format, isToday, startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';
import { Truck, Plus, Search, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import NewReceivingDrawer from '@/components/receiving/NewReceivingDrawer';
import ReceivingDetailDrawer from '@/components/receiving/ReceivingDetailDrawer';
import { getMicrocopy } from '@/lib/microcopy';

const STATUS_CONFIG = {
  draft:         { label: 'Draft',         bg: 'bg-muted/60',         text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  received:      { label: 'Received',      bg: 'bg-green-500/15',     text: 'text-green-400',        dot: 'bg-green-400' },
  needs_review:  { label: 'Needs Review',  bg: 'bg-amber-500/15',     text: 'text-amber-400',        dot: 'bg-amber-400' },
  approved:      { label: 'Approved',      bg: 'bg-blue-500/15',      text: 'text-blue-400',         dot: 'bg-blue-400' },
  credit_needed: { label: 'Credit Needed', bg: 'bg-red-500/15',       text: 'text-red-400',          dot: 'bg-red-400' },
  resolved:      { label: 'Resolved',      bg: 'bg-teal-500/15',      text: 'text-teal-400',         dot: 'bg-teal-400' },
};

const FILTER_TABS = [
  { key: 'all',          label: 'All' },
  { key: 'received',     label: 'Received' },
  { key: 'needs_review', label: 'Needs Review' },
  { key: 'credit_needed',label: 'Credit Needed' },
  { key: 'approved',     label: 'Approved' },
];

function fmt$(n) {
  if (!n && n !== 0) return '—';
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function sumAmounts(arr) {
  return arr.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
}

function StatCard({ icon: Icon, label, count, amount, iconClass }) {
  return (
    <div className="card-glass border border-border/50 rounded-2xl p-4 flex-1 min-w-0">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">{label}</p>
        <div className={cn('h-7 w-7 rounded-2xl flex items-center justify-center shrink-0', iconClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      {count !== undefined && (
        <p className="text-2xl font-black text-foreground leading-none">{count}</p>
      )}
      <p className={cn('font-bold mt-1', count !== undefined ? 'text-sm text-muted-foreground' : 'text-2xl text-foreground')}>{amount}</p>
    </div>
  );
}

function InvoiceRow({ invoice, issues, onClick }) {
  const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
  const rowIssues = issues.filter(i => i.receiving_invoice_id === invoice.id);
  const dateStr = invoice.invoice_date
    ? format(parseISO(invoice.invoice_date), 'MMM d')
    : invoice.received_at
    ? format(new Date(invoice.received_at), 'MMM d')
    : '—';

  return (
    <button
      onClick={onClick}
      className="w-full text-left card-glass border border-border/50 rounded-2xl px-4 py-3 hover:border-primary/30 hover:brightness-110 transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate">{invoice.vendor_name || 'Unknown Vendor'}</p>
            {rowIssues.length > 0 && (
              <div className="flex items-center gap-0.5 bg-red-500/15 rounded px-1.5 py-0.5 shrink-0">
                <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
                <span className="text-[10px] font-bold text-red-400">{rowIssues.length}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-[11px] text-muted-foreground">{invoice.invoice_number ? `#${invoice.invoice_number}` : 'No invoice #'}</p>
            <span className="text-muted-foreground/30 text-[10px]">·</span>
            <p className="text-[11px] text-muted-foreground">{dateStr}</p>
            {invoice.received_by && (
              <>
                <span className="text-muted-foreground/30 text-[10px]">·</span>
                <p className="text-[11px] text-muted-foreground truncate">{invoice.received_by}</p>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <p className="text-sm font-bold text-foreground tabular-nums">{fmt$(invoice.total_amount)}</p>
          <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5', cfg.bg)}>
            <div className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
            <span className={cn('text-[10px] font-bold', cfg.text)}>{cfg.label}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Receiving() {
  const { user } = useCurrentUser();
  const [invoices, setInvoices] = useState([]);
  const [issues, setIssues] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [emptyReceivingCopy] = useState(() => getMicrocopy('emptyReceiving', ''));

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, iss, vend] = await Promise.all([
        base44.entities.ReceivingInvoice.list('-received_at', 200).catch(() => []),
        base44.entities.ReceivingIssue.list('-created_date', 500).catch(() => []),
        base44.entities.Vendor.list('-updated_date', 200).catch(() => []),
      ]);
      setInvoices(inv || []);
      setIssues(iss || []);
      setVendors(vend || []);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  function getDate(inv) {
    if (inv.received_at) return new Date(inv.received_at);
    if (inv.invoice_date) return parseISO(inv.invoice_date);
    return null;
  }

  const todayInvoices = invoices.filter(inv => { const d = getDate(inv); return d && isToday(d); });
  const needsReview = invoices.filter(i => i.status === 'needs_review');
  const creditNeeded = invoices.filter(i => i.status === 'credit_needed');
  const weekInvoices = invoices.filter(inv => {
    const d = getDate(inv);
    return d && isWithinInterval(d, { start: weekStart, end: weekEnd });
  });

  const filtered = invoices.filter(inv => {
    if (activeFilter !== 'all' && inv.status !== activeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!inv.vendor_name?.toLowerCase().includes(q) && !inv.invoice_number?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSaved = async () => {
    setShowNew(false);
    await loadData();
  };

  const handleUpdated = async () => {
    setSelectedInvoice(null);
    await loadData();
  };

  return (
    <div className="app-screen">
      <DesktopPageHeader
        title="Receiving"
        subtitle="Invoices, deliveries, and vendor receiving"
        actions={
          <button
            onClick={() => { haptics.medium(); setShowNew(true); }}
            className="btn-primary text-xs h-8 px-3 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> New Receiving
          </button>
        }
      />

      {/* Mobile header */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Receiving</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Invoices and deliveries</p>
        </div>
        <button
          onClick={() => { haptics.medium(); setShowNew(true); }}
          className="btn-primary h-9 w-9 rounded-2xl flex items-center justify-center p-0"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:mt-14">
        <StatCard
          icon={Truck}
          label="Received Today"
          count={todayInvoices.length}
          amount={fmt$(sumAmounts(todayInvoices))}
          iconClass="bg-green-500/15 text-green-400"
        />
        <StatCard
          icon={Clock}
          label="Needs Review"
          count={needsReview.length}
          amount={fmt$(sumAmounts(needsReview))}
          iconClass="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Credits Needed"
          count={creditNeeded.length}
          amount={fmt$(sumAmounts(creditNeeded))}
          iconClass="bg-red-500/15 text-red-400"
        />
        <StatCard
          icon={DollarSign}
          label="Vendor Spend This Week"
          amount={fmt$(sumAmounts(weekInvoices))}
          iconClass="bg-primary/15 text-primary"
        />
      </div>

      {/* Search + filter tabs */}
      <div className="px-4 space-y-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendor or invoice #…"
            className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border/50 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors',
                activeFilter === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice list */}
      <div className="px-4 pb-24 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="heard-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-bold text-muted-foreground">No invoices yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {emptyReceivingCopy || 'Tap + to log a new delivery'}
            </p>
          </div>
        ) : (
          filtered.map(inv => (
            <InvoiceRow
              key={inv.id}
              invoice={inv}
              issues={issues}
              onClick={() => { haptics.light(); setSelectedInvoice(inv); }}
            />
          ))
        )}
      </div>

      {showNew && (
        <NewReceivingDrawer
          vendors={vendors}
          user={user}
          onSave={handleSaved}
          onClose={() => setShowNew(false)}
          onVendorCreated={loadData}
        />
      )}

      {selectedInvoice && (
        <ReceivingDetailDrawer
          invoice={selectedInvoice}
          issues={issues.filter(i => i.receiving_invoice_id === selectedInvoice.id)}
          onClose={() => setSelectedInvoice(null)}
          onUpdate={handleUpdated}
        />
      )}
    </div>
  );
}
