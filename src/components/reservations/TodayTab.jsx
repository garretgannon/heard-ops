import { Star, AlertTriangle, Clock, Users, Calendar, Link } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const TIME_GROUPS = [
  { label: 'Morning', start: 0, end: 11 },
  { label: 'Lunch', start: 11, end: 14 },
  { label: 'Afternoon', start: 14, end: 17 },
  { label: 'Dinner', start: 17, end: 22 },
  { label: 'Late Night', start: 22, end: 24 },
];

function timeHour(t) {
  if (!t) return 12;
  const [h] = t.split(':').map(Number);
  return h;
}

const STATUS_COLOR = {
  booked: 'bg-blue-500/15 text-blue-400',
  confirmed: 'bg-green-500/15 text-green-400',
  seated: 'bg-primary/15 text-primary',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-500/15 text-red-400',
  'no-show': 'bg-red-500/15 text-red-400',
  inquiry: 'bg-muted text-muted-foreground',
  tentative: 'bg-amber-500/15 text-amber-400',
  'in-production': 'bg-blue-500/15 text-blue-400',
  ready: 'bg-green-500/15 text-green-400',
};

function TimelineCard({ item, isAdmin, onSelectBEO, onEditReservation }) {
  const isBEO = item._type === 'beo';
  const isLargeParty = !isBEO && (item.partySize || 0) >= 8;
  const status = item.status || (isBEO ? 'tentative' : 'booked');
  const size = isBEO ? item.guestCount : item.partySize;
  const name = isBEO ? item.eventName : item.name;
  const time = isBEO ? item.startTime : item.time;
  const area = item.area || item.room;
  const typeLabel = isBEO
    ? (item.eventType || 'Event').replace(/-/g, ' ')
    : isLargeParty ? 'Large Party' : 'Reservation';

  return (
    <button
      onClick={() => {
        if (isBEO && onSelectBEO) onSelectBEO(item);
        else if (!isBEO && onEditReservation) onEditReservation(item);
      }}
      className={`w-full text-left bg-card border rounded-xl p-3 active:scale-[0.98] transition-all ${isBEO ? 'border-blue-500/30' : isLargeParty ? 'border-amber-500/30' : 'border-border'}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex flex-col items-center shrink-0 w-10">
          <span className="text-xs font-extrabold text-foreground">{time || '--'}</span>
          {isBEO && item.endTime && <span className="text-[9px] text-muted-foreground">{item.endTime}</span>}
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
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${STATUS_COLOR[status] || 'bg-muted text-muted-foreground'}`}>
              {status.replace(/-/g, ' ')}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${isBEO ? 'bg-blue-500/15 text-blue-400' : isLargeParty ? 'bg-amber-500/15 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
              {typeLabel}
            </span>
            {isBEO && item.serviceStyle && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                {item.serviceStyle.replace(/-/g, ' ')}
              </span>
            )}
            {!isBEO && item.linkedBEOId && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 flex items-center gap-0.5">
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

export default function TodayTab({ reservations, beos, isAdmin, onSelectBEO, onEditReservation }) {
  const todayStr = today();
  const todayItems = [
    ...reservations.filter(r => r.date === todayStr && r.status !== 'cancelled').map(r => ({ ...r, _type: 'reservation' })),
    ...beos.filter(b => b.eventDate === todayStr && b.status !== 'cancelled').map(b => ({ ...b, _type: 'beo' })),
  ].sort((a, b) => {
    const aTime = (a._type === 'beo' ? a.startTime : a.time) || '00:00';
    const bTime = (b._type === 'beo' ? b.startTime : b.time) || '00:00';
    return aTime.localeCompare(bTime);
  });

  if (todayItems.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-xl">
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">No reservations or events today</p>
      </div>
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
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{group.label}</p>
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