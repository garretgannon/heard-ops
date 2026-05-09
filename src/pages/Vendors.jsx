import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Phone, Mail, Bell, ChevronRight, Truck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const CAT_LABELS = { food: 'Food', beverage: 'Beverage', repairs: 'Repairs', equipment: 'Equipment', linen: 'Linen', pest: 'Pest Control', grease_trap: 'Grease Trap', plumbing: 'Plumbing', electrical: 'Electrical', pos: 'POS', hood_cleaning: 'Hood Cleaning', other: 'Other' };

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Vendor.list('-updated_date', 200).catch(() => []),
      base44.entities.Equipment.list('-updated_date', 300).catch(() => [])
    ]).then(([vendorData, equipData]) => {
      setVendors(vendorData);
      setEquipment(equipData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = vendors.filter(v => {
    if (filterCat && v.category !== filterCat) return false;
    if (filterStatus === 'active' && v.active === false) return false;
    if (filterStatus === 'inactive' && v.active !== false) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = [...new Set(vendors.map(v => v.category).filter(Boolean))];

  return (
    <div className="pb-24 lg:pb-0">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/30">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Vendors</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage vendor relationships and ordering</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => base44.entities.Vendor.create({ name: 'New Vendor', active: true }).then(() => base44.entities.Vendor.list('-updated_date', 200).then(setVendors))} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 active:scale-95">
            <Plus className="h-3.5 w-3.5" /> Add Vendor
          </button>
          <button className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted active:scale-95">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Vendors</h1>
      </div>

      {/* Filters */}
      <div className="lg:flex items-center gap-2 px-4 lg:px-8 py-3 border-b border-border/30 hidden">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-8 px-3 rounded-lg bg-card border border-border text-xs text-foreground">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-3 rounded-lg bg-card border border-border text-xs text-foreground">
          <option value="">All Vendors</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="w-full h-8 pl-8 pr-3 bg-card border border-border rounded-lg text-xs text-foreground" />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">Showing {filtered.length} vendors</span>
      </div>

      {/* Mobile search */}
      <div className="lg:hidden px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded-lg text-sm text-foreground" />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Truck className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No vendors found</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Vendor Directory</p>
            <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Vendor','Categories','Contact','Ordering Days','Next Order','Quick Actions','Equipment'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map(vendor => {
                     const vendorEquip = equipment.filter(e => e.vendorId === vendor.id);
                     return (
                    <tr key={vendor.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                            <span className="text-xs font-extrabold text-primary">{vendor.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground flex items-center gap-1">
                              {vendor.name}
                              {vendor.is_preferred && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                            </p>
                            {vendor.address && <p className="text-[10px] text-muted-foreground">{vendor.city || vendor.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{CAT_LABELS[vendor.category] || vendor.category || '—'}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-foreground">{vendor.contact_person || '—'}</p>
                        {vendor.phone && <p className="text-[10px] text-muted-foreground">{vendor.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{vendor.delivery_days || '—'}</td>
                      <td className="px-4 py-3">
                        {vendor.has_pending_order ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Today</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {vendor.phone && (
                            <a href={`tel:${vendor.phone}`} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/15 active:scale-95 transition-all">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                            </a>
                          )}
                          {vendor.email && (
                            <a href={`mailto:${vendor.email}`} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/15 active:scale-95 transition-all">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            </a>
                          )}
                          <button onClick={() => { haptics.light(); setSelected(vendor); }} className="h-7 px-2 rounded-lg bg-muted flex items-center gap-1 hover:bg-primary/15 active:scale-95 transition-all">
                            <Plus className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground">Order</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {equipment.filter(e => e.vendorId === vendor.id).length} items
                      </td>
                      </tr>
                      );
                      })}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border/40 text-xs text-muted-foreground">
                Showing 1–{Math.min(filtered.length, 200)} of {filtered.length} vendors
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden px-4 py-3 space-y-2">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : filtered.map(vendor => (
          <div key={vendor.id} className="bg-card border border-border rounded-xl px-4 py-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-1">
                  {vendor.name}
                  {vendor.is_preferred && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{CAT_LABELS[vendor.category] || vendor.category || 'General'}</p>
                {equipment.filter(e => e.vendorId === vendor.id).length > 0 && <p className="text-[10px] text-blue-400 mt-1">{equipment.filter(e => e.vendorId === vendor.id).length} equipment linked</p>}
              </div>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', vendor.active !== false ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground')}>
                {vendor.active !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            {vendor.contact_person && <p className="text-xs text-muted-foreground">{vendor.contact_person}</p>}
            <div className="flex gap-2">
              {vendor.phone && (
                <a href={`tel:${vendor.phone}`} className="flex-1 h-8 rounded-lg bg-muted text-xs font-bold text-foreground flex items-center justify-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              )}
              {vendor.email && (
                <a href={`mailto:${vendor.email}`} className="flex-1 h-8 rounded-lg bg-muted text-xs font-bold text-foreground flex items-center justify-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground text-sm">No vendors found</div>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;