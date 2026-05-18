import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Edit2, Copy, Archive, MoreVertical, Search } from 'lucide-react';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { haptics } from '@/utils/haptics';
import TemplateFormModal from '@/components/templates/TemplateFormModal';

function TemplateCard({ template, onEdit, onDuplicate, onArchive }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="card-glass border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate">{template.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-secondary-text flex-wrap">
            {template.assigned_role && (
              <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-semibold">{template.assigned_role}</span>
            )}
            {template.assigned_station && <><span>•</span><span>{template.assigned_station}</span></>}
            {template.shift && template.shift !== 'any' && <><span>•</span><span className="capitalize">{template.shift}</span></>}
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

export default function CleaningTemplates() {
  const { id: templateIdFromUrl } = useParams();
  const { isAdmin } = useCurrentUser();
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (!loading && templateIdFromUrl) {
      const t = templates.find(t => t.id === templateIdFromUrl);
      if (t) { setEditingTemplate(t); setShowForm(true); }
    }
  }, [templateIdFromUrl, templates, loading]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Template.filter({ template_type: 'cleaning' }, '-updated_date', 100);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load cleaning templates:', err);
    }
    setLoading(false);
  };

  const filtered = templates.filter(t => {
    const matchRole    = !filterRole    || t.assigned_role    === filterRole;
    const matchStation = !filterStation || t.assigned_station === filterStation;
    const matchShift   = !filterShift   || t.shift            === filterShift;
    const matchSearch  = !search || t.name.toLowerCase().includes(search.toLowerCase())
      || (t.assigned_station || '').toLowerCase().includes(search.toLowerCase());
    return matchRole && matchStation && matchShift && matchSearch;
  });

  const roles    = [...new Set(templates.map(t => t.assigned_role).filter(Boolean))].sort();
  const stations = [...new Set(templates.map(t => t.assigned_station).filter(Boolean))].sort();
  const shifts   = [...new Set(templates.map(t => t.shift).filter(Boolean))].sort();

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

  if (!isAdmin) return <div className="p-4 text-center text-secondary-text">Admin only</div>;

  return (
    <div className="app-screen">
      <DesktopPageHeader
        title="Cleaning Templates"
        subtitle="Create reusable cleaning checklists"
        actions={
          <button onClick={() => { haptics.medium(); setShowForm(true); }} className="btn-primary text-xs h-8 px-3 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Template
          </button>
        }
      />

      <div className="lg:hidden bg-card border-b border-border p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-black tracking-tight text-foreground mb-3">Cleaning Templates</h1>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
          <input type="text" placeholder="Search templates..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
        </div>
        <div className="flex gap-2">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground">
            <option value="">All Roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterStation} onChange={e => setFilterStation(e.target.value)} className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground">
            <option value="">All Stations</option>
            {stations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterShift} onChange={e => setFilterShift(e.target.value)} className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground">
            <option value="">All Shifts</option>
            {shifts.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="app-page">
        {loading ? (
          <div className="text-center py-8 text-secondary-text">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-secondary-text text-sm">No templates found</div>
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

      <button onClick={() => { haptics.medium(); setShowForm(true); }} className="lg:hidden fixed bottom-24 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all">
        <Plus className="h-6 w-6" />
      </button>

      {showForm && (
        <TemplateFormModal
          template={editingTemplate || { template_type: 'cleaning' }}
          isNew={!editingTemplate}
          onClose={closeForm}
          onSuccess={handleSave}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;
