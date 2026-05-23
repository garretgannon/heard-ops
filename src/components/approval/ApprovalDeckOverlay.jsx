import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import TaskVisual from '@/components/TaskVisual';
import DenialReasonDrawer from './DenialReasonDrawer';
import ClearBurst from './ClearBurst';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// ── Helpers ────────────────────────────────────────────────────────────────────

const PREP_IMAGES = {
  ranch: '/demo-prep/ranch.svg',
  pico: '/demo-prep/pico.svg',
  romaine: '/demo-prep/romaine.svg',
  guac: '/demo-prep/guacamole.svg',
};

function demoPhotoFor(name = '') {
  const n = name.toLowerCase();
  if (n.includes('ranch')) return PREP_IMAGES.ranch;
  if (n.includes('pico') || n.includes('salsa')) return PREP_IMAGES.pico;
  if (n.includes('romaine') || n.includes('lettuce')) return PREP_IMAGES.romaine;
  if (n.includes('guac')) return PREP_IMAGES.guac;
  return null;
}

const APPROVAL_QUEUE_TYPES = {
  temperature_log: 'temperature',
  prep_completion: 'prep',
  maintenance_request: 'maintenance',
  incident_report: 'employee',
  waste_log: 'waste',
  shift_handoff: 'employee',
  task_exception: 'employee',
};

function normalizeItem(item) {
  const type = APPROVAL_QUEUE_TYPES[item.submission_type] || 'employee';
  return {
    ...item,
    approval_type: type,
    sourceModule: 'ApprovalQueue',
    sourceId: item.id,
    title: item.summary || 'Approval request',
    description: item.summary || '',
    name: item.summary || 'Approval request',
    created_by: item.submitted_by_name || item.submitted_by_email,
    created_date: item.submitted_at,
    location: item.location || item.station_name,
  };
}

function uniqueApprovals(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = `${item.sourceModule}:${item.sourceId || item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const TYPE_MAP = {
  prep:        { label: 'Prep Change',       statusClass: 'status-warning'  },
  temperature: { label: 'Temperature Alert', statusClass: 'status-info'     },
  maintenance: { label: 'Maintenance',       statusClass: 'status-warning'  },
  employee:    { label: 'Employee Log',      statusClass: 'status-info'     },
  waste:       { label: 'Waste / 86',        statusClass: 'status-critical' },
  schedule:    { label: 'Schedule',          statusClass: 'status-info'     },
  timeoff:     { label: 'Time Off',          statusClass: 'status-success'  },
  trade:       { label: 'Shift Trade',       statusClass: 'status-info'     },
};

// ── Swipe card ─────────────────────────────────────────────────────────────────

function SwipeCard({ approval, index, total, onApprove, onDeny }) {
  const [drag, setDrag] = useState(0);

  const type = TYPE_MAP[approval.approval_type] || { label: 'Review', statusClass: 'status-info' };
  const title = approval.name || approval.title || approval.summary || type.label;
  const subtitle = approval.description || approval.summary || '';
  const statusClass = approval.priority === 'high' ? 'status-critical' : type.statusClass;

  const imageUrl = [
    approval.photo_url, approval.completion_photo_url, approval.image_url, approval.master_photo_url,
  ].find(v => typeof v === 'string' && v.trim()) || '';

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 60 || info.velocity.x > 500) onApprove?.();
    else if (info.offset.x < -60 || info.velocity.x < -500) onDeny?.();
    setDrag(0);
  };

  const showApproveStamp = drag > 40;
  const showDenyStamp = drag < -40;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Swipe direction hints */}
      <div className="flex shrink-0 items-center justify-between">
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest transition-all duration-150',
          showDenyStamp ? 'bg-red-500/25 text-red-300' : 'text-muted-foreground/35',
        )}>
          <X className="h-3 w-3" /> Send Back
        </div>
        <span className="text-[11px] font-bold text-muted-foreground">{index} of {total}</span>
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest transition-all duration-150',
          showApproveStamp ? 'bg-green-500/25 text-green-300' : 'text-muted-foreground/35',
        )}>
          Approve <Check className="h-3 w-3" />
        </div>
      </div>

      {/* Draggable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        dragMomentum={false}
        onDrag={(_, info) => setDrag(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        style={{ rotate: drag * 0.032 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="relative flex-1 touch-pan-y cursor-grab overflow-hidden rounded-3xl active:cursor-grabbing"
      >
        <TaskVisual type="task" name={title} imageUrl={imageUrl} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/10" />

        {/* Swipe colour tint */}
        <div className={cn(
          'absolute inset-0 rounded-3xl transition-colors duration-100',
          showApproveStamp ? 'bg-green-500/12' : showDenyStamp ? 'bg-red-500/12' : '',
        )} />

        {/* Stamps */}
        {showApproveStamp && (
          <div className="absolute left-6 top-10 -rotate-12 rounded-xl px-4 py-2"
            style={{ border: '3px solid rgba(74,222,128,0.85)' }}>
            <span className="text-lg font-black uppercase tracking-[0.18em] text-green-400">Approve</span>
          </div>
        )}
        {showDenyStamp && (
          <div className="absolute right-6 top-10 rotate-12 rounded-xl px-4 py-2"
            style={{ border: '3px solid rgba(248,113,113,0.85)' }}>
            <span className="text-lg font-black uppercase tracking-[0.18em] text-red-400">Deny</span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <span className={cn('status-pill bg-black/50 backdrop-blur-sm', statusClass)}>{type.label}</span>
          {imageUrl && (
            <div className="flex items-center gap-1 rounded-full bg-green-500/25 px-2.5 py-1 backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3 text-green-400" />
              <span className="text-[10px] font-black text-green-300">Verified</span>
            </div>
          )}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-20">
          <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-5 text-white/65">{subtitle}</p>}
          {approval.submitted_by_name && (
            <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/45">
              From {approval.submitted_by_name}
            </p>
          )}
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="grid shrink-0 grid-cols-2 gap-3">
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onDeny}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black text-red-300 transition-all active:scale-[0.97]"
          style={{
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(239,68,68,0.08) 100%)',
          }}
        >
          <X className="h-4 w-4" /> Send Back
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onApprove}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black text-green-300 transition-all active:scale-[0.97]"
          style={{
            border: '1px solid rgba(34,197,94,0.3)',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.1) 100%)',
            boxShadow: '0 0 16px rgba(34,197,94,0.12)',
          }}
        >
          <Check className="h-4 w-4" /> Approve
        </button>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function ApprovalDeckOverlay({ isOpen, onClose }) {
  const { user } = useCurrentUser();
  const [approvals, setApprovals] = useState([]);
  const [processed, setProcessed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [denialDrawer, setDenialDrawer] = useState(null);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProcessed(0);
      loadApprovals();
    }
  }, [isOpen]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const [queueItems, prepItems] = await Promise.all([
        base44.entities.ApprovalQueue?.filter?.({ status: 'pending' }, '-submitted_at', 30).catch(() => []) ?? [],
        base44.entities.PrepItem?.filter?.({}, '-updated_date', 20).catch(() => []) ?? [],
      ]);

      const pendingPrep = (prepItems || []).filter(p => p.status === 'pending_review');

      const all = uniqueApprovals([
        ...(queueItems || []).map(normalizeItem),
        ...pendingPrep.map(p => ({
          ...p,
          approval_type: 'prep',
          sourceModule: 'PrepItem',
          sourceId: p.id,
          photo_url: p.photo_url || demoPhotoFor(p.name),
          title: p.name || 'Prep item',
          name: p.name || 'Prep item',
          description: p.summary || '',
        })),
      ]);

      setApprovals(all);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    }
    setLoading(false);
  };

  const finish = (remaining) => {
    if (remaining.length === 0) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.55 },
        colors: ['#22c55e', '#4ade80', '#86efac', '#FF6B00', '#FCD34D'],
      });
      setShowBurst(true);
      setTimeout(() => {
        setShowBurst(false);
        onClose?.();
      }, 1400);
    }
  };

  const handleApprove = async () => {
    const approval = approvals[0];
    if (!approval) return;
    try {
      const now = new Date().toISOString();
      const data = approval.sourceModule === 'ApprovalQueue'
        ? { status: 'approved', approved_by_email: user?.email || 'current_user', approved_at: now }
        : { status: 'completed', approval_status: 'approved', approved_by: user?.email || 'current_user', approved_at: now };
      await base44.entities[approval.sourceModule]?.update?.(approval.sourceId, data);
      const remaining = approvals.slice(1);
      setApprovals(remaining);
      setProcessed(p => p + 1);
      if (remaining.length > 0) toast.success('Approved');
      finish(remaining);
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleDenialSubmit = async (reason, notes) => {
    const approval = denialDrawer?.approval || approvals[0];
    if (!approval) return;
    try {
      const now = new Date().toISOString();
      const data = approval.sourceModule === 'ApprovalQueue'
        ? { status: 'denied', approved_by_email: user?.email || 'current_user', approved_at: now, denial_reason: [reason, notes].filter(Boolean).join(': ') }
        : { status: 'denied', approval_status: 'denied', denied_by: user?.email || 'current_user', denied_at: now, denial_reason: reason, denial_notes: notes };
      await base44.entities[approval.sourceModule]?.update?.(approval.sourceId, data);
      const remaining = approvals.filter(a => `${a.sourceModule}:${a.sourceId}` !== `${approval.sourceModule}:${approval.sourceId}`);
      setApprovals(remaining);
      setProcessed(p => p + 1);
      setDenialDrawer(null);
      if (remaining.length > 0) toast.success('Sent back');
      finish(remaining);
    } catch {
      toast.error('Failed to send back');
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="approval-overlay"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="fixed inset-0 z-[150] flex flex-col"
            style={{ background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4"
              style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Manager Priority</p>
                <h2 className="mt-0.5 text-lg font-black text-foreground">
                  Approvals{' '}
                  {!loading && (
                    <span className="font-bold text-muted-foreground">
                      · {approvals.length} waiting
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>

            {/* Body */}
            <div
              className="flex flex-1 flex-col px-5 py-4"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              {loading ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : approvals.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <Check className="h-10 w-10 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-foreground">All Clear</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {processed > 0 ? `${processed} review${processed !== 1 ? 's' : ''} processed.` : 'No pending approvals.'}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 rounded-xl px-6 py-2.5 text-sm font-black text-foreground transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <SwipeCard
                  approval={approvals[0]}
                  index={processed + 1}
                  total={processed + approvals.length}
                  onApprove={handleApprove}
                  onDeny={() => setDenialDrawer({ approval: approvals[0] })}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Denial drawer — stacks on top of overlay */}
      {denialDrawer && (
        <DenialReasonDrawer
          approval={denialDrawer.approval}
          onSubmit={handleDenialSubmit}
          onClose={() => setDenialDrawer(null)}
        />
      )}

      {/* Queue-clear celebration */}
      <AnimatePresence>
        {showBurst && <ClearBurst key="burst" />}
      </AnimatePresence>
    </>
  );
}

// ── Lightweight hook for badge count ──────────────────────────────────────────

export function useApprovalCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [queue, prep] = await Promise.all([
          base44.entities.ApprovalQueue?.filter?.({ status: 'pending' }, '-submitted_at', 50).catch(() => []) ?? [],
          base44.entities.PrepItem?.filter?.({ status: 'pending_review' }, '-updated_date', 20).catch(() => []) ?? [],
        ]);
        if (mounted) setCount((queue?.length ?? 0) + (prep?.length ?? 0));
      } catch {}
    };

    load();
    const id = setInterval(load, 60_000); // refresh every minute
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return count;
}
