import { AlertTriangle, BookOpen, Calendar, ChefHat, ChevronRight, ClipboardList, Flame, RefreshCw, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { SHIFT_WINDOWS } from '@/lib/briefingProfiles';

// Department accent colours — no purple per brand rules
const DEPT_STYLE = {
  foh:     { color: 'text-blue-400',    bg: 'bg-blue-500/8',    border: 'border-blue-500/25',    dot: 'bg-blue-400' },
  boh:     { color: 'text-amber-400',   bg: 'bg-amber-500/8',   border: 'border-amber-500/25',   dot: 'bg-amber-400' },
  bar:     { color: 'text-teal-400',    bg: 'bg-teal-500/8',    border: 'border-teal-500/25',    dot: 'bg-teal-400' },
  banquet: { color: 'text-cyan-400',    bg: 'bg-cyan-500/8',    border: 'border-cyan-500/25',    dot: 'bg-cyan-400' },
  all:     { color: 'text-primary',     bg: 'bg-primary/8',     border: 'border-primary/25',     dot: 'bg-primary' },
};

const CARD_BG = 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)';

// ─── Profile selector ─────────────────────────────────────────────────────────
export function BriefingProfileSelector({ profiles, onSelect }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border/40"
      style={{ background: CARD_BG, boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}
    >
      <div className="px-5 pt-5 pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Pre-Shift Briefing</p>
        <h2 className="mt-1 text-lg font-black text-foreground">What briefing are you starting?</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Select the scope that matches your shift.</p>
      </div>

      <div className="divide-y divide-border/20 border-t border-border/20">
        {profiles.map(profile => {
          const style = DEPT_STYLE[profile.department] || DEPT_STYLE.all;
          const shiftLabels = profile.shiftTypes
            .map(st => SHIFT_WINDOWS[st]?.label)
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(' · ');

          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => { haptics.medium(); onSelect(profile); }}
              className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-all hover:bg-white/[0.02] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('h-2 w-2 shrink-0 rounded-full', style.dot)} />
                <div className="min-w-0">
                  <p className={cn('text-sm font-black', style.color)}>{profile.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{profile.description}</p>
                  {shiftLabels && (
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">{shiftLabels}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Context confirmation banner ──────────────────────────────────────────────
export function BriefingContextBanner({ context, counts, onReset }) {
  const style   = DEPT_STYLE[context.department] || DEPT_STYLE.all;
  const win     = SHIFT_WINDOWS[context.shiftType];
  const hasData = counts && Object.values(counts).some(v => v > 0);

  return (
    <div
      className={cn('overflow-hidden rounded-2xl border transition-colors', style.border)}
      style={{ background: CARD_BG, boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 px-4 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <div className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
            <p className={cn('text-xs font-black uppercase tracking-widest', style.color)}>
              {context.profileName} Briefing
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Today · {win?.hours || context.shiftLabel}
            {context.ownerName && <> · {context.ownerName}</>}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-border/40 px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors"
        >
          <RefreshCw className="h-2.5 w-2.5" /> Change
        </button>
      </div>

      {/* Import summary */}
      {hasData && (
        <div className="border-t border-border/15 px-4 py-2.5">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/60 mb-2">Importing</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {counts.staff         > 0 && <Pill icon={Users}         label={`${counts.staff} staff`} />}
            {counts.reservations  > 0 && <Pill icon={BookOpen}      label={`${counts.reservations} reservation${counts.reservations !== 1 ? 's' : ''}`} />}
            {counts.events        > 0 && <Pill icon={Calendar}      label={`${counts.events} event${counts.events !== 1 ? 's' : ''}`} />}
            {counts.prepNeeds     > 0 && <Pill icon={ChefHat}       label={`${counts.prepNeeds} prep item${counts.prepNeeds !== 1 ? 's' : ''}`} />}
            {counts.eightySix     > 0 && <Pill icon={Flame}         label={`${counts.eightySix} 86'd`} />}
            {counts.issues        > 0 && <Pill icon={AlertTriangle} label={`${counts.issues} open issue${counts.issues !== 1 ? 's' : ''}`} />}
            {counts.tasks         > 0 && <Pill icon={ClipboardList} label={`${counts.tasks} task${counts.tasks !== 1 ? 's' : ''}`} />}
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-2.5 w-2.5 text-muted-foreground/50" />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
