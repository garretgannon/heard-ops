import { cn } from '@/lib/utils';

export default function StandardPageShell({ title, children, className, actions }) {
  return (
    <div className="w-full pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
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