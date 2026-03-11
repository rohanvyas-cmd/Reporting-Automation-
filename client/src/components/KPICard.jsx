export default function KPICard({ label, value, color = 'blue', delta, subtitle, note }) {
  const colorMap = {
    blue: { border: 'border-blue-200', accent: 'text-blue-700' },
    green: { border: 'border-emerald-200', accent: 'text-emerald-700' },
    purple: { border: 'border-violet-200', accent: 'text-violet-700' },
    orange: { border: 'border-orange-200', accent: 'text-orange-700' },
    red: { border: 'border-rose-200', accent: 'text-rose-700' },
    slate: { border: 'border-slate-200', accent: 'text-slate-700' },
    teal: { border: 'border-teal-200', accent: 'text-teal-700' },
  };

  const deltaPositive = delta != null && delta >= 0;
  const deltaColor = delta == null ? '' : deltaPositive ? 'text-green-600' : 'text-red-500';
  const tone = colorMap[color] ?? colorMap.blue;

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${tone.border}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${tone.accent}`}>{label}</p>
      <p className="mt-3 text-4xl font-bold leading-none text-slate-900">{value ?? '—'}</p>
      {delta != null && (
        <p className={`mt-2 text-sm font-semibold ${deltaColor}`}>
          {deltaPositive ? '▲' : '▼'} {delta >= 0 ? '+' : ''}{delta} WoW
        </p>
      )}
      {subtitle && (
        <p className="mt-3 text-sm font-medium text-slate-500">{subtitle}</p>
      )}
      {note && (
        <p className="mt-2 text-xs leading-5 text-slate-400">{note}</p>
      )}
    </div>
  );
}
