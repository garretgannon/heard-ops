import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FilterChips({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="px-4 py-3 border-b border-border overflow-x-auto no-scrollbar w-full">
      <div className="pill-slider-container">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "glass-pill transition-all active:scale-95",
              activeFilter === filter.id && "glow-active"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}