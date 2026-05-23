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
      <div className="flex gap-2 min-w-min">
        {tabs.map(({ id, label, icon: IconComponent }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { haptics.light?.(); onTabChange?.(id); }}
              className="flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95"
              style={{
                height: '32px',
                paddingLeft: '14px',
                paddingRight: '14px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.01em',
                background: isActive
                  ? 'rgba(255,107,0,0.15)'
                  : 'rgba(255,255,255,0.06)',
                border: isActive
                  ? '1px solid rgba(255,107,0,0.35)'
                  : '1px solid rgba(255,255,255,0.08)',
                color: isActive
                  ? '#FF6B00'
                  : 'rgba(255,255,255,0.45)',
                boxShadow: isActive
                  ? '0 0 12px rgba(255,107,0,0.15)'
                  : 'none',
              }}
            >
              <IconComponent style={{ width: 13, height: 13, strokeWidth: 2 }} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
