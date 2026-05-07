import { useState } from 'react';
import { AlertCircle, Camera, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { toast } from 'sonner';
import TemperatureCheckForm from '@/components/temperature/TemperatureCheckForm';

const TASK_TYPE_ICONS = {
  prep: '🧅',
  sidework: '📋',
  temperature: '🌡️',
  cleaning: '🧹',
  manager_note: '📝',
  shift_handoff: '🔄',
  beo: '🎉',
  incident: '⚠️',
};

const TASK_TYPE_COLORS = {
  prep: 'bg-green-500/15 text-green-400 border-green-500/30',
  sidework: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  temperature: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  cleaning: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  manager_note: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  shift_handoff: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  beo: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  incident: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function CurrentTaskCard({
  task,
  onStart,
  onComplete,
  onReview,
  onUnableToComplete,
  onSkip,
}) {
  const [showActions, setShowActions] = useState(false);
  const [reason, setReason] = useState('');
  const [showTempForm, setShowTempForm] = useState(false);

  if (!task) {
    return (
      <div className="bg-card border border-border/30 rounded-xl p-5 text-center space-y-3 shadow-lg">
        <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
        <div>
          <p className="font-bold text-foreground">All tasks complete!</p>
          <p className="text-sm text-muted-foreground mt-1">Great work on finishing your shift plan.</p>
        </div>
      </div>
    );
  }

  const taskTypeColor = TASK_TYPE_COLORS[task.type] || 'bg-slate-500/15 text-slate-400';
  const isStartable = task.status === 'not_started';
  const isInProgress = task.status === 'in_progress';

  const handleComplete = () => {
    haptics.medium?.();
    // Temperature tasks open the check form instead of direct completion
    if (task.type === 'temperature') {
      setShowTempForm(true);
      return;
    }
    if (task.photo_required) {
      toast.info('Photo required for completion');
      return;
    }
    if (task.manager_review_required) {
      onReview?.(task.id);
    } else {
      onComplete?.(task.id);
    }
  };

  const handleUnableClick = () => {
    setShowActions(true);
  };

  const handleSubmitUnable = () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    haptics.medium?.();
    onUnableToComplete?.(task.id, reason);
    setReason('');
    setShowActions(false);
  };

  return (
    <div className="space-y-4">
      {/* Task Card */}
      <div className="bg-card border border-border/30 rounded-xl p-5 space-y-4 shadow-lg">
        {/* Type Badge */}
        <div className={cn('inline-block px-2.5 py-1 rounded-lg border text-[10px] font-bold', taskTypeColor)}>
          {TASK_TYPE_ICONS[task.type]} {task.type.replace('_', ' ')}
        </div>

        {/* Task Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-foreground">{task.title}</h2>
          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-border/20">
          {task.station && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Station</p>
                <p className="text-sm font-semibold text-foreground">{task.station}</p>
              </div>
            </div>
          )}
          {task.due_time && (
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Due</p>
                <p className="text-sm font-semibold text-foreground">{task.due_time}</p>
              </div>
            </div>
          )}
          {task.custom_metadata?.qty_needed && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Quantity</p>
              <p className="text-sm font-semibold text-foreground">
                {task.custom_metadata.qty_completed || 0} / {task.custom_metadata.qty_needed} {task.custom_metadata.unit}
              </p>
            </div>
          )}
        </div>

        {/* Photo Required Badge */}
        {task.photo_required && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Camera className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">Photo proof required</span>
          </div>
        )}

        {/* Manager Review Badge */}
        {task.manager_review_required && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <AlertCircle className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400">Requires manager review</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {isStartable ? (
            <button
              onClick={() => onStart?.(task.id)}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:brightness-110"
            >
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Start Task
            </button>
          ) : isInProgress ? (
           <button
             onClick={handleComplete}
             className="w-full h-12 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:brightness-110"
           >
             <CheckCircle2 className="h-5 w-5" />
             {task.type === 'temperature' ? 'Log Temperature' : 'Complete Task'}
           </button>
          ) : null}

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleUnableClick}
              className="h-10 rounded-lg border border-border/30 bg-card text-foreground font-semibold text-xs hover:bg-secondary transition-all active:scale-95"
            >
              Unable to Complete
            </button>
            {!isStartable && (
              <button
                onClick={() => onSkip?.(task.id)}
                className="h-10 rounded-lg border border-border/30 bg-card text-foreground font-semibold text-xs hover:bg-secondary transition-all active:scale-95"
              >
                Skip for Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Temperature Check Form Modal */}
      {showTempForm && (
        <TemperatureCheckForm
          task={task}
          onClose={() => setShowTempForm(false)}
          onSuccess={() => {
            setShowTempForm(false);
            onComplete?.(task.id);
          }}
        />
      )}

      {/* Unable to Complete Dialog */}
      {showActions && (
        <div className="space-y-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-sm font-semibold text-foreground">Why can't you complete this?</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Equipment broken, ingredient unavailable, etc."
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            rows="2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowActions(false)}
              className="flex-1 h-9 rounded-lg border border-border bg-card text-foreground font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitUnable}
              className="flex-1 h-9 rounded-lg bg-red-600 text-white font-semibold text-xs hover:brightness-110"
            >
              Submit Issue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}