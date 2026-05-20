import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as productsApi from "../api/products";
import * as bidsApi from "../api/bids";
import * as asksApi from "../api/asks";
import OrderBook from "../components/OrderBook.jsx";
import BidAskForm from "../components/BidAskForm.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const PLACEHOLDER = "https://placehold.co/800x600?text=Sneakicks";

const formatMoney = (v) =>
  v === null || v === undefined ? "—" : `$${Number(v).toFixed(2)}`;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [size, setSize] = useState("42");
  const [book, setBook] = useState({ bids: [], asks: [] });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

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

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    loadOrderBook();
  }, [loadOrderBook]);

  const requireLogin = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const handlePlaceBid = async ({ size: s, price }) => {
    if (!requireLogin()) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await bidsApi.placeBid({
        product_id: Number(id),
        size: s,
        price,
      });
      setMessage({ type: "success", text: data.message });
      setSize(s);
      await Promise.all([reload(), loadOrderBook()]);
    } finally {
      setBusy(false);
    }
  };

  const handlePlaceAsk = async ({ size: s, price }) => {
    if (!requireLogin()) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await asksApi.placeAsk({
        product_id: Number(id),
        size: s,
        price,
      });
      setMessage({ type: "success", text: data.message });
      setSize(s);
      await Promise.all([reload(), loadOrderBook()]);
    } finally {
      setBusy(false);
    }
  };

  const handleBuyNow = async () => {
    if (!requireLogin()) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await bidsApi.buyNow({
        product_id: Number(id),
        size,
      });
      setMessage({ type: "success", text: `Buy Now thanh cong, transaction #${data.data?.transaction?.id}` });
      await Promise.all([reload(), loadOrderBook()]);
    } catch (e) {
      setMessage({ type: "error", text: e?.response?.data?.message || e.message });
    } finally {
      setBusy(false);
    }
  };

  const handleSellNow = async () => {
    if (!requireLogin()) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await asksApi.sellNow({
        product_id: Number(id),
        size,
      });
      setMessage({ type: "success", text: `Sell Now thanh cong, transaction #${data.data?.transaction?.id}` });
      await Promise.all([reload(), loadOrderBook()]);
    } catch (e) {
      setMessage({ type: "error", text: e?.response?.data?.message || e.message });
    } finally {
      setBusy(false);
    }
  };

  if (!product) {
    return <div className="text-center py-10 text-slate-500">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 card">
        <img
          src={product.image || PLACEHOLDER}
          alt={product.name}
          className="w-full aspect-[4/3] object-cover rounded"
          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
        />
        <div className="text-xs uppercase text-brand-600 font-semibold mt-3">
          {product.brand}
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-1">{product.name}</h1>
        <p className="text-sm text-slate-600 mt-2">{product.description}</p>
        <dl className="grid grid-cols-2 gap-2 mt-4 text-sm">
          <div>
            <dt className="text-slate-400">Category</dt>
            <dd>{product.category || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Retail</dt>
            <dd>{formatMoney(product.price)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Lowest Ask</dt>
            <dd className="font-semibold text-emerald-700">
              {formatMoney(product.lowestAsk)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Highest Bid</dt>
            <dd className="font-semibold text-rose-600">
              {formatMoney(product.highestBid)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="md:col-span-2 space-y-4">
        <div className="card space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label">Order book size</label>
              <input
                className="input"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="42"
              />
            </div>
            <button className="btn-secondary" onClick={loadOrderBook} disabled={busy}>
              Reload book
            </button>
          </div>
          <OrderBook bids={book.bids} asks={book.asks} />
        </div>

        {message && (
          <div
            className={`card text-sm ${
              message.type === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-rose-300 bg-rose-50 text-rose-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-rose-600 mb-2">Bid (Buyer)</h3>
            <BidAskForm side="bid" onSubmit={handlePlaceBid} busy={busy} />
            <button
              className="btn-danger w-full mt-3"
              onClick={handleBuyNow}
              disabled={busy || !product.lowestAsk}
            >
              Buy Now @ {formatMoney(product.lowestAsk)}
            </button>
          </div>
          <div className="card">
            <h3 className="font-semibold text-emerald-700 mb-2">Ask (Seller)</h3>
            <BidAskForm side="ask" onSubmit={handlePlaceAsk} busy={busy} />
            <button
              className="btn-success w-full mt-3"
              onClick={handleSellNow}
              disabled={busy || !product.highestBid}
            >
              Sell Now @ {formatMoney(product.highestBid)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
