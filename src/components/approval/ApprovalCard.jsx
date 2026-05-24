import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronUp, Eye, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import TaskVisual from '@/components/TaskVisual';

const APPROVAL_TYPES = {
  prep: { label: 'Prep Change', status: 'status-warning', visual: 'prep' },
  temperature: { label: 'Temperature Alert', status: 'status-info', visual: 'task' },
  maintenance: { label: 'Maintenance', status: 'status-warning', visual: 'task' },
  employee: { label: 'Employee Log', status: 'status-info', visual: 'task' },
  waste: { label: 'Waste / 86', status: 'status-critical', visual: 'task' },
  schedule: { label: 'Schedule', status: 'status-info', visual: 'task' },
  timeoff: { label: 'Time Off', status: 'status-success', visual: 'task' },
  trade: { label: 'Shift Trade', status: 'status-info', visual: 'task' },
  beo: { label: 'BEO Prep', status: 'status-info', visual: 'prep' },
  recipe: { label: 'Recipe Change', status: 'status-warning', visual: 'prep' },
  vendor: { label: 'Vendor Update', status: 'status-info', visual: 'task' },
};

const firstImage = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (Array.isArray(value)) {
      const image = value.find((item) => typeof item === 'string' && item.trim());
      if (image) return image;
    }
  }
  return '';
};

export default function ApprovalCard({ approval, index, total, onApprove, onDeny, onViewDetails }) {
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

  const getDetailRows = () => {
    switch (approval.approval_type) {
      case 'prep':
        return [
          { label: 'Requested by', value: approval.completed_by || 'Unknown' },
          { label: 'Station', value: approval.station_name || approval.station_id || 'Prep' },
          { label: 'Quantity', value: `${approval.quantity || 0} ${approval.unit || ''}`.trim() },
        ];
      case 'maintenance':
        return [
          { label: 'Reported by', value: approval.reported_by || 'Unknown' },
          { label: 'Priority', value: approval.priority || 'Medium' },
          { label: 'Location', value: approval.location || 'Unknown' },
        ];
      case 'timeoff':
        return [
          { label: 'Employee', value: approval.employee_name || 'Unknown' },
          { label: 'Dates', value: `${approval.start_date || 'Start'} to ${approval.end_date || 'End'}` },
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
          title: approval.name || 'Prep Item',
          subtitle: 'Prep par or completion review',
          amount: `${approval.quantity || 0} ${approval.unit || ''}`.trim(),
          badge: approval.priority?.toUpperCase() || 'STANDARD',
          impact: approval.station_name || approval.station_id || 'Prep station',
        };
      case 'maintenance':
        return {
          title: approval.title || 'Maintenance Request',
          subtitle: approval.description || 'Maintenance request needs manager decision',
          amount: approval.priority?.toUpperCase() || 'STANDARD',
          badge: 'REQUEST',
          impact: approval.location || 'Operations',
        };
      case 'timeoff':
        return {
          title: approval.employee_name || 'Time Off',
          subtitle: approval.reason || 'Request',
          amount: approval.start_date || 'Pending dates',
          badge: 'PENDING',
          impact: 'Schedule coverage',
        };
      default:
        return {
          title: type.label,
          subtitle: 'Review needed',
          amount: requestId,
          badge: 'NOW',
          impact: 'Manager approval',
        };
    }
  };

  const content = getMainContent();
  const statusClass = approval.priority === 'high' ? 'status-critical' : type.status;
  const imageUrl = firstImage(
    approval.photo_url,
    approval.photo_urls,
    approval.completion_photo_url,
    approval.completion_photo_urls,
    approval.manager_attachment_urls,
    approval.completion_attachment_urls,
    approval.attachment_urls,
    approval.master_photo_url,
    approval.image_url
  );
  const visualType = type.visual || 'task';

  return (
    <motion.div
      ref={cardRef}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.16}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDrag={(_, info) => setDrag(info.offset.x)}
      onDragEnd={handleDragEnd}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className={cn('relative flex flex-1 touch-pan-y flex-col', isDragging && 'cursor-grabbing')}
    >
      <div className="glass-panel flex flex-1 flex-col overflow-hidden p-0">
        <div className="relative h-56 overflow-hidden">
          <TaskVisual
            type={visualType}
            name={content.title}
            category={type.label}
            step={`${content.subtitle} ${content.impact}`}
            imageUrl={imageUrl}
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
            <span className={cn('status-pill bg-black/45 backdrop-blur-sm', statusClass)}>{type.label}</span>
            <span className="rounded-full bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm">
              {index} of {total}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            {imageUrl && (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-green-500/25 px-2.5 py-1 backdrop-blur-sm">
                <ShieldCheck className="h-3 w-3 text-green-400" />
                <span className="text-[10px] font-black text-green-300">Photo Verified</span>
              </div>
            )}
            <h2 className="text-3xl font-black tracking-tight text-white">{content.title}</h2>
            <p className="mt-1 text-sm font-semibold text-white/70">{content.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Impact</p>
              <p className="mt-1 text-lg font-black text-foreground">{content.impact}</p>
            </div>
            <div className="text-right">
              <div className={cn('status-marker status-marker-lg ml-auto', statusClass)}>
                {approval.priority === 'high' ? '!' : 'OK'}
              </div>
              <p className="mt-1 max-w-[96px] truncate text-xs font-black text-foreground">{content.amount || content.badge}</p>
            </div>
          </div>

          <div className="mt-5 space-y-2 rounded-2xl border border-border/40 p-4" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
            {getDetailRows().map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="truncate font-bold text-foreground">{row.value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onViewDetails}
            className="mt-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground"
          >
            <Eye className="h-3.5 w-3.5" />
            Detail sheet
            <ChevronUp className="h-3.5 w-3.5" />
          </button>

          <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
            <button
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onDeny}
              className="flex h-13 items-center justify-center gap-2 rounded-2xl text-sm font-black text-red-300 transition-all active:scale-[0.97]"
              style={{
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(239,68,68,0.08) 100%)',
                boxShadow: '0 0 0 1px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
              aria-label="Send back approval"
            >
              <X className="h-4 w-4" />
              Send Back
            </button>
            <button
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onApprove}
              className="flex h-13 items-center justify-center gap-2 rounded-2xl text-sm font-black text-green-300 transition-all active:scale-[0.97]"
              style={{
                border: '1px solid rgba(34,197,94,0.3)',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.1) 100%)',
                boxShadow: '0 0 0 1px rgba(34,197,94,0.12), 0 0 16px rgba(34,197,94,0.15), inset 0 1px 0 rgba(255,255,255,0.07)',
              }}
              aria-label="Approve approval"
            >
              <Check className="h-4 w-4" />
              Approve
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] transition-all',
          drag < -20 ? 'bg-red-500/20 text-red-300' : 'text-muted-foreground/50'
        )}>
          <X className="h-2.5 w-2.5" />
          Send back
        </div>
        <div className="flex items-center gap-1">
          {[-2,-1,0,1,2].map(i => (
            <div key={i} className={cn(
              'rounded-full transition-all',
              i === 0 ? 'h-2 w-2' : 'h-1.5 w-1.5',
              Math.abs(drag) < 20 && i === 0 ? 'bg-primary' :
              drag > 20 && i >= 0 ? 'bg-green-400' :
              drag < -20 && i <= 0 ? 'bg-red-400' :
              'bg-border/40'
            )} />
          ))}
        </div>
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] transition-all',
          drag > 20 ? 'bg-green-500/20 text-green-300' : 'text-muted-foreground/50'
        )}>
          Approve
          <Check className="h-2.5 w-2.5" />
        </div>
      </div>
    </motion.div>
  );
}

export const hideBase44Index = true;
