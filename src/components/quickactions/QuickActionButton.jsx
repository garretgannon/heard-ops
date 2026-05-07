import { haptics } from '@/utils/haptics';

/**
 * Reusable quick action button that triggers modal with correct action type
 */
export default function QuickActionButton({ 
  icon: Icon, 
  label, 
  actionType, 
  onClick,
  disabled = false,
  variant = 'primary'
}) {
  const baseStyles = 'h-10 px-4 rounded-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50';
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:brightness-110',
    secondary: 'border border-border text-foreground bg-card hover:bg-secondary',
    muted: 'bg-muted text-muted-foreground hover:bg-muted/80',
  };

  return (
    <button
      onClick={() => {
        haptics.light();
        onClick?.(actionType);
      }}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}