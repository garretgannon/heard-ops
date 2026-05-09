import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { useRoleSimulation } from '@/lib/RoleSimulationContext';
import { getDefaultPermissions, ALL_ROLES } from '@/lib/permissions';
import { base44 } from '@/api/base44Client';

// Module-level cache to avoid re-fetching on every hook call
const permCache = {};

/**
 * Returns the merged permissions for the active role (real or previewed).
 * Custom overrides stored in Settings entity override defaults.
 */
export function usePermissions() {
  const { user, isAdmin } = useCurrentUser();
  const { previewRole } = useRoleSimulation();

  // Active role: preview overrides real role (admin only)
  const activeRole = (isAdmin && previewRole) ? previewRole : (user?.role || 'cook');
  const isPreviewMode = !!(isAdmin && previewRole);

  const [perms, setPerms] = useState(() => getDefaultPermissions(activeRole));
  const [loading, setLoading] = useState(true);

  const loadPerms = useCallback(async (role) => {
    if (permCache[role]) {
      setPerms(permCache[role]);
      setLoading(false);
      return;
    }
    const defaults = getDefaultPermissions(role);
    try {
      const stored = await base44.entities.Settings.filter({ key: `role_permissions_${role}` });
      if (stored.length > 0 && stored[0].value) {
        const overrides = JSON.parse(stored[0].value);
        const merged = { ...defaults, ...overrides };
        permCache[role] = merged;
        setPerms(merged);
      } else {
        permCache[role] = defaults;
        setPerms(defaults);
      }
    } catch {
      setPerms(defaults);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin && !previewRole) {
      // Admins always have all perms
      setPerms(getDefaultPermissions('admin'));
      setLoading(false);
      return;
    }
    loadPerms(activeRole);
  }, [activeRole, isAdmin, previewRole, loadPerms]);

  const can = (permission) => {
    if (isAdmin && !previewRole) return true;
    return !!perms[permission];
  };

  return { perms, can, loading, activeRole, isPreviewMode, ALL_ROLES };
}

// Invalidate cache for a role (call after saving overrides)
export function invalidatePermCache(role) {
  delete permCache[role];
}