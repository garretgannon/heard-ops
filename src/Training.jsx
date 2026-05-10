import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import TrainingHeader from '@/components/training/TrainingHeader';
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
  const { isAdmin } = useCurrentUser();
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
    return (
      <div className="pb-32 bg-background min-h-screen">
        <TrainingHeader />
        <div className="px-4 py-12 lg:px-8 text-center">
          <p className="text-muted-foreground">Admin access required</p>
        </div>
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
    <div className="pb-32 bg-background min-h-screen lg:flex lg:flex-col">
      <TrainingHeader />

      {/* Tab Navigation */}
      <div className="sticky top-0 z-20 border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-3 lg:px-8 max-w-6xl mx-auto w-full">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-4 py-6 lg:px-8 max-w-6xl mx-auto w-full">
        <TabComponent
          modules={modules}
          assignments={assignments}
          completions={completions}
          certifications={certifications}
          onRefresh={loadData}
        />
      </div>
    </div>
  );
}

export const hideBase44Index = true;