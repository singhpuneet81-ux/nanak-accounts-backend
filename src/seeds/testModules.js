// End-to-end API test of the three new modules against a running local backend:
//   node src/seeds/testModules.js
const BASE = process.env.API_URL || 'http://localhost:5000/api';

let passed = 0;
let failed = 0;

function check(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}

async function login(email, password) {
  const { status, json } = await api('POST', '/auth/login', { body: { email, password } });
  if (status !== 200) throw new Error(`Login failed for ${email}: ${status} ${JSON.stringify(json)}`);
  return json;
}

async function main() {
  console.log(`\nTesting against ${BASE}\n`);

  // ─────────────────────────────────────────────
  console.log('MODULE 3 · Role-based access (login + effective modules)');
  const admin = await login('admin@nanak.com', 'admin123');
  const staff = await login('staff@nanak.com', 'staff123');
  const quotesOnly = await login('quotes.only@nanak.com', 'quotes123');
  const pricingEditor = await login('pricing.editor@nanak.com', 'pricing123');

  const aTok = admin.token, sTok = staff.token, qTok = quotesOnly.token, pTok = pricingEditor.token;
  const mods = (u) => u.user?.modules || u.modules || [];

  check('admin gets ALL modules', mods(admin).includes('team') && mods(admin).includes('quote-pad-pricing'), mods(admin).join(', '));
  check('staff gets role defaults (no team, no pricing)', mods(staff).includes('quote-pad') && !mods(staff).includes('team') && !mods(staff).includes('quote-pad-pricing'), mods(staff).join(', '));
  check('custom user limited to dashboard + quote-pad', JSON.stringify([...mods(quotesOnly)].sort()) === JSON.stringify(['dashboard', 'quote-pad']), mods(quotesOnly).join(', '));
  check('pricing editor has quote-pad-pricing', mods(pricingEditor).includes('quote-pad-pricing'), mods(pricingEditor).join(', '));

  console.log('\nMODULE 3 · Role-based access (backend enforcement)');
  let r = await api('POST', '/admin/team', { token: sTok, body: { name: 'X', email: 'x@x.com', password: 'x12345', role: 'staff' } });
  check('staff BLOCKED from creating team members (403)', r.status === 403, `status ${r.status}`);
  r = await api('GET', '/admin/quote-pad/quotes', { token: qTok });
  check('quotes-only user CAN list quotes (200)', r.status === 200, `status ${r.status}`);
  r = await api('PUT', '/admin/quote-pad/config', { token: qTok, body: { household: { individualBase: 1 } } });
  check('quotes-only user BLOCKED from editing prices (403)', r.status === 403, `status ${r.status}`);

  // Team CRUD as admin with custom permissions
  const email = `rbac.test.${Date.now()}@nanak.com`;
  r = await api('POST', '/admin/team', {
    token: aTok,
    body: { name: 'RBAC Test User', email, password: 'test1234', role: 'staff', permissions: ['dashboard', 'benchmarks'] },
  });
  const newId = r.json?.member?.id || r.json?.member?._id || r.json?.id || r.json?._id;
  check('admin creates member with custom permissions (201)', r.status === 201 || r.status === 200, `status ${r.status}`);
  const fresh = await login(email, 'test1234');
  check('new member modules = dashboard + benchmarks only', JSON.stringify([...mods(fresh)].sort()) === JSON.stringify(['benchmarks', 'dashboard']), mods(fresh).join(', '));
  if (newId) {
    r = await api('PUT', `/admin/team/${newId}`, { token: aTok, body: { permissions: ['dashboard', 'quote-pad'] } });
    check('admin updates member permissions', r.status === 200, `status ${r.status}`);
    const again = await login(email, 'test1234');
    check('updated modules = dashboard + quote-pad', JSON.stringify([...mods(again)].sort()) === JSON.stringify(['dashboard', 'quote-pad']), mods(again).join(', '));
    r = await api('DELETE', `/admin/team/${newId}`, { token: aTok });
    check('admin deletes test member', r.status === 200, `status ${r.status}`);
  }

  // ─────────────────────────────────────────────
  console.log('\nMODULE 2 · Quote Pad pricing config');
  r = await api('GET', '/admin/quote-pad/config', { token: sTok });
  const cfg = r.json?.config;
  check('staff can READ pricing config (200)', r.status === 200 && !!cfg, `status ${r.status}`);
  check('default individual base = $120', cfg?.household?.individualBase === 120, `got ${cfg?.household?.individualBase}`);
  check('default sole trader $75k–$150k band = $250', cfg?.household?.soleTraderBands?.[1]?.[1] === 250, `got ${cfg?.household?.soleTraderBands?.[1]?.[1]}`);

  r = await api('PUT', '/admin/quote-pad/config', { token: pTok, body: { household: { individualBase: 150 } } });
  check('pricing editor updates individual base → $150', r.status === 200 && r.json?.config?.household?.individualBase === 150, `status ${r.status}, value ${r.json?.config?.household?.individualBase}`);
  r = await api('GET', '/admin/quote-pad/config', { token: sTok });
  check('staff sees the NEW price ($150) on next read', r.json?.config?.household?.individualBase === 150, `got ${r.json?.config?.household?.individualBase}`);
  check('other prices untouched after partial update', r.json?.config?.household?.strategicPlanning === 150 && r.json?.config?.business?.existingRates?.Company?.[2] === 1650, `planning ${r.json?.config?.household?.strategicPlanning}, company 150–200k ${r.json?.config?.business?.existingRates?.Company?.[2]}`);

  r = await api('POST', '/admin/quote-pad/config/reset', { token: aTok });
  check('admin resets config to defaults', r.status === 200 && r.json?.config?.household?.individualBase === 120, `back to ${r.json?.config?.household?.individualBase}`);

  // ─────────────────────────────────────────────
  console.log('\nMODULE 1 · Quote Pad (saved quotes)');
  r = await api('GET', '/admin/quote-pad/quotes', { token: sTok });
  const list = r.json?.quotes || [];
  check('list quotes returns seeded samples', r.status === 200 && list.length >= 2, `${list.length} quotes`);
  const hh = list.find((q) => q.kind === 'household');
  const ent = list.find((q) => q.kind === 'entity');
  check('seeded household quote present ($820)', hh?.total === 820, `${hh?.title} — $${hh?.total}`);
  check('seeded company quote present ($1950)', ent?.total === 1950, `${ent?.title} — $${ent?.total}`);

  r = await api('POST', '/admin/quote-pad/quotes', {
    token: sTok,
    body: {
      kind: 'entity',
      label: 'SMSF',
      structure: 'SMSF',
      title: 'API Test SMSF Fund',
      total: 1400,
      data: { entity: 'SMSF', clientType: 'Existing', smsfTier: '<500k', support: 'planning', biz: 'API Test SMSF Fund' },
    },
  });
  const created = r.json?.quote;
  check('staff creates a quote', (r.status === 200 || r.status === 201) && !!created, `#${created?.number} status ${r.status}`);
  check('quote number auto-increments', (created?.number || 0) >= 3, `number ${created?.number}`);
  check('createdByName recorded', created?.createdByName === 'Test Staff', `by ${created?.createdByName}`);

  if (created) {
    const id = created.id || created._id;
    r = await api('GET', `/admin/quote-pad/quotes/${id}`, { token: sTok });
    check('open a saved quote (full data)', r.status === 200 && r.json?.quote?.data?.entity === 'SMSF', `status ${r.status}`);
    r = await api('PUT', `/admin/quote-pad/quotes/${id}`, { token: sTok, body: { title: 'API Test SMSF Fund (renamed)', total: 1500 } });
    check('update a saved quote', r.status === 200 && r.json?.quote?.total === 1500, `total ${r.json?.quote?.total}`);
    r = await api('DELETE', `/admin/quote-pad/quotes/${id}`, { token: sTok });
    check('delete a saved quote', r.status === 200, `status ${r.status}`);
  }

  console.log(`\n──────── RESULT: ${passed} passed, ${failed} failed ────────\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error('Test run crashed:', e);
  process.exit(1);
});
