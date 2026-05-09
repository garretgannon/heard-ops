import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Settings, Eye, Shield, Users } from 'lucide-react';
import RolePermissionBuilder from '@/components/AdminDashboard/RolePermissionBuilder';
import RolesManager from '@/components/AdminDashboard/RolesManager';
import RolePreview from '@/components/AdminDashboard/RolePreview';
import JobCodeManager from '@/components/AdminDashboard/JobCodeManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import AccessRestricted from '@/components/AccessRestricted';

const SECTIONS = [
  { id: 'permissions', label: 'Permissions',    icon: Shield },
  { id: 'preview',     label: 'Preview as Role', icon: Eye },
  { id: 'job-codes',   label: 'Job Codes',      icon: Settings },
];

export default function AdminCommandCenter() {
  const { isAdmin } = useCurrentUser();
  const [active, setActive] = useState('permissions');
  const [jobCodes, setJobCodes] = useState([]);

  useEffect(() => {
    base44.entities.JobCode.list().then(setJobCodes).catch(() => {});
  }, [active]);

  if (!isAdmin) return <AccessRestricted message="Only admins can access the Command Center." />;

  return (
    <div className="pb-32 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-4">
        <h1 className="text-xl font-extrabold text-foreground">Admin Command Center</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Roles, permissions, and access control</p>
      </div>

      {/* Tabs */}
      <div className="sticky top-[69px] z-30 bg-background/90 backdrop-blur border-b border-border/20 px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                active === s.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-5">
        {active === 'permissions' && <RolePermissionBuilder />}
        {active === 'preview'     && <RolePreview jobCodes={[]} />}
        {active === 'job-codes'   && <JobCodeManager jobCodes={jobCodes} setJobCodes={setJobCodes} />}
      </div>
    </div>
  );
}

export const hideBase44Index = true;