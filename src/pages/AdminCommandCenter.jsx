import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Settings, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import JobCodeManager from '@/components/AdminDashboard/JobCodeManager';
import RolePermissionBuilder from '@/components/AdminDashboard/RolePermissionBuilder';
import RolePreview from '@/components/AdminDashboard/RolePreview';

export default function AdminCommandCenter() {
  const navigate = useNavigate();
  const [jobCodes, setJobCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('job-codes');

  useEffect(() => {
    const loadJobCodes = async () => {
      try {
        const codes = await base44.entities.JobCode.list('-updated_date', 100);
        setJobCodes(codes);
      } catch (error) {
        console.error('Failed to load job codes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJobCodes();

    const unsubscribe = base44.entities.JobCode.subscribe(() => {
      loadJobCodes();
    });

    return () => unsubscribe?.();
  }, []);

  const sections = [
    { id: 'job-codes', label: 'Job Codes', icon: Settings },
    { id: 'permissions', label: 'Permissions', icon: Settings },
    { id: 'preview', label: 'Role Preview', icon: Settings },
  ];

  const renderSection = () => {
    if (loading) {
      return <div className="text-center py-8 text-secondary-text">Loading...</div>;
    }

    switch (activeSection) {
      case 'job-codes':
        return <JobCodeManager jobCodes={jobCodes} setJobCodes={setJobCodes} />;
      case 'permissions':
        return <RolePermissionBuilder jobCodes={jobCodes} />;
      case 'preview':
        return <RolePreview jobCodes={jobCodes} />;
      default:
        return null;
    }
  };

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border backdrop-blur-sm px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Command Center</h1>
            <p className="text-xs text-secondary-text mt-1">Configure roles, permissions, and organizational hierarchy</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-16 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-2 flex gap-1 overflow-x-auto">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeSection === section.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-secondary-text hover:bg-muted/80'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {renderSection()}
      </div>
    </div>
  );
}

export const hideBase44Index = true;