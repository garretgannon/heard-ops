import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BACKDROP_VARIANTS } from '@/lib/modalAnimations';
import SwipeCard from '@/components/review/SwipeCard';
import ApprovalDetailPanel from '@/components/review/ApprovalDetailPanel';

export default function ReviewInbox() {
  const { user } = useCurrentUser();
  const [approvals, setApprovals] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    const pending = await base44.entities.ApprovalQueue?.filter?.({ status: 'pending' }, '-submitted_at', 100).catch(() => []);
    setApprovals(pending || []);
    setLoading(false);
  };

  const currentApproval = approvals[currentIndex];

  const handleApprove = async (notes) => {
    if (!currentApproval) return;
    setProcessing(true);
    try {
      await base44.entities.ApprovalQueue.update(currentApproval.id, {
        status: 'approved',
        approved_by_email: user?.email,
        approved_at: new Date().toISOString(),
      });
      // Sync to audit trail
      await base44.functions.invoke('syncApprovalsToLogs', {
        approval_id: currentApproval.id,
        status: 'approved',
      }).catch(() => null);
      setApprovals(p => p.filter(a => a.id !== currentApproval.id));
      setCurrentIndex(0);
      setSelectedApproval(null);
      toast.success('Approved');
    } catch {
      toast.error('Failed to approve');
    }
    setProcessing(false);
  };

  const handleDeny = async (notes) => {
    if (!currentApproval) return;
    setProcessing(true);
    try {
      await base44.entities.ApprovalQueue.update(currentApproval.id, {
        status: 'denied',
        approved_by_email: user?.email,
        approved_at: new Date().toISOString(),
        denial_reason: notes,
      });
      // Sync to audit trail
      await base44.functions.invoke('syncApprovalsToLogs', {
        approval_id: currentApproval.id,
        status: 'denied',
      }).catch(() => null);
      setApprovals(p => p.filter(a => a.id !== currentApproval.id));
      setCurrentIndex(0);
      setSelectedApproval(null);
      toast.success('Denied');
    } catch {
      toast.error('Failed to deny');
    }
    setProcessing(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'a' || e.key === 'A') handleApprove();
      if (e.key === 'd' || e.key === 'D') handleDeny();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentApproval]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Inbox Zero</h1>
          <p className="text-muted-foreground">You're caught up. All approvals are complete.</p>
        </div>
      </div>
    );
  }

  // Mobile swipe view
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 px-4 py-4 border-b border-border/20 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-foreground">Review Queue</h1>
            <button onClick={loadApprovals} className="text-primary font-bold text-sm">↻ Refresh</button>
          </div>
          <p className="text-xs text-muted-foreground">{currentIndex + 1} of {approvals.length} reviewed</p>
        </div>

        {/* Card Stack */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentApproval && (
              <SwipeCard
                key={currentApproval.id}
                approval={currentApproval}
                index={0}
                onApprove={() => handleApprove()}
                onDeny={() => handleDeny()}
                onExpand={() => setSelectedApproval(currentApproval)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Actions */}
        {currentApproval && !selectedApproval && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/20 p-4 flex gap-3">
            <button onClick={() => handleDeny()} disabled={processing}
              className="flex-1 py-3 rounded-lg bg-red-600/80 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-60">
              Deny
            </button>
            <button onClick={() => setSelectedApproval(currentApproval)}
              className="flex-1 py-3 rounded-lg border border-border text-foreground font-bold text-sm hover:bg-secondary">
              Details
            </button>
            <button onClick={() => handleApprove()} disabled={processing}
              className="flex-1 py-3 rounded-lg bg-green-600/80 text-white font-bold text-sm hover:bg-green-600 disabled:opacity-60">
              Approve
            </button>
          </div>
        )}

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedApproval && (
            <motion.div variants={BACKDROP_VARIANTS} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
              <motion.div variants={{hidden: {y: '100%'}, visible: {y: 0, transition: {duration: 0.2}}, exit: {y: '100%', transition: {duration: 0.15}}}} initial="hidden" animate="visible" exit="exit" className="w-full max-h-[90vh] rounded-t-2xl overflow-hidden bg-card border-t border-border/30">
                <ApprovalDetailPanel
                  approval={selectedApproval}
                  onClose={() => setSelectedApproval(null)}
                  onApprove={() => { handleApprove(); setSelectedApproval(null); }}
                  onDeny={handleDeny}
                  isProcessing={processing}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop split view
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: List */}
      <div className="w-80 border-r border-border/30 flex flex-col">
        <div className="sticky top-0 z-20 px-5 py-4 border-b border-border/30 bg-background/95 backdrop-blur-sm">
          <h2 className="font-bold text-foreground mb-2">Review Queue</h2>
          <p className="text-xs text-muted-foreground">{approvals.length} pending</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {approvals.map((approval, idx) => (
            <button
              key={approval.id}
              onClick={() => { setCurrentIndex(idx); setSelectedApproval(approval); }}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-border/30 transition-colors hover:bg-secondary',
                selectedApproval?.id === approval.id && 'bg-primary/10 border-l-2 border-l-primary'
              )}
            >
              <p className="text-xs text-primary font-bold">{approval.submission_type?.replace('_', ' ')}</p>
              <p className="text-sm font-semibold text-foreground mt-1 truncate">{approval.summary?.substring(0, 50)}</p>
              <p className="text-xs text-muted-foreground mt-1">{approval.submitted_by_name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Detail */}
      {selectedApproval && (
        <div className="flex-1 flex flex-col">
          <ApprovalDetailPanel
            approval={selectedApproval}
            onClose={() => setSelectedApproval(null)}
            onApprove={() => { handleApprove(); setSelectedApproval(null); }}
            onDeny={handleDeny}
            isProcessing={processing}
          />
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;