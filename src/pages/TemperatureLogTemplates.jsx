import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Edit2, Copy, Archive, MoreVertical, Search, Wind, Snowflake, Flame, Thermometer } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import TemplateFormModal from '@/components/templates/TemplateFormModal';

const CATEGORY_CONFIG = {
  cooling:      { label: 'Cooling',             icon: Wind,        color: 'blue' },
  refrigerator: { label: 'Refrigerator',         icon: Snowflake,   color: 'cyan' },
  freezer:      { label: 'Freezer',              icon: Snowflake,   color: 'cyan' },
  hot_holding:  { label: 'Hot Holding',          icon: Flame,       color: 'orange' },
};

const CATEGORY_FILTERS = [
  ['', 'All'],
  ['cooling', 'Cooling'],
  ['refrigerator', 'Refrigerator'],
  ['freezer', 'Freezer'],
  ['hot_holding', 'Hot Holding'],
];

function TemplateCard({ template, onEdit, onDuplicate, onArchive }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cat = CATEGORY_CONFIG[template.temp_category] || {};
  const Icon = cat.icon || Thermometer;
  const color = cat.color || 'blue';

  return (
    <div className="card-glass border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center bg-${color}-500/15 shrink-0`}>
            <Icon className={`h-3.5 w-3.5 text-${color}-400`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{template.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
              {cat.label && (
                <span className={`px-1.5 py-0.5 rounded bg-${color}-500/15 text-${color}-400 font-bold`}>{cat.label}</span>
              )}
              {template.assigned_station && <><span>·</span><span>{template.assigned_station}</span></>}
            </div>
          </div>
        </div>
        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
          template.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
        }`}>
          {template.is_active ? 'Active' : 'Inactive'}
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
        <button
          onClick={() => { haptics.light(); onArchive(template); setMenuOpen(false); }}
          className="w-full btn-danger text-xs py-2 flex items-center justify-center gap-1"
        >
          <Archive className="h-3 w-3" />
          {template.is_active ? 'Archive' : 'Unarchive'}
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

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Template.filter({ template_type: 'temperature' }, '-updated_date', 100);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load temperature templates:', err);
    }
    setLoading(false);
  };

  const filtered = templates.filter(t => {
    const matchCat    = !filterCategory || t.temp_category === filterCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const closeForm = () => { setShowForm(false); setEditingTemplate(null); };

  const handleSave = async () => { await loadTemplates(); closeForm(); };

  const handleDuplicate = async (template) => {
    const { id, created_date, updated_date, ...data } = template;
    const created = await base44.entities.Template.create({ ...data, name: `${data.name} (Copy)`, is_active: false });
    const items = await base44.entities.TemplateItem.filter({ templateId: id }).catch(() => []);
    for (const { id: _id, created_date: _cd, updated_date: _ud, ...item } of items) {
      await base44.entities.TemplateItem.create({ ...item, templateId: created.id });
    }
    await loadTemplates();
    haptics.success();
  };

  const handleArchive = async (template) => {
    await base44.entities.Template.update(template.id, { is_active: !template.is_active });
    await loadTemplates();
    haptics.success();
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

        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {CATEGORY_FILTERS.map(([val, label]) => (
            <button key={val} onClick={() => setFilterCategory(val)}
              className={`flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                filterCategory === val ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search templates..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
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
              <TemplateCard key={t.id} template={t}
                onEdit={t => { setEditingTemplate(t); setShowForm(true); }}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </div>

      <button onClick={() => { haptics.medium(); setEditingTemplate(null); setShowForm(true); }} className="lg:hidden fixed bottom-24 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all">
        <Plus className="h-6 w-6" />
      </button>

      {showForm && (
        <TemplateFormModal
          template={editingTemplate || { template_type: 'temperature' }}
          isNew={!editingTemplate}
          onClose={closeForm}
          onSuccess={handleSave}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;
