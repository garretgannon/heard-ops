import { useNavigate } from 'react-router-dom';
import { Bell, CalendarDays } from 'lucide-react';

export default function DesktopPageHeader({ title, subtitle, actions }) {
  const navigate = useNavigate();
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="hidden lg:flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/30">
      <div>
        <h1 className="text-xl font-extrabold text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle || dateStr}</p>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          onClick={() => navigate('/shift-handoff')}
          className="h-8 px-3 rounded-lg border border-border bg-card text-xs font-bold text-foreground flex items-center gap-1.5 hover:bg-muted transition-all active:scale-95"
        >
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          Today's Plan
        </button>
        <button
          onClick={() => navigate('/logs')}
          className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-all active:scale-95"
        >
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}