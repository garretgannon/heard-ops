import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Phone, Mail, Truck, Star, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { MODAL_VARIANTS, BACKDROP_VARIANTS } from '@/lib/modalAnimations';
import VendorForm from '@/components/VendorForm';
import DesktopPageHeader from '@/components/DesktopPageHeader';

const CAT_LABELS = { food: 'Food', beverage: 'Beverage', repairs: 'Repairs', equipment: 'Equipment', linen: 'Linen', pest: 'Pest Control', grease_trap: 'Grease Trap', plumbing: 'Plumbing', electrical: 'Electrical', pos: 'POS', hood_cleaning: 'Hood Cleaning', other: 'Other' };

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vendorData, equipData] = await Promise.all([
        base44.entities.Vendor.list('-updated_date', 200).catch(() => []),
        base44.entities.Equipment.list('-updated_date', 300).catch(() => [])
      ]);
      setVendors(vendorData);
      setEquipment(equipData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSave = async () => {
    setShowForm(false);
    setEditingVendor(null);
    await loadData();
  };

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
      <DesktopPageHeader
        title="Vendors"
        subtitle="Manage vendor relationships and ordering"
        actions={
          <button
            onClick={() => { haptics.medium(); setEditingVendor(null); setShowForm(true); }}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Vendor
          </button>
        }
      />

      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-4">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Vendors</h1>
      </div>

      {/* Filters */}
      <div className="lg:flex items-center gap-2 px-4 lg:px-8 py-3 border-b border-border/30 hidden">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-8 px-3 rounded-lg card-glass border border-border text-xs text-foreground">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-3 rounded-lg card-glass border border-border text-xs text-foreground">
          <option value="">All Vendors</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="w-full h-8 pl-8 pr-3 card-glass border border-border rounded-lg text-xs text-foreground" />
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

      {/* Unified Card Grid */}
      <div className="px-4 lg:px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 card-glass border border-border rounded-xl">
            <Truck className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-foreground mb-1">No vendors found</p>
            <p className="text-xs text-muted-foreground">Add your first vendor to get started</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Vendor Directory</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filtered.map(vendor => {
                const vendorEquip = equipment.filter(e => e.vendorId === vendor.id);
                return (
                  <div key={vendor.id} className="card-glass border border-border rounded-lg p-4 space-y-3 hover:border-primary/30 transition-colors">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                          <span className="text-xs font-extrabold text-primary">{vendor.name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground flex items-center gap-1 truncate">
                            {vendor.name}
                            {vendor.is_preferred && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize truncate">{CAT_LABELS[vendor.category] || vendor.category || '—'}</p>
                        </div>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', vendor.active !== false ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground')}>
                        {vendor.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      {vendor.contact_person && <p className="text-xs text-muted-foreground"><span className="font-semibold">Contact:</span> {vendor.contact_person}</p>}
                      {vendor.delivery_days && <p className="text-xs text-muted-foreground"><span className="font-semibold">Delivery:</span> {vendor.delivery_days}</p>}
                      {vendorEquip.length > 0 && <p className="text-xs text-blue-400 font-semibold">{vendorEquip.length} equipment linked</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {vendor.phone && (
                        <a href={`tel:${vendor.phone}`} className="flex-1 h-8 rounded-lg bg-muted text-xs font-bold text-foreground flex items-center justify-center gap-1 hover:bg-primary/15 active:scale-95 transition-all">
                          <Phone className="h-3.5 w-3.5" /> Call
                        </a>
                      )}
                      {vendor.email && (
                        <a href={`mailto:${vendor.email}`} className="flex-1 h-8 rounded-lg bg-muted text-xs font-bold text-foreground flex items-center justify-center gap-1 hover:bg-primary/15 active:scale-95 transition-all">
                          <Mail className="h-3.5 w-3.5" /> Email
                        </a>
                      )}
                      <button onClick={() => { haptics.light(); setEditingVendor(vendor); setShowForm(true); }} className="btn-secondary flex-1 h-8 text-xs flex items-center justify-center gap-1">
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add Button (Mobile) */}
      {!loading && (
        <button onClick={() => { haptics.medium(); setEditingVendor(null); setShowForm(true); }} className="lg:hidden fixed bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all">
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Vendor Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div variants={BACKDROP_VARIANTS} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div variants={MODAL_VARIANTS} initial="hidden" animate="visible" exit="exit" className="w-full max-w-md bg-card rounded-2xl overflow-hidden">
              <VendorForm
                vendor={editingVendor}
                onClose={() => { setShowForm(false); setEditingVendor(null); }}
                onSave={handleFormSave}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const hideBase44Index = true;