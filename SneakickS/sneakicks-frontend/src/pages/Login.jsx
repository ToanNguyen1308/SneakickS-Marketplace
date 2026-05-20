import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("buyer1@sneakicks.com");
  const [password, setPassword] = useState("buyer123");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      const to = location.state?.from?.pathname || "/";
      navigate(to, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto card mt-8">
      <h1 className="text-xl font-bold text-slate-900 mb-4">Dang nhap</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "..." : "Login"}
        </button>
      </form>
      <div className="text-sm text-slate-600 mt-3">
        Chua co tai khoan?{" "}
        <Link to="/register" className="text-brand-600 font-medium">
          Dang ky
        </Link>
      </div>
    </div>
  );
};

export default Login;
