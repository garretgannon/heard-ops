import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { haptics } from '@/utils/haptics';
import { Upload, Calendar, History, ChevronRight } from 'lucide-react';
import ScheduleImportFlow from '@/components/schedule/ScheduleImportFlow';

export default function ScheduleImport() {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [showImport, setShowImport] = useState(false);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    base44.entities.ScheduleImportBatch.list('-uploadedAt', 20).then(setBatches).catch(() => {});
  }, []);

  const handleImportComplete = () => {
    setShowImport(false);
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

  if (showImport) {
    return <ScheduleImportFlow onClose={() => setShowImport(false)} onComplete={handleImportComplete} user={user} />;
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
       <div className="flex gap-2">
         <button
           onClick={() => { haptics.medium?.(); setShowImport(true); }}
           className="flex-1 bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
         >
           <Upload className="h-5 w-5" /> Import
         </button>
         <button
           onClick={() => { haptics.light?.(); navigate('/schedule'); }}
           className="flex-1 bg-card border border-border text-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
         >
           <Calendar className="h-5 w-5" /> View
         </button>
       </div>

        {batches.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-6 mb-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Imports</p>
            </div>

            <div className="space-y-2">
              {batches.map(batch => (
                <div key={batch.id} className="bg-card border border-border rounded-lg p-3">
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