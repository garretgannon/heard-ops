import { useState } from 'react';
import UnifiedLogForm from '@/components/UnifiedLogForm';
import UnifiedTaskForm from '@/components/UnifiedTaskForm';
import QuickActionLogSelector from '@/components/quickactions/QuickActionLogSelector';

/**
 * Central quick action modal router
 * Maps action types to their correct forms and handles navigation/callbacks
 */
export default function QuickActionModal({ actionType, onClose, onSuccess }) {
  const [selectedLogType, setSelectedLogType] = useState(null);

  // Log-related actions
  if (actionType === 'add_log') {
    if (!selectedLogType) {
      return (
        <QuickActionLogSelector
          onSelect={(logType) => setSelectedLogType(logType)}
          onClose={onClose}
        />
      );
    }
    return (
      <UnifiedLogForm
        initialType={selectedLogType}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (actionType === 'log_temperature') {
    return (
      <UnifiedLogForm
        initialType="temperature"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (actionType === 'report_maintenance') {
    return (
      <UnifiedLogForm
        initialType="maintenance"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (actionType === 'report_incident') {
    return (
      <UnifiedLogForm
        initialType="incident"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (actionType === 'add_waste') {
    return (
      <UnifiedLogForm
        initialType="waste"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (actionType === 'add_employee_note') {
    return (
      <UnifiedLogForm
        initialType="employee_note"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (actionType === 'add_manager_note') {
    return (
      <UnifiedLogForm
        initialType="manager_note"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  // Task-related actions
  if (actionType === 'add_task') {
    return (
      <UnifiedTaskForm
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (actionType === 'add_prep_item') {
    return (
      <UnifiedTaskForm
        initialType="prep"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (actionType === 'add_side_work') {
    return (
      <UnifiedTaskForm
        initialType="sidework"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  return null;
}