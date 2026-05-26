import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ApprovalCard from '@/components/approval/ApprovalCard';
import DenialReasonDrawer from '@/components/approval/DenialReasonDrawer';
import ApprovalDetailSheet from '@/components/approval/ApprovalDetailSheet';
import ApprovalFilters from '@/components/approval/ApprovalFilters';
import { ClipboardList, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

export default function ApprovalInbox() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [clearedToday, setClearedToday] = useState(0);
  
  const [denialDrawer, setDenialDrawer] = useState(null);
  const [detailSheet, setDetailSheet] = useState(null);

  useEffect(() => { loadApprovals(); }, []);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const safeFilter = (entity, filter) =>
        entity?.filter?.(filter)?.catch?.(() => []) ?? Promise.resolve([]);

      const [prepItems, tempLogs, maintenanceReqs, timeOffReqs, queueItems] = await Promise.all([
        safeFilter(base44.entities.PrepItem, { status: 'pending_review' }),
        safeFilter(base44.entities.TemperatureLog, { requires_review: true }),
        safeFilter(base44.entities.MaintenanceRequest, { status: 'pending' }),
        safeFilter(base44.entities.TimeOffRequest, { status: 'pending' }),
        safeFilter(base44.entities.ApprovalQueue, { status: 'pending' }),
      ]);

      const all = [
        ...(prepItems || []).map(p => ({ ...p, approval_type: 'prep', sourceModule: 'PrepItem', sourceId: p.id })),
        ...(tempLogs || []).map(t  => ({ ...t, approval_type: 'temperature', sourceModule: 'TemperatureLog', sourceId: t.id })),
        ...(maintenanceReqs || []).map(m => ({ ...m, approval_type: 'maintenance', sourceModule: 'MaintenanceRequest', sourceId: m.id })),
        ...(timeOffReqs || []).map(t => ({ ...t, approval_type: 'timeoff', sourceModule: 'TimeOffRequest', sourceId: t.id })),
        ...(queueItems || []).map(q => ({
          ...q,
          approval_type: q.submission_type === 'prep_completion' ? 'prep' : q.submission_type === 'temperature_log' ? 'temperature' : 'employee',
          sourceModule: 'ApprovalQueue',
          sourceId: q.id,
          title: q.summary || 'Approval request',
          name: q.summary || 'Approval request',
          created_by: q.submitted_by_name || q.submitted_by_email,
          created_date: q.submitted_at,
        })),
      ];

      setApprovals(all);
    } catch {
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const filteredApprovals = useMemo(() => {
    let result = [...approvals];
    if (filter !== 'all') {
      result = result.filter(a => a.approval_type === filter || (filter === 'urgent' && a.priority === 'high'));
    }
    return result;
  }, [approvals, filter]);

  // Swiping top card (index 0 of filteredApprovals)
  const currentApproval = filteredApprovals[0];
  const isComplete = filteredApprovals.length === 0;

  const handleApprove = async (approvalToApprove) => {
    const target = approvalToApprove || currentApproval;
    if (!target) return;
    try {
      haptics.success?.();
      await base44.entities[target.sourceModule]?.update?.(target.sourceId, {
        approval_status: 'approved',
        approved_by: 'current_user',
        approved_at: new Date().toISOString(),
      });
      setApprovals(a => a.filter(item => item.id !== target.id));
      setClearedToday(p => p + 1);
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleDenyInitiate = (approvalToDeny) => {
    const target = approvalToDeny || currentApproval;
    if (!target) return;
    haptics.light?.();
    setDenialDrawer({ approval: target });
  };

  const handleDenialSubmit = async (reason, notes) => {
    const target = denialDrawer?.approval;
    if (!target) return;
    try {
      await base44.entities[target.sourceModule]?.update?.(target.sourceId, {
        approval_status: 'denied',
        denied_by: 'current_user',
        denied_at: new Date().toISOString(),
        denial_reason: reason,
        denial_notes: notes,
      });
      setApprovals(a => a.filter(item => item.id !== target.id));
      setClearedToday(p => p + 1);
      setDenialDrawer(null);
    } catch {
      toast.error('Failed to deny approval');
    }
  };

  // Stack rendering logic
  // We render up to 3 cards for depth.
  // We reverse so that filteredApprovals[0] is rendered LAST in the DOM and sits on top.
  const visibleCards = filteredApprovals.slice(0, 3).reverse();

  if (loading) {
    return (
      <div className="app-screen flex flex-col items-center justify-center gap-4 pb-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="app-screen flex flex-col h-screen overflow-hidden bg-background">
      <DesktopPageHeader title="Approvals" subtitle="Review submitted items and exceptions" />

      <main className="flex-1 flex flex-col pt-4 lg:pt-8 px-4 lg:px-8 max-w-5xl mx-auto w-full relative h-full">
        
        {/* Operational Header / Metrics */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 shrink-0">
          <div className="flex items-center rounded-full overflow-hidden border border-border bg-card shadow-sm w-full sm:w-auto">
            {[
              { label: 'Pending', value: approvals.length, color: 'text-foreground' },
              { label: 'Urgent', value: approvals.filter(a => a.priority === 'high').length, color: 'text-amber-400' },
              { label: 'Cleared', value: clearedToday, color: 'text-green-400' },
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} className="flex-1 sm:flex-none sm:w-28 flex flex-col items-center justify-center py-2.5" style={i < arr.length - 1 ? { borderRight: '1px solid rgba(255,255,255,0.08)' } : {}}>
                <span className={cn('text-[15px] font-bold leading-none tabular-nums', color)}>{value}</span>
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5 leading-none">{label}</span>
              </div>
            ))}
          </div>
          
          <div className="w-full sm:w-auto">
            <ApprovalFilters currentFilter={filter} onFilterChange={setFilter} />
          </div>
        </div>

        {/* Swipe Deck Area */}
        <div className="flex-1 relative flex flex-col justify-center items-center pb-12 sm:pb-20 h-full">
          {isComplete ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center p-8 max-w-sm"
            >
              <div className="h-20 w-20 rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-black text-foreground/80 mb-2 tracking-tight">Inbox Zero</p>
              <p className="text-sm font-medium text-muted-foreground/60 mb-8">All operational approvals have been cleared.</p>
              <button className="flex items-center justify-center gap-2 px-6 h-12 rounded-full border border-border/40 bg-white/[0.04] text-sm font-bold text-foreground hover:bg-white/[0.07] transition-all">
                <FileText className="h-4 w-4" /> View History
              </button>
            </motion.div>
          ) : (
            <div className="relative w-full max-w-[420px] h-[550px] max-h-[75vh]">
              <AnimatePresence>
                {visibleCards.map((approval, index) => {
                  const isTop = index === visibleCards.length - 1;
                  const depthIndex = visibleCards.length - 1 - index; 
                  
                  return (
                    <ApprovalCard
                      key={approval.id}
                      approval={approval}
                      isTop={isTop}
                      depthIndex={depthIndex}
                      total={filteredApprovals.length}
                      onApprove={() => handleApprove(approval)}
                      onDeny={() => handleDenyInitiate(approval)}
                      onViewDetails={() => setDetailSheet(approval)}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {denialDrawer && (
        <DenialReasonDrawer
          approval={denialDrawer.approval}
          onSubmit={handleDenialSubmit}
          onClose={() => setDenialDrawer(null)}
        />
      )}

      {detailSheet && (
        <ApprovalDetailSheet
          approval={detailSheet}
          onApprove={() => { handleApprove(detailSheet); setDetailSheet(null); }}
          onDeny={() => { handleDenyInitiate(detailSheet); setDetailSheet(null); }}
          onClose={() => setDetailSheet(null)}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;
