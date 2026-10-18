import { Link } from "react-router-dom";
import ProductImage from "./ProductImage.jsx";
import { formatMoney, premiumPct } from "../lib/format";

/**
 * ProductCard
 *  - Week 6: `followed` + `onToggleFollow` (tuy chon) hien nut sao Wishlist.
 *  - GR2: anh SVG theo phoi mau, Lowest Ask + premium so voi retail, so giao dich 30 ngay;
 *    `source` cho biet nguoi dung den san pham tu dau (browse / search / wishlist...).
 */
const ProductCard = ({ product, followed = false, onToggleFollow, source }) => {
  const handleStar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFollow?.(product, !followed);
  };

  const premium = premiumPct(product.lowestAsk, product.price);

  return (
    <Link
      to={`/products/${product.id}`}
      state={source ? { source } : undefined}
      className="group card relative p-3 hover:shadow-md hover:border-slate-300 transition"
    >
      {onToggleFollow && (
        <button
          type="button"
          onClick={handleStar}
          aria-label={followed ? "Unfollow" : "Follow"}
          title={followed ? "Unfollow" : "Follow"}
          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none shadow transition-colors ${
            followed
              ? "bg-amber-400 text-white"
              : "bg-white/90 text-slate-400 hover:text-amber-500"
          }`}
        >
          {followed ? "★" : "☆"}
        </button>
      )}
      <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-50 mb-3">
        <div className="w-full h-full transition-transform duration-300 group-hover:scale-105">
          <ProductImage product={product} />
        </div>
      </div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
        {product.brand}
      </div>
      <div className="font-medium text-ink leading-snug line-clamp-2 min-h-[2.5rem]">
        {product.name}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div className="text-[11px] text-slate-400">Lowest Ask</div>
          <div className="font-bold text-ink text-lg leading-tight">
            {formatMoney(product.lowestAsk, 0)}
          </div>
        </div>
        {premium !== null && (
          <span
            className={`badge ${premium >= 0 ? "bg-brand-50 text-brand-700" : "bg-rose-50 text-rose-600"}`}
            title="Premium vs retail"
          >
            {premium >= 0 ? "+" : ""}
            {premium}%
          </span>
        )}
      </div>
      <div className="text-[11px] text-slate-400 mt-1">
        {product.sales30d
          ? `${product.sales30d} sold (30d)`
          : product.highestBid
            ? `Bid ${formatMoney(product.highestBid, 0)}`
            : `Retail ${formatMoney(product.price, 0)}`}
      </div>
    </Link>
  );
};

export default ProductCard;
