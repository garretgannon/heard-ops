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
    <div className="space-y-2">
      {DEFAULT_ROLES.map(role => (
        <div key={role} className="flex items-center gap-3 px-3.5 py-2.5 bg-background/50 border border-border/40 rounded-lg group hover:border-border/60 transition-all">
          <p className="text-xs font-semibold text-foreground w-28 shrink-0">{role}</p>
          
          {editing === role ? (
            <div className="flex-1 flex gap-1.5">
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="e.g. Line Cook, Prep Cook, Dishwasher"
                className="flex-1 px-2.5 py-1 bg-card border border-primary/50 rounded text-xs text-foreground outline-none"
              />
              <button
                onClick={() => handleSave(role)}
                className="px-2.5 py-1 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 transition-all text-xs font-semibold"
              >
                <Save className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleCancel}
                className="px-2.5 py-1 text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground flex-1">
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