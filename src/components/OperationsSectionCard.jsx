import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

export default function OperationsSectionCard({ 
  route, 
  onClick, 
  isFavorite, 
  onToggleFavorite,
  variant = 'default' 
}) {
  if (!route) return null;

  const Icon = route.icon;

  const handleFavorite = (e) => {
    e.stopPropagation();
    haptics.light();
    onToggleFavorite?.(route.path);
  };

  return (
    <button
      onClick={() => {
        haptics.light();
        onClick?.(route.path);
      }}
      className={cn(
        'relative w-full text-left rounded-xl border transition-all active:scale-95 duration-100',
        variant === 'compact'
          ? 'bg-card border-border/50 p-2.5 flex items-center gap-2.5 hover:bg-muted'
          : 'bg-card border-border p-4 flex flex-col gap-3 hover:border-border/80 hover:bg-muted/40'
      )}
    >
      <div className={cn(
        'rounded-lg flex items-center justify-center shrink-0',
        variant === 'compact' ? 'h-8 w-8 bg-muted' : 'h-10 w-10 bg-muted'
      )}>
        <Icon className={cn(
          'stroke-[1.5] text-secondary-text',
          variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-bold text-foreground',
          variant === 'compact' ? 'text-xs' : 'text-sm'
        )}>
          {route.label}
        </p>
        {variant !== 'compact' && route.description && (
          <p className="text-xs text-secondary-text mt-1">{route.description}</p>
        )}
      </div>

      {variant !== 'compact' && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className={cn(
              'px-2 py-1.5 rounded-lg text-xs font-bold transition-all',
              isFavorite
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-muted text-secondary-text border border-border/50 hover:bg-muted/80'
            )}
          >
            {isFavorite ? '★ Pinned' : '☆ Pin'}
          </button>
          <ChevronRight className="h-4 w-4 text-secondary-text shrink-0" />
        </div>
      )}

      {variant === 'compact' && (
        <ChevronRight className="h-3.5 w-3.5 text-secondary-text shrink-0" />
      )}
    </button>
  );
}