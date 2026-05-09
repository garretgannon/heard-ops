import { useState } from 'react';
import { FileText, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function SDSContextCard({ sds, compact = false }) {
  const [expanded, setExpanded] = useState(false);

  if (!sds) return null;
  if (Array.isArray(sds) && sds.length === 0) return null;

  const records = Array.isArray(sds) ? sds : [sds];

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <div key={record.id} className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">{record.chemical_name}</p>
              {record.vendor_brand && <p className="text-xs text-muted-foreground">{record.vendor_brand}</p>}
              {record.hazard_warnings && !compact && (
                <p className="text-xs text-amber-600 mt-1">{record.hazard_warnings}</p>
              )}
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground mt-0.5"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* PPE Badge */}
          {record.ppe_required && record.ppe_required.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {record.ppe_required.map((ppe) => (
                <span key={ppe} className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-600 rounded-full font-bold">
                  {ppe}
                </span>
              ))}
            </div>
          )}

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2 text-xs">
              {record.dilution_instructions && (
                <div>
                  <p className="font-bold text-muted-foreground">Dilution:</p>
                  <p className="text-foreground">{record.dilution_instructions}</p>
                </div>
              )}
              {record.first_aid_notes && (
                <div>
                  <p className="font-bold text-muted-foreground">First Aid:</p>
                  <p className="text-foreground">{record.first_aid_notes}</p>
                </div>
              )}
              {record.spill_response_notes && (
                <div>
                  <p className="font-bold text-muted-foreground">Spill Response:</p>
                  <p className="text-foreground">{record.spill_response_notes}</p>
                </div>
              )}
              {record.storage_instructions && (
                <div>
                  <p className="font-bold text-muted-foreground">Storage:</p>
                  <p className="text-foreground">{record.storage_instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* View PDF Link */}
          {record.sds_pdf_url && (
            <a href={record.sds_pdf_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
              <FileText className="h-3 w-3" /> View Full SDS
            </a>
          )}
        </div>
      ))}
    </div>
  );
}