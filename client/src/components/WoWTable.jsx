const METRICS = ['MQL', 'SAL', 'SQL', 'Active'];

function pct(thisWeek, lastWeek) {
  if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
  return ((thisWeek - lastWeek) / lastWeek) * 100;
}

export default function WoWTable({ thisWeek, lastWeek }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">This Week</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Last Week</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Change</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">% Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {METRICS.map((m) => {
            const tw = thisWeek[m] ?? 0;
            const lw = lastWeek[m] ?? 0;
            const diff = tw - lw;
            const p = pct(tw, lw);
            const up = diff >= 0;
            return (
              <tr key={m} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{m}</td>
                <td className="px-4 py-3 text-right text-gray-700">{tw}</td>
                <td className="px-4 py-3 text-right text-gray-700">{lw}</td>
                <td className={`px-4 py-3 text-right font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
                  {diff >= 0 ? '+' : ''}{diff}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
                  {up ? '▲' : '▼'} {Math.abs(p).toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
