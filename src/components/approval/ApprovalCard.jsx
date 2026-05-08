import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const APPROVAL_TYPES = {
  prep: { label: 'Prep', icon: '🔪', color: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  temperature: { label: 'Temp', icon: '🌡️', color: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  maintenance: { label: 'Maint', icon: '🔧', color: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  employee: { label: 'Staff', icon: '👤', color: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  waste: { label: '86', icon: '⚠️', color: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  schedule: { label: 'Sched', icon: '📅', color: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400' },
  timeoff: { label: 'Off', icon: '🏖️', color: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  trade: { label: 'Trade', icon: '🔄', color: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
  beo: { label: 'BEO', icon: '🎉', color: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  recipe: { label: 'Recipe', icon: '📖', color: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  vendor: { label: 'Vendor', icon: '💰', color: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
};

export default function ApprovalCard({ approval, onApprove, onDeny }) {
  const cardRef = useRef(null);
  const [drag, setDrag] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const type = APPROVAL_TYPES[approval.approval_type] || APPROVAL_TYPES.prep;
  const requestId = approval.id?.slice(0, 4).toUpperCase() || 'N/A';

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

  // Generate detail rows based on approval type
  const getDetailRows = () => {
    switch (approval.approval_type) {
      case 'prep':
        return [
          { label: 'Requested by', value: approval.completed_by || 'Unknown' },
          { label: 'Item', value: approval.name || 'Prep Item' },
        ];
      case 'maintenance':
        return [
          { label: 'Reported by', value: approval.reported_by || 'Unknown' },
          { label: 'Priority', value: approval.priority || 'Medium' },
        ];
      case 'timeoff':
        return [
          { label: 'Employee', value: approval.employee_name || 'Unknown' },
          { label: 'Dates', value: `${approval.start_date} to ${approval.end_date}` },
        ];
      default:
        return [
          { label: 'Type', value: type.label },
          { label: 'Status', value: 'Pending' },
        ];
    }
  };

  const getMainContent = () => {
    switch (approval.approval_type) {
      case 'prep':
        return {
          icon: '🔪',
          title: approval.name || 'Prep Item',
          subtitle: approval.station_id || 'Station',
          amount: `${approval.quantity || 0} ${approval.unit || ''}`,
          badge: approval.priority?.toUpperCase() || 'STANDARD',
        };
      case 'maintenance':
        return {
          icon: '🔧',
          title: approval.title || 'Maintenance',
          subtitle: approval.location || 'Location',
          amount: approval.priority?.toUpperCase() || 'STANDARD',
          badge: 'REQUEST',
        };
      case 'timeoff':
        return {
          icon: '🏖️',
          title: approval.employee_name || 'Time Off',
          subtitle: approval.reason || 'Request',
          amount: `${approval.start_date}`,
          badge: 'PENDING',
        };
      default:
        return {
          icon: type.icon,
          title: type.label,
          subtitle: 'Review needed',
          amount: requestId,
          badge: 'NOW',
        };
    }
  };

  const content = getMainContent();

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
      {/* Card */}
      <div className={cn(
        'relative bg-gradient-to-b from-card to-card/80 border border-border/50 rounded-3xl shadow-2xl overflow-hidden',
        isDragging && 'cursor-grabbing'
      )}>
        {/* Badge + ID */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', content.badge === 'NOW' ? 'bg-primary text-white' : 'bg-primary/20 text-primary')}>● {content.badge}</span>
        </div>
        <div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground">#{requestId}</div>

        {/* Icon circle (centered) */}
        <div className="flex justify-center py-8">
          <div className="h-24 w-24 rounded-full border-2 border-border/30 flex items-center justify-center text-4xl">
            {content.icon}
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center px-6 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">{content.subtitle}</h2>
          <p className="text-2xl font-black text-foreground mb-2">{content.amount}</p>
          <p className="text-sm text-muted-foreground">{content.title}</p>
        </div>

        {/* Detail rows */}
        <div className="px-6 py-4 space-y-3 border-t border-border/20">
          {getDetailRows().map((row, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <span className="text-base">👤</span>
                {row.label}
              </span>
              <span className="text-foreground font-semibold">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Budget status (if applicable) */}
        {approval.approval_type === 'maintenance' && approval.priority === 'high' && (
          <div className="px-6 py-3 border-t border-border/20 flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <span className="text-base">⏱️</span>
              Budget
            </span>
            <span className="text-green-400 font-semibold">Within Budget</span>
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 p-6">
          <button
            onClick={onDeny}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card/50 text-foreground font-bold text-sm hover:bg-card transition-all active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
            REJECT
          </button>
          <button
            onClick={onApprove}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all active:scale-95"
          >
            APPROVE
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Swipe hint */}
        <div className="text-center py-3 px-4 border-t border-border/20">
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Swipe left to reject</p>
          <div className="flex justify-center gap-1.5 mt-2">
            <div className={cn('h-1.5 w-1.5 rounded-full', drag < -20 ? 'bg-primary' : 'bg-border/40')} />
            <div className={cn('h-1.5 w-1.5 rounded-full', Math.abs(drag) < 20 ? 'bg-primary' : 'bg-border/40')} />
            <div className={cn('h-1.5 w-1.5 rounded-full', drag > 20 ? 'bg-primary' : 'bg-border/40')} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const hideBase44Index = true;