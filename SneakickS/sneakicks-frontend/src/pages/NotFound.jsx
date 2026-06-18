import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="text-center py-20">
    <div className="text-7xl font-extrabold text-brand-700">404</div>
    <h1 className="text-2xl font-bold text-ink mt-4">Page not found</h1>
    <p className="text-slate-500 mt-2">
      The page you are looking for doesn&apos;t exist or has been moved.
    </p>
    <Link to="/" className="btn-primary mt-6 inline-flex">
      Back to marketplace
    </Link>
  </div>
);

export default NotFound;
