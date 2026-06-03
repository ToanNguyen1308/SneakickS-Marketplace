import { useEffect, useState, useCallback } from "react";
import * as followsApi from "../api/follows";
import ProductCard from "../components/ProductCard.jsx";
import Pagination from "../components/Pagination.jsx";

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
      // Neu xoa het item cuoi cung cua trang > 1 -> lui ve trang truoc.
      if (products.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Wishlist</h1>
      <p className="text-sm text-slate-500">
        Cac san pham ban dang theo doi. Bam ngoi sao de bo theo doi.
      </p>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          Ban chua theo doi san pham nao
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              followed
              onToggleFollow={() => busyId !== p.id && unfollow(p)}
            />
          ))}
        </div>
      )}

      <Pagination meta={meta} onChange={setPage} />
    </div>
  );
};

export default Wishlist;
