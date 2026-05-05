import { motion } from "framer-motion";
import PageHeader from "./PageHeader";
import FilterChips from "./FilterChips";
import MetricsGrid from "./MetricsGrid";

export default function StandardPageShell({
  title,
  subtitle,
  icon,
  metrics = [],
  filters = [],
  activeFilter = "all",
  onFilterChange,
  notificationCount = 0,
  children,
}) {
  return (
    <motion.div
      className="min-h-screen bg-background pb-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        notificationCount={notificationCount}
      />

      {metrics.length > 0 && <MetricsGrid metrics={metrics} />}

      {filters.length > 0 && (
        <FilterChips
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
        />
      )}

      {children}
    </motion.div>
  );
}