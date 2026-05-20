const formatMoney = (value) => `$${Number(value).toFixed(2)}`;

const Side = ({ title, color, rows }) => (
  <div>
    <div className={`text-sm font-semibold ${color} mb-1`}>{title}</div>
    <div className="border border-slate-200 rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="text-left px-2 py-1">Price</th>
            <th className="text-left px-2 py-1">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className="text-center px-2 py-3 text-slate-400">
                Empty
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-2 py-1 font-medium">{formatMoney(r.price)}</td>
              <td className="px-2 py-1 text-slate-500">
                {new Date(r.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const OrderBook = ({ bids = [], asks = [] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Side title="Bids (Highest first)" color="text-rose-600" rows={bids} />
    <Side title="Asks (Lowest first)" color="text-emerald-700" rows={asks} />
  </div>
);

export default OrderBook;
