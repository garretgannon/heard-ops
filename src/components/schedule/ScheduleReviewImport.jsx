import { Button } from "@/components/ui/button";

export default function ScheduleReviewImport({ pendingShifts, onPublish }) {
  return (
    <div className="space-y-4">
      {pendingShifts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No pending shifts to review. Upload a schedule to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{pendingShifts.length} shifts awaiting review</p>
          <div className="grid gap-3">
            {pendingShifts.map(shift => (
              <div key={shift.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{shift.employee_name}</p>
                    <p className="text-sm text-muted-foreground">{shift.date} • {shift.start_time} - {shift.end_time}</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={onPublish} className="w-full">Publish All Shifts</Button>
        </div>
      )}
    </div>
  );
}