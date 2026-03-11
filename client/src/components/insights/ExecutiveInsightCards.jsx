import { INSIGHT_TONE_STYLES } from '../../utils/insights.js';

export default function ExecutiveInsightCards({ items }) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-700">
          Executive Summary
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          The Executive Summary surfaces the most important signals about the current quarter by synthesizing key pipeline metrics such as deal activity, qualification depth, demand creation, and wins.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {items.map((item) => {
          const tone = INSIGHT_TONE_STYLES[item.tone];

          return (
            <div
              key={item.title}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${tone.border}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-lg font-semibold tracking-tight text-slate-900">{item.title}</h4>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                  {item.tone}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
              <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${tone.background} ${tone.accent}`}>
                {item.metric}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
