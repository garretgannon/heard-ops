import { ChefHat, CheckSquare, Wrench, FileText, Trash2, AlertOctagon } from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const ACTIONS = [
  { id: 'prep',                label: 'Add Prep',         icon: ChefHat,       color: 'text-amber-400',  bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.22)'  },
  { id: 'task',                label: 'Add Task',         icon: CheckSquare,   color: 'text-primary',    bg: 'rgba(230,106,31,0.08)',  border: 'rgba(230,106,31,0.22)'  },
  { id: 'add_manager_note',    label: 'Manager Log',      icon: FileText,      color: 'text-blue-400',   bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.22)'  },
  { id: 'report_maintenance',  label: 'Maintenance',      icon: Wrench,        color: 'text-orange-400', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.22)'  },
  { id: 'add_waste',           label: 'Add Waste',        icon: Trash2,        color: 'text-red-400',    bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.22)' },
  { id: 'add_eighty_six',      label: 'Add 86',           icon: AlertOctagon,  color: 'text-rose-400',   bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.22)' },
];

export default function QuickAddSheet({ open, onClose, onAction }) {
  const handleAction = (id) => {
    haptics.medium?.();
    onClose?.();
    onAction?.(id);
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="pb-2">
        <div className="grid grid-cols-2 gap-2.5">
          {ACTIONS.map(({ id, label, icon: Icon, color, bg, border }) => (
            <button
              key={id}
              onClick={() => handleAction(id)}
              className="flex flex-col items-center gap-2.5 rounded-2xl p-4 transition-all active:scale-[0.97]"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: bg }}>
                <Icon className={cn('h-5 w-5', color)} strokeWidth={1.75} />
              </div>
              <span className="text-xs font-black tracking-tight text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
