import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      return setError("Password toi thieu 6 ky tu");
    }
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto card mt-8">
      <h1 className="text-xl font-bold text-slate-900 mb-4">Dang ky</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Username</label>
          <input
            className="input"
            value={form.username}
            onChange={update("username")}
            required
            minLength={3}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={update("email")}
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={update("password")}
            required
            minLength={6}
          />
        </div>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "..." : "Register"}
        </button>
      </form>
      <div className="text-sm text-slate-600 mt-3">
        Da co tai khoan?{" "}
        <Link to="/login" className="text-brand-600 font-medium">
          Dang nhap
        </Link>
      </div>
    </div>
  );
};

export default Register;
