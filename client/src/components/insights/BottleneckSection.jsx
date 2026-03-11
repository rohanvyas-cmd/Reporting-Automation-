import { INSIGHT_TONE_STYLES } from '../../utils/insights.js';

const TONE_LABELS = {
  positive: 'Better than normal',
  warning: 'Slightly behind',
  critical: 'Needs attention',
  neutral: 'In line',
};

export default function BottleneckSection({ items }) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Bottlenecks And Leakage
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Simple read on where this quarter is slowing down and how that compares with the usual pattern.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {items.map((item) => {
          const tone = INSIGHT_TONE_STYLES[item.tone];

          return (
            <div
              key={item.title}
              className={`rounded-2xl border p-5 shadow-sm ${tone.border} ${tone.background}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.title}
                  </p>
                  <h4 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{item.label}</h4>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                  {TONE_LABELS[item.tone]}
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3">
                <p className={`text-sm font-semibold ${tone.accent}`}>{item.current}</p>
                <p className="mt-1 text-xs text-slate-500">{item.baseline}</p>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
