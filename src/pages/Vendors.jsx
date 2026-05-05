import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Phone, ShoppingCart, AlertCircle, UtensilsCrossed, Wine, Wrench, Shirt, Bug, Zap, Droplets, Package, Settings, Edit2, Truck, Star } from "lucide-react";
import VendorNoteForm from "../components/forms/VendorNoteForm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "food",        label: "Food",          icon: UtensilsCrossed, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { value: "beverage",    label: "Beverage",      icon: Wine,            color: "text-blue-400",    bg: "bg-blue-500/10" },
  { value: "repairs",     label: "Repairs",       icon: Wrench,          color: "text-amber-400",   bg: "bg-amber-500/10" },
  { value: "equipment",   label: "Equipment",     icon: Settings,        color: "text-purple-400",  bg: "bg-purple-500/10" },
  { value: "linen",       label: "Linen",         icon: Shirt,           color: "text-pink-400",    bg: "bg-pink-500/10" },
  { value: "pest",        label: "Pest Control",  icon: Bug,             color: "text-red-400",     bg: "bg-red-500/10" },
  { value: "grease_trap", label: "Grease Trap",   icon: Droplets,        color: "text-orange-400",  bg: "bg-orange-500/10" },
  { value: "plumbing",    label: "Plumbing",      icon: Droplets,        color: "text-cyan-400",    bg: "bg-cyan-500/10" },
  { value: "electrical",  label: "Electrical",    icon: Zap,             color: "text-yellow-400",  bg: "bg-yellow-500/10" },
  { value: "pos",         label: "POS",           icon: Settings,        color: "text-indigo-400",  bg: "bg-indigo-500/10" },
  { value: "hood_cleaning",label:"Hood Cleaning", icon: Wrench,          color: "text-orange-400",  bg: "bg-orange-500/10" },
  { value: "other",       label: "Other",         icon: Package,         color: "text-gray-400",    bg: "bg-gray-500/10" },
];

const FILTER_CHIPS = [
  { value: "all",      label: "All" },
  { value: "food",     label: "Food" },
  { value: "beverage", label: "Beverage" },
  { value: "repairs",  label: "Repairs" },
  { value: "linen",    label: "Linen" },
  { value: "pest",     label: "Pest Control" },
];

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const todayDay = DAYS[new Date().getDay()];

function getCatMeta(cat) {
  return CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];
}

function hasDeliveryToday(vendor) {
  if (!vendor.delivery_days) return false;
  return vendor.delivery_days.includes(todayDay);
}

function VendorCard({ vendor, onEdit }) {
  const meta = getCatMeta(vendor.category);
  const Icon = meta.icon;
  const deliveryToday = hasDeliveryToday(vendor);

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2.5 bg-[#0F1623] border rounded-xl transition-all",
      vendor.emergency ? "border-red-500/30" : deliveryToday ? "border-primary/25" : "border-[#1E2A3B]"
    )}>
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", meta.bg)}>
        <Icon className={cn("h-4 w-4", meta.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {vendor.emergency && <Star className="h-3 w-3 text-red-400 shrink-0" />}
          <p className="text-[13px] font-bold text-white truncate">{vendor.name}</p>
          {deliveryToday && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 shrink-0">TODAY</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {vendor.delivery_days && (
            <span className="text-[10px] text-gray-600 truncate">{vendor.delivery_days}</span>
          )}
          {vendor.delivery_days && vendor.contact_person && <span className="text-gray-700 text-[10px]">·</span>}
          {vendor.contact_person && (
            <span className="text-[10px] text-gray-600 truncate">{vendor.contact_person}</span>
          )}
          {!vendor.delivery_days && !vendor.contact_person && vendor.notes && (
            <span className="text-[10px] text-gray-600 truncate">{vendor.notes.slice(0, 40)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {(vendor.phone || vendor.emergency_number) && (
          <a
            href={`tel:${vendor.emergency_number || vendor.phone}`}
            className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center active:scale-90 transition-transform"
            onClick={e => e.stopPropagation()}
          >
            <Phone className="h-3.5 w-3.5 text-emerald-400" />
          </a>
        )}
        <button
          onClick={() => onEdit(vendor)}
          className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ShoppingCart className="h-3.5 w-3.5 text-primary" />
        </button>
        <button
          onClick={() => onEdit(vendor)}
          className="h-8 w-8 rounded-lg bg-[#1A2235] border border-[#232D3F] flex items-center justify-center active:scale-90 transition-transform"
        >
          <Edit2 className="h-3.5 w-3.5 text-gray-500" />
        </button>
      </div>
    </div>
  );
}

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => {
    base44.entities.Vendor.list("-created_date", 200).then(data => {
      setVendors(data);
      setLoading(false);
    });
  }, []);

  const handleSaved = (result) => {
    if (editingVendor) {
      setVendors(prev => prev.map(v => v.id === result.id ? result : v));
    } else {
      setVendors(prev => [result, ...prev]);
    }
    setShowForm(false);
    setEditingVendor(null);
  };

  const openEdit = (vendor) => { setEditingVendor(vendor); setShowForm(true); };
  const openNew = () => { setEditingVendor(null); setShowForm(true); };

  const active = vendors.filter(v => v.active !== false);
  const deliveriesToday = active.filter(hasDeliveryToday);
  const emergency = active.filter(v => v.emergency);

  const priorityIds = new Set([
    ...deliveriesToday.map(v => v.id),
    ...active.filter(v => v.is_preferred).map(v => v.id),
  ]);
  const priority = active.filter(v => priorityIds.has(v.id)).slice(0, 5);

  let filtered = active;
  if (filterCat !== "all") filtered = filtered.filter(v => v.category === filterCat);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(v =>
      v.name?.toLowerCase().includes(q) ||
      v.contact_person?.toLowerCase().includes(q) ||
      v.phone?.includes(q)
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[480px] flex flex-col gap-3 pb-28">

      {/* Header */}
      <div className="pt-1">
        <h1 className="text-[17px] font-extrabold text-white tracking-tight">Vendors</h1>
        <p className="text-[11px] text-gray-600 mt-0.5">Quick access to suppliers and services</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vendors..."
          className="w-full h-9 pl-9 pr-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => setFilterCat(chip.value)}
            className={cn(
              "shrink-0 h-7 px-3 rounded-full text-[11px] font-bold border transition-all",
              filterCat === chip.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-[#0F1623] text-gray-500 border-[#1E2A3B]"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "Total",    value: active.length },
          { label: "Today",    value: deliveriesToday.length, highlight: deliveriesToday.length > 0 },
          { label: "Orders",   value: 0 },
          { label: "Critical", value: emergency.length, alert: emergency.length > 0 },
        ].map(m => (
          <div key={m.label} className={cn(
            "flex flex-col items-center text-center bg-[#111827] border rounded-xl p-2 min-w-0",
            m.alert ? "border-red-500/30" : m.highlight ? "border-primary/20" : "border-[#1F2937]"
          )}>
            <span className={cn("text-[18px] font-extrabold leading-none", m.alert ? "text-red-400" : m.highlight ? "text-primary" : "text-white")}>{m.value}</span>
            <span className="text-[9px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Priority Vendors */}
      {priority.length > 0 && !search && filterCat === "all" && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-primary" /> Priority Vendors
          </p>
          <div className="flex flex-col gap-1.5">
            {priority.map(v => <VendorCard key={v.id} vendor={v} onEdit={openEdit} />)}
          </div>
        </div>
      )}

      {/* All / Filtered Vendors */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
          {filterCat !== "all"
            ? FILTER_CHIPS.find(c => c.value === filterCat)?.label
            : "All Vendors"} ({filtered.length})
        </p>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-600 gap-2">
            <Package className="h-8 w-8 opacity-30" />
            <p className="text-[13px]">No vendors found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map(v => <VendorCard key={v.id} vendor={v} onEdit={openEdit} />)}
          </div>
        )}
      </div>

      {/* Bottom info cards */}
      {deliveriesToday.length > 0 && (
        <div className="bg-[#0F1623] border border-[#1E2A3B] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1A2235]">
            <Truck className="h-3.5 w-3.5 text-primary" />
            <span className="text-[12px] font-bold text-white flex-1">Deliveries Today</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">{deliveriesToday.length}</span>
          </div>
          {deliveriesToday.slice(0, 5).map((v, i) => {
            const meta = getCatMeta(v.category);
            const Icon = meta.icon;
            return (
              <div key={v.id} className={cn("flex items-center gap-2.5 px-3 py-2", i < deliveriesToday.slice(0,5).length - 1 && "border-b border-[#1A2235]/50")}>
                <Icon className={cn("h-3.5 w-3.5 shrink-0", meta.color)} />
                <p className="text-[12px] font-semibold text-white flex-1 truncate">{v.name}</p>
                <span className="text-[10px] text-primary font-bold">{todayDay}</span>
              </div>
            );
          })}
        </div>
      )}

      {emergency.length > 0 && (
        <div className="bg-[#0F1623] border border-red-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-red-500/10">
            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
            <span className="text-[12px] font-bold text-white flex-1">Emergency Contacts</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">{emergency.length}</span>
          </div>
          {emergency.map((v, i) => (
            <div key={v.id} className={cn("flex items-center gap-2.5 px-3 py-2", i < emergency.length - 1 && "border-b border-[#1A2235]/30")}>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white truncate">{v.name}</p>
                {v.emergency_number && <p className="text-[10px] text-red-400">{v.emergency_number}</p>}
              </div>
              {(v.emergency_number || v.phone) && (
                <a
                  href={`tel:${v.emergency_number || v.phone}`}
                  className="h-7 px-2.5 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <Phone className="h-3 w-3 text-red-400" />
                  <span className="text-[10px] font-bold text-red-400">Call</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed right-4 flex items-center gap-2 h-11 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform z-30"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Plus className="h-4 w-4" />
        Add Vendor
      </button>

      <VendorNoteForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingVendor(null); }}
        onSaved={handleSaved}
        initialData={editingVendor}
      />
    </div>
  );
}

export const hideBase44Index = true;