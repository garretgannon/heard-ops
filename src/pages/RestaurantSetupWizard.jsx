import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Snowflake, Box, Bell, Droplets, Wine, Sun, ShoppingBag,
  Users, UtensilsCrossed, MapPin, Layers, ChefHat, Briefcase, Star,
  Building2, Coffee, Plus, X, Check, ChevronRight, ChevronLeft,
  ArrowRight, Lightbulb, FlaskConical, AlertCircle, Utensils,
  Scissors, RefreshCw, Thermometer, ClipboardList, Moon, Package,
  Zap, ChevronDown, ChevronUp, Wrench, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Data ─────────────────────────────────────────────────────────────────────

const BOH_AREAS = [
  { slug: 'kitchen-line', name: 'Kitchen Line', icon: Flame },
  { slug: 'dry-storage',  name: 'Dry Storage',  icon: Box },
  { slug: 'walk-in',      name: 'Walk-In',       icon: Snowflake },
  { slug: 'prep',         name: 'Prep',          icon: ChefHat },
  { slug: 'expo-area',    name: 'Expo Area',     icon: Bell },
  { slug: 'dish-pit',     name: 'Dish Pit',      icon: Droplets },
  { slug: 'bakery',       name: 'Bakery',        icon: Coffee },
  { slug: 'chemical-storage', name: 'Chemical Storage', icon: FlaskConical },
  { slug: 'office',       name: 'Office',        icon: Briefcase },
];

const FOH_AREAS = [
  { slug: 'dining-room',    name: 'Dining Room',    icon: UtensilsCrossed },
  { slug: 'bar',            name: 'Bar',            icon: Wine },
  { slug: 'host-stand',     name: 'Host Stand',     icon: Users },
  { slug: 'patio',          name: 'Patio',          icon: Sun },
  { slug: 'server-station', name: 'Server Station', icon: Utensils },
  { slug: 'to-go',          name: 'To-Go',          icon: ShoppingBag },
  { slug: 'private-dining', name: 'Private Dining', icon: Star },
  { slug: 'banquet-area',   name: 'Banquet Area',   icon: Building2 },
];

const STATION_SUGGESTIONS = {
  'Kitchen Line': [
    { name: 'Fryer', icon: Flame }, { name: 'Grill', icon: Flame },
    { name: 'Sauté', icon: Flame }, { name: 'Pantry', icon: Box },
    { name: 'Flat Top', icon: Flame }, { name: 'Broiler', icon: Flame },
    { name: 'Line Lead', icon: Star }, { name: 'Expo', icon: Bell },
  ],
  'Prep': [
    { name: 'Prep Table', icon: Scissors }, { name: 'Produce Prep', icon: Scissors },
    { name: 'Sauce Station', icon: Droplets }, { name: 'Bakery', icon: Coffee },
    { name: 'Cold Prep', icon: Snowflake }, { name: 'Butcher', icon: Scissors },
  ],
  'Walk-In': [{ name: 'Walk-In Cooler', icon: Snowflake }, { name: 'Walk-In Freezer', icon: Snowflake }],
  'Dry Storage': [],
  'Expo Area': [{ name: 'Expo Lead', icon: Bell }, { name: 'Runner', icon: ChevronRight }, { name: 'To-Go Expo', icon: ShoppingBag }],
  'Dish Pit': [{ name: 'Dish', icon: Droplets }, { name: 'Pot Sink', icon: Droplets }, { name: 'Chemical Check', icon: FlaskConical }, { name: 'Closing Dish', icon: Droplets }],
  'Bakery': [{ name: 'Bread', icon: Coffee }, { name: 'Pastry', icon: Coffee }, { name: 'Packaging', icon: Box }, { name: 'Decorating', icon: Star }],
  'Chemical Storage': [], 'Office': [],
  'Bar': [{ name: 'Well', icon: Wine }, { name: 'Service Bar', icon: Wine }, { name: 'Cocktail Station', icon: Wine }, { name: 'Barback', icon: Wine }, { name: 'Beer/Wine', icon: Wine }],
  'Dining Room': [{ name: 'Server Section 1', icon: Utensils }, { name: 'Server Section 2', icon: Utensils }, { name: 'Bussing', icon: RefreshCw }, { name: 'Food Runner', icon: ChevronRight }],
  'Host Stand': [{ name: 'Host', icon: Users }, { name: 'Takeout', icon: ShoppingBag }],
  'Patio': [{ name: 'Patio Server', icon: Utensils }, { name: 'Patio Bar', icon: Wine }],
  'To-Go': [{ name: 'To-Go Station', icon: ShoppingBag }, { name: 'Curbside', icon: ShoppingBag }],
  'Server Station': [],
  'Private Dining': [{ name: 'Private Server', icon: Utensils }, { name: 'Private Bar', icon: Wine }],
  'Banquet Area': [{ name: 'Banquet Captain', icon: Star }, { name: 'Banquet Server', icon: Utensils }, { name: 'Banquet Bar', icon: Wine }],
};

const BOTH_CANDIDATES = new Set(['Prep', 'Expo Area', 'Bar', 'Dish Pit', 'Bakery', 'Server Station']);
const DEPT_FOR_GROUP = { BOH: 'BOH', FOH: 'FOH', Bar: 'Bar' };

const EQUIPMENT_SUGGESTIONS = {
  'Fryer':            [{ name: 'Commercial Fryer', desc: 'Primary frying unit.' }, { name: 'Oil Filtration Unit', desc: 'Extend oil life and maintain quality.' }, { name: 'Breading Station', desc: 'For prepping and breading product.' }, { name: 'Hot Holding Cabinet', desc: 'Keep fried items warm and ready.' }, { name: 'Grease Bin', desc: 'Safe grease collection and disposal.' }, { name: 'Heat Lamp', desc: 'Hold finished items at temp.' }],
  'Grill':            [{ name: 'Char Grill', desc: 'Primary grill unit.' }, { name: 'Flat Top', desc: 'Versatile flat surface.' }, { name: 'Lowboy Cooler', desc: 'Keep proteins at temp under the line.' }, { name: 'Hot Holding Cabinet', desc: 'Hold cooked items warm between rushes.' }, { name: 'Heat Lamp', desc: 'Hold cooked items at temp.' }, { name: 'Thermometer', desc: 'Protein cook-temp verification.' }],
  'Sauté':            [{ name: 'Range / Burners', desc: 'Primary cooking burners.' }, { name: 'Lowboy Cooler', desc: 'Keep mise en place cold.' }, { name: 'Reach-In Cooler', desc: 'Quick access cold items.' }, { name: 'Salamander', desc: 'Finishing and browning unit.' }, { name: 'Heat Lamp', desc: 'Hold plated items.' }],
  'Flat Top':         [{ name: 'Flat Top Griddle', desc: 'Primary flat cooking surface.' }, { name: 'Lowboy Cooler', desc: 'Under-counter cold storage.' }, { name: 'Hot Holding Cabinet', desc: 'Keep cooked items warm.' }, { name: 'Thermometer', desc: 'Surface and protein temps.' }],
  'Prep Table':       [{ name: 'Robot Coupe', desc: 'Food processor for bulk prep.' }, { name: 'Cutting Boards', desc: 'Color-coded for food safety.' }, { name: 'Scale', desc: 'Portion control.' }, { name: 'Reach-In Cooler', desc: 'Keep prepped items cold.' }, { name: 'Mixer', desc: 'Dough, batters, and bulk mixing.' }, { name: 'Vacuum Sealer', desc: 'Portion and preserve prep.' }, { name: 'Slicer', desc: 'Deli and meat slicing.' }],
  'Pantry / Cold':    [{ name: 'Cold Plate', desc: 'Cold apps and salad station.' }, { name: 'Reach-In Cooler', desc: 'Quick access cold items.' }, { name: 'Under-counter Freezer', desc: 'Frozen item storage.' }, { name: 'Thermometer', desc: 'Cold-hold temp checks.' }],
  'Expo':             [{ name: 'Heat Lamp', desc: 'Hold plated dishes at temp.' }, { name: 'Hot Holding Cabinet', desc: 'Staging and holding.' }, { name: 'Printer', desc: 'Ticket printer.' }, { name: 'POS Terminal', desc: 'Expo order management.' }],
  'Dish Pit':         [{ name: 'Dish Machine', desc: 'High-temp commercial washer.' }, { name: 'Pre-Rinse Spray Arm', desc: 'Pre-rinse attachment.' }, { name: 'Drying Rack', desc: 'Air dry before storage.' }, { name: 'Chemical Dispenser', desc: 'Sanitizer and detergent dosing.' }, { name: 'PPM Test Strips', desc: 'Verify sanitizer concentration.' }],
  'Broiler':          [{ name: 'Salamander', desc: 'Finishing and browning unit.' }, { name: 'Broiler Unit', desc: 'Overhead heat broiler.' }, { name: 'Heat Lamp', desc: 'Hold finished items.' }, { name: 'Thermometer', desc: 'Cook-temp verification.' }],
  'Main Bar':         [{ name: 'Ice Machine', desc: 'Primary ice production.' }, { name: 'Ice Well', desc: 'Working ice storage.' }, { name: 'Speed Rail', desc: 'Well liquor quick access.' }, { name: 'Beer Cooler', desc: 'Draft and bottle storage.' }, { name: 'Glass Washer', desc: 'Commercial glass cleaning.' }, { name: 'POS Terminal', desc: 'Order entry and payment.' }, { name: 'Soda Machine / Gun', desc: 'Carbonated beverage dispenser.' }, { name: 'Blender', desc: 'Frozen drinks and cocktails.' }, { name: 'Reach-In Cooler', desc: 'Juice, mixer, and garnish cold storage.' }],
  'Service Bar':      [{ name: 'Ice Machine', desc: 'Ice production for service.' }, { name: 'Ice Well', desc: 'Primary ice storage.' }, { name: 'Glass Washer', desc: 'Commercial glass cleaning.' }, { name: 'Beer Cooler', desc: 'Draft and bottle storage.' }, { name: 'Soda Machine / Gun', desc: 'Carbonated beverage dispenser.' }, { name: 'POS Terminal', desc: 'Server order entry.' }],
  'Patio Bar':        [{ name: 'Ice Well', desc: 'Primary ice storage.' }, { name: 'Speed Rail', desc: 'Quick-access bottles.' }, { name: 'Reach-In Cooler', desc: 'Cold storage for patio bar.' }, { name: 'POS Terminal', desc: 'Order and payment.' }, { name: 'Soda Gun', desc: 'Carbonated beverage dispenser.' }],
  'Well':             [{ name: 'Ice Well', desc: 'Primary ice storage.' }, { name: 'Speed Rail', desc: 'Quick-access bottles.' }, { name: 'POS Terminal', desc: 'Order entry and payment.' }, { name: 'Soda Gun', desc: 'Carbonated beverage dispenser.' }],
  'Beer / Wine Station': [{ name: 'Beer Cooler', desc: 'Draft and bottle storage.' }, { name: 'Draft System', desc: 'Keg tap and lines.' }, { name: 'Wine Cooler', desc: 'Temperature-controlled wine storage.' }, { name: 'POS Terminal', desc: 'Order entry.' }],
  'Host Stand':       [{ name: 'POS Terminal', desc: 'Reservation and seating management.' }, { name: 'Printer', desc: 'Ticket and reservation printer.' }, { name: 'Phone', desc: 'Guest communication.' }, { name: 'iPad / Tablet', desc: 'Digital waitlist or reservation app.' }],
  'Server Section':   [{ name: 'POS Terminal', desc: 'Order entry and payment.' }, { name: 'Printer', desc: 'Ticket printer.' }, { name: 'Soda Machine', desc: 'Self-service beverage station.' }, { name: 'Coffee Machine', desc: 'Drip or espresso service.' }, { name: 'Ice Machine', desc: 'Drink ice supply.' }],
  'To-Go Counter':    [{ name: 'POS Terminal', desc: 'Order entry and payment.' }, { name: 'Printer', desc: 'Order ticket printer.' }, { name: 'Hot Holding Cabinet', desc: 'Keep to-go orders warm.' }, { name: 'Heat Lamp', desc: 'Hold bagged orders.' }, { name: 'Refrigerator', desc: 'Cold to-go item storage.' }],
  'Walk-In Cooler':   [{ name: 'Shelving Units', desc: 'FIFO-organized storage.' }, { name: 'Thermometer', desc: 'Ambient temp monitoring.' }, { name: 'Walk-In Refrigeration Unit', desc: 'Primary cooling system.' }, { name: 'Digital Temp Logger', desc: 'Automated temp recording.' }],
  'Walk-In Freezer':  [{ name: 'Shelving Units', desc: 'Organized frozen storage.' }, { name: 'Thermometer', desc: 'Ambient temp monitoring.' }, { name: 'Walk-In Freezer Unit', desc: 'Primary freezer system.' }, { name: 'Digital Temp Logger', desc: 'Automated temp recording.' }],
  'Dry Storage':      [{ name: 'Shelving Units', desc: 'Dry good organization.' }, { name: 'Scale', desc: 'Inventory weight tracking.' }, { name: 'Thermometer', desc: 'Ambient temp check.' }],
  'Office':           [{ name: 'Computer / Desktop', desc: 'Scheduling and admin.' }, { name: 'Printer', desc: 'Schedule and document printing.' }, { name: 'Phone', desc: 'Office communication.' }, { name: 'Safe', desc: 'Cash and document security.' }, { name: 'POS Back Office', desc: 'Reporting and management terminal.' }],
  'Dining Room':      [{ name: 'POS Terminal', desc: 'Tableside or server order entry.' }, { name: 'Coffee Machine', desc: 'Table-side coffee service.' }],
};

const DEFAULT_WORKFLOWS = [
  { name: 'Temp Checks',             icon: Thermometer },
  { name: 'Cleaning',                icon: Droplets },
  { name: 'Sidework',                icon: ClipboardList },
  { name: 'Opening Checklist',       icon: Sun },
  { name: 'Closing Checklist',       icon: Moon },
  { name: 'Issues / Incident Logging', icon: AlertCircle },
];

const WORKFLOW_SUGGESTIONS = {
  'Fryer':      [{ name: 'Oil Filtering',    desc: 'Filter and top off oil based on usage.',    icon: FlaskConical }, { name: 'Prep Counts',    desc: 'Count and log ready-to-fry product.',  icon: ClipboardList }, { name: 'Waste Log',      desc: 'Log oil and food waste removed.',          icon: Trash2 }, { name: 'Equipment Check', desc: 'Inspect fryer parts and safety systems.', icon: Wrench }],
  'Grill':      [{ name: 'Grill Scrape Down', desc: 'Clean grill surface between rushes.',     icon: Flame }, { name: 'Gas Check',       desc: 'Verify gas connections are secure.',     icon: Wrench }, { name: 'Protein Temp Check', desc: 'Log cook temps for compliance.',        icon: Thermometer }],
  'Sauté':      [{ name: 'Station Setup',    desc: 'Set mise en place before service.',         icon: ClipboardList }, { name: 'Temp Log',       desc: 'Log holding temps for hot items.',      icon: Thermometer }, { name: 'Closing Clean',  desc: 'Deep clean sauté station.',               icon: Droplets }],
  'Prep Table': [{ name: 'Prep Counts',      desc: 'Count and record par levels.',              icon: ClipboardList }, { name: 'Labeling',        desc: 'Date and label all prepped items.',      icon: Box }, { name: 'Cutting Board Cleaning', desc: 'Sanitize boards between uses.', icon: Droplets }],
  'Bar':        [{ name: 'Ice Well Setup',   desc: 'Fill and sanitize ice well.',               icon: Snowflake }, { name: 'Fruit/Garnish Prep', desc: 'Cut and prep daily garnishes.',      icon: Scissors }, { name: 'Beer Cooler Temp', desc: 'Log cooler temperature.',              icon: Thermometer }, { name: 'Closing Bar Checklist', desc: 'End-of-night bar close.', icon: Moon }],
  'Well':       [{ name: 'Ice Well Setup',   desc: 'Fill and sanitize ice well.',               icon: Snowflake }, { name: 'Speed Rail Restock', desc: 'Restock well bottles.',               icon: Wine }],
  'Dish':       [{ name: 'Chemical Check',   desc: 'Verify sanitizer PPM levels.',              icon: FlaskConical }, { name: 'Machine Clean', desc: 'Clean dish machine filter and arms.',   icon: Wrench }],
  'Host':       [{ name: 'Reservation Check', desc: 'Review reservations before service.',     icon: ClipboardList }, { name: 'Waitlist Setup', desc: 'Set up waitlist system.',               icon: Users }],
};

const WORKFLOW_TEMPLATE_TYPE = {
  'Temp Checks': 'temperature', 'Cleaning': 'cleaning', 'Sidework': 'sidework',
  'Opening Checklist': 'opening', 'Closing Checklist': 'closing',
  'Issues / Incident Logging': 'custom',
  'Oil Filtering': 'custom', 'Prep Counts': 'prep', 'Waste Log': 'custom',
  'Equipment Check': 'custom', 'Grill Scrape Down': 'cleaning', 'Gas Check': 'custom',
  'Protein Temp Check': 'temperature', 'Station Setup': 'custom', 'Temp Log': 'temperature',
  'Closing Clean': 'cleaning', 'Labeling': 'custom', 'Cutting Board Cleaning': 'cleaning',
  'Ice Well Setup': 'custom', 'Fruit/Garnish Prep': 'prep', 'Beer Cooler Temp': 'temperature',
  'Closing Bar Checklist': 'closing', 'Chemical Check': 'custom', 'Machine Clean': 'cleaning',
  'Speed Rail Restock': 'custom', 'Reservation Check': 'custom', 'Waitlist Setup': 'custom',
};

// ─── Stepper (5 steps) ────────────────────────────────────────────────────────

function Stepper({ step }) {
  const steps = [
    { n: 1, label: 'Areas' }, { n: 2, label: 'Stations' },
    { n: 3, label: 'Equipment' }, { n: 4, label: 'Workflows' }, { n: 5, label: 'Review' },
  ];
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                done ? 'bg-green-500 text-white' : active ? 'bg-primary text-white' : 'bg-muted/60 text-muted-foreground border border-border/60'
              }`}>
                {done ? <Check className="h-3.5 w-3.5" /> : s.n}
              </div>
              <p className={`text-xs font-bold hidden sm:block ${active ? 'text-foreground' : done ? 'text-green-400' : 'text-muted-foreground'}`}>{s.label}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 flex items-center px-1 lg:px-2">
                <div className={`flex-1 h-px ${done ? 'bg-green-500/40' : 'bg-border/60'}`} />
                <ArrowRight className={`h-2.5 w-2.5 shrink-0 ${done ? 'text-green-400/60' : 'text-border/60'}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Helper Panel (steps 1-2, 5) ─────────────────────────────────────────────

function HelperPanel({ step = 1 }) {
  const [tab, setTab] = useState('area');
  const showAll = step >= 2;
  const definitions = [
    { id: 'area',    label: 'Area',    icon: MapPin,   iconClass: 'text-primary',    border: 'border-primary/30',    bg: 'bg-primary/10',    desc: 'A zone or place in the restaurant.', example: 'Kitchen Line, Dining Room', exampleClass: 'text-primary' },
    { id: 'station', label: 'Station', icon: Layers,   iconClass: 'text-blue-400',   border: 'border-blue-500/30',   bg: 'bg-blue-500/10',   desc: 'A work position inside an area.',    example: 'Fryer, Grill, Sauté',       exampleClass: 'text-blue-400' },
    { id: 'both',    label: 'Both',    icon: null,     iconClass: 'text-green-400',  border: 'border-green-500/30',  bg: 'bg-green-500/10',  desc: 'Can be both an area and a station.', example: 'Prep or Expo',              exampleClass: 'text-green-400' },
  ];
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden sticky top-6">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-1"><Lightbulb className="h-4 w-4 text-amber-400" /><p className="font-black text-base text-foreground">Keep it simple</p></div>
        <p className="text-xs text-muted-foreground">Understand how Areas, Stations, and Both work.</p>
      </div>
      {!showAll && (
        <div className="flex gap-2 px-5 pb-4">
          {definitions.map(d => <button key={d.id} onClick={() => setTab(d.id)} className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-colors ${tab === d.id ? 'bg-primary text-white' : 'bg-muted/60 text-muted-foreground hover:text-foreground'}`}>{d.label}</button>)}
        </div>
      )}
      {!showAll && (
        <div className="px-5 pb-4">
          {definitions.filter(d => d.id === tab).map(d => (
            <div key={d.id} className={`rounded-2xl border ${d.border} ${d.bg} p-4 space-y-1.5`}>
              <div className="flex items-center gap-2">
                {d.icon ? <d.icon className={`h-4 w-4 ${d.iconClass}`} /> : <div className="h-4 w-4 rounded-full border-2 border-green-400 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-green-400" /></div>}
                <p className="font-bold text-sm text-foreground">{d.label}</p>
              </div>
              <p className="text-xs text-muted-foreground">{d.desc}</p>
              <p className="text-[11px]"><span className={`font-semibold ${d.exampleClass}`}>Example: </span><span className="text-muted-foreground/70">{d.example}</span></p>
            </div>
          ))}
        </div>
      )}
      {showAll && (
        <div className="px-5 pb-4 space-y-2">
          {definitions.map(d => (
            <div key={d.id} className={`rounded-2xl border ${d.border} ${d.bg} px-4 py-3`}>
              <div className="flex items-center gap-2 mb-1">
                {d.icon ? <d.icon className={`h-4 w-4 ${d.iconClass}`} /> : <div className="h-4 w-4 rounded-full border-2 border-green-400 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-green-400" /></div>}
                <p className="font-bold text-sm text-foreground">{d.label}</p>
              </div>
              <p className="text-[11px] text-muted-foreground">{d.desc}</p>
              <p className="text-[11px] mt-1"><span className={`font-semibold ${d.exampleClass}`}>Example: </span><span className="text-muted-foreground/70">{d.example}</span></p>
            </div>
          ))}
        </div>
      )}
      <div className="px-5 pb-5 border-t border-border/30 pt-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Example</p>
        <div className="space-y-1.5">
          <div className="rounded-2xl border border-primary/25 bg-primary/5 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[11px] font-bold text-primary flex-1">Kitchen Line</span>
              <span className="text-[10px] font-medium text-muted-foreground/60">Area</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pl-4">
            <div className="h-px w-2 bg-border/50" />
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/50">contains</span>
          </div>
          <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 px-3 py-2.5 ml-4">
            <div className="flex items-center gap-2">
              <Layers className="h-3 w-3 text-blue-400 shrink-0" />
              <span className="text-[11px] font-bold text-blue-400 flex-1">Fryer, Grill</span>
              <span className="text-[10px] font-medium text-muted-foreground/60">Stations</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-primary/60 italic mt-3">{step === 1 ? "Tip: You'll add stations in the next step." : "Tip: Equipment and workflows come next."}</p>
      </div>
    </div>
  );
}

// ─── Right Progress Panel (steps 3-4) ─────────────────────────────────────────

function RightProgressPanel({ step, activeArea, activeStationName, equipmentPlan, workflowPlan, activeKey }) {
  const equipPlan = equipmentPlan[activeKey] || { selected: new Set(), custom: [] };
  const wfPlan    = workflowPlan[activeKey]   || { selected: new Set(), custom: [] };
  const assignedItems = step === 3 ? [...equipPlan.selected, ...equipPlan.custom] : [...wfPlan.selected, ...wfPlan.custom];
  const stepsProgress = [
    { n: 1, label: 'Areas',     done: true,        active: false },
    { n: 2, label: 'Stations',  done: true,        active: false },
    { n: 3, label: 'Equipment', done: step > 3,    active: step === 3 },
    { n: 4, label: 'Workflows', done: step > 4,    active: step === 4 },
    { n: 5, label: 'Review',    done: false,       active: false },
  ];
  return (
    <div className="space-y-4">
      {/* Keep it simple */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <p className="font-black text-sm text-foreground">Keep it simple</p>
          <div className="h-7 w-7 rounded-full bg-amber-400/10 flex items-center justify-center"><Lightbulb className="h-3.5 w-3.5 text-amber-400" /></div>
        </div>
        <div className="px-4 pb-4 space-y-3">
          {[
            { Icon: MapPin, color: 'bg-primary/10', iconColor: 'text-primary', label: 'Area', def: 'where the station lives.' },
            { Icon: Users,  color: 'bg-blue-500/10', iconColor: 'text-blue-400', label: 'Station', def: 'who owns the work.' },
            { Icon: step === 3 ? Package : Zap, color: 'bg-green-500/10', iconColor: 'text-green-400', label: step === 3 ? 'Equipment' : 'Workflow', def: step === 3 ? 'what the station uses or checks.' : 'what the station must do.' },
          ].map(({ Icon, color, iconColor, label, def }) => (
            <div key={label} className="flex items-start gap-2.5">
              <div className={`h-7 w-7 rounded-2xl ${color} flex items-center justify-center shrink-0`}><Icon className={`h-3.5 w-3.5 ${iconColor}`} /></div>
              <p className="text-xs text-foreground pt-1"><span className="font-bold">{label}</span> = <span className="text-muted-foreground">{def}</span></p>
            </div>
          ))}
        </div>
      </div>
      {/* Setup progress */}
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-foreground">Setup progress</p>
          <span className="text-xs font-bold text-muted-foreground">{step} of 5</span>
        </div>
        <div className="space-y-2">
          {stepsProgress.map(s => (
            <div key={s.n} className="flex items-center gap-2.5">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 border-[1.5px] ${s.done ? 'bg-green-500 border-green-500' : s.active ? 'bg-primary border-primary' : 'border-border/50'}`}>
                {s.done && <Check className="h-3 w-3 text-white" />}
                {!s.done && <span className={`text-[9px] font-black ${s.active ? 'text-white' : 'text-muted-foreground'}`}>{s.n}</span>}
              </div>
              <span className="text-xs font-semibold text-foreground flex-1">{s.label}</span>
              <span className={`text-[11px] font-semibold ${s.done ? 'text-green-400' : s.active ? 'text-primary' : 'text-muted-foreground/60'}`}>
                {s.done ? 'Complete' : s.active ? 'In progress' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Your setup preview */}
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <p className="text-sm font-bold text-foreground mb-3">Your setup preview</p>
        {activeArea && activeStationName ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <activeArea.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{activeArea.name}</p>
                <p className="text-xs text-primary">› {activeStationName}</p>
              </div>
            </div>
            {assignedItems.length > 0 ? (
              <>
                <p className="text-[11px] text-primary font-semibold mb-2">{assignedItems.length} {step === 3 ? 'pieces of equipment' : 'workflows'} assigned</p>
                <div className="space-y-1">
                  {assignedItems.slice(0, 6).map(name => (
                    <div key={name} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-400 shrink-0" /><span className="text-xs text-foreground">{name}</span></div>
                  ))}
                  {assignedItems.length > 6 && <p className="text-[11px] text-primary/70">+{assignedItems.length - 6} more</p>}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">None assigned yet — add some above.</p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Select a station to see your preview.</p>
        )}
      </div>
    </div>
  );
}

// ─── Areas & Stations Tree Panel (steps 3-4) ──────────────────────────────────

function AreasStationsPanel({ selectedAreas, stationPlan, activeKey, onSelect, equipmentPlan, workflowPlan, step, onAddArea }) {
  const [expanded, setExpanded] = useState(() => new Set(selectedAreas.map(a => a.slug)));
  const toggle = (slug) => setExpanded(prev => { const n = new Set(prev); n.has(slug) ? n.delete(slug) : n.add(slug); return n; });

  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <p className="text-sm font-bold text-foreground">Areas &amp; Stations</p>
        <button onClick={onAddArea} className="h-6 w-6 rounded-md border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors"><Plus className="h-3.5 w-3.5 text-muted-foreground" /></button>
      </div>
      <div className="p-2 space-y-0.5">
        {selectedAreas.filter(a => a.bothType !== 'station').map(area => {
          const plan = stationPlan[area.slug] || { selectedStations: new Set(), customStations: [] };
          const stations = [...plan.selectedStations, ...plan.customStations];
          const isExpanded = expanded.has(area.slug);
          return (
            <div key={area.slug}>
              <button onClick={() => toggle(area.slug)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-left hover:bg-secondary/40 transition-colors group">
                <div className="h-7 w-7 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0"><area.icon className="h-3.5 w-3.5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{area.name}</p>
                  <p className="text-[10px] text-muted-foreground">{stations.length} station{stations.length !== 1 ? 's' : ''}</p>
                </div>
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              </button>
              {isExpanded && stations.map(name => {
                const key = `${area.slug}::${name}`;
                const isActive = key === activeKey;
                const ep = equipmentPlan[key] || { selected: new Set(), custom: [] };
                const wp = workflowPlan[key] || { selected: new Set(), custom: [] };
                const hasItems = step === 3 ? (ep.selected.size + ep.custom.length > 0) : (wp.selected.size + wp.custom.length > 0);
                return (
                  <button key={key} onClick={() => onSelect(key)}
                    className={`w-full flex items-center gap-2 pl-10 pr-3 py-2 rounded-2xl text-left transition-colors ${isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'}`}>
                    <Layers className={`h-3 w-3 shrink-0 ${isActive ? 'text-white/70' : 'text-muted-foreground/50'}`} />
                    <span className={`text-xs font-semibold flex-1 truncate ${isActive ? 'text-white' : 'text-foreground'}`}>{name}</span>
                    {hasItems && <Check className={`h-3 w-3 shrink-0 ${isActive ? 'text-white/80' : 'text-green-400'}`} />}
                  </button>
                );
              })}
            </div>
          );
        })}
        <button onClick={onAddArea} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground hover:border-border hover:text-foreground transition-colors mt-1">
          <Plus className="h-3.5 w-3.5" /><span className="text-xs font-semibold">Add Area</span>
        </button>
      </div>
    </div>
  );
}

// ─── Area Card ────────────────────────────────────────────────────────────────

function AreaCard({ name, icon: Icon, selected, existing, group, onToggle }) {
  const isBOH = group === 'BOH';
  const sel = selected && !existing;
  return (
    <button
      onClick={existing ? undefined : onToggle}
      disabled={existing}
      className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl border transition-colors text-left group ${
        existing
          ? 'border-green-500/20 bg-green-500/5 cursor-default'
          : sel
          ? isBOH
            ? 'border-primary bg-primary/10'
            : 'border-blue-500 bg-blue-500/10'
          : 'border-border/40 bg-card hover:border-border/70'
      }`}
    >
      <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
        existing ? 'bg-green-500/10' :
        sel ? (isBOH ? 'bg-primary/15' : 'bg-blue-500/15') :
        'bg-muted/50 group-hover:bg-muted/80'
      }`}>
        <Icon className={`h-[18px] w-[18px] transition-colors ${
          existing ? 'text-green-400' :
          sel ? (isBOH ? 'text-primary' : 'text-blue-400') :
          'text-muted-foreground group-hover:text-foreground'
        }`} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-foreground/90 leading-tight">{name}</span>
        {existing && <span className="text-[10px] font-bold text-green-400">Already added</span>}
        {!existing && sel && (
          <span className={`text-[10px] font-bold flex items-center gap-1 ${isBOH ? 'text-primary' : 'text-blue-400'}`}>
            <Check className="h-3 w-3" /> Selected
          </span>
        )}
      </div>
      {!existing && !sel && (
        <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 border-[1.5px] border-border/50 group-hover:border-border transition-colors">
          <Plus className="h-3 w-3 text-muted-foreground/50" />
        </div>
      )}
    </button>
  );
}

// ─── Station Row ──────────────────────────────────────────────────────────────

function StationRow({ name, icon: Icon, selected, existing, onToggle }) {
  return (
    <button onClick={existing ? undefined : onToggle} disabled={existing}
      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-colors text-left group ${
        existing ? 'border-border/30 bg-card/40 opacity-50 cursor-default' :
        selected ? 'border-primary bg-primary/10' : 'border-border/40 bg-card hover:border-border/70'
      }`}>
      <div className={`h-8 w-8 rounded-2xl flex items-center justify-center shrink-0 ${selected && !existing ? 'bg-primary/15' : 'bg-muted/50'}`}>
        <Icon className={`h-4 w-4 ${selected && !existing ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <span className="text-sm font-semibold text-foreground flex-1 truncate">{name}</span>
      {existing ? (
        <span className="text-[10px] text-muted-foreground/50 shrink-0">Exists</span>
      ) : (
        <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 border-[1.5px] transition-colors ${selected ? 'bg-primary border-primary' : 'border-border/50 group-hover:border-border'}`}>
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
      )}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RestaurantSetupWizard() {
  const navigate = useNavigate();
  const [existingAreas, setExistingAreas]     = useState([]);
  const [existingStations, setExistingStations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [step, setStep]         = useState(1);
  const [saving, setSaving]     = useState(false);

  // Step 1 state
  const [selectedAreas, setSelectedAreas]   = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAreaName, setCustomAreaName]   = useState('');
  const [customAreaGroup, setCustomAreaGroup] = useState('BOH');

  // Step 2 state
  const [stationPlan, setStationPlan]     = useState({});
  const [activeAreaSlug, setActiveAreaSlug] = useState(null);

  // Steps 3-4 state
  const [activeStationKey, setActiveStationKey] = useState(null);
  const [equipmentPlan, setEquipmentPlan]   = useState({});
  const [workflowPlan, setWorkflowPlan]     = useState({});
  const [equipCustomInput, setEquipCustomInput] = useState('');
  const [wfCustomInput, setWfCustomInput]   = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.Area.list().catch(() => []),
      base44.entities.Station.list().catch(() => []),
    ]).then(([areas, stations]) => {
      setExistingAreas(areas);
      setExistingStations(stations);
      setLoading(false);
    });
  }, []);

  // Pre-populate workflow defaults when entering a station in step 4
  useEffect(() => {
    if (step === 4 && activeStationKey && !workflowPlan[activeStationKey]) {
      setWorkflowPlan(prev => ({
        ...prev,
        [activeStationKey]: {
          selected: new Set(DEFAULT_WORKFLOWS.map(w => w.name)),
          custom: [], schedule: 'always',
        },
      }));
    }
  }, [step, activeStationKey]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const isExistingArea    = (name) => existingAreas.some(a => a.name.toLowerCase() === name.toLowerCase());
  const isExistingStation = (name, areaId) => existingStations.some(s => s.name.toLowerCase() === name.toLowerCase() && s.area_id === areaId);
  const isSelected        = (slug) => selectedAreas.some(a => a.slug === slug);
  const getPlan           = (slug) => stationPlan[slug] || { selectedStations: new Set(), customInput: '', customStations: [] };
  const getStationCount   = (slug) => { const p = getPlan(slug); return p.selectedStations.size + p.customStations.length; };
  const areasThatNeedStations = selectedAreas.filter(a => a.bothType !== 'station');

  const allStationEntries = areasThatNeedStations.flatMap(area => {
    const plan = stationPlan[area.slug];
    if (!plan) return [];
    return [...plan.selectedStations, ...plan.customStations].map(name => ({
      key: `${area.slug}::${name}`, name,
      areaSlug: area.slug, areaName: area.name, areaIcon: area.icon, areaGroup: area.group,
    }));
  });

  const parseActiveKey = (key) => {
    if (!key) return { area: null, stationName: null };
    const idx = key.indexOf('::');
    if (idx < 0) return { area: null, stationName: null };
    const slug = key.slice(0, idx);
    const name = key.slice(idx + 2);
    return { area: selectedAreas.find(a => a.slug === slug) || null, stationName: name };
  };

  const getEquipPlan = (key) => equipmentPlan[key] || { selected: new Set(), custom: [] };
  const getWfPlan    = (key) => workflowPlan[key]   || { selected: new Set(), custom: [], schedule: 'always' };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleArea = (area) => {
    if (isExistingArea(area.name)) return;
    setSelectedAreas(prev => prev.some(a => a.slug === area.slug)
      ? prev.filter(a => a.slug !== area.slug)
      : [...prev, { ...area, bothType: 'area' }]);
  };

  const addCustomArea = () => {
    const name = customAreaName.trim();
    if (!name) return;
    if (isExistingArea(name)) { toast.error(`"${name}" already exists.`); return; }
    if (selectedAreas.some(a => a.name.toLowerCase() === name.toLowerCase())) { toast.error(`"${name}" already added.`); return; }
    setSelectedAreas(prev => [...prev, { slug: `custom-${Date.now()}`, name, icon: MapPin, group: customAreaGroup, bothType: 'area', isCustom: true }]);
    setCustomAreaName(''); setShowCustomInput(false);
  };

  const setBothType = (slug, type) => setSelectedAreas(prev => prev.map(a => a.slug === slug ? { ...a, bothType: type } : a));

  const toggleStation = (areaSlug, name) => {
    setStationPlan(prev => {
      const p = prev[areaSlug] || { selectedStations: new Set(), customInput: '', customStations: [] };
      const next = new Set(p.selectedStations);
      if (next.has(name)) next.delete(name); else next.add(name);
      return { ...prev, [areaSlug]: { ...p, selectedStations: next } };
    });
  };

  const addCustomStation = (areaSlug) => {
    const name = (getPlan(areaSlug).customInput || '').trim();
    if (!name) return;
    setStationPlan(prev => {
      const p = prev[areaSlug] || { selectedStations: new Set(), customInput: '', customStations: [] };
      if (p.customStations.includes(name)) return prev;
      return { ...prev, [areaSlug]: { ...p, customInput: '', customStations: [...p.customStations, name] } };
    });
  };

  const removeCustomStation = (areaSlug, name) => setStationPlan(prev => {
    const p = prev[areaSlug] || { selectedStations: new Set(), customInput: '', customStations: [] };
    return { ...prev, [areaSlug]: { ...p, customStations: p.customStations.filter(s => s !== name) } };
  });

  // Equipment handlers
  const addEquipItem = (key, name) => setEquipmentPlan(prev => {
    const p = prev[key] || { selected: new Set(), custom: [] };
    return { ...prev, [key]: { ...p, selected: new Set([...p.selected, name]) } };
  });
  const removeEquipItem = (key, name) => setEquipmentPlan(prev => {
    const p = prev[key] || { selected: new Set(), custom: [] };
    return { ...prev, [key]: { ...p, selected: new Set([...p.selected].filter(n => n !== name)), custom: p.custom.filter(c => c !== name) } };
  });
  const addCustomEquip = (key) => {
    const val = equipCustomInput.trim();
    if (!val || !key) return;
    setEquipmentPlan(prev => {
      const p = prev[key] || { selected: new Set(), custom: [] };
      if (p.custom.includes(val) || p.selected.has(val)) return prev;
      return { ...prev, [key]: { ...p, custom: [...p.custom, val] } };
    });
    setEquipCustomInput('');
  };

  // Workflow handlers
  const toggleWorkflow = (key, name) => setWorkflowPlan(prev => {
    const p = prev[key] || { selected: new Set(), custom: [], schedule: 'always' };
    const sel = new Set(p.selected);
    sel.has(name) ? sel.delete(name) : sel.add(name);
    return { ...prev, [key]: { ...p, selected: sel } };
  });
  const addCustomWf = (key) => {
    const val = wfCustomInput.trim();
    if (!val || !key) return;
    setWorkflowPlan(prev => {
      const p = prev[key] || { selected: new Set(), custom: [], schedule: 'always' };
      if (p.custom.includes(val) || p.selected.has(val)) return prev;
      return { ...prev, [key]: { ...p, custom: [...p.custom, val] } };
    });
    setWfCustomInput('');
  };
  const setSchedule = (key, schedule) => setWorkflowPlan(prev => { const p = prev[key] || { selected: new Set(), custom: [], schedule: 'always' }; return { ...prev, [key]: { ...p, schedule } }; });

  const advanceToStep = (n) => {
    if (n === 3 || n === 4) {
      const first = allStationEntries[0];
      if (!activeStationKey || !allStationEntries.find(e => e.key === activeStationKey)) {
        setActiveStationKey(first?.key || null);
      }
    }
    setStep(n);
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    let created = 0, skipped = 0;
    try {
      const areaMap = {};
      existingAreas.forEach(ea => { areaMap[ea.name.toLowerCase()] = ea; });

      // 1. Create Areas
      for (const a of selectedAreas) {
        if (a.bothType === 'station') continue;
        const match = existingAreas.find(e => e.name.toLowerCase() === a.name.toLowerCase());
        if (match) { areaMap[a.slug] = match; skipped++; continue; }
        const rec = await base44.entities.Area.create({ name: a.name, isActive: true, sortOrder: Date.now() }).catch(() => null);
        if (rec) { areaMap[a.slug] = rec; created++; }
      }

      // 2. Create standalone stations (bothType station/both)
      for (const a of selectedAreas) {
        if (a.bothType === 'area') continue;
        const exists = existingStations.find(s => s.name.toLowerCase() === a.name.toLowerCase() && !s.area_id);
        if (exists) { skipped++; continue; }
        await base44.entities.Station.create({ name: a.name, department: DEPT_FOR_GROUP[a.group] || 'BOH', area_id: null, area_name: null, isActive: true }).catch(() => {});
        created++;
      }

      // 3. Create child stations + build stationKeyMap
      const stationKeyMap = {};
      existingStations.forEach(s => {
        if (!s.area_id) return;
        const matchArea = selectedAreas.find(a => { const rec = areaMap[a.slug]; return rec && rec.id === s.area_id; });
        if (matchArea) stationKeyMap[`${matchArea.slug}::${s.name}`] = s;
      });

      for (const a of areasThatNeedStations) {
        const parent = areaMap[a.slug];
        if (!parent) continue;
        const plan = getPlan(a.slug);
        for (const name of [...plan.selectedStations, ...plan.customStations]) {
          const key = `${a.slug}::${name}`;
          if (stationKeyMap[key]) { skipped++; continue; }
          const existingS = existingStations.find(s => s.name.toLowerCase() === name.toLowerCase() && s.area_id === parent.id);
          if (existingS) { stationKeyMap[key] = existingS; skipped++; continue; }
          const rec = await base44.entities.Station.create({ name, department: DEPT_FOR_GROUP[a.group] || 'BOH', area_id: parent.id, area_name: parent.name, isActive: true }).catch(() => null);
          if (rec) { stationKeyMap[key] = rec; created++; }
        }
      }

      // 4. Create Equipment records
      if (Object.keys(equipmentPlan).length > 0) {
        const existingEquip = await base44.entities.Equipment.list('name', 500).catch(() => []);
        for (const [key, plan] of Object.entries(equipmentPlan)) {
          const station = stationKeyMap[key];
          if (!station) continue;
          const [areaSlug] = key.split('::');
          const area = selectedAreas.find(a => a.slug === areaSlug);
          const areaRec = areaMap[areaSlug];
          for (const name of [...plan.selected, ...plan.custom]) {
            const exists = existingEquip.find(e => e.name.toLowerCase() === name.toLowerCase() && e.station_id === station.id);
            if (exists) { skipped++; continue; }
            await base44.entities.Equipment.create({ name, equipmentType: 'other', station_id: station.id, station_name: station.name, area_id: areaRec?.id, area_name: areaRec?.name, department: DEPT_FOR_GROUP[area?.group] || 'BOH', isActive: true }).catch(() => null);
            created++;
          }
        }
      }

      // 5. Create Template (Workflow) records
      if (Object.keys(workflowPlan).length > 0) {
        const existingTemplates = await base44.entities.Template.list('-updated_date', 200).catch(() => []);
        for (const [key, plan] of Object.entries(workflowPlan)) {
          const station = stationKeyMap[key];
          if (!station) continue;
          for (const name of [...plan.selected, ...plan.custom]) {
            const ttype = WORKFLOW_TEMPLATE_TYPE[name] || 'custom';
            const exists = existingTemplates.find(t => t.name.toLowerCase() === name.toLowerCase() && t.station_id === station.id);
            if (exists) { skipped++; continue; }
            await base44.entities.Template.create({ name, template_type: ttype, station_id: station.id, is_active: true, repeat: 'daily' }).catch(() => null);
            created++;
          }
        }
      }

      // Mark restaurant setup as complete
      const flagKey = 'restaurant_setup_completed';
      const existingFlag = await base44.entities.Settings.filter({ key: flagKey }).catch(() => []);
      const flagPayload = { key: flagKey, value: 'true' };
      if (existingFlag && existingFlag.length > 0) {
        await base44.entities.Settings.update(existingFlag[0].id, flagPayload).catch(() => {});
      } else {
        await base44.entities.Settings.create(flagPayload).catch(() => {});
      }

      toast.success(`Done! Created ${created} item${created !== 1 ? 's' : ''}.${skipped ? ` (${skipped} already existed)` : ''}`);
      navigate('/operational-map');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Step 1: Areas ─────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
      <div className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-border/30">
          <div className="flex items-center gap-2 mb-1"><MapPin className="h-4 w-4 text-primary" /><h2 className="text-lg font-black text-foreground">Start with Areas</h2></div>
          <p className="text-sm text-muted-foreground">Select the areas that exist in your restaurant. You can add or refine them later.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/30 min-w-0">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-black text-primary">BOH</span>
              <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">Back of House</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {BOH_AREAS.map(area => (
                <AreaCard key={area.slug} name={area.name} icon={area.icon} group="BOH"
                  selected={isSelected(area.slug)} existing={isExistingArea(area.name)}
                  onToggle={() => toggleArea({ ...area, group: 'BOH' })} />
              ))}
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-black text-blue-400">FOH</span>
              <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">Front of House</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FOH_AREAS.map(area => (
                <AreaCard key={area.slug} name={area.name} icon={area.icon} group="FOH"
                  selected={isSelected(area.slug)} existing={isExistingArea(area.name)}
                  onToggle={() => toggleArea({ ...area, group: 'FOH' })} />
              ))}
            </div>
          </div>
        </div>
        {(showCustomInput || selectedAreas.filter(a => a.isCustom).length > 0) && (
          <div className="px-5 pb-5 pt-3 border-t border-border/30">
            {showCustomInput && (
              <div className="flex gap-2">
                <input autoFocus value={customAreaName} onChange={e => setCustomAreaName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCustomArea(); if (e.key === 'Escape') setShowCustomInput(false); }}
                  placeholder="e.g. Rooftop Bar…"
                  className="flex-1 h-10 px-3 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <select value={customAreaGroup} onChange={e => setCustomAreaGroup(e.target.value)} className="h-10 px-2 rounded-2xl border border-border bg-background text-sm text-foreground">
                  <option value="BOH">BOH</option><option value="FOH">FOH</option><option value="Bar">Bar</option>
                </select>
                <button onClick={addCustomArea} disabled={!customAreaName.trim()} className="h-10 px-4 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40">Add</button>
                <button onClick={() => setShowCustomInput(false)} className="h-10 w-10 rounded-2xl border border-border text-muted-foreground hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
            )}
            {selectedAreas.filter(a => a.isCustom).length > 0 && (
              <div className={`flex flex-wrap gap-1.5 ${showCustomInput ? 'mt-2' : ''}`}>
                {selectedAreas.filter(a => a.isCustom).map(a => (
                  <div key={a.slug} className="flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-primary/10 border border-primary/30">
                    <span className="text-xs font-semibold text-primary">{a.name}</span>
                    <button onClick={() => setSelectedAreas(p => p.filter(x => x.slug !== a.slug))} className="text-muted-foreground hover:text-red-400 ml-0.5"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="sticky bottom-0 mt-4 -mx-4 lg:mx-0 px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-border/40 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {selectedAreas.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-sm font-bold text-foreground">{selectedAreas.length} area{selectedAreas.length !== 1 ? 's' : ''} selected</span>
              </div>
              {existingAreas.length > 0 && (
                <span className="text-xs text-muted-foreground">{existingAreas.length} already in your setup</span>
              )}
            </div>
          ) : existingAreas.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
              <span className="text-sm text-muted-foreground">{existingAreas.length} already in your setup</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Select areas to get started</p>
          )}
        </div>
        <button
          onClick={() => setShowCustomInput(true)}
          className="h-10 px-4 rounded-2xl border border-border/60 text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Custom</span>
        </button>
        <button
          onClick={() => { setActiveAreaSlug(selectedAreas[0]?.slug || null); setStep(2); }}
          disabled={selectedAreas.length === 0}
          className="h-10 px-5 rounded-2xl bg-primary text-white text-sm font-black disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-[0.98] shrink-0 whitespace-nowrap"
        >
          Continue to Stations <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );

  // ── Step 2: Stations ──────────────────────────────────────────────────────

  const renderStep2 = () => {
    const areasToSetup = areasThatNeedStations;
    const activeArea = areasToSetup.find(a => a.slug === activeAreaSlug) || areasToSetup[0];
    if (!activeArea) return null;
    const plan = getPlan(activeArea.slug);
    const suggestions = STATION_SUGGESTIONS[activeArea.name] || [];
    const parentAreaFromDb = existingAreas.find(e => e.name.toLowerCase() === activeArea.name.toLowerCase());
    const bothCandidatesInSelection = selectedAreas.filter(a => BOTH_CANDIDATES.has(a.name));
    const totalSelected = areasThatNeedStations.reduce((sum, a) => sum + getStationCount(a.slug), 0);
    const allSelectedNames = areasThatNeedStations.flatMap(a => { const p = getPlan(a.slug); return [...p.selectedStations, ...p.customStations]; });

    return (
      <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
        <div className="mb-4">
          <h2 className="text-xl font-black text-foreground">Add Stations to Your Areas</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose work positions inside each area.</p>
        </div>
        <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-5">
          <div className="hidden lg:block">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Your Areas</p>
            <div className="space-y-1">
              {areasToSetup.map(a => {
                const count = getStationCount(a.slug);
                const isActive = a.slug === activeAreaSlug;
                return (
                  <button key={a.slug} onClick={() => setActiveAreaSlug(a.slug)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-left transition-colors border ${isActive ? 'glow-active border-primary/30' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'}`}>
                    <a.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-bold flex-1 truncate ${isActive ? 'text-foreground' : ''}`}>{a.name}</span>
                    {count > 0 && <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-5 min-w-0">
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {areasToSetup.map(a => {
                const isActive = a.slug === activeAreaSlug;
                return (
                  <button key={a.slug} onClick={() => setActiveAreaSlug(a.slug)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${isActive ? 'glow-active border-primary/30 text-foreground' : 'border-border/40 bg-card text-muted-foreground'}`}>
                    <a.icon className="h-3 w-3" /> {a.name}
                    {getStationCount(a.slug) > 0 && <Check className="h-3 w-3 text-green-400" />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0"><activeArea.icon className="h-5 w-5 text-primary" /></div>
              <div><h3 className="text-lg font-black text-foreground">{activeArea.name}</h3><p className="text-xs text-muted-foreground">Select stations within this area.</p></div>
            </div>
            {activeArea.bothType === 'station' ? (
              <div className="rounded-2xl border border-border/40 bg-card/40 p-5 text-center space-y-1.5">
                <Layers className="h-7 w-7 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-bold text-foreground">{activeArea.name} will be a work position only.</p>
                <p className="text-xs text-muted-foreground">Move to the next area or continue.</p>
              </div>
            ) : (
              <>
                {suggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-foreground mb-1">Suggested Stations</p>
                    <p className="text-[11px] text-muted-foreground mb-2.5">Common work positions in {activeArea.name}.</p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {suggestions.map(({ name, icon }) => (
                        <StationRow key={name} name={name} icon={icon}
                          selected={plan.selectedStations.has(name)}
                          existing={isExistingStation(name, parentAreaFromDb?.id)}
                          onToggle={() => toggleStation(activeArea.slug, name)} />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-foreground mb-2">Add Custom Station</p>
                  <div className="flex gap-2">
                    <input value={plan.customInput || ''}
                      onChange={e => setStationPlan(prev => ({ ...prev, [activeArea.slug]: { ...(prev[activeArea.slug] || { selectedStations: new Set(), customStations: [] }), customInput: e.target.value } }))}
                      onKeyDown={e => e.key === 'Enter' && addCustomStation(activeArea.slug)}
                      placeholder="Station name…"
                      className="flex-1 h-10 px-3 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                    <button onClick={() => addCustomStation(activeArea.slug)} disabled={!(plan.customInput || '').trim()} className="h-10 px-4 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40">Add</button>
                  </div>
                  {plan.customStations.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {plan.customStations.map(name => (
                        <div key={name} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-primary/10 border border-primary/30">
                          <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-sm font-medium text-foreground flex-1">{name}</span>
                          <button onClick={() => removeCustomStation(activeArea.slug, name)} className="text-muted-foreground hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            {bothCandidatesInSelection.length > 0 && (
              <div>
                <p className="text-xs font-bold text-foreground mb-1">Can be Both</p>
                <p className="text-[11px] text-muted-foreground mb-3">Some areas also function as a work station themselves.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bothCandidatesInSelection.map(area => (
                    <div key={area.slug} className="rounded-2xl border border-border/50 bg-card p-3.5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-7 w-7 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0"><area.icon className="h-3.5 w-3.5 text-green-400" /></div>
                        <span className="text-sm font-bold text-foreground">{area.name}</span>
                      </div>
                      <div className="flex rounded-2xl border border-border/50 overflow-hidden">
                        {[{ v: 'area', label: 'Area' }, { v: 'station', label: 'Station' }, { v: 'both', label: 'Both' }].map(({ v, label }) => (
                          <button key={v} onClick={() => setBothType(area.slug, v)}
                            className={`flex-1 py-2 text-xs font-bold transition-colors border-r border-border/30 last:border-r-0 ${area.bothType === v ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mt-2 leading-relaxed">
                        {area.bothType === 'area' && `${area.name} is a zone. Create stations inside it.`}
                        {area.bothType === 'station' && `${area.name} is a single work position.`}
                        {area.bothType === 'both' && `Creates "${area.name}" area and "${area.name} Station" inside it.`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="sticky bottom-0 mt-6 -mx-4 lg:mx-0 px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-border/40 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {totalSelected > 0 ? (
              <div className="flex items-center gap-2 min-w-0">
                <Check className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-sm font-bold text-green-400 shrink-0">{totalSelected} station{totalSelected !== 1 ? 's' : ''} selected</span>
                <span className="text-xs text-muted-foreground truncate hidden sm:block">— {allSelectedNames.join(', ')}</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Select stations for your areas above</p>
            )}
          </div>
          <button onClick={() => setStep(1)} className="h-10 px-4 rounded-2xl border border-border/60 text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1.5 shrink-0">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={() => advanceToStep(3)} className="h-10 px-5 rounded-2xl bg-primary text-white text-sm font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-[0.98] shrink-0">
            Save &amp; Continue <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  // ── Step 3: Equipment ─────────────────────────────────────────────────────

  const renderStep3 = () => {
    const { area: activeArea, stationName } = parseActiveKey(activeStationKey);
    const equipPlan = getEquipPlan(activeStationKey || '');
    const suggestions = (EQUIPMENT_SUGGESTIONS[stationName] || []).filter(s => !equipPlan.selected.has(s.name));
    const assignedAll = [...equipPlan.selected, ...equipPlan.custom];

    return (
      <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
        {/* Mobile station tabs */}
        <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide mb-4">
          {allStationEntries.map(({ key, name, areaName }) => {
            const isActive = key === activeStationKey;
            const ep = getEquipPlan(key);
            return (
              <button key={key} onClick={() => setActiveStationKey(key)}
                className={`shrink-0 flex flex-col items-start px-3 py-2 rounded-2xl border text-xs font-bold transition-colors ${isActive ? 'glow-active border-primary/30' : 'border-border/40 bg-card text-muted-foreground'}`}>
                <span className={isActive ? 'text-foreground' : ''}>{name}</span>
                <span className="text-[10px] text-muted-foreground/60 font-normal">{areaName}</span>
                {(ep.selected.size + ep.custom.length) > 0 && <Check className="h-3 w-3 text-green-400 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Mobile: context card */}
        {activeArea && stationName && (
          <div className="lg:hidden mb-4 rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-border/30">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0"><activeArea.icon className="h-4 w-4 text-primary" /></div>
                <div><p className="text-sm font-bold text-foreground">{activeArea.name}</p><p className="text-[11px] text-muted-foreground">Area</p></div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0"><Layers className="h-4 w-4 text-blue-400" /></div>
                <div><p className="text-sm font-bold text-foreground">{stationName}</p><p className="text-[11px] text-muted-foreground">Station</p></div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile: equipment definition chip */}
        <div className="lg:hidden mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/50 bg-card">
          <div className="h-8 w-8 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-green-400" /></div>
          <p className="text-sm text-foreground flex-1"><span className="font-bold">Equipment</span> = what the station uses or checks.</p>
          <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
        </div>

        {/* Desktop: 3-column grid */}
        <div className="lg:grid lg:grid-cols-[240px_1fr_240px] lg:gap-5 lg:items-start">
          {/* Left: tree */}
          <div className="hidden lg:block">
            <AreasStationsPanel selectedAreas={selectedAreas} stationPlan={stationPlan} activeKey={activeStationKey}
              onSelect={setActiveStationKey} equipmentPlan={equipmentPlan} workflowPlan={workflowPlan}
              step={3} onAddArea={() => setStep(1)} />
          </div>

          {/* Middle: content */}
          <div className="space-y-5 min-w-0">
            {/* Breadcrumb (desktop) */}
            {activeArea && stationName && (
              <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{activeArea.name}</span>
                <ChevronRight className="h-4 w-4" />
                <span className="font-bold text-primary">{stationName}</span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black text-foreground">Assign Equipment</h2>
              <p className="text-sm text-muted-foreground mt-1">Add the major equipment this station owns. You can skip and add more later.</p>
            </div>

            {/* Assigned equipment */}
            {assignedAll.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                  <p className="text-sm font-bold text-foreground">Equipment assigned to {stationName} ({assignedAll.length})</p>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-primary px-3 py-1.5 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
                    <Zap className="h-3 w-3" /> Quick Add
                  </button>
                </div>
                <div className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {assignedAll.map(name => (
                    <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-green-500/25 bg-green-500/5 group">
                      <Package className="h-4 w-4 text-green-400 shrink-0" />
                      <span className="text-sm font-semibold text-foreground flex-1 truncate">{name}</span>
                      <button onClick={() => removeEquipItem(activeStationKey, name)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                      <Check className="h-4 w-4 text-green-400 shrink-0 group-hover:hidden" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested equipment */}
            {suggestions.length > 0 && (
              <div>
                <p className="text-sm font-bold text-foreground mb-3">Suggested equipment for {stationName}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map(({ name, desc }) => (
                    <div key={name} className="rounded-2xl border border-border/50 bg-card p-4 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0"><Package className="h-5 w-5 text-muted-foreground" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground leading-tight">{name}</p>
                        {desc && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>}
                      </div>
                      <button onClick={() => addEquipItem(activeStationKey, name)}
                        className="shrink-0 h-7 px-3 rounded-2xl border border-blue-500/40 bg-blue-500/10 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors">
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No suggestions */}
            {suggestions.length === 0 && assignedAll.length === 0 && (
              <div className="rounded-2xl border border-border/40 bg-card/40 p-6 text-center">
                <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground">No suggestions for {stationName}</p>
                <p className="text-xs text-muted-foreground mt-1">Add custom equipment below or skip for now.</p>
              </div>
            )}

            {/* Custom equipment */}
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <p className="text-sm font-bold text-foreground mb-3">Add custom equipment</p>
              <div className="flex gap-2">
                <input value={equipCustomInput} onChange={e => setEquipCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomEquip(activeStationKey)}
                  placeholder="Enter equipment name"
                  className="flex-1 h-10 px-3 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <button onClick={() => addCustomEquip(activeStationKey)} disabled={!equipCustomInput.trim()}
                  className="h-10 px-4 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40 flex items-center gap-1.5 hover:bg-primary/90">
                  + Add Custom
                </button>
              </div>
            </div>
          </div>

          {/* Right: progress panel */}
          <div className="hidden lg:block">
            <RightProgressPanel step={3} activeArea={activeArea} activeStationName={stationName}
              equipmentPlan={equipmentPlan} workflowPlan={workflowPlan} activeKey={activeStationKey} />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 mt-6 -mx-4 lg:mx-0 px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-border/40 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {Object.values(equipmentPlan).some(p => p.selected.size + p.custom.length > 0) ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-sm font-bold text-green-400">
                  {Object.values(equipmentPlan).reduce((s, p) => s + p.selected.size + p.custom.length, 0)} items assigned
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Add equipment above or skip for now</p>
            )}
          </div>
          <button onClick={() => navigate('/setup-journey')} className="h-10 px-4 rounded-2xl border border-border/60 text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors shrink-0">
            Skip
          </button>
          <button onClick={() => setStep(2)} className="h-10 px-4 rounded-2xl border border-border/60 text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1.5 shrink-0">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={() => advanceToStep(4)} className="h-10 px-5 rounded-2xl bg-primary text-white text-sm font-black flex items-center gap-2 hover:bg-primary/90 transition-colors active:scale-[0.98] shrink-0">
            Save &amp; Continue <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  // ── Step 4: Workflows ─────────────────────────────────────────────────────

  const renderStep4 = () => {
    const { area: activeArea, stationName } = parseActiveKey(activeStationKey);
    const wfPlan = getWfPlan(activeStationKey || '');
    const assignedWfs = [...wfPlan.selected, ...wfPlan.custom];
    const suggestedWfs = (WORKFLOW_SUGGESTIONS[stationName] || []).filter(s => !wfPlan.selected.has(s.name) && !wfPlan.custom.includes(s.name));
    const SCHEDULES = [
      { v: 'opening',   label: 'Opening',   icon: Sun },
      { v: 'mid-shift', label: 'Mid-Shift',  icon: RefreshCw },
      { v: 'closing',   label: 'Closing',   icon: Moon },
      { v: 'always',    label: 'Always',    icon: Zap },
    ];

    return (
      <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
        {/* Mobile station tabs */}
        <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide mb-4">
          {allStationEntries.map(({ key, name, areaName }) => {
            const isActive = key === activeStationKey;
            const wp = getWfPlan(key);
            return (
              <button key={key} onClick={() => setActiveStationKey(key)}
                className={`shrink-0 flex flex-col items-start px-3 py-2 rounded-2xl border text-xs font-bold transition-colors ${isActive ? 'glow-active border-primary/30' : 'border-border/40 bg-card text-muted-foreground'}`}>
                <span className={isActive ? 'text-foreground' : ''}>{name}</span>
                <span className="text-[10px] text-muted-foreground/60 font-normal">{areaName}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile: context card */}
        {activeArea && stationName && (
          <div className="lg:hidden mb-4 rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0"><activeArea.icon className="h-5 w-5 text-primary" /></div>
            <div className="flex-1">
              <p className="text-base font-black text-foreground">{stationName}</p>
              <p className="text-xs text-muted-foreground">{activeArea.name}</p>
            </div>
            <button onClick={() => setStep(2)} className="text-xs font-bold text-blue-400 px-3 py-1.5 rounded-2xl border border-blue-500/30 bg-blue-500/10">✏ Change</button>
          </div>
        )}

        {/* Desktop: 3-column grid */}
        <div className="lg:grid lg:grid-cols-[240px_1fr_240px] lg:gap-5 lg:items-start">
          {/* Left: tree */}
          <div className="hidden lg:block">
            <AreasStationsPanel selectedAreas={selectedAreas} stationPlan={stationPlan} activeKey={activeStationKey}
              onSelect={k => { setActiveStationKey(k); }} equipmentPlan={equipmentPlan} workflowPlan={workflowPlan}
              step={4} onAddArea={() => setStep(1)} />
          </div>

          {/* Middle: content */}
          <div className="space-y-5 min-w-0">
            {activeArea && stationName && (
              <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{activeArea.name}</span>
                <ChevronRight className="h-4 w-4" />
                <span className="font-bold text-primary">{stationName}</span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black text-foreground">Assign Workflows</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose what this station is responsible for each day.</p>
            </div>

            {/* Assigned workflows grid */}
            {assignedWfs.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                  <p className="text-sm font-bold text-foreground">Workflows assigned to {stationName}</p>
                  <span className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-black text-white">{assignedWfs.length}</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                  {DEFAULT_WORKFLOWS.map(wf => {
                    const isAssigned = wfPlan.selected.has(wf.name);
                    return (
                      <button key={wf.name} onClick={() => toggleWorkflow(activeStationKey, wf.name)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border transition-colors text-left ${isAssigned ? 'border-green-500/25 bg-green-500/5' : 'border-border/40 bg-card/50 opacity-50'}`}>
                        <wf.icon className={`h-4 w-4 shrink-0 ${isAssigned ? 'text-green-400' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-semibold text-foreground flex-1 truncate">{wf.name}</span>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${isAssigned ? 'text-green-400' : 'text-muted-foreground/30'}`} />
                      </button>
                    );
                  })}
                  {wfPlan.custom.map(name => (
                    <div key={name} className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border border-green-500/25 bg-green-500/5">
                      <Zap className="h-4 w-4 text-green-400 shrink-0" />
                      <span className="text-xs font-semibold text-foreground flex-1 truncate">{name}</span>
                      <button onClick={() => setWorkflowPlan(prev => { const p = getWfPlan(activeStationKey); return { ...prev, [activeStationKey]: { ...p, custom: p.custom.filter(c => c !== name) } }; })}
                        className="text-muted-foreground hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* When should this run */}
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <p className="text-sm font-bold text-foreground mb-3">When should this run?</p>
              <div className="flex rounded-2xl border border-border/50 overflow-hidden">
                {SCHEDULES.map(({ v, label, icon: Icon }) => (
                  <button key={v} onClick={() => setSchedule(activeStationKey, v)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors border-r border-border/30 last:border-r-0 ${wfPlan.schedule === v ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-[11px] font-bold">{label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {wfPlan.schedule === 'opening' && 'These workflows will be required at the start of each shift.'}
                {wfPlan.schedule === 'mid-shift' && 'These workflows will be required during the middle of each shift.'}
                {wfPlan.schedule === 'closing' && 'These workflows will be required at the end of each shift.'}
                {wfPlan.schedule === 'always' && 'These workflows will be required for every shift.'}
              </p>
            </div>

            {/* Suggested workflows */}
            {suggestedWfs.length > 0 && (
              <div>
                <p className="text-sm font-bold text-foreground mb-3">Suggested Workflows</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestedWfs.map(({ name, desc, icon: Icon }) => (
                    <div key={name} className="rounded-2xl border border-border/50 bg-card p-4 flex items-start gap-3">
                      <div className="h-9 w-9 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground leading-tight">{name}</p>
                        {desc && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>}
                      </div>
                      <button onClick={() => toggleWorkflow(activeStationKey, name)}
                        className="shrink-0 h-7 px-3 rounded-2xl border border-blue-500/40 bg-blue-500/10 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors">
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow definition (mobile) */}
            <div className="lg:hidden flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/50 bg-card">
              <div className="h-8 w-8 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><Zap className="h-4 w-4 text-blue-400" /></div>
              <p className="text-sm text-foreground flex-1"><span className="font-bold">Workflow</span> = what the station must do. Checklists, logs, and tasks your team follows.</p>
            </div>

            {/* Custom workflow */}
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <p className="text-sm font-bold text-foreground mb-3">Add custom workflow</p>
              <div className="flex gap-2">
                <input value={wfCustomInput} onChange={e => setWfCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomWf(activeStationKey)}
                  placeholder="Enter workflow name"
                  className="flex-1 h-10 px-3 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <button onClick={() => addCustomWf(activeStationKey)} disabled={!wfCustomInput.trim()}
                  className="h-10 px-4 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40 flex items-center gap-1.5 hover:bg-primary/90">
                  + Add Custom
                </button>
              </div>
            </div>

            {/* Mobile summary */}
            {assignedWfs.length > 0 && (
              <div className="lg:hidden flex items-center gap-3 px-4 py-3 rounded-2xl border border-green-500/30 bg-green-500/5">
                <Check className="h-5 w-5 text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-400">{assignedWfs.length} workflow{assignedWfs.length !== 1 ? 's' : ''} selected</p>
                  <p className="text-xs text-muted-foreground">These will be required for this station.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </div>
            )}

            {assignedWfs.length === 0 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/80">This station has no workflows yet. You can add them later from the station page.</p>
              </div>
            )}
          </div>

          {/* Right: progress panel */}
          <div className="hidden lg:block">
            <RightProgressPanel step={4} activeArea={activeArea} activeStationName={stationName}
              equipmentPlan={equipmentPlan} workflowPlan={workflowPlan} activeKey={activeStationKey} />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 mt-6 -mx-4 lg:mx-0 px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-border/40 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {Object.values(workflowPlan).some(p => p.selected.size + p.custom.length > 0) ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-sm font-bold text-green-400">
                  {Object.values(workflowPlan).reduce((s, p) => s + p.selected.size + p.custom.length, 0)} workflows assigned
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Assign workflows above or continue</p>
            )}
          </div>
          <button onClick={() => setStep(3)} className="h-10 px-4 rounded-2xl border border-border/60 text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1.5 shrink-0">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={() => setStep(5)} className="h-10 px-5 rounded-2xl bg-primary text-white text-sm font-black flex items-center gap-2 hover:bg-primary/90 transition-colors active:scale-[0.98] shrink-0">
            Continue to Review <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  // ── Step 5: Review ────────────────────────────────────────────────────────

  const renderStep5 = () => {
    const newAreas = selectedAreas.filter(a => !isExistingArea(a.name) && a.bothType !== 'station').length;
    const newStations = areasThatNeedStations.reduce((s, a) => s + getStationCount(a.slug), 0) +
      selectedAreas.filter(a => a.bothType !== 'area' && !existingStations.some(s => s.name.toLowerCase() === a.name.toLowerCase() && !s.area_id)).length;
    const totalEquip = Object.values(equipmentPlan).reduce((s, p) => s + p.selected.size + p.custom.length, 0);
    const totalWf    = Object.values(workflowPlan).reduce((s, p) => s + p.selected.size + p.custom.length, 0);

    const stationsWithNoEquip = allStationEntries.filter(e => { const p = equipmentPlan[e.key]; return !p || (p.selected.size === 0 && p.custom.length === 0); });
    const stationsWithNoWf   = allStationEntries.filter(e => { const p = workflowPlan[e.key]; return !p || (p.selected.size === 0 && p.custom.length === 0); });

    return (
      <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
        <div className="mb-5">
          <h2 className="text-xl font-black text-foreground">Review Your Setup</h2>
          <p className="text-sm text-muted-foreground mt-1">Confirm everything before saving.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: `New Area${newAreas !== 1 ? 's' : ''}`,    value: newAreas,    color: 'text-primary' },
            { label: `New Station${newStations !== 1 ? 's' : ''}`, value: newStations, color: 'text-blue-400' },
            { label: 'Equipment Items', value: totalEquip, color: 'text-green-400' },
            { label: 'Workflows',       value: totalWf,    color: 'text-purple-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-border/50 bg-card px-4 py-4 text-center">
              <p className={`text-3xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {(stationsWithNoEquip.length > 0 || stationsWithNoWf.length > 0) && (
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 space-y-1">
            <div className="flex items-center gap-2 mb-1"><AlertCircle className="h-4 w-4 text-amber-400" /><p className="text-sm font-bold text-foreground">Heads up</p></div>
            {stationsWithNoEquip.length > 0 && <p className="text-xs text-muted-foreground">{stationsWithNoEquip.length} station{stationsWithNoEquip.length !== 1 ? 's have' : ' has'} no equipment — you can add it later from each station page.</p>}
            {stationsWithNoWf.length > 0   && <p className="text-xs text-muted-foreground">{stationsWithNoWf.length} station{stationsWithNoWf.length !== 1 ? 's have' : ' has'} no workflows — you can add them later.</p>}
          </div>
        )}

        {/* Nothing new warning */}
        {newAreas === 0 && newStations === 0 && (
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-center space-y-2">
            <AlertCircle className="h-6 w-6 text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-foreground">Nothing new to save</p>
            <p className="text-xs text-muted-foreground">All selected areas and stations already exist.</p>
          </div>
        )}

        {/* Nested review */}
        <div className="space-y-3 mb-5">
          {areasThatNeedStations.map(area => {
            const plan = getPlan(area.slug);
            const stations = [...plan.selectedStations, ...plan.customStations];
            return (
              <div key={area.slug} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className={`flex items-center gap-3 px-4 py-3 border-b border-border/30 ${area.group === 'FOH' ? 'bg-blue-500/5' : 'bg-primary/5'}`}>
                  <area.icon className={`h-4 w-4 ${area.group === 'FOH' ? 'text-blue-400' : 'text-primary'}`} />
                  <span className="text-sm font-bold text-foreground flex-1">{area.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${area.group === 'FOH' ? 'text-blue-400 bg-blue-500/10' : 'text-primary bg-primary/10'}`}>{area.group}</span>
                  {isExistingArea(area.name) && <span className="text-[9px] font-bold text-muted-foreground/50 uppercase bg-muted px-1.5 py-0.5 rounded">Exists</span>}
                </div>
                <div className="divide-y divide-border/20">
                  {stations.length === 0 && <p className="px-4 py-3 text-xs text-muted-foreground italic">No stations selected</p>}
                  {stations.map(sName => {
                    const key = `${area.slug}::${sName}`;
                    const ep = equipmentPlan[key] || { selected: new Set(), custom: [] };
                    const wp = workflowPlan[key]   || { selected: new Set(), custom: [] };
                    const eItems = [...ep.selected, ...ep.custom];
                    const wItems = [...wp.selected, ...wp.custom];
                    return (
                      <div key={sName} className="px-4 py-3 pl-8">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Layers className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          <span className="text-sm font-bold text-foreground">{sName}</span>
                        </div>
                        {eItems.length > 0 && (
                          <p className="text-xs mb-1"><span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wide">Equipment: </span><span className="text-foreground/80">{eItems.join(', ')}</span></p>
                        )}
                        {wItems.length > 0 && (
                          <p className="text-xs"><span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wide">Workflows: </span><span className="text-foreground/80">{wItems.join(', ')}</span></p>
                        )}
                        {eItems.length === 0 && wItems.length === 0 && <p className="text-xs text-muted-foreground/50 italic">No equipment or workflows assigned yet</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pb-8 lg:pb-0">
          <button onClick={() => setStep(4)} className="h-12 px-5 rounded-2xl border border-border/60 text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={handleSave} disabled={saving || (newAreas === 0 && newStations === 0)}
            className="flex-1 h-12 rounded-2xl bg-primary text-white text-sm font-black disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-[0.98]">
            {saving ? 'Saving…' : <><span>Save Setup</span><ChevronRight className="h-4 w-4" /></>}
          </button>
        </div>
      </motion.div>
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your restaurant setup…</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const is3Col = step === 3 || step === 4;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 pt-4 pb-3 lg:hidden">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Restaurant Setup Wizard</p>
        <Stepper step={step} />
      </div>

      {/* Desktop outer wrapper */}
      <div className={`${is3Col ? '' : 'lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start'} lg:px-6 lg:py-8`}>
        <main className="px-4 pt-5 pb-4 lg:px-0 lg:pt-0 min-w-0 overflow-hidden">
          {/* Desktop header */}
          <div className="hidden lg:block mb-7">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-black text-foreground">Restaurant Setup Wizard</h1>
              <button onClick={() => navigate('/setup-journey')}
                className="flex items-center gap-2 text-sm font-bold text-muted-foreground px-4 py-2 rounded-2xl border border-border/60 hover:bg-secondary transition-colors">
                <X className="h-4 w-4" /> Exit Setup
              </button>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/50 px-6 py-4">
              <Stepper step={step} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </AnimatePresence>
        </main>

        {/* Right sidebar (steps 1, 2, 5 only) */}
        {!is3Col && (
          <aside className="hidden lg:block" style={{ paddingTop: 148 }}>
            <HelperPanel step={step} />
          </aside>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;
