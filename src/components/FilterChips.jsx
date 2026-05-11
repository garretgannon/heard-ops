import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FilterChips({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="px-4 py-3 border-b border-border overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 pb-2 -mx-1 px-1">
        {filters.map(filter => (
          <motion.button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95",
              activeFilter === filter.id
                ? "glow-active"
                : "bg-card border border-border text-foreground glow-interactive"
            )}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}