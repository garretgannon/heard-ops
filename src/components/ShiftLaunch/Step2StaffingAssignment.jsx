import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

export default function Step2StaffingAssignment({ onComplete }) {
  const [staffing, setStaffing] = useState([]);
  const [stations, setStations] = useState([]);
  const [assigned, setAssigned] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [staffRecords, stationRecords] = await Promise.all([
          base44.entities.User.list().catch(() => []),
          base44.entities.Station.list().catch(() => []),
        ]);
        setStaffing(staffRecords.filter(s => s.role !== 'admin'));
        setStations(stationRecords);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleAssigned = (staffId) => {
    haptics.light?.();
    const newAssigned = new Set(assigned);
    if (newAssigned.has(staffId)) {
      newAssigned.delete(staffId);
    } else {
      newAssigned.add(staffId);
    }
    setAssigned(newAssigned);
  };

  const handleComplete = () => {
    if (assigned.size === 0) return;
    haptics.medium?.();
    onComplete(2, { assignedStaff: Array.from(assigned), totalStaffing: staffing.length });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Staffing Assignment</h2>
        <p className="text-xs text-secondary-text">Confirm which staff are present and working today</p>
      </div>

      <div className="space-y-2">
        {staffing.length === 0 ? (
          <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">No staff members on record</p>
          </div>
        ) : (
          staffing.map(staff => (
            <button
              key={staff.id}
              onClick={() => handleToggleAssigned(staff.id)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center gap-3',
                assigned.has(staff.id)
                  ? 'bg-primary/15 border-primary/30 ring-2 ring-primary/40'
                  : 'bg-card border-border hover:bg-muted'
              )}
            >
              <div className={cn('h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all', assigned.has(staff.id) ? 'bg-primary border-primary' : 'border-border')}>
                {assigned.has(staff.id) && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{staff.full_name}</p>
                <p className="text-[10px] text-secondary-text capitalize">{staff.role}</p>
              </div>
            </button>
          ))
        )}
      </div>

      <button
        onClick={handleComplete}
        disabled={assigned.size === 0}
        className={cn(
          'w-full h-9 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all mt-4',
          assigned.size > 0
            ? 'bg-primary text-primary-foreground active:scale-95'
            : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
        )}
      >
        <Users className="h-4 w-4" />
        Continue ({assigned.size} assigned)
      </button>
    </div>
  );
}