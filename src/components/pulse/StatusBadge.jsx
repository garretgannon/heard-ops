export default function StatusBadge({ status, label, children }) {
  const config = {
    attention: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-600',
      icon: 'text-amber-500',
    },
    behind: {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      text: 'text-orange-600',
      icon: 'text-orange-500',
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-600',
      icon: 'text-red-500',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-600',
      icon: 'text-blue-500',
    },
    on_track: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-600',
      icon: 'text-green-500',
    },
  };

  const c = config[status] || config.info;

  return (
    <div className={`${c.bg} border ${c.border} rounded-full px-5 py-3 flex items-center gap-3`}>
      <svg className={`h-5 w-5 ${c.icon}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      <span className={`font-bold text-sm ${c.text}`}>{label}</span>
      {children && <div className={`ml-auto text-xs ${c.text}`}>{children}</div>}
    </div>
  );
}