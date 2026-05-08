import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const APPROVAL_TYPES = {
  prep: { label: 'Prep Review', icon: '🔪', color: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  temperature: { label: 'Temp Alert', icon: '🌡️', color: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  maintenance: { label: 'Maintenance', icon: '🔧', color: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  employee: { label: 'Employee Log', icon: '👤', color: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  waste: { label: 'Waste/86', icon: '⚠️', color: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  schedule: { label: 'Schedule', icon: '📅', color: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400' },
  timeoff: { label: 'Request Off', icon: '🏖️', color: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  trade: { label: 'Shift Trade', icon: '🔄', color: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
  beo: { label: 'BEO Prep', icon: '🎉', color: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  recipe: { label: 'Recipe', icon: '📖', color: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  vendor: { label: 'Vendor', icon: '💰', color: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
};

export default function ApprovalCard({ approval, onApprove, onDeny, onViewDetails }) {
  const cardRef = useRef(null);
  const [drag, setDrag] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const type = APPROVAL_TYPES[approval.approval_type] || APPROVAL_TYPES.prep;
  const submittedAt = approval.created_date ? format(parseISO(approval.created_date), 'h:mm a') : 'N/A';
  const submittedBy = approval.created_by || 'Unknown';

  const handleDragEnd = (_, info) => {
    const swipeThreshold = 50;
    const velocity = info.velocity.x;
    const distance = info.offset.x;

    if (distance > swipeThreshold || velocity > 500) {
      onApprove?.();
    } else if (distance < -swipeThreshold || velocity < -500) {
      onDeny?.();
    }
    setDrag(0);
    setIsDragging(false);
  };

  const getTitle = () => {
    switch (approval.approval_type) {
      case 'prep': return `${approval.name || 'Prep Item'} review`;
      case 'temperature': return `Temperature alert: ${approval.location || 'Unknown'}`;
      case 'maintenance': return approval.title || 'Maintenance request';
      case 'timeoff': return `${approval.employee_name || 'Employee'} - time off request`;
      case 'schedule': return 'Schedule change request';
      default: return 'Review required';
    }
  };

  const getSummary = () => {
    switch (approval.approval_type) {
      case 'prep': return `${approval.quantity || 'N/A'} ${approval.unit || ''} prepped · Status: ${approval.completion_status || 'pending'}`;
      case 'temperature': return `${approval.temperature || '—'}°F · Location: ${approval.location || 'N/A'}`;
      case 'maintenance': return approval.description || 'No details provided';
      case 'timeoff': return `${approval.start_date || 'N/A'} to ${approval.end_date || 'N/A'} · Reason: ${approval.reason || 'Not specified'}`;
      default: return 'Awaiting review';
    }
  };

  const photoUrl = approval.photo_url || (approval.approval_type === 'prep' && approval.completion_notes ? null : null);

  return (
    <motion.div
      ref={cardRef}
      drag="x"
      dragElastic={0.2}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDrag={(_, info) => setDrag(info.offset.x)}
      onDragEnd={handleDragEnd}
      style={{ x: drag }}
      className="relative"
    >
      {/* Background reveal (left/right) */}
      <div className={cn(
        'absolute inset-0 rounded-2xl flex items-center',
        drag > 0 ? 'bg-green-500/20 justify-start pl-6' : 'bg-red-500/20 justify-end pr-6'
      )}>
        {drag > 0 ? (
          <Check className="h-8 w-8 text-green-400" />
        ) : (
          <X className="h-8 w-8 text-red-400" />
        )}
      </div>

      {/* Card */}
      <div className={cn(
        'relative bg-card border border-border rounded-2xl p-6 shadow-lg overflow-hidden',
        isDragging && 'cursor-grabbing'
      )}>
        {/* Top section: badges & metadata */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn('px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5', type.color, type.border)}>
                <span className="text-sm">{type.icon}</span>
                <span className={cn('text-xs font-bold', type.text)}>{type.label}</span>
              </div>
              {approval.priority === 'high' && (
                <div className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-xs font-bold text-red-400">Urgent</span>
                </div>
              )}
            </div>
            <button onClick={onViewDetails}
              className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{submittedAt}</span>
            <span>by {submittedBy}</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-foreground mb-2 leading-tight">{getTitle()}</h2>

        {/* Summary */}
        <p className="text-sm text-secondary-text mb-4">{getSummary()}</p>

        {/* Photo preview */}
        {photoUrl && (
          <div className="mb-4 rounded-xl overflow-hidden bg-black/20 border border-border/30">
            <img src={photoUrl} alt="Submission" className="w-full h-48 object-cover" />
          </div>
        )}

        {/* Bottom: swipe hint & buttons */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            Swipe right to approve · Swipe left to deny
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={onDeny}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all active:scale-95">
              <X className="h-4 w-4" /> Deny
            </button>
            <button onClick={onApprove}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-sm hover:bg-green-500/20 transition-all active:scale-95">
              <Check className="h-4 w-4" /> Approve
            </button>
          </div>
        </div>

        {/* Swipe indicator */}
        <div className={cn(
          'absolute right-6 top-1/2 -translate-y-1/2 opacity-0 transition-opacity',
          drag > 20 && 'opacity-100'
        )}>
          <ChevronRight className="h-6 w-6 text-green-400 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}