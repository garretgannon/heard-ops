import { format } from 'date-fns';
import TaskVisual from '@/components/TaskVisual';

export default function PrepDetailModal({ item, employee, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full bg-card border-t border-border rounded-t-2xl overflow-y-auto max-h-[90vh] z-10" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        {/* Sticky Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <h2 className="text-lg font-bold text-foreground">{item.name}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-foreground text-2xl leading-none">×</button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Overview */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Overview</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/30 rounded border border-border p-2">
                <p className="text-[9px] text-muted-foreground font-semibold">Station</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{item.station_name}</p>
              </div>
              <div className="bg-muted/30 rounded border border-border p-2">
                <p className="text-[9px] text-muted-foreground font-semibold">Due Time</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{item.due_time || "—"}</p>
              </div>
              <div className="bg-muted/30 rounded border border-border p-2">
                <p className="text-[9px] text-muted-foreground font-semibold">Quantity</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{item.completed_qty || 0} / {item.quantity} {item.unit}</p>
              </div>
              <div className="bg-muted/30 rounded border border-border p-2">
                <p className="text-[9px] text-muted-foreground font-semibold">Progress</p>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {Math.round(((item.completed_qty || 0) / item.quantity) * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* Batch & Par Level */}
          {(item.yield || item.par_level) && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Batch Info</p>
              <div className="space-y-1 text-xs">
                {item.yield && (
                  <p className="text-foreground"><span className="text-muted-foreground">Batch Size:</span> {item.yield}</p>
                )}
                {item.par_level && (
                  <p className="text-foreground"><span className="text-muted-foreground">Par Level:</span> {item.par_level}</p>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {item.build_steps && item.build_steps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Instructions</p>
              <div className="space-y-2">
                {item.build_steps.map((step, idx) => (
                  <div key={idx} className="bg-muted/30 rounded border border-border p-2">
                    <p className="text-[10px] font-bold text-primary">Step {step.step_number || idx + 1}</p>
                    <p className="text-xs text-foreground mt-1 leading-relaxed">{step.instruction}</p>
                    <TaskVisual
                      type="prep-step"
                      name={step.instruction}
                      step={step.instruction}
                      imageUrl={step.image_url}
                      compact
                      className="mt-2 h-20 w-full rounded border border-border/60"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Storage & Allergens */}
          {(item.storage_location || item.allergens) && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Details</p>
              <div className="space-y-1 text-xs">
                {item.storage_location && (
                  <p className="text-foreground"><span className="text-muted-foreground">Storage:</span> {item.storage_location}</p>
                )}
                {item.allergens && (
                  <p className="text-foreground"><span className="text-muted-foreground">Allergens:</span> {item.allergens}</p>
                )}
              </div>
            </div>
          )}

          {/* Completion History */}
          {(item.completed_at || employee) && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Completion</p>
              <div className="bg-muted/30 rounded border border-border p-2 space-y-1 text-xs">
                {employee && (
                  <p className="text-foreground"><span className="text-muted-foreground">Completed by:</span> {employee.full_name}</p>
                )}
                {item.completed_at && (
                  <p className="text-foreground"><span className="text-muted-foreground">Time:</span> {format(new Date(item.completed_at), "MMM d, h:mm a")}</p>
                )}
              </div>
            </div>
          )}

          {/* Photo */}
          {item.photo_url && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Completion Photo</p>
              <img src={item.photo_url} alt="completion" className="w-full h-40 object-cover rounded-lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
