import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle2, User } from 'lucide-react';

const TODAY_SHIFTS = [
  { id: 1, employee: 'Sarah Chen', role: 'Manager', time: '10:00 AM - 6:00 PM', status: 'clocked_in' },
  { id: 2, employee: 'Marcus Johnson', role: 'Server', time: '11:00 AM - 9:00 PM', status: 'arrived' },
  { id: 3, employee: 'Alex Rivera', role: 'Line Cook', time: '3:00 PM - 11:00 PM', status: 'pending' },
  { id: 4, employee: 'Jamie Lee', role: 'Bartender', time: '5:00 PM - 1:00 AM', status: 'pending' },
];

export default function TodayShiftView({ shifts }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'clocked_in': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'arrived': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'pending': return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'late': return 'bg-red-500/20 text-red-300 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'clocked_in': return <CheckCircle2 className="h-4 w-4" />;
      case 'arrived': return <CheckCircle2 className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'late': return <AlertCircle className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'clocked_in': return 'Clocked In';
      case 'arrived': return 'Arrived';
      case 'pending': return 'Pending';
      case 'late': return 'Late';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border/50 bg-card/30">
          <p className="text-xs text-muted-foreground font-medium mb-1">Staffed</p>
          <p className="text-2xl font-bold text-foreground">12/16</p>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/30">
          <p className="text-xs text-muted-foreground font-medium mb-1">Labor %</p>
          <p className="text-2xl font-bold text-foreground">24.3%</p>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/30">
          <p className="text-xs text-muted-foreground font-medium mb-1">Late</p>
          <p className="text-2xl font-bold text-red-400">2</p>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/30">
          <p className="text-xs text-muted-foreground font-medium mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-400">4</p>
        </div>
      </div>

      <div className="space-y-3">
        {TODAY_SHIFTS.map((shift, idx) => (
          <motion.div
            key={shift.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-4 rounded-lg border flex items-center justify-between ${getStatusColor(shift.status)}`}
          >
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(shift.status)}
              <div>
                <p className="font-bold text-foreground">{shift.employee}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{shift.role} • {shift.time}</p>
              </div>
            </div>
            <p className="text-xs font-bold px-2 py-1 rounded-md bg-background/30">
              {getStatusLabel(shift.status)}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}