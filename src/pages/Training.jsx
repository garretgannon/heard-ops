import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import TrainingHeader from '@/components/training/TrainingHeader';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import ModulesTab from '@/components/training/ModulesTab';
import AssignmentsTab from '@/components/training/AssignmentsTab';
import CompletionsTab from '@/components/training/CompletionsTab';
import CertificationsTab from '@/components/training/CertificationsTab';

const TABS = [
  { id: 'modules', label: 'Modules', component: ModulesTab },
  { id: 'assignments', label: 'Assignments', component: AssignmentsTab },
  { id: 'completions', label: 'Completions', component: CompletionsTab },
  { id: 'certifications', label: 'Certifications', component: CertificationsTab },
];

export default function Training() {
  const { isAdmin, user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('modules');
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadData();
    return () => { isMounted.current = false; };
  }, []);

  const loadData = async () => {
    try {
      const [modData, assData, compData, certData] = await Promise.all([
        base44.entities.TrainingModule.list('title', 100).catch(() => []),
        base44.entities.TrainingAssignment.list('dueDate', 100).catch(() => []),
        base44.entities.TrainingCompletion.list('-completedAt', 100).catch(() => []),
        base44.entities.CertificationRecord.list('-issueDate', 100).catch(() => []),
      ]);
      if (isMounted.current) {
        setModules(modData);
        setAssignments(assData);
        setCompletions(compData);
        setCertifications(certData);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load training data:', err);
      if (isMounted.current) setLoading(false);
    }
  };

  if (!isAdmin) {
    const myAssignments = assignments.filter(a => a.assignee_email === user?.email || a.assigned_to_email === user?.email);
    const myCompletions = completions.filter(c => c.completedBy === user?.email || c.employee_email === user?.email);
    const completedIds = new Set(myCompletions.map(c => c.moduleId || c.module_id));

    return (
      <div className="pb-32 bg-background min-h-screen">
        <DesktopPageHeader title="Training" subtitle="Your assignments and progress" />
        <div className="lg:hidden"><TrainingHeader /></div>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-4 py-6 lg:px-8 max-w-2xl mx-auto space-y-6">
            {myAssignments.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">My Assignments</h2>
                <div className="space-y-2">
                  {myAssignments.map(a => {
                    const mod = modules.find(m => m.id === (a.moduleId || a.module_id));
                    const done = completedIds.has(a.moduleId || a.module_id);
                    return (
                      <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-4 py-3">
                        <span className={`status-marker status-marker-md ${done ? 'status-success' : 'status-warning'}`}>
                          {done ? <CheckCircle2 className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-foreground">{mod?.title || a.module_title || 'Training module'}</p>
                          <p className="text-xs text-muted-foreground">{done ? 'Completed' : a.dueDate ? `Due ${a.dueDate}` : 'Assigned'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {modules.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">All Modules</h2>
                <div className="space-y-2">
                  {modules.map(mod => {
                    const done = completedIds.has(mod.id);
                    return (
                      <div key={mod.id} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-4 py-3">
                        <span className={`status-marker status-marker-md ${done ? 'status-success' : 'status-neutral'}`}>
                          {done ? <CheckCircle2 className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-foreground">{mod.title}</p>
                          <p className="text-xs text-muted-foreground">{mod.category || mod.moduleType || ''}{mod.estimatedMinutes ? ` · ${mod.estimatedMinutes} min` : ''}</p>
                        </div>
                        {done && <span className="text-[10px] font-black text-green-400 shrink-0">Done</span>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {modules.length === 0 && myAssignments.length === 0 && (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">No training materials available yet.</p>
                <p className="text-xs text-muted-foreground">Check back once your manager has added modules.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeTabData = TABS.find(t => t.id === activeTab);
  const TabComponent = activeTabData.component;

  return (
    <div className="pb-32 bg-background min-h-screen">
      <DesktopPageHeader title="Training" subtitle="Create modules, assign training, track completions" />
      <div className="lg:hidden"><TrainingHeader /></div>

      {/* Mobile horizontal tab nav */}
      <div className="lg:hidden sticky top-0 z-20 border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-3 flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'glow-active'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content — sidebar nav on desktop, stacked on mobile */}
      <div className="px-4 py-6 lg:px-8 lg:py-6 max-w-6xl mx-auto w-full lg:flex lg:gap-8 lg:items-start">
        {/* Desktop vertical tab sidebar */}
        <div className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-[152px] space-y-1">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] px-3 mb-2 text-muted-foreground/50">Views</p>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/15 text-primary border border-primary/25'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          <TabComponent
            modules={modules}
            assignments={assignments}
            completions={completions}
            certifications={certifications}
            onRefresh={loadData}
          />
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;