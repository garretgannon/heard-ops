import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Upload } from 'lucide-react';
import SingleEntryForm from './SingleEntryForm';
import BulkImportTab from './BulkImportTab';

const TABS = [
  { id: 'single', label: 'Single Entry', icon: User },
  { id: 'bulk', label: 'Bulk Import', icon: Upload },
];

export default function AddEmployeeModal({ onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('single');

  const handleClose = () => {
    document.body.classList.remove('modal-open');
    onClose();
  };

  // Prevent body scroll and handle safe area
  React.useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  // Prevent nested scrolling and ensure input visibility
  const handleTouchMove = (e) => {
    const scrollable = e.target.closest('[data-scrollable]');
    if (!scrollable) e.preventDefault();
  };

  React.useEffect(() => {
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => document.removeEventListener('touchmove', handleTouchMove, { passive: false });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.3, type: 'spring', damping: 20 }}
        className="w-[min(95vw,500px)] lg:w-full lg:max-w-2xl max-h-[90vh] lg:max-h-[95vh] card-glass border border-border rounded-t-2xl lg:rounded-2xl flex flex-col overflow-hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 border-b border-border/30 shrink-0 bg-card">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-foreground">Add Employee</h2>
            <p className="text-xs lg:text-sm text-muted-foreground mt-1">Add one employee or import your team in bulk.</p>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="sticky top-[60px] z-10 flex gap-2 px-4 lg:px-6 py-4 border-b border-border/30 shrink-0 bg-card">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isActive
                    ? 'glow-active'
                    : 'border-transparent text-muted-foreground hover:text-foreground glow-interactive'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" data-scrollable>
          <AnimatePresence mode="wait">
            {activeTab === 'single' && (
              <motion.div
                key="single"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-4 lg:p-6"
              >
                <SingleEntryForm onSuccess={() => { onSuccess?.(); handleClose(); }} />
              </motion.div>
            )}

            {activeTab === 'bulk' && (
              <motion.div
                key="bulk"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-4 lg:p-6"
              >
                <BulkImportTab onSuccess={() => { onSuccess?.(); handleClose(); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}