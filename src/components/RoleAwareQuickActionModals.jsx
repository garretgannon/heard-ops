import { useRoleSimulation } from '@/lib/RoleSimulationContext';
import ShiftIntelligenceLog from '@/components/KitchenLeadWorkflows/ShiftIntelligenceLog';
import PrepCommandCenter from '@/components/KitchenLeadWorkflows/PrepCommandCenter';
import { QuickActionModals } from '@/components/QuickActionModals';

// Maps RoleAwareQuickActions action IDs → QuickActionModals modal IDs
const ACTION_ID_MAP = {
  shift_log: 'quick-log',
  add_task: 'add-task',
  temp_log: 'temp-log',
  issue: 'add-issue',
};

export default function RoleAwareQuickActionModals({ activeModal, onCloseModal, onSuccess }) {
  const { simulatedRole } = useRoleSimulation();
  const mappedModal = ACTION_ID_MAP[activeModal] ?? activeModal;

  return (
    <>
      {/* Kitchen Lead specialized modals */}
      {simulatedRole === 'kitchen_lead' && (
        <>
          <ShiftIntelligenceLog
            isOpen={activeModal === 'shift_log'}
            onClose={onCloseModal}
            onSuccess={onSuccess}
          />
          <PrepCommandCenter
            isOpen={activeModal === 'prep_command'}
            onClose={onCloseModal}
            onSuccess={onSuccess}
          />
        </>
      )}

      {/* Common modals for all other roles (and kitchen_lead for non-specialized actions) */}
      {(simulatedRole !== 'kitchen_lead' || !['shift_log', 'prep_command'].includes(activeModal)) && (
        <QuickActionModals
          activeModal={mappedModal}
          onCloseModal={onCloseModal}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}