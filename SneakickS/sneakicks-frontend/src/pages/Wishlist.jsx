import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import * as followsApi from "../api/follows";
import ProductCard from "../components/ProductCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { ProductGridSkeleton, EmptyState } from "../components/States.jsx";

const Wishlist = () => {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    followsApi
      .myFollows({ page, limit: 12 })
      .then(({ data }) => {
        setProducts(data.data || []);
        setMeta(data.pagination || null);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const unfollow = async (product) => {
    setBusyId(product.id);
    try {
      await followsApi.unfollow(product.id);
      if (products.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Wishlist</h1>
        <p className="text-sm text-slate-500">
          Products you follow. Tap the star to unfollow.
        </p>
      </div>

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : products.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          hint="Follow products to track their prices."
          icon="⭐"
          action={
            <Link to="/" className="btn-primary inline-flex">
              Browse products
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              followed
              onToggleFollow={() => busyId !== p.id && unfollow(p)}
              source="wishlist"
            />
          ))}
        </div>
      )}

      <Pagination meta={meta} onChange={setPage} />
    </div>
  );
};

export default Wishlist;
