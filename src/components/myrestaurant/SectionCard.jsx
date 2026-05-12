export default function SectionCard({ icon: Icon, title, description, count, complete, needsSetup, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full card-glass border border-border rounded-xl p-3.5 flex items-center gap-3 text-left active:scale-[0.98] transition-all"
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${complete ? 'bg-green-500/15' : 'bg-muted'}`}>
        <Icon className={`h-5 w-5 ${complete ? 'text-green-400' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {complete ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">✓ Done</span>
        ) : needsSetup ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Needs Setup</span>
        ) : null}
        {count !== undefined && (
          <span className="text-[11px] font-bold text-muted-foreground">{count} {count === 1 ? 'item' : 'items'}</span>
        )}
      </div>
    </button>
  );
}