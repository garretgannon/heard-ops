import { useState } from 'react';
import { useRoleSimulation } from '@/lib/RoleSimulationContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getAllRoles } from '@/lib/roleVisibilityConfig';
import { X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Admin role preview selector
 * Allows admins to see exactly what each role sees
 */
export default function AdminRolePreview() {
  const { user } = useCurrentUser();
  const { previewRole, setPreview, exitPreview, isPreviewing } = useRoleSimulation();
  const [open, setOpen] = useState(false);

  if (!user || user.role !== 'admin') return null;

  const roles = getAllRoles();
  const currentPreview = previewRole ? roles.find(r => r.id === previewRole) : null;

  const handleSelectRole = (roleId) => {
    if (previewRole === roleId) {
      exitPreview();
      setOpen(false);
      toast.success('Preview disabled');
    } else {
      setPreview(roleId);
      setOpen(false);
      const role = roles.find(r => r.id === roleId);
      toast.success(`Previewing as ${role.label}`);
    }
  };

  return (
    <>
      {/* Preview Badge - Shows when in preview mode */}
      {isPreviewing && currentPreview && (
        <div className="fixed bottom-24 lg:bottom-0 right-4 z-40 lg:z-30">
          <div className="bg-amber-950/90 border border-amber-700/50 rounded-lg px-3 py-2 flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-100">
              Previewing: {currentPreview.label}
            </span>
            <button
              onClick={() => {
                exitPreview();
                toast.success('Preview disabled');
              }}
              className="ml-2 h-6 w-6 rounded hover:bg-amber-900/50 flex items-center justify-center"
            >
              <X className="h-3 w-3 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* Preview Selector Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-24 lg:bottom-4 right-4 z-40 lg:z-30 h-11 w-11 rounded-lg flex items-center justify-center transition-all',
          isPreviewing
            ? 'bg-amber-600 text-white hover:bg-amber-700'
            : 'bg-primary text-primary-foreground hover:brightness-110'
        )}
        title="Role preview"
      >
        <Eye className="h-5 w-5" />
      </button>

      {/* Preview Dropdown */}
      {open && (
        <div className="fixed bottom-36 lg:bottom-16 right-4 z-50 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border/30">
            <h3 className="text-xs font-bold text-muted-foreground uppercase">Preview as role</h3>
          </div>
          <div className="max-h-96 overflow-y-auto p-1 space-y-1">
            {/* Current role option */}
            <button
              onClick={() => handleSelectRole(null)}
              className={cn(
                'w-full text-left px-3 py-2 rounded text-sm transition-all active:scale-95',
                !previewRole
                  ? 'bg-primary/15 text-primary font-bold'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <span className="flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                Your Role (Admin)
              </span>
            </button>

            {/* Role options */}
            {roles.filter(r => r.id !== 'admin').map(role => (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded text-sm transition-all active:scale-95',
                  previewRole === role.id
                    ? 'bg-primary/15 text-primary font-bold'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {role.label}
                </span>
              </button>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-border/30 text-xs text-muted-foreground">
            <p>Change visibility settings while previewing to adjust what each role sees.</p>
          </div>
        </div>
      )}
    </>
  );
}