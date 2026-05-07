import { X, MapPin, User, Clock, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const LOG_TYPE_LABELS = {
  temperature: 'Temperature Log',
  cleaning: 'Cleaning Log',
  maintenance: 'Maintenance Request',
  incident: 'Incident Report',
  waste: 'Waste Log',
  eighty_six: '86 Item',
  employee_note: 'Employee Note',
  manager_note: 'Manager Note',
  shift_handoff: 'Shift Handoff',
  prep: 'Prep Log',
  sidework: 'Side Work Log',
};

export default function LogsDetailDrawer({ log, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  if (!isOpen || !log) return null;

  const handleMarkReviewed = async () => {
    setLoading(true);
    try {
      await base44.entities.UnifiedLog.update(log.id, {
        requires_review: false,
        reviewed_timestamp: new Date().toISOString(),
      });
      toast.success('Log marked as reviewed');
      onUpdate?.();
      onClose();
    } catch (err) {
      toast.error('Failed to mark as reviewed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (newStatus) => {
    setLoading(true);
    try {
      await base44.entities.UnifiedLog.update(log.id, { status: newStatus });
      toast.success(`Log status changed to ${newStatus}`);
      onUpdate?.();
      onClose();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 lg:z-30">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 w-full md:w-96 bg-card border-l border-border/20 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border/20 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Log Details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Title & Type */}
          <div>
            <h3 className="text-sm text-muted-foreground uppercase font-bold mb-2">Title</h3>
            <p className="text-foreground font-semibold">{log.title}</p>
            <div className="mt-2 inline-block px-2 py-1 rounded-md bg-primary/15 text-primary text-xs font-bold">
              {LOG_TYPE_LABELS[log.type] || log.type}
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-sm text-muted-foreground uppercase font-bold mb-2">Status</h3>
            <div className="flex gap-2 flex-wrap">
              {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleChangeStatus(s)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    log.status === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border/40 text-muted-foreground hover:border-border/60'
                  } disabled:opacity-50`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-3">
            {log.employee_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Submitted by:</span>
                <span className="text-foreground font-semibold">{log.employee_name}</span>
              </div>
            )}
            {log.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Location:</span>
                <span className="text-foreground font-semibold">{log.location}</span>
              </div>
            )}
            {log.created_date && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Time:</span>
                <span className="text-foreground font-semibold">
                  {new Date(log.created_date).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {log.description && (
            <div>
              <h3 className="text-sm text-muted-foreground uppercase font-bold mb-2">Notes</h3>
              <p className="text-foreground text-sm leading-relaxed">{log.description}</p>
            </div>
          )}

          {/* Follow-up Info */}
          {log.follow_up_required && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">Follow-up Required</span>
              </div>
              {log.follow_up_due_date && (
                <p className="text-xs text-amber-300">Due: {new Date(log.follow_up_due_date).toLocaleDateString()}</p>
              )}
            </div>
          )}

          {/* Badges */}
          {log.requires_review && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-bold text-purple-400">Requires Manager Review</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border/20 px-6 py-4 space-y-2">
          {log.requires_review && (
            <button
              onClick={handleMarkReviewed}
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Mark Reviewed
              </div>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full h-11 rounded-lg border border-border/40 text-foreground font-bold text-sm hover:bg-muted/20 active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}