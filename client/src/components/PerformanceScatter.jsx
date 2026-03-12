import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';

function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value}%`;
}

function TooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{point.name}</p>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
        <span>Volume</span>
        <span className="text-right font-semibold text-slate-900">{formatNumber(point.x)}</span>
        <span>Win rate</span>
        <span className="text-right font-semibold text-slate-900">{formatPercent(point.y)}</span>
        <span>Qualified</span>
        <span className="text-right font-semibold text-slate-900">
          {formatNumber(point.qualifiedCount)} ({formatPercent(point.qualifiedRate)})
        </span>
        <span>Active</span>
        <span className="text-right font-semibold text-slate-900">
          {formatNumber(point.activeCount)} ({formatPercent(point.activeRate)})
        </span>
      </div>
    </div>
  );
}

export default function PerformanceScatter({
  points,
  height = 360,
  xRef = null,
  yRef = null,
  xLabel = 'Volume',
  yLabel = 'Win rate (%)',
}) {
  const maxQualified = Math.max(1, ...points.map((p) => p.qualifiedCount ?? 0));
  const maxX = Math.max(1, ...points.map((p) => p.x ?? 0));

  return (
    <div className="h-[360px] w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 18, bottom: 10, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
            domain={[0, Math.ceil(maxX * 1.1)]}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
            domain={[0, 100]}
          />
          <ZAxis type="number" dataKey="qualifiedCount" range={[60, 360]} domain={[0, maxQualified]} />
          <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} content={<TooltipContent />} />

          {typeof xRef === 'number' && (
            <ReferenceLine x={xRef} stroke="#94a3b8" strokeDasharray="4 4" />
          )}
          {typeof yRef === 'number' && (
            <ReferenceLine y={yRef} stroke="#94a3b8" strokeDasharray="4 4" />
          )}

          <Scatter data={points} fill="#2563eb">
            {points.map((p) => (
              <Cell key={p.name} fill={p.color ?? '#2563eb'} fillOpacity={0.9} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

