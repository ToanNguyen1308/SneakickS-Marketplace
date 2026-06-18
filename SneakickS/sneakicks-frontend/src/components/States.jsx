/**
 * Shared UI states: loading skeletons, empty state, error state.
 * Keeps list pages consistent (StockX-like clean look).
 */

export const ProductCardSkeleton = () => (
  <div className="card">
    <div className="skeleton aspect-[4/3] w-full mb-3" />
    <div className="skeleton h-3 w-16 mb-2" />
    <div className="skeleton h-4 w-3/4 mb-3" />
    <div className="grid grid-cols-2 gap-2">
      <div className="skeleton h-8" />
      <div className="skeleton h-8" />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 6, cols = 6 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-3">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="skeleton h-6 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const EmptyState = ({ title = "Nothing here yet", hint, icon = "📦", action }) => (
  <div className="text-center py-14">
    <div className="text-4xl mb-3">{icon}</div>
    <div className="font-semibold text-ink">{title}</div>
    {hint && <div className="text-sm text-slate-500 mt-1">{hint}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ message = "Something went wrong", onRetry }) => (
  <div className="text-center py-14">
    <div className="text-4xl mb-3">⚠️</div>
    <div className="font-semibold text-ink">Failed to load</div>
    <div className="text-sm text-slate-500 mt-1">{message}</div>
    {onRetry && (
      <button className="btn-secondary mt-4" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);
