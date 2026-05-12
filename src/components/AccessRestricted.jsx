import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccessRestricted({ message }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-border/30 flex items-center justify-center mb-4">
        <Lock className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-1">Access Restricted</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        {message || "You don't have permission to view this page. Contact your manager if you think this is a mistake."}
      </p>
      <button
        onClick={() => navigate('/')}
        className="mt-6 px-5 py-2.5 rounded-xl card-glass border border-border text-sm font-semibold text-foreground hover:border-border/80 active:scale-95 transition-all"
      >
        Back to Today
      </button>
    </div>
  );
}