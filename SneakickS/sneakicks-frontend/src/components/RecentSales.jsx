import { formatDate, formatMoney } from "../lib/format";

const RecentSales = ({ sales }) => (
  <div className="border border-slate-200 rounded-lg overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
        <tr>
          <th className="text-left px-3 py-2">Date</th>
          <th className="text-left px-3 py-2">Size</th>
          <th className="text-right px-3 py-2">Sale price</th>
        </tr>
      </thead>
      <tbody>
        {sales.length === 0 && (
          <tr>
            <td colSpan={3} className="text-center px-3 py-4 text-slate-400">
              No sales yet
            </td>
          </tr>
        )}
        {sales.map((s) => (
          <tr key={s.id} className="border-t border-slate-100">
            <td className="px-3 py-2 text-slate-600">{formatDate(s.created_at)}</td>
            <td className="px-3 py-2">{s.size}</td>
            <td className="px-3 py-2 text-right font-semibold">{formatMoney(s.price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default RecentSales;
