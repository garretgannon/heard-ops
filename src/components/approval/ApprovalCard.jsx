import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, Eye, X, ShieldCheck, Clock, User, Calendar, MapPin, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const APPROVAL_STYLES = {
  timeoff: { 
    label: 'Staffing', 
    color: 'text-blue-400', 
    border: 'border-blue-500/30', 
    bg: 'bg-blue-500/10',
    icon: Calendar
  },
  prep: { 
    label: 'Prep Change', 
    color: 'text-orange-400', 
    border: 'border-orange-500/30', 
    bg: 'bg-orange-500/10',
    icon: AlertCircle
  },
  temperature: { 
    label: 'Temp Alert', 
    color: 'text-red-400', 
    border: 'border-red-500/30', 
    bg: 'bg-red-500/10',
    icon: AlertCircle
  },
  maintenance: { 
    label: 'Maintenance', 
    color: 'text-amber-400', 
    border: 'border-amber-500/30', 
    bg: 'bg-amber-500/10',
    icon: MapPin
  },
  financial: { 
    label: 'Financial', 
    color: 'text-purple-400', 
    border: 'border-purple-500/30', 
    bg: 'bg-purple-500/10',
    icon: DollarSign
  },
  default: { 
    label: 'Approval', 
    color: 'text-zinc-400', 
    border: 'border-zinc-500/30', 
    bg: 'bg-zinc-500/10',
    icon: AlertCircle
  }
};

export default function ApprovalCard({ approval, isTop, depthIndex, total, onApprove, onDeny, onViewDetails }) {
  const x = useMotionValue(0);
  // Transform x into a rotation to give that Tinder-like subtle twist
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  // Fade out slightly when swiped far
  const swipeOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Visual indicators for swipe direction
  const approveOpacity = useTransform(x, [10, 100], [0, 1]);
  const denyOpacity = useTransform(x, [-10, -100], [0, 1]);

  const styleConfig = APPROVAL_STYLES[approval.approval_type] || APPROVAL_STYLES.default;
  const Icon = styleConfig.icon;

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;
    
    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      onApprove();
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      onDeny();
    }
  };

  // Stacked card positioning logic
  const scale = 1 - (depthIndex * 0.05);
  const yOffset = depthIndex * 14;

  const getDetails = () => {
    switch (approval.approval_type) {
      case 'timeoff':
        return [
          { icon: User, value: approval.employee_name || 'Unknown Staff' },
          { icon: Clock, value: `${approval.start_date} - ${approval.end_date}` }
        ];
      case 'prep':
        return [
          { icon: MapPin, value: approval.station_name || 'Prep Station' },
          { icon: AlertCircle, value: `${approval.quantity || 0} ${approval.unit || ''}` }
        ];
      case 'maintenance':
        return [
          { icon: MapPin, value: approval.location || 'Unknown Location' },
          { icon: User, value: approval.reported_by || 'Staff' }
        ];
      default:
        return [
          { icon: Clock, value: 'Pending Review' }
        ];
    }
  };

  const details = getDetails();

  return (
    <motion.div
      className="absolute inset-0 w-full h-full"
      style={{
        zIndex: isTop ? 10 : 10 - depthIndex,
        x,
        rotate,
        opacity: swipeOpacity
      }}
      initial={{ 
        scale: 0.95, 
        y: yOffset + 20, 
        opacity: 0 
      }}
      animate={{ 
        scale, 
        y: yOffset, 
        opacity: 1 - (depthIndex * 0.15) 
      }}
      exit={{ 
        x: x.get() > 0 ? 300 : -300, 
        opacity: 0,
        transition: { duration: 0.2 }
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragStart={() => haptics.light?.()}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { scale: 0.98 } : {}}
    >
      {/* The actual Card Surface */}
      <div 
        className={cn(
          "w-full h-full rounded-[32px] border overflow-hidden flex flex-col relative",
          "bg-card/95 backdrop-blur-3xl shadow-2xl"
        )}
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 40px -10px rgba(0,0,0,0.5)'
        }}
      >
        {/* Swipe Indicators (Stamps) */}
        {isTop && (
          <>
            <motion.div 
              style={{ opacity: approveOpacity }}
              className="absolute top-8 left-8 z-20 pointer-events-none"
            >
              <div className="border-[4px] border-green-500 text-green-500 rounded-xl px-4 py-1 flex items-center gap-2 transform -rotate-12 bg-black/40 backdrop-blur-md">
                <Check className="h-6 w-6 stroke-[4px]" />
                <span className="text-2xl font-black uppercase tracking-widest">Approve</span>
              </div>
            </motion.div>
            <motion.div 
              style={{ opacity: denyOpacity }}
              className="absolute top-8 right-8 z-20 pointer-events-none"
            >
              <div className="border-[4px] border-red-500 text-red-500 rounded-xl px-4 py-1 flex items-center gap-2 transform rotate-12 bg-black/40 backdrop-blur-md">
                <span className="text-2xl font-black uppercase tracking-widest">Deny</span>
                <X className="h-6 w-6 stroke-[4px]" />
              </div>
            </motion.div>
          </>
        )}

        {/* Card Content */}
        <div className="flex-1 flex flex-col p-6 sm:p-8 relative">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className={cn("px-3 py-1.5 rounded-full flex items-center gap-1.5 border", styleConfig.bg, styleConfig.border)}>
              <Icon className={cn("h-3.5 w-3.5", styleConfig.color)} />
              <span className={cn("text-[11px] font-black uppercase tracking-widest", styleConfig.color)}>
                {styleConfig.label}
              </span>
            </div>
            {approval.priority === 'high' && (
              <div className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <AlertCircle className="h-3.5 w-3.5" />
                Urgent
              </div>
            )}
          </div>

          {/* Main Entity info */}
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight mb-2 line-clamp-2">
              {approval.employee_name || approval.name || approval.title || 'Review Required'}
            </h2>
            <p className="text-[15px] font-medium text-muted-foreground/80 leading-relaxed line-clamp-3">
              {approval.reason || approval.description || 'Action required to proceed.'}
            </p>
          </div>

          {/* Data List */}
          <div className="space-y-3 mb-auto">
            {details.map((detail, i) => {
              const DIcon = detail.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="h-10 w-10 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
                    <DIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-[15px] font-bold text-foreground/90">{detail.value}</span>
                </div>
              );
            })}
          </div>

          {/* Verification / Attachments badge */}
          {(approval.photo_url || approval.attachment_urls || approval.image_url) && (
            <div className="mt-6 flex items-center gap-2 p-3 rounded-2xl bg-green-500/10 border border-green-500/20">
              <ShieldCheck className="h-5 w-5 text-green-400 shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-green-400">Attachments Verified</p>
                <p className="text-[11px] text-green-500/70">Photos or documents are attached for review.</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Row */}
        <div className="p-4 sm:p-6 border-t border-white/[0.06] bg-black/20 flex gap-3 backdrop-blur-xl shrink-0">
          <button
            onClick={onDeny}
            disabled={!isTop}
            className="flex-1 h-14 rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center gap-2 text-muted-foreground font-bold hover:bg-white/[0.05] transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" /> Deny
          </button>
          <button
            onClick={onViewDetails}
            disabled={!isTop}
            className="h-14 w-14 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-foreground hover:bg-white/[0.08] transition-colors disabled:opacity-50"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={onApprove}
            disabled={!isTop}
            className="flex-1 h-14 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center gap-2 text-primary font-bold hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <Check className="h-5 w-5" /> Approve
          </button>
        </div>

      </div>
    </motion.div>
  );
}
