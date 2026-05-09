import { useRoleSimulation } from '@/lib/RoleSimulationContext';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { ALL_ROLES } from '@/lib/permissions';
import { toast } from 'sonner';

export default function RolePreview() {
  const { previewRole, setPreview, exitPreview } = useRoleSimulation();

  const handleSelect = (roleId) => {
    haptics.medium?.();
    if (previewRole === roleId) {
      exitPreview();
      toast.success('Preview disabled');
    } else {
      setPreview(roleId);
      const role = ALL_ROLES.find(r => r.id === roleId);
      toast.success(`Now previewing as ${role.label}`);
    }
  };

  return (
    <div className="space-y-4">
      {previewRole && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-300">
              Previewing as {ALL_ROLES.find(r => r.id === previewRole)?.label}
            </span>
          </div>
          <button
            onClick={() => { exitPreview(); toast.success('Preview disabled'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold active:scale-95 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Exit
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Select a role to preview the app exactly as that role would see it. Your actual permissions are unchanged.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {ALL_ROLES.filter(r => r.id !== 'admin').map(role => (
          <button
            key={role.id}
            onClick={() => handleSelect(role.id)}
            className={cn(
              'flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all active:scale-95',
              previewRole === role.id
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-card border-border/40 text-foreground hover:border-border/70'
            )}
          >
            {previewRole === role.id
              ? <Eye className="h-4 w-4 flex-shrink-0 text-primary" />
              : <EyeOff className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
            <span className={cn('text-sm font-semibold', role.color)}>{role.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}