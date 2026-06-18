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
      return setError("Password must be at least 6 characters");
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
      <h1 className="text-2xl font-extrabold text-ink mb-1">Create account</h1>
      <p className="text-sm text-slate-500 mb-4">
        Join SneakickS to buy and sell sneakers.
      </p>
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
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <div className="text-sm text-slate-600 mt-3">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-700 font-semibold">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;
