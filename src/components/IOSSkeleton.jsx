/**
 * Skeleton loading components for iOS-style loading states.
 * Usage: <SkeletonCard />, <SkeletonRow />, <SkeletonMetrics />
 */

export function SkeletonRow({ lines = 2 }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 border-b border-[#1A2235] last:border-0">
      <div className="skeleton h-8 w-8 rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="skeleton h-3 rounded w-3/4" />
        {lines > 1 && <div className="skeleton h-2.5 rounded w-1/2" />}
      </div>
      <div className="skeleton h-6 w-12 rounded-lg shrink-0" />
    </div>
  );
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonMetrics({ count = 3 }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 bg-[#111827] border border-[#1F2937] rounded-2xl p-3">
          <div className="skeleton h-6 w-6 rounded-xl mb-2" />
          <div className="skeleton h-5 w-10 rounded mb-1.5" />
          <div className="skeleton h-2.5 w-14 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="flex flex-col gap-3 pb-8">
      <div className="flex flex-col gap-1 pt-1">
        <div className="skeleton h-5 w-32 rounded" />
        <div className="skeleton h-3 w-48 rounded" />
      </div>
      <SkeletonMetrics count={3} />
      <SkeletonCard rows={4} />
      <SkeletonCard rows={3} />
    </div>
  );
}

export default SkeletonPage;