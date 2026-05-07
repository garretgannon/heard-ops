import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_COLORS = {
  manager: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  server: 'bg-pink-500/20 border-pink-500/50 text-pink-300',
  bartender: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
  cook: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
  prep: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
  dish: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
  host: 'bg-teal-500/20 border-teal-500/50 text-teal-300',
};

export default function ShiftBlock({
  shift,
  employee,
  isSelected,
  onSelect,
  onMultiSelect,
  isDragging,
}) {
  const roleColor = ROLE_COLORS[shift.role] || ROLE_COLORS.host;
  const startTime = shift.startTime || '9:00 AM';
  const endTime = shift.endTime || '5:00 PM';

  return (
    <motion.button
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          onMultiSelect?.();
        } else {
          onSelect?.();
        }
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full p-2 rounded-lg border-2 transition-all text-left text-xs',
        roleColor,
        isSelected && 'ring-2 ring-primary bg-primary/10',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-bold text-foreground capitalize">{shift.role}</p>
          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{startTime} - {endTime}</span>
          </div>
        </div>
        {shift.hasConflict && (
          <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
        )}
      </div>
      {shift.station && (
        <p className="mt-1.5 text-xs text-muted-foreground">{shift.station}</p>
      )}
    </motion.button>
  );
}