import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function TaskCompletionBurst({ trigger = false, onDone }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setShow(true);
    const t = setTimeout(() => {
      setShow(false);
      onDone?.();
    }, 600);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
      {/* Outer ring burst */}
      <div
        className="absolute rounded-full border-2 border-green-400"
        style={{
          width: 60, height: 60,
          animation: 'burst 500ms cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      />
      {/* Icon */}
      <div style={{ animation: 'snap-in 250ms cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
        <CheckCircle2 className="h-7 w-7 text-green-400" />
      </div>
    </div>
  );
}