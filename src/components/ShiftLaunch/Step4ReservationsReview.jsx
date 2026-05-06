import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

export default function Step4ReservationsReview({ onComplete }) {
  const [data, setData] = useState({ reservations: [], totalCovers: 0 });
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const reservations = await base44.entities.Reservation.list('-created_date', 10).catch(() => []);
        const totalCovers = reservations.reduce((sum, r) => sum + (r.party_size || 0), 0);
        setData({ reservations: reservations.slice(0, 5), totalCovers });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleComplete = () => {
    haptics.medium?.();
    onComplete(4, { reservationsAcknowledged: true, totalCovers: data.totalCovers });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Reservations Overview</h2>
        <p className="text-xs text-secondary-text">Today's bookings and special events</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-secondary-text">Total Covers</p>
            <p className="text-lg font-bold text-foreground">{data.totalCovers}</p>
          </div>
        </div>
      </div>

      {data.reservations.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-text">Upcoming Reservations</h3>
          {data.reservations.map(res => (
            <div key={res.id} className="bg-card border border-border rounded-lg p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">{res.guest_name}</p>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/20 text-primary">{res.party_size} guests</span>
              </div>
              <p className="text-[10px] text-secondary-text">{res.time || 'TBD'}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground">No reservations booked</p>
        </div>
      )}

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-3 mt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => {
              haptics.light?.();
              setAcknowledged(e.target.checked);
            }}
            className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
          <span className="text-xs text-foreground font-semibold">
            I acknowledge today's reservations and any special requests.
          </span>
        </label>

        <button
          onClick={handleComplete}
          disabled={!acknowledged}
          className={cn(
            'w-full h-9 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all',
            acknowledged
              ? 'bg-primary text-primary-foreground active:scale-95'
              : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
          )}
        >
          <Check className="h-4 w-4" />
          Continue
        </button>
      </div>
    </div>
  );
}