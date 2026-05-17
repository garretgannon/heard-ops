import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  draft:         { label: 'Draft',         bg: 'bg-muted/60',         text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  received:      { label: 'Received',      bg: 'bg-green-500/15',     text: 'text-green-400',        dot: 'bg-green-400' },
  needs_review:  { label: 'Needs Review',  bg: 'bg-amber-500/15',     text: 'text-amber-400',        dot: 'bg-amber-400' },
  approved:      { label: 'Approved',      bg: 'bg-blue-500/15',      text: 'text-blue-400',         dot: 'bg-blue-400' },
  credit_needed: { label: 'Credit Needed', bg: 'bg-red-500/15',       text: 'text-red-400',          dot: 'bg-red-400' },
  resolved:      { label: 'Resolved',      bg: 'bg-teal-500/15',      text: 'text-teal-400',         dot: 'bg-teal-400' },
};

const ISSUE_LABELS = {
  shorted:         'Shorted',
  damaged:         'Damaged',
  wrong_item:      'Wrong Item',
  substitution:    'Substitution',
  price_issue:     'Price Issue',
  missing_invoice: 'Missing Invoice',
  credit_needed:   'Credit Needed',
  other:           'Other',
};

function fmt$(n) {
  if (!n && n !== 0) return '—';
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

export default function ReceivingDetailDrawer({ invoice, issues, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setShowStatusPicker(false);
    try {
      await base44.entities.ReceivingInvoice.update(invoice.id, { status: newStatus });
      onUpdate();
    } finally {
      setUpdating(false);
    }
  };

  const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;

  const dateStr = invoice.invoice_date
    ? format(parseISO(invoice.invoice_date), 'MMM d, yyyy')
    : '—';
  const receivedStr = invoice.received_at
    ? format(new Date(invoice.received_at), 'MMM d, yyyy h:mm a')
    : '—';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-stretch lg:justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg lg:max-w-md lg:h-full card-glass border border-border/50 rounded-t-3xl lg:rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh] lg:max-h-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border/30 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Receiving Detail</p>
            <h2 className="text-base font-bold text-foreground mt-0.5 truncate">{invoice.vendor_name || 'Unknown Vendor'}</h2>
            {invoice.invoice_number && (
              <p className="text-xs text-muted-foreground mt-0.5">#{invoice.invoice_number}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {/* Status picker */}
            <div className="relative">
              <button
                onClick={() => setShowStatusPicker(!showStatusPicker)}
                disabled={updating}
                className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-opacity', cfg.bg, updating && 'opacity-50')}
              >
                <div className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                <span className={cn('text-xs font-bold', cfg.text)}>{cfg.label}</span>
                <ChevronDown className={cn('h-3 w-3', cfg.text)} />
              </button>
              {showStatusPicker && (
                <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-20 min-w-40 overflow-hidden">
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className="w-full text-left px-3 py-2.5 hover:bg-secondary text-xs font-bold text-foreground flex items-center gap-2"
                    >
                      <div className={cn('h-2 w-2 rounded-full', val.dot)} />
                      {val.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">

          {/* Amount summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',    value: fmt$(invoice.total_amount) },
              { label: 'Tax',      value: fmt$(invoice.tax_amount) },
              { label: 'Del. Fee', value: fmt$(invoice.delivery_fee) },
            ].map(({ label, value }) => (
              <div key={label} className="card-glass border border-border/30 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-foreground leading-none">{value}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Info fields */}
          <div className="space-y-3">
            <Field label="Invoice Date" value={dateStr} />
            <Field label="Received At" value={receivedStr} />
            <Field label="Received By" value={invoice.received_by} />
            <Field label="Notes" value={invoice.notes} />
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Issues ({issues.length})
              </p>
              <div className="space-y-2">
                {issues.map(issue => (
                  <div key={issue.id} className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          <p className="text-sm font-bold text-red-300">
                            {ISSUE_LABELS[issue.issue_type] || issue.issue_type || 'Issue'}
                          </p>
                        </div>
                        {issue.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{issue.description}</p>
                        )}
                      </div>
                      {issue.credit_requested > 0 && (
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] text-muted-foreground">Requested</p>
                          <p className="text-sm font-bold text-foreground">{fmt$(issue.credit_requested)}</p>
                        </div>
                      )}
                    </div>
                    {issue.resolved_at && (
                      <div className="flex items-center gap-1 mt-2 text-[11px] text-teal-400 font-bold">
                        <CheckCircle2 className="h-3 w-3" />
                        Resolved {format(new Date(issue.resolved_at), 'MMM d')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-8 pt-3 border-t border-border/30 shrink-0">
          <button onClick={onClose} className="w-full py-3 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-secondary transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
