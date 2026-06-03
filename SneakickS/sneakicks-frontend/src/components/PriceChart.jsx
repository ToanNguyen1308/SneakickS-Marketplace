import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/**
 * PriceChart — Week 6
 * Ve duong gia trung binh theo ngay tu du lieu /price-history.
 */
const PriceChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-slate-400 py-10 text-center">
        Chua co giao dich nao trong khoang thoi gian nay
      </div>
    );
  }

  const chartData = data.map((d) => ({
    day: typeof d.day === "string" ? d.day.slice(5) : d.day, // MM-DD
    avg: Number(d.avg_price),
    min: Number(d.min_price),
    max: Number(d.max_price),
    trades: d.trades,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} width={48} />
        <Tooltip
          formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
          labelFormatter={(label) => `Ngay ${label}`}
        />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={{ r: 2 }}
          name="Gia TB"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;
