import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowLeft } from 'lucide-react';
import { useSimulator } from '@/lib/SimulatorContext';
import { haptics } from '@/utils/haptics';

const ROLES = [
  { id: 'owner', label: 'Owner', icon: '👑' },
  { id: 'manager', label: 'General Manager', icon: '💼' },
  { id: 'chef', label: 'Executive Chef', icon: '👨‍🍳' },
  { id: 'lead', label: 'Kitchen Lead', icon: '👨‍✈️' },
  { id: 'cook', label: 'Line Cook', icon: '🍳' },
  { id: 'prep', label: 'Prep Cook', icon: '🥘' },
  { id: 'dishwasher', label: 'Dishwasher', icon: '🧼' },
  { id: 'server', label: 'Server', icon: '🍽️' },
  { id: 'bartender', label: 'Bartender', icon: '🍹' },
  { id: 'host', label: 'Host', icon: '📋' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'new_hire', label: 'New Employee', icon: '👤' },
];

export default function RoleSwitcher({ onBack }) {
  const { simulatedRole, setSimulatedRole } = useSimulator();
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleSwitch = (role) => {
    haptics.medium?.();
    setSimulatedRole(role);
    setIsOpen(false);
  };

  const currentRole = ROLES.find(r => r.id === simulatedRole?.id);

  return (
    <>
      {/* Sticky banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 border-b border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-300">Viewing as</p>
              <p className="text-sm font-bold text-foreground">
                {currentRole?.icon} {currentRole?.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 hover:bg-purple-500/30 transition-all"
            >
              Switch Role
            </button>
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Exit Demo
            </button>
          </div>
        </div>
      </motion.div>

      {/* Role selector dropdown */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-16 left-4 right-4 z-40 card-glass border border-border rounded-2xl shadow-lg max-w-sm mx-auto"
        >
          <div className="p-4 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select a role</p>
          </div>

          <div className="grid grid-cols-3 gap-2 p-4 max-h-80 overflow-y-auto">
            {ROLES.map((role) => (
              <motion.button
                key={role.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRoleSwitch(role)}
                className={`p-3 rounded-lg border transition-all text-center ${
                  simulatedRole?.id === role.id
                    ? 'bg-purple-500/30 border-purple-500/50 text-purple-300'
                    : 'bg-background border-border text-muted-foreground hover:border-border/50'
                }`}
              >
                <span className="text-2xl block mb-1">{role.icon}</span>
                <p className="text-xs font-bold">{role.label}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/20"
        />
      )}
    </>
  );
}