export default function EmptyState({ icon: Icon, title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="animate-empty-float mb-5">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(230,106,31,0.12)', boxShadow: '0 0 0 1px rgba(230,106,31,0.2)' }}>
            <Icon className="h-8 w-8 text-primary" />
          </div>
        </div>
      )}
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>}
      {action && (
        <button
          onClick={action}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm btn-spring"
        >
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  );
}