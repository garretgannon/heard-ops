import { cn } from '@/lib/utils';
import { BRAND_ASSETS } from '@/lib/brandAssets';

export default function StandardPageShell({ title, children, className, actions }) {
  return (
    <div className="w-full pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={BRAND_ASSETS.logoMark}
            alt=""
            className="h-10 w-auto max-w-[168px] shrink-0 object-contain select-none"
            aria-hidden="true"
          />
          <h1 className="truncate text-lg font-bold text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>

      {/* Content */}
      <div className={cn("px-4 pt-4 space-y-3", className)}>
        {children}
      </div>
    </div>
  );
}
