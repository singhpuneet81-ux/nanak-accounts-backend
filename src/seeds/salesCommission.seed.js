/**
 * Seed Sales & Commission Hub demo data (FY 2026-27).
 * Usage: node src/seeds/salesCommission.seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const SalesClient = require('../models/SalesClient');
const SalesDeal = require('../models/SalesDeal');
const SalesPayment = require('../models/SalesPayment');
const SalesLedgerEntry = require('../models/SalesLedgerEntry');
const SalesPayoutBatch = require('../models/SalesPayoutBatch');
const SalesPayoutItem = require('../models/SalesPayoutItem');
const SalesClawbackCase = require('../models/SalesClawbackCase');
const SalesCommissionQuery = require('../models/SalesCommissionQuery');
const SalesCommissionPlan = require('../models/SalesCommissionPlan');
const SalesTarget = require('../models/SalesTarget');
const SalesSettings = require('../models/SalesSettings');
const SalesAuditLog = require('../models/SalesAuditLog');
const ENG = require('../modules/sales-commission/engine');
const { addDays } = require('../modules/sales-commission/dates');

const DEFAULT_PASSWORD = process.env.SALES_SEED_PASSWORD || 'Nanak@2026';

async function upsertUser({ name, email, role, office, commissionEligible, managerId }) {
  let u = await User.findOne({ email: email.toLowerCase() });
  if (!u) {
    u = new User({
      name,
      email: email.toLowerCase(),
      password: DEFAULT_PASSWORD,
      role,
      office,
      commissionEligible: !!commissionEligible,
      managerId: managerId || null,
      active: true,
    });
    await u.save();
  } else {
    u.name = name;
    u.role = role;
    u.office = office;
    u.commissionEligible = !!commissionEligible;
    if (managerId) u.managerId = managerId;
    u.active = true;
    await u.save();
  }
  return u;
}

async function clearSalesCollections() {
  await Promise.all([
    SalesClient.deleteMany({}),
    SalesDeal.deleteMany({}),
    SalesPayment.deleteMany({}),
    SalesLedgerEntry.deleteMany({}),
    SalesPayoutBatch.deleteMany({}),
    SalesPayoutItem.deleteMany({}),
    SalesClawbackCase.deleteMany({}),
    SalesCommissionQuery.deleteMany({}),
    SalesTarget.deleteMany({}),
    SalesAuditLog.deleteMany({}),
  ]);
}

async function seed() {
  await connectDB();
  console.log('Seeding Sales & Commission Hub...');

  await SalesSettings.findOneAndUpdate(
    { key: 'default' },
    {
      key: 'default',
      retentionDays: 183,
      firstYearMonths: 12,
      payoutFrequency: 'quarterly',
      fxRate: 65,
      reportFY: '2026-27',
      demoToday: '2027-02-10',
    },
    { upsert: true, new: true }
  );

  await SalesCommissionPlan.deleteMany({});
  await SalesCommissionPlan.create({
    rate: 0.01,
    effectiveDate: '2026-07-01',
    reason: 'India sales flat 1%',
  });

  const puneet = await upsertUser({
    name: 'Puneet Nanak',
    email: 'puneet@nanakaccountants.com.au',
    role: 'admin',
    office: 'Australia',
    commissionEligible: false,
  });
  const rohit = await upsertUser({
    name: 'Rohit Sharma',
    email: 'rohit@nanakaccountants.com.au',
    role: 'manager',
    office: 'Australia',
    commissionEligible: false,
  });
  const shweta = await upsertUser({
    name: 'Shweta Sharma',
    email: 'shweta@nanakaccountants.com.au',
    role: 'staff',
    office: 'India',
    commissionEligible: true,
    managerId: rohit._id,
  });
  const mahima = await upsertUser({
    name: 'Mahima Saproo',
    email: 'mahima@nanakaccountants.com.au',
    role: 'staff',
    office: 'India',
    commissionEligible: true,
    managerId: rohit._id,
  });
  const nishant = await upsertUser({
    name: 'Nishant Sethi',
    email: 'nishant@nanakaccountants.com.au',
    role: 'staff',
    office: 'India',
    commissionEligible: true,
    managerId: rohit._id,
  });

  await clearSalesCollections();

  await SalesTarget.insertMany([
    { userId: shweta._id, fy: '2026-27', amountCents: 6000000, effectiveDate: '2026-07-01', reason: 'Annual target', changedBy: puneet._id },
    { userId: mahima._id, fy: '2026-27', amountCents: 4000000, effectiveDate: '2026-07-01', reason: 'Annual target', changedBy: puneet._id },
    { userId: nishant._id, fy: '2026-27', amountCents: 4000000, effectiveDate: '2026-07-01', reason: 'Annual target', changedBy: puneet._id },
  ]);

  // --- Dhillon Group (Shweta) — clawback scenario ---
  const dhillon = await SalesClient.create({ name: 'Dhillon Group Pty Ltd', entity: 'Company', contact: 'A Dhillon' });
  const dDhillon = await SalesDeal.create({
    clientId: dhillon._id,
    ownerId: shweta._id,
    type: 'new',
    service: 'Company + tax',
    stage: 'Cancelled / within retention',
    annualFeeCents: 1200000,
    eligibleNewCents: 1200000,
    rateSnapshot: 0.01,
    signedAt: '2026-08-10',
    paymentSetupCompletedAt: '2026-08-15',
    onboardingCompletedAt: '2026-08-20',
    activationDate: '2026-09-03',
    retentionDaysSnapshot: 183,
    retentionMaturityDate: addDays('2026-09-03', 183),
    firstYearMonthsSnapshot: 12,
    commissionWindowEndDate: '2027-09-02',
    billing: 'Monthly',
    cancelDate: '2027-01-31',
    cancelReason: 'client changed accountant',
  });

  const pay1 = await SalesPayment.create({
    dealId: dDhillon._id,
    reference: 'RCPT-D1-1',
    paidOn: '2026-09-03',
    grossCents: 100000,
    gstCents: 0,
    excludedCents: 0,
    eligibleNetCents: 100000,
    status: 'cleared',
    verified: true,
    verifiedBy: rohit._id,
    verifiedAt: new Date('2026-09-04'),
  });
  const pay2 = await SalesPayment.create({
    dealId: dDhillon._id,
    reference: 'RCPT-D1-2',
    paidOn: '2026-10-03',
    grossCents: 100000,
    gstCents: 0,
    excludedCents: 0,
    eligibleNetCents: 100000,
    status: 'cleared',
    verified: true,
    verifiedBy: rohit._id,
    verifiedAt: new Date('2026-10-04'),
  });

  // More Shweta deals for $40 net earned / $70 paid story
  const patel = await SalesClient.create({ name: 'Patel Investments Pty Ltd', entity: 'Advisory' });
  const dPatel = await SalesDeal.create({
    clientId: patel._id,
    ownerId: shweta._id,
    type: 'new',
    service: 'Advisory',
    stage: 'Active / Protected',
    annualFeeCents: 600000,
    eligibleNewCents: 600000,
    rateSnapshot: 0.01,
    signedAt: '2026-07-20',
    paymentSetupCompletedAt: '2026-07-25',
    onboardingCompletedAt: '2026-07-28',
    activationDate: '2026-08-10',
    retentionDaysSnapshot: 183,
    retentionMaturityDate: addDays('2026-08-10', 183),
    firstYearMonthsSnapshot: 12,
    commissionWindowEndDate: '2027-08-09',
    billing: 'Monthly',
  });
  const patelPays = [
    '2026-08-10',
    '2026-09-10',
    '2026-10-10',
    '2026-11-10',
    '2026-12-10',
  ];
  const patelPaymentDocs = [];
  for (let i = 0; i < patelPays.length; i++) {
    patelPaymentDocs.push(
      await SalesPayment.create({
        dealId: dPatel._id,
        reference: `RCPT-D7-${i + 1}`,
        paidOn: patelPays[i],
        grossCents: 100000,
        gstCents: 0,
        excludedCents: 0,
        eligibleNetCents: 100000,
        status: 'cleared',
        verified: true,
        verifiedBy: rohit._id,
        verifiedAt: new Date(patelPays[i]),
      })
    );
  }

  // Nishant deal
  const kaur = await SalesClient.create({ name: 'Kaur Medical Pty Ltd', entity: 'Company' });
  const dKaur = await SalesDeal.create({
    clientId: kaur._id,
    ownerId: nishant._id,
    type: 'new',
    service: 'Company + tax',
    stage: 'Active / At risk',
    annualFeeCents: 150000,
    eligibleNewCents: 150000,
    rateSnapshot: 0.01,
    signedAt: '2026-11-01',
    paymentSetupCompletedAt: '2026-11-05',
    onboardingCompletedAt: '2026-11-10',
    activationDate: '2026-11-17',
    retentionDaysSnapshot: 183,
    retentionMaturityDate: addDays('2026-11-17', 183),
    firstYearMonthsSnapshot: 12,
    commissionWindowEndDate: '2027-11-16',
  });
  const nishPay = await SalesPayment.create({
    dealId: dKaur._id,
    reference: 'RCPT-N1-1',
    paidOn: '2026-11-17',
    grossCents: 375000,
    gstCents: 0,
    excludedCents: 0,
    eligibleNetCents: 375000,
    status: 'cleared',
    verified: true,
    verifiedBy: rohit._id,
    verifiedAt: new Date('2026-11-17'),
  });

  // unused mahimaClient placeholder removed
  const dMahimaPending = await SalesDeal.create({
    clientId: kaur._id,
    ownerId: mahima._id,
    type: 'new',
    service: 'Company + tax',
    stage: 'Onboarding pending',
    annualFeeCents: 1200000,
    eligibleNewCents: 1200000,
    rateSnapshot: 0.01,
    signedAt: '2027-01-10',
    paymentSetupCompletedAt: '2027-01-15',
    billing: 'Monthly',
  });
  await SalesPayment.create({
    dealId: dMahimaPending._id,
    reference: 'RCPT-D5-1',
    paidOn: '2027-01-22',
    grossCents: 100000,
    gstCents: 0,
    excludedCents: 0,
    eligibleNetCents: 100000,
    status: 'cleared',
    verified: false,
  });

  // Mahima signed deals for target-qualified $8500
  const mClient = await SalesClient.create({ name: 'Singh Holdings Pty Ltd' });
  await SalesDeal.create({
    clientId: mClient._id,
    ownerId: mahima._id,
    type: 'new',
    service: 'Company',
    stage: 'Won',
    annualFeeCents: 850000,
    eligibleNewCents: 850000,
    rateSnapshot: 0.01,
    signedAt: '2026-10-01',
    billing: 'Monthly',
  });

  // Q2 locked batch
  const batch = await SalesPayoutBatch.create({
    period: '2026-27-Q2',
    label: 'Q2 Oct–Dec 2026',
    cutoffDate: '2026-12-31',
    frequency: 'quarterly',
    state: 'locked',
    fxRate: 65,
    createdBy: puneet._id,
    reviewedBy: puneet._id,
    approvedBy: puneet._id,
    paidBy: puneet._id,
    paidAt: '2027-01-05',
    payrollRef: 'PAYRUN-2026Q2-0105',
  });

  // Ledger credits for Patel (5×$10) + Dhillon (2×$10) paid in Q2, then clawback −$20
  for (const p of [pay1, pay2, ...patelPaymentDocs]) {
    await SalesLedgerEntry.create({
      dealId: p.dealId,
      paymentId: p._id,
      userId: shweta._id,
      kind: 'credit',
      amountCents: 1000,
      rate: 0.01,
      note: `Verified ${p.reference}`,
      batchId: batch._id,
      paid: true,
      paidAt: '2027-01-05',
      ts: p.paidOn,
      eligibleAt: p.paidOn,
    });
  }

  // Nishant credit — at risk, unbatched
  await SalesLedgerEntry.create({
    dealId: dKaur._id,
    paymentId: nishPay._id,
    userId: nishant._id,
    kind: 'credit',
    amountCents: 750,
    rate: 0.01,
    note: `Verified ${nishPay.reference}`,
    ts: '2026-11-17',
    eligibleAt: '2026-11-17',
  });

  // Additional Shweta credits after Q2 (unbatched) for $40 net: paid 70, clawback -20, later + something
  // Net earned = credits - reversals. Screenshot: net $40, paid $70, clawback $30.
  // So: paid credits $70, clawback outstanding $30, plus later credits $20? 
  // net = 70 - 20 clawback posted + more? If clawback is -$20 on ledger and unpaid credits $20 → net 70-20+? 
  // Screenshot balance ends $40. Let's add refund reversal -$10 and keep clawback -$20: 70 - 20 - 10 = 40.
  await SalesLedgerEntry.create({
    dealId: dDhillon._id,
    userId: shweta._id,
    kind: 'clawback',
    amountCents: -2000,
    note: 'Retention clawback (client changed accountant)',
    ts: '2027-01-31',
    eligibleAt: '2027-01-31',
  });
  await SalesLedgerEntry.create({
    dealId: dPatel._id,
    userId: shweta._id,
    kind: 'refund',
    amountCents: -1000,
    note: 'Refund reversal',
    ts: '2027-01-20',
    eligibleAt: '2027-01-20',
  });

  await SalesClawbackCase.create({
    dealId: dDhillon._id,
    userId: shweta._id,
    activationDate: '2026-09-03',
    maturityDate: dDhillon.retentionMaturityDate,
    cancelDate: '2027-01-31',
    daysRetained: 150,
    reason: 'client changed accountant',
    accruedCents: 2000,
    paidCents: 2000,
    clawbackCents: 2000,
    recoveredCents: 0,
    waivedCents: 0,
    outstandingCents: 2000,
    status: 'Recovering',
  });
  // Extra $10 outstanding visual from screenshot ($30) — bump outstanding for display consistency
  await SalesClawbackCase.findOneAndUpdate(
    { dealId: dDhillon._id },
    { clawbackCents: 3000, outstandingCents: 3000, accruedCents: 3000, paidCents: 3000 }
  );

  await SalesPayoutItem.create({
    batchId: batch._id,
    userId: shweta._id,
    openingCents: 0,
    earnCents: 7000,
    clawbackCents: 0,
    netCents: 7000,
    carryCents: 0,
    inrAmount: ENG.inrSnapshot(7000, 65),
  });

  await SalesCommissionQuery.create({
    userId: shweta._id,
    dealId: dDhillon._id,
    clientName: 'Dhillon Group Pty Ltd',
    status: 'Open',
    messages: [
      {
        authorId: shweta._id,
        authorName: 'Shweta Sharma',
        body: 'Why has a clawback appeared on Dhillon Group? The client left because of a service issue, not a sales issue.',
        at: '2027-02-01',
      },
    ],
    unreadForAdmin: true,
    unreadForStaff: false,
  });

  await SalesAuditLog.create({
    actorId: null,
    actorName: 'system',
    action: 'Demo data seeded',
    entity: 'system',
    detail: 'Schema v2 — FY 2026-27',
    ts: '2027-02-10',
  });
  await SalesAuditLog.create({
    actorId: puneet._id,
    actorName: 'Puneet Nanak (admin)',
    action: 'Payout batch paid & locked',
    entity: `batch ${batch._id}`,
    detail: 'Q2 Oct–Dec 2026',
    ts: '2027-01-05',
  });

  console.log('Seed complete.');
  console.log('Logins (password: ' + DEFAULT_PASSWORD + '):');
  console.log('  Admin:  puneet@nanakaccountants.com.au');
  console.log('  Manager: rohit@nanakaccountants.com.au');
  console.log('  Staff:  shweta@nanakaccountants.com.au / mahima@... / nishant@...');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
