import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { Eye, Shield } from 'lucide-react';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import RolesManager from '@/components/AdminDashboard/RolesManager';
import RolePreview from '@/components/AdminDashboard/RolePreview';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import AccessRestricted from '@/components/AccessRestricted';

const SECTIONS = [
  { id: 'permissions', label: 'Permissions',    icon: Shield },
  { id: 'preview',     label: 'Preview as Role', icon: Eye },
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
    <div className="app-screen">
      <DesktopPageHeader title="Roles & Access" subtitle="Roles, permissions, and access control" />
      {/* Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-4">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Admin Command Center</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Roles, permissions, and access control</p>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 lg:top-[112px] z-30 bg-background/90 backdrop-blur border-b border-border/20 px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide lg:mt-14">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn('flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all', active === s.id ? 'glow-active' : 'text-muted-foreground glow-interactive')}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-5">
        {active === 'permissions' && <RolesManager />}
        {active === 'preview'     && <RolePreview jobCodes={[]} />}
      </div>
    </div>
  );
}

export const hideBase44Index = true;