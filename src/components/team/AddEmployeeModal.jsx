import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SingleEntryForm from './SingleEntryForm';
import BulkImportTab from './BulkImportTab';

const TABS = [
  { id: 'single', label: 'Single Entry', icon: User },
  { id: 'bulk', label: 'Bulk Import', icon: Upload },
];

export default function AddEmployeeModal({ onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('single');

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ duration: 0.2, type: 'spring', damping: 25 }}
        className="w-full lg:w-full lg:max-w-2xl h-[90vh] lg:h-auto lg:max-h-[90vh] bg-card border border-border rounded-t-2xl lg:rounded-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-border/30 shrink-0">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-foreground">Add Employee</h2>
            <p className="text-xs lg:text-sm text-muted-foreground mt-1">Add one employee or import your team in bulk.</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 lg:px-6 py-4 border-b border-border/30 shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
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
                <SingleEntryForm onSuccess={() => { onSuccess?.(); onClose(); }} />
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
                <BulkImportTab onSuccess={() => { onSuccess?.(); onClose(); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}