import { useCurrentUser } from './useCurrentUser';
import { useRoleSimulation } from '@/lib/RoleSimulationContext';
import {
  canSeeFeature,
  canEditResource,
  canReviewContent,
  ROLE_DEFINITIONS,
} from '@/lib/roleVisibilityConfig';

/**
 * Hook for checking role-based visibility
 * Respects admin preview mode when active
 */
export function useRoleVisibility() {
  const { user } = useCurrentUser();
  const { previewRole } = useRoleSimulation();

  // Use preview role if admin is simulating, otherwise use actual role
  const activeRole = previewRole || user?.role || 'user';

  return {
    role: activeRole,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    isKitchenLead: activeRole === 'kitchen_lead',
    isKitchenStaff: ['kitchen_lead', 'line_cook', 'prep_cook', 'expo', 'dishwasher'].includes(activeRole),
    isFOH: ['server', 'bartender', 'host', 'busser'].includes(activeRole),
    isPreviewMode: !!previewRole && user?.role === 'admin',

    // Feature visibility
    canSee: (feature, subFeature) => canSeeFeature(activeRole, feature, subFeature),
    canEdit: (resourceType) => canEditResource(activeRole, resourceType),
    canReview: (contentType) => canReviewContent(activeRole, contentType),

    // Get role config
    getRoleConfig: () => ROLE_DEFINITIONS[activeRole],
  };
}