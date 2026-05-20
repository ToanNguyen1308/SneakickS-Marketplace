import { Link } from "react-router-dom";

const PLACEHOLDER = "https://placehold.co/400x300?text=Sneakicks";

const formatMoney = (value) =>
  value === null || value === undefined ? "—" : `$${Number(value).toFixed(2)}`;

const ProductCard = ({ product }) => {
  return (
    <Link
      to={`/products/${product.id}`}
      className="card hover:shadow-md transition-shadow"
    >
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
