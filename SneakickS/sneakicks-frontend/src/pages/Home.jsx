import { useEffect, useState, useCallback } from "react";
import * as productsApi from "../api/products";
import * as categoriesApi from "../api/categories";
import * as followsApi from "../api/follows";
import ProductCard from "../components/ProductCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const Home = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const canFollow = isAuthenticated && !isAdmin;

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [followedIds, setFollowedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brand: "",
    category: "",
    search: "",
    page: 1,
    limit: 12,
  });

  useEffect(() => {
    categoriesApi.listCategories().then(({ data }) => {
      setCategories(data.data || []);
    });
  }, []);

  const loadFollows = useCallback(() => {
    if (!canFollow) {
      setFollowedIds(new Set());
      return;
    }
    followsApi
      .myFollows({ limit: 100 })
      .then(({ data }) => {
        setFollowedIds(new Set((data.data || []).map((p) => p.id)));
      })
      .catch(() => setFollowedIds(new Set()));
  }, [canFollow]);

  useEffect(() => {
    loadFollows();
  }, [loadFollows]);

  const toggleFollow = async (product, next) => {
    // Optimistic update
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
      loadFollows(); // rollback ve trang thai that neu loi
    }
  };

  useEffect(() => {
    setLoading(true);
    const params = { ...filters };
    Object.keys(params).forEach((k) => params[k] === "" && delete params[k]);
    productsApi
      .listProducts(params)
      .then(({ data }) => {
        setProducts(data.data || []);
        setMeta(data.pagination || null);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const update = (patch) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>

      <div className="card grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">Tim kiem</label>
          <input
            className="input"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Jordan, Yeezy..."
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
            <option value="">Tat ca</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          Khong co san pham phu hop
        </div>
      ) : (
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
      )}

      <Pagination meta={meta} onChange={(page) => setFilters((f) => ({ ...f, page }))} />
    </div>
  );
};

export default Home;
