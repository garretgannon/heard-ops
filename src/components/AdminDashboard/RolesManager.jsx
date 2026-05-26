import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Shield, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ALL_ROLES, PERMISSION_GROUPS, PERMISSION_LABELS, getDefaultPermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BUILT_IN_ROLE_IDS = ALL_ROLES.map(r => r.id);

export default function RolesManager() {
  const [roles, setRoles] = useState(ALL_ROLES);
  const [rolePermissions, setRolePermissions] = useState({});
  const [expandedRole, setExpandedRole] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await base44.entities.Settings.list();
        const perms = {};

        const customRolesSetting = settings.find(s => s.key === 'custom_roles');
        if (customRolesSetting) {
          const customRoles = JSON.parse(customRolesSetting.value || '[]');
          setRoles([...ALL_ROLES, ...customRoles]);
        }

        for (const r of ALL_ROLES) {
          const saved = settings.find(s => s.key === `role_permissions_${r.id}`);
          perms[r.id] = saved ? JSON.parse(saved.value) : getDefaultPermissions(r.id);
        }
        setRolePermissions(perms);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const savePermissions = async (roleId, perms) => {
    const existing = await base44.entities.Settings.filter({ key: `role_permissions_${roleId}` });
    if (existing.length > 0) {
      await base44.entities.Settings.update(existing[0].id, { value: JSON.stringify(perms) });
    } else {
      await base44.entities.Settings.create({ key: `role_permissions_${roleId}`, value: JSON.stringify(perms) });
    }
  };

  const togglePermission = async (roleId, permKey) => {
    if (roleId === 'admin') return;
    const current = rolePermissions[roleId] || getDefaultPermissions(roleId);
    const updated = { ...current, [permKey]: !current[permKey] };
    setRolePermissions(prev => ({ ...prev, [roleId]: updated }));
    await savePermissions(roleId, updated);
    toast.success('Permission updated');
  };

  const addRole = async () => {
    if (!newRoleLabel.trim()) return;
    const id = newRoleLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const newRole = { id, label: newRoleLabel.trim(), color: 'text-slate-400', custom: true };
    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);

    const defaultPerms = getDefaultPermissions('cook');
    setRolePermissions(prev => ({ ...prev, [id]: defaultPerms }));

    const customRoles = updatedRoles.filter(r => r.custom);
    const existing = await base44.entities.Settings.filter({ key: 'custom_roles' });
    if (existing.length > 0) {
      await base44.entities.Settings.update(existing[0].id, { value: JSON.stringify(customRoles) });
    } else {
      await base44.entities.Settings.create({ key: 'custom_roles', value: JSON.stringify(customRoles) });
    }
    await savePermissions(id, defaultPerms);

    setNewRoleLabel('');
    setShowAddForm(false);
    setExpandedRole(id);
    toast.success(`Role "${newRoleLabel}" created`);
  };

  const deleteRole = async (roleId) => {
    if (BUILT_IN_ROLE_IDS.includes(roleId)) {
      toast.error('Cannot delete built-in roles');
      return;
    }
    const updatedRoles = roles.filter(r => r.id !== roleId);
    setRoles(updatedRoles);
    const customRoles = updatedRoles.filter(r => r.custom);
    const existing = await base44.entities.Settings.filter({ key: 'custom_roles' });
    if (existing.length > 0) {
      await base44.entities.Settings.update(existing[0].id, { value: JSON.stringify(customRoles) });
    }
    toast.success('Role deleted');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Roles &amp; Permissions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{roles.length} roles &mdash; click a role to edit permissions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Role
        </button>
      </div>

      {showAddForm && (
        <div className="flex gap-2 p-3 card-glass border border-border/40 rounded-xl">
          <input
            autoFocus
            type="text"
            placeholder="Role name (e.g. Line Cook)"
            value={newRoleLabel}
            onChange={e => setNewRoleLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRole()}
            className="flex-1 liquid-card/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <button onClick={addRole} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:brightness-110">Create</button>
          <button onClick={() => setShowAddForm(false)} className="px-3 py-2 rounded-lg card-glass border border-border/40 text-muted-foreground font-bold text-xs hover:text-foreground">Cancel</button>
        </div>
      )}

      <div className="space-y-2">
        {roles.map(role => {
          const perms = rolePermissions[role.id] || getDefaultPermissions(role.id);
          const permCount = Object.values(perms).filter(Boolean).length;
          const totalPerms = Object.keys(perms).length;
          const isExpanded = expandedRole === role.id;
          const isBuiltIn = BUILT_IN_ROLE_IDS.includes(role.id);

          return (
            <div key={role.id} className="card-glass border border-border/30 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/4 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className={cn("h-4 w-4", role.color || 'text-primary')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">{role.label}</span>
                    {!isBuiltIn && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">Custom</span>
                    )}
                    {role.id === 'admin' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold">Full Access</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{permCount}/{totalPerms} permissions enabled</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isBuiltIn && (
                    <button
                      onClick={e => { e.stopPropagation(); deleteRole(role.id); }}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border/20 px-4 py-4 space-y-5">
                  {role.id === 'admin' ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Admins have full access to everything and cannot be restricted.
                    </p>
                  ) : (
                    PERMISSION_GROUPS.map(group => (
                      <div key={group.label}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">{group.label}</p>
                        <div className="grid grid-cols-1 gap-1">
                          {group.keys.map(key => {
                            const enabled = perms[key] === true;
                            return (
                              <button
                                key={key}
                                onClick={() => togglePermission(role.id, key)}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                                  enabled
                                    ? "bg-green-500/10 border border-green-500/20"
                                    : "liquid-card/30 hover:border-border/50"
                                )}
                              >
                                <span className={cn("font-medium text-left", enabled ? "text-foreground" : "text-muted-foreground")}>
                                  {PERMISSION_LABELS[key]}
                                </span>
                                {enabled
                                  ? <Check className="h-4 w-4 text-green-400 shrink-0" />
                                  : <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                                }
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}