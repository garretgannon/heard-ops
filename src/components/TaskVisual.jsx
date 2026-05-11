import { useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Flame,
  PackageCheck,
  Sparkles,
  Tags,
  Thermometer,
  Utensils,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PREP_VISUALS = [
  { match: ['ranch', 'sauce', 'dressing', 'aioli', 'mayo'], src: '/demo-prep/ranch.svg', tone: 'amber', icon: Utensils },
  { match: ['pico', 'salsa', 'tomato'], src: '/demo-prep/pico.svg', tone: 'orange', icon: Utensils },
  { match: ['romaine', 'lettuce', 'greens', 'salad'], src: '/demo-prep/romaine.svg', tone: 'green', icon: Utensils },
  { match: ['guac', 'avocado'], src: '/demo-prep/guacamole.svg', tone: 'green', icon: Utensils },
];

const FALLBACK_VISUALS = [
  { match: ['sanitize', 'clean', 'wipe', 'polish', 'soap'], tone: 'blue', icon: Sparkles, label: 'Clean' },
  { match: ['wash', 'rinse'], tone: 'blue', icon: Droplets, label: 'Wash' },
  { match: ['chop', 'cut', 'slice', 'dice'], tone: 'green', icon: Utensils, label: 'Cut' },
  { match: ['mix', 'whisk', 'stir', 'combine'], tone: 'orange', icon: Utensils, label: 'Mix' },
  { match: ['cook', 'heat', 'grill', 'saute', 'roast'], tone: 'red', icon: Flame, label: 'Cook' },
  { match: ['cool', 'chill', 'freeze', 'cold'], tone: 'blue', icon: Thermometer, label: 'Chill' },
  { match: ['portion', 'pan', 'container', 'stock', 'restock', 'setup', 'set up'], tone: 'slate', icon: PackageCheck, label: 'Set' },
  { match: ['label', 'date', 'store', 'shelf'], tone: 'amber', icon: Tags, label: 'Store' },
  { match: ['repair', 'maintenance', 'fix', 'issue'], tone: 'red', icon: Wrench, label: 'Fix' },
  { match: ['check', 'quality', 'complete', 'approve'], tone: 'green', icon: CheckCircle2, label: 'Check' },
];

const TONES = {
  amber: {
    bg: 'from-[#3a2611] via-[#17110b] to-[#050505]',
    glow: 'bg-amber-500/15',
    icon: 'text-amber-300',
  },
  orange: {
    bg: 'from-[#3a1e12] via-[#160d09] to-[#050505]',
    glow: 'bg-primary/15',
    icon: 'text-primary',
  },
  green: {
    bg: 'from-[#17311f] via-[#0c1610] to-[#050505]',
    glow: 'bg-green-500/15',
    icon: 'text-green-300',
  },
  blue: {
    bg: 'from-[#11283a] via-[#08131c] to-[#050505]',
    glow: 'bg-sky-500/15',
    icon: 'text-sky-300',
  },
  red: {
    bg: 'from-[#3a1515] via-[#170908] to-[#050505]',
    glow: 'bg-red-500/15',
    icon: 'text-red-300',
  },
  slate: {
    bg: 'from-[#252b30] via-[#101315] to-[#050505]',
    glow: 'bg-white/10',
    icon: 'text-slate-200',
  },
};

function matchVisual(text, library) {
  return library.find((entry) => entry.match.some((keyword) => text.includes(keyword)));
}

function resolveVisual({ type = 'task', name = '', category = '', step = '', imageUrl = '' }) {
  const text = `${name} ${category} ${step}`.toLowerCase();
  if (imageUrl) return { src: imageUrl, tone: 'slate', icon: ClipboardCheck, label: name || category || type };

  if (type === 'prep' || type === 'prep-step') {
    const prepVisual = matchVisual(text, PREP_VISUALS);
    if (prepVisual) return { ...prepVisual, label: name || prepVisual.label || 'Prep' };
  }

  const fallback = matchVisual(text, FALLBACK_VISUALS);
  if (fallback) return { ...fallback, label: fallback.label };

  if (type === 'sidework') return { tone: 'blue', icon: Sparkles, label: 'Side' };
  if (type === 'prep-step') return { tone: 'orange', icon: ClipboardCheck, label: 'Step' };
  if (type === 'prep') return { tone: 'green', icon: Utensils, label: 'Prep' };
  return { tone: 'slate', icon: ClipboardCheck, label: 'Task' };
}

export function getTaskVisual({ type, name, category, step, imageUrl }) {
  return resolveVisual({ type, name, category, step, imageUrl });
}

export default function TaskVisual({
  type = 'task',
  name = '',
  category = '',
  step = '',
  imageUrl = '',
  className,
  compact = false,
  label,
}) {
  const [failed, setFailed] = useState(false);
  const visual = resolveVisual({ type, name, category, step, imageUrl });
  const tone = TONES[visual.tone] || TONES.slate;
  const Icon = visual.icon || ClipboardCheck;
  const resolvedLabel = label || visual.label || type;

  if (visual.src && !failed) {
    return (
      <div className={cn('relative overflow-hidden bg-card', className)}>
        <img
          src={visual.src}
          alt={name || resolvedLabel}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', tone.bg, className)}>
      <div className={cn('absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl', tone.glow)} />
      <div className={cn('absolute -bottom-10 left-6 h-24 w-24 rounded-full blur-2xl', tone.glow)} />
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
        <div className={cn(compact ? 'h-9 w-9' : 'h-14 w-14', 'flex items-center justify-center rounded-full border border-white/10 bg-black/25 shadow-[0_14px_40px_rgba(0,0,0,0.35)]')}>
          <Icon className={cn(compact ? 'h-4 w-4' : 'h-7 w-7', tone.icon)} />
        </div>
        {!compact && (
          <p className="max-w-[120px] truncate text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
            {resolvedLabel}
          </p>
        )}
      </div>
    </div>
  );
}
