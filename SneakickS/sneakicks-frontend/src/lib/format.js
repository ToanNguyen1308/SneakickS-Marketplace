export const formatMoney = (v, digits = 2) =>
  v === null || v === undefined || v === "" ? "—" : `$${Number(v).toFixed(digits)}`;

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

/** Premium so voi gia retail (StockX hien "+x%" / "-x%"). */
export const premiumPct = (market, retail) => {
  const m = Number(market);
  const r = Number(retail);
  if (!m || !r) return null;
  return Math.round(((m - r) / r) * 100);
};
