import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function ScheduleFeatures({ features }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Smart Scheduling
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Fast. Flexible. Built for Restaurants.
        </p>
      </div>

      <div className="space-y-2">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-card/50 transition-colors cursor-pointer group"
          >
            <div className="h-5 w-5 rounded-full border border-border flex items-center justify-center mt-0.5 group-hover:border-primary group-hover:bg-primary/10 transition-all">
              <Check className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{feature.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t border-border/20">
        <button className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition-all">
          Auto Schedule
        </button>
      </div>
    </div>
  );
}