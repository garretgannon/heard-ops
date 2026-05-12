import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MetricsGrid({ metrics }) {
  return (
    <div className="px-4 py-2 border-b border-border">
      <div className="grid grid-cols-2 gap-1.5">
        {metrics.map((metric, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card-glass border border-border rounded-lg p-2 text-center"
          >
            <p className={cn("text-base font-bold", metric.color || "text-foreground")}>
              {metric.value}
            </p>
            <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">{metric.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}