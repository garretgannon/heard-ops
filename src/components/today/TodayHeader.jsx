import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatDistanceToNow } from 'date-fns';

export default function TodayHeader() {
  const { user } = useCurrentUser();
  const now = new Date();
  const greeting = (() => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="sticky top-0 z-30 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-sm border-b border-border/20 px-4 py-4 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">{greeting}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.full_name || 'Team Member'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>•</span>
          <span className="capitalize">{user?.role || 'staff'} view</span>
        </div>
      </div>
    </div>
  );
}