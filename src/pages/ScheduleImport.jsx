import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { haptics } from '@/utils/haptics';
import { Upload, Calendar, History, ChevronRight } from 'lucide-react';
import ScheduleImportFlow from '@/components/schedule/ScheduleImportFlow';
import R365StagedImporter from '@/components/schedule/R365StagedImporter';

export default function ScheduleImport() {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [importType, setImportType] = useState(null);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    base44.entities.ScheduleImportBatch.list('-uploadedAt', 20).then(setBatches).catch(() => {});
  }, []);

  const handleImportComplete = () => {
    setImportType(null);
    base44.entities.ScheduleImportBatch.list('-uploadedAt', 20).then(setBatches).catch(() => {});
  };

  if (!isAdmin) {
    return (
      <div className="pb-28 px-4 py-4">
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Only managers can import schedules.</p>
        </div>
      </div>
    );
  }

  if (importType === 'r365') {
    return <R365StagedImporter onClose={() => setImportType(null)} onComplete={handleImportComplete} user={user} />;
  }

  if (importType === 'csv') {
    return <ScheduleImportFlow onClose={() => setImportType(null)} onComplete={handleImportComplete} user={user} />;
  }

  if (importType) {
    return null; // Loading
  }

  return (
    <div className="pb-28">
      <div className="bg-card border-b border-border sticky top-0 z-10 px-4 py-3">
        <h1 className="text-lg font-extrabold text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" /> Schedule Import
        </h1>
        <p className="text-[11px] text-muted-foreground mt-1">Bulk upload weekly staff schedules from CSV, Excel, or R365.</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="card-glass border border-border rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-foreground mb-2">Import Type</p>
          <button
            onClick={() => { haptics.medium?.(); setImportType('r365'); }}
            className="w-full bg-primary/10 border border-primary/20 text-primary font-bold py-3 rounded-lg text-sm flex items-center justify-between px-3"
          >
            <span>R365 Schedule</span>
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => { haptics.medium?.(); setImportType('csv'); }}
            className="w-full bg-muted text-foreground font-bold py-3 rounded-lg text-sm flex items-center justify-between px-3"
          >
            <span>CSV/Excel</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => { haptics.light?.(); navigate('/schedule'); }}
          className="w-full card-glass border border-border text-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Calendar className="h-5 w-5" /> View Schedule
        </button>

        {batches.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-6 mb-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Imports</p>
            </div>

            <div className="space-y-2">
              {batches.map(batch => (
                <div key={batch.id} className="card-glass border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-bold text-foreground">{batch.fileName}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      batch.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                      batch.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {batch.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    {batch.weekStartDate} to {batch.weekEndDate}
                  </p>
                  <div className="grid grid-cols-4 gap-1 text-center text-[9px]">
                    <div>
                      <p className="font-bold text-foreground">{batch.shiftsCreated || 0}</p>
                      <p className="text-muted-foreground">Shifts</p>
                    </div>
                    <div>
                      <p className="font-bold text-primary">{batch.employeesCreated || 0}</p>
                      <p className="text-muted-foreground">Employees</p>
                    </div>
                    <div>
                      <p className="font-bold text-amber-400">{batch.rowsSkipped || 0}</p>
                      <p className="text-muted-foreground">Skipped</p>
                    </div>
                    <div>
                      <p className="font-bold text-muted-foreground">{batch.totalRows || 0}</p>
                      <p className="text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;