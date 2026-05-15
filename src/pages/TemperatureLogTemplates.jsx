import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Edit2, Copy, Archive, MoreVertical, Search, Wind, Snowflake, Flame } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import TemperatureLogTemplateForm from '@/components/TemperatureLogTemplateForm';
import DesktopPageHeader from '@/components/DesktopPageHeader';

const CATEGORY_CONFIG = {
  'cooling-log': { label: 'Cooling Log', icon: Wind, color: 'blue' },
  'refrigerator-freezer': { label: 'Refrigerator / Freezer', icon: Snowflake, color: 'cyan' },
  'hot-holding': { label: 'Hot Holding', icon: Flame, color: 'orange' },
};

function TemplateCard({ template, onEdit, onDuplicate, onArchive }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cat = CATEGORY_CONFIG[template.category] || {};
  const Icon = cat.icon;
  const color = cat.color || 'blue';

  return (
    <div className="card-glass border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && (
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center bg-${color}-500/15 shrink-0`}>
              <Icon className={`h-3.5 w-3.5 text-${color}-400`} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{template.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
              <span className={`px-1.5 py-0.5 rounded bg-${color}-500/15 text-${color}-400 font-bold`}>{cat.label || template.category}</span>
              {template.station && <><span>·</span><span>{template.station}</span></>}
            </div>
          </div>
        </div>
        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${template.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
          {template.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { haptics.light(); onEdit(template); }} className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1 h-8">
          <Edit2 className="h-3 w-3" /> Edit
        </button>
        <button onClick={() => { haptics.light(); onDuplicate(template); }} className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1 h-8">
          <Copy className="h-3 w-3" /> Copy
        </button>
        <button onClick={() => { haptics.light(); setMenuOpen(!menuOpen); }} className="btn-secondary text-xs py-2 px-2 h-8">
          <MoreVertical className="h-3 w-3" />
        </button>
      </div>

      {menuOpen && (
        <button onClick={() => { haptics.light(); onArchive(template); setMenuOpen(false); }} className="w-full btn-danger text-xs py-2 flex items-center justify-center gap-1">
          <Archive className="h-3 w-3" /> {template.isActive ? 'Archive' : 'Unarchive'}
        </button>
      )}
    </div>
  );
}

export default function TemperatureLogTemplates() {
  const { isAdmin } = useCurrentUser();
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
    const unsub = base44.entities.TemperatureLogTemplate.subscribe(() => loadTemplates());
    return () => unsub?.();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const data = await base44.entities.TemperatureLogTemplate.list('-updated_date', 100).catch(() => []);
    setTemplates(data);
    setLoading(false);
  };

  const filtered = templates.filter(t => {
    const matchCat = !filterCategory || t.category === filterCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = async () => { await loadTemplates(); setShowForm(false); setEditingTemplate(null); };

  const handleDuplicate = async (template) => {
    const newT = { ...template };
    delete newT.id; delete newT.created_date; delete newT.updated_date;
    newT.name = `${template.name} (Copy)`;
    const created = await base44.entities.TemperatureLogTemplate.create(newT);
    const items = await base44.entities.TemperatureLogTemplateItem.filter({ temperatureLogTemplateId: template.id });
    for (const item of items) {
      const newItem = { ...item }; delete newItem.id; delete newItem.created_date; delete newItem.updated_date;
      newItem.temperatureLogTemplateId = created.id;
      await base44.entities.TemperatureLogTemplateItem.create(newItem);
    }
    await loadTemplates(); haptics.success();
  };

  const handleArchive = async (template) => {
    await base44.entities.TemperatureLogTemplate.update(template.id, { isActive: !template.isActive });
    await loadTemplates(); haptics.success();
  };

  if (!isAdmin) return <div className="p-4 text-center text-muted-foreground">Admin only</div>;

  return (
    <div className="app-screen">
      <DesktopPageHeader
        title="Temperature Log Templates"
        subtitle="Create reusable temperature log templates"
        actions={
          <button onClick={() => { haptics.medium(); setEditingTemplate(null); setShowForm(true); }} className="btn-primary text-xs h-8 px-3 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Template
          </button>
        }
      />
      <div className="lg:hidden bg-card border-b border-border p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-black tracking-tight text-foreground mb-3">Temperature Log Templates</h1>

        {/* Category filter tabs */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {[['', 'All'], ['cooling-log', '❄ Cooling'], ['refrigerator-freezer', '🧊 Fridge / Freezer'], ['hot-holding', '🔥 Hot Holding']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterCategory(val)} className={`flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${filterCategory === val ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive'}`}>{label}</button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
        </div>
      </div>

      <div className="app-page">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No templates found</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(t => (
              <TemplateCard key={t.id} template={t} onEdit={t => { setEditingTemplate(t); setShowForm(true); }} onDuplicate={handleDuplicate} onArchive={handleArchive} />
            ))}
          </div>
        )}
      </div>

      <button onClick={() => { haptics.medium(); setEditingTemplate(null); setShowForm(true); }} className="lg:hidden fixed bottom-24 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all">
        <Plus className="h-6 w-6" />
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden max-h-[88vh] flex flex-col">
            <div className="bg-card border-b border-border p-4 flex items-center justify-between sticky top-0 shrink-0">
              <h2 className="font-bold text-foreground">{editingTemplate ? 'Edit Template' : 'New Temperature Log Template'}</h2>
              <button onClick={() => { setShowForm(false); setEditingTemplate(null); }} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <TemperatureLogTemplateForm template={editingTemplate} onSave={handleSave} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;