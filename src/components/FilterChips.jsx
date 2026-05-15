import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FilterChips({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="px-4 py-3 border-b border-border overflow-x-auto scrollbar-hide">
      <div className="flex gap-1.5 pb-1">
        {filters.map(filter => (
          <motion.button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
              activeFilter === filter.id
                ? "glow-active"
                : "card-glass border border-border/40 text-muted-foreground glow-interactive"
            )}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}