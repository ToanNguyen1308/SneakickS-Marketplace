const STATUS_META = {
  pending_shipment: { label: "Pending shipment", color: "bg-slate-200 text-slate-700" },
  shipped_to_verify: { label: "Shipped to verify", color: "bg-sky-100 text-sky-700" },
  verifying: { label: "Verifying", color: "bg-amber-100 text-amber-700" },
  verified_passed: { label: "Verified passed", color: "bg-emerald-100 text-emerald-700" },
  verified_failed: { label: "Verified failed", color: "bg-rose-100 text-rose-700" },
  shipped_to_buyer: { label: "Shipped to buyer", color: "bg-indigo-100 text-indigo-700" },
  completed: { label: "Completed", color: "bg-emerald-600 text-white" },
  cancelled: { label: "Cancelled", color: "bg-rose-200 text-rose-700" },
};

const OrderStatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || {
    label: status,
    color: "bg-slate-100 text-slate-600",
  };
  return <span className={`badge ${meta.color}`}>{meta.label}</span>;
};

export default OrderStatusBadge;
