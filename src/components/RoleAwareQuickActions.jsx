import { FileText, ListTodo, Thermometer, UtensilsCrossed, AlertCircle } from 'lucide-react';
import { useRoleSimulation } from '@/lib/RoleSimulationContext';
import { haptics } from '@/utils/haptics';

// Kitchen Lead quick actions
const KITCHEN_LEAD_ACTIONS = [
  { id: 'shift_log', label: 'Log', icon: FileText, color: 'text-blue-400', desc: 'Shift intelligence' },
  { id: 'add_task', label: 'Task', icon: ListTodo, color: 'text-primary', desc: 'Create assignment' },
  { id: 'temp_log', label: 'Temps', icon: Thermometer, color: 'text-cyan-400', desc: 'Food safety' },
  { id: 'prep_command', label: 'Prep', icon: UtensilsCrossed, color: 'text-amber-400', desc: 'Prep planning' },
  { id: 'issue', label: 'Issue', icon: AlertCircle, color: 'text-orange-400', desc: 'Report problem' },
];

const SERVER_ACTIONS = [
  { id: 'shift_log', label: 'Log', icon: FileText, color: 'text-blue-400', desc: 'Shift notes' },
  { id: 'add_task', label: 'Task', icon: ListTodo, color: 'text-primary', desc: 'Create task' },
  { id: 'issue', label: 'Issue', icon: AlertCircle, color: 'text-orange-400', desc: 'Report issue' },
];

const PREP_COOK_ACTIONS = [
  { id: 'shift_log', label: 'Log', icon: FileText, color: 'text-blue-400', desc: 'Shift notes' },
  { id: 'temp_log', label: 'Temps', icon: Thermometer, color: 'text-cyan-400', desc: 'Temperatures' },
  { id: 'issue', label: 'Issue', icon: AlertCircle, color: 'text-orange-400', desc: 'Report issue' },
];

const MANAGER_ACTIONS = [
  { id: 'shift_log', label: 'Log', icon: FileText, color: 'text-blue-400', desc: 'Shift log' },
  { id: 'add_task', label: 'Task', icon: ListTodo, color: 'text-primary', desc: 'Assign task' },
  { id: 'issue', label: 'Issue', icon: AlertCircle, color: 'text-orange-400', desc: 'Report issue' },
];

const COOK_ACTIONS = [
  { id: 'shift_log', label: 'Log', icon: FileText, color: 'text-blue-400', desc: 'Shift notes' },
  { id: 'temp_log', label: 'Temps', icon: Thermometer, color: 'text-cyan-400', desc: 'Temperatures' },
  { id: 'issue', label: 'Issue', icon: AlertCircle, color: 'text-orange-400', desc: 'Report issue' },
];

const ROLE_ACTION_MAP = {
  kitchen_lead: KITCHEN_LEAD_ACTIONS,
  server: SERVER_ACTIONS,
  prep_cook: PREP_COOK_ACTIONS,
  manager: MANAGER_ACTIONS,
  cook: COOK_ACTIONS,
};

export default function RoleAwareQuickActions({ onActionClick }) {
  const { simulatedRole } = useRoleSimulation();
  
  const actions = simulatedRole && ROLE_ACTION_MAP[simulatedRole] ? ROLE_ACTION_MAP[simulatedRole] : KITCHEN_LEAD_ACTIONS;

  return (
    <div className="grid grid-cols-5 gap-2">
      {actions.map(({ id, label, icon: Icon, color, desc }) => (
        <button
          key={id}
          onClick={() => {
            haptics.light();
            onActionClick?.(id);
          }}
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-card border border-border/50 hover:border-border/80 active:scale-95 transition-all group"
          title={desc}
        >
          <div className="relative">
            <Icon className={`h-5 w-5 stroke-[1.5] ${color}`} />
          </div>
          <span className="text-[9px] font-bold text-secondary-text text-center leading-tight group-hover:text-foreground transition-colors">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}