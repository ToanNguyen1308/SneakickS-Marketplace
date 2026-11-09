import { useEffect, useState } from "react";
import ProductCard from "./ProductCard.jsx";

/**
 * Mot khoi goi y cuon ngang (Trending / Similar / Recently Viewed).
 *  - `load`: ham tra ve promise axios cua API /api/recommendations/*
 *  - `deps`: tai lai khi cac gia tri nay doi (vd. id san pham)
 *  - `source`: ghi vao su kien view/rec_click de biet click den tu khoi nao
 */
const RecRow = ({ title, subtitle, load, deps = [], source, showReason = false, hideWhenEmpty = false }) => {
  const [state, setState] = useState({ loading: true, items: [], recRequestId: null });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    load()
      .then(({ data }) => {
        if (alive) setState({ loading: false, items: data.data || [], recRequestId: data.rec_request_id });
      })
      .catch(() => {
        if (alive) setState({ loading: false, items: [], recRequestId: null });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  if (!state.loading && state.items.length === 0 && hideWhenEmpty) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-extrabold text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex gap-4 overflow-x-auto overflow-y-hidden py-1 pb-3 snap-x">
        {state.loading
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton h-72 w-52 shrink-0 rounded-xl" />
            ))
          : state.items.length === 0
            ? <p className="text-sm text-slate-400">Nothing to show yet.</p>
            : state.items.map((p) => (
                <div key={p.id} className="w-52 shrink-0 snap-start">
                  <ProductCard
                    product={p}
                    source={source}
                    recRequestId={state.recRequestId}
                    reason={showReason ? p.reason : undefined}
                  />
                </div>
              ))}
      </div>
    </section>
  );
};

export default RecRow;
