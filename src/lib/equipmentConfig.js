import { Droplets, Waves, Thermometer, Refrigerator, Snowflake, Flame, GlassWater, Wind, Package, Beer } from 'lucide-react';

export const EQUIPMENT_TYPE_META = {
  // Sinks
  'hand-sink':            { icon: Droplets,     iconColor: 'text-blue-400',   bg: 'rgba(59,130,246,0.12)'  },
  'prep-sink':            { icon: Droplets,     iconColor: 'text-blue-400',   bg: 'rgba(59,130,246,0.12)'  },
  '3-compartment-sink':   { icon: Droplets,     iconColor: 'text-blue-400',   bg: 'rgba(59,130,246,0.12)'  },
  'dish-sink':            { icon: Droplets,     iconColor: 'text-blue-400',   bg: 'rgba(59,130,246,0.12)'  },
  // Dish machines
  'dish-machine':         { icon: Waves,        iconColor: 'text-blue-400',   bg: 'rgba(59,130,246,0.12)'  },
  'glass-washer':         { icon: Waves,        iconColor: 'text-blue-400',   bg: 'rgba(59,130,246,0.12)'  },
  // Cold storage
  'walk-in-cooler':       { icon: Refrigerator, iconColor: 'text-cyan-400',   bg: 'rgba(34,211,238,0.10)'  },
  'walk-in-freezer':      { icon: Snowflake,    iconColor: 'text-cyan-400',   bg: 'rgba(34,211,238,0.10)'  },
  'reach-in-cooler':      { icon: Refrigerator, iconColor: 'text-cyan-400',   bg: 'rgba(34,211,238,0.10)'  },
  'reach-in-freezer':     { icon: Snowflake,    iconColor: 'text-cyan-400',   bg: 'rgba(34,211,238,0.10)'  },
  'prep-table-cooler':    { icon: Refrigerator, iconColor: 'text-cyan-400',   bg: 'rgba(34,211,238,0.10)'  },
  'lowboy-cooler':        { icon: Refrigerator, iconColor: 'text-cyan-400',   bg: 'rgba(34,211,238,0.10)'  },
  'chest-freezer':        { icon: Snowflake,    iconColor: 'text-cyan-400',   bg: 'rgba(34,211,238,0.10)'  },
  'ice-machine':          { icon: Snowflake,    iconColor: 'text-cyan-400',   bg: 'rgba(34,211,238,0.10)'  },
  // Bar
  'beer-cooler':          { icon: Beer,         iconColor: 'text-amber-400',  bg: 'rgba(245,158,11,0.10)'  },
  'wine-cooler':          { icon: GlassWater,   iconColor: 'text-purple-400', bg: 'rgba(168,85,247,0.10)'  },
  'soda-gun':             { icon: GlassWater,   iconColor: 'text-blue-400',   bg: 'rgba(59,130,246,0.12)'  },
  // Hot cooking
  'fryer':                { icon: Flame,        iconColor: 'text-orange-400', bg: 'rgba(249,115,22,0.12)'  },
  'flat-top':             { icon: Flame,        iconColor: 'text-orange-400', bg: 'rgba(249,115,22,0.12)'  },
  'grill':                { icon: Flame,        iconColor: 'text-orange-400', bg: 'rgba(249,115,22,0.12)'  },
  'oven':                 { icon: Flame,        iconColor: 'text-orange-400', bg: 'rgba(249,115,22,0.12)'  },
  'steam-table':          { icon: Waves,        iconColor: 'text-amber-400',  bg: 'rgba(245,158,11,0.10)'  },
  'hot-holding-cabinet':  { icon: Flame,        iconColor: 'text-amber-400',  bg: 'rgba(245,158,11,0.10)'  },
  // Utility
  'hood-system':          { icon: Wind,         iconColor: 'text-slate-400',  bg: 'rgba(148,163,184,0.10)' },
  'hvac':                 { icon: Wind,         iconColor: 'text-slate-400',  bg: 'rgba(148,163,184,0.10)' },
  'grease-trap':          { icon: Droplets,     iconColor: 'text-yellow-400', bg: 'rgba(234,179,8,0.10)'   },
  'water-heater':         { icon: Thermometer,  iconColor: 'text-orange-400', bg: 'rgba(249,115,22,0.12)'  },
  // Default
  'other':                { icon: Package,      iconColor: 'text-muted-foreground', bg: 'rgba(148,163,184,0.08)' },
};

export function getEquipmentMeta(type) {
  return EQUIPMENT_TYPE_META[type] || EQUIPMENT_TYPE_META['other'];
}
