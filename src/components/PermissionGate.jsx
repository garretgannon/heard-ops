import { usePermissions } from '@/hooks/usePermissions';
import AccessRestricted from './AccessRestricted';

/**
 * Wraps a page/section and shows AccessRestricted if the user lacks the permission.
 * Usage: <PermissionGate permission={PERMISSIONS.VIEW_TEAM}><TeamCenter /></PermissionGate>
 */
export default function PermissionGate({ permission, children, message }) {
  const { can, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!can(permission)) {
    return <AccessRestricted message={message} />;
  }

  return children;
}