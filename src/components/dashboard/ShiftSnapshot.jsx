import { Clock, Users, AlertCircle } from "lucide-react";

export default function ShiftSnapshot({ data }) {
  const { staffCount = 0, shiftsStarting = 0, alertCount = 0 } = data;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Today's Shift Snapshot</h2>
      <div className="grid grid-cols-3 gap-2 lg:gap-3">
        <div className="bg-card border-2 border-border rounded-xl p-3 lg:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold text-muted-foreground">Staff On Duty</span>
          </div>
          <p className="text-2xl lg:text-xl font-bold">{staffCount}</p>
        </div>
        <div className="bg-card border-2 border-border rounded-xl p-3 lg:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold text-muted-foreground">Shifts Starting</span>
          </div>
          <p className="text-2xl lg:text-xl font-bold">{shiftsStarting}</p>
        </div>
        <div className={`rounded-xl p-3 lg:p-4 border-2 ${alertCount > 0 ? "bg-red-500/10 border-red-500/30" : "bg-card border-border"}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" style={{ color: alertCount > 0 ? "#ef4444" : "#6b7280" }} />
            <span className="text-xs font-semibold text-muted-foreground">Alerts</span>
          </div>
          <p className={`text-2xl lg:text-xl font-bold ${alertCount > 0 ? "text-red-600" : ""}`}>{alertCount}</p>
        </div>
      </div>
    </div>
  );
}