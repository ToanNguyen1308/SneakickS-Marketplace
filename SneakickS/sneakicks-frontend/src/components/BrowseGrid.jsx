import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import * as productsApi from "../api/products";
import * as categoriesApi from "../api/categories";
import * as followsApi from "../api/follows";
import ProductCard from "./ProductCard.jsx";
import { ProductGridSkeleton, EmptyState, ErrorState } from "./States.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { trackSearch } from "../lib/tracking";

const LIMIT = 12;

const SORT_OPTIONS = [
  ["featured", "Featured"],
  ["most_active", "Most popular"],
  ["newest", "Release date"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
];

const GENDERS = [
  ["", "All"],
  ["men", "Men"],
  ["women", "Women"],
  ["unisex", "Unisex"],
];

/**
 * Luoi san pham co bo loc, dong bo voi URL (?brand=&silhouette=&category=&gender=&sort=&q=).
 * Sort mac dinh dung keyset "Load more"; cac sort khac dung OFFSET (page).
 */
const BrowseGrid = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const canFollow = isAuthenticated && !isAdmin;
  const [params, setParams] = useSearchParams();

  const brand = params.get("brand") || "";
  const silhouette = params.get("silhouette") || "";
  const category = params.get("category") || "";
  const gender = params.get("gender") || "";
  const sort = params.get("sort") || "featured";
  const keyset = sort === "featured";

  const [searchInput, setSearchInput] = useState(params.get("q") || "");
  const search = useDebouncedValue(searchInput, 350);

  const [products, setProducts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [facets, setFacets] = useState({ brands: [], silhouettes: [] });
  const [followedIds, setFollowedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    categoriesApi.listCategories().then(({ data }) => setCategories(data.data || [])).catch(() => {});
    productsApi.getFacets().then(({ data }) => setFacets(data.data)).catch(() => {});
  }, []);

  const silhouetteOptions = useMemo(
    () => facets.silhouettes.filter((s) => !brand || s.brand.toLowerCase() === brand.toLowerCase()),
    [facets.silhouettes, brand]
  );

  const setFilter = useCallback(
    (patch) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
          return next;
        },
        { replace: true }
      ),
    [setParams]
  );

  useEffect(() => {
    setFilter({ q: search });
    if (search) trackSearch(search);
  }, [search, setFilter]);

  const query = useCallback(
    (extra) => {
      const q = { limit: LIMIT, ...extra };
      if (brand) q.brand = brand;
      if (silhouette) q.silhouette = silhouette;
      if (category) q.category = category;
      if (gender) q.gender = gender;
      if (search) q.search = search;
      if (!keyset) q.sort = sort;
      return productsApi.listProducts(q);
    },
    [brand, silhouette, category, gender, search, sort, keyset]
  );

  const loadInitial = useCallback(() => {
    setLoading(true);
    setError(false);
    setPage(1);
    query(keyset ? { cursor: 0 } : { page: 1 })
      .then(({ data }) => {
        setProducts(data.data || []);
        setHasNext(Boolean(data.pagination?.hasNext));
        setCursor(keyset ? data.pagination?.nextCursor ?? null : null);
        setTotal(keyset ? null : data.pagination?.total ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [query, keyset]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = () => {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    query(keyset ? { cursor } : { page: nextPage })
      .then(({ data }) => {
        setProducts((prev) => [...prev, ...(data.data || [])]);
        setHasNext(Boolean(data.pagination?.hasNext));
        if (keyset) setCursor(data.pagination?.nextCursor ?? null);
        setPage(nextPage);
      })
      .finally(() => setLoadingMore(false));
  };

  const loadFollows = useCallback(() => {
    if (!canFollow) {
      setFollowedIds(new Set());
      return;
    }
    followsApi
      .myFollows({ limit: 100 })
      .then(({ data }) => setFollowedIds(new Set((data.data || []).map((p) => p.id))))
      .catch(() => setFollowedIds(new Set()));
  }, [canFollow]);

  useEffect(() => {
    loadFollows();
  }, [loadFollows]);

  const toggleFollow = async (product, next) => {
    setFollowedIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(product.id);
      else s.delete(product.id);
      return s;
    });
    try {
      if (next) await followsApi.follow(product.id);
      else await followsApi.unfollow(product.id);
    } catch {
      loadFollows();
    }
  };

  const activeChips = [
    brand && ["brand", brand],
    silhouette && ["silhouette", silhouette],
    category && ["category", category],
    gender && ["gender", gender],
  ].filter(Boolean);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-ink">Browse</h2>
          {total !== null && <p className="text-sm text-slate-500">{total} results</p>}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Sort by</label>
          <select
            className="input py-2 w-auto"
            value={sort}
            onChange={(e) => setFilter({ sort: e.target.value === "featured" ? "" : e.target.value })}
          >
            {SORT_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="label">Search</label>
          <input
            className="input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Jordan 4, Dunk Panda..."
          />
        </div>
        <div>
          <label className="label">Brand</label>
          <select
            className="input"
            value={brand}
            onChange={(e) => setFilter({ brand: e.target.value, silhouette: "" })}
          >
            <option value="">All brands</option>
            {facets.brands.map((b) => (
              <option key={b.brand} value={b.brand}>
                {b.brand} ({b.count})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Silhouette</label>
          <select className="input" value={silhouette} onChange={(e) => setFilter({ silhouette: e.target.value })}>
            <option value="">All silhouettes</option>
            {silhouetteOptions.map((s) => (
              <option key={`${s.brand}-${s.silhouette}`} value={s.silhouette}>
                {s.silhouette} ({s.count})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setFilter({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Gender</label>
          <div className="flex gap-1 flex-wrap">
            {GENDERS.map(([v, l]) => (
              <button
                key={v || "all"}
                type="button"
                onClick={() => setFilter({ gender: v })}
                className={`px-2.5 py-2 rounded-lg text-sm border transition ${
                  gender === v ? "border-ink bg-ink text-white" : "border-slate-200 hover:border-slate-400"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {activeChips.map(([k, v]) => (
            <button key={k} className="badge bg-slate-100 text-slate-700 py-1" onClick={() => setFilter({ [k]: "" })}>
              {v} ✕
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : error ? (
        <ErrorState message="Could not load products." onRetry={loadInitial} />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" hint="Try adjusting your search or filters." icon="🔍" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                followed={followedIds.has(p.id)}
                onToggleFollow={canFollow ? toggleFollow : undefined}
                source={search ? "search" : "browse"}
              />
            ))}
          </div>
          {hasNext && (
            <div className="flex justify-center pt-2">
              <button className="btn-secondary px-8" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default BrowseGrid;
