import {
  Star, AlertTriangle, Users, Link, Calendar, CalendarPlus, CalendarDays, Upload, ChefHat, ClipboardList, CheckSquare, BarChart2, Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const today = () => new Date().toISOString().split('T')[0];

const CARD_BG = 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)';

const TIME_GROUPS = [
  { label: 'Morning',    start: 0,  end: 11 },
  { label: 'Lunch',      start: 11, end: 14 },
  { label: 'Afternoon',  start: 14, end: 17 },
  { label: 'Dinner',     start: 17, end: 22 },
  { label: 'Late Night', start: 22, end: 24 },
];

function timeHour(t) {
  if (!t) return 12;
  const [h] = t.split(':').map(Number);
  return h;
}

const STATUS_COLOR = {
  booked:          'bg-blue-500/15 text-blue-400',
  confirmed:       'bg-green-500/15 text-green-400',
  seated:          'bg-primary/15 text-primary',
  completed:       'bg-muted text-muted-foreground',
  cancelled:       'bg-red-500/15 text-red-400',
  'no-show':       'bg-red-500/15 text-red-400',
  inquiry:         'bg-muted text-muted-foreground',
  tentative:       'bg-amber-500/15 text-amber-400',
  'in-production': 'bg-blue-500/15 text-blue-400',
  ready:           'bg-green-500/15 text-green-400',
};

// ─── Connections ──────────────────────────────────────────────────────────────
const CONNECTIONS = [
  { icon: ClipboardList, label: 'Pre-Shift Briefing', desc: 'Auto-populates talking points and event notes' },
  { icon: ChefHat,       label: 'Prep Planning',      desc: 'Adjusts prep recipes and par levels' },
  { icon: Users,         label: 'Staffing & Schedule', desc: 'Helps plan the right coverage' },
  { icon: CheckSquare,   label: 'Tasks & Setup',       desc: 'Creates setup, service, and breakdown tasks' },
  { icon: AlertTriangle, label: '86s & Allergies',     desc: 'Flags items and alerts your team' },
  { icon: BarChart2,     label: 'Reporting',           desc: 'Tracks sales impact and event history' },
];

// ─── Upcoming snapshot strip ──────────────────────────────────────────────────
function UpcomingSnapshot({ reservations, beos, onViewCalendar }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border/40"
      style={{ background: CARD_BG, boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Upcoming Events Snapshot
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">Quick look at what's coming up next.</p>
        </div>
        <button
          onClick={() => { onViewCalendar(); haptics.light(); }}
          className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
        >
          View Calendar <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            const dateStr = d.toISOString().split('T')[0];
            const dayRes  = reservations.filter(r => r.date === dateStr && r.status !== 'cancelled');
            const dayBEOs = beos.filter(b => b.eventDate === dateStr && b.status !== 'cancelled');
            const count   = dayRes.length + dayBEOs.length;
            const isToday = i === 0;
            const hasBEO  = dayBEOs.length > 0;
            const hasLargeParty = dayRes.some(r => (r.partySize || 0) >= 8);
            const dayName = isToday
              ? 'Today'
              : d.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <div
                key={dateStr}
                className={cn(
                  'rounded-xl p-2 text-center',
                  isToday
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-white/[0.03] border border-border/20',
                )}
              >
                <p className={cn('text-[9px] font-black', isToday ? 'text-primary' : 'text-muted-foreground')}>
                  {dayName}
                </p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">{monthDay}</p>
                <div className="flex justify-center items-center gap-0.5 my-1 h-2">
                  {hasBEO       && <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                  {hasLargeParty && <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                </div>
                <p className="text-[9px] text-muted-foreground/70">
                  {count > 0 ? `${count} event${count !== 1 ? 's' : ''}` : '0 events'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-start gap-2">
          <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/40" />
          <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
            Tip: Large parties (6+ guests) and BEOs may require additional prep and staffing. Add events early to stay ahead.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyToday({ reservations, beos, onAddReservation, onAddBEO, onImport, onViewCalendar }) {
  return (
    <div className="space-y-3">
      {/* Main CTA card */}
      <div
        className="overflow-hidden rounded-2xl border border-border/40"
        style={{ background: CARD_BG, boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}
      >
        {/* Hero — stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-6 lg:gap-12 px-6 py-8 lg:py-10">

          {/* Left — decorative icon */}
          <div className="relative shrink-0 self-center">
            <div className="h-28 w-28 lg:h-36 lg:w-36 rounded-full bg-white/[0.04] border border-border/25 flex items-center justify-center">
              <Calendar className="h-11 w-11 lg:h-14 lg:w-14 text-muted-foreground/35" />
            </div>
            {/* Sparkle decorations */}
            <span className="absolute -top-5 right-3 text-2xl leading-none select-none" style={{ color: 'rgba(230,106,31,0.55)' }}>✦</span>
            <span className="absolute -top-1 -left-5 text-base leading-none select-none" style={{ color: 'rgba(230,106,31,0.25)' }}>+</span>
            <span className="absolute top-3 -left-7 text-xs leading-none select-none text-muted-foreground/20">◇</span>
            <span className="absolute -bottom-4 left-1 text-base leading-none select-none" style={{ color: 'rgba(230,106,31,0.3)' }}>+</span>
            <span className="absolute bottom-2 -right-5 text-xs leading-none select-none text-muted-foreground/20">◇</span>
          </div>

          {/* Right — content */}
          <div className="flex-1 min-w-0 text-center lg:text-left">
            <h3 className="text-xl lg:text-2xl font-black text-foreground mb-2 leading-tight">
              No reservations or events today.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto lg:mx-0">
              Add or import reservations and BEOs so heardOS can calculate prep impact, service impact, staffing needs, and pre-shift talking points.
            </p>

            <div className="grid grid-cols-2 gap-2 w-full max-w-sm mx-auto lg:mx-0">
              <button
                onClick={() => { onAddReservation(); haptics.medium(); }}
                className="btn-primary flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3"
              >
                <div className="flex items-center gap-1.5">
                  <CalendarPlus className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">Add Reservation</span>
                </div>
                <span className="text-[10px] opacity-70 font-normal">Create a new reservation</span>
              </button>

              <button
                onClick={() => { onAddBEO(); haptics.medium(); }}
                className="flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3 rounded-xl bg-white/[0.05] border border-border/40 text-foreground hover:bg-white/[0.07] transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold">Add BEO / Event</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-normal">Create a private event</span>
              </button>

              <button
                onClick={() => { onImport(); haptics.medium(); }}
                className="flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3 rounded-xl bg-white/[0.05] border border-border/40 text-foreground hover:bg-white/[0.07] transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold">Import Events</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-normal">CSV, PDF, or other files</span>
              </button>

              <button
                onClick={() => { onViewCalendar(); haptics.medium(); }}
                className="flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3 rounded-xl bg-white/[0.05] border border-border/40 text-foreground hover:bg-white/[0.07] transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold">View Calendar</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-normal">See upcoming days</span>
              </button>
            </div>
          </div>
        </div>

        {/* Why This Matters — 6 columns on desktop */}
        <div className="border-t border-border/20 px-6 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/60 mb-3">
            Why This Matters
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
            {CONNECTIONS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/70" />
                <div>
                  <p className="text-[11px] font-bold text-foreground leading-tight">{label}</p>
                  <p className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming snapshot */}
      <UpcomingSnapshot
        reservations={reservations}
        beos={beos}
        onViewCalendar={onViewCalendar}
      />
    </div>
  );
}

// ─── Timeline card (existing events) ─────────────────────────────────────────
function TimelineCard({ item, isAdmin, onSelectBEO, onEditReservation }) {
  const isBEO        = item._type === 'beo';
  const isLargeParty = !isBEO && (item.partySize || 0) >= 8;
  const status       = item.status || (isBEO ? 'tentative' : 'booked');
  const size         = isBEO ? item.guestCount : item.partySize;
  const name         = isBEO ? item.eventName  : item.name;
  const time         = isBEO ? item.startTime  : item.time;
  const area         = item.area || item.room;
  const typeLabel    = isBEO
    ? (item.eventType || 'Event').replace(/-/g, ' ')
    : isLargeParty ? 'Large Party' : 'Reservation';

  return (
    <button
      onClick={() => {
        if (isBEO && onSelectBEO)             onSelectBEO(item);
        else if (!isBEO && onEditReservation) onEditReservation(item);
      }}
      className={cn(
        'w-full text-left bg-card border rounded-xl p-3 active:scale-[0.98] transition-all',
        isBEO         ? 'border-blue-500/30'
        : isLargeParty ? 'border-amber-500/30'
        :                'border-border',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex flex-col items-center shrink-0 w-10">
          <span className="text-xs font-extrabold text-foreground">{time || '--'}</span>
          {isBEO && item.endTime && (
            <span className="text-[9px] text-muted-foreground">{item.endTime}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-foreground truncate">{name}</span>
            {item.isVIP && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
            {(item.hasDietaryRestrictions || item.dietaryNotes) && (
              <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Users className="h-2.5 w-2.5" />{size || '?'}
            </span>
            {area && <span className="text-[10px] text-muted-foreground">· {area}</span>}
            <span className={cn(
              'text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize',
              STATUS_COLOR[status] || 'bg-muted text-muted-foreground',
            )}>
              {status.replace(/-/g, ' ')}
            </span>
            <span className={cn(
              'text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize',
              isBEO          ? 'bg-blue-500/15 text-blue-400'
              : isLargeParty  ? 'bg-amber-500/15 text-amber-400'
              :                 'bg-muted text-muted-foreground',
            )}>
              {typeLabel}
            </span>
            {isBEO && item.serviceStyle && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                {item.serviceStyle.replace(/-/g, ' ')}
              </span>
            )}
            {!isBEO && item.linkedBEOId && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-400 flex items-center gap-0.5">
                <Link className="h-2 w-2" /> BEO
              </span>
            )}
            {isBEO && item.prepNotes && isAdmin && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400">Prep</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function TodayTab({
  reservations,
  beos,
  isAdmin,
  onSelectBEO,
  onEditReservation,
  onAddReservation,
  onAddBEO,
  onImport,
  onViewCalendar,
}) {
  const todayStr = today();
  const todayItems = [
    ...reservations
      .filter(r => r.date === todayStr && r.status !== 'cancelled')
      .map(r => ({ ...r, _type: 'reservation' })),
    ...beos
      .filter(b => b.eventDate === todayStr && b.status !== 'cancelled')
      .map(b => ({ ...b, _type: 'beo' })),
  ].sort((a, b) => {
    const aTime = (a._type === 'beo' ? a.startTime : a.time) || '00:00';
    const bTime = (b._type === 'beo' ? b.startTime : b.time) || '00:00';
    return aTime.localeCompare(bTime);
  });

  if (todayItems.length === 0) {
    return (
      <EmptyToday
        reservations={reservations}
        beos={beos}
        onAddReservation={onAddReservation}
        onAddBEO={onAddBEO}
        onImport={onImport}
        onViewCalendar={onViewCalendar}
      />
    );
  }

  return (
    <div className="space-y-3">
      {TIME_GROUPS.map(group => {
        const items = todayItems.filter(i => {
          const h = timeHour(i._type === 'beo' ? i.startTime : i.time);
          return h >= group.start && h < group.end;
        });
        if (items.length === 0) return null;
        return (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              {group.label}
            </p>
            <div className="space-y-2">
              {items.map(item => (
                <TimelineCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  onSelectBEO={onSelectBEO}
                  onEditReservation={onEditReservation}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
