import { useEffect, useState } from 'react';
import { Home, Activity, FileText, Users, MoreHorizontal, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  home: Home,
  activity: Activity,
  filetext: FileText,
  users: Users,
  more: MoreHorizontal,
  zap: Zap,
};

export default function NavItem({ icon, label, isActive, onClick }) {
  const Icon = icon || Home;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200',
        isActive
          ? 'scale-110'
          : 'hover:scale-105 active:scale-95'
      )}
      style={{
        background: isActive
          ? 'rgba(230, 106, 31, 0.15)'
          : 'transparent',
        boxShadow: isActive
          ? '0 0 16px rgba(230, 106, 31, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
          : 'none',
      }}
    >
      <Icon
        className={cn(
          'h-6 w-6 transition-all duration-200',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground'
        )}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <span
        className={cn(
          'text-xs font-bold transition-colors duration-200',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </button>
  );
}