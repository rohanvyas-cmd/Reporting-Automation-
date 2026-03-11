export default function RecommendedActionsSection({ items }) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Recommended Actions
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Clear next steps driven directly by the observed quarter signals.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-lg font-semibold tracking-tight text-slate-900">{item.title}</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Trigger
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{item.driver}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
