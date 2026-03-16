import { useMemo } from 'react';
import DemandGenWeeklyTargetTracker from '../components/DemandGenWeeklyTargetTracker.jsx';
import { getQuarterLabel, getQuarterRange } from '../utils/weekUtils.js';

export default function DemandGenTracker({ deals, fetchedAt }) {
  const { start: qStart, end: qEnd } = useMemo(() => getQuarterRange(), []);
  const quarterLabel = useMemo(() => getQuarterLabel(), []);
  const demandGenDealsByGeo = useMemo(
    () => ({
      US: deals.filter((deal) => deal.geography === 'US'),
      India: deals.filter((deal) => deal.geography === 'India'),
    }),
    [deals]
  );
  const demandGenAsOf = useMemo(() => new Date('2026-03-09T12:00:00'), []);
  const demandGenPriorAsOf = useMemo(() => new Date('2026-03-02T12:00:00'), []);

  return (
    <div className="space-y-8 pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Demand Gen Tracker</h2>
          <p className="mt-1 text-sm text-gray-500">
            Weekly pacing vs goals for US and India. Current = stage entries in-quarter; Δ Week = entries in the selected week.
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Demand Gen Tracker
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Week-over-week pacing for US and India
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Shows goals vs current counts for SQL, SAL, and MQL. Current counts stage entries this quarter; Δ Week counts entries during the selected week.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <DemandGenWeeklyTargetTracker
            deals={demandGenDealsByGeo.US}
            geo="US"
            quarterLabel={quarterLabel}
            quarterStart={qStart}
            quarterEnd={qEnd}
            fetchedAt={fetchedAt}
            title="US"
            subtitle={`Verification window: Mar 2–9, 2026 (${quarterLabel}). Current = stage entries since quarter start; Δ Week = entries in that week.`}
            compact
            asOfOverride={demandGenAsOf}
            priorAsOfOverride={demandGenPriorAsOf}
          />
          <DemandGenWeeklyTargetTracker
            deals={demandGenDealsByGeo.India}
            geo="India"
            quarterLabel={quarterLabel}
            quarterStart={qStart}
            quarterEnd={qEnd}
            fetchedAt={fetchedAt}
            title="India"
            subtitle={`Verification window: Mar 2–9, 2026 (${quarterLabel}). Current = stage entries since quarter start; Δ Week = entries in that week.`}
            compact
            asOfOverride={demandGenAsOf}
            priorAsOfOverride={demandGenPriorAsOf}
          />
        </div>
      </section>
    </div>
  );
}
