import { Award, BadgeCheck, CheckCircle2, ShieldCheck, Sparkles, TrendingUp, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG = [
  { key: 'taskCompletion', label: 'Tasks', icon: CheckCircle2, color: 'bg-emerald-500' },
  { key: 'foodSafety', label: 'Food Safety', icon: ShieldCheck, color: 'bg-sky-500' },
  { key: 'reliability', label: 'Reliability', icon: TrendingUp, color: 'bg-amber-500' },
  { key: 'teamSupport', label: 'Team Support', icon: Users, color: 'bg-rose-500' },
  { key: 'training', label: 'Training', icon: BadgeCheck, color: 'bg-indigo-500' },
];

function normalize(value) {
  return value == null ? '' : String(value).trim().toLowerCase();
}

function matchesCurrentUser(entry, user) {
  const employee = entry?.employee || {};
  const userKeys = [user?.id, user?.email, user?.full_name, user?.name].map(normalize).filter(Boolean);
  const employeeKeys = [employee.id, employee.email, employee.full_name, employee.employee_id].map(normalize).filter(Boolean);
  return userKeys.some(key => employeeKeys.includes(key));
}

function ProgressBars({ categories }) {
  return (
    <div className="space-y-3">
      {CATEGORY_CONFIG.map(({ key, label, icon: IconComponent, color }) => {
        const value = categories?.[key] || 0;
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <IconComponent className="h-3.5 w-3.5" />
                {label}
              </span>
              <span className="font-bold text-foreground">{value}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/70 overflow-hidden">
              <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BadgeList({ badges }) {
  if (!badges?.length) {
    return <p className="text-xs text-muted-foreground">Badges appear as more completions and certifications are logged.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span key={badge} className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
          <Award className="h-3 w-3" />
          {badge}
        </span>
      ))}
    </div>
  );
}

function ProgressCard({ entry, compact = false, showRank = false }) {
  const employee = entry.employee || {};

  return (
    <div className="rounded-xl card-glass border border-border/40 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {showRank && (
              <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center">
                {entry.rank}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-foreground truncate">{employee.full_name || 'Team member'}</h3>
              <p className="text-xs text-muted-foreground">{employee.primary_role || employee.department || 'Staff'}</p>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-black text-foreground">{entry.totalPoints}</p>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Points</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-secondary/30 px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground">Level</span>
        <span className="text-sm font-black text-primary">{entry.level}</span>
      </div>

      {!compact && <ProgressBars categories={entry.categories} />}

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Recognition</p>
        <BadgeList badges={entry.badges} />
      </div>

      {entry.highlights?.length > 0 && (
        <div className="space-y-1 border-t border-border/20 pt-3">
          {entry.highlights.slice(0, 3).map((highlight) => (
            <p key={highlight} className="text-xs text-muted-foreground">{highlight}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamProgressView({ progress = [], isAdmin, currentUser }) {
  const currentUserProgress = progress.find(entry => matchesCurrentUser(entry, currentUser)) || progress[0];
  const averagePoints = progress.length
    ? Math.round(progress.reduce((sum, entry) => sum + entry.totalPoints, 0) / progress.length)
    : 0;
  const topEntry = progress[0];

  if (!progress.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No progress data yet</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border/40 card-glass p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-foreground">My Progress</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Recognition points are private to you and management.
          </p>
        </div>
        {currentUserProgress && <ProgressCard entry={currentUserProgress} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg card-glass border border-border/40 p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Tracked</p>
          <p className="mt-1 text-lg font-black text-foreground">{progress.length}</p>
        </div>
        <div className="rounded-lg card-glass border border-border/40 p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Average</p>
          <p className="mt-1 text-lg font-black text-foreground">{averagePoints}</p>
        </div>
        <div className="rounded-lg card-glass border border-border/40 p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Top Level</p>
          <p className="mt-1 text-sm font-black text-primary truncate">{topEntry?.level || 'None'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/40 card-glass p-4">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-foreground">Manager Recognition View</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Private scoring based on completed work, training, food safety, reliability, and positive follow-through.
        </p>
      </div>

      <div className="space-y-3">
        {progress.map((entry) => (
          <ProgressCard key={entry.employee?.id || entry.employee?.email || entry.rank} entry={entry} showRank compact={entry.rank > 3} />
        ))}
      </div>
    </div>
  );
}
