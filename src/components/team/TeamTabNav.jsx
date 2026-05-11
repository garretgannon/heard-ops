import { Users, Calendar, MessageSquare, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const TABS = [
  { id: 'directory', label: 'Directory', icon: Users },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'roles', label: 'Roles', icon: Shield },
];

export default function TeamTabNav({ activeTab, onTabChange, canManageRoles }) {
  return (
    <div className="border-b border-border/20 overflow-x-auto scrollbar-hide">
      <div className="flex gap-1 px-4 lg:px-8 min-w-min">
        {TABS.map(({ id, label, icon: IconComponent }) => {
          if (id === 'roles' && !canManageRoles) return null;
          
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { haptics.light?.(); onTabChange?.(id); }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 my-2 rounded-lg border font-semibold text-sm transition-all whitespace-nowrap',
                isActive
                  ? 'glow-active'
                  : 'border-transparent text-muted-foreground hover:text-foreground glow-interactive'
              )}
            >
              <IconComponent className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}