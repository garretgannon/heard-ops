import { useState, useEffect } from 'react';
import { useRoleSimulation } from '@/lib/RoleSimulationContext';
import ShiftIntelligenceLog from '@/components/KitchenLeadWorkflows/ShiftIntelligenceLog';
import PrepCommandCenter from '@/components/KitchenLeadWorkflows/PrepCommandCenter';

export default function RoleAwareQuickActionModals({ activeModal, onCloseModal, onSuccess }) {
  const { simulatedRole } = useRoleSimulation();

  // Kitchen Lead modals
  if (simulatedRole === 'kitchen_lead') {
    return (
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
    );
  }

  // Server modals would go here
  // Prep Cook modals would go here
  // Manager modals would go here
  // etc.

  return null;
}