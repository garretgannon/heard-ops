import { X, Check, Flag, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function LogDetailDrawer({ log, isOpen, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen || !log) return null;

  const submittedAt = new Date(log.created_date).toLocaleString();
  const resolvedAt = log.resolved_timestamp ? new Date(log.resolved_timestamp).toLocaleString() : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-card border-l border-border/20 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border/20 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Log Details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Title & Type */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">{log.title}</h3>
            <div className="flex gap-2">
              <span className="inline-block px-2 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {log.type.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${
                log.status === 'open' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                log.status === 'resolved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              }`}>
                {log.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Description */}
          {log.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground">{log.description}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/20">
            {log.employee_name && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Submitted By</p>
                <p className="text-sm font-semibold text-foreground">{log.employee_name}</p>
              </div>
            )}
            {log.location && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <p className="text-sm font-semibold text-foreground">{log.location}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Submitted</p>
              <p className="text-xs text-foreground">{submittedAt}</p>
            </div>
            {resolvedAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Resolved</p>
                <p className="text-xs text-foreground">{resolvedAt}</p>
              </div>
            )}
          </div>

          {/* Photos */}
          {log.photo_urls && log.photo_urls.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Photos</p>
              <div className="grid grid-cols-2 gap-2">
                {log.photo_urls.map((url, i) => (
                  <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-full h-24 rounded-lg object-cover border border-border/20" />
                ))}
              </div>
            </div>
          )}

          {/* Follow-up */}
          {log.follow_up_required && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex gap-2">
                <Flag className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-400">Follow-up Required</p>
                  {log.follow_up_due_date && <p className="text-xs text-amber-300 mt-1">Due: {new Date(log.follow_up_due_date).toLocaleDateString()}</p>}
                  {log.follow_up_assigned_to && <p className="text-xs text-amber-300">Assigned to: {log.follow_up_assigned_to}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Review Status */}
          {log.requires_review && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-purple-400">Requires Manager Review</p>
                  {log.reviewed_by && <p className="text-xs text-purple-300 mt-1">Reviewed by: {log.reviewed_by}</p>}
                  {log.review_status && <p className="text-xs text-purple-300">Status: {log.review_status}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex-shrink-0 border-t border-border/20 px-6 py-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-border/40 bg-background text-foreground font-semibold text-sm active:scale-95 transition-all"
          >
            Close
          </button>
          <button
            onClick={() => {
              onUpdate?.({ ...log, status: 'resolved' });
              onClose();
            }}
            className="flex-1 h-10 rounded-lg bg-green-600/80 text-foreground font-semibold text-sm active:scale-95 transition-all hover:bg-green-600 flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
}