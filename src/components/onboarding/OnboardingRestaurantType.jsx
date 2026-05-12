import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Zap } from 'lucide-react';
import { RESTAURANT_TYPES } from '@/lib/onboardingConfig';
import { haptics } from '@/utils/haptics';

export default function OnboardingRestaurantType({ onBack, onSelect }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (type) => {
    haptics.medium?.();
    setSelected(type.id);
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onSelect(type);
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
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Step 2 of 7</p>
          <h2 className="text-2xl font-bold text-foreground">What kind of restaurant do you run?</h2>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-3 mt-24">
        <AnimatePresence mode="popLayout">
          {RESTAURANT_TYPES.map((type, i) => {
            const Icon = type.icon;
            const isSelected = selected === type.id;
            const isLoading = loading && isSelected;

            return (
              <motion.button
                key={type.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSelect(type)}
                disabled={loading}
                className={`w-full rounded-2xl p-4 text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                    : 'card-glass border border-border hover:border-border/50'
                }`}
              >
                {/* Loading animation */}
                {isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                <div className="relative z-10 flex items-start gap-3">
                  <div className={`text-3xl mt-1 ${isSelected ? '' : ''}`}>
                    {type.icon === 'string' ? type.icon : <Icon className="h-6 w-6" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base">{type.label}</p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'opacity-90' : 'text-muted-foreground'}`}>
                      {type.description}
                    </p>
                    <p className={`text-xs mt-2 ${isSelected ? 'opacity-75' : 'text-muted-foreground/60'}`}>
                      {type.templates} preset templates
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Building animation overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <motion.div
                className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Zap className="h-6 w-6 text-primary" />
              </motion.div>
              <p className="text-foreground font-bold">Building your operation…</p>
              <p className="text-muted-foreground text-xs mt-2">Preparing stations, templates and workflows</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}