import { Link } from "react-router-dom";

const PLACEHOLDER = "https://placehold.co/400x300?text=Sneakicks";

const formatMoney = (value) =>
  value === null || value === undefined ? "—" : `$${Number(value).toFixed(2)}`;

/**
 * ProductCard
 *  - Week 6: nhan them `followed` + `onToggleFollow` (tuy chon) de hien nut sao Wishlist.
 *    Nut sao goi preventDefault/stopPropagation de khong dieu huong khi bam.
 */
const ProductCard = ({ product, followed = false, onToggleFollow }) => {
  const handleStar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFollow?.(product, !followed);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="card relative hover:shadow-md transition-shadow"
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
      <div className="aspect-[4/3] w-full overflow-hidden rounded bg-slate-100 mb-3">
        <img
          src={product.image || PLACEHOLDER}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER;
          }}
        />
      </div>
      <div className="text-xs uppercase text-brand-600 font-semibold">
        {product.brand}
      </div>
      <div className="font-medium text-slate-900 line-clamp-2 mb-2">
        {product.name}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
        <div>
          <div className="text-slate-400">Lowest Ask</div>
          <div className="font-semibold text-emerald-700">
            {formatMoney(product.lowestAsk)}
          </div>
        </div>
        <div>
          <div className="text-slate-400">Highest Bid</div>
          <div className="font-semibold text-rose-600">
            {formatMoney(product.highestBid)}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
