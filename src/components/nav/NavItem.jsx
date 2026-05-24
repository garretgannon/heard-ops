import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NavItem({ icon: Icon = Home, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 h-[52px] flex flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-95 border rounded-2xl",
        isActive
          ? "bg-white/[0.08] border-white/[0.04] text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground/70"
      )}
    >
      <Icon className={cn("h-5 w-5 stroke-[1.75]", isActive ? "text-primary stroke-[2.2]" : "text-muted-foreground/65")} />
      <span className={cn(
        "text-[9px] font-bold uppercase tracking-wider leading-none",
        isActive ? "text-primary" : "text-muted-foreground/50"
      )}>
        {label}
      </span>
    </button>
  );
}
