import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, AlertTriangle, Package, Bell, CalendarDays, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const CATEGORIES = ['All Categories','protein','produce','dairy','dry-goods','frozen','beverage','alcohol','chemicals','disposables','other'];
const STATUSES = ['All Status','On Target','Low Stock','Out of Stock'];

const statusStyle = (onHand, par) => {
  if (onHand === undefined || onHand === null) return { label: 'Unknown', cls: 'bg-muted text-muted-foreground' };
  if (par && onHand <= 0) return { label: 'Out of Stock', cls: 'bg-red-500/20 text-red-400' };
  if (par && onHand <= par * 0.5) return { label: 'Low Stock', cls: 'bg-amber-500/20 text-amber-400' };
  return { label: 'On Target', cls: 'bg-green-500/20 text-green-400' };
};

export default function InventorySimplified() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All Categories');
  const [filterStatus, setFilterStatus] = useState('All Status');

  useEffect(() => {
    base44.entities.PurchasedItem.list('-updated_date', 200).then(data => {
      setItems(data.filter(i => i.active !== false));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    if (filterCat !== 'All Categories' && item.category !== filterCat) return false;
    const st = statusStyle(item.currentStock ?? item.parLevel, item.parLevel);
    if (filterStatus !== 'All Status' && st.label !== filterStatus) return false;
    if (search && !item.itemName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const lowStock = items.filter(i => { const s = statusStyle(i.currentStock ?? i.parLevel, i.parLevel); return s.label === 'Low Stock'; }).length;
  const outOfStock = items.filter(i => { const s = statusStyle(i.currentStock ?? i.parLevel, i.parLevel); return s.label === 'Out of Stock'; }).length;
  const totalValue = items.reduce((sum, i) => sum + ((i.currentStock || 0) * (i.unitCost || 0)), 0);

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="pb-24 lg:pb-0">
      <DesktopPageHeader title="Inventory" />
      {/* Desktop Header - legacy, hidden in favor of DesktopPageHeader */}
      <div className="hidden items-center justify-between px-8 pt-6 pb-4 border-b border-border/30">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Inventory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track stock levels and manage counts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/purchased-items')} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 active:scale-95">
            <Plus className="h-3.5 w-3.5" /> Create Purchase
          </button>
          <button onClick={() => navigate('/prep-count')} className="h-8 px-3 rounded-lg border border-border card-glass text-xs font-bold text-foreground flex items-center gap-1.5 hover:bg-muted active:scale-95">
            <Package className="h-3.5 w-3.5 text-primary" /> Count Tasks
          </button>
          <button onClick={() => navigate('/notifications')} className="h-8 w-8 rounded-lg border border-border card-glass flex items-center justify-center hover:bg-muted active:scale-95">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Inventory</h1>
          <button onClick={() => navigate('/purchased-items')} className="btn-primary text-xs h-8 px-3 flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-3 lg:px-8 lg:py-4 border-b border-border/30">
        {[
          { label: 'Total Value', value: `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, sub: 'Estimated', color: 'text-foreground' },
          { label: 'Low Stock Items', value: lowStock, sub: 'Needs attention', color: lowStock > 0 ? 'text-amber-400' : 'text-foreground' },
          { label: 'Out of Stock', value: outOfStock, sub: 'Need to order', color: outOfStock > 0 ? 'text-red-400' : 'text-foreground' },
          { label: 'Total Items', value: items.length, sub: 'Across locations', color: 'text-foreground' },
          { label: 'Par Level Items', value: items.filter(i => i.parLevel).length, sub: 'On target', color: 'text-green-400' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="card-glass border border-border/60 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="hidden lg:flex items-center gap-2 px-8 py-3 border-b border-border/30">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-8 px-3 rounded-lg card-glass border border-border text-xs text-foreground">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-3 rounded-lg card-glass border border-border text-xs text-foreground">
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="w-full h-8 pl-8 pr-3 card-glass border border-border rounded-lg text-xs text-foreground" />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">Showing {filtered.length} of {items.length} items</span>
      </div>

      {/* Mobile filters */}
      <div className="lg:hidden px-4 py-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded-lg text-sm text-foreground" />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 card-glass border border-border rounded-xl">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No inventory items found</p>
            <button onClick={() => navigate('/purchased-items')} className="mt-3 btn-primary text-xs px-4 py-2 flex items-center gap-1 mx-auto"><Plus className="h-3.5 w-3.5" />Add Items</button>
          </div>
        ) : (
          <div className="card-glass border border-border/60 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Item','Category','On Hand','Par Level','Status','Last Count','Unit Cost','Total Value','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.slice(0, 50).map(item => {
                  const st = statusStyle(item.currentStock ?? item.parLevel, item.parLevel);
                  const totalVal = (item.currentStock || 0) * (item.unitCost || 0);
                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-foreground">{item.itemName}</p>
                        {item.brand && <p className="text-[10px] text-muted-foreground">{item.brand}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{item.category || '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-foreground">{item.currentStock ?? '—'} {item.inventoryUnit || ''}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.parLevel ?? '—'} {item.inventoryUnit || ''}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', st.cls)}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-muted-foreground">{item.lastPriceUpdate ? new Date(item.lastPriceUpdate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) : '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.unitCost ? `$${item.unitCost.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-foreground">{totalVal > 0 ? `$${totalVal.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { haptics.light(); navigate('/purchased-items'); }} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 active:scale-95">
                          <Edit2 className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length > 50 && (
              <div className="px-4 py-3 border-t border-border/40 text-xs text-muted-foreground text-center">
                Showing 50 of {filtered.length} items — <button onClick={() => navigate('/purchased-items')} className="text-primary font-bold hover:underline">View All in Purchased Items</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden px-4 py-3 space-y-2">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : filtered.slice(0, 30).map(item => {
          const st = statusStyle(item.currentStock ?? item.parLevel, item.parLevel);
          return (
            <div key={item.id} className="card-glass border border-border rounded-xl px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-foreground">{item.itemName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', st.cls)}>{st.label}</span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>On Hand: <span className="font-bold text-foreground">{item.currentStock ?? '—'}</span></span>
                <span>Par: <span className="font-bold text-foreground">{item.parLevel ?? '—'}</span></span>
                {item.unitCost && <span>Cost: <span className="font-bold text-foreground">${item.unitCost.toFixed(2)}</span></span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const hideBase44Index = true;