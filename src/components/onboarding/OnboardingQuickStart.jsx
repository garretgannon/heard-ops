import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowRight, Check } from 'lucide-react';

const RESTAURANT_TYPES = [
  { id: 'casual_dining', label: 'Casual Dining', emoji: '🍔', desc: 'Full service, bar, kitchen' },
  { id: 'fine_dining', label: 'Fine Dining', emoji: '🍷', desc: 'Upscale, FOH-focused' },
  { id: 'fast_casual', label: 'Fast Casual', emoji: '🥙', desc: 'Counter service, fast flow' },
  { id: 'bar_nightclub', label: 'Bar / Nightclub', emoji: '🍺', desc: 'Bar-heavy, late night' },
  { id: 'cafe_bakery', label: 'Café / Bakery', emoji: '☕', desc: 'Coffee, pastries, light food' },
  { id: 'food_truck', label: 'Food Truck', emoji: '🚚', desc: 'Mobile, compact team' },
];

const TEAM_SIZES = [
  { id: 'small', label: '1–10', desc: 'Small crew' },
  { id: 'medium', label: '11–30', desc: 'Mid-size' },
  { id: 'large', label: '31–75', desc: 'Large team' },
  { id: 'enterprise', label: '75+', desc: 'Multi-location' },
];

const STEPS = ['name', 'type', 'size', 'depts'];

export default function OnboardingQuickStart({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState(0);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantType, setRestaurantType] = useState(null);
  const [teamSize, setTeamSize] = useState(null);
  const [hasFOH, setHasFOH] = useState(true);
  const [hasBOH, setHasBOH] = useState(true);
  const [hasBar, setHasBar] = useState(false);

  const progress = ((subStep) / STEPS.length) * 100;

  const handleNext = () => {
    if (subStep < STEPS.length - 1) setSubStep(s => s + 1);
    else onComplete({ restaurantName, restaurantType, teamSize, hasFOH, hasBOH, hasBar });
  };

  const canNext = () => {
    if (subStep === 0) return restaurantName.trim().length > 1;
    if (subStep === 1) return !!restaurantType;
    if (subStep === 2) return !!teamSize;
    return true;
  };

  return (
    <div className="h-full flex flex-col max-w-sm mx-auto px-6 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={subStep === 0 ? onBack : () => setSubStep(s => s - 1)} className="h-9 w-9 rounded-xl card-glass border border-border flex items-center justify-center active:scale-95">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="h-1.5 bg-card rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress + 25}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Step {subStep + 1} of {STEPS.length}</p>
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {/* STEP 0: Restaurant Name */}
          {subStep === 0 && (
            <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-foreground">What's your restaurant called?</h2>
                <p className="text-sm text-muted-foreground mt-1">We'll use this to personalize your operating system.</p>
              </div>
              <input
                autoFocus
                value={restaurantName}
                onChange={e => setRestaurantName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()}
                placeholder="e.g. The Oak Room, Casa Mia..."
                className="w-full h-14 card-glass border border-border rounded-2xl px-4 text-base font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </motion.div>
          )}

          {/* STEP 1: Restaurant Type */}
          {subStep === 1 && (
            <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-foreground">What kind of restaurant?</h2>
                <p className="text-sm text-muted-foreground mt-1">We'll auto-build the right structure for your operation.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {RESTAURANT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setRestaurantType(type.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 ${
                      restaurantType === type.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="text-2xl mb-1.5">{type.emoji}</div>
                    <p className="text-sm font-bold text-foreground">{type.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{type.desc}</p>
                    {restaurantType === type.id && (
                      <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Team Size */}
          {subStep === 2 && (
            <motion.div key="size" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-foreground">How big is your team?</h2>
                <p className="text-sm text-muted-foreground mt-1">Helps us scale your operational structure.</p>
              </div>
              <div className="space-y-2">
                {TEAM_SIZES.map(size => (
                  <button
                    key={size.id}
                    onClick={() => setTeamSize(size.id)}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all active:scale-95 ${
                      teamSize === size.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-base font-bold text-foreground">{size.label} employees</p>
                      <p className="text-xs text-muted-foreground">{size.desc}</p>
                    </div>
                    {teamSize === size.id && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Departments */}
          {subStep === 3 && (
            <motion.div key="depts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-foreground">Which departments do you run?</h2>
                <p className="text-sm text-muted-foreground mt-1">We'll build each department's stations and workflows.</p>
              </div>
              <div className="space-y-2">
                {[
                  { key: 'hasFOH', label: 'Front of House', emoji: '🍽️', desc: 'Servers, hosts, dining room', value: hasFOH, set: setHasFOH },
                  { key: 'hasBOH', label: 'Back of House', emoji: '👨‍🍳', desc: 'Kitchen, prep, expo', value: hasBOH, set: setHasBOH },
                  { key: 'hasBar', label: 'Bar', emoji: '🍸', desc: 'Bartenders, service bar', value: hasBar, set: setHasBar },
                ].map(dept => (
                  <button
                    key={dept.key}
                    onClick={() => dept.set(v => !v)}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all active:scale-95 ${
                      dept.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{dept.emoji}</span>
                      <div className="text-left">
                        <p className="text-sm font-bold text-foreground">{dept.label}</p>
                        <p className="text-xs text-muted-foreground">{dept.desc}</p>
                      </div>
                    </div>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      dept.value ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {dept.value && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="card-glass border border-border rounded-2xl px-4 py-3">
                <p className="text-xs text-muted-foreground">💡 You can add or remove departments anytime from your settings.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={handleNext}
        disabled={!canNext()}
        className="w-full h-14 bg-primary text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-2.5 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 shadow-glow"
      >
        {subStep < STEPS.length - 1 ? 'Continue' : 'Build My System'} <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}