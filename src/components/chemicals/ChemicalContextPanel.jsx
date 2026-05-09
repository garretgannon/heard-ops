import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, AlertTriangle, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChemicalContextPanel({ areaId, stationId, equipmentId, taskId, className = '' }) {
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setLoading(true);
    const filters = [];
    if (areaId) filters.push(base44.entities.Chemical.filter({ assigned_areas: { $contains: areaId } }, 'name', 50));
    if (stationId) filters.push(base44.entities.Chemical.filter({ assigned_stations: { $contains: stationId } }, 'name', 50));
    if (equipmentId) filters.push(base44.entities.Chemical.filter({ assigned_equipment: { $contains: equipmentId } }, 'name', 50));

    if (filters.length === 0) {
      setChemicals([]);
      setLoading(false);
      return;
    }

    Promise.all(filters)
      .then(results => {
        const merged = [...new Map(results.flat().map(c => [c.id, c])).values()];
        setChemicals(merged);
      })
      .catch(() => setChemicals([]))
      .finally(() => setLoading(false));
  }, [areaId, stationId, equipmentId, taskId]);

  if (loading || chemicals.length === 0) return null;

  return (
    <div className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-400" />
          <p className="text-sm font-bold text-foreground">Chemicals ({chemicals.length})</p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border/50 p-3 space-y-2 max-h-96 overflow-y-auto">
          {chemicals.map(chemical => (
            <div key={chemical.id} className="bg-background/50 border border-border/50 rounded-lg p-2.5">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">{chemical.name}</p>
                  {chemical.dilution_ratio && <p className="text-[9px] text-muted-foreground mt-0.5">Dilution: 1:{chemical.dilution_ratio}</p>}
                </div>
                {chemical.sds_url && (
                  <a href={chemical.sds_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex-shrink-0">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {/* Hazards */}
              {chemical.hazard_warnings && (
                <div className="flex items-start gap-1.5 mb-1.5 p-1.5 bg-red-500/10 rounded">
                  <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[8px] text-red-300/80 leading-tight">{chemical.hazard_warnings}</p>
                </div>
              )}

              {/* PPE */}
              {chemical.ppe_required?.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {chemical.ppe_required.map(ppe => (
                    <span key={ppe} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {ppe}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}