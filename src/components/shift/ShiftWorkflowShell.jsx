import { ArrowRight, Check, RefreshCw } from 'lucide-react';
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
                  ? 'border-primary/45 bg-primary/12 text-primary'
                  : isDone
                    ? 'border-border/50 bg-white/[0.04] text-foreground'
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
        <span className="text-foreground">{value}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${value}%`,
            background: complete
              ? 'linear-gradient(90deg, hsl(22,76%,32%), hsl(22,76%,48%))'
              : 'linear-gradient(90deg, hsl(22,76%,32%), hsl(22,76%,48%))',
            boxShadow: '0 0 6px rgba(230,106,31,0.28)',
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

export function ShiftMobileGuide({
  eyebrow,
  title,
  stages,
  activeStage,
  onStageChange,
  stats,
  progress,
  nextAction,
  onRefresh,
  refreshing = false,
}) {
  const activeIdx = Math.max(0, stages.findIndex(stage => stage.id === activeStage));
  const active = stages[activeIdx] || stages[0];

  return (
    <div
      className="lg:hidden sticky top-0 z-30 px-4 pt-3 pb-2.5"
      style={{
        background: 'linear-gradient(180deg, rgba(6,10,16,0.98) 0%, rgba(8,13,20,0.96) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 16px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
          <h1 className="mt-0.5 truncate text-lg font-black tracking-tight text-foreground">{title}</h1>
          <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">
            Step {activeIdx + 1} of {stages.length}: <span className="text-foreground">{active.label}</span>
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-white/[0.04] transition-all"
            aria-label="Refresh"
          >
            <RefreshCw className={cn('h-4 w-4 text-muted-foreground', refreshing && 'animate-spin')} />
          </button>
        )}
      </div>

      <div className="mt-2">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
          {stages.map((stage, index) => {
            const isActive = stage.id === activeStage;
            const isDone = index < activeIdx;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onStageChange(stage.id)}
                className={cn(
                  'min-w-0 rounded-lg border px-2 py-1.5 text-center transition-all active:scale-[0.98]',
                  isActive
                    ? 'border-primary/45 bg-primary/12 text-primary'
                    : isDone
                      ? 'border-border/50 bg-white/[0.04] text-foreground'
                      : 'border-border/35 bg-transparent text-muted-foreground'
                )}
              >
                <span className="block text-[10px] font-black">{stage.num || index + 1}</span>
                <span className="mt-0.5 block truncate text-[10px] font-bold">{stage.label}</span>
              </button>
            );
          })}
        </div>

        {progress && (
          <ShiftProgressStrip
            className="mt-2"
            label={progress.label}
            value={progress.value}
            complete={progress.complete}
          />
        )}
      </div>

      {stats?.length > 0 && (
        <div className="mt-2 flex min-w-0 gap-2 overflow-x-auto pb-0.5">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black',
                  stat.className || 'border-border/30 bg-white/[0.025] text-muted-foreground'
                )}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {stat.value} {stat.label}
              </div>
            );
          })}
        </div>
      )}

      {nextAction && (
        <div className="mt-2">
          <ShiftNextActionCard action={nextAction} />
        </div>
      )}
    </div>
  );
}
