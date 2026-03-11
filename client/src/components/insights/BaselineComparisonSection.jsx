import { INSIGHT_TONE_STYLES } from '../../utils/insights.js';

function deltaLabel(item) {
  const prefix = item.delta > 0 ? '+' : '';
  return item.isPercentDelta ? `${prefix}${item.delta}%` : `${prefix}${item.delta} pts`;
}

export default function BaselineComparisonSection({ items }) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Quarter Vs Baseline
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          The few comparisons leadership should read immediately, without opening the full summary page.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const tone = INSIGHT_TONE_STYLES[item.tone];

          return (
            <div
              key={item.label}
              className={`grid grid-cols-1 gap-3 rounded-xl border px-4 py-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.6fr] ${tone.border} ${tone.background}`}
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">Current quarter vs all-time baseline</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quarter</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{item.quarter}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Baseline</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{item.baseline}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Delta</p>
                <p className={`mt-1 text-lg font-semibold ${tone.accent}`}>{deltaLabel(item)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
