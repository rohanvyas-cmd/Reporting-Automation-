/**
 * Week-over-week helpers.
 * "Week" = Monday 00:00:00 to Sunday 23:59:59.
 */

/**
 * Returns { start, end } for the current calendar quarter.
 * Q1 = Jan-Mar, Q2 = Apr-Jun, Q3 = Jul-Sep, Q4 = Oct-Dec
 */
export function getQuarterRange(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const quarterIndex = Math.floor(month / 3);
  const startMonth = quarterIndex * 3;
  const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Returns a human-readable quarter label, e.g. "Q1 2026".
 */
export function getQuarterLabel(date = new Date()) {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

/** Return the Monday (start) of the week that contains `date`. */
function weekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Return the Sunday (end) of the week that contains `date`. */
function weekEnd(date) {
  const start = weekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Given an array of deals, compute week-over-week counts per category.
 * Returns: { thisWeek, lastWeek } each being { MQL, SAL, SQL, Active }
 */
export function computeWoW(deals) {
  const now = new Date();
  const thisWeekStart = weekStart(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = weekEnd(lastWeekStart);

  const empty = () => ({ MQL: 0, SAL: 0, SQL: 0, Active: 0 });
  const thisWeek = empty();
  const lastWeek = empty();

  for (const deal of deals) {
    if (!deal.createdate) continue;
    const created = new Date(deal.createdate);
    const cat = deal.category;
    if (!['MQL', 'SAL', 'SQL', 'Active'].includes(cat)) continue;

    if (created >= thisWeekStart) {
      thisWeek[cat] = (thisWeek[cat] ?? 0) + 1;
    } else if (created >= lastWeekStart && created <= lastWeekEnd) {
      lastWeek[cat] = (lastWeek[cat] ?? 0) + 1;
    }
  }

  return { thisWeek, lastWeek };
}
