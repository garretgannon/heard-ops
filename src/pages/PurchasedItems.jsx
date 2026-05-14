import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { haptics } from '@/utils/haptics';
import {
  Package, Search, Plus, Upload, AlertTriangle, ChevronRight,
  TrendingUp, CheckCircle2, XCircle, Filter, Download, RefreshCw
} from 'lucide-react';
import PurchasedItemDetail from '@/components/purchased-items/PurchasedItemDetail';
import PurchasedItemForm from '@/components/purchased-items/PurchasedItemForm';
import VendorImportFlow from '@/components/purchased-items/VendorImportFlow';
import DesktopPageHeader from '@/components/DesktopPageHeader';

const CATEGORY_LABELS = {
  protein: 'Protein', produce: 'Produce', dairy: 'Dairy',
  'dry-goods': 'Dry Goods', frozen: 'Frozen', beverage: 'Beverage',
  alcohol: 'Alcohol', chemicals: 'Chemicals', disposables: 'Disposables',
  smallwares: 'Smallwares', paper: 'Paper/Pkg', bakery: 'Bakery',
  seafood: 'Seafood', other: 'Other',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'missing-cost', label: 'Missing Cost' },
  { key: 'missing-vendor', label: 'Missing Vendor' },
  { key: 'missing-conversion', label: 'No Conversion' },
  { key: 'price-changed', label: 'Price Changed' },
  { key: 'archived', label: 'Archived' },
];

function SummaryCard({ items, isAdmin }) {
  const active = items.filter(i => i.active !== false);
  const missingCost = active.filter(i => !i.unitCost && !i.caseCost);
  const missingVendor = active.filter(i => !i.vendorName);
  const missingConversion = active.filter(i => !i.recipeUnit || !i.conversionFactor);

  return (
    <div className="card-glass border border-border rounded-xl p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Purchased Items</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Item master for recipe costing, inventory, vendors, and waste.</p>
        </div>
        <Package className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-lg font-extrabold text-foreground">{items.length}</p>
          <p className="text-[9px] font-bold text-muted-foreground uppercase">Total</p>
        </div>
        <div className="bg-primary/10 rounded-lg p-2 text-center">
          <p className="text-lg font-extrabold text-primary">{active.length}</p>
          <p className="text-[9px] font-bold text-muted-foreground uppercase">Active</p>
        </div>
        {isAdmin && (
          <>
            <div className={`rounded-lg p-2 text-center ${missingCost.length > 0 ? 'bg-amber-500/10' : 'bg-muted/50'}`}>
              <p className={`text-lg font-extrabold ${missingCost.length > 0 ? 'text-amber-400' : 'text-foreground'}`}>{missingCost.length}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase">No Cost</p>
            </div>
            <div className={`rounded-lg p-2 text-center ${missingVendor.length > 0 ? 'bg-amber-500/10' : 'bg-muted/50'}`}>
              <p className={`text-lg font-extrabold ${missingVendor.length > 0 ? 'text-amber-400' : 'text-foreground'}`}>{missingVendor.length}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase">No Vendor</p>
            </div>
            <div className={`rounded-lg p-2 text-center ${missingConversion.length > 0 ? 'bg-red-500/10' : 'bg-muted/50'}`}>
              <p className={`text-lg font-extrabold ${missingConversion.length > 0 ? 'text-red-400' : 'text-foreground'}`}>{missingConversion.length}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase">No Conversion</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ItemCard({ item, onClick, isAdmin }) {
  const hasCost = item.unitCost || item.caseCost || item.caseCost === 0;
  const hasConversion = item.recipeUnit && item.conversionFactor;
  const costDisplay = item.costPerRecipeUnit
    ? `$${Number(item.costPerRecipeUnit).toFixed(4)} / ${item.recipeUnit}`
    : item.unitCost
    ? `$${Number(item.unitCost).toFixed(2)} / ${item.purchaseUnit || 'unit'}`
    : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-card border rounded-xl overflow-hidden active:scale-[0.99] transition-all ${item.active === false ? 'opacity-60 border-border' : 'border-border'}`}
    >
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight truncate">{item.itemName}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {CATEGORY_LABELS[item.category] || item.category || 'Uncategorized'}
              {item.vendorName ? ` · ${item.vendorName}` : ''}
            </p>
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${item.active !== false ? 'bg-green-500/20 text-green-300' : 'bg-muted text-muted-foreground'}`}>
            {item.active !== false ? 'Active' : 'Archived'}
          </span>
        </div>

        {(item.packSize || item.purchaseUnit) && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {item.purchaseUnit ? `${item.purchaseUnit}` : ''}{item.packSize ? `: ${item.packSize}` : ''}
            {isAdmin && item.caseCost ? ` · $${Number(item.caseCost).toFixed(2)}` : ''}
          </p>
        )}

        {isAdmin && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {costDisplay ? (
              <span className="text-[11px] font-bold text-primary">{costDisplay}</span>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                <AlertTriangle className="h-3 w-3" /> Missing cost
              </span>
            )}
            {!hasConversion && hasCost && (
              <span className="text-[10px] font-bold text-red-400 flex items-center gap-0.5">
                <AlertTriangle className="h-3 w-3" /> Conversion needed
              </span>
            )}
          </div>
        )}
      </div>
      <div className="border-t border-border/60 px-4 py-2 flex items-center justify-between bg-muted/20">
        <span className="text-[10px] text-muted-foreground">
          {item.brand || item.subcategory || ''}
        </span>
        <span className="text-[10px] font-bold text-primary flex items-center gap-1">
          View <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

export default function PurchasedItems() {
  const { isAdmin, user } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PurchasedItem.list('-updated_date', 500).catch(() => []);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    if (search && !item.itemName?.toLowerCase().includes(q) && !item.vendorName?.toLowerCase().includes(q) && !item.category?.toLowerCase().includes(q)) return false;
    switch (activeFilter) {
      case 'active': return item.active !== false;
      case 'archived': return item.active === false;
      case 'missing-cost': return item.active !== false && !item.unitCost && !item.caseCost;
      case 'missing-vendor': return item.active !== false && !item.vendorName;
      case 'missing-conversion': return item.active !== false && (!item.recipeUnit || !item.conversionFactor);
      case 'price-changed': return !!item.lastPriceUpdate;
      default: return true;
    }
  });

  const handleSave = () => {
    load();
    setShowForm(false);
    setEditingItem(null);
    setSelected(null);
  };

  if (showImport) {
    return <VendorImportFlow onClose={() => setShowImport(false)} onComplete={() => { setShowImport(false); load(); }} />;
  }

  if (selected) {
    return (
      <PurchasedItemDetail
        item={selected}
        isAdmin={isAdmin}
        onClose={() => setSelected(null)}
        onEdit={(i) => { setSelected(null); setEditingItem(i); setShowForm(true); }}
        onSave={handleSave}
      />
    );
  }

  if (showForm) {
    return (
      <PurchasedItemForm
        item={editingItem}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditingItem(null); }}
      />
    );
  }

  return (
    <div className="pb-28">
      <DesktopPageHeader title="Purchased Items" subtitle="Item master for recipe costing, inventory, vendors, and waste" />
      {/* Header */}
      <div className="lg:hidden bg-card border-b border-border sticky top-0 z-10">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h1 className="text-2xl font-black tracking-tight text-foreground">Purchased Items</h1>
            </div>
            {isAdmin && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setShowImport(true); haptics.medium(); }}
                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground border border-border flex items-center gap-1"
                >
                  <Upload className="h-3 w-3" /> Import
                </button>
                <button
                  onClick={() => { setEditingItem(null); setShowForm(true); haptics.medium(); }}
                  className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Item master for recipe costing, inventory, vendors, and waste.</p>

          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search purchased items…"
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeFilter === f.key ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 lg:px-8 lg:py-6 space-y-4">
        <SummaryCard items={items} isAdmin={isAdmin} />

        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 card-glass border border-border rounded-xl">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground font-semibold">No items found</p>
            {isAdmin && items.length === 0 && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <button onClick={() => setShowImport(true)} className="btn-primary text-xs px-4 py-2 flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5" /> Import Items
                </button>
                <button onClick={() => { setEditingItem(null); setShowForm(true); }} className="btn-secondary text-xs px-4 py-2 flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Manually
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  onClick={() => { haptics.light(); setSelected(item); }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;