import { useCurrentUser } from '@/hooks/useCurrentUser';

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
    <div className="sticky top-0 z-30 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-sm border-b border-border/20 px-4 py-3 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-3 mb-1">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{greeting}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.full_name || 'Team Member'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/75">
          <span>•</span>
          <span className="capitalize">{user?.role || 'staff'} view</span>
        </div>
      </div>
    </div>
  );
}