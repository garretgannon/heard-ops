import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import {
  ALL_ROLES,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  getDefaultPermissions,
} from '@/lib/permissions';
import { invalidatePermCache } from '@/hooks/usePermissions';

export default function RolePermissionBuilder() {
  const [selectedRole, setSelectedRole] = useState(ALL_ROLES[1].id); // default: general_manager
  const [perms, setPerms] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const defaults = getDefaultPermissions(selectedRole);
      try {
        const stored = await base44.entities.Settings.filter({ key: `role_permissions_${selectedRole}` });
        if (stored.length > 0 && stored[0].value) {
          setPerms({ ...defaults, ...JSON.parse(stored[0].value) });
        } else {
          setPerms(defaults);
        }
      } catch {
        setPerms(defaults);
      }
    };
    load();
    setSaved(false);
  }, [selectedRole]);

  const toggle = (key) => {
    haptics.light?.();
    setPerms(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    haptics.medium?.();
    try {
      const existing = await base44.entities.Settings.filter({ key: `role_permissions_${selectedRole}` });
      const data = { key: `role_permissions_${selectedRole}`, value: JSON.stringify(perms) };
      if (existing.length > 0) {
        await base44.entities.Settings.update(existing[0].id, data);
      } else {
        await base44.entities.Settings.create(data);
      }
      invalidatePermCache(selectedRole);
      setSaved(true);
      toast.success('Permissions saved');
    } catch (err) {
      toast.error('Failed to save permissions');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const currentRole = ALL_ROLES.find(r => r.id === selectedRole);

  return (
    <div className="space-y-5 pb-24">
      {/* Role Picker */}
      <div className="flex gap-2 flex-wrap">
        {ALL_ROLES.filter(r => r.id !== 'admin').map(role => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95',
              selectedRole === role.id
                ? 'bg-primary/20 border border-primary/40 text-primary'
                : 'card-glass border border-border text-muted-foreground hover:border-border/60'
            )}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Permission Groups */}
      {PERMISSION_GROUPS.map(group => (
        <div key={group.label} className="card-glass border border-border/40 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 bg-card/50">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{group.label}</p>
          </div>
          <div className="divide-y divide-border/20">
            {group.keys.map(key => (
              <div key={key} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-foreground">{PERMISSION_LABELS[key]}</span>
                <button
                  onClick={() => toggle(key)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none',
                    perms[key] ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                      perms[key] ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:relative lg:bottom-auto bg-background/95 backdrop-blur border-t border-border/30 px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Editing: <span className={cn('font-bold', currentRole?.color)}>{currentRole?.label}</span></p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'h-9 px-5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60',
            saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-primary text-primary-foreground hover:brightness-110'
          )}
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}