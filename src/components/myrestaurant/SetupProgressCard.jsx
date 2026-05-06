export default function SetupProgressCard({ sections, onContinue }) {
  const completed = sections.filter(s => s.complete);
  const incomplete = sections.filter(s => !s.complete);
  const pct = Math.round((completed.length / sections.length) * 100);
  const next = incomplete[0];

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Restaurant Setup</p>
          <p className="text-2xl font-extrabold text-foreground mt-0.5">{pct}% Complete</p>
        </div>
        <div className="h-14 w-14 rounded-full border-4 border-primary/30 flex items-center justify-center relative">
          <svg className="absolute inset-0" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
            <circle
              cx="28" cy="28" r="24" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
            />
          </svg>
          <span className="text-xs font-extrabold text-primary">{pct}%</span>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-3">
        {completed.map(s => (
          <span key={s.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            ✓ {s.label}
          </span>
        ))}
        {incomplete.map(s => (
          <span key={s.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {s.label}
          </span>
        ))}
      </div>

      {next && (
        <div className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-2">
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold">Next Step</p>
            <p className="text-xs font-bold text-foreground">{next.label}</p>
          </div>
          <button
            onClick={() => onContinue(next)}
            className="btn-primary text-xs px-3 py-1.5 rounded-lg"
          >
            Continue
          </button>
        </div>
      )}

      {!next && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
          <span className="text-green-400 text-lg">🎉</span>
          <p className="text-xs font-bold text-green-400">Setup complete! Your restaurant is fully configured.</p>
        </div>
      )}
    </div>
  );
}