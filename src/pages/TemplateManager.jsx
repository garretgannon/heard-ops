import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, Copy, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import TemplateFormModal from '@/components/templates/TemplateFormModal';
import TemplatePreviewModal from '@/components/templates/TemplatePreviewModal';
import DesktopPageHeader from '@/components/DesktopPageHeader';

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
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeTemplateId } = useParams();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('type');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => { loadTemplates(); }, []);

  useEffect(() => {
    if (loading) return;

    if (location.pathname === '/templates/new') {
      setSelectedTemplate(location.state || null);
      setActiveModal('create');
      return;
    }

    if (routeTemplateId) {
      const template = templates.find(t => t.id === routeTemplateId);
      if (template) {
        setSelectedTemplate(template);
        setActiveModal('edit');
      }
    }
  }, [loading, location.pathname, location.state, routeTemplateId, templates]);

  const closeModal = () => {
    setActiveModal(null);
    setSelectedTemplate(null);
    if (location.pathname.startsWith('/templates/')) {
      navigate('/templates', { replace: true });
    }
  };

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

  const handleDuplicate = async (template) => {
    try {
      const { id, ...data } = template;
      await base44.entities.Template.create({ ...data, name: `${data.name} (Copy)`, is_active: false });
      toast.success('Template duplicated as draft');
      loadTemplates();
    } catch (err) {
      toast.error('Failed to duplicate template');
    }
  };

  const getWarnings = (template) => {
    const warnings = [];
    if (!template.assigned_role) warnings.push('Missing role');
    if (!template.due_time) warnings.push('Missing due time');
    if (template.template_type === 'temperature' && (!template.temp_min || !template.temp_max)) warnings.push('Missing temp range');
    if (!template.recurrence_type || template.recurrence_type === 'on_demand') warnings.push('Not recurring');
    return warnings;
  };

  const getCreates = (template) => {
    const creates = [];
    if (['prep', 'sidework', 'cleaning', 'opening', 'closing', 'beo_event', 'custom'].includes(template.template_type)) creates.push('Task');
    if (['temperature', 'waste_86', 'handoff'].includes(template.template_type)) creates.push('Log');
    return creates;
  };

  let filtered = templates;
  if (filter !== 'all') filtered = filtered.filter(t => t.template_type === filter);
  if (statusFilter !== 'all') {
    if (statusFilter === 'active') filtered = filtered.filter(t => t.is_active && !getWarnings(t).length);
    else if (statusFilter === 'draft') filtered = filtered.filter(t => !t.is_active);
    else if (statusFilter === 'needs_setup') filtered = filtered.filter(t => !!getWarnings(t).length);
  }
  if (searchQuery) filtered = filtered.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === 'role') filtered.sort((a, b) => (a.assigned_role || '').localeCompare(b.assigned_role || ''));
  else if (sortBy === 'updated') filtered.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));

  const metrics = {
    total: templates.length,
    active: templates.filter(t => t.is_active && !getWarnings(t).length).length,
    draft: templates.filter(t => !t.is_active).length,
    needsSetup: templates.filter(t => !!getWarnings(t).length).length,
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="pb-20 bg-background min-h-screen">
      <DesktopPageHeader title="Templates" subtitle="Unified operational task templates" />
      {/* Header */}
      <div className="lg:hidden sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Template Builder</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{templates.length} templates · unified operational system</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setSelectedTemplate(null); setActiveModal('create'); }}
              className="h-10 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 active:scale-95 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" /> New Template
            </button>
          )}
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <MetricCard label="Total" value={metrics.total} onClick={() => { setStatusFilter('all'); }} active={statusFilter === 'all'} />
          <MetricCard label="Active" value={metrics.active} onClick={() => { setStatusFilter('active'); }} active={statusFilter === 'active'} />
          <MetricCard label="Draft" value={metrics.draft} onClick={() => { setStatusFilter('draft'); }} active={statusFilter === 'draft'} />
          <MetricCard label="Needs Setup" value={metrics.needsSetup} onClick={() => { setStatusFilter('needs_setup'); }} active={statusFilter === 'needs_setup'} />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-2 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="type">Sort: Type</option>
              <option value="name">Sort: Name</option>
              <option value="role">Sort: Role</option>
              <option value="updated">Sort: Updated</option>
            </select>
          </div>
        </div>

        {/* Type Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
          {TEMPLATE_TYPES.map(t => (
            <FilterChip key={t.id} label={t.label} active={filter === t.id} onClick={() => setFilter(t.id)} />
          ))}
        </div>
      </div>

      {/* Template Cards */}
      <div className="px-4 py-4 space-y-2 max-w-6xl lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-20">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No templates found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or create a new template</p>
            {isAdmin && (
              <button
                onClick={() => { setSelectedTemplate(null); setActiveModal('create'); }}
                className="mt-4 px-4 py-2 rounded-lg bg-primary/15 text-primary text-sm font-bold hover:bg-primary/25 transition-all"
              >
                Create Template
              </button>
            )}
          </div>
        ) : (
          filtered.map(template => {
            const warnings = getWarnings(template);
            const creates = getCreates(template);
            const typeLabel = TEMPLATE_TYPES.find(t => t.id === template.template_type)?.label;
            return (
              <div key={template.id} className="bg-card/50 border border-border rounded-lg overflow-hidden hover:border-border/60 hover:bg-card/70 transition-all">
                {/* Top Row: Name + Action Buttons */}
                <div className="px-3 py-2.5 flex items-center justify-between gap-2 border-b border-border/50">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-foreground truncate">{template.name}</h3>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="h-6 w-6 flex items-center justify-center rounded-md bg-primary/10 hover:bg-primary/15 text-primary transition-all active:scale-90"
                        title="Preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { setSelectedTemplate(template); setActiveModal('edit'); }}
                        className="h-6 w-6 flex items-center justify-center rounded-md bg-muted/40 hover:bg-muted/60 text-muted-foreground transition-all active:scale-90"
                        title="Edit"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(template)}
                        className="h-6 w-6 flex items-center justify-center rounded-md bg-muted/40 hover:bg-muted/60 text-muted-foreground transition-all active:scale-90"
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="h-6 w-6 flex items-center justify-center rounded-md bg-red-500/10 hover:bg-red-500/15 text-red-500 transition-all active:scale-90"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Second Row: Type + Role + Shift + Station */}
                <div className="px-3 py-2 flex items-center gap-1.5 border-b border-border/50 flex-wrap">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', TYPE_COLORS[template.template_type] || 'bg-muted text-muted-foreground')}>
                    {typeLabel}
                  </span>
                  {template.assigned_role && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300">👤 {template.assigned_role}</span>}
                  {template.shift && template.shift !== 'any' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300">🕐 {template.shift}</span>}
                  {template.assigned_station && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300">📍 {template.assigned_station}</span>}
                </div>

                {/* Details Row: Schedule + Due + Last Generated + Creates */}
                <div className="px-3 py-2 border-b border-border/50">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recurrence:</span>
                      <span className="font-bold text-foreground capitalize">{template.recurrence_type || 'daily'}</span>
                    </div>
                    {template.due_time && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due:</span>
                        <span className="font-bold text-foreground">{template.due_time}</span>
                      </div>
                    )}
                    {template.last_generated_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Generated:</span>
                        <span className="font-bold text-foreground">{template.last_generated_date}</span>
                      </div>
                    )}
                    {creates.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Creates:</span>
                        <span className="font-bold text-foreground">{creates.join(' + ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirements Row */}
                {(template.photo_required || template.manager_review_required || (template.template_type === 'temperature' && template.temp_corrective_action)) && (
                  <div className="px-3 py-1.5 border-b border-border/50 flex flex-wrap gap-1">
                    {template.photo_required && <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded">📸 Photo</span>}
                    {template.manager_review_required && <span className="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.5 rounded">✓ Review</span>}
                    {template.template_type === 'temperature' && template.temp_corrective_action && <span className="text-[9px] bg-orange-500/20 text-orange-300 font-bold px-1.5 py-0.5 rounded">🔧 Action</span>}
                  </div>
                )}

                {/* Status Badge + Last Updated + Warnings */}
                <div className="px-3 py-2 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('font-bold px-2 py-0.5 rounded', template.is_active && !warnings.length ? 'bg-green-500/20 text-green-300' : warnings.length ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300')}>
                      {template.is_active && !warnings.length ? '✓ ACTIVE' : warnings.length ? '⚠️ SETUP' : 'DRAFT'}
                    </span>
                    {template.updated_date && <span className="text-muted-foreground">Updated {template.updated_date.split('T')[0]}</span>}
                  </div>
                  {warnings.length > 0 && (
                    <div className="text-amber-400 font-bold cursor-help" title={warnings.join(', ')}>
                      {warnings.length} issues
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeModal && (
        <TemplateFormModal
          template={selectedTemplate}
          isNew={activeModal === 'create'}
          onClose={closeModal}
          onSuccess={() => { closeModal(); loadTemplates(); }}
        />
      )}

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
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

function MetricCard({ label, value, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 rounded-lg text-center font-bold transition-all active:scale-95',
        active
          ? 'bg-primary/15 text-primary border border-primary/30'
          : 'bg-muted/50 text-muted-foreground border border-border hover:bg-muted/70'
      )}
    >
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] mt-0.5">{label}</div>
    </button>
  );
}

export const hideBase44Index = true;
