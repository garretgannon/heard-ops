import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Copy, Archive, Search } from 'lucide-react';
import { haptics } from '@/utils/haptics';

function TemplateCard({ template, onEdit, onDuplicate, onArchive }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-bold text-sm text-foreground">{template.name}</p>
          <p className="text-xs text-secondary-text mt-0.5">
            {template.assignedStations?.join(', ') || 'All Stations'} · {template.assignedJobCodes?.join(', ') || 'All Roles'}
          </p>
        </div>
        <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${template.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
          {template.isActive ? 'Active' : 'Archived'}
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>{template.repeatType === 'daily' ? 'Daily' : template.repeatDays?.length ? `${template.repeatDays.join(', ')}` : 'One-time'}</p>
        <p>{template.itemCount || 0} items</p>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={() => onEdit(template.id)} className="flex-1 btn-secondary text-xs h-8">
          <Edit2 className="h-3 w-3 inline mr-1" />
          Edit
        </button>
        <button onClick={() => onDuplicate(template.id)} className="flex-1 btn-secondary text-xs h-8">
          <Copy className="h-3 w-3 inline mr-1" />
          Duplicate
        </button>
        <button onClick={() => onArchive(template.id)} className="btn-secondary text-xs h-8 px-2">
          <Archive className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function SideWorkTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Template.filter({ type: 'side_work' });
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
    setLoading(false);
  };

  const filtered = templates.filter(t => {
    if (showArchived && t.isActive) return false;
    if (!showArchived && !t.isActive) return false;
    return t.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = (id) => {
    navigate(`/side-work-templates/${id}/edit`);
  };

  const handleDuplicate = async (id) => {
    haptics.light();
    const template = templates.find(t => t.id === id);
    if (!template) return;

    const { id: _, ...templateData } = template;
    const newTemplate = await base44.entities.Template.create({
      ...templateData,
      name: `${template.name} (Copy)`,
    });

    const items = await base44.entities.TemplateItem.filter({ templateId: id });
    for (const item of items) {
      const { id: __, ...itemData } = item;
      await base44.entities.TemplateItem.create({
        ...itemData,
        templateId: newTemplate.id,
      });
    }

    loadTemplates();
  };

  const handleArchive = async (id) => {
    haptics.light();
    const template = templates.find(t => t.id === id);
    await base44.entities.Template.update(id, { isActive: !template.isActive });
    loadTemplates();
  };

  return (
    <div className="pb-24">
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-foreground mb-3">Side Work Templates</h1>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-secondary-text"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowArchived(false)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${!showArchived ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            Active
          </button>
          <button onClick={() => setShowArchived(true)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${showArchived ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            Archived
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-secondary-text">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-secondary-text text-sm">
            {templates.length === 0 ? 'No side work templates yet' : 'No templates match your search'}
          </div>
        ) : (
          filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
            />
          ))
        )}
      </div>

      <button
        onClick={() => navigate('/side-work-templates/new')}
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

export const hideBase44Index = true;