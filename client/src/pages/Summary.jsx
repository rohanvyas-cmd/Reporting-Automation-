import { useMemo, useState } from 'react';
import GeoToggle from '../components/GeoToggle.jsx';
import { buildChannelSummary, buildDashboardMetrics, CHANNEL_COLORS } from '../utils/dashboardMetrics.js';
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
    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold leading-none text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{context}</p>
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
  const [activeTab, setActiveTab] = useState('funnel'); // 'funnel' | 'channels'
  const [channelMode, setChannelMode] = useState('quarter'); // 'quarter' | 'all'
  const [kpiMode, setKpiMode] = useState('all'); // 'quarter' | 'all'
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
  const channelSummary = useMemo(() => {
    const dataset = channelMode === 'quarter' ? quarterDeals : filtered;
    return buildChannelSummary(dataset).filter((c) => c.total > 0);
  }, [channelMode, quarterDeals, filtered]);
  const channelMax = useMemo(() => Math.max(1, ...channelSummary.map((c) => c.total)), [channelSummary]);
  const kpi = useMemo(() => {
    if (kpiMode === 'quarter') {
      return {
        label: quarterLabel,
        summary: quarterSummary,
        metrics: quarterMetrics,
      };
    }
    return {
      label: 'All Time',
      summary: allTimeSummary,
      metrics: allTimeMetrics,
    };
  }, [kpiMode, quarterLabel, quarterSummary, quarterMetrics, allTimeSummary, allTimeMetrics]);

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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Executive Snapshot
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Key KPIs for <span className="font-semibold text-slate-700">{geo}</span>.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setKpiMode('all')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                kpiMode === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setKpiMode('quarter')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                kpiMode === 'quarter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {quarterLabel}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ExecutiveStatCard
            label="Deals Created"
            value={kpi.summary.total}
            context={kpi.label}
          />
          <ExecutiveStatCard
            label="Active Deals"
            value={kpi.metrics.active}
            context={`${kpi.metrics.active} / ${kpi.summary.total} active (${kpi.metrics.activeRate}%) • ${kpi.label}`}
          />
          <ExecutiveStatCard
            label="Win Rate"
            value={`${kpi.metrics.winRate}%`}
            context={`${kpi.summary['Deal Won']} / ${kpi.summary.total} won • ${kpi.label}`}
          />
        </div>

      </div>

      <div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Insights
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Funnel view and channel performance for the selected geography.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-xl border border-blue-100 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('funnel')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                activeTab === 'funnel' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Funnel View
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                activeTab === 'channels' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Channel Split
            </button>
          </div>
        </div>

        {activeTab === 'funnel' ? (
          <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-2">
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
        ) : (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Channel Split</p>
                <p className="mt-1 text-sm text-slate-500">
                  Compare which acquisition channels perform best for <span className="font-semibold text-slate-700">{geo}</span>.
                </p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setChannelMode('all')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    channelMode === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setChannelMode('quarter')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    channelMode === 'quarter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {quarterLabel}
                </button>
              </div>
            </div>

            {channelSummary.length === 0 ? (
              <div className="mt-10 rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
                No channel data found for this selection.
              </div>
            ) : (
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="hidden md:grid md:grid-cols-[140px_1fr_260px] md:gap-3 md:border-b md:border-slate-200 md:bg-slate-50 md:px-3 md:py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Channel</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Volume</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 text-right">Rates</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {channelSummary
                    .slice()
                    .sort((a, b) => b.total - a.total)
                    .map((row) => {
                      const barPct = Math.round((row.total / channelMax) * 100);
                      const channelColor = CHANNEL_COLORS[row.channel] ?? CHANNEL_COLORS.Unknown ?? '#94a3b8';
                      return (
                        <div key={row.channel} className="px-3 py-2 hover:bg-slate-50/60">
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-[140px_1fr_260px] md:items-center md:gap-3">
                            <div className="flex items-center justify-between md:block">
                              <p className="text-sm font-semibold text-slate-900">{row.channel}</p>
                              <p className="text-sm font-semibold text-slate-900 md:hidden">{row.total}</p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="h-2 w-full rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full"
                                  style={{ width: `${barPct}%`, backgroundColor: channelColor }}
                                />
                              </div>
                              <p className="hidden w-10 text-right text-sm font-semibold text-slate-900 md:block">{row.total}</p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-600 md:justify-end">
                              <span>
                                <span className="font-semibold text-slate-900">{row.winRate}%</span> Win
                              </span>
                              <span className="text-slate-300 hidden md:inline">•</span>
                              <span>
                                <span className="font-semibold text-slate-900">{row.qualifiedRate}%</span> Qualified
                              </span>
                              <span className="text-slate-300 hidden md:inline">•</span>
                              <span>
                                <span className="font-semibold text-slate-900">{row.activeRate}%</span> Active
                              </span>
                            </div>
                          </div>

                          <div className="mt-1 text-[11px] text-slate-500">
                            {row.won} won <span className="text-slate-300">•</span> {row.active} active{' '}
                            <span className="text-slate-300">•</span> {row.inactive} inactive
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
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
