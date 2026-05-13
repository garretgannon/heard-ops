import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AssignmentFormModal from './AssignmentFormModal';

export default function AssignmentsTab({ modules, assignments, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('Remove this assignment?')) return;
    try {
      await base44.entities.TrainingAssignment.delete(id);
      toast.success('Assignment removed');
      onRefresh();
    } catch (err) {
      toast.error('Failed to remove assignment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return 'bg-green-500/10 text-green-600';
      case 'overdue': return 'bg-red-500/10 text-red-600';
      case 'in_progress': return 'bg-blue-500/10 text-blue-600';
      default: return 'bg-amber-500/10 text-amber-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold">Assignments</h2>
        <button
          onClick={() => { setSelectedAssignment(null); setShowForm(true); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> Assign Training
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No training assignments yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {assignments.map(assign => (
            <div key={assign.id} className="p-4 rounded-xl border border-border/30 space-y-3" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{assign.moduleName}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {assign.assignedToEmployeeName || assign.assignedToRoleName || assign.assignedToStationName}
                  </p>
                  {assign.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(assign.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-semibold ${getStatusColor(assign.status)}`}>
                  {assign.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedAssignment(assign); setShowForm(true); }}
                  className="flex-1 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-semibold transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(assign.id)}
                  className="px-3 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AssignmentFormModal
          assignment={selectedAssignment}
          modules={modules}
          onClose={() => { setShowForm(false); setSelectedAssignment(null); }}
          onSuccess={() => { setShowForm(false); setSelectedAssignment(null); onRefresh(); }}
        />
      )}
    </div>
  );
}