import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

export default function MoreRow({ icon: Icon, label, description, badge, onClick, badgeColor = 'bg-amber-500/15 text-amber-400' }) {
  return (
    <button
      onClick={() => {
        haptics.light();
        onClick?.();
      }}
      className="w-full text-left p-4 rounded-lg border border-border/40 card-glass hover:bg-secondary/30 transition-all active:scale-[0.98] group flex items-center gap-3"
    >
      {/* Icon */}
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-colors">
        {Icon ? <Icon className="h-5 w-5 text-muted-foreground" /> : <span className="text-lg">⚙️</span>}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-bold text-foreground">{label}</h3>
          {badge && <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap', badgeColor)}>{badge}</span>}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      {/* Chevron */}
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
    </button>
  );
}