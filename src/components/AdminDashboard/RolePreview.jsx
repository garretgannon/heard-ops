import { useState } from 'react';
import { useRoleSimulation } from '@/lib/RoleSimulationContext';
import { Eye, RotateCcw, Edit2 } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function RolePreview({ jobCodes }) {
  const { simulatedRole, enterSimulation, exitSimulation } = useRoleSimulation();
  const [selectedRole, setSelectedRole] = useState(jobCodes[0]?.id || null);

  const handlePreview = (roleId) => {
    haptics.medium?.();
    enterSimulation(roleId);
  };

  const handleExit = () => {
    haptics.light?.();
    exitSimulation();
  };

  const selectedJobCode = jobCodes.find(j => j.id === selectedRole);

  return (
    <div className="space-y-4">
      {simulatedRole && (
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-4">
          <p className="text-sm font-bold text-amber-300">
            Currently previewing as: <span className="text-amber-200">{jobCodes.find(j => j.id === simulatedRole)?.name}</span>
          </p>
          <button
            onClick={handleExit}
            className="mt-3 w-full h-9 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-sm active:scale-95"
          >
            <RotateCcw className="h-4 w-4 inline mr-2" />
            Exit Preview
          </button>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-secondary-text uppercase block">Select Role to Preview</label>
        <div className="grid grid-cols-1 gap-2">
          {jobCodes.filter(j => j.isActive).map(jobCode => (
            <div
              key={jobCode.id}
              className="bg-card border border-border rounded-xl p-4 space-y-3"
            >
              <div>
                <h3 className="font-bold text-foreground">{jobCode.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{jobCode.description}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePreview(jobCode.id)}
                  disabled={simulatedRole === jobCode.id}
                  className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  <Eye className="h-4 w-4" />
                  {simulatedRole === jobCode.id ? 'Current Preview' : 'Preview'}
                </button>
                <button
                  className="flex-1 h-9 rounded-lg border border-border bg-muted text-secondary-text font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
                  title="Edit this role's permissions"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-bold text-foreground">How to Use</h4>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Select a role and click Preview to see the app as that job code</li>
          <li>You'll see the exact dashboard, navigation, and permissions</li>
          <li>Quick actions will reflect role-specific workflows</li>
          <li>Use this to verify role configuration before deployment</li>
        </ul>
      </div>
    </div>
  );
}