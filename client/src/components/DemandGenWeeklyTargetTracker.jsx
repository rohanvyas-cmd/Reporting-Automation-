import { useMemo, Fragment } from 'react';
import { DEMAND_GEN_TARGETS } from '../config/demandGenTargets.js';

const SOURCE_ROWS = [
  { key: 'Inbound', label: 'Inbound' },
  { key: 'Outbound', label: 'Outbound (SDR + ABM)' },
  { key: 'Events', label: 'Events' },
  { key: 'Sales', label: 'Sales' },
];
const INCLUDED_SOURCE_KEYS = new Set(SOURCE_ROWS.map((source) => source.key));

const STAGE_COLUMNS = [
  { key: 'SQL', label: 'SQL', accent: 'text-orange-700', progress: 'bg-orange-500' },
  { key: 'SAL', label: 'SAL', accent: 'text-violet-700', progress: 'bg-violet-500' },
  { key: 'MQL', label: 'MQL', accent: 'text-emerald-700', progress: 'bg-emerald-500' },
];

const STATUS_STYLES = {
  Green: {
    container: 'border-emerald-200 bg-emerald-50/90',
    badge: 'bg-emerald-100 text-emerald-800',
    progress: 'bg-emerald-500',
  },
  Amber: {
    container: 'border-amber-200 bg-amber-50/90',
    badge: 'bg-amber-100 text-amber-800',
    progress: 'bg-amber-500',
  },
  Red: {
    container: 'border-rose-200 bg-rose-50/90',
    badge: 'bg-rose-100 text-rose-800',
    progress: 'bg-rose-500',
  },
};
const STATUS_CELL_BG = {
  Green: 'bg-emerald-50/80',
  Amber: 'bg-amber-50/80',
  Red: 'bg-rose-50/80',
};

const MOMENTUM_MAP = {
  Up: { icon: '▲', className: 'text-emerald-700' },
  Flat: { icon: '■', className: 'text-slate-500' },
  Down: { icon: '▼', className: 'text-rose-600' },
};

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const STAGE_ID_MAP = {
  MQL: '244798989',
  SAL: '1047744293',
  SQL: '244798990',
};

function getWeeksRemaining(quarterEnd, now = new Date()) {
  if (now >= quarterEnd) return 0;
  return Math.max(0, Math.ceil((quarterEnd.getTime() - now.getTime()) / MS_PER_WEEK));
}

function getTargetSet(geo) {
  return DEMAND_GEN_TARGETS[geo] ?? null;
}

function formatPct(value) {
  return `${Math.round(value * 100)}%`;
}

function formatSigned(value) {
  return `${value >= 0 ? '+' : ''}${value}`;
}

function formatTimestamp(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatAsOfDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getStatus(projectedFinish, goal) {
  if (projectedFinish >= goal) return 'Green';
  if (projectedFinish >= goal * 0.8) return 'Amber';
  return 'Red';
}

function getMomentum(delta) {
  if (delta > 0) return 'Up';
  if (delta < 0) return 'Down';
  return 'Flat';
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStageEnteredAt(deal, stageId) {
  const stageHistory = deal.stageHistory ?? {};
  const entry = stageHistory?.[stageId]?.entered ?? null;
  if (entry) {
    const enteredAt = new Date(entry);
    if (!Number.isNaN(enteredAt.getTime())) return enteredAt;
  }

  if (stageId === STAGE_ID_MAP.MQL && deal.createdate) {
    const created = new Date(deal.createdate);
    if (!Number.isNaN(created.getTime())) return created;
  }

  return null;
}

function buildNormalizedCells({ deals, targets, asOfEnd, priorAsOfEnd, quarterStart }) {
  const weekStart = startOfDay(priorAsOfEnd);

  return SOURCE_ROWS.flatMap((source) =>
    STAGE_COLUMNS.map((stage) => {
      const goal = targets?.[source.key]?.[stage.key] ?? 0;
      const stageId = STAGE_ID_MAP[stage.key];
      const sourceDeals = deals.filter((deal) => deal.acquisitionChannel === source.key);
      const stageEntries = sourceDeals
        .map((deal) => ({ deal, enteredAt: getStageEnteredAt(deal, stageId) }))
        .filter(({ enteredAt }) => enteredAt && enteredAt >= quarterStart && enteredAt <= asOfEnd);
      const weeklyEntries = stageEntries.filter(({ enteredAt }) => enteredAt >= weekStart);
      const current = stageEntries.length;
      const weeklyDelta = weeklyEntries.length;

      return {
        source: source.label,
        sourceKey: source.key,
        stage: stage.key,
        goal,
        current,
        weekly_delta: weeklyDelta,
        matchedDeals: stageEntries.map(({ deal }) => deal),
      };
    })
  );
}

function deriveCellMetrics(cell, weeksRemaining) {
  const percentToGoal = cell.goal > 0 ? cell.current / cell.goal : 0;
  const projectedFinish = cell.current + cell.weekly_delta * weeksRemaining;
  const projectedPct = cell.goal > 0 ? projectedFinish / cell.goal : 0;
  const priorWeekValue = cell.current - cell.weekly_delta;
  const weeklyDeltaPct = cell.weekly_delta / Math.max(priorWeekValue, 1);
  const lastUpdatedAt = (cell.matchedDeals ?? []).reduce((latest, deal) => {
    const timestamp = deal.hs_lastmodifieddate ? new Date(deal.hs_lastmodifieddate).getTime() : 0;
    return timestamp > latest ? timestamp : latest;
  }, 0);
  const { matchedDeals, ...rest } = cell;

  return {
    ...rest,
    projected_finish: projectedFinish,
    projected_pct: projectedPct,
    percent_to_goal: percentToGoal,
    prior_week_value: priorWeekValue,
    weekly_delta_pct: weeklyDeltaPct,
    status: getStatus(projectedFinish, cell.goal),
    momentum: getMomentum(cell.weekly_delta),
    last_updated_at: lastUpdatedAt ? new Date(lastUpdatedAt).toISOString() : null,
  };
}

function buildStageTotals(cells) {
  return STAGE_COLUMNS.map((stage) => {
    const stageCells = cells.filter((cell) => cell.stage === stage.key);
    const current = stageCells.reduce((sum, cell) => sum + cell.current, 0);
    const goal = stageCells.reduce((sum, cell) => sum + cell.goal, 0);
    const weeklyDelta = stageCells.reduce((sum, cell) => sum + cell.weekly_delta, 0);
    return {
      key: stage.key,
      label: stage.label,
      current,
      goal,
      weekly_delta: weeklyDelta,
      percent_to_goal: goal > 0 ? current / goal : 0,
    };
  });
}

function buildSourceSummaries(cells) {
  return SOURCE_ROWS.map((source) => {
    const sourceCells = cells.filter((cell) => cell.sourceKey === source.key);
    return {
      ...source,
      totalCurrent: sourceCells.reduce((sum, cell) => sum + cell.current, 0),
      totalGoal: sourceCells.reduce((sum, cell) => sum + cell.goal, 0),
      totalDelta: sourceCells.reduce((sum, cell) => sum + cell.weekly_delta, 0),
      cells: STAGE_COLUMNS.map((stage) =>
        sourceCells.find((cell) => cell.stage === stage.key)
      ),
    };
  });
}

function buildValidationObject(cells) {
  const rows = SOURCE_ROWS.map((source) => {
    const sourceCells = cells.filter((cell) => cell.sourceKey === source.key);
    const stages = STAGE_COLUMNS.reduce((acc, stage) => {
      const cell = sourceCells.find((entry) => entry.stage === stage.key);
      acc[stage.key] = {
        goal: cell?.goal ?? 0,
        current: cell?.current ?? 0,
        weekly_delta: cell?.weekly_delta ?? 0,
      };
      return acc;
    }, {});

    return { source: source.label, sourceKey: source.key, stages };
  });

  const totalsByStage = STAGE_COLUMNS.reduce((acc, stage) => {
    const stageCells = cells.filter((cell) => cell.stage === stage.key);
    acc[stage.key] = {
      goal: stageCells.reduce((sum, cell) => sum + cell.goal, 0),
      current: stageCells.reduce((sum, cell) => sum + cell.current, 0),
      weekly_delta: stageCells.reduce((sum, cell) => sum + cell.weekly_delta, 0),
    };
    return acc;
  }, {});

  const activeByStage = { ...totalsByStage };

  return {
    rows,
    totalsByStage,
    activeByStage,
  };
}

function buildTrackerData({ deals, geo, quarterStart, quarterEnd, fetchedAt, asOfOverride, priorAsOfOverride }) {
  const today = new Date();
  const asOfEnd = endOfDay(asOfOverride ?? today);
  const priorAsOfEnd = endOfDay(priorAsOfOverride ?? new Date(asOfEnd.getTime() - MS_PER_WEEK));
  const weeksRemaining = getWeeksRemaining(quarterEnd, today);
  const targets = getTargetSet(geo);

  const normalizedCells = buildNormalizedCells({ deals, targets, asOfEnd, priorAsOfEnd, quarterStart });
  const derivedCells = normalizedCells.map((cell) => deriveCellMetrics(cell, weeksRemaining));
  const rows = buildSourceSummaries(derivedCells);
  const stageTotals = buildStageTotals(derivedCells);
  const totalWeeklyChange = derivedCells.reduce((sum, cell) => sum + cell.weekly_delta, 0);
  const greenCount = derivedCells.filter((cell) => cell.status === 'Green').length;
  const amberCount = derivedCells.filter((cell) => cell.status === 'Amber').length;
  const redCount = derivedCells.filter((cell) => cell.status === 'Red').length;
  const lastUpdatedAt =
    derivedCells.reduce((latest, cell) => {
      const value = cell.last_updated_at ? new Date(cell.last_updated_at).getTime() : 0;
      return value > latest ? value : latest;
    }, 0) || (fetchedAt instanceof Date ? fetchedAt.getTime() : fetchedAt ? new Date(fetchedAt).getTime() : 0);

  return {
    asOfDate: asOfEnd,
    rows,
    stageTotals,
    totalWeeklyChange,
    greenCount,
    amberCount,
    redCount,
    lastUpdatedAt,
    validation: buildValidationObject(derivedCells),
  };
}

function SummaryStatCard({ label, value, subtitle, accent = 'text-slate-900' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function TrackerTooltip({ cell }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 hidden w-72 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-2xl group-hover:block">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold text-slate-900">
          {cell.source} · {cell.stage}
        </p>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${STATUS_STYLES[cell.status].badge}`}>
          {cell.status}
        </span>
      </div>
      <div className="space-y-1.5">
        <p>Goal: <span className="font-medium text-slate-900">{cell.goal}</span></p>
        <p>Current value: <span className="font-medium text-slate-900">{cell.current}</span></p>
        <p>Prior week value: <span className="font-medium text-slate-900">{cell.prior_week_value}</span></p>
        <p>Weekly delta: <span className="font-medium text-slate-900">{formatSigned(cell.weekly_delta)}</span></p>
        <p>Weekly delta %: <span className="font-medium text-slate-900">{formatPct(cell.weekly_delta_pct)}</span></p>
        <p>Progress %: <span className="font-medium text-slate-900">{formatPct(cell.percent_to_goal)}</span></p>
        <p>Projected final: <span className="font-medium text-slate-900">{cell.projected_finish}</span></p>
        <p>Projected %: <span className="font-medium text-slate-900">{formatPct(cell.projected_pct)}</span></p>
        <p>Momentum: <span className="font-medium text-slate-900">{cell.momentum}</span></p>
        <p>Last updated: <span className="font-medium text-slate-900">{formatTimestamp(cell.last_updated_at)}</span></p>
      </div>
    </div>
  );
}

function TrackerCell({ cell }) {
  const statusStyle = STATUS_STYLES[cell.status];
  const momentum = MOMENTUM_MAP[cell.momentum];
  const progressWidth = `${Math.min(cell.percent_to_goal * 100, 100)}%`;

  return (
    <div className={`group relative rounded-2xl border p-4 shadow-sm ${statusStyle.container}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{cell.stage}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {cell.current}
            <span className="ml-1 text-base font-semibold text-slate-400">/ {cell.goal}</span>
          </p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyle.badge}`}>
          {cell.status}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className={`font-semibold ${momentum.className}`}>
          {momentum.icon} {formatSigned(cell.weekly_delta)} vs last week
        </span>
        <span className="text-slate-500">{formatPct(cell.percent_to_goal)} to goal</span>
      </div>

      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-slate-600">Projected finish</span>
        <span className="font-semibold text-slate-900">
          {cell.projected_finish} · {formatPct(cell.projected_pct)}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80">
        <div className={`h-full rounded-full ${statusStyle.progress}`} style={{ width: progressWidth }} />
      </div>

      <TrackerTooltip cell={cell} />
    </div>
  );
}

export default function DemandGenWeeklyTargetTracker({
  deals,
  geo,
  quarterLabel,
  quarterStart,
  quarterEnd,
  fetchedAt,
  title,
  subtitle,
  compact = false,
  asOfOverride,
  priorAsOfOverride,
}) {
  const hasTracker = Boolean(DEMAND_GEN_TARGETS[geo]);
  const tracker = useMemo(
    () =>
      hasTracker
        ? buildTrackerData({ deals, geo, quarterStart, quarterEnd, fetchedAt, asOfOverride, priorAsOfOverride })
        : null,
    [deals, geo, hasTracker, quarterStart, quarterEnd, fetchedAt, asOfOverride, priorAsOfOverride]
  );
  if (import.meta.env.DEV && tracker) {
    window.__DEMAND_GEN_VALIDATION__ = tracker.validation;
  }

  if (!hasTracker) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Demand Gen Tracker
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
          No tracker configured for {geo}
        </h3>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {title ?? 'Demand Gen Tracker'}
          </p>
          {!compact && (
            <>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Goals, current volume, and weekly deltas by source
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Current-quarter pacing for {quarterLabel}. “Current” counts deals that entered the stage this quarter, even if they moved ahead. “Δ Week” counts stage entries in the selected week.
              </p>
            </>
          )}
          {compact && subtitle ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">As of</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatAsOfDate(tracker.asOfDate)}</p>
          <p className="mt-2 text-[11px] text-slate-500">Updated {formatTimestamp(tracker.lastUpdatedAt)}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-[980px] w-full border-separate border-spacing-0">
          <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-slate-500">Lead Source</th>
              {STAGE_COLUMNS.map((stage) => (
                <th key={stage.key} colSpan={3} className="px-4 py-3 text-slate-500">
                  {stage.label}
                </th>
              ))}
            </tr>
            <tr className="border-t border-slate-200 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-2 text-slate-400"> </th>
              {STAGE_COLUMNS.map((stage) => (
                <Fragment key={`${stage.key}-sub`}>
                  <th className="px-4 py-2 text-slate-400">Goal</th>
                  <th className="px-4 py-2 text-slate-400">Current</th>
                  <th className="px-4 py-2 text-slate-400">Δ Week</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
            {tracker.rows.map((row) => (
              <tr key={row.key} className="bg-white">
                <td className="sticky left-0 z-10 bg-white px-4 py-3 font-semibold text-slate-900">
                  {row.label}
                </td>
                {row.cells.map((cell) => (
                  <Fragment key={`${row.key}-${cell.stage}`}>
                    <td className="px-4 py-3 text-slate-600">{cell.goal}</td>
                    <td className={`px-4 py-3 font-semibold text-slate-900 ${STATUS_CELL_BG[cell.status] ?? ''}`}>
                      {cell.current}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${cell.weekly_delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatSigned(cell.weekly_delta)}
                    </td>
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
