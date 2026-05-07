import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Clock, DollarSign } from 'lucide-react';

const SUMMARY_ITEMS = [
  { label: 'Total Hours', value: '156.5', icon: Clock, color: 'text-blue-400' },
  { label: 'Labor Cost', value: '$4,250', icon: DollarSign, color: 'text-green-400' },
  { label: 'Labor %', value: '28.5%', icon: TrendingUp, color: 'text-amber-400', status: 'optimal' },
  { label: 'Alerts', value: '2', icon: AlertCircle, color: 'text-red-400', status: 'warning' },
];

export default function LaborSummaryCards({ shifts, weekDays }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {SUMMARY_ITEMS.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:border-border/80 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <Icon className={`h-5 w-5 ${item.color}`} />
              {item.status === 'warning' && (
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-1">{item.label}</p>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
}