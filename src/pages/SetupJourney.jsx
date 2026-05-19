import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MapPin, Shield, ClipboardList, Thermometer, ArrowLeftRight,
  CheckCircle2, ChevronRight, Zap, Rocket, Star,
  ChevronDown, ChevronUp, Package, BookOpen
} from 'lucide-react';

const MODULES = [
  {
    id: 'team',
    icon: Users,
    emoji: '👥',
    label: 'Build Your Team',
    desc: 'Add employees, assign roles, and set up your leadership hierarchy.',
    why: 'Without a team, tasks can\'t be assigned and shifts can\'t be managed.',
    color: 'blue',
    link: '/people',
    checks: async () => {
      const employees = await base44.entities.Employee.list().catch(() => []);
      return { count: employees.length, done: employees.length >= 3 };
    },
  },
  {
    id: 'stations',
    icon: MapPin,
    emoji: '🗺️',
    label: 'Configure Areas & Stations',
    desc: 'Set up your operational map — kitchen, bar, dining room, and more.',
    why: 'Stations are where work happens. Tasks, cleaning, and logs are all tied to stations.',
    color: 'purple',
    link: '/restaurant-setup-wizard',
    checks: async () => {
      const stations = await base44.entities.Station.list().catch(() => []);
      return { count: stations.length, done: stations.length >= 3 };
    },
  },
  {
    id: 'roles',
    icon: Shield,
    emoji: '🛡️',
    label: 'Assign Roles & Permissions',
    desc: 'Define who can do what — approvals, closings, task routing.',
    why: 'Role-based permissions keep your operation accountable and secure.',
    color: 'orange',
    link: '/people',
    checks: async () => {
      const roles = await base44.entities.Role.list().catch(() => []);
      return { count: roles.length, done: roles.length >= 4 };
    },
  },
  {
    id: 'prep',
    icon: ClipboardList,
    emoji: '📋',
    label: 'Set Up Prep Systems',
    desc: 'Create prep templates, assign stations, and enable daily prep lists.',
    why: 'Auto-generated prep lists eliminate the daily guesswork for your kitchen team.',
    color: 'green',
    link: '/prep-plan-templates',
    checks: async () => {
      const templates = await base44.entities.PrepPlanTemplate.list().catch(() => []);
      return { count: templates.length, done: templates.length >= 1 };
    },
  },
  {
    id: 'cleaning',
    icon: Package,
    emoji: '🧹',
    label: 'Create Cleaning Systems',
    desc: 'Station-level cleaning checklists with scheduling and accountability.',
    why: 'Health code compliance requires documented, consistent cleaning practices.',
    color: 'teal',
    link: '/cleaning-templates',
    checks: async () => {
      const templates = await base44.entities.CleaningTemplate.list().catch(() => []);
      return { count: templates.length, done: templates.length >= 1 };
    },
  },
  {
    id: 'temp',
    icon: Thermometer,
    emoji: '🌡️',
    label: 'Enable Temperature Logs',
    desc: 'Set up automated temperature checks for coolers, freezers, and hot holding.',
    why: 'Temperature logs protect food safety compliance and reduce liability.',
    color: 'red',
    link: '/temperature-monitoring',
    checks: async () => {
      const items = await base44.entities.MonitoredTemperatureItem.list().catch(() => []);
      return { count: items.length, done: items.length >= 1 };
    },
  },
  {
    id: 'handoff',
    icon: ArrowLeftRight,
    emoji: '🔄',
    label: 'Configure Shift Handoffs',
    desc: 'Build shift notes, accountability trails, and follow-up systems.',
    why: 'Shift handoffs are how managers communicate across shifts without meetings.',
    color: 'yellow',
    link: '/shift',
    checks: async () => {
      const handoffs = await base44.entities.ShiftHandoff.list().catch(() => []);
      return { count: handoffs.length, done: handoffs.length >= 1 };
    },
  },
  {
    id: 'recipes',
    icon: BookOpen,
    emoji: '📖',
    label: 'Link Recipes & Build Cards',
    desc: 'Connect recipes to stations so your team has the right specs.',
    why: 'Linked recipes reduce training time and improve food consistency.',
    color: 'pink',
    link: '/recipes',
    checks: async () => {
      const recipes = await base44.entities.Recipe.list().catch(() => []);
      return { count: recipes.length, done: recipes.length >= 1 };
    },
  },
];

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
  orange: { bg: 'bg-primary/10',    border: 'border-primary/20',    text: 'text-primary',    dot: 'bg-primary' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400',  dot: 'bg-green-400' },
  teal:   { bg: 'bg-teal-500/10',   border: 'border-teal-500/20',   text: 'text-teal-400',   dot: 'bg-teal-400' },
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400',    dot: 'bg-red-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  pink:   { bg: 'bg-pink-500/10',   border: 'border-pink-500/20',   text: 'text-pink-400',   dot: 'bg-pink-400' },
};

function ModuleCard({ module, status, expanded, onToggle }) {
  const navigate = useNavigate();
  const colors = COLOR_MAP[module.color];
  const Icon = module.icon;
  const isDone = status?.done;

  return (
    <motion.div
      layout
      className={`bg-card rounded-2xl border overflow-hidden transition-all ${
        isDone ? 'border-green-500/20' : 'border-border'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${colors.bg} ${colors.border} border`}>
          <span className="text-xl">{module.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">{module.label}</p>
            {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />}
          </div>
          {status && (
            <p className="text-xs text-muted-foreground">
              {isDone ? '✓ Complete' : status.count > 0 ? `${status.count} added — keep going` : 'Not started'}
            </p>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
              <p className="text-sm text-muted-foreground">{module.desc}</p>
              <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 ${colors.bg}`}>
                <Zap className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${colors.text}`} />
                <p className={`text-xs font-medium ${colors.text}`}>{module.why}</p>
              </div>
              <button
                onClick={() => navigate(module.link)}
                className="w-full h-10 btn-primary text-sm flex items-center justify-center gap-2"
              >
                {isDone ? 'View & Edit' : 'Set Up Now'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SetupJourney() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('');

  useEffect(() => {
    const loadAll = async () => {
      const settings = await base44.entities.Settings.filter({ key: 'restaurant_name' }).catch(() => []);
      if (settings[0]?.value) setRestaurantName(settings[0].value);

      const results = {};
      await Promise.all(MODULES.map(async mod => {
        results[mod.id] = await mod.checks().catch(() => ({ count: 0, done: false }));
      }));
      setStatuses(results);
      setLoading(false);
    };
    loadAll();
  }, []);

  const completedCount = Object.values(statuses).filter(s => s?.done).length;
  const readinessScore = Math.round((completedCount / MODULES.length) * 100);
  const isLaunchReady = readinessScore >= 60;

  const suggestions = [];
  if (!statuses.team?.done) suggestions.push({ text: 'Add at least 3 team members to activate task routing', icon: '👥' });
  if (!statuses.stations?.done) suggestions.push({ text: 'Configure your stations so tasks know where to go', icon: '🗺️' });
  if (!statuses.temp?.done) suggestions.push({ text: '3+ stations likely need temperature logs for compliance', icon: '🌡️' });
  if (!statuses.prep?.done) suggestions.push({ text: 'No prep templates set — your kitchen team is missing daily guidance', icon: '📋' });

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Setup Journey" subtitle="Build your operating system" />
      {/* Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/30 px-4 pt-4 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {restaurantName ? `${restaurantName} Setup` : 'Setup Journey'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Build your operating system</p>
          </div>
          <button onClick={() => navigate('/')} className="text-xs font-bold text-primary px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
            Go to App →
          </button>
        </div>

        {/* Readiness score */}
        <div className="card-glass border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Operational Readiness</p>
            </div>
            <p className="text-2xl font-extrabold text-primary">{readinessScore}%</p>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
            <motion.div
              className={`h-full rounded-full transition-colors ${readinessScore >= 80 ? 'bg-green-400' : readinessScore >= 50 ? 'bg-primary' : 'bg-yellow-400'}`}
              animate={{ width: `${readinessScore}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{completedCount} of {MODULES.length} modules complete</p>
            {isLaunchReady && (
              <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                <Star className="h-3 w-3" /> Launch Ready!
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="app-page space-y-4">

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
              🔍 Setup Assistant
            </h2>
            <div className="space-y-2">
              {suggestions.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl px-3.5 py-3">
                  <span className="text-base shrink-0">{s.icon}</span>
                  <p className="text-xs text-yellow-200/80">{s.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Module cards */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
            Setup Modules
          </h2>
          <div className="space-y-2">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 card-glass border border-border rounded-2xl animate-pulse" />
                ))
              : MODULES.map(mod => (
                  <ModuleCard
                    key={mod.id}
                    module={mod}
                    status={statuses[mod.id]}
                    expanded={expanded === mod.id}
                    onToggle={() => setExpanded(expanded === mod.id ? null : mod.id)}
                  />
                ))
            }
          </div>
        </section>

        {/* Launch section */}
        {isLaunchReady && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500/15 to-emerald-600/10 border border-green-500/25 rounded-2xl p-5 text-center"
          >
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-lg font-extrabold text-foreground mb-1">Ready to Launch!</h3>
            <p className="text-sm text-muted-foreground mb-4">Your operational foundation is solid. Time to run your restaurant.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full h-12 btn-primary flex items-center justify-center gap-2"
            >
              <Rocket className="h-5 w-5" /> Launch Operations
            </button>
          </motion.section>
        )}

      </div>
    </div>
  );
}

export const hideBase44Index = true;
