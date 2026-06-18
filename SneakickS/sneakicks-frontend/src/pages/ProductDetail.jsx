import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as productsApi from "../api/products";
import * as bidsApi from "../api/bids";
import * as asksApi from "../api/asks";
import * as followsApi from "../api/follows";
import OrderBook from "../components/OrderBook.jsx";
import BidAskForm from "../components/BidAskForm.jsx";
import socket from "../realtime/socket";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

// Tach recharts ra khoi bundle ban dau (chi tai khi xem trang chi tiet).
const PriceChart = lazy(() => import("../components/PriceChart.jsx"));

const PLACEHOLDER = "https://placehold.co/800x600?text=Sneakicks";

const formatMoney = (v) =>
  v === null || v === undefined ? "—" : `$${Number(v).toFixed(2)}`;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const toast = useToast();
  const canFollow = isAuthenticated && !isAdmin;

  const [product, setProduct] = useState(null);
  const [size, setSize] = useState("42");
  const [book, setBook] = useState({ bids: [], asks: [] });
  const [busy, setBusy] = useState(false);
  const [following, setFollowing] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [live, setLive] = useState(false);

  const loadOrderBook = useCallback(async () => {
    try {
      const { data } = await productsApi.getOrderBook(id, size);
      setBook({ bids: data.bids?.data || [], asks: data.asks?.data || [] });
    } catch (e) {
      setBook({ bids: [], asks: [] });
    }
  }, [id, size]);

  const reload = useCallback(async () => {
    const { data } = await productsApi.getProduct(id);
    setProduct(data.data);
  }, [id]);

  const loadPriceHistory = useCallback(async () => {
    try {
      const { data } = await productsApi.getPriceHistory(id, 30);
      setPriceHistory(data.data || []);
    } catch (e) {
      setPriceHistory([]);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    loadOrderBook();
  }, [loadOrderBook]);

  useEffect(() => {
    loadPriceHistory();
  }, [loadPriceHistory]);

  useEffect(() => {
    if (!canFollow) {
      setFollowing(false);
      return;
    }
    followsApi
      .getStatus(id)
      .then(({ data }) => setFollowing(Boolean(data.following)))
      .catch(() => setFollowing(false));
  }, [id, canFollow]);

  // Real-time: join room product:<id>, refetch khi co thay doi order book.
  useEffect(() => {
    const productId = Number(id);
    socket.emit("join:product", productId);
    const onUpdate = (payload) => {
      if (Number(payload?.productId) !== productId) return;
      setLive(true);
      reload();
      loadOrderBook();
    };
    socket.on("product:update", onUpdate);
    return () => {
      socket.emit("leave:product", productId);
      socket.off("product:update", onUpdate);
    };
  }, [id, reload, loadOrderBook]);

  const requireLogin = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const toggleFollow = async () => {
    if (!isAuthenticated) return navigate("/login");
    const next = !following;
    setFollowing(next);
    try {
      if (next) await followsApi.follow(id);
      else await followsApi.unfollow(id);
    } catch {
      setFollowing(!next);
    }
  };

  const handlePlaceBid = async ({ size: s, price }) => {
    if (!requireLogin()) return;
    setBusy(true);
    try {
      const { data } = await bidsApi.placeBid({ product_id: Number(id), size: s, price });
      toast.success(data.message || "Bid placed");
      setSize(s);
      await Promise.all([reload(), loadOrderBook()]);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePlaceAsk = async ({ size: s, price }) => {
    if (!requireLogin()) return;
    setBusy(true);
    try {
      const { data } = await asksApi.placeAsk({ product_id: Number(id), size: s, price });
      toast.success(data.message || "Ask placed");
      setSize(s);
      await Promise.all([reload(), loadOrderBook()]);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleBuyNow = async () => {
    if (!requireLogin()) return;
    setBusy(true);
    try {
      const { data } = await bidsApi.buyNow({ product_id: Number(id), size });
      toast.success(`Buy Now success — transaction #${data.data?.transaction?.id}`);
      await Promise.all([reload(), loadOrderBook()]);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSellNow = async () => {
    if (!requireLogin()) return;
    setBusy(true);
    try {
      const { data } = await asksApi.sellNow({ product_id: Number(id), size });
      toast.success(`Sell Now success — transaction #${data.data?.transaction?.id}`);
      await Promise.all([reload(), loadOrderBook()]);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!product) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="skeleton h-80 rounded-xl" />
        <div className="md:col-span-2 skeleton h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 card">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100">
          <img
            src={product.image || PLACEHOLDER}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
          />
        </div>
        <div className="text-xs uppercase tracking-wide text-brand-700 font-semibold mt-3">
          {product.brand}
        </div>
        <h1 className="text-xl font-bold text-ink mt-1">{product.name}</h1>
        <p className="text-sm text-slate-600 mt-2">{product.description}</p>

        <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <dt className="label">Category</dt>
            <dd>{product.category || "—"}</dd>
          </div>
          <div>
            <dt className="label">Retail</dt>
            <dd>{formatMoney(product.price)}</dd>
          </div>
          <div>
            <dt className="label">Lowest Ask</dt>
            <dd className="font-bold text-brand-700 text-lg">
              {formatMoney(product.lowestAsk)}
            </dd>
          </div>
          <div>
            <dt className="label">Highest Bid</dt>
            <dd className="font-bold text-rose-600 text-lg">
              {formatMoney(product.highestBid)}
            </dd>
          </div>
        </dl>

        {!isAdmin && (
          <button
            type="button"
            onClick={toggleFollow}
            className={`w-full mt-4 ${following ? "btn-secondary" : "btn-primary"}`}
          >
            {following ? "★ Following" : "☆ Follow"}
          </button>
        )}

        <div className="mt-5">
          <div className="label">Price history (30 days)</div>
          <Suspense fallback={<div className="skeleton h-[240px] w-full rounded" />}>
            <PriceChart data={priceHistory} />
          </Suspense>
        </div>
      </div>

      <div className="md:col-span-2 space-y-4">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">Order Book</h3>
            {live && (
              <span className="badge bg-brand-100 text-brand-800 inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-brand-600 mr-1 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label">Size</label>
              <input
                className="input"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="42"
              />
            </div>
            <button className="btn-secondary" onClick={loadOrderBook} disabled={busy}>
              Refresh
            </button>
          </div>
          <OrderBook bids={book.bids} asks={book.asks} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-rose-600 mb-2">Bid (Buy)</h3>
            <BidAskForm side="bid" onSubmit={handlePlaceBid} busy={busy} />
            <button
              className="btn-danger w-full mt-3"
              onClick={handleBuyNow}
              disabled={busy || !product.lowestAsk}
            >
              Buy Now - {formatMoney(product.lowestAsk)}
            </button>
          </div>
          <div className="card">
            <h3 className="font-semibold text-brand-700 mb-2">Ask (Sell)</h3>
            <BidAskForm side="ask" onSubmit={handlePlaceAsk} busy={busy} />
            <button
              className="btn-success w-full mt-3"
              onClick={handleSellNow}
              disabled={busy || !product.highestBid}
            >
              Sell Now - {formatMoney(product.highestBid)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
