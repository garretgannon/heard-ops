import { useEffect, useRef } from 'react';

export default function XPBar({ percent = 0, label = '', color = '#FF6B00', height = 8 }) {
  const barRef = useRef(null);

  useEffect(() => {
    if (!barRef.current) return;
    barRef.current.style.width = `${Math.min(percent, 100)}%`;
  }, [percent]);

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{label}</span>
          <span className="text-xs font-bold text-foreground">{Math.round(percent)}%</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{
            width: '0%',
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: `0 0 8px ${color}44`,
          }}
        />
      </div>
    </div>
  );
}