import {
  AlertTriangle,
  CalendarPlus,
  ClipboardCheck,
  FileText,
  Thermometer,
  Trash2,
  Wrench,
} from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import { haptics } from '@/utils/haptics';

const QUICK_ACTIONS = [
  {
    id: 'task',
    label: 'Task',
    detail: 'Open task assignment template',
    icon: ClipboardCheck,
    actionType: 'add_task',
    status: 'status-info',
  },
  {
    id: 'manager_note',
    label: 'Manager Log',
    detail: 'Open manager log template',
    icon: FileText,
    actionType: 'add_manager_note',
    status: 'status-neutral',
  },
  {
    id: 'reservation',
    label: 'Reservation / BEO',
    detail: 'Open event template',
    icon: CalendarPlus,
    actionType: 'add_beo',
    status: 'status-info',
  },
  {
    id: 'waste',
    label: 'Waste',
    detail: 'Open waste log template',
    icon: Trash2,
    actionType: 'add_waste',
    status: 'status-warning',
  },
  {
    id: 'maintenance',
    label: 'Maintenance Issue',
    detail: 'Open maintenance template',
    icon: Wrench,
    actionType: 'report_maintenance',
    status: 'status-warning',
  },
  {
    id: 'temperature',
    label: 'Temp Log',
    detail: 'Open temperature template',
    icon: Thermometer,
    actionType: 'log_temperature',
    status: 'status-info',
  },
  {
    id: 'incident',
    label: 'Incident',
    detail: 'Open incident template',
    icon: AlertTriangle,
    actionType: 'report_incident',
    status: 'status-critical',
  },
];

export default function QuickAddSheet({ open, onClose, onAction }) {
  const handleAction = (action) => {
    haptics.medium?.();
    onClose?.();
    onAction?.(action.actionType);
  };

  return (
    <BottomSheet open={open} onClose={onClose} className="bg-background/95 border-border/70">
      <div className="max-w-full space-y-5 overflow-x-hidden pb-1">
        <div className="min-w-0">
          <p className="metric-label">Add</p>
          <h2 className="mt-1 break-words text-2xl font-black tracking-tight text-foreground">Choose a template</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className="group min-h-[104px] min-w-0 rounded-xl border border-border/60 bg-card/70 p-4 text-left transition-all duration-200 active:scale-[0.98] glow-interactive sm:min-h-[116px]"
              >
                <div className={`${action.status} status-marker status-marker-lg mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="break-words text-sm font-black tracking-tight text-foreground">{action.label}</p>
                <p className="mt-1 break-words text-xs leading-snug text-muted-foreground">{action.detail}</p>
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
