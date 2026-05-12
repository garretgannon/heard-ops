import { motion } from 'framer-motion';
import { Calendar, Grid3x3, BarChart3, AlertCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIEWS = [
  { id: 'weekly', label: 'Weekly', icon: Grid3x3 },
  { id: 'daily', label: 'Daily', icon: Calendar },
  { id: 'heatmap', label: 'Heatmap', icon: BarChart3 },
  { id: 'today', label: 'Today', icon: AlertCircle },
  { id: 'employee', label: 'Employee', icon: User },
];

export default function ViewModeSwitcher({ viewMode, onViewChange }) {
  return (
    <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg card-glass border border-border/30">
      {VIEWS.map(view => {
        const Icon = view.icon;
        const isActive = viewMode === view.id;

        return (
          <motion.button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'h-8 px-2.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{view.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}