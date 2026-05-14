import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import {
  Beaker, Search, Plus, Edit2, Trash2, X, Download, ChevronRight, Eye
} from 'lucide-react';

const CATEGORIES = {
  degreaser: { label: 'Degreaser', icon: '🧴', color: 'bg-orange-500/20 text-orange-400' },
  sanitizer: { label: 'Sanitizer', icon: '🧪', color: 'bg-green-500/20 text-green-400' },
  delimer: { label: 'Delimer', icon: '💧', color: 'bg-blue-500/20 text-blue-400' },
  disinfectant: { label: 'Disinfectant', icon: '🛡️', color: 'bg-purple-500/20 text-purple-400' },
  floor_cleaner: { label: 'Floor Cleaner', icon: '🪣', color: 'bg-slate-500/20 text-slate-400' },
  glass_cleaner: { label: 'Glass Cleaner', icon: '✨', color: 'bg-cyan-500/20 text-cyan-400' },
  rinse_aid: { label: 'Rinse Aid', icon: '💦', color: 'bg-indigo-500/20 text-indigo-400' },
  detergent: { label: 'Detergent', icon: '🧼', color: 'bg-pink-500/20 text-pink-400' },
  lubricant: { label: 'Lubricant', icon: '🛢️', color: 'bg-amber-500/20 text-amber-400' },
  other: { label: 'Other', icon: '📦', color: 'bg-gray-500/20 text-gray-400' },
};

const PPE_OPTIONS = ['Gloves', 'Apron', 'Goggles', 'Respirator', 'Face Shield', 'Boots'];

function ChemicalCard({ chemical, onView, onEdit, onDelete }) {
  const catInfo = CATEGORIES[chemical.category] || CATEGORIES.other;
  const isExpired = chemical.expiration_date && new Date(chemical.expiration_date) < new Date();

  return (
    <div className="card-glass border border-border rounded-lg overflow-hidden hover:border-border/60 transition-all">
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className={cn('text-2xl p-2 rounded-lg', catInfo.color)}>{catInfo.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{chemical.name}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{catInfo.label}</p>
            {chemical.vendor && <p className="text-[9px] text-muted-foreground/70 mt-0.5">📞 {chemical.vendor}</p>}
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {chemical.dilution_ratio && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">1:{chemical.dilution_ratio}</span>}
          {chemical.ppe_required?.length > 0 && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">🛡️ PPE</span>}
          {isExpired && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">⚠️ Expired</span>}
          {chemical.sds_url && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">📄 SDS</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border/50 px-3 py-2 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-1">
          {chemical.assigned_areas?.length > 0 && <span className="text-[9px] text-muted-foreground">{chemical.assigned_areas.length} areas</span>}
          {chemical.assigned_stations?.length > 0 && <span className="text-[9px] text-muted-foreground">{chemical.assigned_stations.length} stations</span>}
        </div>
        <div className="flex gap-1">
          {chemical.sds_url && (
            <a href={chemical.sds_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors">
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          <button onClick={() => onView(chemical)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onEdit(chemical)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(chemical.id)} className="p-1.5 text-red-400 hover:text-red-300 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChemicalForm({ chemical, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    category: 'sanitizer',
    vendor: '',
    vendor_contact: '',
    vendor_phone: '',
    sds_url: '',
    description: '',
    dilution_ratio: '',
    dilution_instructions: '',
    hazard_warnings: '',
    emergency_procedures: '',
    first_aid: '',
    storage_requirements: '',
    storage_location: '',
    expiration_date: '',
    batch_number: '',
    container_size: '',
    active: true,
    notes: '',
    ...chemical,
    ppe_required: Array.isArray(chemical?.ppe_required) ? chemical.ppe_required : [],
    assigned_areas: Array.isArray(chemical?.assigned_areas) ? chemical.assigned_areas : [],
    assigned_stations: Array.isArray(chemical?.assigned_stations) ? chemical.assigned_stations : [],
    assigned_equipment: Array.isArray(chemical?.assigned_equipment) ? chemical.assigned_equipment : [],
  });

  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Area.list('name', 100).catch(() => []),
      base44.entities.Station.list('name', 100).catch(() => []),
      base44.entities.Equipment.list('name', 100).catch(() => []),
    ]).then(([a, s, e]) => {
      setAreas(a);
      setStations(s);
      setEquipment(e);
    });
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArr = (k, v) => setForm(p => ({ ...p, [k]: p[k]?.includes(v) ? p[k].filter(x => x !== v) : [...(p[k] || []), v] }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (chemical?.id) {
        await base44.entities.Chemical.update(chemical.id, form);
      } else {
        await base44.entities.Chemical.create(form);
      }
      haptics.success();
      onSave?.();
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  };

  return (
    <>
      {/* Desktop backdrop */}
      <div className="hidden lg:block fixed inset-0 bg-black/50 z-[49]" onClick={onClose} />
      {/* Panel — full screen on mobile, right-side panel on desktop */}
      <div className="fixed inset-0 bg-background z-50 flex flex-col lg:inset-auto lg:right-0 lg:top-0 lg:bottom-0 lg:w-[520px] lg:bg-card lg:border-l lg:border-border"
        style={{ boxShadow: '-8px 0 48px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-extrabold text-foreground">{chemical ? 'Edit Chemical' : 'New Chemical'}</h2>
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Chemical name" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-foreground">Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm">
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground">Vendor</label>
            <input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Vendor name" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-foreground">Vendor Contact</label>
            <input value={form.vendor_contact} onChange={e => set('vendor_contact', e.target.value)} placeholder="Contact info" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground">Vendor Phone</label>
            <input value={form.vendor_phone} onChange={e => set('vendor_phone', e.target.value)} placeholder="Phone" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-foreground">SDS/MSDS PDF URL</label>
          <input value={form.sds_url} onChange={e => set('sds_url', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
        </div>

        <div>
          <label className="text-xs font-bold text-foreground">Description / Usage</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="How to use..." rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
        </div>

        {/* Dilution & Safety */}
        <div className="border-t border-border pt-3">
          <p className="text-xs font-bold text-foreground mb-2">💧 Dilution</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={form.dilution_ratio} onChange={e => set('dilution_ratio', e.target.value)} placeholder="e.g., 1:10" className="px-3 py-2 bg-background border border-border rounded-lg text-sm" />
            <input value={form.container_size} onChange={e => set('container_size', e.target.value)} placeholder="e.g., 5L" className="px-3 py-2 bg-background border border-border rounded-lg text-sm" />
          </div>
          <textarea value={form.dilution_instructions} onChange={e => set('dilution_instructions', e.target.value)} placeholder="Detailed dilution steps..." rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
        </div>

        {/* PPE */}
        <div className="border-t border-border pt-3">
          <p className="text-xs font-bold text-foreground mb-2">🛡️ Required PPE</p>
          <div className="flex flex-wrap gap-1">
            {PPE_OPTIONS.map(ppe => (
              <button key={ppe} onClick={() => toggleArr('ppe_required', ppe)} className={cn('text-xs px-2.5 py-1 rounded-full font-semibold transition-all', form.ppe_required?.includes(ppe) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70')}>
                {ppe}
              </button>
            ))}
          </div>
        </div>

        {/* Hazards */}
        <div className="border-t border-border pt-3">
          <p className="text-xs font-bold text-foreground mb-2">⚠️ Hazard & Safety</p>
          <textarea value={form.hazard_warnings} onChange={e => set('hazard_warnings', e.target.value)} placeholder="Health hazards, warnings..." rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none mb-2" />
          <textarea value={form.emergency_procedures} onChange={e => set('emergency_procedures', e.target.value)} placeholder="Spill/emergency procedures..." rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none mb-2" />
          <textarea value={form.first_aid} onChange={e => set('first_aid', e.target.value)} placeholder="First aid instructions..." rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
        </div>

        {/* Storage */}
        <div className="border-t border-border pt-3">
          <p className="text-xs font-bold text-foreground mb-2">📦 Storage</p>
          <textarea value={form.storage_requirements} onChange={e => set('storage_requirements', e.target.value)} placeholder="Storage conditions..." rows={1} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none mb-2" />
          <input value={form.storage_location} onChange={e => set('storage_location', e.target.value)} placeholder="Current location" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mb-2" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.expiration_date} onChange={e => set('expiration_date', e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm" />
            <input value={form.batch_number} onChange={e => set('batch_number', e.target.value)} placeholder="Batch #" className="px-3 py-2 bg-background border border-border rounded-lg text-sm" />
          </div>
        </div>

        {/* Assignments */}
        <div className="border-t border-border pt-3">
          <p className="text-xs font-bold text-foreground mb-1">🔗 Assignments</p>
          <p className="mb-3 text-[11px] leading-4 text-muted-foreground">
            Link this chemical to the areas and stations where the team should see it.
          </p>
          {areas.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {areas.map(a => (
                  <button key={a.id} onClick={() => toggleArr('assigned_areas', a.id)} className={cn('min-h-7 max-w-full rounded-full px-2.5 py-1 text-[10px] font-semibold', form.assigned_areas?.includes(a.id) ? 'bg-blue-500/20 text-blue-300' : 'bg-muted text-muted-foreground')}>
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {stations.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Stations</p>
              <div className="flex flex-wrap gap-1.5">
                {stations.map(s => (
                  <button key={s.id} onClick={() => toggleArr('assigned_stations', s.id)} className={cn('min-h-7 max-w-full rounded-full px-2.5 py-1 text-[10px] font-semibold', form.assigned_stations?.includes(s.id) ? 'bg-green-500/20 text-green-300' : 'bg-muted text-muted-foreground')}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 bg-card border-t border-border px-4 py-3 flex gap-2 pb-[max(12px,env(safe-area-inset-bottom))]">
        <button onClick={save} disabled={saving} className="flex-1 btn-primary text-sm h-10">{saving ? '...' : 'Save'}</button>
        <button onClick={onClose} className="flex-1 btn-secondary text-sm h-10">Cancel</button>
      </div>
      </div>
    </>
  );
}

export default function ChemicalLibrary() {
  const { isAdmin } = useCurrentUser();
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Chemical.list('name', 200).catch(() => []);
    setChemicals(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = chemicals.filter(c => {
    if (filterCat !== 'all' && c.category !== filterCat) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (!c.active) return false;
    return true;
  });

  const handleSave = async () => { await load(); setShowForm(false); setEditing(null); setSelected(null); };
  const handleDelete = async (id) => {
    if (!confirm('Delete this chemical?')) return;
    await base44.entities.Chemical.delete(id);
    haptics.success();
    await load();
  };

  return (
    <div className="pb-28">
      <DesktopPageHeader
        title="Chemical Library"
        subtitle="Chemicals, SDS/MSDS, safety data, and operational assignments"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chemicals…" className="w-52 pl-9 pr-3 py-2 card-glass border border-border rounded-lg text-xs" />
            </div>
            {isAdmin && (
              <button onClick={() => { setEditing(null); setShowForm(true); haptics.medium(); }} className="btn-primary text-xs h-8 px-3 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Chemical
              </button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-card border-b border-border px-4 py-3 lg:px-8">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => setFilterCat('all')} className={cn('flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200', filterCat === 'all' ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive')}>All</button>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <button key={k} onClick={() => setFilterCat(k)} className={cn('flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200', filterCat === k ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive')}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 py-4 lg:px-8 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading chemicals…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 card-glass border border-border rounded-xl">
            <Beaker className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No chemicals found</p>
            {isAdmin && <button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-3 btn-primary text-xs px-4 py-2"><Plus className="h-3 w-3 inline mr-1" />Add Chemical</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(c => <ChemicalCard key={c.id} chemical={c} onView={setSelected} onEdit={r => { setEditing(r); setShowForm(true); }} onDelete={handleDelete} />)}
          </div>
        )}
      </div>

      {/* Chemical Form */}
      {showForm && (
        <ChemicalForm
          chemical={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center lg:justify-end">
          <div className="w-full lg:w-[420px] h-[80vh] lg:h-auto lg:max-h-[90vh] bg-card border-t lg:border border-border rounded-t-2xl lg:rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h2 className="text-sm font-bold text-foreground">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.sds_url && (
                <a href={selected.sds_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-green-500/15 border border-green-500/30 rounded-lg text-sm text-green-300 font-semibold hover:bg-green-500/25 transition-all">
                  📄 View SDS/MSDS
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </a>
              )}
              {selected.hazard_warnings && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs font-bold text-red-400 mb-1">⚠️ Hazard Warnings</p>
                  <p className="text-xs text-red-300/80">{selected.hazard_warnings}</p>
                </div>
              )}
              {selected.ppe_required?.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs font-bold text-amber-400 mb-2">🛡️ Required PPE</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.ppe_required.map(p => <span key={p} className="text-xs font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-300">{p}</span>)}
                  </div>
                </div>
              )}
              {selected.dilution_ratio && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs font-bold text-blue-400 mb-1">💧 Dilution: 1:{selected.dilution_ratio}</p>
                  {selected.dilution_instructions && <p className="text-xs text-blue-300/80">{selected.dilution_instructions}</p>}
                </div>
              )}
              {selected.vendor && (
                <div className="p-3 bg-slate-500/10 border border-slate-500/20 rounded-lg">
                  <p className="text-xs font-bold text-slate-300 mb-1">📦 {selected.vendor}</p>
                  {selected.vendor_phone && <p className="text-xs text-slate-400">{selected.vendor_phone}</p>}
                </div>
              )}
              {selected.emergency_procedures && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-xs font-bold text-purple-400 mb-1">🚨 Emergency Procedures</p>
                  <p className="text-xs text-purple-300/80">{selected.emergency_procedures}</p>
                </div>
              )}
              {selected.notes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;
