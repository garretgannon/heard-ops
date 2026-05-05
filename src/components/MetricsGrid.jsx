import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MetricsGrid({ metrics }) {
  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card border border-border rounded-xl p-2.5 text-center"
          >
            <p className={cn("text-lg font-bold", metric.color || "text-foreground")}>
              {metric.value}
            </p>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{metric.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}