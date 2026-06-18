import { useState } from "react";

const BidAskForm = ({ onSubmit, side, busy }) => {
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!size.trim()) return setError("Size is required");
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return setError("Price must be greater than 0");
    }
    try {
      await onSubmit({ size: size.trim(), price: priceNum });
      setSize("");
      setPrice("");
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  const colorClass = side === "bid" ? "btn-danger" : "btn-success";
  const label = side === "bid" ? "Place Bid" : "Place Ask";

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <label className="label">Size</label>
        <input
          className="input"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="42 / M / OS"
          disabled={busy}
        />
      </div>
      <div>
        <label className="label">Price (USD)</label>
        <input
          className="input"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="285.00"
          disabled={busy}
        />
      </div>
      {error && <div className="text-sm text-rose-600">{error}</div>}
      <button type="submit" className={`${colorClass} w-full`} disabled={busy}>
        {busy ? "..." : label}
      </button>
    </form>
  );
};

export default BidAskForm;
