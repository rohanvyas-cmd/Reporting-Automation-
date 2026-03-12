import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

function TooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{row.name ?? label}</p>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
        <span>Volume</span>
        <span className="text-right font-semibold text-slate-900">{formatNumber(row.volume)}</span>
        <span>Win rate</span>
        <span className="text-right font-semibold text-slate-900">{formatPercent(row.winRate)}</span>
        <span>Qualified</span>
        <span className="text-right font-semibold text-slate-900">
          {formatNumber(row.qualifiedCount)} ({formatPercent(row.qualifiedRate)})
        </span>
        <span>Active</span>
        <span className="text-right font-semibold text-slate-900">
          {formatNumber(row.activeCount)} ({formatPercent(row.activeRate)})
        </span>
      </div>
    </div>
  );
}

function shortLabel(value, max = 14) {
  if (!value) return '—';
  const str = String(value);
  if (str.length <= max) return str;
  return `${str.slice(0, max - 1)}…`;
}

export default function VolumeWinChart({
  rows,
  height = 360,
}) {
  const maxVolume = Math.max(1, ...rows.map((r) => r.volume ?? 0));

  return (
    <div className="h-[360px] w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 26, right: 20, bottom: 30, left: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={48}
            tickFormatter={(v) => shortLabel(v, 16)}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
            domain={[0, Math.ceil(maxVolume * 1.15)]}
          />
          <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} content={<TooltipContent />} />

          <Bar yAxisId="left" dataKey="volume" radius={[8, 8, 0, 0]} maxBarSize={56}>
            {rows.map((r) => (
              <Cell key={r.name} fill={r.color ?? '#2563eb'} fillOpacity={0.9} />
            ))}
            <LabelList
              dataKey="winRate"
              position="top"
              offset={10}
              fill="#0f172a"
              fontSize={12}
              fontWeight={700}
              formatter={(v) => `${v}%`}
            />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
