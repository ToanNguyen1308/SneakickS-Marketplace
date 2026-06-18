import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-slate-200 bg-white mt-12">
    <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
      <div>
        <div className="font-extrabold text-lg tracking-tight text-ink">
          Sneakick<span className="text-brand-700">S</span>
        </div>
        <p className="text-slate-500 mt-2 max-w-xs">
          The marketplace to buy and sell authenticated sneakers, streetwear and
          collectibles.
        </p>
      </div>
      <div>
        <div className="label">Marketplace</div>
        <ul className="space-y-1 text-slate-600">
          <li>
            <Link to="/" className="hover:text-brand-700">
              Browse products
            </Link>
          </li>
          <li>
            <Link to="/me/wishlist" className="hover:text-brand-700">
              Wishlist
            </Link>
          </li>
          <li>
            <Link to="/me/orders" className="hover:text-brand-700">
              My orders
            </Link>
          </li>
        </ul>
      </div>
      <div>
        <div className="label">About</div>
        <p className="text-slate-500">
          SneakickS is an academic MVP project (GR1) demonstrating a bid/ask
          marketplace with a verification center.
        </p>
      </div>
    </div>
    <div className="border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} SneakickS Marketplace. All rights
        reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
