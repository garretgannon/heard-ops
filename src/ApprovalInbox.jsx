import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ApprovalCard from '@/components/approval/ApprovalCard';
import DenialReasonDrawer from '@/components/approval/DenialReasonDrawer';
import ApprovalDetailSheet from '@/components/approval/ApprovalDetailSheet';
import ApprovalFilters from '@/components/approval/ApprovalFilters';
import InboxZeroState from '@/components/approval/InboxZeroState';

export default function ApprovalInbox() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processedToday, setProcessedToday] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [denialDrawer, setDenialDrawer] = useState(null);
  const [detailSheet, setDetailSheet] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const [prepItems, tempLogs, maintenanceReqs, timeOffReqs] = await Promise.all([
        base44.entities.PrepItem.filter({ status: 'pending_review' }).catch(() => []),
        base44.entities.TemperatureLog.filter({ requires_review: true }).catch(() => []),
        base44.entities.MaintenanceRequest.filter({ status: 'pending' }).catch(() => []),
        base44.entities.TimeOffRequest.filter({ status: 'pending' }).catch(() => []),
      ]);

      const all = [
        ...prepItems.map(p => ({ ...p, approval_type: 'prep', sourceModule: 'PrepItem', sourceId: p.id })),
        ...tempLogs.map(t => ({ ...t, approval_type: 'temperature', sourceModule: 'TemperatureLog', sourceId: t.id })),
        ...maintenanceReqs.map(m => ({ ...m, approval_type: 'maintenance', sourceModule: 'MaintenanceRequest', sourceId: m.id })),
        ...timeOffReqs.map(t => ({ ...t, approval_type: 'timeoff', sourceModule: 'TimeOffRequest', sourceId: t.id })),
      ];

      setApprovals(all);
      setCurrentIndex(0);
    } catch (err) {
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

  const remaining = filteredApprovals.slice(currentIndex);
  const currentApproval = remaining[0];
  const isComplete = remaining.length === 0;
  const currentPosition = filteredApprovals.length === 0 ? 0 : currentIndex + 1;

  const handleApprove = async () => {
    if (!currentApproval) return;
    try {
      const updateData = {
        approval_status: 'approved',
        approved_by: 'current_user',
        approved_at: new Date().toISOString(),
      };
      await base44.entities[currentApproval.sourceModule].update(currentApproval.sourceId, updateData);

      setApprovals(a => a.filter(item => item.id !== currentApproval.id));
      setProcessedToday(p => p + 1);
      toast.success('Approved');

      if (filteredApprovals.slice(currentIndex + 1).length === 0) {
        setShowCelebration(true);
      }
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleDeny = () => {
    setDenialDrawer({ approval: currentApproval });
  };

  const handleDenialSubmit = async (reason, notes) => {
    if (!currentApproval) return;
    try {
      const updateData = {
        approval_status: 'denied',
        denied_by: 'current_user',
        denied_at: new Date().toISOString(),
        denial_reason: reason,
        denial_notes: notes,
      };
      await base44.entities[currentApproval.sourceModule].update(currentApproval.sourceId, updateData);

      setApprovals(a => a.filter(item => item.id !== currentApproval.id));
      setProcessedToday(p => p + 1);
      setDenialDrawer(null);
      toast.success('Denied');

      if (filteredApprovals.slice(currentIndex + 1).length === 0) {
        setShowCelebration(true);
      }
    } catch (err) {
      toast.error('Failed to deny approval');
    }
  };

  if (loading) {
    return (
      <div className="app-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent shadow-[0_0_24px_hsl(var(--primary)/0.45)]" />
      </div>
    );
  }

  if (isComplete && showCelebration) {
    return <InboxZeroState processedToday={processedToday} onReset={() => { setCurrentIndex(0); setShowCelebration(false); loadApprovals(); }} />;
  }

  return (
    <div className="app-screen">
      <main className="app-page mx-auto flex min-h-[calc(100vh-150px)] max-w-[520px] flex-col space-y-5">
        <header className="flex items-end justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Approvals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {remaining.length} waiting
            </p>
          </div>
          {filteredApprovals.length > 0 && (
            <div className="text-right">
              <p className="text-xs font-black text-foreground">{currentPosition} of {filteredApprovals.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Swipe</p>
            </div>
          )}
        </header>

        <ApprovalFilters currentFilter={filter} onFilterChange={setFilter} />

        {remaining.length === 0 ? (
          <div className="app-card flex-1 py-12 text-center">
            <div className="status-marker status-marker-lg status-success mx-auto mb-4">0</div>
            <p className="text-sm font-semibold text-muted-foreground">No approvals to review</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <ApprovalCard
              approval={currentApproval}
              index={currentPosition}
              total={filteredApprovals.length}
              onApprove={handleApprove}
              onDeny={handleDeny}
              onViewDetails={() => setDetailSheet(currentApproval)}
            />
          </div>
        )}
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
          onApprove={handleApprove}
          onDeny={handleDeny}
          onClose={() => setDetailSheet(null)}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;
