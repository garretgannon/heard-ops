import { Home, Activity, FileText, Users, MoreHorizontal, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NavItem({ icon: Icon = Home, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200',
        isActive ? 'scale-110 glow-active' : 'hover:scale-105 active:scale-95'
      )}
    >
      <Icon
        className={cn('h-6 w-6 transition-all duration-200', isActive ? 'text-primary' : 'text-muted-foreground')}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <span className={cn('text-xs font-bold transition-colors duration-200', isActive ? 'text-primary' : 'text-muted-foreground')}>
        {label}
      </span>
    </button>
  );
}