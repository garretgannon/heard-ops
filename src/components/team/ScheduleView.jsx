import { AlertCircle } from 'lucide-react';

export default function ScheduleView({ schedules, openShifts, callOuts }) {
  const today = new Date().toLocaleDateString();

  return (
    <div className="space-y-6">
      {/* Today's Schedule */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Today's Schedule</h3>
        {schedules?.length > 0 ? (
          <div className="space-y-2">
            {schedules.map((shift) => (
              <div key={shift.id} className="p-3 rounded-lg card-glass border border-border/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{shift.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{shift.role} • {shift.station}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary">{shift.start_time} - {shift.end_time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No scheduled shifts for today</p>
        )}
      </div>

      {/* Call-outs */}
      {callOuts?.length > 0 && (
        <div className="space-y-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-bold text-red-400">Call-outs ({callOuts.length})</h3>
          </div>
          <div className="space-y-1 text-xs text-red-300">
            {callOuts.map((callout) => (
              <p key={callout.id}>• {callout.employee_name} - {callout.time}</p>
            ))}
          </div>
        </div>
      )}

      {/* Open Shifts */}
      {openShifts?.length > 0 && (
        <div className="space-y-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <h3 className="text-sm font-bold text-amber-400">Open Shifts ({openShifts.length})</h3>
          <div className="space-y-2">
            {openShifts.map((shift) => (
              <div key={shift.id} className="text-xs text-amber-300">
                <p>{shift.role} • {shift.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coverage View */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Coverage by Role</h3>
        <div className="space-y-2 text-xs">
          <div className="p-2 rounded-lg card-glass border border-border/40 flex items-center justify-between">
            <span className="text-muted-foreground">Kitchen Lead</span>
            <span className="text-foreground font-bold">2/2</span>
          </div>
          <div className="p-2 rounded-lg card-glass border border-border/40 flex items-center justify-between">
            <span className="text-muted-foreground">Servers</span>
            <span className="text-foreground font-bold">3/4</span>
          </div>
          <div className="p-2 rounded-lg card-glass border border-border/40 flex items-center justify-between">
            <span className="text-muted-foreground">Bussers</span>
            <span className="text-amber-400 font-bold">1/2</span>
          </div>
        </div>
      </div>
    </div>
  );
}