import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNotifications } from "../contexts/NotificationContext.jsx";

const navItemClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "text-brand-700 bg-brand-50" : "text-ink hover:bg-slate-100"
  }`;

const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationBell = () => {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const onItemClick = (n) => {
    if (!n.is_read) markRead(n.id);
    setOpen(false);
    if (n.product_id) navigate(`/products/${n.product_id}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-md hover:bg-slate-100"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl border border-slate-200 shadow-xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-brand-700 font-medium hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No notifications yet
                </div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onItemClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${
                      n.is_read ? "" : "bg-brand-50/40"
                    }`}
                  >
                    <div className="flex gap-2">
                      {!n.is_read && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                      )}
                      <div className={n.is_read ? "pl-4" : ""}>
                        <div className="text-sm text-ink leading-snug">{n.message}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {timeAgo(n.created_at)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login");
  };

  const links = (
    <>
      <NavLink to="/" end className={navItemClass} onClick={() => setMobileOpen(false)}>
        Browse
      </NavLink>
      {isAuthenticated && !isAdmin && (
        <>
          <NavLink to="/me/bids" className={navItemClass} onClick={() => setMobileOpen(false)}>
            My Bids
          </NavLink>
          <NavLink to="/me/asks" className={navItemClass} onClick={() => setMobileOpen(false)}>
            My Asks
          </NavLink>
          <NavLink to="/me/orders" className={navItemClass} onClick={() => setMobileOpen(false)}>
            Orders
          </NavLink>
          <NavLink to="/me/wishlist" className={navItemClass} onClick={() => setMobileOpen(false)}>
            Wishlist
          </NavLink>
        </>
      )}
      {isAdmin && (
        <NavLink to="/admin/verifications" className={navItemClass} onClick={() => setMobileOpen(false)}>
          Admin
        </NavLink>
      )}
    </>
  );

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden p-2 -ml-2 rounded-md hover:bg-slate-100"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/" className="font-extrabold tracking-tight text-xl text-ink">
            Sneakick<span className="text-brand-700">S</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1">{links}</div>

        <div className="flex items-center gap-2 text-sm">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <span className="hidden sm:inline text-slate-600">
                {user?.username}
                {isAdmin && (
                  <span className="ml-1 badge bg-amber-100 text-amber-800">admin</span>
                )}
              </span>
              <button onClick={handleLogout} className="btn-secondary px-3 py-1.5">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary px-3 py-1.5">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary px-3 py-1.5">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 px-4 py-2 flex flex-col gap-1">
          {links}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
