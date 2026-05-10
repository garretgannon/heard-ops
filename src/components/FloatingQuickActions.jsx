import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ClipboardList, Wrench, Truck, AlertTriangle, TrendingUp, Camera, Thermometer } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const actions = [
  { label: "Add Task", icon: ClipboardList, path: "/prep-lists" },
  { label: "Maintenance Issue", icon: Wrench, path: "/maintenance" },
  { label: "Vendor Note", icon: Truck, path: "/vendors" },
  { label: "Incident Report", icon: AlertTriangle, path: "/incidents" },
  { label: "Shift Note", icon: TrendingUp, path: "/shift-handoff" },
  { label: "Take Photo", icon: Camera, path: "/photo-review" },
  { label: "Temp Log", icon: Thermometer, path: "/temp-logs" },
];

export default function FloatingQuickActions() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="lg:hidden fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[-1]"
              onClick={() => setOpen(false)}
            />

            {/* Action buttons */}
            <div className="flex flex-col items-end gap-2">
              {actions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, x: 40, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 40, scale: 0.8 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    onClick={() => handleAction(action.path)}
                    className="flex items-center gap-3 bg-card border border-border rounded-full pl-4 pr-5 py-3 shadow-lg active:scale-95 transition-transform"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">{action.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setOpen(!open)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="h-7 w-7" />
      </motion.button>
    </div>
  );
}