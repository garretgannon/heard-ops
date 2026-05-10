import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Settings } from 'lucide-react';

export default function Cleaning() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  return (
    <div className="pb-24">
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Cleaning Checklists</h1>
        {isAdmin && (
          <button
            onClick={() => navigate('/cleaning-templates')}
            className="btn-secondary text-xs h-8 px-2 flex items-center gap-1"
          >
            <Settings className="h-3 w-3" />
            Templates
          </button>
        )}
      </div>

      <div className="px-4 py-8 text-center text-secondary-text">
        <p className="text-sm">Daily cleaning tasks will appear here</p>
        <p className="text-xs mt-2 text-muted-foreground">Create templates to auto-generate daily cleaning checks</p>
      </div>
    </div>
  );
}
export const hideBase44Index = true;