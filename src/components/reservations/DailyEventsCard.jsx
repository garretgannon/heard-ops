import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Star, AlertTriangle, ChevronRight } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

export default function DailyEventsCard() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [beos, setBeos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayStr = today();
    Promise.all([
      base44.entities.Reservation.filter({ date: todayStr }).catch(() => []),
      base44.entities.BEO.filter({ eventDate: todayStr }).catch(() => []),
    ]).then(([res, beoList]) => {
      setReservations(res.filter(r => r.status !== 'cancelled'));
      setBeos(beoList.filter(b => b.status !== 'cancelled'));
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (reservations.length === 0 && beos.length === 0) return null;

  const totalCovers = reservations.reduce((s, r) => s + (r.partySize || 0), 0)
    + beos.reduce((s, b) => s + (b.guestCount || 0), 0);
  const largeParties = reservations.filter(r => (r.partySize || 0) >= 8).length;
  const vips = reservations.filter(r => r.isVIP).length;
  const dietaryAlerts = reservations.filter(r => r.hasDietaryRestrictions).length
    + beos.filter(b => b.dietaryNotes).length;

  return (
    <button
      onClick={() => navigate('/reservations')}
      className="w-full text-left bg-card border border-blue-500/20 rounded-xl p-3 active:scale-[0.99] transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <p className="text-sm font-bold text-foreground">Daily Events</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-primary/10 rounded-lg px-2 py-1">
          <Users className="h-3 w-3 text-primary" />
          <span className="text-xs font-bold text-primary">{totalCovers} covers</span>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
          <span className="text-xs font-bold text-foreground">{reservations.length} res</span>
        </div>
        {beos.length > 0 && (
          <div className="flex items-center gap-1 bg-blue-500/10 rounded-lg px-2 py-1">
            <span className="text-xs font-bold text-blue-400">{beos.length} BEO{beos.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {largeParties > 0 && (
          <div className="flex items-center gap-1 bg-amber-500/10 rounded-lg px-2 py-1">
            <span className="text-xs font-bold text-amber-400">{largeParties} large</span>
          </div>
        )}
        {vips > 0 && (
          <div className="flex items-center gap-1 bg-yellow-500/10 rounded-lg px-2 py-1">
            <Star className="h-3 w-3 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400">{vips} VIP</span>
          </div>
        )}
        {dietaryAlerts > 0 && (
          <div className="flex items-center gap-1 bg-red-500/10 rounded-lg px-2 py-1">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <span className="text-xs font-bold text-red-400">{dietaryAlerts} diet</span>
          </div>
        )}
      </div>

      {/* Today's top events */}
      {(reservations.slice(0, 2).concat(beos.slice(0, 1))).map(item => {
        const isBEO = !!item.eventName;
        const name = isBEO ? item.eventName : item.name;
        const time = isBEO ? item.startTime : item.time;
        const size = isBEO ? item.guestCount : item.partySize;
        return (
          <div key={item.id} className="flex items-center gap-2 mt-1.5 border-t border-border/40 pt-1.5">
            <span className="text-[10px] font-bold text-muted-foreground w-10">{time || '--'}</span>
            <span className="text-xs font-semibold text-foreground flex-1 truncate">{name}</span>
            <span className="text-[10px] text-muted-foreground"><Users className="h-2.5 w-2.5 inline mr-0.5" />{size}</span>
            {item.isVIP && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
            {(item.hasDietaryRestrictions || item.dietaryNotes) && <AlertTriangle className="h-3 w-3 text-red-400" />}
          </div>
        );
      })}
    </button>
  );
}