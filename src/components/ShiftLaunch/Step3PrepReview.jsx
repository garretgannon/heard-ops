import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

export default function Step3PrepReview({ onComplete }) {
  const [prepItems, setPrepItems] = useState([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const items = await base44.entities.PrepItem.list('-updated_date', 20).catch(() => []);
        const incomplete = items.filter(i => !['completed', 'approved'].includes(i.status));
        setPrepItems(incomplete.slice(0, 10));
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
    onComplete(3, { prepReviewed: true, itemCount: prepItems.length });
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
        <h2 className="text-sm font-bold text-foreground">Prep Review</h2>
        <p className="text-xs text-secondary-text">Status of incomplete prep items</p>
      </div>

      {prepItems.length === 0 ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
          <p className="text-sm font-bold text-green-400">All prep items complete</p>
          <p className="text-xs text-secondary-text mt-1">No pending prep work</p>
        </div>
      ) : (
        <div className="space-y-2">
          {prepItems.map(item => (
            <div
              key={item.id}
              className={cn(
                'bg-card border-l-4 border border-border rounded-lg p-2.5',
                item.status === 'overdue' ? 'border-l-red-500' : 'border-l-amber-500'
              )}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', item.status === 'overdue' ? 'text-red-400' : 'text-amber-400')} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                  <p className="text-[9px] text-secondary-text mt-0.5">
                    {item.station_name && <span>{item.station_name}</span>}
                    {item.status && <span> • {item.status.toUpperCase()}</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
            I have reviewed all prep items and delegated assignments.
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