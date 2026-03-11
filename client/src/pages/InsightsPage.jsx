import { useMemo } from 'react';
import GeoToggle from '../components/GeoToggle.jsx';
import ExecutiveInsightCards from '../components/insights/ExecutiveInsightCards.jsx';
import BaselineComparisonSection from '../components/insights/BaselineComparisonSection.jsx';
import ChannelInsightsSection from '../components/insights/ChannelInsightsSection.jsx';
import BottleneckSection from '../components/insights/BottleneckSection.jsx';
import { buildDashboardMetrics } from '../utils/dashboardMetrics.js';
import { buildInsightsModel } from '../utils/insights.js';

function EmptyInsightState({ geo }) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-200 bg-white py-20 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Insights</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-800">
        Not enough current-quarter data for {geo}
      </h3>
      <p className="mt-3 text-sm text-slate-500">
        Once more deals are created for this geography, this page will surface interpretation, risks, and recommended actions.
      </p>
    </div>
  );
}

export default function InsightsPage({ deals, geo, onGeoChange }) {
  const metrics = useMemo(() => buildDashboardMetrics(deals, geo), [deals, geo]);
  const insights = useMemo(() => buildInsightsModel(metrics), [metrics]);

  return (
    <div className="space-y-8 pb-6">
      <div className="flex justify-end">
        <GeoToggle value={geo} onChange={onGeoChange} />
      </div>

      {metrics.quarterSummary.total === 0 ? (
        <EmptyInsightState geo={geo} />
      ) : (
        <>
          <ExecutiveInsightCards items={insights.executiveCards} />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <BaselineComparisonSection items={insights.baselineComparisons} />
            <BottleneckSection items={insights.bottlenecks} />
          </div>

          <ChannelInsightsSection items={insights.channelInsights} />
        </>
      )}
    </div>
  );
}
