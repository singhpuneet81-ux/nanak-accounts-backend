/**
 * Quote Pad Excel price book — port of nanak-quote-pad-v3.html
 * buildPriceCSV / applyPriceCSV, as .xlsx via the `xlsx` package.
 *
 * Columns: section | key | name | price | gov_fee
 */
const XLSX = require('xlsx');

const B_BAND_ENTITIES = ['Company', 'Trust', 'Family Trust', 'Partnership'];

const CONFIG_FIELDS = [
  ['newClientDiscount', 'New-client discount %'],
  ['basQuarterCredit', 'Mid-year BAS credit / quarter'],
  ['advisoryUpgrade', 'Quarterly Business Support uplift'],
  ['bundleAccountingPct', 'Bundle accounting % off'],
  ['propertyExtra', 'SMSF extra property / yr'],
  ['monthlyBasUplift', 'Monthly BAS uplift'],
  ['payroll.perHeadMonth', 'Payroll per head / month'],
  ['payroll.softwarePerHeadMonth', 'Payroll software per head / month'],
  ['payroll.supportFlat', 'EOFY STP Support flat'],
];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getByPath(obj, path) {
  return path.split('.').reduce((o, p) => (o != null ? o[p] : undefined), obj);
}

function setByPath(obj, path, value) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (o[parts[i]] == null || typeof o[parts[i]] !== 'object') return false;
    o = o[parts[i]];
  }
  const last = parts[parts.length - 1];
  if (o[last] == null && o[last] !== 0) return false;
  o[last] = value;
  return true;
}

/**
 * Build AOA rows from a merged business config.
 * @param {object} business
 * @returns {Array<Array<string|number>>}
 */
function buildPriceBookRows(business) {
  const b = business || {};
  const bandLabels = Array.isArray(b.bandLabels) ? b.bandLabels : [];
  const rows = [['section', 'key', 'name', 'price', 'gov_fee']];
  rows.push([
    '#',
    '',
    'EDIT the price and gov_fee columns only. Keys must not change. For setups: price = professional fee, gov_fee = government fee (total charged = price + gov_fee). Leave gov_fee blank to set the listed price as the total.',
    '',
    '',
  ]);

  B_BAND_ENTITIES.forEach((en) => {
    const rates = (b.existingRates && b.existingRates[en]) || [];
    bandLabels.forEach((label, i) => {
      if (rates[i] == null) return;
      rows.push(['rate', `${en}|${i}`, `${en} ${label}`, rates[i], '']);
    });
  });

  (b.smsf && b.smsf.existing ? b.smsf.existing : []).forEach((t, i) => {
    rows.push(['tier_smsf', String(i), `SMSF ${t[0]}`, t[1], '']);
  });
  (b.nfp && b.nfp.existing ? b.nfp.existing : []).forEach((t, i) => {
    rows.push(['tier_nfp', String(i), `NFP ${t[0]}`, t[1], '']);
  });

  (b.setups || []).forEach((st) => {
    if (!st || !st.id) return;
    // Hub stores a single total `price` + boolean `gov`. Export total in price; gov_fee blank.
    // Importers who split professional/gov can fill gov_fee; import will recombine.
    rows.push(['setup', st.id, st.name || st.id, st.price, '']);
  });

  [
    ['addons', 'addon'],
    ['addonsSMSF', 'addon_smsf'],
    ['addonsNFP', 'addon_nfp'],
  ].forEach(([list, sec]) => {
    (b[list] || []).forEach((a) => {
      if (!a || !a.id) return;
      rows.push([sec, a.id, a.name || a.id, a.price, '']);
    });
  });

  Object.entries(b.planning || {}).forEach(([en, p]) => {
    if (!p) return;
    rows.push(['planning', en, p.name || en, p.price, '']);
  });

  CONFIG_FIELDS.forEach(([k, n]) => {
    const v = getByPath(b, k);
    if (v == null) return;
    rows.push(['config', k, n, v, '']);
  });

  return rows;
}

/**
 * Apply price-book rows onto a business config (mutates a clone).
 * @returns {{ updated: number, skipped: number, business: object }}
 */
function applyPriceBookRows(business, rows) {
  const b = deepClone(business || {});
  let updated = 0;
  let skipped = 0;

  (rows || []).forEach((r) => {
    if (!r || !r.length) return;
    const sec = String(r[0] ?? '').trim();
    const key = String(r[1] ?? '').trim();
    const priceRaw = r[3];
    const govRaw = r[4];
    if (!sec || sec === 'section' || sec === '#') return;

    const price = parseFloat(priceRaw);
    const gov = parseFloat(govRaw);

    try {
      if (sec === 'rate') {
        const [en, idxStr] = key.split('|');
        const i = Number(idxStr);
        if (
          b.existingRates &&
          b.existingRates[en] &&
          b.existingRates[en][i] != null &&
          Number.isFinite(price)
        ) {
          b.existingRates[en][i] = price;
          updated++;
        } else skipped++;
      } else if (sec === 'tier_smsf') {
        const i = Number(key);
        if (b.smsf && b.smsf.existing && b.smsf.existing[i] && Number.isFinite(price)) {
          b.smsf.existing[i][1] = price;
          updated++;
        } else skipped++;
      } else if (sec === 'tier_nfp') {
        const i = Number(key);
        if (b.nfp && b.nfp.existing && b.nfp.existing[i] && Number.isFinite(price)) {
          b.nfp.existing[i][1] = price;
          updated++;
        } else skipped++;
      } else if (sec === 'setup') {
        const st = (b.setups || []).find((x) => x && x.id === key);
        if (st && Number.isFinite(price)) {
          if (Number.isFinite(gov) && gov >= 0 && String(govRaw).trim() !== '') {
            // HTML semantics: price col = professional, gov_fee = gov → total
            st.price = Math.round((Math.max(0, price) + Math.max(0, gov)) * 100) / 100;
          } else {
            st.price = price;
          }
          updated++;
        } else skipped++;
      } else if (sec === 'addon' || sec === 'addon_smsf' || sec === 'addon_nfp') {
        const list =
          sec === 'addon' ? b.addons : sec === 'addon_smsf' ? b.addonsSMSF : b.addonsNFP;
        const a = (list || []).find((x) => x && x.id === key);
        if (a && Number.isFinite(price)) {
          a.price = price;
          updated++;
        } else skipped++;
      } else if (sec === 'planning') {
        if (b.planning && b.planning[key] && Number.isFinite(price)) {
          b.planning[key].price = price;
          updated++;
        } else skipped++;
      } else if (sec === 'config') {
        if (Number.isFinite(price) && setByPath(b, key, price)) updated++;
        else skipped++;
      } else {
        skipped++;
      }
    } catch {
      skipped++;
    }
  });

  // Mirror HTML: keep "new" rate tables in sync with existing after import
  if (b.existingRates) b.newRates = deepClone(b.existingRates);
  if (b.smsf && b.smsf.existing) b.smsf.neu = deepClone(b.smsf.existing);
  if (b.nfp && b.nfp.existing) b.nfp.neu = deepClone(b.nfp.existing);

  return { updated, skipped, business: b };
}

function rowsToXlsxBuffer(rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  // Reasonable column widths
  ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 55 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Price Book');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function bufferToRows(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw Object.assign(new Error('Workbook has no sheets'), { status: 400 });
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  if (!rows.length) throw Object.assign(new Error('Sheet is empty'), { status: 400 });

  // Validate header row
  const header = (rows[0] || []).map((c) => String(c || '').trim().toLowerCase());
  const expected = ['section', 'key', 'name', 'price', 'gov_fee'];
  const ok = expected.every((h, i) => header[i] === h);
  if (!ok) {
    throw Object.assign(
      new Error('Invalid headers. Expected: section, key, name, price, gov_fee'),
      { status: 400 }
    );
  }
  return rows;
}

module.exports = {
  buildPriceBookRows,
  applyPriceBookRows,
  rowsToXlsxBuffer,
  bufferToRows,
  CONFIG_FIELDS,
  B_BAND_ENTITIES,
};
