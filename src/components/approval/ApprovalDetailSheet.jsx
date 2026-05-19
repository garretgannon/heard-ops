import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, XCircle, Clock, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const APPROVAL_TYPES = {
  prep: 'Prep Item Review',
  temperature: 'Temperature Alert',
  maintenance: 'Maintenance Request',
  employee: 'Employee Log',
  waste: 'Waste/86 Entry',
  schedule: 'Schedule Request',
  timeoff: 'Request Off',
  trade: 'Shift Trade',
  beo: 'BEO Prep Adjustment',
  recipe: 'Recipe/Build Card Change',
  vendor: 'Vendor/Item Cost Change',
};

const collectImages = (...values) => {
  const images = [];
  values.forEach((value) => {
    if (typeof value === 'string' && value.trim()) images.push(value);
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === 'string' && item.trim()) images.push(item);
      });
    }
  });
  return [...new Set(images)];
};

export default function ApprovalDetailSheet({ approval, onApprove, onDeny, onClose }) {
  const [approving, setApproving] = useState(false);
  const [denying, setDenying] = useState(false);

  const handleApproveClick = async () => {
    setApproving(true);
    await onApprove();
    onClose();
  };

  const handleDenyClick = async () => {
    setDenying(true);
    await onDeny();
    onClose();
  };

  const submittedAt = approval.created_date ? format(parseISO(approval.created_date), 'MMM d, h:mm a') : 'N/A';
  const submittedBy = approval.created_by || 'Unknown';
  const images = collectImages(
    approval.photo_url,
    approval.photo_urls,
    approval.completion_photo_url,
    approval.completion_photo_urls,
    approval.manager_attachment_urls,
    approval.completion_attachment_urls,
    approval.attachment_urls,
    approval.master_photo_url,
    approval.image_url
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 z-50 max-h-[90vh] bg-card rounded-t-3xl border-t border-border/30 flex flex-col overflow-hidden"
      >
        {/* Sticky header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border/20 bg-card/95 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-foreground">Details</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Submission info */}
          <div className="rounded-lg bg-background border border-border/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Submitted {submittedAt}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="text-xs">by {submittedBy}</span>
            </div>
          </div>

          {/* Approval type & description */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Type</p>
            <p className="text-sm text-foreground">{APPROVAL_TYPES[approval.approval_type] || 'Unknown'}</p>
          </div>

          {/* Dynamic content based on type */}
          {approval.approval_type === 'prep' && (
            <>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Item</p>
                <p className="text-sm text-foreground">{approval.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Quantity</p>
                <p className="text-sm text-foreground">{approval.quantity} {approval.unit}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Status</p>
                <p className="text-sm text-foreground capitalize">{approval.completion_status || 'Pending'}</p>
              </div>
              {approval.completion_notes && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm text-foreground">{approval.completion_notes}</p>
                </div>
              )}
            </>
          )}

          {approval.approval_type === 'temperature' && (
            <>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Location</p>
                <p className="text-sm text-foreground">{approval.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Temperature</p>
                <p className="text-sm text-foreground">{approval.temperature}°F</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Alert reason</p>
                <p className="text-sm text-foreground">{approval.alert_reason || 'Out of range'}</p>
              </div>
            </>
          )}

          {approval.approval_type === 'timeoff' && (
            <>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Employee</p>
                <p className="text-sm text-foreground">{approval.employee_name || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">From</p>
                  <p className="text-sm text-foreground">{approval.start_date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">To</p>
                  <p className="text-sm text-foreground">{approval.end_date || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Reason</p>
                <p className="text-sm text-foreground">{approval.reason || 'Not specified'}</p>
              </div>
            </>
          )}

          {/* Generic summary for unmapped types */}
          {!['prep', 'temperature', 'timeoff'].includes(approval.approval_type) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Summary</p>
              <p className="text-sm text-foreground">{approval.description || approval.title || 'No additional details available'}</p>
            </div>
          )}

          {images.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Photos</p>
              <div className="grid grid-cols-2 gap-2">
                {images.map((src) => (
                  <img key={src} src={src} alt="Approval attachment" className="aspect-square w-full rounded-lg object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer with actions */}
        <div className="sticky bottom-0 border-t border-border/20 bg-card/95 backdrop-blur-sm px-6 py-4 flex gap-2">
          <button onClick={handleDenyClick} disabled={denying || approving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all disabled:opacity-50">
            <XCircle className="h-4 w-4" /> {denying ? 'Denying…' : 'Deny'}
          </button>
          <button onClick={handleApproveClick} disabled={approving || denying}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-sm hover:bg-green-500/20 transition-all disabled:opacity-50">
            <Check className="h-4 w-4" /> {approving ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
