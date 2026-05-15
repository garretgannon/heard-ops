import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ModulesTab({ modules, onRefresh, onNewModule, onEditModule }) {
  const handleDelete = async (id) => {
    if (!confirm('Delete this training module?')) return;
    try {
      await base44.entities.TrainingModule.delete(id);
      toast.success('Module deleted');
      onRefresh();
    } catch (err) {
      toast.error('Failed to delete module');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center lg:hidden">
        <h2 className="text-base font-bold">Training Modules</h2>
        <button
          onClick={() => onNewModule?.()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg btn-primary text-sm"
        >
          <Plus className="h-4 w-4" /> New Module
        </button>
      </div>

      {modules.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No training modules created yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {modules.map(mod => (
            <div key={mod.id} className="p-4 rounded-xl border border-border/30 space-y-3" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{mod.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-semibold">
                      {mod.moduleType}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-[10px] font-semibold">
                      {mod.category}
                    </span>
                    {mod.estimatedMinutes && (
                      <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-[10px]">
                        {mod.estimatedMinutes} min
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onEditModule?.(mod)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-semibold transition-all"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(mod.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-semibold transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}