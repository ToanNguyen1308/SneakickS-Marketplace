import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import * as productsApi from "../api/products";
import * as bidsApi from "../api/bids";
import * as asksApi from "../api/asks";
import * as followsApi from "../api/follows";
import OrderBook from "../components/OrderBook.jsx";
import TradePanel from "../components/TradePanel.jsx";
import RecentSales from "../components/RecentSales.jsx";
import ProductImage from "../components/ProductImage.jsx";
import socket from "../realtime/socket";
import useProductViewTracking from "../hooks/useProductViewTracking";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { formatDate, formatMoney, premiumPct } from "../lib/format";

// Tach recharts ra khoi bundle ban dau (chi tai khi xem trang chi tiet).
const PriceChart = lazy(() => import("../components/PriceChart.jsx"));

/** Size mac dinh: size co Lowest Ask re nhat; neu chua co Ask thi lay size giua. */
const pickDefaultSize = (market) => {
  if (!market.length) return null;
  const withAsk = market.filter((m) => m.lowestAsk !== null);
  if (withAsk.length) {
    return withAsk.reduce((a, b) => (Number(b.lowestAsk) < Number(a.lowestAsk) ? b : a)).size;
  }
  return market[Math.floor(market.length / 2)].size;
};

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const toast = useToast();
  const canFollow = isAuthenticated && !isAdmin;

  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [market, setMarket] = useState([]);
  const [size, setSize] = useState(null);
  const [book, setBook] = useState({ bids: [], asks: [] });
  const [sales, setSales] = useState([]);
  const [busy, setBusy] = useState(false);
  const [following, setFollowing] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [live, setLive] = useState(false);

  useProductViewTracking(product?.id, location.state?.source || "direct");

  const reload = useCallback(async () => {
    try {
      const { data } = await productsApi.getProduct(id);
      setProduct(data.data);
    } catch (e) {
      if (e?.response?.status === 404) setNotFound(true);
    }
  }, [id]);

  const loadMarket = useCallback(async () => {
    try {
      const { data } = await productsApi.getMarket(id);
      const rows = data.data || [];
      setMarket(rows);
      setSize((s) => (s && rows.some((m) => m.size === s) ? s : pickDefaultSize(rows)));
    } catch {
      setMarket([]);
    }
  }, [id]);

  const loadOrderBook = useCallback(async () => {
    if (!size) return;
    try {
      const { data } = await productsApi.getOrderBook(id, size);
      setBook({ bids: data.bids?.data || [], asks: data.asks?.data || [] });
    } catch {
      setBook({ bids: [], asks: [] });
    }
  }, [id, size]);

  const loadSales = useCallback(async () => {
    try {
      const { data } = await productsApi.getRecentSales(id, 10);
      setSales(data.data || []);
    } catch {
      setSales([]);
    }
  }, [id]);

  const loadPriceHistory = useCallback(async () => {
    try {
      const { data } = await productsApi.getPriceHistory(id, 30);
      setPriceHistory(data.data || []);
    } catch {
      setPriceHistory([]);
    }
  }, [id]);

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    setSize(null);
    setLive(false);
    reload();
    loadMarket();
    loadSales();
    loadPriceHistory();
    window.scrollTo({ top: 0 });
  }, [reload, loadMarket, loadSales, loadPriceHistory]);

  useEffect(() => {
    loadOrderBook();
  }, [loadOrderBook]);

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

  const refreshAll = useCallback(
    () => Promise.all([reload(), loadMarket(), loadOrderBook(), loadSales()]),
    [reload, loadMarket, loadOrderBook, loadSales]
  );

  // Real-time: join room product:<id>, refetch khi co thay doi order book.
  useEffect(() => {
    const productId = Number(id);
    socket.emit("join:product", productId);
    const onUpdate = (payload) => {
      if (Number(payload?.productId) !== productId) return;
      setLive(true);
      refreshAll();
    };
    socket.on("product:update", onUpdate);
    return () => {
      socket.emit("leave:product", productId);
      socket.off("product:update", onUpdate);
    };
  }, [id, refreshAll]);

  const requireLogin = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return false;
    }
    return true;
  };

  const toggleFollow = async () => {
    if (!requireLogin()) return;
    const next = !following;
    setFollowing(next);
    try {
      if (next) await followsApi.follow(id);
      else await followsApi.unfollow(id);
    } catch {
      setFollowing(!next);
    }
  };

  const run = async (fn, successMsg) => {
    if (!requireLogin()) return false;
    setBusy(true);
    try {
      const { data } = await fn();
      toast.success(successMsg(data));
      await refreshAll();
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const payload = (extra = {}) => ({ product_id: Number(id), size, ...extra });

  const handlePlaceBid = (price) =>
    run(() => bidsApi.placeBid(payload({ price })), (d) => d.message || "Bid placed");
  const handlePlaceAsk = (price) =>
    run(() => asksApi.placeAsk(payload({ price })), (d) => d.message || "Ask placed");
  const handleBuyNow = () =>
    run(() => bidsApi.buyNow(payload()), (d) => `Purchased! Order #${d.data?.transaction?.id}`);
  const handleSellNow = () =>
    run(() => asksApi.sellNow(payload()), (d) => `Sold! Order #${d.data?.transaction?.id}`);

  if (notFound) {
    return (
      <div className="card text-center py-16">
        <div className="text-lg font-semibold">Product not found</div>
        <Link to="/" className="btn-primary mt-4 inline-flex">Back to marketplace</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-96 rounded-xl" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  const premium = premiumPct(product.lastSale, product.price);

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500 flex gap-1 flex-wrap">
        <Link to="/" className="hover:underline">Home</Link>
        <span>/</span>
        <Link to={`/?category=${encodeURIComponent(product.category || "")}`} className="hover:underline">
          {product.category}
        </Link>
        <span>/</span>
        <Link to={`/?brand=${encodeURIComponent(product.brand)}`} className="hover:underline">
          {product.brand}
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card p-0 overflow-hidden">
            <div className="aspect-[4/3] w-full">
              <ProductImage product={product} />
            </div>
          </div>
          <dl className="card grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="label">Retail</dt>
              <dd className="font-medium">{formatMoney(product.price)}</dd>
            </div>
            <div>
              <dt className="label">Release</dt>
              <dd className="font-medium">{formatDate(product.release_date)}</dd>
            </div>
            <div>
              <dt className="label">Colorway</dt>
              <dd className="font-medium">{product.colorway || "—"}</dd>
            </div>
            <div>
              <dt className="label">Style</dt>
              <dd className="font-medium">{product.sku || "—"}</dd>
            </div>
            <div>
              <dt className="label">Silhouette</dt>
              <dd className="font-medium">{product.silhouette || "—"}</dd>
            </div>
            <div>
              <dt className="label">Last sale</dt>
              <dd className="font-medium">
                {formatMoney(product.lastSale)}
                {premium !== null && (
                  <span className={`ml-1 text-xs ${premium >= 0 ? "text-brand-700" : "text-rose-600"}`}>
                    ({premium >= 0 ? "+" : ""}{premium}%)
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              {product.brand} · {product.category}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink mt-1 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 mt-3">
              {!isAdmin && (
                <button
                  type="button"
                  onClick={toggleFollow}
                  className={following ? "btn-secondary" : "btn-primary"}
                >
                  {following ? "★ Following" : "☆ Follow"}
                </button>
              )}
              {live && (
                <span className="badge bg-brand-100 text-brand-800 inline-flex items-center">
                  <span className="w-2 h-2 rounded-full bg-brand-600 mr-1 animate-pulse" />
                  Live
                </span>
              )}
              {product.sales30d > 0 && (
                <span className="badge bg-slate-100 text-slate-600">
                  {product.sales30d} sold in 30 days
                </span>
              )}
            </div>
          </div>

          {isAdmin ? (
            <div className="card text-sm text-slate-600">
              Admin accounts operate the verification center and cannot trade.
            </div>
          ) : (
            <TradePanel
              market={market}
              size={size}
              onSizeChange={setSize}
              busy={busy}
              onBuyNow={handleBuyNow}
              onSellNow={handleSellNow}
              onPlaceBid={handlePlaceBid}
              onPlaceAsk={handlePlaceAsk}
            />
          )}

          <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-ink mb-3">Price history (30 days)</h3>
          <Suspense fallback={<div className="skeleton h-[240px] w-full rounded" />}>
            <PriceChart data={priceHistory} />
          </Suspense>
        </div>
        <div className="card">
          <h3 className="font-semibold text-ink mb-3">Last sales</h3>
          <RecentSales sales={sales} />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-ink mb-3">Order book · size {size || "—"}</h3>
        <OrderBook bids={book.bids} asks={book.asks} />
      </div>
    </div>
  );
};

export default ProductDetail;
