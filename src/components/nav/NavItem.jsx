import { haptics } from '@/utils/haptics';

export default function NavItem({ icon: Icon, label, isActive, onClick }) {
  return (
    <button
      onClick={() => {
        haptics.medium?.();
        onClick?.();
      }}
      className="relative flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-xl transition-all duration-300 active:scale-90 group"
      style={{
        background: isActive ? 'rgba(230, 106, 31, 0.15)' : 'transparent',
      }}
    >
      {/* Active glow backdrop */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl opacity-20 blur-lg bg-primary animate-pulse" />
      )}

      {/* Icon */}
      <Icon
        className={`h-6 w-6 transition-all duration-300 ${
          isActive ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-foreground'
        }`}
        strokeWidth={1.5}
      />

      {/* Label */}
      <span
        className={`text-[11px] font-bold tracking-tight leading-none transition-all duration-300 ${
          isActive ? 'text-primary scale-105' : 'text-muted-foreground group-hover:text-foreground'
        }`}
      >
        {label}
      </span>

      {/* Active indicator dot (subtle) */}
      {isActive && (
        <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary animate-pulse" />
      )}
    </button>
  );
}