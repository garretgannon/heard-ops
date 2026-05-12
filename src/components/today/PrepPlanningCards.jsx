import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ClipboardList, Plus } from 'lucide-react';

export default function PrepPlanningCards() {
  const navigate = useNavigate();
  const [inventoryCount, setInventoryCount] = useState(null);
  const [prepPlan, setPrepPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const counts = await base44.entities.PrepInventoryCount?.filter?.({ date: today }, '-updated_date', 1).catch(() => []);
        const plans = await base44.entities.PrepPlan?.filter?.({ date: today }, '-updated_date', 1).catch(() => []);
        
        if (counts?.length > 0) setInventoryCount(counts[0]);
        if (plans?.length > 0) setPrepPlan(plans[0]);
      } catch (e) {
        console.error('Failed to load prep data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase text-muted-foreground px-1">Prep Planning</h3>
      
      {/* Inventory Count Card */}
      <button
        onClick={() => navigate(inventoryCount ? `/prep-count/${inventoryCount.id}` : '/prep-count')}
        className="w-full card-glass border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-colors active:scale-95"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Inventory Count</p>
          </div>
          {inventoryCount && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              inventoryCount.status === 'approved' ? 'bg-green-500/20 text-green-400' :
              inventoryCount.status === 'submitted' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {inventoryCount.status}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {inventoryCount ? `${inventoryCount.station} • ${inventoryCount.items?.length || 0} items` : 'Start a new count'}
        </p>
      </button>

      {/* Prep Plan Card */}
      <button
        onClick={() => navigate(prepPlan ? `/prep-plan/${prepPlan.id}` : '/prep-planning')}
        className="w-full card-glass border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-colors active:scale-95"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Prep Plan</p>
          </div>
          {prepPlan && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              prepPlan.status === 'approved' ? 'bg-green-500/20 text-green-400' :
              prepPlan.status === 'tasks_generated' ? 'bg-blue-500/20 text-blue-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              {prepPlan.status}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {prepPlan ? `${prepPlan.station} • ${prepPlan.items?.length || 0} items` : 'Generate prep plan'}
        </p>
      </button>
    </div>
  );
}