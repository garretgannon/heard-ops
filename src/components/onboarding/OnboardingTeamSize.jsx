import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Users } from 'lucide-react';
import { TEAM_SIZES } from '@/lib/onboardingConfig';
import { haptics } from '@/utils/haptics';

export default function OnboardingTeamSize({ onBack, onSelect }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (size) => {
    haptics.medium?.();
    setSelected(size.id);
    setTimeout(() => onSelect(size), 300);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col pt-20">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pb-8">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </motion.button>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Step 4 of 7</p>
          <h2 className="text-2xl font-bold text-foreground">How big is your team?</h2>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-full max-w-xs space-y-3">
          {TEAM_SIZES.map((size, i) => {
            const isSelected = selected === size.id;
            return (
              <motion.button
                key={size.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(size)}
                className={`w-full rounded-2xl p-6 text-center transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                    : 'card-glass border border-border hover:border-border/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5" />
                  <p className="font-bold text-lg">{size.label}</p>
                </div>
                <p className={`text-xs ${isSelected ? 'opacity-90' : 'text-muted-foreground'}`}>
                  {size.value} avg staff
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Visual slider representation */}
        <motion.div className="mt-12 w-full max-w-xs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: selected ? (TEAM_SIZES.findIndex(s => s.id === selected) + 1) * 25 + '%' : '0%' }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {selected ? 'Perfect! More flexibility for ' + TEAM_SIZES.find(s => s.id === selected).permissions + ' workflows' : 'Choose your team size'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}