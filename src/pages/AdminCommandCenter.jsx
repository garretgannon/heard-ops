import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { Settings, Shield, Layout, Zap, Eye, RotateCw } from 'lucide-react';
import JobCodeManager from '@/components/AdminDashboard/JobCodeManager';
import RolePermissionBuilder from '@/components/AdminDashboard/RolePermissionBuilder';
import RolePreview from '@/components/AdminDashboard/RolePreview';

const TABS = [
  { id: 'job-codes', label: 'Job Codes', icon: Settings },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'dashboard', label: 'Dashboard', icon: Layout },
  { id: 'preview', label: 'Preview', icon: Eye },
];

export default function AdminCommandCenter() {
  const { isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('job-codes');
  const [jobCodes, setJobCodes] = useState([]);
  const [selectedJobCode, setSelectedJobCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const loadJobCodes = async () => {
      try {
        const codes = await base44.entities.JobCode.list('-created_date', 100);
        setJobCodes(codes);
        if (codes.length > 0) {
          setSelectedJobCode(codes[0].id);
        }
      } catch (e) {
        console.error('Failed to load job codes:', e);
      } finally {
        setLoading(false);
      }
    };

    loadJobCodes();

    const unsubscribe = base44.entities.JobCode.subscribe((event) => {
      if (['create', 'update', 'delete'].includes(event.type)) {
        loadJobCodes();
      }
    });

    return () => unsubscribe?.();
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const TabIcon = TABS.find(t => t.id === activeTab)?.icon || Settings;
  const currentJobCode = jobCodes.find(jc => jc.id === selectedJobCode);

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Command Center</h1>
            <p className="text-[11px] text-muted-foreground">Control panel for restaurant operating system</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-secondary-text hover:bg-muted/80'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {activeTab === 'job-codes' && (
          <JobCodeManager jobCodes={jobCodes} onJobCodesChanged={() => {}} />
        )}

        {activeTab === 'permissions' && currentJobCode && (
          <RolePermissionBuilder jobCode={currentJobCode} jobCodes={jobCodes} setSelectedJobCode={setSelectedJobCode} />
        )}

        {activeTab === 'dashboard' && currentJobCode && (
          <RolePermissionBuilder jobCode={currentJobCode} jobCodes={jobCodes} mode="dashboard" />
        )}

        {activeTab === 'preview' && (
          <RolePreview jobCodes={jobCodes} />
        )}

        {activeTab !== 'job-codes' && !currentJobCode && (
          <div className="bg-muted/40 border border-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground">Select a job code to configure</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;