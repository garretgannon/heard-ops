import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Search, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { toast } from 'sonner';

// ─── Item status ─────────────────────────────────────────────────────────────
function itemStatus(onHand, parLevel) {
  const val = String(onHand ?? '');
  if (val === '' || val === null) return { label: '—', dot: 'bg-muted-foreground/30', cls: 'text-muted-foreground' };
  const qty = Number(val);
  const par = Number(parLevel || 0);
  if (qty <= 0)              return { label: 'Out', dot: 'bg-red-400',   cls: 'text-red-400' };
  if (par > 0 && qty < par)  return { label: 'Low', dot: 'bg-amber-400', cls: 'text-amber-400' };
  return                            { label: 'OK',  dot: 'bg-green-400', cls: 'text-green-400' };
}

// ─── Category filter for count type ──────────────────────────────────────────
const TYPE_CATEGORIES = {
  food:       ['protein', 'produce', 'dairy', 'dry-goods', 'frozen', 'bakery', 'seafood'],
  bar:        ['alcohol', 'beverage'],
  chemicals:  ['chemicals', 'disposables'],
  smallwares: ['smallwares', 'paper', 'disposables'],
  full:       [],
};

export default function LocationCountSheet({ count, station, templates, purchasedItems, onSave, onBack }) {
  const countType = count?.shift || 'full';

  const [items, setItems] = useState(() => {
    if (count?.items?.length > 0) return count.items;

    // Build from station templates
    const stName = station?.name || count?.station || '';
    const tmplItems = templates
      .filter(t => !stName || t.station === stName)
      .map(t => ({
        template_id:      t.id,
        item_name:        t.item_name,
        on_hand_quantity: '',
        unit:             t.unit,
        par_level:        t.par_quantity,
        notes:            '',
      }));

    if (tmplItems.length > 0) return tmplItems;

    // Fall back to purchased items filtered by count type
    const cats = TYPE_CATEGORIES[countType] || [];
    const filtered = cats.length > 0
      ? purchasedItems.filter(p => cats.includes(p.category))
      : purchasedItems;

    return filtered.slice(0, 60).map(p => ({
      purchased_item_id: p.id,
      item_name:         p.itemName,
      on_hand_quantity:  '',
      unit:              p.inventoryUnit || p.purchaseUnit || '',
      par_level:         p.parLevel,
      notes:             '',
    }));
  });

  const [search,  setSearch]  = useState('');
  const [saving,  setSaving]  = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.item_name?.toLowerCase().includes(q));
  }, [items, search]);

  const countedItems = items.filter(i => i.on_hand_quantity !== '' && i.on_hand_quantity != null).length;
  const totalItems   = items.length;
  const progress     = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;

  const updateItem = (filteredIdx, field, value) => {
    const target = filtered[filteredIdx];
    setItems(prev => prev.map(item => item === target ? { ...item, [field]: value } : item));
  };

  const handleSave = async (submit = false) => {
    setSaving(true);
    try {
      const payload = {
        ...(count || {}),
        station:    station?.name || count?.station || '',
        shift:      countType,
        items,
        status:     submit ? 'submitted' : 'in_progress',
        date:       new Date().toISOString().split('T')[0],
      };
      if (count?.id) {
        await base44.entities.PrepInventoryCount.update(count.id, payload);
      } else {
        await base44.entities.PrepInventoryCount.create(payload);
      }
      haptics.success();
      toast.success(submit ? `Count submitted — ${countedItems} of ${totalItems} items` : 'Progress saved');
      onSave(payload);
    } catch {
      toast.error('Failed to save count');
    }
    setSaving(false);
  };

  const stationLabel = station?.name || count?.station || 'Count Sheet';
  const statusLabel  = count?.status === 'submitted' ? 'Submitted'
    : count?.status === 'in_progress' ? 'In Progress'
    : 'Not Started';
  const statusCls    = count?.status === 'submitted' ? 'bg-green-500/15 text-green-400'
    : count?.status === 'in_progress' ? 'bg-blue-500/15 text-blue-400'
    : 'bg-muted text-muted-foreground';

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background lg:static lg:z-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 border-b border-border/30"
        style={{ background: 'rgba(5,8,14,0.97)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={onBack}
            className="h-8 w-8 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black text-foreground">{stationLabel} Count</h2>
              <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full', statusCls)}>
                {statusLabel}
              </span>
              {count?.counted_by && (
                <span className="text-[10px] text-muted-foreground">{count.counted_by}</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {countedItems}/{totalItems} items · {progress}%
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-2">
          <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items in this location…"
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-white/[0.05] border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Desktop column headers */}
        <div className="hidden lg:grid px-4 py-2 border-t border-border/20"
          style={{ gridTemplateColumns: '1fr 80px 110px 70px 80px 36px' }}>
          {['ITEM', 'PAR LEVEL', 'ON HAND', 'UNIT', 'STATUS', ''].map(h => (
            <p key={h} className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{h}</p>
          ))}
        </div>
      </div>

      {/* ── Items list ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-xs text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/15">
            {filtered.map((item, idx) => {
              const st = itemStatus(item.on_hand_quantity, item.par_level);
              return (
                <div key={idx} className="hover:bg-white/[0.02]">
                  {/* Mobile */}
                  <div className="lg:hidden flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground leading-tight">{item.item_name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Par {item.par_level || '—'} {item.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.on_hand_quantity}
                        onChange={e => updateItem(idx, 'on_hand_quantity', e.target.value)}
                        placeholder="0"
                        inputMode="decimal"
                        className="w-16 h-10 text-center rounded-lg bg-white/[0.05] border border-border/40 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50"
                      />
                      <div className={cn('h-2 w-2 rounded-full shrink-0', st.dot)} />
                    </div>
                  </div>

                  {/* Desktop */}
                  <div
                    className="hidden lg:grid items-center px-4 py-2.5 gap-3"
                    style={{ gridTemplateColumns: '1fr 80px 110px 70px 80px 36px' }}
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.item_name}</p>
                      {item.notes && <p className="text-[10px] text-muted-foreground">{item.notes}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.par_level || '—'}</p>
                    <input
                      type="number"
                      value={item.on_hand_quantity}
                      onChange={e => updateItem(idx, 'on_hand_quantity', e.target.value)}
                      placeholder="—"
                      inputMode="decimal"
                      className="h-8 text-center rounded-lg bg-white/[0.05] border border-border/40 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50"
                    />
                    <p className="text-xs text-muted-foreground">{item.unit || '—'}</p>
                    <div className="flex items-center gap-1.5">
                      <div className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                      <span className={cn('text-[10px] font-bold', st.cls)}>{st.label}</span>
                    </div>
                    <button className="h-7 w-7 rounded-lg bg-white/[0.03] border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer actions ───────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-4 border-t border-border/30"
        style={{ background: 'rgba(5,8,14,0.97)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => { handleSave(false); haptics.light(); }}
          disabled={saving}
          className="flex-1 h-10 rounded-xl border border-border/50 text-sm font-bold text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors"
        >
          Save Progress
        </button>
        <button
          onClick={() => { handleSave(true); haptics.medium(); }}
          disabled={saving}
          className="btn-primary flex-1 h-10 text-sm font-bold"
        >
          Submit Count ({countedItems} of {totalItems})
        </button>
      </div>
    </div>
  );
}
