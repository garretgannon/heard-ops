import { useEffect, useRef } from 'react';

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ShiftScoreRing({ percent = 0, score = null, label = 'Complete', size = 120, strokeWidth = 8, color = '#FF6B00' }) {
  const circleRef = useRef(null);
  const prevPercent = useRef(0);

  useEffect(() => {
    if (!circleRef.current) return;
    const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
    circleRef.current.style.setProperty('--ring-from', `${CIRCUMFERENCE - (prevPercent.current / 100) * CIRCUMFERENCE}`);
    circleRef.current.style.setProperty('--ring-to', `${offset}`);
    circleRef.current.classList.remove('animate-ring-fill');
    void circleRef.current.offsetWidth; // reflow
    circleRef.current.classList.add('animate-ring-fill');
    circleRef.current.style.strokeDashoffset = offset;
    prevPercent.current = percent;
  }, [percent]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        {/* Track */}
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          ref={circleRef}
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-foreground">{score !== null ? score : `${percent}%`}</span>
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}