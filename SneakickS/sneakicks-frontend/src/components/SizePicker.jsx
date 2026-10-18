import { formatMoney } from "../lib/format";

/**
 * Bo chon size kieu StockX: moi o hien size + gia cua rieng size do.
 * `mode` = "buy" hien Lowest Ask, "sell" hien Highest Bid.
 */
const SizePicker = ({ market, value, onChange, mode = "buy" }) => {
  if (!market?.length) {
    return <div className="skeleton h-24 w-full rounded-lg" />;
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {market.map((m) => {
        const price = mode === "buy" ? m.lowestAsk : m.highestBid;
        const active = m.size === value;
        const priceClass = active
          ? "text-slate-200"
          : price
            ? mode === "buy" ? "text-brand-700" : "text-rose-600"
            : "text-slate-400";
        return (
          <button
            key={m.size}
            type="button"
            onClick={() => onChange(m.size)}
            className={`rounded-lg border px-2 py-2 text-left transition ${
              active
                ? "border-ink bg-ink text-white"
                : "border-slate-200 bg-white hover:border-slate-400"
            }`}
          >
            <div className="text-sm font-semibold">{m.size}</div>
            <div className={`text-xs ${priceClass}`}>
              {price ? formatMoney(price, 0) : mode === "buy" ? "Bid" : "Ask"}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SizePicker;
