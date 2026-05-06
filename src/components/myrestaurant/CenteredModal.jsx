export default function CenteredModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl overflow-hidden max-h-[88vh] flex flex-col">
        <div className="bg-card border-b border-border p-4 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-secondary-text hover:text-foreground text-lg leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {children}
        </div>
      </div>
    </div>
  );
}