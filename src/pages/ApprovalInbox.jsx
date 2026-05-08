import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format, parseISO, differenceInHours } from 'date-fns';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ApprovalCard from '@/components/approval/ApprovalCard';
import DenialReasonDrawer from '@/components/approval/DenialReasonDrawer';
import ApprovalDetailSheet from '@/components/approval/ApprovalDetailSheet';
import ApprovalMetrics from '@/components/approval/ApprovalMetrics';
import ApprovalFilters from '@/components/approval/ApprovalFilters';
import InboxZeroState from '@/components/approval/InboxZeroState';

const APPROVAL_TYPES = {
  prep: { label: 'Prep Review', icon: '🔪', color: 'text-orange-400' },
  temperature: { label: 'Temperature Alert', icon: '🌡️', color: 'text-blue-400' },
  maintenance: { label: 'Maintenance', icon: '🔧', color: 'text-yellow-400' },
  employee: { label: 'Employee Log', icon: '👤', color: 'text-purple-400' },
  waste: { label: 'Waste/86', icon: '⚠️', color: 'text-red-400' },
  schedule: { label: 'Schedule Request', icon: '📅', color: 'text-teal-400' },
  timeoff: { label: 'Request Off', icon: '🏖️', color: 'text-green-400' },
  trade: { label: 'Shift Trade', icon: '🔄', color: 'text-pink-400' },
  beo: { label: 'BEO Prep', icon: '🎉', color: 'text-indigo-400' },
  recipe: { label: 'Recipe Change', icon: '📖', color: 'text-amber-400' },
  vendor: { label: 'Vendor Update', icon: '💰', color: 'text-cyan-400' },
};

export default function ApprovalInbox() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processedToday, setProcessedToday] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [denialDrawer, setDenialDrawer] = useState(null);
  const [detailSheet, setDetailSheet] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch approvals from all sources
  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const [prepItems, tempLogs, maintenanceReqs, timeOffReqs, scheduleReqs] = await Promise.all([
        base44.entities.PrepItem.filter({ status: 'pending_review' }).catch(() => []),
        base44.entities.TemperatureLog.filter({ requires_review: true }).catch(() => []),
        base44.entities.MaintenanceRequest.filter({ status: 'pending' }).catch(() => []),
        base44.entities.TimeOffRequest.filter({ status: 'pending' }).catch(() => []),
        // Add schedule requests, waste logs, shift trades, etc. as needed
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
    if (filter !== 'all') result = result.filter(a => a.approval_type === filter || (filter === 'urgent' && a.priority === 'high'));
    return result;
  }, [approvals, filter]);

  const remaining = filteredApprovals.slice(currentIndex);
  const currentApproval = remaining[0];
  const isComplete = remaining.length === 0;

  const handleApprove = async () => {
    if (!currentApproval) return;
    try {
      // Update original record
      const updateData = {
        approval_status: 'approved',
        approved_by: 'current_user', // Replace with actual user
        approved_at: new Date().toISOString(),
      };
      await base44.entities[currentApproval.sourceModule].update(currentApproval.sourceId, updateData);
      
      setApprovals(a => a.filter((_, i) => i !== currentIndex));
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
      
      setApprovals(a => a.filter((_, i) => i !== currentIndex));
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isComplete && showCelebration) {
    return <InboxZeroState processedToday={processedToday} onReset={() => { setCurrentIndex(0); setShowCelebration(false); loadApprovals(); }} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Metrics */}
      <ApprovalMetrics
        total={filteredApprovals.length}
        remaining={remaining.length}
        processedToday={processedToday}
        urgent={filteredApprovals.filter(a => a.priority === 'high').length}
        oldest={filteredApprovals.length > 0 ? filteredApprovals[0].created_date : null}
      />

      {/* Filters */}
      <ApprovalFilters currentFilter={filter} onFilterChange={setFilter} />

      {/* Main card stack */}
      <div className="px-4 py-4">
        {remaining.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No approvals to review</p>
          </div>
        ) : (
          <ApprovalCard
            approval={currentApproval}
            onApprove={handleApprove}
            onDeny={handleDeny}
            onViewDetails={() => setDetailSheet(currentApproval)}
          />
        )}
      </div>

      {/* Denial Drawer */}
      {denialDrawer && (
        <DenialReasonDrawer
          approval={denialDrawer.approval}
          onSubmit={handleDenialSubmit}
          onClose={() => setDenialDrawer(null)}
        />
      )}

      {/* Detail Sheet */}
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