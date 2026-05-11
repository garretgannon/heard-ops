import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Copy, Archive, Search } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const isTemplateActive = (template) => template.is_active ?? template.isActive ?? true;
const assignedStation = (template) => template.assigned_station || template.assignedStations?.join(', ') || 'All Stations';
const assignedRole = (template) => template.assigned_role || template.assignedJobCodes?.join(', ') || 'All Roles';
const itemCount = (template) => template.itemCount || template.items_count || 0;

const recurrenceLabel = (template) => {
  const recurrence = template.recurrence_type || template.repeatType || 'on_demand';
  const days = template.recurrence_days || template.repeatDays || [];
  if (recurrence === 'daily') return 'Daily';
  if (recurrence === 'weekly' && days.length) return days.join(', ');
  if (recurrence === 'every_shift') return 'Every shift';
  return 'On demand';
};

const isWasteTemplate = (template) => {
  if (template.type === 'waste_log') return true;
  return template.template_type === 'waste_86' && ['waste', 'both', undefined, null, ''].includes(template.waste_86_subtype);
};

function TemplateCard({ template, onEdit, onDuplicate, onArchive }) {
  const active = isTemplateActive(template);

  return (
    <div className="bg-card border border-border rounded-lg p-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{template.name}</p>
          <p className="text-xs text-secondary-text mt-0.5">
            {assignedStation(template)} · {assignedRole(template)}
          </p>
        </div>
        <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
          {active ? 'Active' : 'Archived'}
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>{recurrenceLabel(template)}</p>
        <p>{itemCount(template)} items</p>
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
        <button onClick={() => onArchive(template.id)} className="btn-secondary text-xs h-8 px-2" title={active ? 'Archive' : 'Restore'}>
          <Archive className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function WasteTemplates() {
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
      const data = await base44.entities.Template.list('-updated_date', 200);
      setTemplates(data.filter(isWasteTemplate));
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = templates.filter(t => {
    const active = isTemplateActive(t);
    if (showArchived && active) return false;
    if (!showArchived && !active) return false;
    return (t.name || '').toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = (id) => {
    navigate(`/templates/${id}`);
  };

  const handleDuplicate = async (id) => {
    haptics.light();
    const template = templates.find(t => t.id === id);
    if (!template) return;

    const templateData = { ...template };
    delete templateData.id;
    delete templateData.created_date;
    delete templateData.updated_date;
    delete templateData.type;
    delete templateData.isActive;

    const newTemplate = await base44.entities.Template.create({
      ...templateData,
      name: `${template.name} (Copy)`,
      template_type: 'waste_86',
      waste_86_subtype: 'waste',
      is_active: false,
    });

    const items = await base44.entities.TemplateItem.filter({ templateId: id });
    for (const item of items) {
      const itemData = { ...item };
      delete itemData.id;
      delete itemData.created_date;
      delete itemData.updated_date;

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
    if (!template) return;
    await base44.entities.Template.update(id, { is_active: !isTemplateActive(template) });
    loadTemplates();
  };

  return (
    <div className="pb-24">
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-foreground mb-3">Waste Templates</h1>
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
            {templates.length === 0 ? 'No waste templates yet' : 'No templates match your search'}
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
        onClick={() => navigate('/templates/new', { state: { template_type: 'waste_86', waste_86_subtype: 'waste' } })}
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

export const hideBase44Index = true;
