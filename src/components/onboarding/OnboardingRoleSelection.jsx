import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { USER_ROLES } from '@/lib/onboardingConfig';
import { haptics } from '@/utils/haptics';

export default function OnboardingRoleSelection({ onBack, onSelect }) {
  const handleSelect = (role) => {
    haptics.medium?.();
    onSelect(role);
  };

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto pt-20 pb-32">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-b from-background to-transparent pt-4 pb-6 px-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </motion.button>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Step 3 of 7</p>
          <h2 className="text-2xl font-bold text-foreground">What's your role?</h2>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-3 mt-24">
        {USER_ROLES.map((role, i) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(role)}
            className="w-full rounded-2xl bg-card border border-border p-4 text-left hover:border-border/50 transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{role.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-base text-foreground">{role.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}