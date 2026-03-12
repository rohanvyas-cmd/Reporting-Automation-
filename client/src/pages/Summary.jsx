import { useMemo } from 'react';
import KPICard from '../components/KPICard.jsx';
import GeoToggle from '../components/GeoToggle.jsx';
import { buildDashboardMetrics, percent } from '../utils/dashboardMetrics.js';
import DemandGenWeeklyTargetTracker from '../components/DemandGenWeeklyTargetTracker.jsx';
const PHASE_ROWS = [
  { key: 'Created', label: 'Deals Created', color: '#2563eb' },
  { key: 'MQL_PLUS', label: 'Initial Interest / MQL++', color: '#16a34a' },
  { key: 'SAL_PLUS', label: 'SAL++', color: '#9333ea' },
  { key: 'SQL_PLUS', label: 'SQL++', color: '#ea580c' },
  { key: 'Won', label: 'Won', color: '#0f766e' },
  { key: 'Lost', label: 'Lost', color: '#64748b' },
];
const DETAILED_STAGE_MAP = {
  '244798989': 'Initial Interest',
  '1047744293': 'SAL',
  '244798990': 'SQL',
  '249283938': 'Solutioning',
  '244798994': 'Proposal',
  '244798992': 'Contract',
  '1111696779': 'Semi-Dormant',
  '249323383': 'Dormant',
  '1099643979': 'Revisit',
  '244798995': 'Deal Won',
  '244798996': 'Deal Lost',
  '1047744292': 'Reject',
};

function buildDetailedStageCounts(deals) {
  const counts = {
    'Initial Interest': 0,
    SAL: 0,
    SQL: 0,
    Solutioning: 0,
    Proposal: 0,
    Contract: 0,
    'Semi-Dormant': 0,
    Dormant: 0,
    Revisit: 0,
    Reject: 0,
    'Deal Lost': 0,
    'Deal Won': 0,
  };

  for (const deal of deals) {
    const stageId = deal.dealstage;
    const mapped = stageId ? DETAILED_STAGE_MAP[stageId] : null;
    if (mapped && counts[mapped] != null) {
      counts[mapped] += 1;
      continue;
    }

    if (deal.category === 'MQL') counts['Initial Interest'] += 1;
    else if (deal.category === 'SAL') counts.SAL += 1;
    else if (deal.category === 'CLOSED_WON') counts['Deal Won'] += 1;
    else if (deal.category === 'CLOSED_LOST') counts['Deal Lost'] += 1;
  }

  return counts;
}

function buildPhaseSummary(total, counts) {
  // HubSpot-style cumulative funnel:
  // MQL++ = Initial Interest + SAL + SQL + Solutioning + Proposal + Contract
  // SAL++ = SAL + SQL + Solutioning + Proposal + Contract
  // SQL++ = SQL + Solutioning + Proposal + Contract
  //
  // Important: compute these directly from known stage counts (not as total - excluded),
  // so deals from other pipelines/unmapped stages don't inflate the funnel.
  const won = counts['Deal Won'];
  const lost = counts['Deal Lost'] + counts.Reject + counts.Dormant + counts['Semi-Dormant'] + counts.Revisit;
  const mqlPlus =
    counts['Initial Interest'] +
    counts.SAL +
    counts.SQL +
    counts.Solutioning +
    counts.Proposal +
    counts.Contract;
  const salPlus = mqlPlus - counts['Initial Interest'];
  const sqlPlus = salPlus - counts.SAL;
  return {
    Created: total,
    MQL_PLUS: mqlPlus,
    SAL_PLUS: salPlus,
    SQL_PLUS: sqlPlus,
    Won: won,
    Lost: lost,
  };
}

function buildPhaseDetails(counts) {
  return {
    Created: [{ label: 'Total created', value: null }],
    MQL_PLUS: [
      { label: 'Initial Interest', value: counts['Initial Interest'] },
      { label: 'SAL', value: counts.SAL },
      { label: 'SQL', value: counts.SQL },
      { label: 'Solutioning', value: counts.Solutioning },
      { label: 'Proposal', value: counts.Proposal },
      { label: 'Contract', value: counts.Contract },
    ],
    SAL_PLUS: [
      { label: 'SAL', value: counts.SAL },
      { label: 'SQL', value: counts.SQL },
      { label: 'Solutioning', value: counts.Solutioning },
      { label: 'Proposal', value: counts.Proposal },
      { label: 'Contract', value: counts.Contract },
    ],
    SQL_PLUS: [
      { label: 'SQL', value: counts.SQL },
      { label: 'Solutioning', value: counts.Solutioning },
      { label: 'Proposal', value: counts.Proposal },
      { label: 'Contract', value: counts.Contract },
    ],
    Won: [{ label: 'Deal Won', value: counts['Deal Won'] }],
    Lost: [
      { label: 'Deal Lost', value: counts['Deal Lost'] },
      { label: 'Dormant', value: counts.Dormant },
      { label: 'Semi-Dormant', value: counts['Semi-Dormant'] },
      { label: 'Revisit', value: counts.Revisit },
      { label: 'Reject', value: counts.Reject },
    ],
  };
}

function StageDistributionCard({ title, subtitle, total, counts, scaleMax }) {
  const phaseSummary = buildPhaseSummary(total, counts);
  const phaseDetails = buildPhaseDetails(counts);
  const stageValues = PHASE_ROWS.map((phase) => ({
    key: phase.key,
    label: phase.label,
    color: phase.color,
    count: phaseSummary[phase.key] ?? 0,
  }));

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="space-y-3">
        {stageValues.map((stage) => {
          const widthPct = scaleMax > 0 ? (stage.count / scaleMax) * 100 : 0;
          const details = phaseDetails[stage.key] ?? [];
          return (
            <div key={stage.key} className="group relative space-y-2">
              <div className="grid grid-cols-[190px_1fr_120px] items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full"
                    style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 text-right">
                  {stage.count}
                </span>
              </div>
              {details.length > 0 && stage.key !== 'Created' && (
                <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg group-hover:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {stage.label} breakdown
                  </p>
                  <div className="mt-2 space-y-1">
                    {details.map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span>{item.label}</span>
                        <span className="font-semibold text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExecutiveStatCard({ label, value, context }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{context}</p>
    </div>
  );
}

function formatCompactAmount(value) {
  if (value == null) return '—';
  const abs = Math.abs(value);
  const format = (num, suffix) => `$${num.toFixed(2).replace(/\.?0+$/, '')}${suffix}`;

  if (abs >= 1_000_000_000) return format(value / 1_000_000_000, 'B');
  if (abs >= 1_000_000) return format(value / 1_000_000, 'M');
  if (abs >= 1_000) return format(value / 1_000, 'K');
  return `$${Math.round(value)}`;
}

export default function Summary({ deals, geo, onGeoChange, fetchedAt }) {
  const showLeadSourceTracker = false;
  const {
    filtered,
    quarterDeals,
    qStart,
    qEnd,
    quarterLabel,
    quarterSummary,
    allTimeSummary,
    quarterMetrics,
    allTimeMetrics,
    topQuarterChannel,
    quarterAmount,
    allTimeAmount,
  } = useMemo(
    () => buildDashboardMetrics(deals, geo),
    [deals, geo]
  );

  const quarterStageCounts = useMemo(() => buildDetailedStageCounts(quarterDeals), [quarterDeals]);
  const allTimeStageCounts = useMemo(() => buildDetailedStageCounts(filtered), [filtered]);
  const stageScaleMax = Math.max(quarterDeals.length, filtered.length);

  return (
    <div className="space-y-8 pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Summary Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            Created-deal flow for {quarterLabel}, compared with the full history of created deals.
          </p>
        </div>
        <GeoToggle value={geo} onChange={onGeoChange} />
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <ExecutiveStatCard
            label="Deals Created"
            value={quarterSummary.total}
            context={quarterLabel}
          />
          <ExecutiveStatCard
            label="Active Rate"
            value={`${quarterMetrics.activeRate}%`}
            context={`${quarterMetrics.active} deals currently active`}
          />
          <ExecutiveStatCard
            label="Win Rate"
            value={`${quarterMetrics.winRate}%`}
            context={`${quarterSummary['Deal Won']} deals closed this quarter`}
          />
        </div>

      </div>

      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Funnel View
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Stage distribution with aligned scales for fast comparison.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <StageDistributionCard
            title={quarterLabel}
            subtitle="Stage distribution of quarter-created deals."
            total={quarterDeals.length}
            counts={quarterStageCounts}
            scaleMax={stageScaleMax}
          />
          <StageDistributionCard
            title="All Time"
            subtitle="Stage distribution across all created deals."
            total={filtered.length}
            counts={allTimeStageCounts}
            scaleMax={stageScaleMax}
          />
        </div>
      </div>

      {showLeadSourceTracker ? (
        <DemandGenWeeklyTargetTracker
          deals={quarterDeals}
          geo={geo}
          quarterLabel={quarterLabel}
          quarterStart={qStart}
          quarterEnd={qEnd}
          fetchedAt={fetchedAt}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Pipeline Context
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Snapshot of pipeline value and acquisition mix for the selected geography.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Quarter Pipeline Value
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCompactAmount(quarterAmount)}</p>
              <p className="mt-1 text-xs text-slate-500">Total value of {quarterLabel} created deals</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                All-time Pipeline Value
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCompactAmount(allTimeAmount)}</p>
              <p className="mt-1 text-xs text-slate-500">Total value of all created deals</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Top Acquisition Channel
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{topQuarterChannel?.channel ?? '—'}</p>
              <p className="mt-1 text-xs text-slate-500">
                {topQuarterChannel ? `${topQuarterChannel.total} deals this quarter` : 'No channel data'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {allTimeSummary.total === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-400">
          No deals found for the selected geography.
        </div>
      )}
    </div>
  );
}
