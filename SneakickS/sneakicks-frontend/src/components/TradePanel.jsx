import { useState } from "react";
import SizePicker from "./SizePicker.jsx";
import { formatMoney } from "../lib/format";

/**
 * Khu vuc mua/ban kieu StockX: chon size -> hien ngay gia cua dung size do.
 * Tab Buy: Buy Now (khop Lowest Ask cua size) hoac Place Bid.
 * Tab Sell: Sell Now (khop Highest Bid cua size) hoac Place Ask.
 */
const TradePanel = ({ market, size, onSizeChange, busy, onBuyNow, onSellNow, onPlaceBid, onPlaceAsk }) => {
  const [mode, setMode] = useState("buy");
  const [price, setPrice] = useState("");
  const [error, setError] = useState(null);

  const current = market.find((m) => m.size === size) || {};
  const isBuy = mode === "buy";
  const instantPrice = isBuy ? current.lowestAsk : current.highestBid;

  const submitOrder = async (e) => {
    e.preventDefault();
    setError(null);
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return setError("Enter a price greater than 0");
    const ok = await (isBuy ? onPlaceBid(p) : onPlaceAsk(p));
    if (ok) setPrice("");
  };

  return (
    <div className="card space-y-4">
      <div className="grid grid-cols-2 bg-slate-100 rounded-lg p-1">
        {[
          ["buy", "Buy"],
          ["sell", "Sell"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={`py-2 rounded-md text-sm font-semibold transition ${
              mode === value ? "bg-white shadow text-ink" : "text-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <div className="label">Select size</div>
        <SizePicker market={market} value={size} onChange={onSizeChange} mode={mode} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 rounded-lg p-3">
        <div>
          <div className="label mb-0">Lowest Ask</div>
          <div className="font-bold text-brand-700">{formatMoney(current.lowestAsk)}</div>
        </div>
        <div>
          <div className="label mb-0">Highest Bid</div>
          <div className="font-bold text-rose-600">{formatMoney(current.highestBid)}</div>
        </div>
        <div>
          <div className="label mb-0">Last Sale</div>
          <div className="font-bold text-ink">{formatMoney(current.lastSale)}</div>
        </div>
      </div>

      <button
        type="button"
        className={`${isBuy ? "btn-primary" : "btn-success"} w-full py-3 text-base`}
        disabled={busy || !instantPrice}
        onClick={isBuy ? onBuyNow : onSellNow}
      >
        {instantPrice
          ? `${isBuy ? "Buy Now" : "Sell Now"} for ${formatMoney(instantPrice)} · size ${size}`
          : isBuy
            ? `No asks in size ${size} — place a bid`
            : `No bids in size ${size} — place an ask`}
      </button>

      <form onSubmit={submitOrder} className="space-y-2">
        <label className="label">
          {isBuy ? "Or place a bid" : "Or place an ask"} (size {size})
        </label>
        <div className="flex gap-2">
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price (USD)"
            disabled={busy}
          />
          <button type="submit" className={isBuy ? "btn-danger" : "btn-success"} disabled={busy}>
            {isBuy ? "Place Bid" : "Place Ask"}
          </button>
        </div>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <p className="text-xs text-slate-400">
          {isBuy
            ? "If your bid is at or above the lowest ask, it matches instantly."
            : "If your ask is at or below the highest bid, it matches instantly."}
        </p>
      </form>
    </div>
  );
};

export default TradePanel;
