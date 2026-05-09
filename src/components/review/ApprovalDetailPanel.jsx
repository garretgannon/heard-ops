import { useState } from 'react';
import { X, Check, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ApprovalDetailPanel({ approval, onClose, onApprove, onDeny, isProcessing }) {
  const [showDenyNotes, setShowDenyNotes] = useState(false);
  const [denyNotes, setDenyNotes] = useState('');

  const handleDeny = async () => {
    await onDeny?.(denyNotes);
    setShowDenyNotes(false);
    setDenyNotes('');
  };

  if (!approval) return null;

  return (
    <div className="h-full flex flex-col bg-card border-l border-border/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <h2 className="font-bold text-foreground">{approval.submission_type?.replace('_', ' ')}</h2>
        <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground font-bold mb-1">SUMMARY</p>
          <p className="text-sm text-foreground">{approval.summary}</p>
        </div>

        {approval.photo_url && (
          <img src={approval.photo_url} alt="Approval" className="w-full rounded-lg" />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-bold mb-1">SUBMITTED BY</p>
            <p className="text-sm font-semibold text-foreground">{approval.submitted_by_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-bold mb-1">PRIORITY</p>
            <p className={cn('text-sm font-bold', {
              'text-red-400': approval.priority === 'critical',
              'text-orange-400': approval.priority === 'high',
              'text-amber-400': approval.priority === 'medium',
            })}>{approval.priority}</p>
          </div>
          {approval.station_name && (
            <div>
              <p className="text-xs text-muted-foreground font-bold mb-1">STATION</p>
              <p className="text-sm text-foreground">{approval.station_name}</p>
            </div>
          )}
          {approval.location && (
            <div>
              <p className="text-xs text-muted-foreground font-bold mb-1">LOCATION</p>
              <p className="text-sm text-foreground">{approval.location}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border/30 p-4 space-y-2">
        {!showDenyNotes ? (
          <>
            <button onClick={() => onApprove?.()} disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600/80 text-white text-sm font-bold hover:bg-green-600 transition-all disabled:opacity-60">
              <Check className="h-4 w-4" /> Approve
            </button>
            <button onClick={() => setShowDenyNotes(true)} disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all disabled:opacity-60">
              <Ban className="h-4 w-4" /> Deny
            </button>
          </>
        ) : (
          <>
            <textarea value={denyNotes} onChange={e => setDenyNotes(e.target.value)}
              placeholder="Why are you denying this?" rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none" />
            <div className="flex gap-2">
              <button onClick={() => { setShowDenyNotes(false); setDenyNotes(''); }}
                className="flex-1 py-2 rounded-lg border border-border text-sm font-bold text-foreground hover:bg-secondary">
                Cancel
              </button>
              <button onClick={handleDeny} disabled={isProcessing}
                className="flex-1 py-2 rounded-lg bg-red-600/80 text-white text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-60">
                Deny
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}