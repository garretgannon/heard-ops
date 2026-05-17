import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Welcome' },
  { label: 'Departments' },
  { label: 'Job Codes' },
  { label: 'Roles' },
  { label: 'Station Links' },
  { label: 'Responsibilities' },
  { label: 'Access' },
  { label: 'Preview' },
  { label: 'Review' },
];

export default function WizardProgress({ step }) {
  return (
    <>
      {/* Desktop progress rail */}
      <aside className="flex flex-col pt-2 w-[200px] shrink-0">
        <div className="sticky top-[88px] flex flex-col gap-0">
          {STEPS.map((s, i) => {
            const isDone = i < step;
            const isActive = i === step;
            const isFuture = i > step;

            return (
              <div key={i} className="flex items-start gap-3">
                {/* Connector + circle column */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-200"
                    style={
                      isDone
                        ? { background: '#16a34a', color: 'white' }
                        : isActive
                        ? { background: 'linear-gradient(135deg, #E66A1F 0%, #d45a14 100%)', color: 'white' }
                        : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }
                    }
                  >
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className="w-px flex-1 my-1 transition-all duration-200"
                      style={{
                        minHeight: 20,
                        background: isDone ? 'rgba(22,163,74,0.4)' : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  )}
                </div>
                {/* Label */}
                <p
                  className={cn(
                    'text-[13px] font-medium mt-1 pb-5 transition-colors duration-200',
                    isActive
                      ? 'text-white'
                      : isDone
                      ? 'text-green-400/80'
                      : 'text-white/30'
                  )}
                >
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>
      </aside>

    </>
  );
}
