import { useEffect, useState, useCallback } from "react";
import * as verApi from "../api/verifications";
import * as txApi from "../api/transactions";
import OrderStatusBadge from "../components/OrderStatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "passed", label: "Passed" },
  { id: "failed", label: "Failed" },
];

const AdminVerifications = () => {
  const [result, setResult] = useState("pending");
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failTarget, setFailTarget] = useState(null);
  const [failNotes, setFailNotes] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    verApi
      .listVerifications({ result, page, limit: 10 })
      .then(({ data }) => {
        setData(data.data || []);
        setMeta(data.pagination || null);
      })
      .finally(() => setLoading(false));
  }, [result, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handle = async (fn, label) => {
    setBusy(true);
    try {
      await fn();
      load();
    } catch (e) {
      alert(`${label}: ${e?.response?.data?.message || e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const start = (tid) =>
    handle(async () => {
      // Truoc khi start, kiem tra transaction status; neu da o verifying thi bo qua.
      await verApi.startVerification(tid);
    }, "Start");

  const pass = (tid) =>
    handle(async () => {
      // De don gian: neu transaction o shipped_to_verify, goi start truoc, roi pass.
      const tx = await txApi.getTransaction(tid);
      if (tx.data.data.status === "shipped_to_verify") {
        await verApi.startVerification(tid);
      }
      await verApi.passVerification(tid, "Authentic");
    }, "Pass");

  const submitFail = async () => {
    if (!failTarget) return;
    if (!failNotes.trim()) {
      alert("Vui long nhap ly do");
      return;
    }
    setBusy(true);
    try {
      const tx = await txApi.getTransaction(failTarget);
      if (tx.data.data.status === "shipped_to_verify") {
        await verApi.startVerification(failTarget);
      }
      await verApi.failVerification(failTarget, failNotes.trim());
      setFailTarget(null);
      setFailNotes("");
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold text-slate-900">Admin · Verifications</h1>

      <div className="flex gap-1 bg-slate-200 rounded-md p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`px-3 py-1 rounded text-sm ${
              result === t.id
                ? "bg-white shadow font-semibold"
                : "text-slate-600"
            }`}
            onClick={() => {
              setResult(t.id);
              setPage(1);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2">Tx #</th>
              <th className="text-left px-3 py-2">Product</th>
              <th className="text-left px-3 py-2">Size</th>
              <th className="text-left px-3 py-2">Price</th>
              <th className="text-left px-3 py-2">Buyer</th>
              <th className="text-left px-3 py-2">Seller</th>
              <th className="text-left px-3 py-2">Order status</th>
              <th className="text-right px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-slate-500">
                  Khong co transaction phu hop
                </td>
              </tr>
            ) : (
              data.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="px-3 py-2">{v.transaction_id}</td>
                  <td className="px-3 py-2">
                    <div>{v.product_name || `#${v.product_id}`}</div>
                    <div className="text-xs text-slate-500">{v.product_brand}</div>
                  </td>
                  <td className="px-3 py-2">{v.size}</td>
                  <td className="px-3 py-2 font-medium">
                    ${Number(v.price).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">{v.buyer_username}</td>
                  <td className="px-3 py-2">{v.seller_username}</td>
                  <td className="px-3 py-2">
                    <OrderStatusBadge status={v.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {result === "pending" ? (
                      <div className="flex gap-2 justify-end">
                        {v.status === "shipped_to_verify" && (
                          <button
                            className="btn-secondary px-3 py-1"
                            disabled={busy}
                            onClick={() => start(v.transaction_id)}
                          >
                            Start
                          </button>
                        )}
                        <button
                          className="btn-success px-3 py-1"
                          disabled={busy}
                          onClick={() => pass(v.transaction_id)}
                        >
                          Pass
                        </button>
                        <button
                          className="btn-danger px-3 py-1"
                          disabled={busy}
                          onClick={() => setFailTarget(v.transaction_id)}
                        >
                          Fail
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">{v.notes || "—"}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} onChange={setPage} />
      </div>

      {failTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Fail transaction #{failTarget}</h3>
            <p className="text-sm text-slate-600 mb-2">
              Ly do (notes) la bat buoc — se duoc log vao order_status_logs.
            </p>
            <textarea
              className="input"
              rows={3}
              value={failNotes}
              onChange={(e) => setFailNotes(e.target.value)}
              placeholder="vd: San pham khong dung mau, co dau hieu sua chua..."
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                className="btn-secondary"
                disabled={busy}
                onClick={() => {
                  setFailTarget(null);
                  setFailNotes("");
                }}
              >
                Huy
              </button>
              <button className="btn-danger" disabled={busy} onClick={submitFail}>
                {busy ? "..." : "Confirm fail"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
