import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Camera, AlertCircle } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function PrepTaskCard({ task, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [showPhotoError, setShowPhotoError] = useState(false);

  const isCompleted = ['completed', 'approved'].includes(task.status);
  const isPendingReview = task.status === 'pending_review';

  const handleMarkComplete = async () => {
    if (task.requiresPhoto && !task.photoUrl) {
      haptics.notification('error');
      setShowPhotoError(true);
      setTimeout(() => setShowPhotoError(false), 3000);
      return;
    }

    setLoading(true);
    try {
      await base44.entities.DailyPrepTask.update(task.id, {
        status: task.requiresManagerReview ? 'pending_review' : 'completed',
        completedAt: new Date().toISOString(),
        completedBy: (await base44.auth.me()).email
      });
      haptics.success();
      onStatusChange?.();
    } catch (error) {
      console.error('Failed to update task:', error);
      haptics.notification('error');
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await base44.entities.DailyPrepTask.update(task.id, {
        status: 'approved',
        managerReviewedAt: new Date().toISOString(),
        managerReviewedBy: (await base44.auth.me()).email
      });
      haptics.success();
      onStatusChange?.();
    } catch (error) {
      console.error('Failed to approve task:', error);
      haptics.notification('error');
    }
    setLoading(false);
  };

  return (
    <div className={`bg-card border-l-4 border border-border rounded-lg p-3 space-y-2 ${
      isCompleted ? 'border-l-green-500 opacity-70' : 'border-l-amber-500'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{task.itemName}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-secondary-text">
            {task.quantity && <span>{task.quantity} {task.unit}</span>}
            {task.dueTime && <span>• Due: {task.dueTime}</span>}
          </div>
          {task.instructions && (
            <p className="text-[10px] text-muted-foreground mt-1 italic">{task.instructions}</p>
          )}
        </div>
        <div className={`text-[9px] font-bold px-1.5 py-1 rounded-md ${
          isCompleted ? 'bg-green-500/20 text-green-300' :
          isPendingReview ? 'bg-blue-500/20 text-blue-300' :
          'bg-gray-500/20 text-gray-300'
        }`}>
          {isCompleted ? 'Done' : isPendingReview ? 'Review' : 'Pending'}
        </div>
      </div>

      {task.requiresPhoto && !task.photoUrl && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 flex items-center gap-2">
          <Camera className="h-3 w-3 text-amber-400 shrink-0" />
          <p className="text-[10px] text-amber-300 font-semibold">Photo required</p>
        </div>
      )}

      {showPhotoError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center gap-2">
          <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
          <p className="text-[10px] text-red-300 font-semibold">Add a photo to complete</p>
        </div>
      )}

      {!isCompleted && (
        <button
          onClick={handleMarkComplete}
          disabled={loading}
          className={`w-full text-xs font-bold py-2 rounded-lg transition-all ${
            task.requiresPhoto && !task.photoUrl
              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              : 'btn-primary'
          }`}
        >
          {loading ? 'Saving...' : task.requiresManagerReview ? 'Mark for Review' : 'Mark Complete'}
        </button>
      )}

      {isPendingReview && (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 btn-primary text-xs py-2"
          >
            {loading ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={() => {
              base44.entities.DailyPrepTask.update(task.id, { status: 'pending' });
              onStatusChange?.();
            }}
            className="flex-1 btn-secondary text-xs py-2"
          >
            Send Back
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-1.5 text-[10px] text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Completed by {task.completedBy || 'Unknown'}
        </div>
      )}
    </div>
  );
}