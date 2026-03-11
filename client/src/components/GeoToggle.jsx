const OPTIONS = [
  { label: 'All', value: 'All' },
  { label: 'US', value: 'US' },
  { label: 'India', value: 'India' },
  { label: 'SEA', value: 'SEA' },
  { label: 'Europe', value: 'Europe' },
  { label: 'MENA', value: 'MENA' },
  { label: 'Other', value: 'Other' },
];

export default function GeoToggle({ value, onChange }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 p-1 shadow-sm">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
            value === opt.value
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-blue-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
