import { X, ArrowRight, Settings } from 'lucide-react';
import { useRoleSimulation } from '@/lib/RoleSimulationContext';
import { getRoleDefinition } from '@/lib/roleDefinitions';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function AdminSimulationBar() {
  const navigate = useNavigate();
  const { isSimulating, simulatedRole, exitSimulation } = useRoleSimulation();

  if (!isSimulating || !simulatedRole) return null;

  const roleDef = getRoleDefinition(simulatedRole);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-purple-900/95 border-b-2 border-purple-500/50 backdrop-blur-sm">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
            <span className="text-xs font-bold text-purple-300">ADMIN</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              Viewing as: <span className={cn("font-extrabold", roleDef?.color)}>{roleDef?.label}</span>
            </p>
            <p className="text-[10px] text-purple-200">Restricted role simulation — fully immersive</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/role-simulator')}
            className="h-8 px-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Settings className="h-3.5 w-3.5" />
            Change Role
          </button>
          <button
            onClick={exitSimulation}
            className="h-8 w-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 flex items-center justify-center transition-all active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}