import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import TemplateFormModal from '@/components/templates/TemplateFormModal';

const TEMPLATE_TYPES = [
  { id: 'prep',        label: 'Prep' },
  { id: 'sidework',    label: 'Side Work' },
  { id: 'cleaning',    label: 'Cleaning' },
  { id: 'temperature', label: 'Temperature Log' },
  { id: 'waste_86',    label: 'Waste / 86' },
  { id: 'opening',     label: 'Opening' },
  { id: 'closing',     label: 'Closing' },
  { id: 'handoff',     label: 'Handoff' },
  { id: 'beo_event',   label: 'BEO / Event' },
  { id: 'custom',      label: 'Custom' },
];

const TYPE_COLORS = {
  prep: 'bg-violet-500/15 text-violet-400',
  sidework: 'bg-pink-500/15 text-pink-400',
  cleaning: 'bg-green-500/15 text-green-400',
  temperature: 'bg-cyan-500/15 text-cyan-400',
  waste_86: 'bg-yellow-500/15 text-yellow-400',
  opening: 'bg-blue-500/15 text-blue-400',
  closing: 'bg-indigo-500/15 text-indigo-400',
  handoff: 'bg-purple-500/15 text-purple-400',
  beo_event: 'bg-amber-500/15 text-amber-400',
  custom: 'bg-slate-500/15 text-slate-400',
};

export default function TemplateManager() {
  const { isAdmin } = useCurrentUser();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    try {
      const data = await base44.entities.Template.list('-created_date', 200);
      setTemplates(data);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (template) => {
    await base44.entities.Template.update(template.id, { is_active: !template.is_active });
    setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, is_active: !t.is_active } : t));
    toast.success(template.is_active ? 'Template disabled' : 'Template enabled');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    await base44.entities.Template.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const filtered = filter === 'all' ? templates : templates.filter(t => t.template_type === filter);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="pb-20 bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold">Template Builder</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{templates.length} templates · unified operational system</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setSelectedTemplate(null); setActiveModal('create'); }}
              className="h-10 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" /> New Template
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
          {TEMPLATE_TYPES.map(t => (
            <FilterChip key={t.id} label={t.label} active={filter === t.id} onClick={() => setFilter(t.id)} />
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-2 max-w-2xl">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No templates found</p>
            {isAdmin && <button onClick={() => { setSelectedTemplate(null); setActiveModal('create'); }} className="mt-3 text-primary text-sm font-bold hover:underline">Create your first template →</button>}
          </div>
        ) : (
          filtered.map(template => (
            <div key={template.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-foreground">{template.name}</h3>
                    {!template.is_active && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">INACTIVE</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', TYPE_COLORS[template.template_type] || 'bg-muted text-muted-foreground')}>
                      {TEMPLATE_TYPES.find(t => t.id === template.template_type)?.label}
                    </span>
                    {template.assigned_role && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{template.assigned_role}</span>}
                    {template.assigned_station && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{template.assigned_station}</span>}
                    {template.shift && template.shift !== 'any' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{template.shift}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {template.recurrence_type || 'daily'}
                    {template.due_time && ` · Due ${template.due_time}`}
                    {template.priority && template.priority !== 'medium' && ` · ${template.priority}`}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleToggleActive(template)} className="p-1.5 rounded-lg hover:bg-muted transition-all">
                      {template.is_active
                        ? <ToggleRight className="h-5 w-5 text-green-500" />
                        : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <button onClick={() => { setSelectedTemplate(template); setActiveModal('edit'); }} className="p-1.5 rounded-lg hover:bg-muted transition-all">
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(template.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {activeModal && (
        <TemplateFormModal
          template={selectedTemplate}
          isNew={activeModal === 'create'}
          onClose={() => { setActiveModal(null); setSelectedTemplate(null); }}
          onSuccess={() => { setActiveModal(null); setSelectedTemplate(null); loadTemplates(); }}
        />
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-bold transition-all',
        active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}>
      {label}
    </button>
  );
}

export const hideBase44Index = true;