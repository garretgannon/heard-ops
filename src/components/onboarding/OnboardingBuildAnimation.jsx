import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const RESTAURANT_STRUCTURES = {
  casual_dining: {
    areas: [
      { name: 'Kitchen', stations: ['Grill', 'Fry', 'Pantry', 'Expo', 'Prep'] },
      { name: 'Bar', stations: ['Service Bar', 'Main Bar'] },
      { name: 'Dining Room', stations: ['Section A', 'Section B', 'Patio'] },
    ],
  },
  fine_dining: {
    areas: [
      { name: 'Kitchen', stations: ['Hot Line', 'Cold Station', 'Pastry', 'Expo'] },
      { name: 'Bar', stations: ['Cocktail Bar', 'Wine Station'] },
      { name: 'Dining Room', stations: ['Main Floor', 'Private Dining', 'Lounge'] },
    ],
  },
  fast_casual: {
    areas: [
      { name: 'Kitchen', stations: ['Assembly', 'Grill', 'Prep', 'Expo'] },
      { name: 'Front Counter', stations: ['Register', 'Pickup Window'] },
    ],
  },
  bar_nightclub: {
    areas: [
      { name: 'Bar', stations: ['Main Bar', 'Service Bar', 'Bar Back'] },
      { name: 'Kitchen', stations: ['Late Night Kitchen', 'Prep'] },
      { name: 'Floor', stations: ['Main Floor', 'VIP', 'Patio'] },
    ],
  },
  cafe_bakery: {
    areas: [
      { name: 'Kitchen', stations: ['Espresso Bar', 'Bakery', 'Prep'] },
      { name: 'Dining', stations: ['Counter', 'Floor Seating'] },
    ],
  },
  food_truck: {
    areas: [
      { name: 'Truck', stations: ['Grill', 'Assembly', 'Expo'] },
    ],
  },
};

const DEFAULT_ROLES = [
  { name: 'General Manager', department: 'Management', can_approve_tasks: true, can_close_shift: true, can_create_issues: true, is_top_level: true, is_active: true },
  { name: 'Manager', department: 'Management', can_approve_tasks: true, can_close_shift: true, can_create_issues: true, is_active: true },
  { name: 'Kitchen Lead', department: 'BOH', can_approve_tasks: true, can_close_shift: false, can_create_issues: true, is_active: true },
  { name: 'Line Cook', department: 'BOH', can_approve_tasks: false, can_close_shift: false, can_create_issues: true, is_active: true },
  { name: 'Prep Cook', department: 'BOH', can_approve_tasks: false, can_close_shift: false, can_create_issues: true, is_active: true },
  { name: 'Dishwasher', department: 'BOH', can_approve_tasks: false, can_close_shift: false, can_create_issues: false, is_active: true },
  { name: 'Server', department: 'FOH', can_approve_tasks: false, can_close_shift: false, can_create_issues: true, is_active: true },
  { name: 'Host', department: 'FOH', can_approve_tasks: false, can_close_shift: false, can_create_issues: false, is_active: true },
  { name: 'Bartender', department: 'Bar', can_approve_tasks: false, can_close_shift: false, can_create_issues: true, is_active: true },
  { name: 'Busser', department: 'FOH', can_approve_tasks: false, can_close_shift: false, can_create_issues: false, is_active: true },
];

function getBuildSteps(config) {
  const structure = RESTAURANT_STRUCTURES[config?.restaurantType] || RESTAURANT_STRUCTURES.casual_dining;
  const steps = [
    { id: 'name', label: `Setting up "${config?.restaurantName || 'Your Restaurant'}"`, icon: '🏠', duration: 600 },
    { id: 'areas', label: `Building ${structure.areas.length} operational areas`, icon: '🗺️', duration: 900 },
    { id: 'stations', label: `Creating ${structure.areas.reduce((s, a) => s + a.stations.length, 0)} stations`, icon: '🎯', duration: 1000 },
    { id: 'roles', label: 'Generating roles & hierarchy', icon: '👥', duration: 800 },
    { id: 'templates', label: 'Creating starter task templates', icon: '📋', duration: 700 },
    { id: 'cleaning', label: 'Setting up cleaning checklists', icon: '🧹', duration: 600 },
    { id: 'handoff', label: 'Activating shift handoff system', icon: '🔄', duration: 500 },
    { id: 'final', label: 'Finalizing your operating system', icon: '🚀', duration: 800 },
  ];
  return steps;
}

async function runGeneration(config) {
  const structure = RESTAURANT_STRUCTURES[config?.restaurantType] || RESTAURANT_STRUCTURES.casual_dining;

  // Save restaurant name
  await base44.entities.Settings.create({ key: 'restaurant_name', value: config.restaurantName }).catch(() => {});
  await base44.entities.Settings.create({ key: 'onboarding_restaurant_type', value: config.restaurantType }).catch(() => {});
  await base44.entities.Settings.create({ key: 'onboarding_team_size', value: config.teamSize }).catch(() => {});

  // Create Areas & Stations
  for (const area of structure.areas) {
    const created = await base44.entities.Area.create({ name: area.name, isActive: true }).catch(() => null);
    if (created) {
      for (const stationName of area.stations) {
        const dept = area.name === 'Kitchen' ? 'BOH' : area.name === 'Bar' ? 'Bar' : 'FOH';
        await base44.entities.Station.create({
          name: stationName,
          area_id: created.id,
          area_name: area.name,
          department: dept,
          isActive: true,
        }).catch(() => {});
      }
    }
  }

  // Create Roles (filter by departments)
  for (const role of DEFAULT_ROLES) {
    if (!config.hasFOH && role.department === 'FOH') continue;
    if (!config.hasBOH && role.department === 'BOH') continue;
    if (!config.hasBar && role.department === 'Bar') continue;
    await base44.entities.Role.create(role).catch(() => {});
  }
}

export default function OnboardingBuildAnimation({ config, onComplete }) {
  const steps = getBuildSteps(config);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let stepIdx = 0;
    const advance = () => {
      if (stepIdx >= steps.length) {
        setDone(true);
        setTimeout(onComplete, 1200);
        return;
      }
      setCurrentStep(stepIdx);
      const delay = steps[stepIdx].duration;
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, stepIdx]);
        stepIdx++;
        advance();
      }, delay);
    };

    // Start generation in background
    runGeneration(config).catch(() => {});
    advance();
  }, []);

  const progress = Math.round(((completedSteps.length) / steps.length) * 100);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 max-w-sm mx-auto">
      {/* Central animation */}
      <motion.div
        animate={{ rotate: done ? 0 : 360 }}
        transition={{ duration: 3, repeat: done ? 0 : Infinity, ease: "linear" }}
        className="relative mb-8"
      >
        <div className={`h-24 w-24 rounded-3xl flex items-center justify-center transition-all duration-500 ${
          done
            ? 'bg-green-500/20 border-2 border-green-500/40 shadow-none'
            : 'bg-primary/15 border-2 border-primary/30 shadow-glow'
        }`}>
          <span className="text-4xl">{done ? '✅' : steps[currentStep]?.icon}</span>
        </div>
      </motion.div>

      <motion.h2
        key={done ? 'done' : currentStep}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-extrabold text-foreground text-center mb-2"
      >
        {done ? `${config?.restaurantName || 'Your Restaurant'} is Ready!` : 'Building Your OS...'}
      </motion.h2>
      <p className="text-sm text-muted-foreground text-center mb-8">
        {done ? 'Your operational system has been set up.' : steps[currentStep]?.label}
      </p>

      {/* Progress bar */}
      <div className="w-full card-glass border border-border rounded-full h-2 mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-xs text-muted-foreground mb-6">{progress}% complete</p>

      {/* Steps list */}
      <div className="w-full space-y-2">
        {steps.map((step, idx) => {
          const isDone = completedSteps.includes(idx);
          const isActive = currentStep === idx && !isDone;
          return (
            <div key={step.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
              isActive ? 'bg-primary/10 border border-primary/20' : ''
            }`}>
              <span className={`text-sm transition-all ${isDone ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-30'}`}>
                {isDone ? '✓' : step.icon}
              </span>
              <p className={`text-xs font-medium transition-all ${
                isDone ? 'text-green-400 line-through opacity-60' : isActive ? 'text-foreground' : 'text-muted-foreground opacity-40'
              }`}>
                {step.label}
              </p>
              {isActive && (
                <div className="ml-auto w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}