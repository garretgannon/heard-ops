import { Eye, Shield } from 'lucide-react';

export default function RolesView({ roles, employees, onPreviewRole, onManageRole }) {
  const getRoleColor = (roleName) => {
    const colors = {
      manager: 'bg-purple-500/15 text-purple-400',
      kitchen_lead: 'bg-orange-500/15 text-orange-400',
      cook: 'bg-red-500/15 text-red-400',
      server: 'bg-blue-500/15 text-blue-400',
      busser: 'bg-green-500/15 text-green-400',
      bartender: 'bg-pink-500/15 text-pink-400',
      host: 'bg-yellow-500/15 text-yellow-400',
    };
    return colors[roleName] || 'bg-slate-500/15 text-slate-400';
  };

  return (
    <div className="space-y-4">
      {roles?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No roles configured</p>
        </div>
      ) : (
        roles.map((role) => {
          const assignedCount = employees?.filter((e) => e.primary_role === role.name).length || 0;

          return (
            <div
              key={role.id}
              className="p-4 rounded-lg bg-card border border-border/40 space-y-3"
            >
              {/* Role Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-foreground">{role.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {assignedCount} employee{assignedCount !== 1 ? 's' : ''} assigned
                  </p>
                </div>
              </div>

              {/* Permissions Preview */}
              {role.permissions?.length > 0 && (
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-muted-foreground">Can access:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-md bg-muted text-muted-foreground"
                      >
                        {perm}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="px-2 py-1 text-muted-foreground">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border/20">
                <button
                  onClick={() => onPreviewRole?.(role.name)}
                  className="flex-1 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
                <button
                  onClick={() => onManageRole?.(role.id)}
                  className="flex-1 h-8 rounded-lg border border-border/40 text-muted-foreground font-semibold text-xs hover:bg-secondary transition-all active:scale-95"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}