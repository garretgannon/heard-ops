export default function SkeletonCard({ lines = 2, className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
      <div className="skeleton h-3 w-1/3 rounded mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-2.5 rounded mb-2"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}