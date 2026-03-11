import { getQuarterRange, getQuarterLabel } from './weekUtils.js';

export const STAGE_BUCKETS = [
  {
    key: 'MQL',
    label: 'Initial Interest (MQL)',
    shortLabel: 'MQL',
    color: '#16a34a',
    cardColor: 'green',
    stages: ['Initial Interest'],
  },
  {
    key: 'SAL',
    label: 'SAL',
    shortLabel: 'SAL',
    color: '#9333ea',
    cardColor: 'purple',
    stages: ['SAL'],
  },
  {
    key: 'SQL++',
    label: 'SQL++',
    shortLabel: 'SQL++',
    color: '#ea580c',
    cardColor: 'orange',
    stages: ['SQL', 'Contract', 'Solutioning', 'Proposal'],
  },
  {
    key: 'InActive',
    label: 'InActive',
    shortLabel: 'InActive',
    color: '#64748b',
    cardColor: 'slate',
    stages: ['Semi-Dormant', 'Dormant', 'Revisit', 'Reject', 'Deal Lost'],
  },
  {
    key: 'Deal Won',
    label: 'Deal Won',
    shortLabel: 'Deal Won',
    color: '#0f766e',
    cardColor: 'teal',
    stages: ['Deal Won'],
  },
];

export const PRODUCTIVE_FUNNEL_KEYS = ['MQL', 'SAL', 'SQL++', 'Deal Won'];

const STAGE_TO_BUCKET = {
  '244798989': 'MQL',
  '1047744293': 'SAL',
  '244798990': 'SQL++',
  '244798992': 'SQL++',
  '249283938': 'SQL++',
  '244798994': 'SQL++',
  '1111696779': 'InActive',
  '249323383': 'InActive',
  '1099643979': 'InActive',
  '1047744292': 'InActive',
  '244798996': 'InActive',
  '244798995': 'Deal Won',
};

export const CHANNEL_ORDER = ['Inbound', 'Outbound', 'Events', 'Sales', 'Other', 'Unknown'];

export const CHANNEL_COLORS = {
  Inbound: '#2563eb',
  Outbound: '#f97316',
  Events: '#9333ea',
  Sales: '#16a34a',
  Other: '#64748b',
  Unknown: '#94a3b8',
};

function createStageSummary() {
  return {
    total: 0,
    MQL: 0,
    SAL: 0,
    'SQL++': 0,
    InActive: 0,
    'Deal Won': 0,
    Unknown: 0,
  };
}

export function percent(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export function formatPercent(count, total) {
  return `${percent(count, total)}%`;
}

export function formatAmount(value) {
  if (!value) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getSummaryBucket(deal) {
  if (deal.dealstage && STAGE_TO_BUCKET[deal.dealstage]) {
    return STAGE_TO_BUCKET[deal.dealstage];
  }

  if (deal.category === 'MQL') return 'MQL';
  if (deal.category === 'SAL') return 'SAL';
  if (deal.category === 'CLOSED_WON') return 'Deal Won';
  if (deal.category === 'CLOSED_LOST') return 'InActive';
  return 'Unknown';
}

export function buildStageSummary(deals) {
  const summary = createStageSummary();

  for (const deal of deals) {
    const bucket = getSummaryBucket(deal);
    summary.total += 1;
    summary[bucket] += 1;
  }

  return summary;
}

export function buildExecutiveMetrics(summary) {
  const active = summary.MQL + summary.SAL + summary['SQL++'];
  const qualified = summary.SAL + summary['SQL++'];

  return {
    active,
    activeRate: percent(active, summary.total),
    qualified,
    qualifiedRate: percent(qualified, summary.total),
    inactiveRate: percent(summary.InActive, summary.total),
    winRate: percent(summary['Deal Won'], summary.total),
  };
}

export function getChannelKey(channel) {
  return channel && CHANNEL_COLORS[channel] ? channel : 'Unknown';
}

export function buildChannelSummary(deals) {
  const map = new Map(
    CHANNEL_ORDER.map((channel) => [
      channel,
      {
        channel,
        total: 0,
        active: 0,
        inactive: 0,
        won: 0,
        'SQL++': 0,
        SAL: 0,
        MQL: 0,
        amount: 0,
      },
    ])
  );

  for (const deal of deals) {
    const channel = getChannelKey(deal.acquisitionChannel);
    const bucket = getSummaryBucket(deal);
    const entry = map.get(channel);

    entry.total += 1;
    entry.amount += deal.amount ?? 0;

    if (bucket === 'InActive') entry.inactive += 1;
    else if (bucket === 'Deal Won') entry.won += 1;
    else entry.active += 1;

    if (bucket === 'MQL') entry.MQL += 1;
    if (bucket === 'SAL') entry.SAL += 1;
    if (bucket === 'SQL++') entry['SQL++'] += 1;
  }

  return Array.from(map.values())
    .filter((entry) => entry.total > 0)
    .map((entry) => ({
      ...entry,
      activeRate: percent(entry.active, entry.total),
      inactiveRate: percent(entry.inactive, entry.total),
      winRate: percent(entry.won, entry.total),
      qualifiedRate: percent(entry.SAL + entry['SQL++'], entry.total),
      sqlRate: percent(entry['SQL++'], entry.total),
      revenuePerDeal: entry.total > 0 ? Math.round(entry.amount / entry.total) : 0,
    }));
}

export function buildDashboardMetrics(deals, geo) {
  const filtered = geo === 'All' ? deals : deals.filter((deal) => deal.geography === geo);
  const { start: qStart, end: qEnd } = getQuarterRange();
  const quarterLabel = getQuarterLabel();
  const quarterDeals = filtered.filter((deal) => {
    if (!deal.createdate) return false;
    const created = new Date(deal.createdate);
    return created >= qStart && created <= qEnd;
  });

  const quarterSummary = buildStageSummary(quarterDeals);
  const allTimeSummary = buildStageSummary(filtered);
  const quarterMetrics = buildExecutiveMetrics(quarterSummary);
  const allTimeMetrics = buildExecutiveMetrics(allTimeSummary);
  const quarterChannels = buildChannelSummary(quarterDeals);
  const topQuarterChannel = [...quarterChannels].sort((a, b) => b.total - a.total)[0] ?? null;
  const quarterAmount = quarterDeals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0);
  const allTimeAmount = filtered.reduce((sum, deal) => sum + (deal.amount ?? 0), 0);

  return {
    filtered,
    quarterDeals,
    qStart,
    qEnd,
    quarterLabel,
    quarterSummary,
    allTimeSummary,
    quarterMetrics,
    allTimeMetrics,
    quarterChannels,
    topQuarterChannel,
    quarterAmount,
    allTimeAmount,
  };
}
