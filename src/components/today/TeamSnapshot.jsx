import { Users, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TeamSnapshot() {
  const navigate = useNavigate();

  // Placeholder counts—replace with real data when Employee/Shift entities exist
  const onShiftCount = 12;
  const onBreakCount = 2;
  const roles = [
    { name: 'Kitchen Lead', count: 2 },
    { name: 'Cooks', count: 3 },
    { name: 'Servers', count: 5 },
    { name: 'Bartender', count: 2 },
  ];

  return (
    <div className="rounded-xl border border-border/30 card-glass p-5">
      <h3 className="font-bold text-foreground text-sm mb-4">Team Snapshot</h3>
      <div className="space-y-3">
        {/* On Shift */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-400" />
            <span className="text-xs font-semibold text-foreground">On Shift</span>
          </div>
          <span className="text-sm font-bold text-green-400">{onShiftCount}</span>
        </div>

        {/* On Break */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-semibold text-foreground">On Break</span>
          </div>
          <span className="text-sm font-bold text-yellow-400">{onBreakCount}</span>
        </div>

        {/* Role breakdown */}
        <div className="pt-2 border-t border-border/20 space-y-1.5">
          {roles.map((role) => (
            <div key={role.name} className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{role.name}</span>
              <span className="font-semibold text-foreground">{role.count}</span>
            </div>
          ))}
        </div>

        {/* View Team Button */}
        <button
          onClick={() => navigate('/team')}
          className="mt-3 w-full h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 active:scale-95 transition-all"
        >
          View Team
        </button>
      </div>
    </div>
  );
}