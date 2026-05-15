import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Edit2, Trash2, Copy, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import QuickAddPrepItemModal from '@/components/modals/QuickAddPrepItemModal';

export default function PrepPlanTemplatesManager() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await base44.entities.PrepPlanTemplate?.filter?.({ archived: false }, '-updated_date', 100).catch(() => []);
      setTemplates(data || []);
    } catch (e) {
      toast.error('Failed to load templates');
    }
    setLoading(false);
  };

  const handleDuplicate = async (template) => {
    try {
      const dupe = { ...template };
      delete dupe.id;
      delete dupe.created_date;
      delete dupe.updated_date;
      dupe.template_name = `${template.template_name} (Copy)`;
      dupe.status = 'draft';
      const created = await base44.entities.PrepPlanTemplate?.create?.(dupe);
      toast.success('Template duplicated');
      await loadTemplates();
    } catch (e) {
      toast.error('Failed to duplicate');
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this template?')) return;
    try {
      await base44.entities.PrepPlanTemplate?.update?.(id, { archived: true });
      toast.success('Template archived');
      await loadTemplates();
    } catch (e) {
      toast.error('Failed to archive');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground font-bold">Admin only</p>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <DesktopPageHeader
        title="Prep Templates"
        subtitle="Manage reusable prep templates and quick add single items"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowQuickAdd(true)} className="btn-secondary text-xs h-8 px-3 flex items-center gap-1">
              ⚡ Quick Add
            </button>
            <button onClick={() => navigate('/prep-plan-templates/new')} className="btn-primary text-xs h-8 px-3 flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> New Template
            </button>
          </div>
        }
      />

      <div className="app-page max-w-6xl">
        <div className="lg:hidden mb-4 rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prep Plan Templates</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('/prep-plan-templates/new')}
              className="btn-primary h-10 text-xs flex items-center justify-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Template
            </button>
            <button
              onClick={() => setShowQuickAdd(true)}
              className="btn-secondary h-10 text-xs"
            >
              Quick Add Item
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading…</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 card-glass border border-border rounded-xl">
            <p className="text-foreground font-bold mb-3">No prep templates yet</p>
            <button
              onClick={() => navigate('/prep-plan-templates/new')}
              className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Create First Template
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="card-glass border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-foreground truncate">{t.template_name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {t.status === 'published' ? '✓ Published' : 'Draft'}
                    </span>
                    {!t.is_active && <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">Inactive</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.station} • {t.items?.length || 0} items • {t.shift} • {t.assigned_role || 'Any role'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  <button
                    onClick={() => navigate(`/prep-plan-templates/${t.id}`)}
                    className="h-8 w-8 rounded border border-border hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(t)}
                    className="h-8 w-8 rounded border border-border hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchive(t.id)}
                    className="h-8 w-8 rounded border border-border hover:bg-amber-500/10 hover:text-amber-400 flex items-center justify-center text-muted-foreground transition-colors"
                    title="Archive"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchive(t.id)}
                    className="h-8 w-8 rounded border border-border hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-muted-foreground transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showQuickAdd && <QuickAddPrepItemModal onClose={() => { setShowQuickAdd(false); loadTemplates(); }} />}
    </div>
  );
}

export const hideBase44Index = true;
