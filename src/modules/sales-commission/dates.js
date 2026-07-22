/** UTC-safe calendar date helpers (prototype v2.2). */

const DAY = 86400000;

function parseISODateParts(dateISO) {
  if (!dateISO || typeof dateISO !== 'string') throw new Error('Invalid date');
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateISO);
  if (!m) throw new Error(`Invalid ISO date: ${dateISO}`);
  return { y: +m[1], m: +m[2], d: +m[3] };
}

function addMonths(dateISO, months) {
  const p = parseISODateParts(dateISO);
  const t = new Date(Date.UTC(p.y, p.m - 1 + Number(months), 1));
  const lastDay = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(p.d, lastDay));
  return t.toISOString().slice(0, 10);
}

function addDays(dateISO, days) {
  const p = parseISODateParts(dateISO);
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d));
  t.setUTCDate(t.getUTCDate() + Number(days));
  return t.toISOString().slice(0, 10);
}

function daysBetween(aISO, bISO) {
  const a = parseISODateParts(aISO);
  const b = parseISODateParts(bISO);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / DAY);
}

function fmtD(d) {
  if (!d) return '—';
  try {
    const p = parseISODateParts(d);
    return new Date(Date.UTC(p.y, p.m - 1, p.d)).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return String(d);
  }
}

function todayISO(demoToday) {
  if (demoToday) return String(demoToday).slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function fyOf(dateISO) {
  const p = parseISODateParts(dateISO);
  const startYear = p.m >= 7 ? p.y : p.y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

function fyBounds(fy) {
  const y = +String(fy).slice(0, 4);
  return { start: `${y}-07-01`, end: `${y + 1}-06-30` };
}

function periodsForFY(fy, payoutFreq) {
  const y = +String(fy).slice(0, 4);
  const y2 = y + 1;
  if (payoutFreq === 'half-yearly') {
    return [
      { id: `${fy}-H1`, label: `H1 Jul–Dec ${y}`, cutoff: `${y}-12-31` },
      { id: `${fy}-H2`, label: `H2 Jan–Jun ${y2}`, cutoff: `${y2}-06-30` },
    ];
  }
  return [
    { id: `${fy}-Q1`, label: `Q1 Jul–Sep ${y}`, cutoff: `${y}-09-30` },
    { id: `${fy}-Q2`, label: `Q2 Oct–Dec ${y}`, cutoff: `${y}-12-31` },
    { id: `${fy}-Q3`, label: `Q3 Jan–Mar ${y2}`, cutoff: `${y2}-03-31` },
    { id: `${fy}-Q4`, label: `Q4 Apr–Jun ${y2}`, cutoff: `${y2}-06-30` },
  ];
}

function nextPeriod(periods, today) {
  return periods.find((p) => p.cutoff >= today) || periods[periods.length - 1];
}

module.exports = {
  parseISODateParts,
  addMonths,
  addDays,
  daysBetween,
  fmtD,
  todayISO,
  fyOf,
  fyBounds,
  periodsForFY,
  nextPeriod,
};
