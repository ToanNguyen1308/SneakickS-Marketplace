import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import * as asksApi from "../api/asks";
import Pagination from "../components/Pagination.jsx";

const STATUS_COLOR = {
  active: "bg-emerald-100 text-emerald-700",
  matched: "bg-indigo-100 text-indigo-700",
  cancelled: "bg-slate-200 text-slate-600",
};

const MyAsks = () => {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (status) params.status = status;
    asksApi
      .myAsks(params)
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
    if (!confirm(`Cancel ask #${id}?`)) return;
    try {
      await asksApi.cancelAsk(id);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Asks</h1>
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
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
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
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-500">
                  Khong co ask nao
                </td>
              </tr>
            ) : (
              data.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-3 py-2">{a.id}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/products/${a.product_id}`}
                      className="text-brand-700 hover:underline"
                    >
                      {a.product_name || `#${a.product_id}`}
                    </Link>
                    <div className="text-xs text-slate-500">{a.brand}</div>
                  </td>
                  <td className="px-3 py-2">{a.size}</td>
                  <td className="px-3 py-2 font-medium">${Number(a.price).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${STATUS_COLOR[a.status] || "bg-slate-100"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {a.status === "active" && (
                      <button
                        className="btn-secondary px-3 py-1"
                        onClick={() => handleCancel(a.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} onChange={setPage} />
      </div>
    </div>
  );
};

export default MyAsks;
