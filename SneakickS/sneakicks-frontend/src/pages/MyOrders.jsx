import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import * as txApi from "../api/transactions";
import Pagination from "../components/Pagination.jsx";
import OrderStatusBadge from "../components/OrderStatusBadge.jsx";
import RatingStars from "../components/RatingStars.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const RateModal = ({ open, onClose, onSubmit, busy }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">Cham diem seller</h3>
        <RatingStars value={rating} onChange={setRating} size="w-8 h-8" />
        <textarea
          className="input mt-3"
          rows={3}
          placeholder="Nhan xet (tuy chon)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            Huy
          </button>
          <button
            className="btn-primary"
            onClick={() => onSubmit({ rating, comment })}
            disabled={busy}
          >
            {busy ? "..." : "Gui"}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyOrders = () => {
  const { user } = useAuth();
  const [role, setRole] = useState("buyer");
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rateTarget, setRateTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    txApi
      .myTransactions({ role, page, limit: 10 })
      .then(({ data }) => {
        setData(data.data || []);
        setMeta(data.pagination || null);
      })
      .finally(() => setLoading(false));
  }, [role, page]);

  useEffect(() => {
    load();
  }, [load]);

  const ship = async (id) => {
    setBusy(true);
    try {
      await txApi.shipTransaction(id);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const complete = async (id) => {
    setBusy(true);
    try {
      await txApi.completeTransaction(id);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitRating = async ({ rating, comment }) => {
    if (!rateTarget) return;
    setBusy(true);
    try {
      await txApi.rateTransaction(rateTarget.id, { rating, comment });
      setRateTarget(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const renderActions = (tx) => {
    const iAmBuyer = tx.buyer_id === user.id;
    const iAmSeller = tx.seller_id === user.id;
    if (tx.status === "pending_shipment" && iAmSeller) {
      return (
        <button className="btn-primary px-3 py-1" disabled={busy} onClick={() => ship(tx.id)}>
          Mark shipped
        </button>
      );
    }
    if (tx.status === "shipped_to_buyer" && iAmBuyer) {
      return (
        <button
          className="btn-success px-3 py-1"
          disabled={busy}
          onClick={() => complete(tx.id)}
        >
          Confirm received
        </button>
      );
    }
    if (tx.status === "completed" && iAmBuyer) {
      return (
        <button
          className="btn-secondary px-3 py-1"
          disabled={busy}
          onClick={() => setRateTarget(tx)}
        >
          Rate seller
        </button>
      );
    }
    return <span className="text-xs text-slate-400">—</span>;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <div className="flex gap-1 bg-slate-200 rounded-md p-1">
          {[
            ["buyer", "Buying"],
            ["seller", "Selling"],
            ["all", "All"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`px-3 py-1 rounded text-sm ${
                role === value
                  ? "bg-white shadow font-semibold"
                  : "text-slate-600"
              }`}
              onClick={() => {
                setRole(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Product</th>
              <th className="text-left px-3 py-2">Size</th>
              <th className="text-left px-3 py-2">Price</th>
              <th className="text-left px-3 py-2">Counterparty</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-right px-3 py-2">Action</th>
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
                  Khong co order nao
                </td>
              </tr>
            ) : (
              data.map((tx) => {
                const iAmBuyer = tx.buyer_id === user.id;
                const counterparty = iAmBuyer
                  ? tx.seller_username || `#${tx.seller_id}`
                  : tx.buyer_username || `#${tx.buyer_id}`;
                return (
                  <tr key={tx.id} className="border-t">
                    <td className="px-3 py-2">{tx.id}</td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/products/${tx.product_id}`}
                        className="text-brand-700 hover:underline"
                      >
                        {tx.product_name || `#${tx.product_id}`}
                      </Link>
                      <div className="text-xs text-slate-500">{tx.product_brand}</div>
                    </td>
                    <td className="px-3 py-2">{tx.size}</td>
                    <td className="px-3 py-2 font-medium">
                      ${Number(tx.price).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      {iAmBuyer ? "Seller: " : "Buyer: "}
                      <span className="font-medium">{counterparty}</span>
                    </td>
                    <td className="px-3 py-2">
                      <OrderStatusBadge status={tx.status} />
                    </td>
                    <td className="px-3 py-2 text-right">{renderActions(tx)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination meta={meta} onChange={setPage} />
      </div>

      <RateModal
        open={Boolean(rateTarget)}
        onClose={() => setRateTarget(null)}
        onSubmit={submitRating}
        busy={busy}
      />
    </div>
  );
};

export default MyOrders;
