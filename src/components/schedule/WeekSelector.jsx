import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addWeeks, subWeeks, startOfToday, startOfWeek, isSameWeek } from 'date-fns';

export default function WeekSelector({ currentWeek, onWeekChange }) {
  const today = startOfToday();
  const isCurrentWeek = isSameWeek(currentWeek, today, { weekStartsOn: 1 });

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onWeekChange(subWeeks(currentWeek, 1))}
        className="h-9 w-9 rounded-lg border border-border hover:bg-secondary flex items-center justify-center transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => onWeekChange(startOfWeek(today, { weekStartsOn: 1 }))}
        className={cn(
          'h-9 px-3 rounded-lg text-sm font-medium transition-all',
          isCurrentWeek
            ? 'bg-primary text-primary-foreground'
            : 'border border-border hover:bg-secondary text-foreground'
        )}
      >
        Today
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onWeekChange(addWeeks(currentWeek, 1))}
        className="h-9 w-9 rounded-lg border border-border hover:bg-secondary flex items-center justify-center transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </motion.button>
    </div>
  );
}