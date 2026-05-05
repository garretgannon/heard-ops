import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Settings } from 'lucide-react';

export default function SideWork() {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Side Work</h1>
        {isAdmin && (
          <button
            onClick={() => navigate('/side-work-templates')}
            className="btn-secondary text-xs h-8 px-2 flex items-center gap-1"
          >
            <Settings className="h-3 w-3" />
            Templates
          </button>
        )}
      </div>

      {/* Placeholder Content */}
      <div className="px-4 py-8 text-center text-secondary-text">
        <p className="text-sm">Side work assignments will appear here</p>
        <p className="text-xs mt-2 text-muted-foreground">Create templates to auto-generate daily tasks</p>
      </div>
    </div>
  );
}

export const hideBase44Index = true;