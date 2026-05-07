import { motion } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { Clock, MessageSquare, Users, MoreVertical } from 'lucide-react';

const MOCK_EMPLOYEE_SHIFTS = [
  { id: 1, name: 'Alex M.', role: 'Manager', time: '8a – 4p', color: 'bg-blue-500' },
  { id: 2, name: 'Jamie L.', role: 'Line Chef', time: '6a – 2p', color: 'bg-teal-500' },
  { id: 3, name: 'Taylor S.', role: 'Server', time: '4p – 12a', color: 'bg-purple-500' },
  { id: 4, name: 'Morgan K.', role: 'Server', time: '4p – 10p', color: 'bg-pink-500' },
  { id: 5, name: 'Casey M.', role: 'Line Cook', time: '10a – 6p', color: 'bg-orange-500' },
  { id: 6, name: 'Riley D.', role: 'Prep Cook', time: '8a – 3p', color: 'bg-amber-500' },
  { id: 7, name: 'Jordan P.', role: 'Dishwasher', time: '4p – 12a', color: 'bg-red-500' },
  { id: 8, name: 'Avery S.', role: 'Host', time: '11a – 5p', color: 'bg-slate-500' },
];

export default function MobileSchedulePreview({ shifts, employees, currentWeek }) {
  const today = format(currentWeek, 'MMM d');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Schedule</h3>
            <p className="text-xs text-muted-foreground">{today} – May 25</p>
          </div>
          <button className="h-6 w-6 rounded-lg hover:bg-card flex items-center justify-center">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Staffing Summary */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-card/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Staffed</p>
            <p className="text-lg font-bold text-foreground">8/12</p>
          </div>
          <div className="p-2 rounded-lg bg-card/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Hours</p>
            <p className="text-lg font-bold text-foreground">62h</p>
          </div>
          <div className="p-2 rounded-lg bg-card/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Labor %</p>
            <p className="text-lg font-bold text-foreground">18.0%</p>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {MOCK_EMPLOYEE_SHIFTS.map((emp, idx) => (
          <motion.div
            key={emp.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            className="p-2 rounded-lg bg-card/30 border border-border/30 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-3 w-3 rounded-full ${emp.color}`} />
              <p className="text-xs font-semibold text-foreground flex-1">{emp.name}</p>
              <p className="text-[10px] text-muted-foreground">{emp.role}</p>
            </div>
            <p className="text-xs text-muted-foreground ml-5">{emp.time}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/20">
        <button className="h-8 rounded-lg bg-card/50 border border-border/30 text-xs font-medium text-foreground hover:bg-card transition-colors flex items-center justify-center gap-1.5">
          <Clock className="h-3 w-3" />
          Today
        </button>
        <button className="h-8 rounded-lg bg-card/50 border border-border/30 text-xs font-medium text-foreground hover:bg-card transition-colors flex items-center justify-center gap-1.5">
          <MessageSquare className="h-3 w-3" />
          Message
        </button>
        <button className="h-8 rounded-lg bg-card/50 border border-border/30 text-xs font-medium text-foreground hover:bg-card transition-colors flex items-center justify-center gap-1.5">
          <Users className="h-3 w-3" />
          Team
        </button>
      </div>
    </div>
  );
}