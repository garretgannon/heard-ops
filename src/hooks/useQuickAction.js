import { useState, useCallback } from 'react';

/**
 * Hook for managing quick action modals and success callbacks
 * Provides centralized action state and refresh logic
 */
export function useQuickAction() {
  const [activeModal, setActiveModal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const openAction = useCallback((actionType) => {
    setActiveModal(actionType);
  }, []);

  const closeAction = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleSuccess = useCallback(() => {
    setActiveModal(null);
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    activeModal,
    refreshKey,
    openAction,
    closeAction,
    handleSuccess,
  };
}