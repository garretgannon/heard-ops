import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Truck, AlertTriangle, Check, ChevronDown, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ISSUE_TYPES = [
  { value: 'shorted',         label: 'Shorted (missing items)' },
  { value: 'damaged',         label: 'Damaged' },
  { value: 'wrong_item',      label: 'Wrong item' },
  { value: 'substitution',    label: 'Substitution' },
  { value: 'price_issue',     label: 'Price discrepancy' },
  { value: 'missing_invoice', label: 'Missing invoice' },
  { value: 'credit_needed',   label: 'Credit needed' },
  { value: 'other',           label: 'Other' },
];

const VENDOR_CATEGORIES = [
  { value: 'food',        label: 'Food' },
  { value: 'beverage',    label: 'Beverage' },
  { value: 'alcohol',     label: 'Alcohol' },
  { value: 'equipment',   label: 'Equipment' },
  { value: 'chemicals',   label: 'Chemicals' },
  { value: 'disposables', label: 'Disposables' },
  { value: 'linen',       label: 'Linen' },
  { value: 'other',       label: 'Other' },
];

export default function NewReceivingDrawer({ vendors, user, onSave, onClose, onVendorCreated }) {
  const [step, setStep] = useState('form'); // 'form' | 'new_vendor'
  const [saving, setSaving] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [hasIssue, setHasIssue] = useState(false);
  const [form, setForm] = useState({
    vendor_id: '',
    vendor_name: '',
    invoice_number: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    total_amount: '',
    tax_amount: '',
    delivery_fee: '',
    received_by: user?.name || user?.full_name || '',
    notes: '',
  });
  const [issue, setIssue] = useState({
    issue_type: '',
    description: '',
    credit_requested: '',
  });
  const [newVendor, setNewVendor] = useState({
    name: '',
    category: 'food',
    contact_person: '',
    phone: '',
    email: '',
  });
  const [creatingVendor, setCreatingVendor] = useState(false);

  const filteredVendors = vendors.filter(v =>
    !vendorSearch || v.name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const selectVendor = (v) => {
    setForm(f => ({ ...f, vendor_id: v.id, vendor_name: v.name }));
    setVendorSearch(v.name);
    setShowVendorDropdown(false);
  };

  const handleCreateVendor = async () => {
    if (!newVendor.name.trim()) return;
    setCreatingVendor(true);
    try {
      const created = await base44.entities.Vendor.create({ ...newVendor, active: true });
      setForm(f => ({ ...f, vendor_id: created.id, vendor_name: created.name }));
      setVendorSearch(created.name);
      setStep('form');
      onVendorCreated?.();
    } finally {
      setCreatingVendor(false);
    }
  };

  const handleSave = async () => {
    if (!form.vendor_name || saving) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        total_amount: parseFloat(form.total_amount) || 0,
        tax_amount: parseFloat(form.tax_amount) || 0,
        delivery_fee: parseFloat(form.delivery_fee) || 0,
        has_issues: hasIssue,
        status: hasIssue ? 'needs_review' : 'received',
        received_at: new Date().toISOString(),
      };
      const created = await base44.entities.ReceivingInvoice.create(payload);
      if (hasIssue && issue.issue_type) {
        await base44.entities.ReceivingIssue.create({
          receiving_invoice_id: created.id,
          issue_type: issue.issue_type,
          description: issue.description,
          credit_requested: parseFloat(issue.credit_requested) || 0,
          created_by: user?.name || user?.full_name || '',
        });
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  // New Vendor sub-step
  if (step === 'new_vendor') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center lg:p-4" onClick={onClose}>
        <div
          className="w-full max-w-lg card-glass border border-border/50 rounded-t-3xl lg:rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/30">
            <h2 className="text-base font-bold text-foreground">Add New Vendor</h2>
            <button onClick={() => setStep('form')} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="px-5 py-4 space-y-3 pb-8">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Vendor Name *</label>
              <input
                value={newVendor.name}
                onChange={e => setNewVendor(v => ({ ...v, name: e.target.value }))}
                placeholder="e.g. Sysco, US Foods…"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Category</label>
              <select
                value={newVendor.category}
                onChange={e => setNewVendor(v => ({ ...v, category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground"
              >
                {VENDOR_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Contact</label>
                <input
                  value={newVendor.contact_person}
                  onChange={e => setNewVendor(v => ({ ...v, contact_person: e.target.value }))}
                  placeholder="Name"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Phone</label>
                <input
                  value={newVendor.phone}
                  onChange={e => setNewVendor(v => ({ ...v, phone: e.target.value }))}
                  placeholder="(555) 000-0000"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Email</label>
              <input
                type="email"
                value={newVendor.email}
                onChange={e => setNewVendor(v => ({ ...v, email: e.target.value }))}
                placeholder="orders@vendor.com"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep('form')} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-secondary">
                Cancel
              </button>
              <button
                onClick={handleCreateVendor}
                disabled={!newVendor.name.trim() || creatingVendor}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-110 disabled:opacity-50"
              >
                {creatingVendor ? 'Saving…' : 'Create Vendor'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center lg:p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg card-glass border border-border/50 rounded-t-3xl lg:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/30 shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">New Receiving</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Log a delivery or invoice</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Vendor selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Vendor *</label>
            <div className="relative">
              <input
                value={vendorSearch}
                onChange={e => {
                  setVendorSearch(e.target.value);
                  setShowVendorDropdown(true);
                  setForm(f => ({ ...f, vendor_id: '', vendor_name: e.target.value }));
                }}
                onFocus={() => setShowVendorDropdown(true)}
                placeholder="Search vendors…"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground pr-9"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              {showVendorDropdown && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {filteredVendors.map(v => (
                    <button
                      key={v.id}
                      onClick={() => selectVendor(v)}
                      className="w-full text-left px-3 py-2.5 hover:bg-secondary text-sm text-foreground flex items-center gap-2"
                    >
                      <Truck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{v.name}</span>
                      {v.category && <span className="text-[10px] text-muted-foreground shrink-0 capitalize">{v.category}</span>}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setShowVendorDropdown(false);
                      setStep('new_vendor');
                      setNewVendor(nv => ({ ...nv, name: vendorSearch }));
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-primary/10 text-sm text-primary flex items-center gap-2 border-t border-border/50"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>Add new vendor{vendorSearch ? ` "${vendorSearch}"` : ''}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Invoice # + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Invoice #</label>
              <input
                value={form.invoice_number}
                onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))}
                placeholder="e.g. INV-00123"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Invoice Date</label>
              <input
                type="date"
                value={form.invoice_date}
                onChange={e => setForm(f => ({ ...f, invoice_date: e.target.value }))}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground"
              />
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'total_amount',  label: 'Total' },
              { key: 'tax_amount',    label: 'Tax' },
              { key: 'delivery_fee',  label: 'Del. Fee' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Received By */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Received By</label>
            <input
              value={form.received_by}
              onChange={e => setForm(f => ({ ...f, received_by: e.target.value }))}
              placeholder="Your name"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground"
            />
          </div>

          {/* Delivery status toggle */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Delivery Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setHasIssue(false)}
                className={cn(
                  'py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all',
                  !hasIssue
                    ? 'bg-green-500/15 border-green-500/40 text-green-400'
                    : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-border'
                )}
              >
                <Check className="h-4 w-4" /> Received Clean
              </button>
              <button
                onClick={() => setHasIssue(true)}
                className={cn(
                  'py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all',
                  hasIssue
                    ? 'bg-red-500/15 border-red-500/40 text-red-400'
                    : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-border'
                )}
              >
                <AlertTriangle className="h-4 w-4" /> Issue Found
              </button>
            </div>
          </div>

          {/* Issue form */}
          {hasIssue && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Issue Details</p>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">What Happened</label>
                <select
                  value={issue.issue_type}
                  onChange={e => setIssue(i => ({ ...i, issue_type: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground"
                >
                  <option value="">Select issue type…</option>
                  {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Notes</label>
                <textarea
                  value={issue.description}
                  onChange={e => setIssue(i => ({ ...i, description: e.target.value }))}
                  placeholder="Describe the issue…"
                  rows={3}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Credit Requested</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={issue.credit_requested}
                    onChange={e => setIssue(i => ({ ...i, credit_requested: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes…"
              rows={2}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-8 pt-3 border-t border-border/30 flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.vendor_name || saving}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving…' : 'Save Receiving'}
          </button>
        </div>
      </div>
    </div>
  );
}
