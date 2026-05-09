import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SwipeCard({ approval, index, onApprove, onDeny, onExpand }) {
  const [swipe, setSwipe] = useState({ x: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);
  const SWIPE_THRESHOLD = 100;

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    if (info.offset.x > SWIPE_THRESHOLD) {
      onApprove?.();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onDeny?.();
    } else {
      setSwipe({ x: 0 });
    }
  };

  const swipePercentage = Math.abs(swipe.x) / SWIPE_THRESHOLD;
  const isSwipingRight = swipe.x > 0;

  return (
    <motion.div
      ref={constraintsRef}
      drag="x"
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0.2}
      onDrag={(e, info) => {
        setIsDragging(true);
        setSwipe({ x: info.offset.x });
      }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 1, opacity: 1, y: 0 }}
      animate={{ scale: 1 - index * 0.02, opacity: 1 - index * 0.05, y: index * 8 }}
      exit={{ scale: 0.8, opacity: 0, x: isSwipingRight ? 500 : -500 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute w-full max-w-sm cursor-grab active:cursor-grabbing"
    >
      <div
        className={cn(
          'relative mx-auto rounded-2xl border border-border/30 bg-card shadow-xl overflow-hidden transition-all',
          isDragging && 'shadow-2xl',
          swipePercentage > 0.5 && 'border-green-500/50',
          swipePercentage > 0.5 && isSwipingRight && 'bg-green-500/10',
          swipePercentage > 0.5 && !isSwipingRight && 'bg-red-500/10'
        )}
        onClick={() => onExpand?.()}
      >
        {/* Swipe feedback background */}
        {isDragging && swipePercentage > 0.3 && (
          <div className={cn('absolute inset-0 pointer-events-none', isSwipingRight ? 'bg-green-500/5' : 'bg-red-500/5')} />
        )}

        {/* Approve/Deny indicators */}
        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
          {swipePercentage > 0.3 && isSwipingRight && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 text-green-400">
              <Check className="h-5 w-5" />
              <span className="text-xs font-bold">Approve</span>
            </motion.div>
          )}
          {swipePercentage > 0.3 && !isSwipingRight && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="ml-auto flex items-center gap-2 text-red-400">
              <span className="text-xs font-bold">Deny</span>
              <X className="h-5 w-5" />
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Type badge & Priority */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/20 text-primary">{approval.submission_type?.replace('_', ' ')}</span>
            <span className={cn('text-xs font-bold px-2.5 py-1 rounded-lg', {
              'bg-red-500/20 text-red-400': approval.priority === 'critical',
              'bg-orange-500/20 text-orange-400': approval.priority === 'high',
              'bg-amber-500/20 text-amber-400': approval.priority === 'medium',
              'bg-slate-500/20 text-slate-400': approval.priority === 'low',
            })}>{approval.priority}</span>
          </div>

          {/* Summary */}
          <h3 className="text-sm font-bold text-foreground mb-2">{approval.summary?.substring(0, 100)}</h3>

          {/* Details */}
          <div className="space-y-1.5 mb-4 text-[11px] text-muted-foreground">
            <p>Submitted by: <span className="text-foreground font-semibold">{approval.submitted_by_name}</span></p>
            {approval.station_name && <p>Station: <span className="text-foreground font-semibold">{approval.station_name}</span></p>}
            {approval.location && <p>Location: <span className="text-foreground font-semibold">{approval.location}</span></p>}
            {approval.submitted_at && <p>Time: <span className="text-foreground font-semibold">{new Date(approval.submitted_at).toLocaleTimeString()}</span></p>}
          </div>

          {/* Photo preview */}
          {approval.photo_url && (
            <img src={approval.photo_url} alt="Approval photo" className="w-full h-32 object-cover rounded-lg mb-3" />
          )}
        </div>
      </div>
    </motion.div>
  );
}