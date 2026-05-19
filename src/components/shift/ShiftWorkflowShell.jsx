import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ShiftStageNav({ stages, activeStage, onStageChange, trailing, className, compact = false }) {
  const activeIdx = stages.findIndex(stage => stage.id === activeStage);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex items-center', compact ? 'gap-1' : 'gap-1.5')}>
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.id === activeStage;
          const isDone = index < activeIdx;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onStageChange(stage.id)}
              className={cn(
                'inline-flex items-center gap-1.5 border font-black transition-all active:scale-[0.98]',
                compact ? 'rounded-full px-3 py-1.5 text-[11px]' : 'rounded-lg px-3 py-1.5 text-xs',
                isActive
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : isDone
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-border/40 bg-transparent text-muted-foreground hover:border-border/70 hover:text-foreground'
              )}
              style={isActive ? { boxShadow: '0 0 12px rgba(230,106,31,0.18)' } : undefined}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className={compact ? 'hidden min-[380px]:inline' : ''}>{stage.label}</span>
              {compact && <span className="min-[380px]:hidden">{stage.num || index + 1}</span>}
            </button>
          );
        })}
      </div>
      {trailing && <div className="ml-auto flex items-center gap-3">{trailing}</div>}
    </div>
  );
}

export function ShiftProgressStrip({ label, value, complete = false, className }) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-muted-foreground">{label}</span>
        <span className={complete ? 'text-green-400' : 'text-foreground'}>{value}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${value}%`,
            background: complete
              ? 'linear-gradient(90deg, #22c55e, #4ade80)'
              : 'linear-gradient(90deg, hsl(22,76%,38%), hsl(22,76%,55%))',
            boxShadow: complete ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 6px rgba(230,106,31,0.35)',
          }}
        />
      </div>
    </div>
  );
}

export function ShiftNextActionCard({ action }) {
  const Icon = action.icon;

  return (
    <button
      type="button"
      disabled={!action.onClick}
      onClick={action.onClick}
      className="ops-panel flex w-full items-center gap-3 px-4 py-3 text-left transition-all active:scale-[0.99] disabled:cursor-default"
    >
      <div className={cn('ops-icon-box shrink-0', action.tone === 'text-primary' && 'ops-icon-box-accent')}>
        <Icon className={cn('h-4 w-4', action.tone)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Next Action</p>
        <p className="mt-0.5 text-sm font-black text-foreground">{action.label}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{action.detail}</p>
      </div>
      {action.onClick && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </button>
  );
}
