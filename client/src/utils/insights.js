import { formatAmount } from './dashboardMetrics.js';

export const INSIGHT_TONE_STYLES = {
  positive: {
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    accent: 'text-emerald-700',
    background: 'bg-emerald-50',
  },
  warning: {
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-amber-200',
    accent: 'text-amber-700',
    background: 'bg-amber-50',
  },
  critical: {
    badge: 'bg-rose-100 text-rose-700',
    border: 'border-rose-200',
    accent: 'text-rose-700',
    background: 'bg-rose-50',
  },
  neutral: {
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    accent: 'text-blue-700',
    background: 'bg-blue-50',
  },
};

const PRIMARY_CHANNELS = ['Inbound', 'Outbound', 'Events', 'Sales'];

function signedPoints(value) {
  return `${value > 0 ? '+' : ''}${value} pts`;
}

function signedPercent(value) {
  return `${value > 0 ? '+' : ''}${value}%`;
}

function roundCurrency(value) {
  return formatAmount(value);
}

function getChannelMap(quarterChannels) {
  const map = new Map(quarterChannels.map((channel) => [channel.channel, channel]));

  return PRIMARY_CHANNELS.map((channel) => {
    const existing = map.get(channel);
    return existing ?? {
      channel,
      total: 0,
      active: 0,
      inactive: 0,
      won: 0,
      'SQL++': 0,
      SAL: 0,
      MQL: 0,
      amount: 0,
      activeRate: 0,
      inactiveRate: 0,
      winRate: 0,
      qualifiedRate: 0,
      sqlRate: 0,
      revenuePerDeal: 0,
    };
  });
}

function classifyDelta(delta, { higherIsBetter = true, warning = 5, critical = 10 } = {}) {
  if (higherIsBetter) {
    if (delta >= warning) return 'positive';
    if (delta <= -critical) return 'critical';
    if (delta <= -warning) return 'warning';
    return 'neutral';
  }

  if (delta <= -warning) return 'positive';
  if (delta >= critical) return 'critical';
  if (delta >= warning) return 'warning';
  return 'neutral';
}

function buildExecutiveCards(metrics) {
  const {
    quarterSummary,
    allTimeSummary,
    quarterMetrics,
    allTimeMetrics,
    quarterChannels,
    quarterAmount,
    allTimeAmount,
  } = metrics;

  const cards = [];
  const activeDelta = quarterMetrics.activeRate - allTimeMetrics.activeRate;
  const qualifiedDelta = quarterMetrics.qualifiedRate - allTimeMetrics.qualifiedRate;
  const inactiveDelta = quarterMetrics.inactiveRate - allTimeMetrics.inactiveRate;
  const revenuePerQuarterDeal = quarterSummary.total > 0 ? Math.round(quarterAmount / quarterSummary.total) : 0;
  const revenuePerAllTimeDeal = allTimeSummary.total > 0 ? Math.round(allTimeAmount / allTimeSummary.total) : 0;
  const revenueDelta = revenuePerQuarterDeal - revenuePerAllTimeDeal;

  cards.push({
    title:
      activeDelta >= 5
        ? 'Pipeline quality is ahead of baseline'
        : activeDelta <= -5
          ? 'Pipeline quality is trailing baseline'
          : 'Pipeline quality is broadly in line',
    body:
      quarterSummary.total < 5
        ? 'Current-quarter volume is still light, so this signal is directional rather than conclusive.'
        : `${quarterMetrics.activeRate}% of current-quarter deals are still active versus ${allTimeMetrics.activeRate}% historically.`,
    tone: classifyDelta(activeDelta, { higherIsBetter: true }),
    metric: `${quarterMetrics.activeRate}% active · ${signedPoints(activeDelta)}`,
  });

  cards.push({
    title:
      qualifiedDelta >= 5
        ? 'Qualification depth is improving'
        : qualifiedDelta <= -5
          ? 'Qualification depth is under pressure'
          : 'Qualification depth is stable',
    body:
      quarterSummary.total < 5
        ? 'The current cohort is too small to judge qualification depth confidently.'
        : `${quarterMetrics.qualifiedRate}% of the current-quarter cohort is in SAL or SQL++, against ${allTimeMetrics.qualifiedRate}% all time.`,
    tone: classifyDelta(qualifiedDelta, { higherIsBetter: true }),
    metric: `${quarterMetrics.qualifiedRate}% qualified · ${signedPoints(qualifiedDelta)}`,
  });

  const primaryChannels = getChannelMap(quarterChannels);
  const topVolumeChannel = [...primaryChannels].sort((a, b) => b.total - a.total)[0];
  const bestQualityChannel = [...primaryChannels]
    .filter((channel) => channel.total > 0)
    .sort((a, b) => (b.qualifiedRate - a.qualifiedRate) || (b.winRate - a.winRate))[0];

  if (topVolumeChannel && topVolumeChannel.total > 0) {
    const tone =
      topVolumeChannel.qualifiedRate <= quarterMetrics.qualifiedRate - 10
        ? 'warning'
        : topVolumeChannel.qualifiedRate >= quarterMetrics.qualifiedRate + 5
          ? 'positive'
          : 'neutral';

    cards.push({
      title:
        tone === 'warning'
          ? `${topVolumeChannel.channel} is driving volume but not enough quality`
          : `${topVolumeChannel.channel} is the primary demand engine`,
      body:
        tone === 'warning'
          ? `${topVolumeChannel.channel} contributes the most created deals this quarter, but qualification is below the quarter average.`
          : `${topVolumeChannel.channel} is contributing the most created deals and remains central to the quarter mix.`,
      tone,
      metric: `${topVolumeChannel.total} created · ${topVolumeChannel.qualifiedRate}% qualified`,
    });
  }

  if (quarterSummary.total > 0) {
    const winTone =
      quarterSummary.total >= 10 && quarterMetrics.winRate === 0
        ? 'critical'
        : classifyDelta(inactiveDelta, { higherIsBetter: false });

    cards.push({
      title:
        quarterMetrics.winRate === 0 && quarterSummary.total >= 10
          ? 'Current-quarter wins have not started yet'
          : inactiveDelta >= 5
            ? 'Inactive leakage is elevated'
            : revenueDelta >= 0
              ? 'Revenue density is holding up'
              : 'Revenue density trails historical norms',
      body:
        quarterMetrics.winRate === 0 && quarterSummary.total >= 10
          ? 'The cohort has meaningful volume, but none of the deals created this quarter have closed won yet.'
          : inactiveDelta >= 5
            ? `${quarterMetrics.inactiveRate}% of current-quarter deals are already inactive, above the ${allTimeMetrics.inactiveRate}% historical rate.`
            : revenuePerQuarterDeal > 0
              ? `Average value per created deal is ${roundCurrency(revenuePerQuarterDeal)} versus ${roundCurrency(revenuePerAllTimeDeal)} historically.`
              : 'Deal amount coverage is limited, so revenue density cannot be read confidently yet.',
      tone: winTone,
      metric:
        quarterMetrics.winRate === 0 && quarterSummary.total >= 10
          ? `${quarterSummary['Deal Won']} wins · ${quarterSummary.total} created deals`
          : inactiveDelta >= 5
            ? `${quarterMetrics.inactiveRate}% inactive · ${signedPoints(inactiveDelta)}`
            : revenuePerQuarterDeal > 0
              ? `${roundCurrency(revenuePerQuarterDeal)} per deal · ${signedPercent(
                  revenuePerAllTimeDeal > 0
                    ? Math.round((revenueDelta / revenuePerAllTimeDeal) * 100)
                    : 0
                )}`
              : `${quarterSummary.total} created deals`,
    });
  }

  return cards.slice(0, 4);
}

function buildBaselineComparisons(metrics) {
  const { quarterMetrics, allTimeMetrics } = metrics;

  return [
    {
      label: 'Active rate',
      quarter: `${quarterMetrics.activeRate}%`,
      baseline: `${allTimeMetrics.activeRate}%`,
      delta: quarterMetrics.activeRate - allTimeMetrics.activeRate,
      tone: classifyDelta(quarterMetrics.activeRate - allTimeMetrics.activeRate, { higherIsBetter: true }),
    },
    {
      label: 'Qualified rate',
      quarter: `${quarterMetrics.qualifiedRate}%`,
      baseline: `${allTimeMetrics.qualifiedRate}%`,
      delta: quarterMetrics.qualifiedRate - allTimeMetrics.qualifiedRate,
      tone: classifyDelta(quarterMetrics.qualifiedRate - allTimeMetrics.qualifiedRate, { higherIsBetter: true }),
    },
    {
      label: 'Inactive rate',
      quarter: `${quarterMetrics.inactiveRate}%`,
      baseline: `${allTimeMetrics.inactiveRate}%`,
      delta: quarterMetrics.inactiveRate - allTimeMetrics.inactiveRate,
      tone: classifyDelta(quarterMetrics.inactiveRate - allTimeMetrics.inactiveRate, { higherIsBetter: false }),
    },
    {
      label: 'Win rate',
      quarter: `${quarterMetrics.winRate}%`,
      baseline: `${allTimeMetrics.winRate}%`,
      delta: quarterMetrics.winRate - allTimeMetrics.winRate,
      tone: classifyDelta(quarterMetrics.winRate - allTimeMetrics.winRate, { higherIsBetter: true }),
    },
  ];
}

function buildChannelInterpretation(channel, metrics, topVolumeChannel) {
  const { quarterMetrics } = metrics;

  if (channel.total === 0) {
    return {
      tone: 'neutral',
      sentence: 'No meaningful contribution yet from this channel in the current quarter.',
    };
  }

  if (channel.channel === topVolumeChannel?.channel && channel.qualifiedRate <= quarterMetrics.qualifiedRate - 10) {
    return {
      tone: 'warning',
      sentence: 'Highest-volume source, but qualification is trailing the current-quarter average.',
    };
  }

  if (channel.qualifiedRate >= quarterMetrics.qualifiedRate + 8 && channel.total >= 3) {
    return {
      tone: 'positive',
      sentence: 'Combines useful volume with above-average downstream qualification.',
    };
  }

  if (channel.winRate > 0 && channel.winRate >= quarterMetrics.winRate + 5) {
    return {
      tone: 'positive',
      sentence: 'Converting further downstream than the broader quarter mix.',
    };
  }

  if (channel.inactiveRate >= quarterMetrics.inactiveRate + 10) {
    return {
      tone: 'critical',
      sentence: 'A disproportionate share of created deals are going inactive.',
    };
  }

  if (channel.total < 3) {
    return {
      tone: 'neutral',
      sentence: 'Contribution is still limited, so this signal is early.',
    };
  }

  return {
    tone: 'neutral',
    sentence: 'Performance is broadly in line with the current-quarter cohort.',
  };
}

function buildChannelInsights(metrics) {
  const channels = getChannelMap(metrics.quarterChannels);
  const topVolumeChannel = [...channels].sort((a, b) => b.total - a.total)[0];

  return channels
    .map((channel) => {
      const interpretation = buildChannelInterpretation(channel, metrics, topVolumeChannel);
      const score = (channel.qualifiedRate * 2) + channel.winRate + channel.activeRate - channel.inactiveRate + (channel.total * 2);

      return {
        ...channel,
        ...interpretation,
        supportingMetric: `${channel.total} created · ${channel.qualifiedRate}% qualified`,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function safeRatio(numerator, denominator) {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 100);
}

function transitionStageLabel(key) {
  if (key === 'MQL_TO_SAL') return 'Early-stage progression';
  if (key === 'SAL_TO_SQL') return 'Mid-funnel progression';
  return 'Late-stage conversion';
}

function transitionCurrentMetric(key, summary) {
  if (key === 'MQL_TO_SAL') {
    return `${summary.SAL} SALs from ${summary.MQL} MQLs`;
  }

  if (key === 'SAL_TO_SQL') {
    return `${summary['SQL++']} SQL++ deals from ${summary.SAL} SALs`;
  }

  return `${summary['Deal Won']} won from ${summary['SQL++']} SQL++ deals`;
}

function buildBottlenecks(metrics) {
  const { quarterSummary, allTimeSummary, quarterMetrics, allTimeMetrics } = metrics;

  const transitions = [
    {
      key: 'MQL_TO_SAL',
      label: 'MQL → SAL depth',
      quarter: safeRatio(quarterSummary.SAL, quarterSummary.MQL),
      baseline: safeRatio(allTimeSummary.SAL, allTimeSummary.MQL),
      explanation: 'How much of the current-stage cohort has reached SAL relative to MQL volume.',
    },
    {
      key: 'SAL_TO_SQL',
      label: 'SAL → SQL++ depth',
      quarter: safeRatio(quarterSummary['SQL++'], quarterSummary.SAL),
      baseline: safeRatio(allTimeSummary['SQL++'], allTimeSummary.SAL),
      explanation: 'Whether qualified demand is progressing into deeper pipeline at the expected rate.',
    },
    {
      key: 'SQL_TO_WON',
      label: 'SQL++ → Won depth',
      quarter: safeRatio(quarterSummary['Deal Won'], quarterSummary['SQL++']),
      baseline: safeRatio(allTimeSummary['Deal Won'], allTimeSummary['SQL++']),
      explanation: 'A proxy for whether current-quarter late-stage opportunities are starting to convert.',
    },
  ].filter((item) => item.quarter != null && item.baseline != null);

  const worstTransition = [...transitions].sort((a, b) => (a.quarter - a.baseline) - (b.quarter - b.baseline))[0] ?? null;
  const bestTransition = [...transitions].sort((a, b) => (b.quarter - b.baseline) - (a.quarter - a.baseline))[0] ?? null;
  const inactiveDelta = quarterMetrics.inactiveRate - allTimeMetrics.inactiveRate;

  return [
    worstTransition
      ? {
          title: 'Main bottleneck',
          label: transitionStageLabel(worstTransition.key),
          tone: classifyDelta(worstTransition.quarter - worstTransition.baseline, { higherIsBetter: true }),
          current: `This quarter: ${transitionCurrentMetric(worstTransition.key, quarterSummary)}`,
          baseline: `Historical benchmark: ${worstTransition.baseline}%`,
          body:
            worstTransition.key === 'SQL_TO_WON'
              ? 'Late-stage deals are not converting into wins as quickly as the historical cohort.'
              : worstTransition.key === 'SAL_TO_SQL'
                ? 'Qualified deals are not reaching deeper pipeline as quickly as normal.'
                : 'Top-of-funnel deals are progressing into SAL more slowly than usual.',
        }
      : {
          title: 'Main bottleneck',
          label: 'Not enough signal yet',
          tone: 'neutral',
          current: `This quarter: ${quarterSummary.total} created deals`,
          baseline: 'Historical benchmark: waiting for more stage depth',
          body: 'There is not enough stage depth yet to identify a reliable bottleneck.',
        },
    bestTransition
      ? {
          title: 'Strongest stage',
          label: transitionStageLabel(bestTransition.key),
          tone: classifyDelta(bestTransition.quarter - bestTransition.baseline, { higherIsBetter: true }),
          current: `This quarter: ${transitionCurrentMetric(bestTransition.key, quarterSummary)}`,
          baseline: `Historical benchmark: ${bestTransition.baseline}%`,
          body:
            bestTransition.quarter >= bestTransition.baseline
              ? 'This is the healthiest stage in the current-quarter cohort.'
              : 'This is the healthiest stage right now, but it is still below the historical benchmark.',
        }
      : {
          title: 'Strongest stage',
          label: 'Not enough signal yet',
          tone: 'neutral',
          current: `This quarter: ${quarterSummary.total} created deals`,
          baseline: 'Historical benchmark: waiting for more stage depth',
          body: 'The current-quarter cohort is still too early to show a strong progression signal.',
        },
    {
      title: 'Inactive leakage',
      label: 'Deals going inactive',
      tone: classifyDelta(inactiveDelta, { higherIsBetter: false }),
      current: `This quarter: ${quarterMetrics.inactiveRate}% of deals are inactive`,
      baseline: `Historical benchmark: ${allTimeMetrics.inactiveRate}% inactive`,
      body:
        inactiveDelta >= 5
          ? 'More deals are going inactive than the historical norm, which points to leakage in the current cohort.'
          : 'Inactive leakage is better than or in line with the historical norm.',
    },
  ];
}

function buildRecommendedActions(metrics, channelInsights, bottlenecks) {
  const { quarterSummary, quarterMetrics, allTimeMetrics } = metrics;
  const actions = [];
  const topVolumeChannel = [...channelInsights].sort((a, b) => b.total - a.total)[0];
  const bestChannel = channelInsights.find((channel) => channel.tone === 'positive' && channel.total > 0);

  if (topVolumeChannel && topVolumeChannel.total > 0 && topVolumeChannel.qualifiedRate <= metrics.quarterMetrics.qualifiedRate - 10) {
    actions.push({
      title: `Reassess ${topVolumeChannel.channel.toLowerCase()} qualification`,
      body: `${topVolumeChannel.channel} is carrying volume, but its qualification rate is below the quarter average.`,
      driver: `${topVolumeChannel.qualifiedRate}% qualified vs ${metrics.quarterMetrics.qualifiedRate}% quarter average`,
    });
  }

  if (quarterMetrics.inactiveRate >= allTimeMetrics.inactiveRate + 5) {
    actions.push({
      title: 'Review inactive-deal recovery motion',
      body: 'The current-quarter cohort is leaking into inactivity faster than the historical baseline.',
      driver: `${quarterMetrics.inactiveRate}% inactive vs ${allTimeMetrics.inactiveRate}% baseline`,
    });
  }

  if (bestChannel) {
    actions.push({
      title: `Scale what is working in ${bestChannel.channel.toLowerCase()}`,
      body: `${bestChannel.channel} is one of the strongest channels on downstream quality this quarter.`,
      driver: `${bestChannel.qualifiedRate}% qualified · ${bestChannel.winRate}% win rate`,
    });
  }

  if (quarterSummary.total >= 10 && quarterSummary['Deal Won'] === 0) {
    actions.push({
      title: 'Investigate the absence of early wins',
      body: 'The quarter already has meaningful created volume, but none of the current-quarter deals have closed won yet.',
      driver: `${quarterSummary['Deal Won']} wins from ${quarterSummary.total} created deals`,
    });
  }

  if (actions.length < 3 && bottlenecks[0]?.tone !== 'neutral') {
    actions.push({
      title: 'Address the main stage bottleneck',
      body: bottlenecks[0].body,
      driver: `${bottlenecks[0].current} · ${bottlenecks[0].baseline}`,
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: 'Stay disciplined on current execution',
      body: 'Quarter performance is broadly in line with the long-term baseline, so the focus should be consistency rather than a major corrective move.',
      driver: `${quarterMetrics.activeRate}% active · ${quarterMetrics.qualifiedRate}% qualified`,
    });
  }

  return actions.slice(0, 4);
}

export function buildInsightsModel(metrics) {
  const channelInsights = buildChannelInsights(metrics);
  const bottlenecks = buildBottlenecks(metrics);

  return {
    executiveCards: buildExecutiveCards(metrics),
    baselineComparisons: buildBaselineComparisons(metrics),
    channelInsights,
    bottlenecks,
    recommendedActions: buildRecommendedActions(metrics, channelInsights, bottlenecks),
  };
}
