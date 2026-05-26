import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useSimulator } from '@/lib/SimulatorContext';

export default function DemoRestaurantSim({ onBack }) {
  const { setIsSimulating, setSimulationMode } = useSimulator();

  const handleEnter = () => {
    setIsSimulating(true);
    setSimulationMode('demo');
    // This would navigate to the actual app with demo data
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Demo Restaurant Mode</h2>
          <p className="text-sm text-muted-foreground">Fully populated fake restaurant for testing</p>
        </div>
      </div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6"
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl">🍽️</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-1">Demo Restaurant</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A fully populated fake restaurant with sample data across all modules. Click around, test all roles, and verify permissions.
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>✓ 12 fake employees with different roles</p>
              <p>✓ Prep lists, side work, cleaning tasks</p>
              <p>✓ Temperature logs, maintenance requests</p>
              <p>✓ Schedules, handoffs, incidents</p>
              <p>✓ Recipes, build cards, vendors</p>
              <p>✓ All data flagged as demo &mdash; safely deleted on reset</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Role testing */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border card-glass p-6"
      >
        <h3 className="text-lg font-bold text-foreground mb-4">Test All Roles</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Switch between any role to verify permissions, visibility, and dashboard customization.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['Owner', 'Manager', 'Chef', 'Lead', 'Cook', 'Server', 'Dishwasher', 'Host'].map((role) => (
            <div
              key={role}
              className="p-2 rounded-lg liquid-card text-xs font-bold text-center text-muted-foreground"
            >
              {role}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sample data breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {[
          { title: 'Employees', count: '12', icon: '👥' },
          { title: 'Schedules', count: '3 weeks', icon: '📅' },
          { title: 'Prep Lists', count: '8', icon: '👨‍🍳' },
          { title: 'Recipes', count: '24', icon: '🍜' },
          { title: 'Temp Logs', count: '40+ entries', icon: '🌡️' },
          { title: 'Tasks', count: '100+', icon: '✓' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="rounded-lg border border-border bg-background p-4 text-center"
          >
            <span className="text-2xl">{item.icon}</span>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">{item.title}</p>
            <p className="text-lg font-bold text-foreground mt-1">{item.count}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Testing tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6"
      >
        <p className="text-sm font-bold text-purple-300 mb-3">💡 Testing Tips</p>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li>• Switch roles to verify permission gates work correctly</li>
          <li>• Check that manager-only data is hidden from staff</li>
          <li>• Test completing tasks, logs, and handoffs</li>
          <li>• Verify the Today View layout for each role</li>
          <li>• Look for empty states or missing data indicators</li>
          <li>• Try creating new entries to test forms</li>
        </ul>
      </motion.div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 rounded-lg border border-border card-glass text-foreground font-bold"
        >
          Back
        </button>
        <button
          onClick={handleEnter}
          className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold"
        >
          Enter Demo Restaurant
        </button>
      </div>

      {/* Warning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200"
      >
        <p className="font-bold mb-1">⚠️ Simulator Mode Active</p>
        <p>
          All data in demo mode is sandboxed. Use the role switcher to test permissions. Return to Admin View to reset or exit simulation.
        </p>
      </motion.div>
    </motion.div>
  );
}