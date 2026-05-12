import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function PrepInventoryCounter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useCurrentUser();
  
  const [shift, setShift] = useState(state?.shift || 'opening');
  const [station, setStation] = useState(state?.station || '');
  const [templates, setTemplates] = useState([]);
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [today] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadTemplates();
    if (id) loadExistingCount();
  }, [id, shift, station]);

  const loadTemplates = async () => {
    try {
      const active = await base44.entities.PrepPlanTemplate?.filter?.({ is_active: true, shift }).catch(() => []);
      const filtered = active?.filter(t => !station || t.station === station) || [];
      setTemplates(filtered);
      // Initialize counts
      setCounts(filtered.map(t => ({ template_id: t.id, item_name: t.item_name, on_hand_quantity: '', unit: t.unit, notes: '' })));
    } catch (e) {
      toast.error('Failed to load templates');
    }
    setLoading(false);
  };

  const loadExistingCount = async () => {
    try {
      const count = await base44.entities.PrepInventoryCount?.get?.(id);
      if (count) {
        setShift(count.shift);
        setStation(count.station);
        setCounts(count.items || []);
        setSessionNotes(count.notes || '');
      }
    } catch (e) {
      console.error('Error loading count:', e);
    }
  };

  const updateCount = (idx, field, value) => {
    setCounts(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!station) {
      toast.error('Please select a station');
      return;
    }
    if (counts.some(c => c.on_hand_quantity === '' || c.on_hand_quantity === null)) {
      toast.error('Please count all items');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: today,
        shift,
        station,
        counted_by: user?.email || 'unknown',
        status: 'submitted',
        items: counts,
        notes: sessionNotes,
      };

      let countId;
      if (id) {
        await base44.entities.PrepInventoryCount?.update?.(id, payload);
        countId = id;
      } else {
        const created = await base44.entities.PrepInventoryCount?.create?.(payload);
        countId = created.id;
      }

      toast.success('Count submitted. Generating prep plan…');
      
      // Trigger prep plan generation
      try {
        await base44.functions.invoke('generatePrepPlan', {
          inventory_count_id: countId,
          date: today,
          shift,
          station,
        });
      } catch (e) {
        console.warn('Prep plan generation queued or deferred:', e.message);
      }

      navigate(`/prep-count/${countId}`);
    } catch (e) {
      toast.error('Failed to submit count: ' + e.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading templates…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/prep-planning')} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Prep Inventory Count</h1>
          <p className="text-xs text-muted-foreground">{format(parseISO(today), 'MMM d, yyyy')} • {shift} shift</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        {/* Station Select */}
        {!station && (
          <div className="card-glass border border-border rounded-lg p-4 mb-4">
            <label className="block text-xs font-bold text-foreground mb-2">Select Station</label>
            <select
              value={station}
              onChange={e => { setStation(e.target.value); setCounts([]); }}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            >
              <option value="">Choose station…</option>
              {['Grill', 'Pantry', 'Prep', 'Bakery', 'Bar', 'Expo'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {/* Count Items */}
        {station && templates.length > 0 ? (
          <div className="space-y-2">
            {counts.map((count, idx) => {
              const template = templates.find(t => t.id === count.template_id);
              return (
                <div key={idx} className="card-glass border border-border rounded-lg p-3">
                  <div className="mb-2">
                    <p className="font-semibold text-sm text-foreground">{count.item_name}</p>
                    <p className="text-xs text-muted-foreground">Par: {template?.default_par} {count.unit}</p>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-muted-foreground block mb-1">On-Hand Count</label>
                      <input
                        type="number"
                        value={count.on_hand_quantity}
                        onChange={e => updateCount(idx, 'on_hand_quantity', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-2 py-2 bg-background border border-border rounded text-sm text-foreground font-bold"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground font-bold px-2">{count.unit}</span>
                  </div>
                  <input
                    type="text"
                    value={count.notes}
                    onChange={e => updateCount(idx, 'notes', e.target.value)}
                    placeholder="Optional notes…"
                    className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground mt-2"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          station && <p className="text-center py-8 text-muted-foreground text-sm">No templates for this station/shift combination</p>
        )}

        {/* Session Notes */}
        {station && (
          <div className="card-glass border border-border rounded-lg p-3">
            <label className="text-[10px] font-bold text-muted-foreground block mb-1">Session Notes</label>
            <textarea
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              placeholder="Any issues or notes…"
              rows={2}
              className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground resize-none"
            />
          </div>
        )}
      </div>

      {/* Action Bar */}
      {station && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex gap-2">
          <button
            onClick={() => navigate('/prep-planning')}
            className="flex-1 btn-secondary text-xs h-10 flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 btn-primary text-xs h-10 flex items-center justify-center gap-1"
          >
            <Check className="h-3.5 w-3.5" /> {submitting ? 'Submitting…' : 'Submit Count'}
          </button>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;