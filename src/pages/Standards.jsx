import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import { ArrowRight, BookOpen, ChefHat, ClipboardList, Droplets, ShowerHead } from 'lucide-react';

export default function Standards() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const [cleaningTemplates, setCleaningTemplates] = useState([]);
  const [sideWorkTemplates, setSideWorkTemplates] = useState([]);
  const [trainingModules, setTrainingModules] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ct, swt, tm, rec] = await Promise.all([
          base44.entities.CleaningTemplate?.list?.('name', 50).catch(() => []),
          base44.entities.SideWorkTemplate?.list?.('name', 50).catch(() => []),
          base44.entities.TrainingModule?.list?.('title', 50).catch(() => []),
          base44.entities.Recipe?.list?.('name', 50).catch(() => []),
        ]);
        setCleaningTemplates(ct || []);
        setSideWorkTemplates(swt || []);
        setTrainingModules(tm || []);
        setRecipes(rec || []);
      } catch (err) {
        console.error('Failed to load standards data:', err);
      }
      setLoading(false);
    })();
  }, []);

  const sections = [
    {
      title: 'Cleaning Procedures',
      icon: ShowerHead,
      status: 'status-info',
      items: cleaningTemplates,
      getLabel: i => i.name,
      getSub: i => i.frequency || i.station_name || '',
      path: '/cleaning',
      adminPath: '/cleaning-templates',
      emptyText: 'No cleaning procedures set up yet.',
    },
    {
      title: 'Side Work & Closing',
      icon: ClipboardList,
      status: 'status-warning',
      items: sideWorkTemplates,
      getLabel: i => i.name || i.title,
      getSub: i => i.station_name || i.frequency || '',
      path: '/tasks?tab=sidework',
      adminPath: '/side-work-templates',
      emptyText: 'No side work templates set up yet.',
    },
    {
      title: 'Training Modules',
      icon: BookOpen,
      status: 'status-review',
      items: trainingModules,
      getLabel: i => i.title,
      getSub: i => [i.category, i.estimatedMinutes ? `${i.estimatedMinutes} min` : ''].filter(Boolean).join(' · '),
      path: '/training',
      adminPath: '/training',
      emptyText: 'No training modules created yet.',
    },
    {
      title: 'Recipes & Build Cards',
      icon: ChefHat,
      status: 'status-success',
      items: recipes,
      getLabel: i => i.name,
      getSub: i => i.category || i.station || '',
      path: '/recipes',
      adminPath: '/recipes',
      emptyText: 'No recipes added yet.',
    },
  ];

  return (
    <div className="app-screen">
      <main className="app-page mx-auto max-w-[620px] space-y-6 pb-28 lg:max-w-7xl">
        <header className="pt-1">
          <p className="metric-label">Knowledge</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">SOPs & Standards</h1>
          <p className="mt-1 text-sm text-muted-foreground">Procedures, training, and reference materials.</p>
        </header>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}
          </div>
        ) : (
          sections.map(section => {
            const Icon = section.icon;
            return (
              <section key={section.title} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{section.title}</h2>
                  <button
                    onClick={() => navigate(isAdmin ? section.adminPath : section.path)}
                    className="text-[10px] font-black text-primary"
                  >
                    {isAdmin ? 'Manage' : 'View all'}
                  </button>
                </div>

                {section.items.length > 0 ? (
                  <div className="rounded-2xl border border-border/50 overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}
                  >
                    {section.items.slice(0, 4).map((item, idx) => (
                      <button
                        key={item.id || idx}
                        onClick={() => navigate(isAdmin ? section.adminPath : section.path)}
                        className="flex w-full items-center gap-3 border-b border-border/30 last:border-b-0 px-4 py-3 text-left hover:bg-white/3 active:scale-[0.99] transition-all"
                      >
                        <span className={cn('status-marker status-marker-sm shrink-0', section.status)}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground">{section.getLabel(item)}</p>
                          {section.getSub(item) && <p className="text-xs text-muted-foreground truncate">{section.getSub(item)}</p>}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                    {section.items.length > 4 && (
                      <button
                        onClick={() => navigate(isAdmin ? section.adminPath : section.path)}
                        className="flex w-full items-center justify-center gap-1 px-4 py-2.5 text-xs font-bold text-primary border-t border-border/30 hover:bg-white/3 transition-all"
                      >
                        +{section.items.length - 4} more <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/40 px-4 py-5 text-center"
                    style={{ background: 'rgba(13,20,27,0.6)' }}
                  >
                    <p className="text-xs text-muted-foreground">{section.emptyText}</p>
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}

export const hideBase44Index = true;
