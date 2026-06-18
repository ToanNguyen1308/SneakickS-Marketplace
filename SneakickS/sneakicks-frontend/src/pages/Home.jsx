import { useEffect, useState, useCallback } from "react";
import * as productsApi from "../api/products";
import * as categoriesApi from "../api/categories";
import * as followsApi from "../api/follows";
import ProductCard from "../components/ProductCard.jsx";
import { ProductGridSkeleton, EmptyState, ErrorState } from "../components/States.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const LIMIT = 12;

const Home = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const canFollow = isAuthenticated && !isAdmin;

  const [products, setProducts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [categories, setCategories] = useState([]);
  const [followedIds, setFollowedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({ brand: "", category: "", search: "" });

  const cleanFilters = useCallback(() => {
    const params = {};
    if (filters.brand) params.brand = filters.brand;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
    return params;
  }, [filters]);

  useEffect(() => {
    categoriesApi
      .listCategories()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => setCategories([]));
  }, []);

  // Tai trang dau (keyset, cursor=0) moi khi doi filter.
  const loadInitial = useCallback(() => {
    setLoading(true);
    setError(false);
    productsApi
      .listProducts({ ...cleanFilters(), cursor: 0, limit: LIMIT })
      .then(({ data }) => {
        setProducts(data.data || []);
        setHasNext(Boolean(data.pagination?.hasNext));
        setCursor(data.pagination?.nextCursor ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [cleanFilters]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = () => {
    if (!hasNext || !cursor || loadingMore) return;
    setLoadingMore(true);
    productsApi
      .listProducts({ ...cleanFilters(), cursor, limit: LIMIT })
      .then(({ data }) => {
        setProducts((prev) => [...prev, ...(data.data || [])]);
        setHasNext(Boolean(data.pagination?.hasNext));
        setCursor(data.pagination?.nextCursor ?? null);
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

  const update = (patch) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Buy &amp; sell the latest sneakers
        </h1>
        <p className="text-slate-500 mt-1">
          Authenticated marketplace with live bids and asks.
        </p>
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">Search</label>
          <input
            className="input"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Jordan, Yeezy, Dunk..."
          />
        </div>
        <div>
          <label className="label">Brand</label>
          <input
            className="input"
            value={filters.brand}
            onChange={(e) => update({ brand: e.target.value })}
            placeholder="Nike / Adidas..."
          />
        </div>
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={filters.category}
            onChange={(e) => update({ category: e.target.value })}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : error ? (
        <ErrorState message="Could not load products." onRetry={loadInitial} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          hint="Try adjusting your search or filters."
          icon="🔍"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                followed={followedIds.has(p.id)}
                onToggleFollow={canFollow ? toggleFollow : undefined}
              />
            ))}
          </div>

          {hasNext && (
            <div className="flex justify-center pt-2">
              <button
                className="btn-secondary px-8"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
