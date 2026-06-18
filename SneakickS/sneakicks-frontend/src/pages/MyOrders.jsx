import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import * as txApi from "../api/transactions";
import OrderStatusBadge from "../components/OrderStatusBadge.jsx";
import RatingStars from "../components/RatingStars.jsx";
import { TableSkeleton, EmptyState } from "../components/States.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

const LIMIT = 10;

const RateModal = ({ open, onClose, onSubmit, busy }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">Rate seller</h3>
        <RatingStars value={rating} onChange={setRating} size="w-8 h-8" />
        <textarea
          className="input mt-3"
          rows={3}
          placeholder="Comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => onSubmit({ rating, comment })}
            disabled={busy}
          >
            {busy ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyOrders = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState("buyer");
  const [data, setData] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rateTarget, setRateTarget] = useState(null);

  const loadInitial = useCallback(() => {
    setLoading(true);
    txApi
      .myTransactions({ role, cursor: 0, limit: LIMIT })
      .then(({ data }) => {
        setData(data.data || []);
        setHasNext(Boolean(data.pagination?.hasNext));
        setCursor(data.pagination?.nextCursor ?? null);
      })
      .finally(() => setLoading(false));
  }, [role]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = () => {
    if (!hasNext || !cursor || loadingMore) return;
    setLoadingMore(true);
    txApi
      .myTransactions({ role, cursor, limit: LIMIT })
      .then(({ data }) => {
        setData((prev) => [...prev, ...(data.data || [])]);
        setHasNext(Boolean(data.pagination?.hasNext));
        setCursor(data.pagination?.nextCursor ?? null);
      })
      .finally(() => setLoadingMore(false));
  };

  const ship = async (id) => {
    setBusy(true);
    try {
      await txApi.shipTransaction(id);
      toast.success(`Order #${id} marked as shipped`);
      loadInitial();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const complete = async (id) => {
    setBusy(true);
    try {
      await txApi.completeTransaction(id);
      toast.success(`Order #${id} confirmed received`);
      loadInitial();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitRating = async ({ rating, comment }) => {
    if (!rateTarget) return;
    setBusy(true);
    try {
      await txApi.rateTransaction(rateTarget.id, { rating, comment });
      toast.success("Thanks for your rating!");
      setRateTarget(null);
      loadInitial();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
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
        <button className="btn-success px-3 py-1" disabled={busy} onClick={() => complete(tx.id)}>
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-extrabold text-ink">My Orders</h1>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[
            ["buyer", "Buying"],
            ["seller", "Selling"],
            ["all", "All"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                role === value ? "bg-white shadow font-semibold text-ink" : "text-slate-600"
              }`}
              onClick={() => setRole(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : data.length === 0 ? (
          <EmptyState
            title="No orders yet"
            hint="Your matched transactions will appear here."
            icon="🧾"
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
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
              {data.map((tx) => {
                const iAmBuyer = tx.buyer_id === user.id;
                const counterparty = iAmBuyer
                  ? tx.seller_username || `#${tx.seller_id}`
                  : tx.buyer_username || `#${tx.buyer_id}`;
                return (
                  <tr key={tx.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{tx.id}</td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/products/${tx.product_id}`}
                        className="text-brand-700 hover:underline font-medium"
                      >
                        {tx.product_name || `#${tx.product_id}`}
                      </Link>
                      <div className="text-xs text-slate-500">{tx.product_brand}</div>
                    </td>
                    <td className="px-3 py-2">{tx.size}</td>
                    <td className="px-3 py-2 font-medium">${Number(tx.price).toFixed(2)}</td>
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
              })}
            </tbody>
          </table>
        )}

        {hasNext && (
          <div className="flex justify-center pt-4">
            <button className="btn-secondary px-8" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
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
