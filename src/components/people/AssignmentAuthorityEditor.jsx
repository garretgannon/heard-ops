import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Edit2, Save, X } from 'lucide-react';

const DEFAULT_ROLES = ['Admin', 'General Manager', 'Manager', 'Kitchen Lead', 'Bartender', 'Server', 'Host', 'Line Cook', 'Prep Cook'];

export default function AssignmentAuthorityEditor() {
  const [authority, setAuthority] = useState({});
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthority();
  }, []);

  const loadAuthority = async () => {
    try {
      const settings = await base44.entities.Settings.filter({ key: 'assignment_authority' });
      if (settings.length > 0 && settings[0].value) {
        setAuthority(settings[0].value);
      } else {
        // Initialize with defaults
        const defaults = {};
        defaults['Admin'] = 'All roles';
        defaults['General Manager'] = 'All roles';
        defaults['Manager'] = 'Kitchen Lead, Line Cook, Prep Cook, Dishwasher, Server, Host, Busser, Bartender';
        defaults['Kitchen Lead'] = 'Line Cook, Prep Cook, Dishwasher';
        defaults['Bartender'] = null;
        defaults['Server'] = null;
        defaults['Host'] = null;
        defaults['Line Cook'] = null;
        defaults['Prep Cook'] = null;
        setAuthority(defaults);
      }
    } catch (error) {
      console.error('Failed to load authority:', error);
    }
    setLoading(false);
  };

  const handleEdit = (role) => {
    setEditing(role);
    setEditValue(authority[role] || '');
  };

  const handleSave = async (role) => {
    const updated = { ...authority, [role]: editValue || null };
    setAuthority(updated);
    setEditing(null);

    try {
      const existing = await base44.entities.Settings.filter({ key: 'assignment_authority' });
      if (existing.length > 0) {
        await base44.entities.Settings.update(existing[0].id, { value: updated });
      } else {
        await base44.entities.Settings.create({ key: 'assignment_authority', value: updated });
      }
    } catch (error) {
      console.error('Failed to save authority:', error);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setEditValue('');
  };

  if (loading) return <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="max-w-full space-y-2 overflow-x-hidden">
      {DEFAULT_ROLES.map(role => (
        <div key={role} className="group flex min-w-0 flex-col gap-2 rounded-lg border border-border/40 bg-background/50 px-3.5 py-2.5 transition-all hover:border-border/60 sm:flex-row sm:items-center sm:gap-3">
          <p className="text-xs font-semibold text-foreground sm:w-28 sm:shrink-0">{role}</p>
          
          {editing === role ? (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row">
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="e.g. Line Cook, Prep Cook, Dishwasher"
                className="liquid-card min-w-0 flex-1 rounded -primary/50 px-2.5 py-2 text-xs text-foreground outline-none sm:py-1"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleSave(role)}
                  className="flex h-9 flex-1 items-center justify-center rounded bg-green-500/20 px-2.5 text-xs font-semibold text-green-300 transition-all hover:bg-green-500/30 sm:h-auto sm:flex-none sm:py-1"
                >
                  <Save className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleCancel}
                  className="flex h-9 flex-1 items-center justify-center rounded px-2.5 text-muted-foreground transition-all hover:text-foreground sm:h-auto sm:flex-none sm:py-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="min-w-0 flex-1 break-words text-xs text-muted-foreground">
                {authority[role]
                  ? authority[role]
                  : <span className="italic text-muted-foreground/50">Cannot assign tasks</span>
                }
              </p>
              <button
                onClick={() => handleEdit(role)}
                className="p-1.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground/60 mt-3 px-1">
        List the roles this role can assign tasks to, separated by commas. Leave empty to prevent task assignment.
      </p>
    </div>
  );
}
