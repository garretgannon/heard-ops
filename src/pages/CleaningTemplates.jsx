import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Edit2, Copy, Archive, MoreVertical, Search } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import CleaningTemplateForm from '@/components/CleaningTemplateForm';

function TemplateCard({ template, onEdit, onDuplicate, onArchive }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="card-glass border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate">{template.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-secondary-text">
            <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-semibold">{template.department}</span>
            <span>•</span>
            <span>{template.area}</span>
            <span>•</span>
            <span>{template.itemCount || 0} tasks</span>
          </div>
        </div>
        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
          template.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
        }`}>
          {template.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            haptics.light();
            onEdit(template);
          }}
          className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1 h-8"
        >
          <Edit2 className="h-3 w-3" />
          Edit
        </button>
        <button
          onClick={() => {
            haptics.light();
            onDuplicate(template);
          }}
          className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1 h-8"
        >
          <Copy className="h-3 w-3" />
          Copy
        </button>
        <button
          onClick={() => {
            haptics.light();
            setMenuOpen(!menuOpen);
          }}
          className="btn-secondary text-xs py-2 px-2 h-8"
        >
          <MoreVertical className="h-3 w-3" />
        </button>
      </div>

      {menuOpen && (
        <button
          onClick={() => {
            haptics.light();
            onArchive(template);
            setMenuOpen(false);
          }}
          className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1 text-red-400"
        >
          <Archive className="h-3 w-3" />
          {template.isActive ? 'Archive' : 'Unarchive'}
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
  const [filterDept, setFilterDept] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
    const unsub = base44.entities.CleaningTemplate.subscribe(() => loadTemplates());
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (templateIdFromUrl) {
      const template = templates.find(t => t.id === templateIdFromUrl);
      if (template) {
        setEditingTemplate(template);
        setShowForm(true);
      }
    }
  }, [templateIdFromUrl, templates]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CleaningTemplate.list('-updated_date', 100);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
    setLoading(false);
  };

  const filtered = templates.filter(t => {
    const matchDept = !filterDept || t.department === filterDept;
    const matchArea = !filterArea || t.area === filterArea;
    const matchShift = !filterShift || t.shift === filterShift;
    const matchSearch = !search || 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.area.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchArea && matchShift && matchSearch;
  });

  const departments = [...new Set(templates.map(t => t.department))].sort();
  const areas = [...new Set(templates.map(t => t.area))].filter(Boolean).sort();
  const shifts = [...new Set(templates.map(t => t.shift))].sort();

  const handleSave = async () => {
    await loadTemplates();
    setShowForm(false);
    setEditingTemplate(null);
  };

  const handleDuplicate = async (template) => {
    const newTemplate = { ...template };
    delete newTemplate.id;
    delete newTemplate.created_date;
    delete newTemplate.updated_date;
    newTemplate.name = `${template.name} (Copy)`;
    
    const created = await base44.entities.CleaningTemplate.create(newTemplate);
    
    const items = await base44.entities.CleaningTemplateItem.filter({
      cleaningTemplateId: template.id
    });
    
    for (const item of items) {
      const newItem = { ...item };
      delete newItem.id;
      delete newItem.created_date;
      delete newItem.updated_date;
      newItem.cleaningTemplateId = created.id;
      await base44.entities.CleaningTemplateItem.create(newItem);
    }
    
    await loadTemplates();
    haptics.success();
  };

  const handleArchive = async (template) => {
    await base44.entities.CleaningTemplate.update(template.id, {
      isActive: !template.isActive
    });
    await loadTemplates();
    haptics.success();
  };

  if (!isAdmin) {
    return <div className="p-4 text-center text-secondary-text">Admin only</div>;
  }

  return (
    <div className="pb-24">
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-black tracking-tight text-foreground mb-3">Cleaning Templates</h1>
        
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground"
          >
            <option value="">All Areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground"
          >
            <option value="">All Shifts</option>
            {shifts.map(s => <option key={s} value={s}>{s === 'all' ? 'All Shifts' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-secondary-text">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-secondary-text text-sm">
            No templates found
          </div>
        ) : (
          filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={setEditingTemplate}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
            />
          ))
        )}
      </div>

      <button
        onClick={() => {
          haptics.medium();
          setShowForm(true);
        }}
        className="fixed bottom-24 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="bg-card border-b border-border p-4 flex items-center justify-between sticky top-0">
              <h2 className="font-bold text-foreground">
                {editingTemplate ? 'Edit Template' : 'Create Cleaning Template'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingTemplate(null); }}
                className="text-secondary-text hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <CleaningTemplateForm
                template={editingTemplate}
                onSave={handleSave}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;