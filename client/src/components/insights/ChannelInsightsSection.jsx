import { INSIGHT_TONE_STYLES } from '../../utils/insights.js';

export default function ChannelInsightsSection({ items }) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Channel Insights
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Ranked channel readout focused on quality, not just volume.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {items.map((item, index) => {
          const tone = INSIGHT_TONE_STYLES[item.tone];

          return (
            <div
              key={item.channel}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${tone.border}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Rank #{index + 1}
                  </p>
                  <h4 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                    {item.channel}
                  </h4>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                  {item.tone}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: 'Created', value: item.total },
                  { label: 'Active rate', value: `${item.activeRate}%` },
                  { label: 'Qualified rate', value: `${item.qualifiedRate}%` },
                  { label: 'Win rate', value: `${item.winRate}%` },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{metric.value}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">{item.sentence}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
