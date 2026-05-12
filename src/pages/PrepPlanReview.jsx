import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Check, X, Edit2 } from 'lucide-react';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function PrepPlanReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);

  useEffect(() => {
    loadPlan();
  }, [id]);

  const loadPlan = async () => {
    try {
      const data = await base44.entities.PrepPlan?.get?.(id);
      if (data) setPlan(data);
    } catch (e) {
      toast.error('Failed to load prep plan');
    }
    setLoading(false);
  };

  const updateItemQuantity = (idx, quantity) => {
    setPlan(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, final_prep_quantity: quantity } : item),
    }));
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await base44.entities.PrepPlan?.update?.(id, {
        status: 'approved',
        items: plan.items,
      });
      toast.success('Prep plan approved!');
      
      // Trigger task generation
      try {
        await base44.functions.invoke('generatePrepTasksFromPlan', {
          prep_plan_id: id,
        });
      } catch (e) {
        console.warn('Task generation queued:', e.message);
      }

      navigate('/prep-planning');
    } catch (e) {
      toast.error('Failed to approve: ' + e.message);
    }
    setApproving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading prep plan…</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground font-bold">Prep plan not found</p>
          <button onClick={() => navigate('/prep-planning')} className="text-primary text-sm mt-2 hover:underline">Back to Prep Planning</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DesktopPageHeader title="Review Prep Plan" subtitle="Review and approve prep plan details" />
      {/* Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/prep-planning')} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Review Prep Plan</h1>
          <p className="text-xs text-muted-foreground">{format(parseISO(plan.date), 'MMM d')} • {plan.shift} • {plan.station}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-3xl mx-auto space-y-3">
        {plan.items && plan.items.length > 0 ? (
          plan.items.map((item, idx) => (
            <div key={idx} className="card-glass border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold text-foreground text-sm">{item.item_name}</p>
                  <p className="text-xs text-muted-foreground">Linked recipe: {item.linked_recipe_id || 'None'}</p>
                </div>
                {item.approved && <Check className="h-5 w-5 text-green-500" />}
              </div>

              {/* Calculation Breakdown */}
              <div className="bg-background rounded p-2 mb-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Par:</span>
                  <span className="font-bold">{item.par_quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">On-hand:</span>
                  <span className="font-bold">- {item.on_hand_quantity} {item.unit}</span>
                </div>
                {item.beo_addon_quantity > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span className="text-muted-foreground">BEO/Event:</span>
                    <span className="font-bold">+ {item.beo_addon_quantity} {item.unit}</span>
                  </div>
                )}
                {item.manager_adjustment_quantity > 0 && (
                  <div className="flex justify-between text-blue-400">
                    <span className="text-muted-foreground">Manager adjustment:</span>
                    <span className="font-bold">+ {item.manager_adjustment_quantity} {item.unit}</span>
                  </div>
                )}
                <div className="border-t border-border/50 pt-1 mt-1 flex justify-between font-bold text-foreground">
                  <span>Recommended:</span>
                  <span>{item.recommended_prep} {item.unit}</span>
                </div>
              </div>

              {/* Final Quantity Edit */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">Final Prep Qty</label>
                  {editingIdx === idx ? (
                    <input
                      type="number"
                      value={item.final_prep_quantity}
                      onChange={e => updateItemQuantity(idx, parseFloat(e.target.value))}
                      onBlur={() => setEditingIdx(null)}
                      autoFocus
                      className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm font-bold text-foreground"
                    />
                  ) : (
                    <div className="flex gap-1 items-center">
                      <span className="text-lg font-bold text-foreground">{item.final_prep_quantity}</span>
                      <span className="text-sm text-muted-foreground">{item.unit}</span>
                      <button
                        onClick={() => setEditingIdx(idx)}
                        className="ml-auto h-7 px-2 rounded border border-border text-xs text-muted-foreground hover:bg-muted flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Staff Assignment */}
              <div className="mt-2 text-[10px] text-muted-foreground">
                Assign: {item.assigned_role || 'Any'} {item.assigned_employee ? `(${item.assigned_employee})` : ''}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-10 text-muted-foreground">No items in plan</p>
        )}

        {/* Notes */}
        {plan.notes && (
          <div className="card-glass border border-border rounded-lg p-3">
            <p className="text-xs font-bold text-muted-foreground mb-1">Notes</p>
            <p className="text-sm text-foreground">{plan.notes}</p>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex gap-2">
        <button
          onClick={() => navigate('/prep-planning')}
          className="flex-1 btn-secondary text-xs h-10 flex items-center justify-center gap-1"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          onClick={handleApprove}
          disabled={approving}
          className="flex-1 btn-primary text-xs h-10 flex items-center justify-center gap-1"
        >
          <Check className="h-3.5 w-3.5" /> {approving ? 'Approving…' : 'Approve & Generate Tasks'}
        </button>
      </div>
    </div>
  );
}

export const hideBase44Index = true;