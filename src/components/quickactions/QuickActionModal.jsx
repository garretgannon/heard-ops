import { useState } from 'react';
import QuickActionLogSelector from '@/components/quickactions/QuickActionLogSelector';
import TemplateCreateModal from '@/components/templates/TemplateCreateModal';
import { TEMPLATE_BY_ACTION } from '@/lib/createTemplates';

/**
 * Central quick action modal router
 * Maps action types to their correct forms and handles navigation/callbacks
 */
export default function QuickActionModal({ actionType, onClose, onSuccess }) {
  const [selectedLogType, setSelectedLogType] = useState(null);
  const resolvedActionType = selectedLogType || actionType;
  const templateId = TEMPLATE_BY_ACTION[resolvedActionType];

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
  }

  if (templateId) {
    return (
      <TemplateCreateModal
        templateId={templateId}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  return null;
}
