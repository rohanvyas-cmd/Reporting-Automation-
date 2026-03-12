import { useState, useMemo } from 'react';
import GeoToggle from '../components/GeoToggle.jsx';
import { getQuarterRange, getQuarterLabel } from '../utils/weekUtils.js';

const PAGE_SIZE = 25;

const MODES = [
  { key: 'quarter', label: 'This Quarter' },
  { key: 'progressed', label: 'Pre-Quarter Progressed' },
  { key: 'all', label: 'All Time' },
];

const COLUMNS = [
  { key: 'dealname', label: 'Deal Name' },
  { key: 'category', label: 'Stage' },
  { key: 'geography', label: 'Region' },
  { key: 'amount', label: 'Amount' },
  { key: 'createdate', label: 'Created' },
  { key: 'closedate', label: 'Close Date' },
  { key: 'acquisitionChannel', label: 'Channel' },
  { key: 'leadSource', label: 'Lead Source' },
  { key: 'ownerName', label: 'Owner' },
  { key: 'hs_lastmodifieddate', label: 'Last Modified' },
];

const CHANNELS = ['Inbound', 'Outbound', 'Events', 'Sales', 'Other'];

const CHANNEL_COLORS = {
  Inbound:  { active: 'border-blue-600 bg-blue-600 text-white',   inactive: 'border-blue-300 bg-white text-blue-600 hover:bg-blue-50' },
  Outbound: { active: 'border-orange-600 bg-orange-600 text-white', inactive: 'border-orange-300 bg-white text-orange-600 hover:bg-orange-50' },
  Events:   { active: 'border-purple-600 bg-purple-600 text-white', inactive: 'border-purple-300 bg-white text-purple-600 hover:bg-purple-50' },
  Sales:    { active: 'border-green-600 bg-green-600 text-white',  inactive: 'border-green-300 bg-white text-green-600 hover:bg-green-50' },
  Other:    { active: 'border-gray-600 bg-gray-600 text-white',   inactive: 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100' },
};

const STATUS_GROUPS = {
  open:    { label: 'Open Pipeline', stages: ['244798989', '1047744293', '244798990', '249283938', '244798994', '244798992'] },
  nurture: { label: 'Nurturing',     stages: ['1111696779', '249323383', '1099643979'] },
  won:     { label: 'Won',           stages: ['244798995'] },
  lost:    { label: 'Lost',          stages: ['244798996', '1047744292'] },
};

const STAGE_DISPLAY = {
  '244798989': 'Initial Interest', '1047744293': 'SAL', '244798990': 'SQL',
  '249283938': 'Solutioning', '244798994': 'Proposal', '244798992': 'Contract',
  '244798995': 'Deal Won', '244798996': 'Deal Lost', '1111696779': 'Semi-Dormant',
  '249323383': 'Dormant', '1099643979': 'Revisit', '1047744292': 'Reject',
};

const STATUS_COLORS = {
  open:    { active: 'bg-blue-600 text-white border-blue-600',    inactive: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' },
  nurture: { active: 'bg-yellow-500 text-white border-yellow-500', inactive: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' },
  won:     { active: 'bg-green-600 text-white border-green-600',   inactive: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' },
  lost:    { active: 'bg-red-500 text-white border-red-500',       inactive: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' },
};

const GEO_BADGE = {
  US: 'bg-green-100 text-green-700',
  India: 'bg-orange-100 text-orange-700',
  SEA: 'bg-cyan-100 text-cyan-700',
  Europe: 'bg-blue-100 text-blue-700',
  MENA: 'bg-yellow-100 text-yellow-700',
  Other: 'bg-gray-100 text-gray-500',
  Unknown: 'bg-gray-100 text-gray-400',
};

const CAT_BADGE = {
  MQL: 'bg-yellow-100 text-yellow-700',
  SAL: 'bg-purple-100 text-purple-700',
  SQL: 'bg-orange-100 text-orange-700',
  Active: 'bg-blue-100 text-blue-700',
  CLOSED_WON: 'bg-green-100 text-green-700',
  CLOSED_LOST: 'bg-red-100 text-red-500',
};

const CAT_LABEL = {
  MQL: 'Initial Interest',
  SAL: 'SAL',
  SQL: 'SQL',
  Active: 'Advanced',
  CLOSED_WON: 'Deal Won',
  CLOSED_LOST: 'Deal Lost',
};

function getStageLabel(deal) {
  const byId = deal?.dealstage ? STAGE_DISPLAY[deal.dealstage] : null;
  if (byId) return byId;
  if (deal?.category && CAT_LABEL[deal.category]) return CAT_LABEL[deal.category];
  return deal?.category ?? '—';
}

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatAmount(val) {
  if (val == null || val === 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

function SortIcon({ dir }) {
  if (!dir) return <span className="ml-1 text-gray-300">↕</span>;
  return <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 flex items-center justify-between shadow-sm">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
    </div>
  );
}

export default function DealDetails({ deals }) {
  const [mode, setMode] = useState('quarter');
  const [geo, setGeo] = useState('All');
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeStatus, setActiveStatus] = useState(null);
  const [activeStages, setActiveStages] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('createdate');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const { start: qStart, end: qEnd } = useMemo(() => getQuarterRange(), []);
  const quarterLabel = useMemo(() => getQuarterLabel(), []);

  // Base dataset per mode (before user filters)
  const baseDeals = useMemo(() => {
    switch (mode) {
      case 'quarter':
        return deals.filter((d) => {
          if (!d.createdate) return false;
          const c = new Date(d.createdate);
          return c >= qStart && c <= qEnd;
        });
      case 'progressed':
        return deals.filter((d) => {
          if (!d.createdate) return false;
          if (new Date(d.createdate) >= qStart) return false;
          if (d.category === 'MQL') return false;
          if (!d.hs_lastmodifieddate) return false;
          const m = new Date(d.hs_lastmodifieddate);
          return m >= qStart && m <= qEnd;
        });
      case 'all':
      default:
        return deals;
    }
  }, [deals, mode, qStart, qEnd]);

  // Progressed stage breakdown (for the stats bar in progressed mode)
  const progressedByStage = useMemo(() => {
    if (mode !== 'progressed') return null;
    const counts = { SAL: 0, SQL: 0, Active: 0, CLOSED_WON: 0, CLOSED_LOST: 0 };
    for (const d of baseDeals) {
      if (counts[d.category] !== undefined) counts[d.category]++;
    }
    return counts;
  }, [mode, baseDeals]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  function switchMode(m) {
    setMode(m);
    setActiveStatus(null);
    setActiveStages([]);
    setSearch('');
    setGeo('All');
    setActiveChannel(null);
    setPage(1);
  }

  // User filters applied on top of base
  const filtered = useMemo(() => {
    let result = baseDeals;
    if (geo !== 'All') result = result.filter((d) => d.geography === geo);
    if (activeChannel) result = result.filter((d) => d.acquisitionChannel === activeChannel);
    if (activeStatus) {
      const allowedStages = STATUS_GROUPS[activeStatus].stages;
      result = result.filter((d) => allowedStages.includes(d.dealstage ?? ''));
      if (activeStages.length > 0) {
        result = result.filter((d) => activeStages.includes(d.dealstage ?? ''));
      }
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((d) => (d.dealname ?? '').toLowerCase().includes(q));
    }
    return result;
  }, [baseDeals, geo, activeChannel, activeStatus, activeStages, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = sortKey === 'category' ? getStageLabel(a) : a[sortKey];
      let bv = sortKey === 'category' ? getStageLabel(b) : b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const totalValue = filtered.reduce((sum, d) => sum + (d.amount ?? 0), 0);
    const avg = total > 0 ? totalValue / total : null;
    return { total, totalValue, avg };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageDeals = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const modeSubtitle = {
    quarter: `Deals created in ${quarterLabel}`,
    progressed: `Deals from prior quarters that showed stage activity in ${quarterLabel}`,
    all: 'All deals, all time',
  };

  return (
    <div className="space-y-5">
      {/* Header + mode selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Deals</h2>
          <p className="mt-1 text-sm text-gray-500">{modeSubtitle[mode]}</p>
        </div>
          <div className="flex flex-wrap items-center gap-3">
            <GeoToggle value={geo} onChange={(next) => { setGeo(next); setPage(1); }} />
            <div className="flex flex-wrap gap-2 rounded-lg border border-blue-100 bg-blue-50 p-1">
              {MODES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => switchMode(key)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    mode === key
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-blue-700'
                  }`}
                >
                  {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {mode === 'progressed' && progressedByStage ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'Now at SAL', count: progressedByStage.SAL, color: 'bg-purple-100 text-purple-700' },
            { label: 'Now at SQL', count: progressedByStage.SQL, color: 'bg-orange-100 text-orange-700' },
            { label: 'Advanced (Post-SQL)', count: progressedByStage.Active, color: 'bg-blue-100 text-blue-700' },
            { label: 'Won', count: progressedByStage.CLOSED_WON, color: 'bg-green-100 text-green-700' },
            { label: 'Lost', count: progressedByStage.CLOSED_LOST, color: 'bg-red-100 text-red-500' },
          ].map(({ label, count, color }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-xl font-bold rounded-full inline-block px-3 py-0.5 ${color}`}>{count}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Deals" value={stats.total} />
          <StatCard label="Pipeline Value" value={stats.totalValue > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.totalValue) : '—'} />
          <StatCard label="Avg Deal Size" value={stats.avg != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.avg) : '—'} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <input
          type="text"
          placeholder="Search deal name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-blue-100 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-52"
        />

        {CHANNELS.map((ch) => (
          <button
            key={ch}
            onClick={() => { setActiveChannel(activeChannel === ch ? null : ch); setPage(1); }}
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${CHANNEL_COLORS[ch][activeChannel === ch ? 'active' : 'inactive']}`}
          >
            {ch}
          </button>
        ))}

        <div className="w-px h-6 bg-blue-100 self-center" />

        {Object.entries(STATUS_GROUPS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => {
              if (activeStatus === key) { setActiveStatus(null); setActiveStages([]); }
              else { setActiveStatus(key); setActiveStages([]); }
              setPage(1);
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${STATUS_COLORS[key][activeStatus === key ? 'active' : 'inactive']}`}
          >
            {label}
          </button>
        ))}

        {activeStatus && STATUS_GROUPS[activeStatus].stages.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {STATUS_GROUPS[activeStatus].stages.map((s) => {
              const isActive = activeStages.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => {
                    setActiveStages((prev) =>
                      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                    );
                    setPage(1);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${isActive ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                  {STAGE_DISPLAY[s]}
                </button>
              );
            })}
          </div>
        )}

        {(geo !== 'All' || activeChannel || activeStatus || search) && (
          <button
            onClick={() => { setGeo('All'); setActiveChannel(null); setActiveStatus(null); setActiveStages([]); setSearch(''); setPage(1); }}
            className="rounded-lg border border-blue-100 bg-white px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{sorted.length} deals</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-blue-100 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-blue-50/60">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer px-4 py-3 text-left font-semibold text-gray-600 hover:bg-blue-50/70 select-none whitespace-nowrap"
                >
                  {col.label}
                  <SortIcon dir={sortKey === col.key ? sortDir : null} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {pageDeals.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="py-16 text-center text-gray-400">
                  No deals match the current filters.
                </td>
              </tr>
            ) : (
              pageDeals.map((deal, idx) => (
                <tr key={deal.id} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/40' : 'bg-gray-50/50 hover:bg-blue-50/40'}>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate" title={deal.dealname}>
                    {deal.dealname || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${CAT_BADGE[deal.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {getStageLabel(deal)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${GEO_BADGE[deal.geography] ?? 'bg-gray-100 text-gray-500'}`}>
                      {deal.geography}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">{formatAmount(deal.amount)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(deal.createdate)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(deal.closedate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {deal.acquisitionChannel
                      ? <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${CHANNEL_COLORS[deal.acquisitionChannel]?.active ?? 'bg-gray-100 text-gray-600'}`}>{deal.acquisitionChannel}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{deal.leadSource || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{deal.ownerName || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{formatDate(deal.hs_lastmodifieddate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-blue-100 bg-white px-3 py-1 disabled:opacity-40 hover:bg-blue-50"
          >
            Prev
          </button>
          <span>Page {page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-blue-100 bg-white px-3 py-1 disabled:opacity-40 hover:bg-blue-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
