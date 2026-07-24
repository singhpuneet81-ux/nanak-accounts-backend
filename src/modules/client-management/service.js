const PracticeClient = require('../../models/PracticeClient');
const PracticeGroup = require('../../models/PracticeGroup');
const PracticeSettings = require('../../models/PracticeSettings');
const PracticePayrollOverride = require('../../models/PracticePayrollOverride');
const User = require('../../models/User');
const { formatLongDate, greetingPeriod, monthsSince, dstr, toISO } = require('./dates');
const {
  buildRunsForClients,
  runBucket,
  stpBreaches,
  superBucket,
  filterSuperRuns,
} = require('./payroll');
const { migrateClientManagementV4 } = require('./migrateV4');

const QKEYS = ['q1', 'q2', 'q3', 'q4'];

/** Clients are only "live" when status is Active — the legacy `active` flag is no longer authoritative. */
const ACTIVE = { status: 'Active' };

const EXIT_REASONS = PracticeClient.EXIT_REASONS || [];

/** Runs the v4 backfill at most once per process; callers never wait on it twice. */
let migrationPromise = null;
function ensureV4Migration() {
  if (!migrationPromise) {
    migrationPromise = migrateClientManagementV4().catch((e) => {
      migrationPromise = null;
      throw e;
    });
  }
  return migrationPromise;
}

function isFirmRole(user) {
  return user.role === 'admin' || user.role === 'manager';
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nameMatchRegex(name) {
  return new RegExp(`^${escapeRegex(String(name || '').trim())}$`, 'i');
}

/** Admin can edit any client; staff/manager can edit only clients assigned to them. */
function canEditClient(user, c) {
  if (!user || !c) return false;
  if (user.role === 'admin') return true;
  if (c.managerId && String(c.managerId) === String(user._id)) return true;
  if (user.name && c.managerName && nameMatchRegex(user.name).test(String(c.managerName).trim())) {
    return true;
  }
  return false;
}

/** Resolve client manager from id and/or name so staff scoping by managerId always works. */
async function resolveManager(managerId, managerName) {
  let id = managerId || null;
  let name = String(managerName || '').trim();

  if (id) {
    const u = await User.findById(id).select('_id name').lean();
    if (u) {
      return { managerId: u._id, managerName: u.name };
    }
  }

  if (name) {
    const u = await User.findOne({ name: nameMatchRegex(name), active: true })
      .select('_id name')
      .lean();
    if (u) {
      return { managerId: u._id, managerName: u.name };
    }
  }

  return { managerId: id || null, managerName: name };
}

/** Staff "My Clients" matches by managerId, with name fallback for mis-linked rows. */
function staffAllocationFilter(user) {
  const or = [{ managerId: user._id }];
  if (user.name) {
    or.push({ managerName: nameMatchRegex(user.name) });
  }
  return { $or: or };
}

function actorName(user) {
  return user?.name || 'System';
}

function firstName(user) {
  return String(user?.name || 'there').split(/\s+/)[0];
}

function qIndex(key) {
  return QKEYS.indexOf(key);
}

const ANNUAL_TYPE_BY_STRUCTURE = {
  'Sole Trader': 'ITR',
  Individual: 'ITR', // legacy rows not yet migrated
  Company: 'CTR',
  Trust: 'TTR',
  Partnership: 'PTR',
  SMSF: 'SAR',
};

function annualType(c) {
  const t = typeof c === 'string' ? c : c?.type;
  return ANNUAL_TYPE_BY_STRUCTURE[t] || 'CTR';
}

function normalizeStructure(v) {
  const list = PracticeClient.STRUCTURE_TYPES || [];
  if (v === 'Individual') return 'Sole Trader';
  return list.includes(v) ? v : 'Company';
}

function normalizeSoftware(v) {
  const list = PracticeClient.SOFTWARE_OPTIONS || [];
  return list.includes(v) ? v : '';
}

function normalizeQb(v) {
  return v === 'Connected' ? 'Connected' : 'Not Connected';
}

/**
 * Re-derives the BAS grid when GST is switched.
 * Off: every quarter that isn't already lodged becomes Not Required.
 * On: the current quarter and everything after it becomes Not Completed.
 */
function basForGst(existing, gst, curQ) {
  const base = { q1: 'Not Required', q2: 'Not Required', q3: 'Not Required', q4: 'Not Required' };
  const out = { ...base, ...(existing || {}) };
  const ci = Math.max(0, qIndex(curQ));
  for (let i = 0; i < QKEYS.length; i++) {
    const qk = QKEYS[i];
    if (!gst) {
      if (out[qk] !== 'Completed') out[qk] = 'Not Required';
    } else if (i >= ci && out[qk] === 'Not Required') {
      out[qk] = 'Not Completed';
    }
  }
  return out;
}

function payTrack(c) {
  return c.pkg === 'On Package' && c.fee;
}

function payExpected(c) {
  if (!payTrack(c)) return 0;
  if (c.freq === 'Monthly') return Math.round((c.fee || 0) * 3);
  if (c.freq === 'Annually') return Math.round((c.fee || 0) / 4);
  return c.fee || 0;
}

function payStatus(c, qKey) {
  if (!payTrack(c)) return 'N/A';
  return c.payq?.[qKey] || 'Not Paid';
}

function payOwing(c, curQ) {
  if (!payTrack(c)) return 0;
  const ci = qIndex(curQ);
  let owe = 0;
  for (let i = 0; i <= ci; i++) {
    const st = c.payq?.[QKEYS[i]];
    if (st === 'Not Paid') owe += payExpected(c);
    else if (st === 'Part Paid') owe += Math.round(payExpected(c) / 2);
  }
  return owe;
}

function hasWarn(c) {
  return (c.notes || []).some((n) => n.type === 'warning');
}

function payrollGap(c) {
  if (!c.payroll) return 0;
  return Math.max(0, (c.payrollActual || 0) - (c.payrollBilled || 0));
}

function payrollUnderBilled(c, rate) {
  return payrollGap(c) * rate;
}

function exposure(list, curQ) {
  const out = [];
  for (const c of list) {
    if (!payTrack(c)) continue;
    const ci = qIndex(curQ);
    for (let i = 0; i <= ci; i++) {
      const qk = QKEYS[i];
      const st = c.bas?.[qk];
      const pay = c.payq?.[qk];
      if (st === 'Completed' && pay && pay !== 'Paid') {
        const amt = pay === 'Part Paid' ? Math.round(payExpected(c) / 2) : payExpected(c);
        out.push({
          clientId: String(c._id),
          entity: c.entity,
          managerName: c.managerName,
          quarter: qk,
          amt,
          inv: (c.inv && c.inv[qk]) || null,
          feeStatus: pay,
        });
      }
    }
  }
  return out;
}

const INVOICE_REQUIRED_MESSAGE = 'Not saved - an invoice number is required for every payment';
const PAID_STATUSES = ['Paid', 'Part Paid'];

function normalizeInvoice(v) {
  const s = String(v ?? '').trim();
  return s || null;
}

/** A quarter can only be marked Paid / Part Paid once an invoice number exists for it. */
function assertInvoiceForPayment(payStatusValue, invoiceNo) {
  if (!PAID_STATUSES.includes(payStatusValue)) return;
  if (normalizeInvoice(invoiceNo)) return;
  const err = new Error(INVOICE_REQUIRED_MESSAGE);
  err.status = 400;
  throw err;
}

/** Applies an Active <-> Inactive transition from `body.status` / `body.exit`. Admin only. */
function applyLifecycleChange(user, c, body, today, who) {
  if (body.status === undefined) return;
  const next = body.status === 'Inactive' ? 'Inactive' : 'Active';
  const current = c.status || 'Active';
  if (next === current) return;

  if (user.role !== 'admin') {
    const err = new Error('Only admin can make a client inactive or reactivate them');
    err.status = 403;
    throw err;
  }

  if (next === 'Inactive') {
    const exit = body.exit || {};
    const reason = exit.reason || body.exitReason;
    if (!EXIT_REASONS.includes(reason)) {
      const err = new Error('Not saved - please choose a valid exit reason');
      err.status = 400;
      throw err;
    }
    const detail = String(exit.detail ?? body.exitDetail ?? '').trim();
    if (reason === 'Other' && !detail) {
      const err = new Error('Not saved - please describe the reason when choosing Other');
      err.status = 400;
      throw err;
    }
    c.status = 'Inactive';
    c.active = false;
    c.exit = {
      reason,
      detail: detail || null,
      date: exit.date || today,
      by: who,
      byId: user._id || null,
    };
    c.activity.push({
      date: today,
      who,
      action: `Client made inactive - ${reason}${detail ? `: ${detail}` : ''}`,
    });
    return;
  }

  const prevReason = c.exit?.reason;
  c.status = 'Active';
  c.active = true;
  c.exit = null;
  c.activity.push({
    date: today,
    who,
    action: `Client reactivated${prevReason ? ` (previously inactive - ${prevReason})` : ''}`,
  });
}

async function getSettings() {
  let s = await PracticeSettings.findOne({ singleton: 'default' });
  if (!s) s = await PracticeSettings.create({ singleton: 'default' });
  return s;
}

function todayFromSettings(settings) {
  if (settings.todayOverride) {
    const m = String(settings.todayOverride).match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
    if (m) {
      const months = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };
      const dt = new Date(Number(m[3]), months[m[2]], Number(m[1]));
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }
  return new Date();
}

function curLabel(settings) {
  const q = (settings.quarters || []).find((x) => x.k === settings.currentQuarter);
  return q?.l || settings.currentQuarter;
}

function curDue(settings) {
  const q = (settings.quarters || []).find((x) => x.k === settings.currentQuarter);
  return q?.due || '';
}

/** Every operational view (dashboard, payroll, super, lodgement, fees) is Active-only. */
async function scopeClients(user, extra = {}) {
  const filter = { ...ACTIVE, ...extra };
  if (!isFirmRole(user)) Object.assign(filter, staffAllocationFilter(user));
  return PracticeClient.find(filter).lean();
}

const BAS_STATUSES = ['Completed', 'In Progress', 'Not Completed', 'Not Required'];

/** `status` means Active/Inactive/All; legacy callers passing a BAS status still work. */
function splitStatusQuery(query = {}) {
  const raw = query.status;
  if (BAS_STATUSES.includes(raw)) return { lifecycle: 'Active', bas: raw };
  const bas = BAS_STATUSES.includes(query.bas) ? query.bas : null;
  if (raw === 'All' || raw === 'Inactive' || raw === 'Active') return { lifecycle: raw, bas };
  return { lifecycle: 'Active', bas };
}

function clientFilterQuery(user, query = {}) {
  // Everyone with module access can SEE all clients; editing is gated separately.
  const { lifecycle } = splitStatusQuery(query);
  const filter = {};
  if (lifecycle !== 'All') filter.status = lifecycle;
  if (query.managerId && query.managerId !== 'All') {
    filter.managerId = query.managerId;
  } else if (query.manager && query.manager !== 'All') {
    if (query.manager === 'mine' && user?._id) {
      filter.managerId = user._id;
    } else {
      filter.managerName = nameMatchRegex(query.manager);
    }
  }
  if (query.pkg && query.pkg !== 'All') filter.pkg = query.pkg;
  if (query.type && query.type !== 'All') filter.type = query.type;
  if (query.software && query.software !== 'All') filter.software = query.software;
  if (query.q) {
    filter.$or = [
      { entity: new RegExp(query.q, 'i') },
      { abn: new RegExp(query.q, 'i') },
      { email: new RegExp(query.q, 'i') },
    ];
  }
  return filter;
}

/** Backfill missing managerId from managerName so staff lists stay correct. */
async function repairMissingManagerIds() {
  const orphans = await PracticeClient.find({
    ...ACTIVE,
    managerName: { $nin: [null, ''] },
    $or: [{ managerId: null }, { managerId: { $exists: false } }],
  }).select('_id managerName managerId');

  if (!orphans.length) return 0;

  const users = await User.find({ active: true }).select('_id name').lean();
  const byName = new Map(users.map((u) => [String(u.name).trim().toLowerCase(), u]));

  let fixed = 0;
  for (const c of orphans) {
    const u = byName.get(String(c.managerName).trim().toLowerCase());
    if (!u) continue;
    c.managerId = u._id;
    c.managerName = u.name;
    await c.save();
    fixed++;
  }
  return fixed;
}

function lodgementStats(list, settings) {
  const cur = settings.currentQuarter;
  let onT = 0;
  let late = 0;
  let pend = 0;
  for (const c of list) {
    if (!c.gst) continue;
    for (let i = 0; i < QKEYS.length; i++) {
      const qk = QKEYS[i];
      const st = c.bas?.[qk];
      if (st === 'Completed') {
        if (c.onTime?.[qk] === false) late++;
        else onT++;
      } else if (st !== 'Not Required' && i <= qIndex(cur)) {
        pend++;
      }
    }
  }
  const done = onT + late;
  return {
    onTime: onT,
    late,
    pending: pend,
    done,
    pct: done ? Math.round((onT / done) * 1000) / 10 : 100,
  };
}

async function loadRuns(clients, settings) {
  const today = todayFromSettings(settings);
  const overrides = await PracticePayrollOverride.find({
    clientId: { $in: clients.map((c) => c._id) },
  }).lean();
  const map = {};
  for (const o of overrides) map[`${o.clientId}|${o.payDate}`] = o;
  return { runs: buildRunsForClients(clients, today, map), today };
}

function serializeClient(c) {
  const { office, ...rest } = c;
  const status = c.status || 'Active';
  return {
    ...rest,
    id: String(c._id),
    _id: String(c._id),
    status,
    exit: status === 'Inactive' ? c.exit || null : null,
    software: c.software || '',
    qb: c.qb === 'Connected' ? 'Connected' : 'Not Connected',
    annualType: annualType(c),
    managerId: c.managerId ? String(c.managerId) : null,
    payrollMgrId: c.payrollMgrId ? String(c.payrollMgrId) : null,
    groupId: c.groupId ? String(c.groupId) : null,
    isNew: !!c.isNewClient,
  };
}

async function getMeta(user) {
  await ensureV4Migration();
  const settings = await getSettings();
  const staff = await User.find({ role: { $in: ['staff', 'manager', 'admin'] }, active: true })
    .select('name email role')
    .lean();
  return {
    activeFy: settings.activeFy,
    currentQuarter: settings.currentQuarter,
    currentQuarterLabel: curLabel(settings),
    currentDue: curDue(settings),
    quarters: settings.quarters,
    structures: PracticeClient.STRUCTURE_TYPES || [],
    softwareOptions: (PracticeClient.SOFTWARE_OPTIONS || []).filter(Boolean),
    exitReasons: EXIT_REASONS,
    statuses: ['Active', 'Inactive'],
    reminderTemplate: settings.reminderTemplate,
    onTimeThreshold: settings.onTimeThreshold,
    payrollRate: settings.payrollRate,
    feeReviewMonths: settings.feeReviewMonths,
    isFirm: isFirmRole(user),
    staff: staff.map((s) => ({ _id: String(s._id), name: s.name, role: s.role })),
    today: dstr(todayFromSettings(settings)),
  };
}

async function getDashboard(user) {
  const settings = await getSettings();
  const curQ = settings.currentQuarter;
  const curQL = curLabel(settings);
  const clients = await scopeClients(user);
  const groups = await PracticeGroup.find({ active: true }).lean();
  const rate = settings.payrollRate;
  const threshold = settings.onTimeThreshold;
  const today = todayFromSettings(settings);
  const { runs } = await loadRuns(clients, settings);

  const gst = clients.filter((c) => c.gst);
  let done = 0;
  let prog = 0;
  let notdone = 0;
  for (const c of gst) {
    const st = c.bas?.[curQ];
    if (st === 'Completed') done++;
    else if (st === 'In Progress') prog++;
    else if (st === 'Not Completed') notdone++;
  }
  const appl = done + prog + notdone;
  const pct = appl ? Math.round((done / appl) * 100) : 0;
  const onPkg = clients.filter((c) => c.pkg === 'On Package');
  const mrr = onPkg.reduce((s, c) => s + (c.fee || 0), 0);
  const newCount = clients.filter((c) => c.isNewClient).length;
  const attention = clients.filter((c) => (c.gst && c.bas?.[curQ] === 'Not Completed') || hasWarn(c));
  const odRuns = runs.filter((r) => runBucket(r, today) === 'overdue');
  const stpB = stpBreaches(runs);
  const superPastDeadline = runs.filter((r) => r.superOverdue).length;
  const inactiveClients = await PracticeClient.countDocuments(
    isFirmRole(user) ? { status: 'Inactive' } : { status: 'Inactive', ...staffAllocationFilter(user) }
  );
  const basDue = clients.filter((c) => c.gst && c.bas?.[curQ] === 'Not Completed').length;
  const ex = exposure(clients, curQ);
  const exVal = ex.reduce((t, x) => t + x.amt, 0);
  const pgap = clients.filter((c) => payrollGap(c) > 0);
  const pgapVal = pgap.reduce((t, c) => t + payrollUnderBilled(c, rate), 0);
  const ls = lodgementStats(clients, settings);

  // group conflicts
  const groupMap = {};
  for (const g of groups) groupMap[String(g._id)] = { ...g, managers: new Set(), members: [] };
  for (const c of clients) {
    if (!c.groupId) continue;
    const g = groupMap[String(c.groupId)];
    if (!g) continue;
    g.members.push(c);
    if (c.managerName) g.managers.add(c.managerName);
  }
  const splitGroups = Object.values(groupMap)
    .filter((g) => g.managers.size > 1)
    .map((g) => ({
      id: String(g._id),
      name: g.name,
      managers: [...g.managers],
    }));

  let directorSplits = 0;
  for (const g of Object.values(groupMap)) {
    const ents = g.members.filter((m) => m.type !== 'Individual');
    const inds = g.members.filter((m) => m.type === 'Individual');
    for (const e of ents) {
      for (const i of inds) {
        if (e.managerName !== i.managerName) directorSplits++;
      }
    }
  }

  const pb = clients.filter(payTrack);
  let feesOutstanding = 0;
  let owingCount = 0;
  for (const c of pb) {
    const o = payOwing(c, curQ);
    if (o) {
      feesOutstanding += o;
      owingCount++;
    }
  }
  const notReconciled = pb.filter((c) => !c.recon?.[curQ]).length;
  const feeStale = clients.filter(
    (c) => c.pkg === 'On Package' && c.fee && monthsSince(c.feeReview) >= settings.feeReviewMonths
  );

  const greeting = `Good ${greetingPeriod(new Date())}, ${firstName(user)}`;
  const dateLine = formatLongDate(today);

  if (isFirmRole(user)) {
    // staff stacked bars
    const byManager = {};
    for (const c of clients) {
      if (!c.gst || !c.managerName) continue;
      if (!byManager[c.managerName]) byManager[c.managerName] = { name: c.managerName, d: 0, p: 0, n: 0 };
      const st = c.bas?.[curQ];
      if (st === 'Completed') byManager[c.managerName].d++;
      else if (st === 'In Progress') byManager[c.managerName].p++;
      else if (st === 'Not Completed') byManager[c.managerName].n++;
    }
    const bars = Object.values(byManager)
      .map((r) => ({ ...r, t: r.d + r.p + r.n, short: r.name.split(' ')[0] }))
      .filter((r) => r.t > 0);

    return {
      mode: 'admin',
      greeting,
      dateLine,
      subtitle: `firm-wide view · ${clients.length} active clients`,
      urgent: [
        odRuns.length ? `${odRuns.length} pay runs overdue` : null,
        superPastDeadline ? `${superPastDeadline} super payments past deadline` : null,
        basDue ? `${basDue} BAS outstanding` : null,
        exVal ? `$${exVal.toLocaleString()} billed work unpaid` : null,
      ].filter(Boolean),
      tiles: {
        payRunsOverdue: odRuns.length,
        superPastDeadline,
        basOutstanding: basDue,
        workUnpaid: exVal,
        underBilled: pgapVal,
        stpNotLodged: stpB.length,
        onTimePct: ls.pct,
        familyConflicts: directorSplits,
        newClients: newCount,
      },
      kpis: {
        activeClients: clients.length,
        inactiveClients,
        superPastDeadline,
        newThisMonth: newCount,
        packageRevenue: mrr,
        onPackageCount: onPkg.length,
        basCompletedPct: pct,
        basDone: done,
        basAppl: appl,
        needsAttention: attention.length,
        feesOutstanding,
        owingCount,
        notReconciled,
        onTimePct: ls.pct,
        onTimeThreshold: threshold,
        lateCount: ls.late,
        payrollUnderBilled: pgapVal,
        payrollGapClients: pgap.length,
        feesNotReviewed: feeStale.length,
      },
      progress: { done, prog, notdone, appl, pct, label: curQL, fy: settings.activeFy, due: curDue(settings) },
      bars,
      packageSplit: { onPackage: onPkg.length, nonPackage: clients.length - onPkg.length },
      splitGroups,
      attention: attention.slice(0, 12).map((c) => ({
        id: String(c._id),
        entity: c.entity,
        managerName: c.managerName,
        reasons: [
          c.gst && c.bas?.[curQ] === 'Not Completed' ? `BAS ${curQL} not completed` : null,
          hasWarn(c) ? 'flagged note' : null,
        ].filter(Boolean),
        basStatus: c.bas?.[curQ],
        hasWarn: hasWarn(c),
      })),
      attentionTotal: attention.length,
      exposure: ex.slice(0, 20),
      currentQuarter: curQ,
      currentQuarterLabel: curQL,
    };
  }

  // staff dashboard
  const myEx = exposure(clients, curQ);
  const myExVal = myEx.reduce((t, x) => t + x.amt, 0);
  const dueList = gst.filter((c) => c.bas?.[curQ] === 'Not Completed');
  const progList = gst.filter((c) => c.bas?.[curQ] === 'In Progress');

  return {
    mode: 'staff',
    greeting,
    dateLine,
    subtitle: `${clients.length} active clients`,
    urgent: [
      dueList.length ? `${dueList.length} BAS to start` : null,
      superPastDeadline ? `${superPastDeadline} super payments past deadline` : null,
      myExVal ? `$${myExVal.toLocaleString()} unpaid on work you finished` : null,
    ].filter(Boolean),
    tiles: {
      basNotStarted: dueList.length,
      basInProgress: progList.length,
      superPastDeadline,
      workUnpaid: myExVal,
      underBilled: pgapVal,
      newClients: newCount,
    },
    kpis: {
      myClients: clients.length,
      activeClients: clients.length,
      inactiveClients,
      superPastDeadline,
      newAllocations: newCount,
      basDonePct: pct,
      basDone: done,
      basAppl: appl,
      notCompleted: dueList.length,
      inProgress: progList.length,
      workUnpaid: myExVal,
    },
    worklist: [...dueList, ...progList].slice(0, 15).map((c) => ({
      id: String(c._id),
      entity: c.entity,
      pkg: c.pkg,
      qb: c.qb,
      software: c.software || '',
      basStatus: c.bas?.[curQ],
      hasWarn: hasWarn(c),
    })),
    exposure: myEx.slice(0, 20),
    currentQuarter: curQ,
    currentQuarterLabel: curQL,
  };
}

async function listClients(user, query = {}) {
  await ensureV4Migration();
  // Heal rows that have a manager name but no managerId (common after CSV / partial assigns)
  await repairMissingManagerIds();
  const settings = await getSettings();
  const { lifecycle, bas } = splitStatusQuery(query);
  const filter = clientFilterQuery(user, query);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
  let list = await PracticeClient.find(filter).sort({ entity: 1 }).lean();
  if (bas) {
    const curQ = settings.currentQuarter;
    list = list.filter((c) => c.bas?.[curQ] === bas);
  }
  const total = list.length;
  const items = list.slice((page - 1) * limit, page * limit).map((c) => ({
    ...serializeClient(c),
    canEdit: canEditClient(user, c),
    isMine: canEditClient(user, c) && user.role !== 'admin',
  }));
  const [activeCount, inactiveCount] = await Promise.all([
    PracticeClient.countDocuments({ status: 'Active' }),
    PracticeClient.countDocuments({ status: 'Inactive' }),
  ]);
  return {
    items,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
    status: lifecycle,
    counts: { active: activeCount, inactive: inactiveCount, all: activeCount + inactiveCount },
    currentQuarter: settings.currentQuarter,
    currentQuarterLabel: curLabel(settings),
  };
}

async function getClient(user, id) {
  const c = await PracticeClient.findById(id).lean();
  if (!c) {
    const err = new Error('Client not found');
    err.status = 404;
    throw err;
  }
  // All roles can view any client (including Inactive); editing is gated by canEdit.
  const settings = await getSettings();
  let group = null;
  let members = [];
  if (c.groupId) {
    group = await PracticeGroup.findById(c.groupId).lean();
    members = await PracticeClient.find({ groupId: c.groupId, ...ACTIVE }).lean();
  }
  const { runs } = await loadRuns([c], settings);
  const canEdit = canEditClient(user, c);
  return {
    client: { ...serializeClient(c), canEdit },
    group: group ? { id: String(group._id), name: group.name } : null,
    members: members.map(serializeClient),
    runs: runs.slice(0, 12),
    meta: {
      currentQuarter: settings.currentQuarter,
      currentQuarterLabel: curLabel(settings),
      quarters: settings.quarters,
      annualType: annualType(c),
      exitReasons: EXIT_REASONS,
      feeOverdue: c.pkg === 'On Package' && monthsSince(c.feeReview) >= settings.feeReviewMonths,
      payrollGap: payrollGap(c),
      payrollUnderBilled: payrollUnderBilled(c, settings.payrollRate),
      owing: payOwing(c, settings.currentQuarter),
      canEdit,
    },
  };
}

async function createClient(user, body) {
  if (user.role !== 'admin') {
    const err = new Error('Only admin can add clients and assign them to staff/managers');
    err.status = 403;
    throw err;
  }
  const settings = await getSettings();
  const curQ = settings.currentQuarter;
  const today = dstr(todayFromSettings(settings));
  const resolved = await resolveManager(body.managerId, body.managerName);
  const managerId = resolved.managerId;
  const managerName = resolved.managerName;
  if (!managerId) {
    const err = new Error('Client manager is required — pick a team member');
    err.status = 400;
    throw err;
  }
  const gst = !!body.gst;
  const type = normalizeStructure(body.type);
  const bas = basForGst(null, gst, curQ);
  const payroll = !!body.payroll;
  const doc = await PracticeClient.create({
    entity: String(body.entity || '').trim().toUpperCase(),
    abn: body.abn || '',
    type,
    status: 'Active',
    exit: null,
    software: normalizeSoftware(body.software),
    pkg: body.pkg || 'Non Package',
    fee: body.pkg === 'On Package' ? Number(body.fee) || 0 : null,
    freq: body.pkg === 'On Package' ? body.freq || 'Monthly' : null,
    pay: body.pkg === 'On Package' ? 'Pay Advantage' : null,
    gst,
    payroll,
    qb: normalizeQb(body.qb),
    email: body.email || '',
    phone: body.phone || '',
    managerId,
    managerName,
    payrollMgrId: payroll ? body.payrollMgrId || managerId : null,
    payrollMgr: payroll ? body.payrollMgr || managerName : null,
    groupId: body.groupId || null,
    bas,
    annual: 'Not Started',
    payq: { q1: 'Not Paid', q2: 'Not Paid', q3: 'Not Paid', q4: 'Not Paid' },
    feeReview: today,
    payrollBilled: payroll ? Number(body.payrollBilled) || 0 : 0,
    payrollActual: payroll ? Number(body.payrollActual) || Number(body.payrollBilled) || 0 : 0,
    payrollFreq: payroll ? body.payrollFreq || 'Fortnightly' : null,
    payFirstDate: payroll ? body.payFirstDate || null : null,
    payLag: body.payLag ?? 3,
    isNewClient: true,
    notes: body.note
      ? [{ type: 'info', text: body.note, author: actorName(user), date: today }]
      : [],
    activity: [
      {
        date: today,
        who: actorName(user),
        action: `Client added as ${type} (${annualType({ type })}) and allocated to ${managerName || 'unassigned'}`,
      },
    ],
  });
  return serializeClient(doc.toObject());
}

async function updateClient(user, id, body) {
  const c = await PracticeClient.findById(id);
  if (!c) {
    const err = new Error('Client not found');
    err.status = 404;
    throw err;
  }
  if (!canEditClient(user, c)) {
    const err = new Error('You can view this client but only edit clients assigned to you');
    err.status = 403;
    throw err;
  }
  const settings = await getSettings();
  const curQ = settings.currentQuarter;
  const today = dstr(todayFromSettings(settings));
  const who = actorName(user);

  const prevGst = !!c.gst;
  const prevPayroll = !!c.payroll;
  const prevType = c.type;

  const allowed = [
    'entity', 'abn', 'pkg', 'fee', 'freq', 'gst', 'payroll',
    'email', 'phone', 'annual', 'feeReview', 'payrollBilled', 'payrollActual',
    'payrollFreq', 'payFirstDate', 'payLag', 'payrollMgr', 'payrollMgrId', 'relLabel', 'isNewClient',
  ];
  for (const k of allowed) {
    if (body[k] !== undefined) c[k] = body[k];
  }
  if (body.type !== undefined) c.type = normalizeStructure(body.type);
  if (body.software !== undefined) c.software = normalizeSoftware(body.software);
  if (body.qb !== undefined) c.qb = normalizeQb(body.qb);

  applyLifecycleChange(user, c, body, today, who);

  if (body.gst !== undefined && !!c.gst !== prevGst) {
    c.bas = basForGst(c.bas ? c.bas.toObject?.() || c.bas : null, !!c.gst, curQ);
    c.markModified('bas');
    c.activity.push({
      date: today,
      who,
      action: c.gst
        ? 'GST registered - BAS created for the remaining quarters'
        : 'GST deregistered - outstanding BAS set to Not Required',
    });
  }

  if (body.payroll !== undefined && !!c.payroll !== prevPayroll) {
    if (c.payroll) {
      if (!c.payrollFreq) c.payrollFreq = body.payrollFreq || 'Fortnightly';
      if (!c.payrollMgr) {
        c.payrollMgr = body.payrollMgr || c.managerName || null;
        c.payrollMgrId = body.payrollMgrId || c.payrollMgrId || c.managerId || null;
      }
      c.activity.push({
        date: today,
        who,
        action: `Payroll service turned on (${c.payrollFreq}, ${c.payrollMgr || 'unassigned'})`,
      });
    } else {
      c.activity.push({ date: today, who, action: 'Payroll service turned off' });
    }
  }

  if (body.type !== undefined && c.type !== prevType) {
    c.activity.push({
      date: today,
      who,
      action: `Structure changed from ${prevType} to ${c.type} - annual return is now ${annualType(c)}`,
    });
  }

  if ((body.managerId !== undefined || body.managerName !== undefined) && user.role === 'admin') {
    const resolved = await resolveManager(
      body.managerId !== undefined ? body.managerId : c.managerId,
      body.managerName !== undefined ? body.managerName : c.managerName
    );
    if (!resolved.managerId) {
      const err = new Error('Client manager is required — pick a team member');
      err.status = 400;
      throw err;
    }
    const prev = c.managerName || 'unassigned';
    c.managerId = resolved.managerId;
    c.managerName = resolved.managerName;
    if (String(prev) !== String(c.managerName) || body.managerId !== undefined) {
      c.activity.push({ date: today, who, action: `Reallocated to ${c.managerName}` });
    }
  } else if ((body.managerId !== undefined || body.managerName !== undefined) && user.role !== 'admin') {
    const err = new Error('Only admin can assign clients to staff/managers');
    err.status = 403;
    throw err;
  }
  if (body.bas && typeof body.bas === 'object') {
    for (const qk of QKEYS) {
      if (body.bas[qk] !== undefined) {
        c.bas[qk] = body.bas[qk];
        c.markModified('bas');
        c.activity.push({ date: today, who, action: `BAS ${qk} set to ${body.bas[qk]}` });
      }
    }
  }
  // Invoice numbers are applied first so a payment + its invoice can arrive in one request.
  const mergedInv = { ...(c.inv || {}) };
  if (body.inv && typeof body.inv === 'object') {
    for (const qk of QKEYS) {
      if (body.inv[qk] !== undefined) mergedInv[qk] = normalizeInvoice(body.inv[qk]);
    }
  }
  if (body.payq && typeof body.payq === 'object') {
    for (const qk of QKEYS) {
      if (body.payq[qk] !== undefined) assertInvoiceForPayment(body.payq[qk], mergedInv[qk]);
    }
  }
  if (body.inv && typeof body.inv === 'object') {
    c.inv = mergedInv;
    c.markModified('inv');
  }
  if (body.payq && typeof body.payq === 'object') {
    for (const qk of QKEYS) {
      if (body.payq[qk] !== undefined) {
        c.payq[qk] = body.payq[qk];
        c.markModified('payq');
        const invRef = mergedInv[qk] ? ` (invoice ${mergedInv[qk]})` : '';
        c.activity.push({ date: today, who, action: `Payment ${qk} set to ${body.payq[qk]}${invRef}` });
      }
    }
  }
  if (body.note) {
    c.notes.push({
      type: body.noteType === 'warning' ? 'warning' : 'info',
      text: body.note,
      author: who,
      date: today,
    });
  }
  if (body.groupId !== undefined && user.role === 'admin') {
    c.groupId = body.groupId || null;
  }
  await c.save();
  return { ...serializeClient(c.toObject()), canEdit: true };
}

async function getAllocation(user) {
  if (!isFirmRole(user)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  const settings = await getSettings();
  const curQ = settings.currentQuarter;
  const clients = await PracticeClient.find(ACTIVE).lean();
  const by = {};
  for (const c of clients) {
    const key = c.managerName || 'Unassigned';
    if (!by[key]) by[key] = { managerName: key, managerId: c.managerId ? String(c.managerId) : null, clients: 0, onPackage: 0, fees: 0, basOutstanding: 0 };
    by[key].clients++;
    if (c.pkg === 'On Package') {
      by[key].onPackage++;
      by[key].fees += c.fee || 0;
    }
    if (c.gst && c.bas?.[curQ] === 'Not Completed') by[key].basOutstanding++;
  }
  return { rows: Object.values(by).sort((a, b) => b.clients - a.clients), currentQuarterLabel: curLabel(settings) };
}

async function listGroups(user) {
  if (!isFirmRole(user)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  const settings = await getSettings();
  const groups = await PracticeGroup.find({ active: true }).lean();
  const clients = await PracticeClient.find({ ...ACTIVE, groupId: { $ne: null } }).lean();
  const rows = groups.map((g) => {
    const ms = clients.filter((c) => String(c.groupId) === String(g._id));
    const managers = [...new Set(ms.map((m) => m.managerName).filter(Boolean))];
    const fees = ms.filter((m) => m.pkg === 'On Package').reduce((s, m) => s + (m.fee || 0), 0);
    const basOut = ms.filter((m) => m.gst && m.bas?.[settings.currentQuarter] === 'Not Completed').length;
    const gaps = [];
    const ents = ms.filter((m) => m.type !== 'Individual');
    const inds = ms.filter((m) => m.type === 'Individual');
    if (inds.length === 0) gaps.push('No individual returns');
    else if (inds.filter((i) => i.annual !== 'Not Required').length === 0) gaps.push('Individual returns not with us');
    if (ents.filter((e) => e.pkg === 'On Package').length === 0 && ents.length) gaps.push('No entity on a package');
    if (ents.filter((e) => e.payroll).length === 0 && ents.length) gaps.push('No payroll service');
    if (ms.filter((m) => m.type === 'Trust').length === 0) gaps.push('No trust structure');
    return {
      id: String(g._id),
      name: g.name,
      clients: ms.length,
      types: [...new Set(ms.map((m) => m.type))],
      managers,
      split: managers.length > 1,
      gaps,
      fees,
      basOutstanding: basOut,
      members: ms.map(serializeClient),
    };
  });
  return { rows, currentQuarterLabel: curLabel(settings) };
}

async function createGroup(user, body) {
  if (!isFirmRole(user)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  const g = await PracticeGroup.create({ name: String(body.name || '').trim() });
  return { id: String(g._id), name: g.name };
}

async function getPayments(user, query = {}) {
  const settings = await getSettings();
  const curQ = settings.currentQuarter;
  let clients = await scopeClients(user, { pkg: 'On Package' });
  const f = query.filter || 'all';
  clients = clients.filter((c) => {
    if (f === 'unpaid') return payStatus(c, curQ) !== 'Paid';
    if (f === 'due') return payStatus(c, curQ) === 'Due' || payStatus(c, curQ) === 'Not Paid';
    if (f === 'overdue') {
      const st = payStatus(c, curQ);
      return st === 'Not Paid' || st === 'Part Paid';
    }
    if (f === 'unreconciled') return !c.recon?.[curQ];
    return true;
  });
  let collected = 0;
  let expected = 0;
  for (const c of clients) {
    expected += payExpected(c);
    const st = payStatus(c, curQ);
    if (st === 'Paid') collected += payExpected(c);
    else if (st === 'Part Paid') collected += Math.round(payExpected(c) / 2);
  }
  const feeStale = (await scopeClients(user)).filter(
    (c) => c.pkg === 'On Package' && c.fee && monthsSince(c.feeReview) >= settings.feeReviewMonths
  );
  return {
    isFirm: isFirmRole(user),
    currentQuarter: curQ,
    currentQuarterLabel: curLabel(settings),
    quarters: settings.quarters,
    filter: f,
    kpis: {
      collected,
      expected,
      outstanding: expected - collected,
      unreconciled: clients.filter((c) => !c.recon?.[curQ]).length,
      staleFees: feeStale.length,
      staleFeeTotal: feeStale.reduce((s, c) => s + (c.fee || 0), 0),
    },
    items: clients.slice(0, 80).map((c) => ({
      ...serializeClient(c),
      owing: payOwing(c, curQ),
      expectedQ: payExpected(c),
      payStatuses: Object.fromEntries(QKEYS.map((k) => [k, payStatus(c, k)])),
      invoice: (c.inv && c.inv[curQ]) || null,
      lastRecon: c.recon?.[curQ] || null,
      feeOverdue: monthsSince(c.feeReview) >= settings.feeReviewMonths,
    })),
    stale: feeStale.slice(0, 40).map(serializeClient),
    exposure: exposure(await scopeClients(user), curQ).slice(0, 40),
  };
}

/** Pay runs are only generated for Active clients that actually have payroll switched on. */
async function loadPayrollRuns(user) {
  const settings = await getSettings();
  const clients = await scopeClients(user, { payroll: true });
  const { runs, today } = await loadRuns(clients, settings);
  let list = runs;
  if (!isFirmRole(user)) {
    list = runs.filter(
      (r) =>
        r.payrollMgr === user.name ||
        clients.some(
          (c) =>
            String(c._id) === r.clientId &&
            (String(c.managerId) === String(user._id) ||
              (c.managerName && nameMatchRegex(user.name).test(String(c.managerName).trim())))
        )
    );
  }
  return { settings, clients, runs: list, today };
}

async function getPayroll(user, query = {}) {
  const { runs: list, today } = await loadPayrollRuns(user);
  const f = query.filter || 'action';
  const filtered = list.filter((r) => {
    const b = runBucket(r, today);
    if (f === 'action') return b === 'overdue' || b === 'week';
    if (f === 'overdue') return b === 'overdue';
    if (f === 'week') return b === 'week';
    if (f === 'upcoming') return b === 'upcoming';
    if (f === 'done') return b === 'done';
    if (f === 'stp') return r.status === 'Completed' && r.stp === 'Not Lodged';
    return true;
  });
  return {
    isFirm: isFirmRole(user),
    today: dstr(today),
    filter: f,
    counts: {
      overdue: list.filter((r) => runBucket(r, today) === 'overdue').length,
      week: list.filter((r) => runBucket(r, today) === 'week').length,
      upcoming: list.filter((r) => runBucket(r, today) === 'upcoming').length,
      done: list.filter((r) => runBucket(r, today) === 'done').length,
      stp: stpBreaches(list).length,
    },
    items: filtered.slice(0, 80),
  };
}

/** Payday Super view: one row per pay run with its super deadline (pay date + 7 days). */
async function getSuper(user, query = {}) {
  const { runs, today } = await loadPayrollRuns(user);
  const f = query.filter || 'action';
  const items = filterSuperRuns(runs, f);
  const unpaid = runs.filter((r) => r.super !== 'Paid');
  const overdue = runs.filter((r) => r.superOverdue);
  const dueToday = unpaid.filter((r) => r.superWhen === 'today');
  const dueWeek = unpaid.filter((r) => r.superWhen === 'week');
  const paid = runs.filter((r) => r.super === 'Paid');
  return {
    isFirm: isFirmRole(user),
    today: dstr(today),
    filter: f,
    counts: {
      action: overdue.length + dueToday.length + dueWeek.length,
      overdue: overdue.length,
      today: dueToday.length,
      week: dueWeek.length,
      paid: paid.length,
      all: runs.length,
    },
    kpis: {
      totalRuns: runs.length,
      superPaid: paid.length,
      superUnpaid: unpaid.length,
      pastDeadline: overdue.length,
      dueToday: dueToday.length,
      dueThisWeek: dueWeek.length,
      clientsAtRisk: new Set(overdue.map((r) => r.clientId)).size,
      onTimePct: runs.length
        ? Math.round(((runs.length - overdue.length) / runs.length) * 1000) / 10
        : 100,
    },
    items: items.slice(0, 80).map((r) => ({ ...r, bucket: superBucket(r) })),
  };
}

async function updatePayrollRun(user, body) {
  const { clientId, payDate, status, stp } = body;
  const c = await PracticeClient.findById(clientId);
  if (!c) {
    const err = new Error('Client not found');
    err.status = 404;
    throw err;
  }
  const can =
    isFirmRole(user) ||
    c.payrollMgr === user.name ||
    String(c.payrollMgrId) === String(user._id) ||
    String(c.managerId) === String(user._id);
  if (!can) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  const settings = await getSettings();
  const today = dstr(todayFromSettings(settings));
  const existing = await PracticePayrollOverride.findOne({ clientId, payDate }).lean();
  const superOnly = body.super !== undefined && status === undefined && stp === undefined;
  const superStatus =
    body.super === 'Paid' ? 'Paid' : body.super === 'Not Paid' ? 'Not Paid' : existing?.super || 'Not Paid';
  const update = {
    status: status !== undefined ? status : existing?.status || (superOnly ? 'Not Started' : 'Completed'),
    stp: stp !== undefined ? stp : existing?.stp || (superOnly ? 'Not Lodged' : 'Lodged'),
    super: superStatus,
    employees: existing?.employees ?? (c.payrollActual || c.payrollBilled),
    by: actorName(user),
    on: today,
  };
  await PracticePayrollOverride.findOneAndUpdate(
    { clientId, payDate },
    { $set: update },
    { upsert: true, new: true }
  );
  c.activity.push({
    date: today,
    who: actorName(user),
    action: superOnly
      ? `Super for pay run ${payDate} marked ${update.super}`
      : `Payroll run ${payDate} marked ${update.status} / STP ${update.stp} / Super ${update.super}`,
  });
  await c.save();
  return { ok: true };
}

async function getLodgement(user) {
  if (!isFirmRole(user)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  const settings = await getSettings();
  const threshold = settings.onTimeThreshold;
  const clients = await PracticeClient.find(ACTIVE).lean();
  const ls = lodgementStats(clients, settings);

  const managerNames = [...new Set(clients.map((c) => c.managerName || 'Unassigned'))];
  const byManager = managerNames
    .map((name) => {
      const list = clients.filter((c) => (c.managerName || 'Unassigned') === name);
      const stats = lodgementStats(list, settings);
      return {
        managerName: name,
        managerId: list.find((c) => c.managerId)?.managerId
          ? String(list.find((c) => c.managerId).managerId)
          : null,
        ...stats,
        clients: list.length,
        belowThreshold: stats.done > 0 && stats.pct < threshold,
      };
    })
    .sort((a, b) => a.pct - b.pct);

  const late = [];
  for (const c of clients) {
    for (const q of settings.quarters || []) {
      if (c.bas?.[q.k] === 'Completed' && c.onTime?.[q.k] === false) {
        late.push({
          clientId: String(c._id),
          entity: c.entity,
          managerName: c.managerName,
          quarter: q.l,
          lodged: c.lodged?.[q.k] || '-',
        });
      }
    }
  }
  return {
    stats: { ...ls, belowThreshold: ls.done > 0 && ls.pct < threshold },
    threshold,
    byManager,
    flagged: byManager.filter((m) => m.belowThreshold),
    late: late.slice(0, 50),
    currentQuarterLabel: curLabel(settings),
  };
}

async function getReminders(user) {
  const settings = await getSettings();
  const curQ = settings.currentQuarter;
  const curQL = curLabel(settings);
  const clients = (await scopeClients(user)).filter(
    (c) => c.gst && c.bas?.[curQ] === 'Not Completed'
  );
  return {
    currentQuarterLabel: curQL,
    template: settings.reminderTemplate,
    items: clients.map((c) => ({
      ...serializeClient(c),
      message: settings.reminderTemplate
        .split('{name}')
        .join(c.entity)
        .split('{quarter}')
        .join(curQL),
    })),
  };
}

async function exportReminders(user, body) {
  const settings = await getSettings();
  const curQL = curLabel(settings);
  const today = dstr(todayFromSettings(settings));
  const ids = body.ids || [];
  const kind = body.kind === 'email' ? 'email' : 'sms';
  const clients = await PracticeClient.find({ _id: { $in: ids }, ...ACTIVE }).lean();
  const scoped = clients.filter((c) => isFirmRole(user) || String(c.managerId) === String(user._id));
  const rows = [];
  for (const c of scoped) {
    const msg = (body.template || settings.reminderTemplate)
      .split('{name}')
      .join(c.entity)
      .split('{quarter}')
      .join(curQL);
    if (kind === 'sms') rows.push([c.phone.replace(/\s/g, ''), c.entity, msg]);
    else rows.push([c.email, c.entity, msg]);
    await PracticeClient.updateOne(
      { _id: c._id },
      {
        $push: {
          activity: {
            date: today,
            who: actorName(user),
            action: `Included in BAS ${curQL} ${kind === 'sms' ? 'SMS' : 'email'} reminder export`,
          },
        },
      }
    );
  }
  const header = kind === 'sms' ? 'phone,name,message' : 'email,name,message';
  const csv = [header, ...rows.map((r) => r.map((x) => `"${String(x || '').replace(/"/g, '""')}"`).join(','))].join('\n');
  return { csv, filename: `nanak-bas-reminders-${kind}-${curQL.replace(/\s/g, '')}.csv`, count: rows.length };
}

async function startFY(user, body) {
  if (!isFirmRole(user) || user.role !== 'admin') {
    const err = new Error('Admin only');
    err.status = 403;
    throw err;
  }
  const settings = await getSettings();
  const nextFy = body.fy || (() => {
    const [a, b] = settings.activeFy.split('-').map((x) => Number(x.length === 2 ? `20${x}` : x) || Number(x));
    const start = a < 100 ? 2000 + a : a;
    return `${String(start + 1).slice(-2)}-${String(start + 2).slice(-2)}`;
  })();
  const today = dstr(todayFromSettings(settings));
  const clients = await PracticeClient.find(ACTIVE);
  for (const c of clients) {
    c.history.push({
      fy: settings.activeFy,
      annual: c.annual,
      q: (settings.quarters || []).map((q) => ({
        l: q.l,
        s: c.bas?.[q.k],
        p: c.payq?.[q.k],
        i: c.inv?.[q.k] || null,
      })),
    });
    c.bas = {
      q1: c.gst ? 'Not Completed' : 'Not Required',
      q2: 'Not Required',
      q3: 'Not Required',
      q4: 'Not Required',
    };
    c.payq = { q1: 'Not Paid', q2: 'Not Paid', q3: 'Not Paid', q4: 'Not Paid' };
    c.inv = {};
    c.recon = {};
    c.annual = 'Not Started';
    c.activity.push({
      date: today,
      who: 'System',
      action: `Financial year ${nextFy} opened by admin`,
    });
    c.markModified('bas');
    c.markModified('payq');
    c.markModified('inv');
    c.markModified('recon');
    await c.save();
  }
  settings.activeFy = nextFy;
  settings.currentQuarter = 'q1';
  // roll quarter labels roughly
  const y = Number(String(nextFy).split('-')[0]);
  const yy = y < 100 ? 2000 + y : y;
  settings.quarters = [
    { k: 'q1', l: `Sep ${String(yy).slice(-2)}`, due: `28 Oct ${yy}` },
    { k: 'q2', l: `Dec ${String(yy).slice(-2)}`, due: `28 Feb ${yy + 1}` },
    { k: 'q3', l: `Mar ${String(yy + 1).slice(-2)}`, due: `28 Apr ${yy + 1}` },
    { k: 'q4', l: `Jun ${String(yy + 1).slice(-2)}`, due: `28 Jul ${yy + 1}` },
  ];
  await settings.save();
  return getMeta(user);
}

async function advanceQuarter(user, body) {
  if (!isFirmRole(user)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  const settings = await getSettings();
  const qKey = body.quarter || settings.currentQuarter;
  await PracticeClient.updateMany(
    { ...ACTIVE, gst: true, [`bas.${qKey}`]: 'Not Required' },
    { $set: { [`bas.${qKey}`]: 'Not Completed' } }
  );
  settings.currentQuarter = qKey;
  await settings.save();
  return getMeta(user);
}

async function importClients(user, body) {
  if (user.role !== 'admin') {
    const err = new Error('Only admin can import clients');
    err.status = 403;
    throw err;
  }
  const rows = body.rows || [];
  const created = [];
  for (const row of rows) {
    try {
      const c = await createClient(user, row);
      created.push(c);
    } catch {
      /* skip bad rows */
    }
  }
  return { created: created.length, items: created };
}

async function exportClients(user) {
  const clients = await scopeClients(user);
  const header = [
    'entity', 'abn', 'type', 'annualType', 'status', 'manager', 'package', 'fee', 'gst', 'payroll',
    'software', 'quickbooks', 'email', 'phone',
  ];
  const lines = [header.join(',')];
  for (const c of clients) {
    lines.push(
      [
        c.entity, c.abn, c.type, annualType(c), c.status || 'Active', c.managerName, c.pkg,
        c.fee || '', c.gst, c.payroll, c.software || '', c.qb, c.email, c.phone,
      ]
        .map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
  }
  return { csv: lines.join('\n'), filename: 'nanak-clients-export.csv', count: clients.length };
}

async function applyFeeUplift(user, body) {
  if (!isFirmRole(user)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  const pct = Number(body.pct) || 5;
  const onlyStale = !!body.onlyStale;
  const settings = await getSettings();
  const today = dstr(todayFromSettings(settings));
  let clients = await PracticeClient.find({ ...ACTIVE, pkg: 'On Package' });
  if (onlyStale) {
    clients = clients.filter((c) => monthsSince(c.feeReview) >= settings.feeReviewMonths);
  }
  let n = 0;
  for (const c of clients) {
    c.fee = Math.round((c.fee || 0) * (1 + pct / 100));
    c.feeReview = today;
    c.activity.push({ date: today, who: actorName(user), action: `Fee uplifted by ${pct}% to $${c.fee}` });
    await c.save();
    n++;
  }
  return { updated: n };
}

async function reconcileXero(user, body) {
  if (!isFirmRole(user)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  const settings = await getSettings();
  const curQ = settings.currentQuarter;
  const today = dstr(todayFromSettings(settings));
  const rows = body.rows || [];
  let n = 0;
  const skipped = [];
  for (const row of rows) {
    const abn = String(row.abn || '').replace(/\s/g, '');
    const name = String(row.contact || row.entity || '').toUpperCase();
    const amount = Number(row.amount) || 0;
    let c = null;
    if (abn) c = await PracticeClient.findOne({ ...ACTIVE, abn: new RegExp(abn.replace(/(\d)/g, '$1\\s*')) });
    if (!c && name) c = await PracticeClient.findOne({ ...ACTIVE, entity: name });
    if (!c) continue;
    const expected = payExpected(c);
    let result = 'Not Paid';
    if (amount >= expected) result = 'Paid';
    else if (amount > 0) result = 'Part Paid';
    const invoice =
      normalizeInvoice(row.invoice || row.invoiceNo || row.invoiceNumber) ||
      normalizeInvoice(c.inv?.[curQ]);
    if (PAID_STATUSES.includes(result) && !invoice) {
      skipped.push({ entity: c.entity, reason: INVOICE_REQUIRED_MESSAGE });
      continue;
    }
    c.payq[curQ] = result;
    if (invoice) {
      c.inv = { ...(c.inv || {}), [curQ]: invoice };
      c.markModified('inv');
    }
    c.recon[curQ] = { date: today, by: actorName(user), amount, invoice: invoice || null, src: 'Xero' };
    c.markModified('payq');
    c.markModified('recon');
    c.activity.push({
      date: today,
      who: actorName(user),
      action: `Payment reconciled against Xero for ${curLabel(settings)}: ${result} ($${amount} received)${
        invoice ? ` against invoice ${invoice}` : ''
      }`,
    });
    await c.save();
    n++;
  }
  return { reconciled: n, skipped };
}

module.exports = {
  getMeta,
  getDashboard,
  listClients,
  getClient,
  createClient,
  updateClient,
  getAllocation,
  listGroups,
  createGroup,
  getPayments,
  getPayroll,
  getSuper,
  updatePayrollRun,
  getLodgement,
  getReminders,
  exportReminders,
  startFY,
  advanceQuarter,
  importClients,
  exportClients,
  applyFeeUplift,
  reconcileXero,
  getSettings,
  isFirmRole,
  canEditClient,
  serializeClient,
  scopeClients,
  payExpected,
  payOwing,
  exposure,
  lodgementStats,
  curLabel,
  todayFromSettings,
  actorName,
  annualType,
  basForGst,
  normalizeStructure,
  normalizeSoftware,
  normalizeQb,
  assertInvoiceForPayment,
  ensureV4Migration,
  ACTIVE,
  INVOICE_REQUIRED_MESSAGE,
  EXIT_REASONS,
};
