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
    <div className="border-b border-border/20 overflow-x-auto scrollbar-hide">
      <div className="flex gap-1 px-4 lg:px-8 min-w-min">
        {tabs.map(({ id, label, icon: IconComponent }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { haptics.light?.(); onTabChange?.(id); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 my-1.5 rounded-lg border font-semibold text-xs transition-all whitespace-nowrap',
                isActive
                  ? 'glow-active'
                  : 'border-transparent text-muted-foreground hover:text-foreground glow-interactive'
              )}
            >
              <IconComponent className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
