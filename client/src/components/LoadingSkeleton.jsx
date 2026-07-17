// Simple skeleton building blocks used across pages while data loads.

export const SkeletonLine = ({ width = 'w-full' }) => (
  <div className={`h-4 animate-pulse rounded bg-slate-200 ${width}`} />
);

export const SkeletonCard = () => (
  <div className="card space-y-3">
    <SkeletonLine width="w-1/3" />
    <SkeletonLine />
    <SkeletonLine width="w-2/3" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="card space-y-3" aria-busy="true" aria-label="Loading content">
    <SkeletonLine width="w-1/4" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <SkeletonLine width="w-1/3" />
        <SkeletonLine width="w-1/4" />
        <SkeletonLine width="w-1/6" />
        <SkeletonLine width="w-1/6" />
      </div>
    ))}
  </div>
);

export const SkeletonStats = ({ count = 4 }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading statistics">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
