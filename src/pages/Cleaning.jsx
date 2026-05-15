import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Settings, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const today = () => new Date().toISOString().split('T')[0];

export default function Cleaning() {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [templates, setTemplates] = useState([]);
  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]); // GeneratedTask with task_type=cleaning_task
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [tmpl, tmplItems, generatedTasks] = await Promise.all([
        base44.entities.CleaningTemplate?.list?.('-updated_date', 100).catch(() => []),
        base44.entities.CleaningTemplateItem?.list?.('order', 200).catch(() => []),
        base44.entities.GeneratedTask?.filter?.({ task_type: 'cleaning_task', due_date: today() }, '-created_date', 100).catch(() => []),
      ]);
      setTemplates(tmpl || []);
      setItems(tmplItems || []);

      const gt = generatedTasks || [];
      setTasks(gt);
      const initChecked = {};
      gt.forEach(t => { if (t.status === 'completed') initChecked[t.id] = true; });
      setChecked(initChecked);
    } catch (err) {
      console.error('Failed to load cleaning data:', err);
    }
    setLoading(false);
  };

  const toggleTask = async (taskId) => {
    const next = !checked[taskId];
    setChecked(prev => ({ ...prev, [taskId]: next }));
    try {
      await base44.entities.GeneratedTask?.update?.(taskId, {
        status: next ? 'completed' : 'pending',
        completed_at: next ? new Date().toISOString() : null,
        completed_by: user?.email,
      });
    } catch {
      setChecked(prev => ({ ...prev, [taskId]: !next }));
      toast.error('Failed to save');
    }
  };

  const templateItems = (templateId) => items.filter(i => i.template_id === templateId || i.cleaning_template_id === templateId);
  const templateTasks = (templateId) => tasks.filter(t => t.source_template_id === templateId || t.cleaning_template_id === templateId);

  const hasAnyTasks = tasks.length > 0;
  const hasTemplates = templates.length > 0;
  const doneCount = tasks.filter(t => checked[t.id]).length;

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Cleaning" />
      <main className="app-page mx-auto max-w-[620px] lg:max-w-6xl space-y-5 pb-28">
        <header className="pt-1 flex items-start justify-between gap-4 lg:hidden">
          <div>
            <p className="metric-label">Operations</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Cleaning</h1>
            {hasAnyTasks && (
              <p className="mt-1 text-sm text-muted-foreground">{doneCount} of {tasks.length} complete today</p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/cleaning-templates')}
              className="mt-1 flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground border border-border/50 hover:bg-white/5 active:scale-95 transition-all shrink-0"
            >
              <Settings className="h-3.5 w-3.5" /> Templates
            </button>
          )}
        </header>

        <div className="lg:mt-0">{loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)}
          </div>
        ) : hasAnyTasks ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {tasks.map(task => (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-150 active:scale-[0.99]',
                  checked[task.id]
                    ? 'border-green-500/30 bg-green-500/5 opacity-70'
                    : 'border-border/50 bg-card/60'
                )}
              >
                <span className={cn(
                  'status-marker status-marker-md shrink-0 transition-all',
                  checked[task.id] ? 'status-success' : 'status-neutral'
                )}>
                  {checked[task.id]
                    ? <CheckCircle2 className="h-4 w-4" />
                    : <Sparkles className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm font-black transition-colors', checked[task.id] ? 'text-muted-foreground line-through' : 'text-foreground')}>
                    {task.task_title || 'Cleaning task'}
                  </p>
                  {(task.station_name || task.description) && (
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">{task.station_name || task.description}</p>
                  )}
                </div>
                {checked[task.id] && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />}
              </button>
            ))}
          </div>
        ) : hasTemplates ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {templates.map(tmpl => {
              const tmplItems = templateItems(tmpl.id);
              return (
                <div key={tmpl.id} className="rounded-2xl border border-border/50 overflow-hidden"
                  style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}
                >
                  <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-foreground">{tmpl.name}</p>
                      {tmpl.frequency && <p className="text-xs text-muted-foreground">{tmpl.frequency}</p>}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">{tmplItems.length} steps</span>
                  </div>
                  {tmplItems.length > 0 && (
                    <div className="px-4 py-2 space-y-2">
                      {tmplItems.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center gap-2.5 py-1.5">
                          <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">{item.task || item.description || item.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <p className="text-center text-xs text-muted-foreground pb-2">
              Tasks auto-generate daily from these templates. Check back at the start of your shift.
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl border border-border/50 p-8 text-center space-y-3"
            style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}
          >
            <span className="status-marker status-marker-lg status-neutral mx-auto">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-foreground">No cleaning checklists yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isAdmin
                  ? 'Create cleaning templates to auto-generate daily tasks for your team.'
                  : 'Ask a manager to set up cleaning checklists for your station.'}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => navigate('/cleaning-templates')}
                className="mx-auto mt-2 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold text-primary active:scale-95 transition-all"
              >
                <Settings className="h-3.5 w-3.5" /> Set up templates
              </button>
            )}
          </div>
        )}</div>
      </main>
    </div>
  );
}

export const hideBase44Index = true;
