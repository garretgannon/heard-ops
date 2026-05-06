import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

export default function MobileSelect({ label, value, options, onChange, placeholder = 'Select...', disabled = false }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (option) => {
    haptics.light();
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-bold text-foreground block">{label}</label>}
      
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-left font-medium flex items-center justify-between',
          'active:scale-95 transition-all',
          disabled && 'opacity-50 cursor-not-allowed',
          open && 'border-primary/50 bg-card'
        )}
      >
        <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-secondary-text transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* BottomSheet for mobile, modal for desktop */}
          <div className="relative z-50 w-full lg:w-96 bg-card border border-border rounded-t-2xl lg:rounded-2xl shadow-2xl lg:shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 sticky top-0">
              <h3 className="font-bold text-foreground">{label || 'Select option'}</h3>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center active:scale-90"
              >
                <X className="h-4 w-4 text-secondary-text" />
              </button>
            </div>

            {/* Options */}
            <div className="max-h-[60vh] lg:max-h-96 overflow-y-auto divide-y divide-border/30">
              {options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full text-left px-4 py-3 font-medium text-sm active:scale-95 transition-all',
                    value === option.value
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-muted/30 text-foreground'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {value === option.value && (
                      <span className="text-primary font-bold">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}