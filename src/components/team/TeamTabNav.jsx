import { Users, Trophy, GitBranch, MapPin, Shield, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const ALL_TABS = [
  { id: 'directory',   label: 'Directory',   icon: Users,      adminOnly: false },
  { id: 'progress',    label: 'Progress',    icon: Trophy,     adminOnly: true },
  { id: 'org',         label: 'Org Chart',   icon: GitBranch,  adminOnly: true },
  { id: 'ownership',   label: 'Ownership',   icon: MapPin,     adminOnly: true },
  { id: 'roles',       label: 'Roles',       icon: Shield,     adminOnly: true },
  { id: 'permissions', label: 'Permissions', icon: Shield,     adminOnly: true },
  { id: 'job-codes',   label: 'Job Codes',   icon: Briefcase,  adminOnly: true },
];

export default function TeamTabNav({ activeTab, onTabChange, isAdmin = false }) {
  const tabs = ALL_TABS.filter(t => !t.adminOnly || isAdmin);

  return (
    <div className="overflow-x-auto no-scrollbar lg:sticky lg:top-[72px] lg:z-20 px-4 lg:px-8 py-3">
      <div className="view-slider-container w-full max-w-4xl">
        {tabs.map(({ id, label, icon: IconComponent }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { haptics.light?.(); onTabChange?.(id); }}
              className={cn('view-slider-tab', isActive && 'active')}
            >
              <div className="flex items-center gap-1.5">
                <IconComponent className="h-3.5 w-3.5" />
                <span>{label}</span>
              </div>
              <div className="view-slider-dot" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
