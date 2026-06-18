import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import * as bidsApi from "../api/bids";
import Pagination from "../components/Pagination.jsx";
import { TableSkeleton, EmptyState } from "../components/States.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

const STATUS_COLOR = {
  active: "bg-brand-100 text-brand-800",
  matched: "bg-indigo-100 text-indigo-700",
  cancelled: "bg-slate-200 text-slate-600",
};

const MyBids = () => {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (status) params.status = status;
    bidsApi
      .myBids(params)
      .then(({ data }) => {
        setData(data.data || []);
        setMeta(data.pagination || null);
      })
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (id) => {
    if (!confirm(`Cancel bid #${id}?`)) return;
    try {
      await bidsApi.cancelBid(id);
      toast.success(`Bid #${id} cancelled`);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">My Bids</h1>
        <select
          className="input max-w-[12rem]"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="matched">Matched</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : data.length === 0 ? (
          <EmptyState
            title="You have no bids yet"
            hint="Place a bid from any product page."
            icon="🏷️"
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="text-left px-3 py-2">#</th>
                <th className="text-left px-3 py-2">Product</th>
                <th className="text-left px-3 py-2">Size</th>
                <th className="text-left px-3 py-2">Price</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Created</th>
                <th className="text-right px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{b.id}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/products/${b.product_id}`}
                      className="text-brand-700 hover:underline font-medium"
                    >
                      {b.product_name || `#${b.product_id}`}
                    </Link>
                    <div className="text-xs text-slate-500">{b.brand}</div>
                  </td>
                  <td className="px-3 py-2">{b.size}</td>
                  <td className="px-3 py-2 font-medium">${Number(b.price).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${STATUS_COLOR[b.status] || "bg-slate-100"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(b.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {b.status === "active" && (
                      <button
                        className="btn-secondary px-3 py-1"
                        onClick={() => handleCancel(b.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination meta={meta} onChange={setPage} />
      </div>
    </div>
  );
};

export default MyBids;
