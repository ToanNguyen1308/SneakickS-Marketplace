/**
 * Pagination — Week 5 (numbered)
 *
 * Hien thi cac nut tron danh so + dau ... + mui ten ›.
 * Logic chon page: luon hien thi 1, totalPages va vung quanh page hien tai.
 *
 *  - totalPages <= 7   -> liet ke tat ca
 *  - totalPages >  7   -> luon co [1] ... [p-1] [p] [p+1] ... [last]
 */
const buildPageList = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items = new Set([1, totalPages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => items.add(n));
  if (page >= totalPages - 2)
    [totalPages - 3, totalPages - 2, totalPages - 1].forEach((n) => items.add(n));
  const sorted = [...items].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
    result.push(sorted[i]);
  }
  return result;
};

const PageButton = ({ active, onClick, disabled, children, ariaLabel }) => {
  const base =
    "inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-colors select-none";
  if (active) {
    return (
      <button
        type="button"
        aria-current="page"
        aria-label={ariaLabel}
        className={`${base} bg-brand-900 text-white shadow`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${base} bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
};

const Pagination = ({ meta, onChange }) => {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, hasPrev, hasNext } = meta;
  const items = buildPageList(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-2 mt-6" aria-label="Pagination">
      <PageButton
        onClick={() => onChange(page - 1)}
        disabled={!hasPrev}
        ariaLabel="Previous page"
      >
        ‹
      </PageButton>

      {items.map((item, idx) =>
        item === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex items-center justify-center w-10 h-10 text-slate-400 select-none"
          >
            …
          </span>
        ) : (
          <PageButton
            key={item}
            active={item === page}
            onClick={() => onChange(item)}
            ariaLabel={`Page ${item}`}
          >
            {item}
          </PageButton>
        )
      )}

      <PageButton
        onClick={() => onChange(page + 1)}
        disabled={!hasNext}
        ariaLabel="Next page"
      >
        ›
      </PageButton>
    </nav>
  );
};

export default Pagination;
