import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const navItemClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-brand-700 text-white" : "text-slate-200 hover:bg-brand-700/70"
  }`;

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-brand-900 text-white shadow">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="font-bold tracking-wide text-lg">
          SneakickS
        </Link>
        <div className="flex items-center gap-1">
          <NavLink to="/" end className={navItemClass}>
            Home
          </NavLink>
          {/* Cac muc giao dich chi danh cho user thuong; admin la nguoi van hanh
              trung tam xac thuc nen khong hien My Bids / My Asks / Orders / Wishlist. */}
          {isAuthenticated && !isAdmin && (
            <>
              <NavLink to="/me/bids" className={navItemClass}>
                My Bids
              </NavLink>
              <NavLink to="/me/asks" className={navItemClass}>
                My Asks
              </NavLink>
              <NavLink to="/me/orders" className={navItemClass}>
                Orders
              </NavLink>
              <NavLink to="/me/wishlist" className={navItemClass}>
                Wishlist
              </NavLink>
            </>
          )}
          {isAdmin && (
            <NavLink to="/admin/verifications" className={navItemClass}>
              Admin
            </NavLink>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {isAuthenticated ? (
            <>
              <span className="opacity-80">
                {user?.username}
                {isAdmin && <span className="ml-1 badge bg-amber-400 text-amber-900">admin</span>}
              </span>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
